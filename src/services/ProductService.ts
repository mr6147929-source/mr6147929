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
import { INITIAL_PRODUCTS } from '../data/mockData';
import { Product } from '../types';

const PRODUCTS_STORAGE_KEY = 'eksho_rokom_products_v1';
const PRODUCTS_COLLECTION = 'products';

export interface ProductFilterOptions {
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'name_asc' | 'newest';
  featured?: boolean;
}

export interface IProductService {
  getProducts(filter?: ProductFilterOptions): Promise<Product[]>;
  getAllAdminProducts(): Promise<Product[]>;
  getProductById(id: string): Promise<Product | null>;
  getFeaturedProducts(): Promise<Product[]>;
  getRelatedProducts(productId: string, categoryId: string, limit?: number): Promise<Product[]>;
  addProduct(
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Product>;
  updateProduct(
    id: string,
    updates: Partial<
      Pick<
        Product,
        | 'name'
        | 'nameBn'
        | 'description'
        | 'categoryId'
        | 'images'
        | 'sellingPrice'
        | 'originalPrice'
        | 'stock'
        | 'weight'
        | 'weightUnit'
        | 'featured'
        | 'active'
        | 'variants'
      >
    >
  ): Promise<Product | null>;
  deleteProduct(id: string): Promise<boolean>;
}

class FirebaseProductService implements IProductService {
  private products: Product[] = [];
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
      const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.products = parsed;
          return;
        }
      }
      this.products = [...INITIAL_PRODUCTS];
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(this.products));
    } catch {
      this.products = [...INITIAL_PRODUCTS];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(this.products));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('products-updated'));
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
        query(collection(db, PRODUCTS_COLLECTION), where('id', '>=', '')),
        async snapshot => {
          if (snapshot.empty) {
            if (!this.isSeeding) {
              this.isSeeding = true;
              await this.seedInitialProductsToFirestore();
              this.isSeeding = false;
            }
            return;
          }

          const remoteProducts: Product[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data() as Product;
            if (data && data.id) {
              remoteProducts.push(data);
            }
          });

          if (remoteProducts.length > 0) {
            remoteProducts.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            this.products = remoteProducts;
            this.saveToStorage();
          }
        },
        error => {
          handleFirestoreError(error, OperationType.LIST, PRODUCTS_COLLECTION);
        }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, PRODUCTS_COLLECTION);
    }
  }

  private async seedInitialProductsToFirestore() {
    const itemsToSeed = this.products.length > 0 ? this.products : [...INITIAL_PRODUCTS];
    for (const prod of itemsToSeed) {
      await this.writeProductToFirestore(prod);
    }
  }

  private async writeProductToFirestore(product: Product) {
    const cleanData = sanitizeForFirestore({
      ...product,
      name: product.name.slice(0, 300),
      description: (product.description || '').slice(0, 5000),
      categoryId: (product.categoryId || 'cat-sheets').slice(0, 128),
      images: (product.images || []).slice(0, 20),
    });

    try {
      await setDoc(doc(db, PRODUCTS_COLLECTION, product.id), cleanData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${PRODUCTS_COLLECTION}/${product.id}`);
    }

    try {
      await setDoc(doc(secondaryDb, PRODUCTS_COLLECTION, product.id), cleanData);
    } catch {
      // Optional secondary project sync
    }
  }

  private async ensureSyncedFromRemoteIfNeeded() {
    if (this.products.length === 0) {
      this.initStorage();
    }
  }

  async getAllAdminProducts(): Promise<Product[]> {
    await this.ensureSyncedFromRemoteIfNeeded();
    return [...this.products];
  }

  async getProducts(filter?: ProductFilterOptions): Promise<Product[]> {
    await this.ensureSyncedFromRemoteIfNeeded();
    let result = this.products.filter(p => p.active);

    if (filter) {
      if (filter.categoryId && filter.categoryId !== 'all') {
        result = result.filter(p => p.categoryId === filter.categoryId);
      }

      if (filter.search && filter.search.trim()) {
        const query = filter.search.toLowerCase().trim();
        result = result.filter(
          p =>
            p.name.toLowerCase().includes(query) ||
            (p.nameBn && p.nameBn.includes(query)) ||
            p.description.toLowerCase().includes(query)
        );
      }

      if (filter.minPrice !== undefined) {
        result = result.filter(p => p.sellingPrice >= (filter.minPrice || 0));
      }

      if (filter.maxPrice !== undefined) {
        result = result.filter(p => p.sellingPrice <= (filter.maxPrice || Infinity));
      }

      if (filter.featured !== undefined) {
        result = result.filter(p => p.featured === filter.featured);
      }

      if (filter.sort) {
        switch (filter.sort) {
          case 'price_asc':
            result.sort((a, b) => a.sellingPrice - b.sellingPrice);
            break;
          case 'price_desc':
            result.sort((a, b) => b.sellingPrice - a.sellingPrice);
            break;
          case 'name_asc':
            result.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case 'newest':
            result.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            break;
        }
      }
    }

    return result;
  }

  async getProductById(id: string): Promise<Product | null> {
    await this.ensureSyncedFromRemoteIfNeeded();
    const item = this.products.find(p => p.id === id);
    return item ? { ...item } : null;
  }

  async getFeaturedProducts(): Promise<Product[]> {
    await this.ensureSyncedFromRemoteIfNeeded();
    return this.products.filter(p => p.active && p.featured);
  }

  async getRelatedProducts(productId: string, categoryId: string, limit = 4): Promise<Product[]> {
    await this.ensureSyncedFromRemoteIfNeeded();
    return this.products
      .filter(p => p.active && p.id !== productId && p.categoryId === categoryId)
      .slice(0, limit);
  }

  async addProduct(
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Product> {
    await this.ensureSyncedFromRemoteIfNeeded();
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: now,
      updatedAt: now,
    };
    this.products.unshift(newProduct);
    this.saveToStorage();
    await this.writeProductToFirestore(newProduct);
    return newProduct;
  }

  async updateProduct(
    id: string,
    updates: Partial<
      Pick<
        Product,
        | 'name'
        | 'nameBn'
        | 'description'
        | 'categoryId'
        | 'images'
        | 'sellingPrice'
        | 'originalPrice'
        | 'stock'
        | 'weight'
        | 'weightUnit'
        | 'featured'
        | 'active'
        | 'variants'
      >
    >
  ): Promise<Product | null> {
    await this.ensureSyncedFromRemoteIfNeeded();
    let updatedItem: Product | null = null;
    this.products = this.products.map(p => {
      if (p.id === id) {
        updatedItem = {
          ...p,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        return updatedItem;
      }
      return p;
    });
    this.saveToStorage();
    if (updatedItem) {
      await this.writeProductToFirestore(updatedItem);
    }
    return updatedItem;
  }

  async deleteProduct(id: string): Promise<boolean> {
    await this.ensureSyncedFromRemoteIfNeeded();
    const prevLen = this.products.length;
    this.products = this.products.filter(p => p.id !== id);
    if (this.products.length !== prevLen) {
      this.saveToStorage();
      try {
        await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${PRODUCTS_COLLECTION}/${id}`);
      }
      try {
        await deleteDoc(doc(secondaryDb, PRODUCTS_COLLECTION, id));
      } catch {
        // Optional secondary project sync
      }
      return true;
    }
    return false;
  }
}

export const productService: IProductService = new FirebaseProductService();
