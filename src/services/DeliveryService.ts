import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import {
  db,
  secondaryDb,
  handleFirestoreError,
  OperationType,
  sanitizeForFirestore,
} from '../firebase';
import { INITIAL_DELIVERY_AREA_RULES } from '../data/mockData';
import { DeliveryAreaRule, DeliveryAreaType, CartItem } from '../types';
import { productService } from './ProductService';

const DELIVERY_RULES_STORAGE_KEY = 'eksho_rokom_delivery_rules_v1';
const SETTINGS_COLLECTION = 'settings';
const DELIVERY_DOC_ID = 'delivery_rules';

export interface IDeliveryService {
  getAreaRules(): Promise<DeliveryAreaRule[]>;
  updateAreaRule(
    id: string,
    updates: Partial<Pick<DeliveryAreaRule, 'baseChargeUpTo1Kg' | 'additionalPerKgCharge'>>
  ): Promise<DeliveryAreaRule[]>;
  calculateDeliveryCharge(
    area: DeliveryAreaType,
    items: { productId: string; quantity: number }[] | CartItem[]
  ): Promise<number>;
  calculateInternalTotalWeightKg(
    items: { productId: string; quantity: number }[] | CartItem[]
  ): Promise<number>;
}

class FirebaseDeliveryService implements IDeliveryService {
  private areaRules: DeliveryAreaRule[] = [...INITIAL_DELIVERY_AREA_RULES];
  private isListening = false;

  constructor() {
    this.initStorage();
    if (typeof window !== 'undefined') {
      this.setupRealtimeSync();
    }
  }

  private initStorage() {
    try {
      const stored = localStorage.getItem(DELIVERY_RULES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.areaRules = parsed;
          return;
        }
      }
      this.areaRules = [...INITIAL_DELIVERY_AREA_RULES];
      localStorage.setItem(DELIVERY_RULES_STORAGE_KEY, JSON.stringify(this.areaRules));
    } catch {
      this.areaRules = [...INITIAL_DELIVERY_AREA_RULES];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(DELIVERY_RULES_STORAGE_KEY, JSON.stringify(this.areaRules));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('delivery-rules-updated'));
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
        doc(db, SETTINGS_COLLECTION, DELIVERY_DOC_ID),
        docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && Array.isArray(data.areaRules) && data.areaRules.length > 0) {
              this.areaRules = data.areaRules;
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
            `${SETTINGS_COLLECTION}/${DELIVERY_DOC_ID}`
          );
        }
      );
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.GET,
        `${SETTINGS_COLLECTION}/${DELIVERY_DOC_ID}`
      );
    }
  }

  private async writeToFirestore() {
    const payload = sanitizeForFirestore({
      id: DELIVERY_DOC_ID,
      areaRules: this.areaRules,
      updatedAt: new Date().toISOString(),
    });
    try {
      await setDoc(doc(db, SETTINGS_COLLECTION, DELIVERY_DOC_ID), payload);
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.WRITE,
        `${SETTINGS_COLLECTION}/${DELIVERY_DOC_ID}`
      );
    }
    try {
      await setDoc(doc(secondaryDb, SETTINGS_COLLECTION, DELIVERY_DOC_ID), payload);
    } catch {
      // Optional secondary project sync
    }
  }

  async getAreaRules(): Promise<DeliveryAreaRule[]> {
    return [...this.areaRules];
  }

  async updateAreaRule(
    id: string,
    updates: Partial<Pick<DeliveryAreaRule, 'baseChargeUpTo1Kg' | 'additionalPerKgCharge'>>
  ): Promise<DeliveryAreaRule[]> {
    this.areaRules = this.areaRules.map(r => (r.id === id ? { ...r, ...updates } : r));
    this.saveToStorage();
    await this.writeToFirestore();
    return [...this.areaRules];
  }

  async calculateInternalTotalWeightKg(
    items: { productId: string; quantity: number }[] | CartItem[]
  ): Promise<number> {
    if (!items || items.length === 0) return 0;

    let totalWeightGrams = 0;

    for (const item of items) {
      let weightGrams = 0;
      if ('product' in item && item.product && item.product.weight !== undefined) {
        weightGrams =
          item.product.weightUnit === 'kg'
            ? item.product.weight * 1000
            : item.product.weight;
      } else {
        const prod = await productService.getProductById(item.productId);
        if (prod) {
          weightGrams =
            prod.weightUnit === 'kg' ? prod.weight * 1000 : prod.weight;
        }
      }
      totalWeightGrams += weightGrams * item.quantity;
    }

    return Math.max(0, totalWeightGrams / 1000);
  }

  async calculateDeliveryCharge(
    area: DeliveryAreaType,
    items: { productId: string; quantity: number }[] | CartItem[]
  ): Promise<number> {
    if (!items || items.length === 0) return 0;

    const rule =
      this.areaRules.find(r => r.name === area) || this.areaRules[0];

    const totalWeightKg = await this.calculateInternalTotalWeightKg(items);

    const additionalStartedKg =
      totalWeightKg > 1 ? Math.ceil(totalWeightKg - 1) : 0;

    return (
      rule.baseChargeUpTo1Kg +
      additionalStartedKg * rule.additionalPerKgCharge
    );
  }
}

export const deliveryService: IDeliveryService = new FirebaseDeliveryService();
