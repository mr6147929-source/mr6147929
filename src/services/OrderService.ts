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
import { INITIAL_ORDERS } from '../data/mockData';
import {
  AdminUpdateOrderPayload,
  CancellationReasonOption,
  CreateOrderPayload,
  Order,
  OrderItem,
  OrderStatus,
  OrderStatusConfigItem,
} from '../types';
import { deliveryService } from './DeliveryService';
import { paymentService } from './PaymentService';

const STORAGE_KEY = 'eksho_rokom_orders';
const STATUS_CONFIG_STORAGE_KEY = 'eksho_rokom_order_status_config_v1';
const CANCELLATION_REASONS_STORAGE_KEY = 'eksho_rokom_cancellation_reasons_v1';
const ORDERS_COLLECTION = 'orders';
const SETTINGS_COLLECTION = 'settings';
const ORDER_META_DOC_ID = 'order_meta';

export const DEFAULT_ORDER_STATUS_CONFIGS: OrderStatusConfigItem[] = [
  {
    code: 'Pending',
    labelEn: 'Pending',
    labelBn: 'পেন্ডিং',
    descriptionEn: 'Registered in system',
    descriptionBn: 'সিস্টেমে নিবন্ধিত হয়েছে',
    colorTone: 'amber',
    badgeBgHex: '#FEF3C7',
    badgeTextHex: '#92400E',
    badgeBorderHex: '#FDE68A',
    dotColorHex: '#F59E0B',
    stepOrder: 0,
    isTerminal: false,
    active: true,
  },
  {
    code: 'Confirmed',
    labelEn: 'Confirmed',
    labelBn: 'কনফার্মড',
    descriptionEn: 'Advance verified & order confirmed',
    descriptionBn: 'অগ্রিম যাচাই ও অর্ডার কনফার্ম হয়েছে',
    colorTone: 'green',
    badgeBgHex: '#DCFCE7',
    badgeTextHex: '#166534',
    badgeBorderHex: '#86EFAC',
    dotColorHex: '#16A34A',
    stepOrder: 1,
    isTerminal: false,
    active: true,
  },
  {
    code: 'Processing',
    labelEn: 'Processing',
    labelBn: 'প্যাকিং চলছে',
    descriptionEn: 'Products are being prepared & packed',
    descriptionBn: 'পণ্য প্রস্তুত ও প্যাকিং করা হচ্ছে',
    colorTone: 'blue',
    badgeBgHex: '#E0F2FE',
    badgeTextHex: '#075985',
    badgeBorderHex: '#BAE6FD',
    dotColorHex: '#0284C7',
    stepOrder: 2,
    isTerminal: false,
    active: true,
  },
  {
    code: 'Shipped',
    labelEn: 'Shipped',
    labelBn: 'পথে আছে',
    descriptionEn: 'Dispatched with courier partner',
    descriptionBn: 'কুরিয়ারে পাঠানো হয়েছে',
    colorTone: 'purple',
    badgeBgHex: '#F3E8FF',
    badgeTextHex: '#6B21A8',
    badgeBorderHex: '#E9D5FF',
    dotColorHex: '#9333EA',
    stepOrder: 3,
    isTerminal: false,
    active: true,
  },
  {
    code: 'Delivered',
    labelEn: 'Delivered',
    labelBn: 'ডেলিভারি সম্পন্ন',
    descriptionEn: 'Handed over to customer',
    descriptionBn: 'গ্রাহকের কাছে পৌঁছেছে',
    colorTone: 'green',
    badgeBgHex: '#DCFCE7',
    badgeTextHex: '#166534',
    badgeBorderHex: '#86EFAC',
    dotColorHex: '#16A34A',
    stepOrder: 4,
    isTerminal: true,
    active: true,
  },
  {
    code: 'Cancelled',
    labelEn: 'Cancelled',
    labelBn: 'বাতিল',
    descriptionEn: 'Order has been cancelled',
    descriptionBn: 'অর্ডারটি বাতিল করা হয়েছে',
    colorTone: 'red',
    badgeBgHex: '#FEE2E2',
    badgeTextHex: '#991B1B',
    badgeBorderHex: '#FCA5A5',
    dotColorHex: '#DC2626',
    stepOrder: -1,
    isTerminal: true,
    active: true,
  },
];

export const DEFAULT_CANCELLATION_REASON_OPTIONS: CancellationReasonOption[] = [
  {
    id: 'reason-out-of-stock',
    labelEn: 'Product is currently out of stock.',
    labelBn: 'পণ্যটি বর্তমানে স্টকে নেই (Product Out of Stock)',
  },
  {
    id: 'reason-customer-request',
    labelEn: 'Cancelled upon customer request.',
    labelBn: 'গ্রাহকের অনুরোধে বাতিল করা হয়েছে (Customer Request)',
  },
  {
    id: 'reason-wrong-info',
    labelEn: 'Wrong order or delivery information provided.',
    labelBn: 'ভুল অর্ডার বা ঠিকানা/তথ্য প্রদান (Wrong Order Information)',
  },
  {
    id: 'reason-delivery-issue',
    labelEn: 'Delivery issue in the requested location.',
    labelBn: 'নির্ধারিত এলাকায় ডেলিভারি সমস্যা (Delivery Issue)',
  },
  {
    id: 'reason-unverified-payment',
    labelEn: 'Advance delivery charge TrxID could not be verified.',
    labelBn: 'অগ্রিম ডেলিভারি চার্জ (TrxID) যাচাই করা সম্ভব হয়নি',
  },
];

export interface IOrderService {
  createOrder(payload: CreateOrderPayload): Promise<Order>;
  getOrderById(orderId: string): Promise<Order | null>;
  getOrderByNumber(orderNumber: string): Promise<Order | null>;
  getOrdersByMobile(mobileNumber: string): Promise<Order[]>;
  searchOrders(query: string): Promise<Order[]>;
  getOrders(): Promise<Order[]>;
  confirmOrder(orderId: string, adminNote?: string): Promise<Order | null>;
  cancelOrder(orderId: string, cancellationReason: string, adminNote?: string): Promise<Order | null>;
  updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    options?: { cancellationReason?: string; note?: string }
  ): Promise<Order | null>;
  updateOrderPaymentStatus(
    orderId: string,
    paymentStatus: Order['paymentStatus']
  ): Promise<Order | null>;
  updateOrderDetails(
    orderId: string,
    updates: AdminUpdateOrderPayload
  ): Promise<Order | null>;
  deleteOrder(orderId: string): Promise<boolean>;
  generateOrderNumber(): string;
  // Status & Cancellation Reason Configuration API (for Admin App & Customer Tracking)
  getStatusConfigs(): OrderStatusConfigItem[];
  getStatusConfig(status: OrderStatus): OrderStatusConfigItem;
  saveStatusConfig(config: OrderStatusConfigItem): OrderStatusConfigItem[];
  getCancellationReasonOptions(): CancellationReasonOption[];
  addCancellationReasonOption(labelEn: string, labelBn?: string): CancellationReasonOption[];
}

class FirebaseOrderService implements IOrderService {
  private orders: Order[] = [];
  private statusConfigs: OrderStatusConfigItem[] = [...DEFAULT_ORDER_STATUS_CONFIGS];
  private cancellationReasons: CancellationReasonOption[] = [
    ...DEFAULT_CANCELLATION_REASON_OPTIONS,
  ];
  private isListening = false;
  private isSeeding = false;

  constructor() {
    this.initStorage();
    if (typeof window !== 'undefined') {
      this.setupRealtimeSync();
      window.addEventListener('storage', e => {
        if (
          e.key === STORAGE_KEY ||
          e.key === STATUS_CONFIG_STORAGE_KEY ||
          e.key === CANCELLATION_REASONS_STORAGE_KEY
        ) {
          this.initStorage();
          window.dispatchEvent(new Event('orders-updated'));
        }
      });
    }
  }

  private normalizeOrderNumberFormat(num: string): string {
    const legacyMatch = num.match(/^ER-\d{4}-(\d{4})$/i);
    if (legacyMatch) {
      return `ER${legacyMatch[1]}`;
    }
    return num.toUpperCase();
  }

  private initStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: Order[] = JSON.parse(stored);
        this.orders = parsed.map(ord => ({
          ...ord,
          orderNumber: this.normalizeOrderNumberFormat(ord.orderNumber),
        }));
      } else {
        this.orders = [...INITIAL_ORDERS];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.orders));
      }
    } catch {
      this.orders = [...INITIAL_ORDERS];
    }

    try {
      const storedConfigs = localStorage.getItem(STATUS_CONFIG_STORAGE_KEY);
      if (storedConfigs) {
        const parsed = JSON.parse(storedConfigs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.statusConfigs = parsed;
        }
      } else {
        this.statusConfigs = [...DEFAULT_ORDER_STATUS_CONFIGS];
        localStorage.setItem(
          STATUS_CONFIG_STORAGE_KEY,
          JSON.stringify(this.statusConfigs)
        );
      }
    } catch {
      this.statusConfigs = [...DEFAULT_ORDER_STATUS_CONFIGS];
    }

    try {
      const storedReasons = localStorage.getItem(CANCELLATION_REASONS_STORAGE_KEY);
      if (storedReasons) {
        const parsed = JSON.parse(storedReasons);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.cancellationReasons = parsed;
        }
      } else {
        this.cancellationReasons = [...DEFAULT_CANCELLATION_REASON_OPTIONS];
        localStorage.setItem(
          CANCELLATION_REASONS_STORAGE_KEY,
          JSON.stringify(this.cancellationReasons)
        );
      }
    } catch {
      this.cancellationReasons = [...DEFAULT_CANCELLATION_REASON_OPTIONS];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.orders));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('orders-updated'));
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
        query(collection(db, ORDERS_COLLECTION), where('id', '>=', '')),
        async snapshot => {
          if (snapshot.empty) {
            if (!this.isSeeding) {
              this.isSeeding = true;
              const toSeed = this.orders.length > 0 ? this.orders : [...INITIAL_ORDERS];
              for (const ord of toSeed) {
                await this.writeOrderToFirestore(ord);
              }
              this.isSeeding = false;
            }
            return;
          }

          const remoteOrders: Order[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data() as Order;
            if (data && data.id) {
              remoteOrders.push({
                ...data,
                orderNumber: this.normalizeOrderNumberFormat(data.orderNumber),
              });
            }
          });

          if (remoteOrders.length > 0) {
            remoteOrders.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            this.orders = remoteOrders;
            this.saveToStorage();
          }
        },
        error => {
          handleFirestoreError(error, OperationType.LIST, ORDERS_COLLECTION);
        }
      );

      onSnapshot(
        doc(db, SETTINGS_COLLECTION, ORDER_META_DOC_ID),
        docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data) {
              let changed = false;
              if (Array.isArray(data.statusConfigs) && data.statusConfigs.length > 0) {
                this.statusConfigs = data.statusConfigs;
                localStorage.setItem(
                  STATUS_CONFIG_STORAGE_KEY,
                  JSON.stringify(this.statusConfigs)
                );
                changed = true;
              }
              if (
                Array.isArray(data.cancellationReasons) &&
                data.cancellationReasons.length > 0
              ) {
                this.cancellationReasons = data.cancellationReasons;
                localStorage.setItem(
                  CANCELLATION_REASONS_STORAGE_KEY,
                  JSON.stringify(this.cancellationReasons)
                );
                changed = true;
              }
              if (changed && typeof window !== 'undefined') {
                window.dispatchEvent(new Event('orders-updated'));
              }
            }
          } else {
            this.writeOrderMetaToFirestore();
          }
        },
        error => {
          handleFirestoreError(
            error,
            OperationType.GET,
            `${SETTINGS_COLLECTION}/${ORDER_META_DOC_ID}`
          );
        }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, ORDERS_COLLECTION);
    }
  }

  private async writeOrderToFirestore(order: Order) {
    const cleanData = sanitizeForFirestore({
      ...order,
      id: order.id.slice(0, 128),
      orderNumber: this.normalizeOrderNumberFormat(order.orderNumber).slice(0, 64),
    });

    try {
      await setDoc(doc(db, ORDERS_COLLECTION, order.id), cleanData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${ORDERS_COLLECTION}/${order.id}`);
    }

    try {
      await setDoc(doc(secondaryDb, ORDERS_COLLECTION, order.id), cleanData);
    } catch {
      // Optional secondary project sync
    }
  }

  private async writeOrderMetaToFirestore() {
    const payload = sanitizeForFirestore({
      id: ORDER_META_DOC_ID,
      statusConfigs: this.statusConfigs,
      cancellationReasons: this.cancellationReasons,
      updatedAt: new Date().toISOString(),
    });
    try {
      await setDoc(doc(db, SETTINGS_COLLECTION, ORDER_META_DOC_ID), payload);
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.WRITE,
        `${SETTINGS_COLLECTION}/${ORDER_META_DOC_ID}`
      );
    }
    try {
      await setDoc(doc(secondaryDb, SETTINGS_COLLECTION, ORDER_META_DOC_ID), payload);
    } catch {
      // Optional secondary project sync
    }
  }

  getStatusConfigs(): OrderStatusConfigItem[] {
    return [...this.statusConfigs];
  }

  getStatusConfig(status: OrderStatus): OrderStatusConfigItem {
    const found = this.statusConfigs.find(
      c => c.code.toLowerCase() === String(status).toLowerCase()
    );
    if (found) return found;
    return {
      code: status,
      labelEn: String(status),
      labelBn: String(status),
      descriptionEn: '',
      descriptionBn: '',
      colorTone: 'slate',
      badgeBgHex: '#F1F5F9',
      badgeTextHex: '#334155',
      badgeBorderHex: '#CBD5E1',
      dotColorHex: '#64748B',
      stepOrder: 0,
      isTerminal: false,
      active: true,
    };
  }

  saveStatusConfig(config: OrderStatusConfigItem): OrderStatusConfigItem[] {
    const exists = this.statusConfigs.some(
      c => c.code.toLowerCase() === config.code.toLowerCase()
    );
    if (exists) {
      this.statusConfigs = this.statusConfigs.map(c =>
        c.code.toLowerCase() === config.code.toLowerCase() ? { ...config } : c
      );
    } else {
      this.statusConfigs.push({ ...config });
    }
    try {
      localStorage.setItem(
        STATUS_CONFIG_STORAGE_KEY,
        JSON.stringify(this.statusConfigs)
      );
      window.dispatchEvent(new Event('orders-updated'));
    } catch {
      // ignore
    }
    this.writeOrderMetaToFirestore();
    return [...this.statusConfigs];
  }

  getCancellationReasonOptions(): CancellationReasonOption[] {
    return [...this.cancellationReasons];
  }

  addCancellationReasonOption(
    labelEn: string,
    labelBn?: string
  ): CancellationReasonOption[] {
    const cleanEn = labelEn.trim();
    if (!cleanEn) return [...this.cancellationReasons];
    const newItem: CancellationReasonOption = {
      id: `reason-${Date.now()}`,
      labelEn: cleanEn,
      labelBn: (labelBn || cleanEn).trim(),
    };
    this.cancellationReasons.push(newItem);
    try {
      localStorage.setItem(
        CANCELLATION_REASONS_STORAGE_KEY,
        JSON.stringify(this.cancellationReasons)
      );
    } catch {
      // ignore
    }
    this.writeOrderMetaToFirestore();
    return [...this.cancellationReasons];
  }

  generateOrderNumber(): string {
    const existingSet = new Set(this.orders.map(o => o.orderNumber.toUpperCase()));
    for (let attempt = 0; attempt < 500; attempt++) {
      const fourDigits = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
      const candidate = `ER${fourDigits}`;
      if (!existingSet.has(candidate)) {
        return candidate;
      }
    }
    return `ER${String(Date.now() % 10000).padStart(4, '0')}`;
  }

  async getOrders(): Promise<Order[]> {
    return [...this.orders];
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    const found = this.orders.find(o => o.id === orderId);
    return found ? { ...found } : null;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    const cleanNumber = orderNumber.trim().toUpperCase();
    const order = this.orders.find(o => o.orderNumber.toUpperCase() === cleanNumber);
    return order ? { ...order } : null;
  }

  async getOrdersByMobile(mobileNumber: string): Promise<Order[]> {
    const cleanPhone = mobileNumber.replace(/[\s\-+]/g, '').trim();
    if (!cleanPhone) return [];
    return this.orders.filter(o => {
      const custPhone = o.customer.mobileNumber.replace(/[\s\-+]/g, '').trim();
      return (
        custPhone === cleanPhone ||
        (cleanPhone.length >= 11 && custPhone.endsWith(cleanPhone.slice(-11)))
      );
    });
  }

  async searchOrders(query: string): Promise<Order[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const byOrderNum = await this.getOrderByNumber(trimmed);
    if (byOrderNum) {
      return [byOrderNum];
    }

    return this.getOrdersByMobile(trimmed);
  }

  async confirmOrder(orderId: string, adminNote?: string): Promise<Order | null> {
    return this.updateOrderStatus(orderId, 'Confirmed', { note: adminNote });
  }

  async cancelOrder(
    orderId: string,
    cancellationReason: string,
    adminNote?: string
  ): Promise<Order | null> {
    const cleanReason =
      cancellationReason.trim() || 'Product is currently out of stock.';
    return this.updateOrderStatus(orderId, 'Cancelled', {
      cancellationReason: cleanReason,
      note: adminNote,
    });
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    options?: { cancellationReason?: string; note?: string }
  ): Promise<Order | null> {
    const index = this.orders.findIndex(o => o.id === orderId);
    if (index === -1) return null;

    const now = new Date().toISOString();
    const current = this.orders[index];
    const isCancelled = String(status).toLowerCase() === 'cancelled';
    const isConfirmed = String(status).toLowerCase() === 'confirmed';

    const resolvedCancellationReason = isCancelled
      ? (options?.cancellationReason !== undefined
          ? options.cancellationReason.trim()
          : current.cancellationReason) || 'Cancelled by Admin'
      : undefined;

    const historyEntry = {
      status,
      changedAt: now,
      note: options?.note,
      cancellationReason: resolvedCancellationReason,
    };

    const updatedOrder: Order = {
      ...current,
      orderStatus: status,
      cancellationReason: resolvedCancellationReason,
      cancelledAt: isCancelled ? now : undefined,
      confirmedAt: isConfirmed ? now : current.confirmedAt,
      adminNote: options?.note !== undefined ? options.note : current.adminNote,
      statusHistory: [...(current.statusHistory || []), historyEntry],
      updatedAt: now,
    };

    this.orders[index] = updatedOrder;
    this.saveToStorage();
    await this.writeOrderToFirestore(updatedOrder);
    return { ...updatedOrder };
  }

  async updateOrderPaymentStatus(
    orderId: string,
    paymentStatus: Order['paymentStatus']
  ): Promise<Order | null> {
    const index = this.orders.findIndex(o => o.id === orderId);
    if (index === -1) return null;
    const current = this.orders[index];
    const updatedOrder: Order = {
      ...current,
      paymentStatus,
      dueAmount: paymentStatus === 'completed' ? 0 : current.remainingAmount,
      updatedAt: new Date().toISOString(),
    };
    this.orders[index] = updatedOrder;
    this.saveToStorage();
    await this.writeOrderToFirestore(updatedOrder);
    return { ...updatedOrder };
  }

  async updateOrderDetails(
    orderId: string,
    updates: AdminUpdateOrderPayload
  ): Promise<Order | null> {
    const index = this.orders.findIndex(o => o.id === orderId);
    if (index === -1) return null;

    const current = this.orders[index];
    const now = new Date().toISOString();

    const updatedCustomer = updates.customer
      ? {
          ...current.customer,
          ...updates.customer,
          area: updates.area || updates.customer.area || current.customer.area,
        }
      : {
          ...current.customer,
          area: updates.area || current.customer.area,
        };

    const updatedItems = updates.items ? [...updates.items] : current.items;
    const itemsSubtotal =
      updates.itemsSubtotal !== undefined
        ? updates.itemsSubtotal
        : updatedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    const deliveryCharge =
      updates.deliveryCharge !== undefined
        ? updates.deliveryCharge
        : current.deliveryCharge;

    const totalAmount =
      updates.totalAmount !== undefined
        ? updates.totalAmount
        : itemsSubtotal + deliveryCharge;

    const advanceAmount =
      updates.advanceAmount !== undefined ? updates.advanceAmount : deliveryCharge;

    const remainingAmount =
      updates.remainingAmount !== undefined
        ? updates.remainingAmount
        : Math.max(0, totalAmount - advanceAmount);

    const nextStatus = updates.orderStatus || current.orderStatus;
    const isCancelled = String(nextStatus).toLowerCase() === 'cancelled';

    const cancellationReason = isCancelled
      ? (updates.cancellationReason !== undefined
          ? updates.cancellationReason.trim()
          : current.cancellationReason) || 'Cancelled by Admin'
      : undefined;

    const updatedOrder: Order = {
      ...current,
      customer: updatedCustomer,
      area: updatedCustomer.area,
      items: updatedItems,
      itemsSubtotal,
      deliveryCharge,
      totalAmount,
      advanceAmount,
      remainingAmount,
      dueAmount:
        updates.dueAmount !== undefined
          ? updates.dueAmount
          : (updates.paymentStatus || current.paymentStatus) === 'completed'
          ? 0
          : remainingAmount,
      paymentStatus: updates.paymentStatus || current.paymentStatus,
      orderStatus: nextStatus,
      cancellationReason,
      cancelledAt: isCancelled ? current.cancelledAt || now : undefined,
      confirmedAt:
        String(nextStatus).toLowerCase() === 'confirmed'
          ? current.confirmedAt || now
          : current.confirmedAt,
      orderNote: updates.orderNote !== undefined ? updates.orderNote : current.orderNote,
      adminNote: updates.adminNote !== undefined ? updates.adminNote : current.adminNote,
      trxId: updates.trxId !== undefined ? updates.trxId : current.trxId,
      senderPhone:
        updates.senderPhone !== undefined ? updates.senderPhone : current.senderPhone,
      updatedAt: now,
    };

    this.orders[index] = updatedOrder;
    this.saveToStorage();
    await this.writeOrderToFirestore(updatedOrder);
    return { ...updatedOrder };
  }

  async deleteOrder(orderId: string): Promise<boolean> {
    const prevLen = this.orders.length;
    this.orders = this.orders.filter(o => o.id !== orderId);
    if (this.orders.length !== prevLen) {
      this.saveToStorage();
      try {
        await deleteDoc(doc(db, ORDERS_COLLECTION, orderId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${ORDERS_COLLECTION}/${orderId}`);
      }
      try {
        await deleteDoc(doc(secondaryDb, ORDERS_COLLECTION, orderId));
      } catch {
        // Optional secondary project sync
      }
      return true;
    }
    return false;
  }

  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const orderNumber = this.generateOrderNumber();
    const now = new Date().toISOString();

    const items: OrderItem[] = payload.items.map(ci => ({
      productId: ci.productId,
      productName: ci.product.name,
      productImage: ci.product.images[0] || '',
      quantity: ci.quantity,
      unitPrice: ci.unitPrice,
      subtotal: ci.unitPrice * ci.quantity,
      weight: ci.product.weight,
      weightUnit: ci.product.weightUnit,
      selectedColor: ci.selectedColor,
      selectedSize: ci.selectedSize,
    }));

    const itemsSubtotal = items.reduce((acc, it) => acc + it.subtotal, 0);

    const deliveryCharge = await deliveryService.calculateDeliveryCharge(
      payload.area,
      payload.items
    );

    const breakdown = await paymentService.calculatePaymentBreakdown(
      itemsSubtotal,
      deliveryCharge
    );

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customer: {
        ...payload.customer,
        area: payload.area,
      },
      items,
      itemsSubtotal,
      deliveryCharge,
      totalAmount: breakdown.totalAmount,
      advanceAmount: breakdown.advanceAmountRequired,
      remainingAmount: breakdown.remainingAmountDue,
      dueAmount: breakdown.remainingAmountDue,
      paymentMethod: 'delivery_charge_advance',
      paymentStatus: 'advance_paid',
      orderStatus: 'Pending',
      statusHistory: [
        {
          status: 'Pending',
          changedAt: now,
          note: 'Order placed by customer',
        },
      ],
      area: payload.area,
      orderNote: payload.orderNote,
      trxId: payload.trxId,
      senderPhone: payload.senderPhone,
      createdAt: now,
      updatedAt: now,
    };

    this.orders.unshift(newOrder);
    this.saveToStorage();
    await this.writeOrderToFirestore(newOrder);

    return newOrder;
  }
}

export const orderService: IOrderService = new FirebaseOrderService();
