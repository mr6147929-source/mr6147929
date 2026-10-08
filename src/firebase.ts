import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import appletFirebaseConfig from '../firebase-applet-config.json';

// Primary Firebase configuration (Provisioned AI Studio Cloud Firestore)
export const app = initializeApp(appletFirebaseConfig);
export const db = getFirestore(app, appletFirebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Secondary Firebase configuration for the user's 'eksho-rokom' Firebase project (if enabled in user's console)
export const ekshoRokomFirebaseConfig = {
  apiKey: 'AIzaSyDcoV1L7fN_csGQ024o4RvJqQRhcDxBgCQ',
  authDomain: 'eksho-rokom.firebaseapp.com',
  projectId: 'eksho-rokom',
  storageBucket: 'eksho-rokom.firebasestorage.app',
  messagingSenderId: '959558249450',
  appId: '1:959558249450:web:df6f25aafb20d3c919e093',
  measurementId: 'G-3K9DGXKPW3',
};

export const secondaryApp = initializeApp(ekshoRokomFirebaseConfig, 'eksho-rokom-secondary');
export const secondaryDb = getFirestore(secondaryApp);

// Initialize Analytics safely in browser environments
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported()
    .then(supported => {
      if (supported) {
        analytics = getAnalytics(secondaryApp);
      }
    })
    .catch(() => {
      // Analytics not supported in current environment
    });
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (value !== undefined) {
        result[key] = sanitizeForFirestore(value);
      }
    }
    return result as T;
  }
  return obj;
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'settings', 'connection_test'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

if (typeof window !== 'undefined') {
  testConnection();
}

