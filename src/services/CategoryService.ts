import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import {
  db,
  secondaryDb,
  handleFirestoreError,
  OperationType,
  sanitizeForFirestore,
} from '../firebase';
import { INITIAL_CATEGORIES } from '../data/mockData';
import { Category } from '../types';

const CATEGORIES_STORAGE_KEY = 'eksho_rokom_categories_v1';
const CATEGORIES_COLLECTION = 'categories';

export interface ICategoryService {
  getCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | null>;
  addCategory?(category: Omit<Category, 'id'>): Promise<Category>;
  updateCategory?(id: string, updates: Partial<Category>): Promise<Category | null>;
  deleteCategory?(id: string): Promise<boolean>;
}

class FirebaseCategoryService implements ICategoryService {
  private categories: Category[] = [...INITIAL_CATEGORIES];
  private isListening = false;
  private isSeeding = false;

  constructor() {
    this.initStorage();
    if (typeof window !== 'undefined') {
      this.setupRealtimeSync();
    }
  }

  private initStorage() {
    try {
      const stored = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.categories = parsed;
          return;
        }
      }
      this.categories = [...INITIAL_CATEGORIES];
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(this.categories));
    } catch {
      this.categories = [...INITIAL_CATEGORIES];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(this.categories));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('categories-updated'));
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
        query(collection(db, CATEGORIES_COLLECTION), where('id', '>=', '')),
        async snapshot => {
          if (snapshot.empty) {
            if (!this.isSeeding) {
              this.isSeeding = true;
              for (const cat of this.categories) {
                await this.writeCategoryToFirestore(cat);
              }
              this.isSeeding = false;
            }
            return;
          }

          const remoteCategories: Category[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data() as Category;
            if (data && data.id) {
              remoteCategories.push(data);
            }
          });

          if (remoteCategories.length > 0) {
            remoteCategories.sort((a, b) => a.displayOrder - b.displayOrder);
            this.categories = remoteCategories;
            this.saveToStorage();
          }
        },
        error => {
          handleFirestoreError(error, OperationType.LIST, CATEGORIES_COLLECTION);
        }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, CATEGORIES_COLLECTION);
    }
  }

  private async writeCategoryToFirestore(category: Category) {
    const cleanData = sanitizeForFirestore({
      ...category,
      name: category.name.slice(0, 200),
      description: (category.description || '').slice(0, 1000),
      image: (category.image || '').slice(0, 500000),
    });

    try {
      await setDoc(doc(db, CATEGORIES_COLLECTION, category.id), cleanData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${CATEGORIES_COLLECTION}/${category.id}`);
    }

    try {
      await setDoc(doc(secondaryDb, CATEGORIES_COLLECTION, category.id), cleanData);
    } catch {
      // Optional secondary project sync
    }
  }

  async getCategories(): Promise<Category[]> {
    return this.categories
      .filter(c => c.active)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getCategoryById(id: string): Promise<Category | null> {
    const found = this.categories.find(c => c.id === id);
    return found || null;
  }

  async addCategory(newCat: Omit<Category, 'id'>): Promise<Category> {
    const id = `cat-${Date.now()}`;
    const category: Category = { ...newCat, id };
    this.categories.push(category);
    this.saveToStorage();
    await this.writeCategoryToFirestore(category);
    return category;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    const index = this.categories.findIndex(c => c.id === id);
    if (index === -1) return null;
    this.categories[index] = { ...this.categories[index], ...updates };
    this.saveToStorage();
    await this.writeCategoryToFirestore(this.categories[index]);
    return this.categories[index];
  }

  async deleteCategory(id: string): Promise<boolean> {
    const index = this.categories.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.categories.splice(index, 1);
    this.saveToStorage();
    try {
      await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${CATEGORIES_COLLECTION}/${id}`);
    }
    try {
      await deleteDoc(doc(secondaryDb, CATEGORIES_COLLECTION, id));
    } catch {
      // Optional secondary project sync
    }
    return true;
  }
}

export const categoryService: ICategoryService = new FirebaseCategoryService();
