import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import {
  db,
  secondaryDb,
  handleFirestoreError,
  OperationType,
  sanitizeForFirestore,
} from '../firebase';
import { INITIAL_PAYMENT_CONFIG } from '../data/mockData';
import { PaymentConfig, PaymentNumberItem, PaymentStatus } from '../types';

const PAYMENT_CONFIG_STORAGE_KEY = 'eksho_rokom_payment_config_v2';
const SETTINGS_COLLECTION = 'settings';
const PAYMENT_DOC_ID = 'payment_config';

export interface PaymentBreakdown {
  itemsSubtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  advanceAmountRequired: number; // Always equals deliveryCharge
  remainingAmountDue: number; // Always equals itemsSubtotal
  paymentStatus: PaymentStatus;
}

export interface IPaymentService {
  getPaymentConfig(): Promise<PaymentConfig>;
  getActivePaymentNumbers(): Promise<PaymentNumberItem[]>;
  addPaymentNumber(number: string, label?: string): Promise<PaymentNumberItem[]>;
  updatePaymentNumber(
    id: string,
    updates: { number?: string; label?: string; enabled?: boolean }
  ): Promise<PaymentNumberItem[]>;
  deletePaymentNumber(id: string): Promise<PaymentNumberItem[]>;
  calculatePaymentBreakdown(
    subtotal: number,
    deliveryCharge: number
  ): Promise<PaymentBreakdown>;
}

class FirebasePaymentService implements IPaymentService {
  private config: PaymentConfig = { ...INITIAL_PAYMENT_CONFIG };
  private isListening = false;

  constructor() {
    this.initStorage();
    if (typeof window !== 'undefined') {
      this.setupRealtimeSync();
    }
  }

  private initStorage() {
    try {
      const stored = localStorage.getItem(PAYMENT_CONFIG_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.paymentNumbers) && parsed.paymentNumbers.length > 0) {
          this.config = parsed;
          return;
        }
      }
      this.config = {
        paymentNumbers: [...INITIAL_PAYMENT_CONFIG.paymentNumbers],
        instructions: INITIAL_PAYMENT_CONFIG.instructions,
      };
      localStorage.setItem(PAYMENT_CONFIG_STORAGE_KEY, JSON.stringify(this.config));
    } catch {
      this.config = {
        paymentNumbers: [...INITIAL_PAYMENT_CONFIG.paymentNumbers],
        instructions: INITIAL_PAYMENT_CONFIG.instructions,
      };
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(PAYMENT_CONFIG_STORAGE_KEY, JSON.stringify(this.config));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('payment-config-updated'));
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
        doc(db, SETTINGS_COLLECTION, PAYMENT_DOC_ID),
        docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && Array.isArray(data.paymentNumbers)) {
              this.config = {
                paymentNumbers: data.paymentNumbers,
                instructions: data.instructions || INITIAL_PAYMENT_CONFIG.instructions,
              };
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
            `${SETTINGS_COLLECTION}/${PAYMENT_DOC_ID}`
          );
        }
      );
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.GET,
        `${SETTINGS_COLLECTION}/${PAYMENT_DOC_ID}`
      );
    }
  }

  private async writeToFirestore() {
    const payload = sanitizeForFirestore({
      id: PAYMENT_DOC_ID,
      paymentNumbers: this.config.paymentNumbers,
      instructions: this.config.instructions,
      updatedAt: new Date().toISOString(),
    });
    try {
      await setDoc(doc(db, SETTINGS_COLLECTION, PAYMENT_DOC_ID), payload);
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.WRITE,
        `${SETTINGS_COLLECTION}/${PAYMENT_DOC_ID}`
      );
    }
    try {
      await setDoc(doc(secondaryDb, SETTINGS_COLLECTION, PAYMENT_DOC_ID), payload);
    } catch {
      // Optional secondary project sync
    }
  }

  async getPaymentConfig(): Promise<PaymentConfig> {
    return {
      ...this.config,
      paymentNumbers: [...this.config.paymentNumbers],
    };
  }

  async getActivePaymentNumbers(): Promise<PaymentNumberItem[]> {
    return this.config.paymentNumbers.filter(p => p.enabled);
  }

  async addPaymentNumber(
    number: string,
    label = 'bKash / Nagad / Rocket (Send Money)'
  ): Promise<PaymentNumberItem[]> {
    const cleanNum = number.trim();
    if (!cleanNum) return [...this.config.paymentNumbers];

    const newItem: PaymentNumberItem = {
      id: `pay-num-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      number: cleanNum,
      label: label.trim() || 'bKash / Nagad / Rocket (Send Money)',
      enabled: true,
    };
    this.config.paymentNumbers = [...this.config.paymentNumbers, newItem];
    this.saveToStorage();
    await this.writeToFirestore();
    return [...this.config.paymentNumbers];
  }

  async updatePaymentNumber(
    id: string,
    updates: { number?: string; label?: string; enabled?: boolean }
  ): Promise<PaymentNumberItem[]> {
    this.config.paymentNumbers = this.config.paymentNumbers.map(item =>
      item.id === id ? { ...item, ...updates } : item
    );
    this.saveToStorage();
    await this.writeToFirestore();
    return [...this.config.paymentNumbers];
  }

  async deletePaymentNumber(id: string): Promise<PaymentNumberItem[]> {
    this.config.paymentNumbers = this.config.paymentNumbers.filter(item => item.id !== id);
    this.saveToStorage();
    await this.writeToFirestore();
    return [...this.config.paymentNumbers];
  }

  async calculatePaymentBreakdown(
    subtotal: number,
    deliveryCharge: number
  ): Promise<PaymentBreakdown> {
    const totalAmount = Math.max(0, subtotal + deliveryCharge);
    const advanceAmountRequired = deliveryCharge;
    const remainingAmountDue = subtotal;

    return {
      itemsSubtotal: subtotal,
      deliveryCharge,
      totalAmount,
      advanceAmountRequired,
      remainingAmountDue,
      paymentStatus: 'pending_verification',
    };
  }
}

export const paymentService: IPaymentService = new FirebasePaymentService();
