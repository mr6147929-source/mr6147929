import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  BarChart3,
  Truck,
  LogOut,
  Search,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  Lock,
  ShieldCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  ArrowUp,
  ArrowDown,
  ToggleLeft,
  ToggleRight,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  AlertCircle,
  Eye,
  KeyRound,
} from 'lucide-react';
import {
  Category,
  DeliveryAreaRule,
  FooterSectionItem,
  Order,
  OrderStatus,
  PaymentNumberItem,
  PaymentStatus,
  Product,
  ProductVariantsConfig,
} from '../types';
import { adminAuthService, AdminUserSession } from '../services/AdminAuthService';
import { productService } from '../services/ProductService';
import { orderService } from '../services/OrderService';
import { categoryService } from '../services/CategoryService';
import { deliveryService } from '../services/DeliveryService';
import { paymentService } from '../services/PaymentService';
import { footerService } from '../services/FooterService';

type AdminSectionTab =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'customers'
  | 'reports'
  | 'delivery';

const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

const DEFAULT_VARIANTS_CONFIG: ProductVariantsConfig = {
  enabled: false,
  colorsEnabled: false,
  colors: [],
  sizesEnabled: false,
  sizes: [],
};

interface ProductFormState {
  id?: string;
  name: string;
  description: string;
  categoryId: string;
  imageUrl: string;
  sellingPrice: number;
  originalPrice: string;
  stock: number;
  weight: number;
  weightUnit: 'g' | 'kg';
  featured: boolean;
  active: boolean;
  variants: ProductVariantsConfig;
}

export const AdminSalesApp: React.FC = () => {
  const [session, setSession] = useState<AdminUserSession | null>(() =>
    adminAuthService.getCurrentSession()
  );

  // Login State
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // App Navigation State
  const [activeTab, setActiveTab] = useState<AdminSectionTab>('dashboard');
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryRules, setDeliveryRules] = useState<DeliveryAreaRule[]>([]);
  const [paymentNumbers, setPaymentNumbers] = useState<PaymentNumberItem[]>([]);
  const [footerSections, setFooterSections] = useState<FooterSectionItem[]>([]);
  const [announcementText, setAnnouncementText] = useState('');

  // Orders Filter State
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [orderAreaFilter, setOrderAreaFilter] = useState<string>('ALL');
  const [orderDateFrom, setOrderDateFrom] = useState('');
  const [orderDateTo, setOrderDateTo] = useState('');
  const [selectedOrderModal, setSelectedOrderModal] = useState<Order | null>(null);
  const [confirmDeleteOrderId, setConfirmDeleteOrderId] = useState<string | null>(null);
  const [cancelOrderTarget, setCancelOrderTarget] = useState<Order | null>(null);
  const [selectedCancelPreset, setSelectedCancelPreset] = useState<string>(
    'Product is currently out of stock.'
  );
  const [customCancelReason, setCustomCancelReason] = useState<string>('');
  const [editingOrderDetails, setEditingOrderDetails] = useState<boolean>(false);
  const [editCustomerName, setEditCustomerName] = useState<string>('');
  const [editCustomerPhone, setEditCustomerPhone] = useState<string>('');
  const [editCustomerArea, setEditCustomerArea] = useState<Order['area']>('Dhaka City');
  const [editCustomerAddress, setEditCustomerAddress] = useState<string>('');
  const [editTrxId, setEditTrxId] = useState<string>('');
  const [editOrderNote, setEditOrderNote] = useState<string>('');

  // Products Filter & Modal State
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');
  const [productStockFilter, setProductStockFilter] = useState<'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productForm, setProductForm] = useState<ProductFormState>({
    name: '',
    description: '',
    categoryId: 'cat-sheets',
    imageUrl: '',
    sellingPrice: 150,
    originalPrice: '',
    stock: 25,
    weight: 150,
    weightUnit: 'g',
    featured: false,
    active: true,
    variants: { ...DEFAULT_VARIANTS_CONFIG },
  });
  const [newColorInput, setNewColorInput] = useState('');
  const [newSizeInput, setNewSizeInput] = useState('');
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<string | null>(null);

  // Customers Search State
  const [customerSearch, setCustomerSearch] = useState('');

  // Reports Date Range State
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');

  // Delivery & Store Settings State
  const [newPaymentNum, setNewPaymentNum] = useState('');
  const [newPaymentLabel, setNewPaymentLabel] = useState('bKash / Nagad / Rocket (Send Money)');
  const [adminCredEmail, setAdminCredEmail] = useState(session?.email || 'admin@ekshorokom.com');
  const [adminCredPassword, setAdminCredPassword] = useState('');

  const showToast = (msg: string) => {
    setNoticeMessage(msg);
    window.setTimeout(() => {
      setNoticeMessage(prev => (prev === msg ? null : prev));
    }, 2600);
  };

  const loadAllAdminData = async () => {
    const [allProds, allCats, allOrds, rules, payCfg, footSecs, announcement] =
      await Promise.all([
        productService.getAllAdminProducts(),
        categoryService.getCategories(),
        orderService.getOrders(),
        deliveryService.getAreaRules(),
        paymentService.getPaymentConfig(),
        footerService.getFooterSections(),
        footerService.getAnnouncementText(),
      ]);
    setProducts(allProds);
    setCategories(allCats);
    setOrders(allOrds);
    setDeliveryRules(rules);
    setPaymentNumbers(payCfg.paymentNumbers);
    setFooterSections(footSecs);
    setAnnouncementText(announcement);
  };

  useEffect(() => {
    if (!session) return;
    loadAllAdminData();

    const handleRefresh = () => loadAllAdminData();
    window.addEventListener('products-updated', handleRefresh);
    window.addEventListener('categories-updated', handleRefresh);
    window.addEventListener('orders-updated', handleRefresh);
    window.addEventListener('payment-config-updated', handleRefresh);
    window.addEventListener('footer-sections-updated', handleRefresh);
    window.addEventListener('delivery-rules-updated', handleRefresh);
    return () => {
      window.removeEventListener('products-updated', handleRefresh);
      window.removeEventListener('categories-updated', handleRefresh);
      window.removeEventListener('orders-updated', handleRefresh);
      window.removeEventListener('payment-config-updated', handleRefresh);
      window.removeEventListener('footer-sections-updated', handleRefresh);
      window.removeEventListener('delivery-rules-updated', handleRefresh);
    };
  }, [session]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = adminAuthService.login(loginId, loginPassword);
    if (!res.ok || !res.session) {
      setLoginError(res.error || 'Authentication failed.');
      return;
    }
    setSession(res.session);
    setAdminCredEmail(res.session.email);
    setLoginPassword('');
  };

  const handleLogout = () => {
    adminAuthService.logout();
    setSession(null);
  };

  // Dashboard & Metrics Calculation
  const dashboardMetrics = useMemo(() => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(
      o => o.orderStatus === 'Pending' || o.orderStatus === 'Confirmed' || o.orderStatus === 'Processing' || o.orderStatus === 'Shipped'
    ).length;
    const strictlyPending = orders.filter(o => o.orderStatus === 'Pending').length;
    const completedOrders = orders.filter(o => o.orderStatus === 'Delivered').length;
    const cancelledOrders = orders.filter(o => o.orderStatus === 'Cancelled').length;

    const validSalesOrders = orders.filter(o => o.orderStatus !== 'Cancelled');
    const totalSalesAmount = validSalesOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const completedRevenue = orders
      .filter(o => o.orderStatus === 'Delivered')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const advanceCollected = validSalesOrders.reduce((sum, o) => sum + o.advanceAmount, 0);

    const outOfStockCount = products.filter(p => p.stock <= 0).length;

    return {
      totalOrders,
      pendingOrders,
      strictlyPending,
      completedOrders,
      cancelledOrders,
      totalSalesAmount,
      completedRevenue,
      advanceCollected,
      outOfStockCount,
    };
  }, [orders, products]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(ord => {
      if (orderStatusFilter !== 'ALL' && ord.orderStatus !== orderStatusFilter) {
        return false;
      }
      if (orderAreaFilter !== 'ALL' && ord.area !== orderAreaFilter) {
        return false;
      }
      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase().trim();
        const matchOrderNo = ord.orderNumber.toLowerCase().includes(q);
        const matchName = ord.customer.fullName.toLowerCase().includes(q);
        const matchPhone = ord.customer.mobileNumber.toLowerCase().includes(q);
        const matchTrx = (ord.trxId || '').toLowerCase().includes(q);
        const matchItem = ord.items.some(i => i.productName.toLowerCase().includes(q));
        if (!matchOrderNo && !matchName && !matchPhone && !matchTrx && !matchItem) {
          return false;
        }
      }
      if (orderDateFrom) {
        const fromTs = new Date(`${orderDateFrom}T00:00:00`).getTime();
        const ordTs = new Date(ord.createdAt).getTime();
        if (ordTs < fromTs) return false;
      }
      if (orderDateTo) {
        const toTs = new Date(`${orderDateTo}T23:59:59`).getTime();
        const ordTs = new Date(ord.createdAt).getTime();
        if (ordTs > toTs) return false;
      }
      return true;
    });
  }, [orders, orderSearch, orderStatusFilter, orderAreaFilter, orderDateFrom, orderDateTo]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (productCategoryFilter !== 'ALL' && p.categoryId !== productCategoryFilter) {
        return false;
      }
      if (productStockFilter === 'IN_STOCK' && p.stock <= 0) return false;
      if (productStockFilter === 'OUT_OF_STOCK' && p.stock > 0) return false;
      if (productSearch.trim()) {
        const q = productSearch.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
      }
      return true;
    });
  }, [products, productSearch, productCategoryFilter, productStockFilter]);

  // Customers Directory Aggregated from Orders
  const customersList = useMemo(() => {
    const map = new Map<
      string,
      {
        mobileNumber: string;
        fullName: string;
        area: string;
        fullAddress: string;
        totalOrders: number;
        totalSpent: number;
        lastOrderDate: string;
        orders: Order[];
      }
    >();

    orders.forEach(ord => {
      const key = ord.customer.mobileNumber.replace(/\s+/g, '').trim() || ord.customer.fullName;
      const existing = map.get(key);
      const spent = ord.orderStatus !== 'Cancelled' ? ord.totalAmount : 0;
      if (!existing) {
        map.set(key, {
          mobileNumber: ord.customer.mobileNumber,
          fullName: ord.customer.fullName,
          area: ord.customer.area,
          fullAddress: ord.customer.fullAddress,
          totalOrders: 1,
          totalSpent: spent,
          lastOrderDate: ord.createdAt,
          orders: [ord],
        });
      } else {
        existing.totalOrders += 1;
        existing.totalSpent += spent;
        if (new Date(ord.createdAt) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = ord.createdAt;
          existing.fullName = ord.customer.fullName;
          existing.fullAddress = ord.customer.fullAddress;
          existing.area = ord.customer.area;
        }
        existing.orders.push(ord);
      }
    });

    const list = Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
    if (!customerSearch.trim()) return list;
    const q = customerSearch.toLowerCase().trim();
    return list.filter(
      c =>
        c.fullName.toLowerCase().includes(q) ||
        c.mobileNumber.toLowerCase().includes(q) ||
        c.fullAddress.toLowerCase().includes(q) ||
        c.area.toLowerCase().includes(q)
    );
  }, [orders, customerSearch]);

  // Date-wise Sales Report
  const dateWiseSalesReport = useMemo(() => {
    const filtered = orders.filter(ord => {
      if (reportStartDate) {
        const fromTs = new Date(`${reportStartDate}T00:00:00`).getTime();
        if (new Date(ord.createdAt).getTime() < fromTs) return false;
      }
      if (reportEndDate) {
        const toTs = new Date(`${reportEndDate}T23:59:59`).getTime();
        if (new Date(ord.createdAt).getTime() > toTs) return false;
      }
      return true;
    });

    const dayMap = new Map<
      string,
      {
        date: string;
        totalOrders: number;
        deliveredOrders: number;
        cancelledOrders: number;
        itemsSold: number;
        grossSales: number;
        deliveredRevenue: number;
        deliveryCharges: number;
      }
    >();

    filtered.forEach(ord => {
      const dateKey = new Date(ord.createdAt).toISOString().slice(0, 10);
      const entry = dayMap.get(dateKey) || {
        date: dateKey,
        totalOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        itemsSold: 0,
        grossSales: 0,
        deliveredRevenue: 0,
        deliveryCharges: 0,
      };

      entry.totalOrders += 1;
      if (ord.orderStatus === 'Delivered') {
        entry.deliveredOrders += 1;
        entry.deliveredRevenue += ord.totalAmount;
      }
      if (ord.orderStatus === 'Cancelled') {
        entry.cancelledOrders += 1;
      } else {
        entry.grossSales += ord.totalAmount;
        entry.deliveryCharges += ord.deliveryCharge;
        entry.itemsSold += ord.items.reduce((acc, i) => acc + i.quantity, 0);
      }

      dayMap.set(dateKey, entry);
    });

    const rows = Array.from(dayMap.values()).sort((a, b) => b.date.localeCompare(a.date));
    const totals = rows.reduce(
      (acc, r) => {
        acc.totalOrders += r.totalOrders;
        acc.deliveredOrders += r.deliveredOrders;
        acc.cancelledOrders += r.cancelledOrders;
        acc.itemsSold += r.itemsSold;
        acc.grossSales += r.grossSales;
        acc.deliveredRevenue += r.deliveredRevenue;
        acc.deliveryCharges += r.deliveryCharges;
        return acc;
      },
      {
        totalOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        itemsSold: 0,
        grossSales: 0,
        deliveredRevenue: 0,
        deliveryCharges: 0,
      }
    );

    return { rows, totals };
  }, [orders, reportStartDate, reportEndDate]);

  // Handlers: Orders
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    if (String(newStatus).toLowerCase() === 'cancelled') {
      const target = orders.find(o => o.id === orderId) || selectedOrderModal;
      if (target) {
        setCancelOrderTarget(target);
        setSelectedCancelPreset('Product is currently out of stock.');
        setCustomCancelReason(target.cancellationReason || '');
        return;
      }
    }
    await orderService.updateOrderStatus(orderId, newStatus);
    await loadAllAdminData();
    if (selectedOrderModal && selectedOrderModal.id === orderId) {
      const updated = await orderService.getOrders();
      setSelectedOrderModal(updated.find(o => o.id === orderId) || null);
    }
    showToast(`Order status updated to ${newStatus}`);
  };

  const handleConfirmOrder = async (orderId: string) => {
    await orderService.confirmOrder(orderId);
    await loadAllAdminData();
    if (selectedOrderModal && selectedOrderModal.id === orderId) {
      const updated = await orderService.getOrders();
      setSelectedOrderModal(updated.find(o => o.id === orderId) || null);
    }
    showToast('Order Confirmed (Green Status active on Customer Tracking)');
  };

  const handleSubmitCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelOrderTarget) return;
    const finalReason =
      selectedCancelPreset === 'CUSTOM'
        ? customCancelReason.trim() || 'Cancelled by Admin'
        : selectedCancelPreset;

    await orderService.cancelOrder(cancelOrderTarget.id, finalReason);
    const targetId = cancelOrderTarget.id;
    setCancelOrderTarget(null);
    setCustomCancelReason('');
    await loadAllAdminData();
    if (selectedOrderModal && selectedOrderModal.id === targetId) {
      const updated = await orderService.getOrders();
      setSelectedOrderModal(updated.find(o => o.id === targetId) || null);
    }
    showToast('Order Cancelled with reason saved');
  };

  const openOrderModalWithInit = (ord: Order) => {
    setSelectedOrderModal(ord);
    setEditingOrderDetails(false);
    setEditCustomerName(ord.customer.fullName);
    setEditCustomerPhone(ord.customer.mobileNumber);
    setEditCustomerArea(ord.area);
    setEditCustomerAddress(ord.customer.fullAddress);
    setEditTrxId(ord.trxId || '');
    setEditOrderNote(ord.orderNote || '');
  };

  const handleSaveEditedOrderDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderModal) return;
    const updated = await orderService.updateOrderDetails(selectedOrderModal.id, {
      customer: {
        fullName: editCustomerName.trim(),
        mobileNumber: editCustomerPhone.trim(),
        area: editCustomerArea,
        fullAddress: editCustomerAddress.trim(),
      },
      area: editCustomerArea,
      trxId: editTrxId.trim(),
      orderNote: editOrderNote.trim(),
    });
    await loadAllAdminData();
    if (updated) {
      setSelectedOrderModal(updated);
    }
    setEditingOrderDetails(false);
    showToast('Order details updated');
  };

  const handlePaymentStatusChange = async (orderId: string, paymentStatus: PaymentStatus) => {
    await orderService.updateOrderPaymentStatus(orderId, paymentStatus);
    await loadAllAdminData();
    if (selectedOrderModal && selectedOrderModal.id === orderId) {
      const updated = await orderService.getOrders();
      setSelectedOrderModal(updated.find(o => o.id === orderId) || null);
    }
    showToast('Payment status updated');
  };

  const handleDeleteOrder = async (orderId: string) => {
    await orderService.deleteOrder(orderId);
    setConfirmDeleteOrderId(null);
    if (selectedOrderModal?.id === orderId) {
      setSelectedOrderModal(null);
    }
    await loadAllAdminData();
    showToast('Order record deleted');
  };

  // Handlers: Products
  const openAddProductModal = () => {
    const defaultImg = products[0]?.images[0] || '';
    setProductForm({
      name: '',
      description: '',
      categoryId: categories[0]?.id || 'cat-sheets',
      imageUrl: defaultImg,
      sellingPrice: 180,
      originalPrice: '',
      stock: 20,
      weight: 150,
      weightUnit: 'g',
      featured: false,
      active: true,
      variants: { ...DEFAULT_VARIANTS_CONFIG },
    });
    setNewColorInput('');
    setNewSizeInput('');
    setProductModalOpen(true);
  };

  const openEditProductModal = (prod: Product) => {
    setProductForm({
      id: prod.id,
      name: prod.name,
      description: prod.description,
      categoryId: prod.categoryId,
      imageUrl: prod.images[0] || '',
      sellingPrice: prod.sellingPrice,
      originalPrice: prod.originalPrice ? String(prod.originalPrice) : '',
      stock: prod.stock,
      weight: prod.weight || 150,
      weightUnit: prod.weightUnit || 'g',
      featured: prod.featured,
      active: prod.active,
      variants: prod.variants
        ? {
            enabled: Boolean(prod.variants.enabled),
            colorsEnabled: Boolean(prod.variants.colorsEnabled),
            colors: [...(prod.variants.colors || [])],
            sizesEnabled: Boolean(prod.variants.sizesEnabled),
            sizes: [...(prod.variants.sizes || [])],
          }
        : { ...DEFAULT_VARIANTS_CONFIG },
    });
    setNewColorInput('');
    setNewSizeInput('');
    setProductModalOpen(true);
  };

  const handleSaveProductModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedColors = productForm.variants.colors.map(c => c.trim()).filter(Boolean);
    const cleanedSizes = productForm.variants.sizes.map(s => s.trim()).filter(Boolean);
    const fallbackImage = products[0]?.images[0] || '';

    const payload = {
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      categoryId: productForm.categoryId,
      images: [productForm.imageUrl.trim() || fallbackImage],
      sellingPrice: Math.max(0, Number(productForm.sellingPrice) || 0),
      originalPrice: productForm.originalPrice
        ? Math.max(0, Number(productForm.originalPrice))
        : undefined,
      stock: Math.max(0, Number(productForm.stock) || 0),
      weight: Math.max(1, Number(productForm.weight) || 100),
      weightUnit: productForm.weightUnit,
      featured: productForm.featured,
      active: productForm.active,
      variants: {
        enabled: productForm.variants.enabled,
        colorsEnabled: productForm.variants.colorsEnabled,
        colors: cleanedColors,
        sizesEnabled: productForm.variants.sizesEnabled,
        sizes: cleanedSizes,
      },
    };

    if (productForm.id) {
      await productService.updateProduct(productForm.id, payload);
      showToast('Product updated successfully');
    } else {
      await productService.addProduct(payload);
      showToast('New product added to catalog');
    }

    setProductModalOpen(false);
    await loadAllAdminData();
  };

  const handleQuickStockToggle = async (prod: Product) => {
    const nextStock = prod.stock > 0 ? 0 : 25;
    await productService.updateProduct(prod.id, { stock: nextStock });
    await loadAllAdminData();
    showToast(
      `${prod.name.slice(0, 28)}... marked as ${nextStock > 0 ? 'In Stock (25)' : 'Out of Stock'}`
    );
  };

  const handleQuickStockChange = async (prod: Product, stockVal: number) => {
    await productService.updateProduct(prod.id, { stock: Math.max(0, stockVal) });
    await loadAllAdminData();
  };

  const handleQuickPriceChange = async (prod: Product, priceVal: number) => {
    await productService.updateProduct(prod.id, { sellingPrice: Math.max(0, priceVal) });
    await loadAllAdminData();
  };

  const handleDeleteProduct = async (productId: string) => {
    await productService.deleteProduct(productId);
    setConfirmDeleteProductId(null);
    await loadAllAdminData();
    showToast('Product deleted from catalog');
  };

  // Variants helpers inside Product Modal
  const addFormColor = () => {
    const val = newColorInput.trim();
    if (!val) return;
    setProductForm(prev => ({
      ...prev,
      variants: {
        ...prev.variants,
        enabled: true,
        colorsEnabled: true,
        colors: [...prev.variants.colors, val],
      },
    }));
    setNewColorInput('');
  };

  const addFormSize = () => {
    const val = newSizeInput.trim();
    if (!val) return;
    setProductForm(prev => ({
      ...prev,
      variants: {
        ...prev.variants,
        enabled: true,
        sizesEnabled: true,
        sizes: [...prev.variants.sizes, val],
      },
    }));
    setNewSizeInput('');
  };

  // Delivery & Store Settings Handlers
  const handleSaveDeliveryAndStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const rule of deliveryRules) {
      await deliveryService.updateAreaRule(rule.id, {
        baseChargeUpTo1Kg: Math.max(0, Number(rule.baseChargeUpTo1Kg) || 0),
        additionalPerKgCharge: Math.max(0, Number(rule.additionalPerKgCharge) || 0),
      });
    }
    for (const numItem of paymentNumbers) {
      await paymentService.updatePaymentNumber(numItem.id, {
        number: numItem.number.trim(),
        label: numItem.label.trim() || 'bKash / Nagad / Rocket (Send Money)',
        enabled: numItem.enabled,
      });
    }
    await footerService.updateAnnouncementText(announcementText);
    for (const sec of footerSections) {
      await footerService.updateFooterSection(sec.id, {
        title: sec.title,
        content: sec.content,
      });
    }
    if (adminCredPassword.trim()) {
      adminAuthService.updateCredentials(adminCredEmail, adminCredPassword);
      setAdminCredPassword('');
    }
    await loadAllAdminData();
    showToast('Delivery, payment & store settings saved');
  };

  const handleAddPaymentNumber = async () => {
    if (!newPaymentNum.trim()) return;
    const updated = await paymentService.addPaymentNumber(
      newPaymentNum.trim(),
      newPaymentLabel.trim() || 'bKash / Nagad / Rocket (Send Money)'
    );
    setPaymentNumbers(updated);
    setNewPaymentNum('');
    showToast('Payment number added');
  };

  const handleDeletePaymentNumber = async (id: string) => {
    const updated = await paymentService.deletePaymentNumber(id);
    setPaymentNumbers(updated);
    showToast('Payment number removed');
  };

  const getOrderStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Confirmed':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'Processing':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'Shipped':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // ============================================================================
  // 1. SECURE ADMIN LOGIN VIEW
  // ============================================================================
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="bg-[#065367] px-6 py-6 text-white text-center">
            <div className="inline-flex items-center justify-center w-11 h-11 bg-white/10 rounded-xl mb-3 border border-white/20 shadow-sm">
              <svg
                className="w-6 h-6 fill-current text-amber-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <h1 className="text-lg font-bold tracking-tight">
              Eksho Rokom — Sales Management
            </h1>
            <p className="text-xs text-teal-100 mt-1 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Authorized Admin Portal</span>
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            {loginError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Admin Email or Username
              </label>
              <input
                type="text"
                required
                value={loginId}
                onChange={e => setLoginId(e.target.value)}
                placeholder="admin@ekshorokom.com"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#065367] font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Admin Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#065367] font-semibold text-slate-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#065367] hover:bg-[#054354] text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Sign In to Sales Management</span>
            </button>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 text-center space-y-0.5">
              <p>Default Admin Access: admin@ekshorokom.com / admin123</p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 2. AUTHENTICATED SALES MANAGEMENT APP
  // ============================================================================
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col md:flex-row">
      {/* Toast Notification */}
      {noticeMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{noticeMessage}</span>
        </div>
      )}

      {/* Sidebar (Desktop) & Top Bar (Mobile) */}
      <aside className="w-full md:w-64 bg-[#065367] text-white flex flex-col shrink-0 md:min-h-screen">
        <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/10 rounded-lg border border-white/20 flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 fill-current text-amber-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">Sales Manager</h1>
              <span className="text-[10px] text-teal-200 block">Eksho Rokom Admin</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="md:hidden px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-2 md:p-3 flex md:flex-col gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2.5 whitespace-nowrap transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-white text-[#065367] shadow-sm'
                : 'text-teal-50 hover:bg-white/10'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'orders'
                ? 'bg-white text-[#065367] shadow-sm'
                : 'text-teal-50 hover:bg-white/10'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>Customer Orders</span>
            </span>
            <span
              className={`px-1.5 py-0.5 text-[10px] rounded-full font-extrabold ${
                activeTab === 'orders'
                  ? 'bg-[#065367] text-white'
                  : 'bg-white/20 text-white'
              }`}
            >
              {orders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`px-3 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'products'
                ? 'bg-white text-[#065367] shadow-sm'
                : 'text-teal-50 hover:bg-white/10'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Package className="w-4 h-4 shrink-0" />
              <span>Products &amp; Stock</span>
            </span>
            <span
              className={`px-1.5 py-0.5 text-[10px] rounded-full font-extrabold ${
                activeTab === 'products'
                  ? 'bg-[#065367] text-white'
                  : 'bg-white/20 text-white'
              }`}
            >
              {products.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('customers')}
            className={`px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2.5 whitespace-nowrap transition-colors ${
              activeTab === 'customers'
                ? 'bg-white text-[#065367] shadow-sm'
                : 'text-teal-50 hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Customers</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2.5 whitespace-nowrap transition-colors ${
              activeTab === 'reports'
                ? 'bg-white text-[#065367] shadow-sm'
                : 'text-teal-50 hover:bg-white/10'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>Sales Reports</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('delivery')}
            className={`px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2.5 whitespace-nowrap transition-colors ${
              activeTab === 'delivery'
                ? 'bg-white text-[#065367] shadow-sm'
                : 'text-teal-50 hover:bg-white/10'
            }`}
          >
            <Truck className="w-4 h-4 shrink-0" />
            <span>Delivery &amp; Settings</span>
          </button>
        </nav>

        <div className="hidden md:flex flex-col mt-auto p-4 border-t border-white/10 space-y-3">
          <div className="text-xs">
            <p className="font-bold text-white truncate">{session.name}</p>
            <p className="text-[11px] text-teal-200 truncate">{session.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {activeTab === 'dashboard' && 'Sales & Operations Overview'}
              {activeTab === 'orders' && 'Customer Orders & Status Management'}
              {activeTab === 'products' && 'Product Catalog, Prices & Inventory'}
              {activeTab === 'customers' && 'Customer Directory & Purchase History'}
              {activeTab === 'reports' && 'Date-Wise Sales & Revenue Reports'}
              {activeTab === 'delivery' && 'Delivery Charges, Payment & Store Info'}
            </h2>
            <p className="text-xs text-slate-500">
              Eksho Rokom Sales Management System
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'products' && (
              <button
                type="button"
                onClick={openAddProductModal}
                className="px-3.5 py-2 bg-[#065367] hover:bg-[#054354] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Product</span>
              </button>
            )}
          </div>
        </header>

        <main className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto">
          {/* =================================================================
              TAB 1: SALES DASHBOARD
             ================================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Primary KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Total Sales
                    </span>
                    <TrendingUp className="w-4 h-4 text-[#065367]" />
                  </div>
                  <p className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums">
                    ৳{dashboardMetrics.totalSalesAmount.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Active &amp; completed orders
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Revenue
                    </span>
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-lg sm:text-xl font-extrabold text-emerald-700 tabular-nums">
                    ৳{dashboardMetrics.completedRevenue.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Advance: ৳{dashboardMetrics.advanceCollected.toLocaleString()}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Total Orders
                    </span>
                    <ShoppingBag className="w-4 h-4 text-[#065367]" />
                  </div>
                  <p className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums">
                    {dashboardMetrics.totalOrders}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">All recorded orders</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                      Pending Orders
                    </span>
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-lg sm:text-xl font-extrabold text-amber-600 tabular-nums">
                    {dashboardMetrics.pendingOrders}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    New pending: {dashboardMetrics.strictlyPending}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                      Completed
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-lg sm:text-xl font-extrabold text-emerald-700 tabular-nums">
                    {dashboardMetrics.completedOrders}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Delivered parcels</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                      Cancelled
                    </span>
                    <XCircle className="w-4 h-4 text-rose-500" />
                  </div>
                  <p className="text-lg sm:text-xl font-extrabold text-rose-600 tabular-nums">
                    {dashboardMetrics.cancelledOrders}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Cancelled orders</p>
                </div>
              </div>

              {/* Recent Orders & Stock Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Orders Table */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Recent Customer Orders</h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-[#065367] hover:underline"
                    >
                      View All Orders →
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                          <th className="py-2.5 px-3 font-bold">Order ID</th>
                          <th className="py-2.5 px-3 font-bold">Customer</th>
                          <th className="py-2.5 px-3 font-bold">Total</th>
                          <th className="py-2.5 px-3 font-bold">Status</th>
                          <th className="py-2.5 px-3 font-bold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orders.slice(0, 6).map(ord => (
                          <tr key={ord.id} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-3 font-bold text-[#065367]">
                              {ord.orderNumber}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-900">
                                {ord.customer.fullName}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {ord.customer.mobileNumber}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900 tabular-nums">
                              ৳{ord.totalAmount}
                            </td>
                            <td className="py-2.5 px-3">
                              <select
                                value={ord.orderStatus}
                                onChange={e =>
                                  handleStatusChange(ord.id, e.target.value as OrderStatus)
                                }
                                className={`px-2 py-1 rounded border text-[11px] font-bold focus:outline-none ${getOrderStatusBadgeClass(
                                  ord.orderStatus
                                )}`}
                              >
                                {ORDER_STATUS_OPTIONS.map(st => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedOrderModal(ord)}
                                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold inline-flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Details</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                        {orders.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400">
                              No customer orders found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Inventory Summary & Low/Out of Stock */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
                  <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Inventory Status</h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('products')}
                      className="text-xs font-bold text-[#065367] hover:underline"
                    >
                      Manage Stock →
                    </button>
                  </div>

                  <div className="p-4 space-y-3 flex-1">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                        <span className="text-[11px] font-semibold text-emerald-800 block">
                          In Stock Products
                        </span>
                        <span className="text-lg font-extrabold text-emerald-900">
                          {products.length - dashboardMetrics.outOfStockCount}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                        <span className="text-[11px] font-semibold text-rose-800 block">
                          Out of Stock
                        </span>
                        <span className="text-lg font-extrabold text-rose-900">
                          {dashboardMetrics.outOfStockCount}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <h4 className="text-xs font-bold text-slate-700 mb-2">
                        Low / Out-of-Stock Items
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {products
                          .filter(p => p.stock <= 15)
                          .sort((a, b) => a.stock - b.stock)
                          .map(prod => (
                            <div
                              key={prod.id}
                              className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 truncate">
                                  {prod.name}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  Price: ৳{prod.sellingPrice} · Stock: {prod.stock}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleQuickStockToggle(prod)}
                                className={`px-2 py-1 rounded text-[10px] font-bold shrink-0 border ${
                                  prod.stock > 0
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                    : 'bg-rose-50 border-rose-300 text-rose-800'
                                }`}
                              >
                                {prod.stock > 0 ? 'In Stock' : 'Out of Stock'}
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 2: CUSTOMER ORDERS MANAGEMENT
             ================================================================= */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {/* Search & Filter Controls */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="lg:col-span-2 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={e => setOrderSearch(e.target.value)}
                    placeholder="Search Order ID (ER0987), customer name, phone, TrxID..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#065367]"
                  />
                </div>

                <div>
                  <select
                    value={orderStatusFilter}
                    onChange={e => setOrderStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#065367] font-semibold"
                  >
                    <option value="ALL">All Statuses</option>
                    {ORDER_STATUS_OPTIONS.map(st => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={orderAreaFilter}
                    onChange={e => setOrderAreaFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#065367] font-semibold"
                  >
                    <option value="ALL">All Delivery Areas</option>
                    <option value="Dhaka City">Dhaka City</option>
                    <option value="Dhaka Sub Urban">Dhaka Sub Urban</option>
                    <option value="Outside Dhaka">Outside Dhaka</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={orderDateFrom}
                    onChange={e => setOrderDateFrom(e.target.value)}
                    className="w-full px-2 py-2 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#065367]"
                    title="From Date"
                  />
                  <input
                    type="date"
                    value={orderDateTo}
                    onChange={e => setOrderDateTo(e.target.value)}
                    className="w-full px-2 py-2 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#065367]"
                    title="To Date"
                  />
                </div>
              </div>

              {/* Orders List */}
              <div className="space-y-3">
                {filteredOrders.map(ord => (
                  <div
                    key={ord.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-extrabold text-[#065367]">
                          {ord.orderNumber}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(ord.createdAt).toLocaleString()}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getOrderStatusBadgeClass(
                            ord.orderStatus
                          )}`}
                        >
                          {ord.orderStatus}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {ord.orderStatus !== 'Confirmed' &&
                          ord.orderStatus !== 'Delivered' &&
                          ord.orderStatus !== 'Cancelled' && (
                            <button
                              type="button"
                              onClick={() => handleConfirmOrder(ord.id)}
                              className="px-2.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 shadow-2xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Confirm</span>
                            </button>
                          )}

                        {ord.orderStatus !== 'Cancelled' && (
                          <button
                            type="button"
                            onClick={() => {
                              setCancelOrderTarget(ord);
                              setSelectedCancelPreset('Product is currently out of stock.');
                              setCustomCancelReason(ord.cancellationReason || '');
                            }}
                            className="px-2.5 py-1.5 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        )}

                        <select
                          value={ord.orderStatus}
                          onChange={e =>
                            handleStatusChange(ord.id, e.target.value as OrderStatus)
                          }
                          className="px-2.5 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#065367]"
                        >
                          {ORDER_STATUS_OPTIONS.map(st => (
                            <option key={st} value={st}>
                              Status: {st}
                            </option>
                          ))}
                        </select>

                        <select
                          value={ord.paymentStatus}
                          onChange={e =>
                            handlePaymentStatusChange(ord.id, e.target.value as PaymentStatus)
                          }
                          className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#065367]"
                        >
                          <option value="pending_verification">Payment: Pending Verify</option>
                          <option value="advance_paid">Payment: Advance Paid</option>
                          <option value="completed">Payment: Fully Paid</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => openOrderModalWithInit(ord)}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details / Edit</span>
                        </button>

                        {confirmDeleteOrderId === ord.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteOrder(ord.id)}
                              className="px-2 py-1 text-[11px] font-bold bg-rose-600 text-white rounded"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteOrderId(null)}
                              className="px-2 py-1 text-[11px] font-semibold bg-slate-100 text-slate-600 rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteOrderId(ord.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            title="Delete Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {ord.orderStatus === 'Cancelled' && ord.cancellationReason && (
                      <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2">
                        <div>
                          <span className="font-extrabold uppercase">CANCELLED 🔴 — Reason: </span>
                          <span className="font-semibold">{ord.cancellationReason}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCancelOrderTarget(ord);
                            setSelectedCancelPreset('CUSTOM');
                            setCustomCancelReason(ord.cancellationReason || '');
                          }}
                          className="text-[11px] font-bold text-rose-700 underline shrink-0"
                        >
                          Edit Reason
                        </button>
                      </div>
                    )}

                    {/* Customer & Financial Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          Customer &amp; Delivery
                        </p>
                        <p className="font-bold text-slate-900">{ord.customer.fullName}</p>
                        <p className="text-slate-600 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{ord.customer.mobileNumber}</span>
                        </p>
                        <p className="text-slate-600 flex items-start gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                          <span>
                            {ord.area} — {ord.customer.fullAddress}
                          </span>
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          Ordered Items ({ord.items.length})
                        </p>
                        <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                          {ord.items.map((item, i) => (
                            <div key={i} className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <span className="font-semibold text-slate-800">
                                  {item.productName}
                                </span>{' '}
                                <span className="text-slate-500">× {item.quantity}</span>
                                {(item.selectedColor || item.selectedSize) && (
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {item.selectedColor && (
                                      <span className="px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded font-semibold">
                                        Color: {item.selectedColor}
                                      </span>
                                    )}
                                    {item.selectedSize && (
                                      <span className="px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded font-semibold">
                                        Size: {item.selectedSize}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <span className="font-bold text-slate-900 shrink-0 tabular-nums">
                                ৳{item.subtotal}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          Payment &amp; Breakdown
                        </p>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Products Subtotal:</span>
                          <span className="font-semibold">৳{ord.itemsSubtotal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Delivery Advance:</span>
                          <span className="font-semibold text-emerald-700">
                            ৳{ord.deliveryCharge}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-1">
                          <span className="font-bold text-slate-800">Total Bill:</span>
                          <span className="font-extrabold text-[#065367]">
                            ৳{ord.totalAmount}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 pt-0.5">
                          TrxID:{' '}
                          <span className="font-bold text-slate-800">
                            {ord.trxId || 'N/A'}
                          </span>
                          {ord.senderPhone ? ` (${ord.senderPhone})` : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredOrders.length === 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-xs text-slate-400">
                    No orders match your current search or filter criteria.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 3: PRODUCTS, PRICES, VARIANTS & INVENTORY
             ================================================================= */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              {/* Filter Bar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder="Search products by name or description..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#065367]"
                  />
                </div>

                <div>
                  <select
                    value={productCategoryFilter}
                    onChange={e => setProductCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#065367] font-semibold"
                  >
                    <option value="ALL">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={productStockFilter}
                    onChange={e =>
                      setProductStockFilter(
                        e.target.value as 'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK'
                      )
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#065367] font-semibold"
                  >
                    <option value="ALL">All Stock Status</option>
                    <option value="IN_STOCK">In Stock Only</option>
                    <option value="OUT_OF_STOCK">Out of Stock Only</option>
                  </select>
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <th className="py-3 px-4 font-bold">Product</th>
                        <th className="py-3 px-3 font-bold">Price (৳)</th>
                        <th className="py-3 px-3 font-bold">Inventory Stock</th>
                        <th className="py-3 px-3 font-bold">Availability</th>
                        <th className="py-3 px-3 font-bold">Variants</th>
                        <th className="py-3 px-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.map(prod => {
                        const catName =
                          categories.find(c => c.id === prod.categoryId)?.name ||
                          prod.categoryId;
                        const hasVar =
                          prod.variants?.enabled &&
                          ((prod.variants.colorsEnabled &&
                            prod.variants.colors.length > 0) ||
                            (prod.variants.sizesEnabled &&
                              prod.variants.sizes.length > 0));

                        return (
                          <tr key={prod.id} className="hover:bg-slate-50/70">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={prod.images[0]}
                                  alt={prod.name}
                                  className="w-11 h-11 rounded-lg object-cover border border-slate-200 bg-slate-100 shrink-0"
                                />
                                <div className="min-w-0 max-w-xs">
                                  <p className="font-bold text-slate-900 truncate">
                                    {prod.name}
                                  </p>
                                  <p className="text-[11px] text-slate-500">{catName}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400 font-bold">৳</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={prod.sellingPrice}
                                  onChange={e =>
                                    handleQuickPriceChange(prod, Number(e.target.value))
                                  }
                                  className="w-20 px-2 py-1 text-xs font-bold bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-[#065367] tabular-nums"
                                />
                              </div>
                              {prod.originalPrice && (
                                <span className="text-[10px] text-slate-400 line-through block mt-0.5">
                                  Reg: ৳{prod.originalPrice}
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3">
                              <input
                                type="number"
                                min="0"
                                value={prod.stock}
                                onChange={e =>
                                  handleQuickStockChange(prod, Number(e.target.value))
                                }
                                className="w-20 px-2 py-1 text-xs font-bold bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-[#065367] tabular-nums"
                              />
                            </td>

                            <td className="py-3 px-3">
                              <button
                                type="button"
                                onClick={() => handleQuickStockToggle(prod)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                                  prod.stock > 0
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                    : 'bg-rose-50 border-rose-300 text-rose-800'
                                }`}
                              >
                                {prod.stock > 0 ? 'In Stock' : 'Out of Stock'}
                              </button>
                            </td>

                            <td className="py-3 px-3">
                              {hasVar ? (
                                <div className="text-[11px] text-slate-600 space-y-0.5">
                                  {prod.variants?.colorsEnabled &&
                                    prod.variants.colors.length > 0 && (
                                      <div>
                                        <span className="font-bold">Colors:</span>{' '}
                                        {prod.variants.colors.join(', ')}
                                      </div>
                                    )}
                                  {prod.variants?.sizesEnabled &&
                                    prod.variants.sizes.length > 0 && (
                                      <div>
                                        <span className="font-bold">Sizes:</span>{' '}
                                        {prod.variants.sizes.join(', ')}
                                      </div>
                                    )}
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400">None</span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditProductModal(prod)}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#065367]/10 hover:bg-[#065367]/20 text-[#065367] font-bold inline-flex items-center gap-1"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>

                                {confirmDeleteProductId === prod.id ? (
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteProduct(prod.id)}
                                      className="px-2 py-1 text-[11px] font-bold bg-rose-600 text-white rounded"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteProductId(null)}
                                      className="px-2 py-1 text-[11px] font-semibold bg-slate-100 text-slate-600 rounded"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteProductId(prod.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                                    title="Delete Product"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 4: CUSTOMERS DIRECTORY
             ================================================================= */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    placeholder="Search customers by name, mobile number, or address..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#065367]"
                  />
                </div>
                <div className="text-xs font-bold text-slate-600">
                  Total Unique Customers: {customersList.length}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <th className="py-3 px-4 font-bold">Customer Name</th>
                        <th className="py-3 px-3 font-bold">Mobile Number</th>
                        <th className="py-3 px-3 font-bold">Delivery Area &amp; Address</th>
                        <th className="py-3 px-3 font-bold">Orders</th>
                        <th className="py-3 px-3 font-bold">Total Spent</th>
                        <th className="py-3 px-4 font-bold text-right">Last Order</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customersList.map((cust, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {cust.fullName}
                          </td>
                          <td className="py-3 px-3 font-semibold text-[#065367]">
                            {cust.mobileNumber}
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            <span className="font-semibold text-slate-800">{cust.area}</span> —{' '}
                            {cust.fullAddress}
                          </td>
                          <td className="py-3 px-3 font-bold tabular-nums">
                            {cust.totalOrders}
                          </td>
                          <td className="py-3 px-3 font-extrabold text-slate-900 tabular-nums">
                            ৳{cust.totalSpent.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-500">
                            {new Date(cust.lastOrderDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                      {customersList.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            No customer records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 5: DATE-WISE SALES REPORTS & RECORDS
             ================================================================= */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              {/* Date Filter Bar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Calendar className="w-4 h-4 text-[#065367]" />
                    <span>Filter by Date Range:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={reportStartDate}
                      onChange={e => setReportStartDate(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#065367]"
                    />
                    <span className="text-xs text-slate-400">to</span>
                    <input
                      type="date"
                      value={reportEndDate}
                      onChange={e => setReportEndDate(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#065367]"
                    />
                    {(reportStartDate || reportEndDate) && (
                      <button
                        type="button"
                        onClick={() => {
                          setReportStartDate('');
                          setReportEndDate('');
                        }}
                        className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-xs font-bold text-[#065367]">
                  Showing {dateWiseSalesReport.rows.length} Sales Days
                </div>
              </div>

              {/* Period Totals */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block">
                    Period Gross Sales
                  </span>
                  <span className="text-lg font-extrabold text-[#065367] tabular-nums">
                    ৳{dateWiseSalesReport.totals.grossSales.toLocaleString()}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block">
                    Delivered Revenue
                  </span>
                  <span className="text-lg font-extrabold text-emerald-700 tabular-nums">
                    ৳{dateWiseSalesReport.totals.deliveredRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block">
                    Items Sold (Units)
                  </span>
                  <span className="text-lg font-extrabold text-slate-900 tabular-nums">
                    {dateWiseSalesReport.totals.itemsSold}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block">
                    Delivery Advance Collected
                  </span>
                  <span className="text-lg font-extrabold text-slate-900 tabular-nums">
                    ৳{dateWiseSalesReport.totals.deliveryCharges.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Date-wise Breakdown Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900">
                    Date-Wise Sales Report
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <th className="py-3 px-4 font-bold">Date</th>
                        <th className="py-3 px-3 font-bold">Total Orders</th>
                        <th className="py-3 px-3 font-bold">Items Sold</th>
                        <th className="py-3 px-3 font-bold">Delivered</th>
                        <th className="py-3 px-3 font-bold">Cancelled</th>
                        <th className="py-3 px-3 font-bold">Gross Sales</th>
                        <th className="py-3 px-4 font-bold text-right">Completed Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dateWiseSalesReport.rows.map(row => (
                        <tr key={row.date} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold text-slate-900">{row.date}</td>
                          <td className="py-3 px-3 font-semibold tabular-nums">
                            {row.totalOrders}
                          </td>
                          <td className="py-3 px-3 font-semibold tabular-nums">
                            {row.itemsSold}
                          </td>
                          <td className="py-3 px-3 font-bold text-emerald-700 tabular-nums">
                            {row.deliveredOrders}
                          </td>
                          <td className="py-3 px-3 font-bold text-rose-600 tabular-nums">
                            {row.cancelledOrders}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900 tabular-nums">
                            ৳{row.grossSales.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold text-[#065367] tabular-nums">
                            ৳{row.deliveredRevenue.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {dateWiseSalesReport.rows.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            No sales records found for the selected date range.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 6: DELIVERY CHARGES, PAYMENT NUMBERS & STORE SETTINGS
             ================================================================= */}
          {activeTab === 'delivery' && (
            <form onSubmit={handleSaveDeliveryAndStoreSettings} className="space-y-6">
              {/* Delivery Area Charge Rules */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#065367]" />
                    <span>Delivery Information &amp; Area Charges</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure base delivery charge (up to 1 kg) and additional per-kg charge.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {deliveryRules.map((rule, idx) => (
                    <div
                      key={rule.id}
                      className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3"
                    >
                      <p className="text-xs font-extrabold text-[#065367]">{rule.name}</p>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Base Charge Up to 1 KG (৳)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={rule.baseChargeUpTo1Kg}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setDeliveryRules(prev =>
                              prev.map((r, i) =>
                                i === idx ? { ...r, baseChargeUpTo1Kg: val } : r
                              )
                            );
                          }}
                          className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded focus:outline-none focus:border-[#065367]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Additional Per KG Charge (৳)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={rule.additionalPerKgCharge}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setDeliveryRules(prev =>
                              prev.map((r, i) =>
                                i === idx ? { ...r, additionalPerKgCharge: val } : r
                              )
                            );
                          }}
                          className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded focus:outline-none focus:border-[#065367]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advance Payment Numbers (bKash/Nagad/Rocket) */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#065367]" />
                    <span>Advance Payment Numbers (Checkout)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage mobile banking numbers displayed to customers during checkout.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {paymentNumbers.map(item => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap sm:flex-nowrap items-center gap-2"
                    >
                      <input
                        type="text"
                        value={item.number}
                        onChange={e =>
                          setPaymentNumbers(prev =>
                            prev.map(p =>
                              p.id === item.id ? { ...p, number: e.target.value } : p
                            )
                          )
                        }
                        className="w-full sm:w-44 px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded"
                      />
                      <input
                        type="text"
                        value={item.label}
                        onChange={e =>
                          setPaymentNumbers(prev =>
                            prev.map(p =>
                              p.id === item.id ? { ...p, label: e.target.value } : p
                            )
                          )
                        }
                        className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPaymentNumbers(prev =>
                            prev.map(p =>
                              p.id === item.id ? { ...p, enabled: !p.enabled } : p
                            )
                          )
                        }
                        className={`px-2.5 py-1.5 rounded text-xs font-bold border flex items-center gap-1 ${
                          item.enabled
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-slate-100 border-slate-200 text-slate-500'
                        }`}
                      >
                        {item.enabled ? (
                          <>
                            <ToggleRight className="w-4 h-4" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4" />
                            <span>Hidden</span>
                          </>
                        )}
                      </button>
                      {paymentNumbers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeletePaymentNumber(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={newPaymentNum}
                    onChange={e => setNewPaymentNum(e.target.value)}
                    placeholder="New number (e.g. 01812345678)"
                    className="w-full sm:w-48 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                  <input
                    type="text"
                    value={newPaymentLabel}
                    onChange={e => setNewPaymentLabel(e.target.value)}
                    placeholder="Label (bKash / Nagad / Rocket)"
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleAddPaymentNumber}
                    className="px-3.5 py-2 text-xs font-bold text-white bg-[#065367] hover:bg-[#054354] rounded-lg flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Number</span>
                  </button>
                </div>
              </div>

              {/* Store Information & Footer Sections */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#065367]" />
                  <span>Store Banner &amp; Footer Information</span>
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Top Announcement Bar Text
                  </label>
                  <input
                    type="text"
                    value={announcementText}
                    onChange={e => setAnnouncementText(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {footerSections.map(sec => (
                    <div
                      key={sec.id}
                      className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2"
                    >
                      <input
                        type="text"
                        value={sec.title}
                        onChange={e =>
                          setFooterSections(prev =>
                            prev.map(s =>
                              s.id === sec.id ? { ...s, title: e.target.value } : s
                            )
                          )
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded"
                      />
                      <textarea
                        rows={2}
                        value={sec.content}
                        onChange={e =>
                          setFooterSections(prev =>
                            prev.map(s =>
                              s.id === sec.id ? { ...s, content: e.target.value } : s
                            )
                          )
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Security Credentials */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#065367]" />
                  <span>Admin Login Credentials</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Admin Email
                    </label>
                    <input
                      type="email"
                      value={adminCredEmail}
                      onChange={e => setAdminCredEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      New Admin Password (leave blank to keep current)
                    </label>
                    <input
                      type="password"
                      value={adminCredPassword}
                      onChange={e => setAdminCredPassword(e.target.value)}
                      placeholder="Enter new password to update"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#065367] hover:bg-[#054354] text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save All Settings</span>
                </button>
              </div>
            </form>
          )}
        </main>
      </div>

      {/* =====================================================================
          MODAL: ORDER DETAILS VIEW
         ===================================================================== */}
      {selectedOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-4 py-3.5 bg-[#065367] text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">
                  Order {selectedOrderModal.orderNumber}
                </h3>
                <p className="text-[11px] text-teal-100">
                  Placed on {new Date(selectedOrderModal.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderModal(null)}
                className="p-1 text-teal-100 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {selectedOrderModal.orderStatus === 'Cancelled' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 space-y-1">
                  <p className="font-extrabold uppercase">Order Status: CANCELLED 🔴</p>
                  <p>
                    <span className="font-bold">Reason: </span>
                    <span>{selectedOrderModal.cancellationReason || 'Cancelled by Admin'}</span>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      Customer Details
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditCustomerName(selectedOrderModal.customer.fullName);
                        setEditCustomerPhone(selectedOrderModal.customer.mobileNumber);
                        setEditCustomerArea(selectedOrderModal.area);
                        setEditCustomerAddress(selectedOrderModal.customer.fullAddress);
                        setEditTrxId(selectedOrderModal.trxId || '');
                        setEditOrderNote(selectedOrderModal.orderNote || '');
                        setEditingOrderDetails(prev => !prev);
                      }}
                      className="text-[11px] font-bold text-[#065367] hover:underline flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{editingOrderDetails ? 'Cancel Edit' : 'Edit Info'}</span>
                    </button>
                  </div>

                  {editingOrderDetails ? (
                    <form onSubmit={handleSaveEditedOrderDetails} className="space-y-2 pt-1">
                      <input
                        type="text"
                        required
                        value={editCustomerName}
                        onChange={e => setEditCustomerName(e.target.value)}
                        placeholder="Customer Name"
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded font-semibold"
                      />
                      <input
                        type="text"
                        required
                        value={editCustomerPhone}
                        onChange={e => setEditCustomerPhone(e.target.value)}
                        placeholder="Mobile Number"
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded font-semibold"
                      />
                      <select
                        value={editCustomerArea}
                        onChange={e =>
                          setEditCustomerArea(e.target.value as Order['area'])
                        }
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded font-semibold"
                      >
                        <option value="Dhaka City">Dhaka City</option>
                        <option value="Dhaka Sub Urban">Dhaka Sub Urban</option>
                        <option value="Outside Dhaka">Outside Dhaka</option>
                      </select>
                      <input
                        type="text"
                        required
                        value={editCustomerAddress}
                        onChange={e => setEditCustomerAddress(e.target.value)}
                        placeholder="Full Address"
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded"
                      />
                      <input
                        type="text"
                        value={editTrxId}
                        onChange={e => setEditTrxId(e.target.value)}
                        placeholder="TrxID"
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded"
                      />
                      <button
                        type="submit"
                        className="w-full py-1.5 bg-[#065367] text-white font-bold rounded text-xs"
                      >
                        Save Order Changes
                      </button>
                    </form>
                  ) : (
                    <>
                      <p className="font-bold text-slate-900">
                        {selectedOrderModal.customer.fullName}
                      </p>
                      <p className="text-slate-700">
                        Phone: {selectedOrderModal.customer.mobileNumber}
                      </p>
                      <p className="text-slate-700">Area: {selectedOrderModal.area}</p>
                      <p className="text-slate-700">
                        Address: {selectedOrderModal.customer.fullAddress}
                      </p>
                    </>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Order &amp; Payment Status
                  </p>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Order Status
                    </label>
                    <select
                      value={selectedOrderModal.orderStatus}
                      onChange={e =>
                        handleStatusChange(
                          selectedOrderModal.id,
                          e.target.value as OrderStatus
                        )
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded"
                    >
                      {ORDER_STATUS_OPTIONS.map(st => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleConfirmOrder(selectedOrderModal.id)}
                      className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px]"
                    >
                      Confirm Order
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCancelOrderTarget(selectedOrderModal);
                        setSelectedCancelPreset('Product is currently out of stock.');
                        setCustomCancelReason(selectedOrderModal.cancellationReason || '');
                      }}
                      className="flex-1 py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-[11px]"
                    >
                      Cancel Order
                    </button>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      TrxID: {selectedOrderModal.trxId || 'N/A'}
                    </label>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 font-bold text-slate-700 border-b border-slate-200">
                  Ordered Items ({selectedOrderModal.items.length})
                </div>
                <div className="divide-y divide-slate-100">
                  {selectedOrderModal.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{item.productName}</p>
                        <p className="text-[11px] text-slate-500">
                          ৳{item.unitPrice} × {item.quantity}
                        </p>
                        {(item.selectedColor || item.selectedSize) && (
                          <div className="flex gap-1.5 mt-1">
                            {item.selectedColor && (
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-semibold">
                                Color: {item.selectedColor}
                              </span>
                            )}
                            {item.selectedSize && (
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-semibold">
                                Size: {item.selectedSize}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="font-extrabold text-slate-900 tabular-nums">
                        ৳{item.subtotal}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">Products Subtotal:</span>
                  <span className="font-bold">৳{selectedOrderModal.itemsSubtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Delivery Charge (Advance):</span>
                  <span className="font-bold text-emerald-700">
                    ৳{selectedOrderModal.deliveryCharge}
                  </span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-200 text-sm">
                  <span className="font-bold text-slate-900">Total Order Value:</span>
                  <span className="font-extrabold text-[#065367]">
                    ৳{selectedOrderModal.totalAmount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: CANCEL ORDER WITH CANCELLATION REASON
         ===================================================================== */}
      {cancelOrderTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-4 py-3.5 bg-rose-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">
                  Cancel Order {cancelOrderTarget.orderNumber}
                </h3>
                <p className="text-[11px] text-rose-100">
                  Select or write a cancellation reason for the customer
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCancelOrderTarget(null)}
                className="p-1 text-rose-100 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCancelOrder} className="p-4 space-y-3.5 text-xs">
              <div className="space-y-2">
                <label className="block font-bold text-slate-800">
                  Select Cancellation Reason *
                </label>
                {[
                  {
                    value: 'Product is currently out of stock.',
                    label: 'Product Out of Stock (পণ্যটি বর্তমানে স্টকে নেই)',
                  },
                  {
                    value: 'Cancelled upon customer request.',
                    label: 'Customer Request (গ্রাহকের অনুরোধে বাতিল)',
                  },
                  {
                    value: 'Wrong order or delivery information provided.',
                    label: 'Wrong Order Information (ভুল অর্ডার বা তথ্য)',
                  },
                  {
                    value: 'Delivery issue in the requested location.',
                    label: 'Delivery Issue (ডেলিভারি সমস্যা)',
                  },
                  {
                    value: 'CUSTOM',
                    label: 'Custom Reason (অন্য কোনো কারণ লিখুন)',
                  },
                ].map(opt => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      selectedCancelPreset === opt.value
                        ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancellationReasonPreset"
                      value={opt.value}
                      checked={selectedCancelPreset === opt.value}
                      onChange={e => setSelectedCancelPreset(e.target.value)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>

              {selectedCancelPreset === 'CUSTOM' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Write Custom Cancellation Reason *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={customCancelReason}
                    onChange={e => setCustomCancelReason(e.target.value)}
                    placeholder="e.g., Product is currently out of stock."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCancelOrderTarget(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Confirm Cancellation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: ADD / EDIT PRODUCT & VARIANTS
         ===================================================================== */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-4 py-3.5 bg-[#065367] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {productForm.id ? 'Edit Product & Variants' : 'Add New Product'}
              </h3>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="p-1 text-teal-100 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSaveProductModal}
              className="p-4 overflow-y-auto space-y-4 text-xs flex-1"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={e =>
                      setProductForm(prev => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g., High-Density White PVC Foam Board (2mm, A3)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#065367] font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={productForm.categoryId}
                    onChange={e =>
                      setProductForm(prev => ({ ...prev, categoryId: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Product Image URL
                  </label>
                  <input
                    type="text"
                    value={productForm.imageUrl}
                    onChange={e =>
                      setProductForm(prev => ({ ...prev, imageUrl: e.target.value }))
                    }
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Selling Price (৳) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.sellingPrice}
                    onChange={e =>
                      setProductForm(prev => ({
                        ...prev,
                        sellingPrice: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Regular / Strike Price (৳, Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.originalPrice}
                    onChange={e =>
                      setProductForm(prev => ({
                        ...prev,
                        originalPrice: e.target.value,
                      }))
                    }
                    placeholder="Optional"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.stock}
                    onChange={e =>
                      setProductForm(prev => ({
                        ...prev,
                        stock: Math.max(0, Number(e.target.value)),
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Availability Status
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setProductForm(prev => ({
                          ...prev,
                          stock: prev.stock > 0 ? prev.stock : 20,
                        }))
                      }
                      className={`flex-1 py-2 rounded-lg font-bold border ${
                        productForm.stock > 0
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-white border-slate-200 text-slate-500'
                      }`}
                    >
                      In Stock
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductForm(prev => ({ ...prev, stock: 0 }))}
                      className={`flex-1 py-2 rounded-lg font-bold border ${
                        productForm.stock <= 0
                          ? 'bg-rose-50 border-rose-300 text-rose-800'
                          : 'bg-white border-slate-200 text-slate-500'
                      }`}
                    >
                      Out of Stock
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Product Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={productForm.description}
                    onChange={e =>
                      setProductForm(prev => ({ ...prev, description: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Variants Section */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">
                      Product Variants (Color &amp; Size)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Enable Color and/or Size selection for this product
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setProductForm(prev => ({
                        ...prev,
                        variants: {
                          ...prev.variants,
                          enabled: !prev.variants.enabled,
                        },
                      }))
                    }
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 border ${
                      productForm.variants.enabled
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    {productForm.variants.enabled ? (
                      <>
                        <ToggleRight className="w-4 h-4" />
                        <span>Enabled</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4" />
                        <span>Disabled</span>
                      </>
                    )}
                  </button>
                </div>

                {productForm.variants.enabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {/* Colors */}
                    <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">Colors</span>
                        <input
                          type="checkbox"
                          checked={productForm.variants.colorsEnabled}
                          onChange={e =>
                            setProductForm(prev => ({
                              ...prev,
                              variants: {
                                ...prev.variants,
                                colorsEnabled: e.target.checked,
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={newColorInput}
                          onChange={e => setNewColorInput(e.target.value)}
                          placeholder="Add color (e.g. Black)"
                          className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded"
                        />
                        <button
                          type="button"
                          onClick={addFormColor}
                          className="px-2.5 py-1 bg-[#065367] text-white font-bold rounded"
                        >
                          Add
                        </button>
                      </div>
                      <div className="space-y-1 max-h-36 overflow-y-auto">
                        {productForm.variants.colors.map((c, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-200"
                          >
                            <input
                              type="text"
                              value={c}
                              onChange={e => {
                                const val = e.target.value;
                                setProductForm(prev => {
                                  const next = [...prev.variants.colors];
                                  next[idx] = val;
                                  return {
                                    ...prev,
                                    variants: { ...prev.variants, colors: next },
                                  };
                                });
                              }}
                              className="flex-1 bg-white px-1.5 py-0.5 rounded border border-slate-200"
                            />
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() =>
                                setProductForm(prev => {
                                  const next = [...prev.variants.colors];
                                  [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                                  return {
                                    ...prev,
                                    variants: { ...prev.variants, colors: next },
                                  };
                                })
                              }
                              className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === productForm.variants.colors.length - 1}
                              onClick={() =>
                                setProductForm(prev => {
                                  const next = [...prev.variants.colors];
                                  [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                                  return {
                                    ...prev,
                                    variants: { ...prev.variants, colors: next },
                                  };
                                })
                              }
                              className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setProductForm(prev => ({
                                  ...prev,
                                  variants: {
                                    ...prev.variants,
                                    colors: prev.variants.colors.filter((_, i) => i !== idx),
                                  },
                                }))
                              }
                              className="p-0.5 text-rose-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sizes */}
                    <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">Sizes</span>
                        <input
                          type="checkbox"
                          checked={productForm.variants.sizesEnabled}
                          onChange={e =>
                            setProductForm(prev => ({
                              ...prev,
                              variants: {
                                ...prev.variants,
                                sizesEnabled: e.target.checked,
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={newSizeInput}
                          onChange={e => setNewSizeInput(e.target.value)}
                          placeholder="Add size (e.g. A3 / Large)"
                          className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded"
                        />
                        <button
                          type="button"
                          onClick={addFormSize}
                          className="px-2.5 py-1 bg-[#065367] text-white font-bold rounded"
                        >
                          Add
                        </button>
                      </div>
                      <div className="space-y-1 max-h-36 overflow-y-auto">
                        {productForm.variants.sizes.map((s, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-200"
                          >
                            <input
                              type="text"
                              value={s}
                              onChange={e => {
                                const val = e.target.value;
                                setProductForm(prev => {
                                  const next = [...prev.variants.sizes];
                                  next[idx] = val;
                                  return {
                                    ...prev,
                                    variants: { ...prev.variants, sizes: next },
                                  };
                                });
                              }}
                              className="flex-1 bg-white px-1.5 py-0.5 rounded border border-slate-200"
                            />
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() =>
                                setProductForm(prev => {
                                  const next = [...prev.variants.sizes];
                                  [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                                  return {
                                    ...prev,
                                    variants: { ...prev.variants, sizes: next },
                                  };
                                })
                              }
                              className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === productForm.variants.sizes.length - 1}
                              onClick={() =>
                                setProductForm(prev => {
                                  const next = [...prev.variants.sizes];
                                  [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                                  return {
                                    ...prev,
                                    variants: { ...prev.variants, sizes: next },
                                  };
                                })
                              }
                              className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setProductForm(prev => ({
                                  ...prev,
                                  variants: {
                                    ...prev.variants,
                                    sizes: prev.variants.sizes.filter((_, i) => i !== idx),
                                  },
                                }))
                              }
                              className="p-0.5 text-rose-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#065367] hover:bg-[#054354] text-white font-bold flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{productForm.id ? 'Update Product' : 'Save Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
