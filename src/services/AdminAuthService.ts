import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import {
  db,
  secondaryDb,
  handleFirestoreError,
  OperationType,
  sanitizeForFirestore,
} from '../firebase';

const ADMIN_SESSION_STORAGE_KEY = 'eksho_rokom_admin_auth_session_v1';
const ADMIN_CREDENTIALS_STORAGE_KEY = 'eksho_rokom_admin_credentials_v1';
const SETTINGS_COLLECTION = 'settings';
const ADMIN_CREDS_DOC_ID = 'admin_credentials';

export interface AdminUserSession {
  email: string;
  name: string;
  role: 'Owner / Sales Manager';
  authenticatedAt: string;
}

interface StoredAdminCredentials {
  email: string;
  password: string;
  name: string;
}

const DEFAULT_ADMIN_CREDENTIALS: StoredAdminCredentials = {
  email: 'admin@ekshorokom.com',
  password: 'admin123',
  name: 'Eksho Rokom Admin',
};

class AdminAuthService {
  private isListening = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupRealtimeSync();
    }
  }

  private setupRealtimeSync() {
    if (this.isListening) return;
    this.isListening = true;

    try {
      onSnapshot(
        doc(db, SETTINGS_COLLECTION, ADMIN_CREDS_DOC_ID),
        docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && data.email && data.password) {
              const creds: StoredAdminCredentials = {
                email: data.email,
                password: data.password,
                name: data.name || DEFAULT_ADMIN_CREDENTIALS.name,
              };
              try {
                localStorage.setItem(ADMIN_CREDENTIALS_STORAGE_KEY, JSON.stringify(creds));
              } catch {
                // ignore
              }
            }
          } else {
            this.writeCredentialsToFirestore(this.getCredentials());
          }
        },
        error => {
          handleFirestoreError(
            error,
            OperationType.GET,
            `${SETTINGS_COLLECTION}/${ADMIN_CREDS_DOC_ID}`
          );
        }
      );
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.GET,
        `${SETTINGS_COLLECTION}/${ADMIN_CREDS_DOC_ID}`
      );
    }
  }

  private async writeCredentialsToFirestore(creds: StoredAdminCredentials) {
    const payload = sanitizeForFirestore({
      id: ADMIN_CREDS_DOC_ID,
      email: creds.email,
      password: creds.password,
      name: creds.name,
      updatedAt: new Date().toISOString(),
    });
    try {
      await setDoc(doc(db, SETTINGS_COLLECTION, ADMIN_CREDS_DOC_ID), payload);
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.WRITE,
        `${SETTINGS_COLLECTION}/${ADMIN_CREDS_DOC_ID}`
      );
    }
    try {
      await setDoc(doc(secondaryDb, SETTINGS_COLLECTION, ADMIN_CREDS_DOC_ID), payload);
    } catch {
      // Optional secondary project sync
    }
  }

  private getCredentials(): StoredAdminCredentials {
    try {
      const raw = localStorage.getItem(ADMIN_CREDENTIALS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.email && parsed.password) {
          return parsed;
        }
      }
      localStorage.setItem(
        ADMIN_CREDENTIALS_STORAGE_KEY,
        JSON.stringify(DEFAULT_ADMIN_CREDENTIALS)
      );
      return DEFAULT_ADMIN_CREDENTIALS;
    } catch {
      return DEFAULT_ADMIN_CREDENTIALS;
    }
  }

  getCurrentSession(): AdminUserSession | null {
    try {
      const raw = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.email && parsed.authenticatedAt) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  login(identifier: string, password: string): { ok: boolean; session?: AdminUserSession; error?: string } {
    const creds = this.getCredentials();
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    const validIdentifier =
      cleanId === creds.email.toLowerCase() ||
      cleanId === 'admin' ||
      cleanId === 'ekshorokom';

    if (!validIdentifier || cleanPass !== creds.password) {
      return {
        ok: false,
        error: 'Invalid admin email/username or password.',
      };
    }

    const session: AdminUserSession = {
      email: creds.email,
      name: creds.name,
      role: 'Owner / Sales Manager',
      authenticatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // ignore
    }

    return { ok: true, session };
  }

  updateCredentials(newEmail: string, newPassword: string, newName?: string): boolean {
    const current = this.getCredentials();
    const updated: StoredAdminCredentials = {
      email: newEmail.trim() || current.email,
      password: newPassword.trim() || current.password,
      name: (newName || current.name).trim() || current.name,
    };
    try {
      localStorage.setItem(ADMIN_CREDENTIALS_STORAGE_KEY, JSON.stringify(updated));
      const existingSession = this.getCurrentSession();
      if (existingSession) {
        const nextSession: AdminUserSession = {
          ...existingSession,
          email: updated.email,
          name: updated.name,
        };
        localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(nextSession));
      }
      this.writeCredentialsToFirestore(updated);
      return true;
    } catch {
      return false;
    }
  }

  logout(): void {
    try {
      localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

export const adminAuthService = new AdminAuthService();
