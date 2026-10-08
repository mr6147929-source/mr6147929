export interface ProductVariantsConfig {
  enabled: boolean;
  colorsEnabled: boolean;
  colors: string[];
  sizesEnabled: boolean;
  sizes: string[];
}

export interface Product {
  id: string;
  name: string;
  nameBn?: string;
  description: string;
  categoryId: string;
  images: string[];
  sellingPrice: number;
  originalPrice?: number;
  stock: number;
  /**
   * Internal field - NEVER exposed in customer UI
   * Used strictly for delivery charge calculations
   */
  weight: number;
  weightUnit: 'g' | 'kg';
  featured: boolean;
  active: boolean;
  variants?: ProductVariantsConfig;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  nameBn?: string;
  image: string;
  description: string;
  active: boolean;
  displayOrder: number;
}

export interface CartItem {
  cartItemId?: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  selectedColor?: string;
  selectedSize?: string;
}

export type DeliveryAreaType = 'Dhaka City' | 'Dhaka Sub Urban' | 'Outside Dhaka';

export interface Customer {
  fullName: string;
  mobileNumber: string;
  area: DeliveryAreaType;
  fullAddress: string;
  orderNote?: string;
}

export interface DeliveryAreaRule {
  id: string;
  name: DeliveryAreaType;
  baseChargeUpTo1Kg: number;
  additionalPerKgCharge: number;
}

export type PaymentMethod = 'delivery_charge_advance';

export type PaymentStatus = 'pending_verification' | 'advance_paid' | 'completed';

export interface PaymentNumberItem {
  id: string;
  number: string;
  label: string;
  enabled: boolean;
}

export interface PaymentConfig {
  paymentNumbers: PaymentNumberItem[];
  instructions: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  weight: number;
  weightUnit: 'g' | 'kg';
  selectedColor?: string;
  selectedSize?: string;
}

export function buildCartItemKey(
  productId: string,
  selectedColor?: string,
  selectedSize?: string
): string {
  const c = (selectedColor || '').trim();
  const s = (selectedSize || '').trim();
  if (!c && !s) return productId;
  return `${productId}__color:${c}__size:${s}`;
}

export function getActiveProductVariants(product: Product): {
  hasColors: boolean;
  colors: string[];
  hasSizes: boolean;
  sizes: string[];
  hasVariants: boolean;
} {
  const v = product.variants;
  if (!v || !v.enabled) {
    return {
      hasColors: false,
      colors: [],
      hasSizes: false,
      sizes: [],
      hasVariants: false,
    };
  }
  const colors = v.colorsEnabled ? (v.colors || []).map(c => c.trim()).filter(Boolean) : [];
  const sizes = v.sizesEnabled ? (v.sizes || []).map(s => s.trim()).filter(Boolean) : [];
  const hasColors = colors.length > 0;
  const hasSizes = sizes.length > 0;
  return {
    hasColors,
    colors,
    hasSizes,
    sizes,
    hasVariants: hasColors || hasSizes,
  };
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | (string & {});

export type StatusColorTone =
  | 'amber'
  | 'green'
  | 'blue'
  | 'purple'
  | 'teal'
  | 'red'
  | 'slate';

export interface OrderStatusConfigItem {
  code: OrderStatus;
  labelEn: string;
  labelBn: string;
  descriptionEn: string;
  descriptionBn: string;
  colorTone: StatusColorTone;
  badgeBgHex: string;
  badgeTextHex: string;
  badgeBorderHex: string;
  dotColorHex: string;
  stepOrder: number; // -1 for terminal non-stepper states like Cancelled
  isTerminal?: boolean;
  active: boolean;
}

export interface CancellationReasonOption {
  id: string;
  labelEn: string;
  labelBn: string;
}

export interface OrderStatusHistoryEntry {
  status: OrderStatus;
  changedAt: string;
  note?: string;
  cancellationReason?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: Customer;
  items: OrderItem[];
  itemsSubtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  advanceAmount: number;
  remainingAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  cancellationReason?: string;
  cancelledAt?: string;
  confirmedAt?: string;
  statusHistory?: OrderStatusHistoryEntry[];
  area: DeliveryAreaType;
  orderNote?: string;
  adminNote?: string;
  trxId?: string;
  senderPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUpdateOrderPayload {
  customer?: Partial<Customer>;
  area?: DeliveryAreaType;
  items?: OrderItem[];
  itemsSubtotal?: number;
  deliveryCharge?: number;
  totalAmount?: number;
  advanceAmount?: number;
  remainingAmount?: number;
  dueAmount?: number;
  paymentStatus?: PaymentStatus;
  orderStatus?: OrderStatus;
  cancellationReason?: string;
  orderNote?: string;
  adminNote?: string;
  trxId?: string;
  senderPhone?: string;
}

export interface CreateOrderPayload {
  customer: Customer;
  items: CartItem[];
  area: DeliveryAreaType;
  trxId: string;
  senderPhone?: string;
  orderNote?: string;
}

export interface FooterSectionItem {
  id: 'social_media' | 'return_policy' | 'terms_conditions' | 'contact_details' | 'about_us';
  title: string;
  content: string;
}

export interface AuthUser {
  id: string;
  method: 'mobile' | 'google';
  mobileNumber?: string;
  email?: string;
  name?: string;
  createdAt: string;
  lastLoginAt: string;
}
