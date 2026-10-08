import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import {
  db,
  secondaryDb,
  handleFirestoreError,
  OperationType,
  sanitizeForFirestore,
} from '../firebase';
import { INITIAL_FOOTER_SECTIONS } from '../data/mockData';
import { FooterSectionItem } from '../types';

const FOOTER_STORAGE_KEY = 'eksho_rokom_footer_sections';
const ANNOUNCEMENT_STORAGE_KEY = 'eksho_rokom_announcement_text';
const SETTINGS_COLLECTION = 'settings';
const FOOTER_DOC_ID = 'footer_config';
const DEFAULT_ANNOUNCEMENT_TEXT =
  'Craft Materials & DIY Supplies for Miniature Making · Nationwide Home Delivery Across Bangladesh';

export interface IFooterService {
  getFooterSections(): Promise<FooterSectionItem[]>;
  updateFooterSection(
    id: FooterSectionItem['id'],
    updates: { title?: string; content?: string }
  ): Promise<FooterSectionItem[]>;
  getAnnouncementText(): Promise<string>;
  updateAnnouncementText(text: string): Promise<string>;
}

class FirebaseFooterService implements IFooterService {
  private sections: FooterSectionItem[] = [];
  private announcementText: string = DEFAULT_ANNOUNCEMENT_TEXT;
  private isListening = false;

  constructor() {
    this.initStorage();
    if (typeof window !== 'undefined') {
      this.setupRealtimeSync();
    }
  }

  private initStorage() {
    try {
      const stored = localStorage.getItem(FOOTER_STORAGE_KEY);
      if (stored) {
        this.sections = JSON.parse(stored);
      } else {
        this.sections = [...INITIAL_FOOTER_SECTIONS];
        localStorage.setItem(FOOTER_STORAGE_KEY, JSON.stringify(this.sections));
      }

      const storedAnnouncement = localStorage.getItem(ANNOUNCEMENT_STORAGE_KEY);
      if (storedAnnouncement && storedAnnouncement.trim()) {
        this.announcementText = storedAnnouncement;
      } else {
        this.announcementText = DEFAULT_ANNOUNCEMENT_TEXT;
        localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, this.announcementText);
      }
    } catch {
      this.sections = [...INITIAL_FOOTER_SECTIONS];
      this.announcementText = DEFAULT_ANNOUNCEMENT_TEXT;
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(FOOTER_STORAGE_KEY, JSON.stringify(this.sections));
      localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, this.announcementText);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('footer-sections-updated'));
      }
    } catch {
      // ignore
    }
  }

  private setupRealtimeSync() {
    if (this.isListening) return;
    this.isListening = true;

    try {
      onSnapshot(
        doc(db, SETTINGS_COLLECTION, FOOTER_DOC_ID),
        docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data) {
              if (Array.isArray(data.sections) && data.sections.length > 0) {
                this.sections = data.sections;
              }
              if (typeof data.announcementText === 'string' && data.announcementText.trim()) {
                this.announcementText = data.announcementText;
              }
              this.saveToStorage();
            }
          } else {
            this.writeToFirestore();
          }
        },
        error => {
          handleFirestoreError(
            error,
            OperationType.GET,
            `${SETTINGS_COLLECTION}/${FOOTER_DOC_ID}`
          );
        }
      );
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.GET,
        `${SETTINGS_COLLECTION}/${FOOTER_DOC_ID}`
      );
    }
  }

  private async writeToFirestore() {
    const payload = sanitizeForFirestore({
      id: FOOTER_DOC_ID,
      sections: this.sections,
      announcementText: this.announcementText,
      updatedAt: new Date().toISOString(),
    });
    try {
      await setDoc(doc(db, SETTINGS_COLLECTION, FOOTER_DOC_ID), payload);
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.WRITE,
        `${SETTINGS_COLLECTION}/${FOOTER_DOC_ID}`
      );
    }
    try {
      await setDoc(doc(secondaryDb, SETTINGS_COLLECTION, FOOTER_DOC_ID), payload);
    } catch {
      // Optional secondary project sync
    }
  }

  async getFooterSections(): Promise<FooterSectionItem[]> {
    return [...this.sections];
  }

  async updateFooterSection(
    id: FooterSectionItem['id'],
    updates: { title?: string; content?: string }
  ): Promise<FooterSectionItem[]> {
    this.sections = this.sections.map(sec =>
      sec.id === id ? { ...sec, ...updates } : sec
    );
    this.saveToStorage();
    await this.writeToFirestore();
    return [...this.sections];
  }

  async getAnnouncementText(): Promise<string> {
    return this.announcementText;
  }

  async updateAnnouncementText(text: string): Promise<string> {
    this.announcementText = text.trim() || DEFAULT_ANNOUNCEMENT_TEXT;
    this.saveToStorage();
    await this.writeToFirestore();
    return this.announcementText;
  }
}

export const footerService: IFooterService = new FirebaseFooterService();
