import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Copy,
  Check,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { buildCartItemKey, DeliveryAreaType, PaymentNumberItem } from '../types';
import { deliveryService } from '../services/DeliveryService';
import { paymentService, PaymentBreakdown } from '../services/PaymentService';
import { orderService } from '../services/OrderService';

interface CheckoutPageProps {
  navigate: (path: string) => void;
}

const AREA_OPTIONS: DeliveryAreaType[] = [
  'Dhaka City',
  'Dhaka Sub Urban',
  'Outside Dhaka',
];

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ navigate }) => {
  const { items, directCheckoutItem, clearCart, clearDirectOrder } = useCart();
  const { language, localizeProduct, localizeArea } = useLanguage();

  const checkoutItems = directCheckoutItem ? [directCheckoutItem] : items;

  // Form states
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [selectedArea, setSelectedArea] = useState<DeliveryAreaType | ''>('');
  const [fullAddress, setFullAddress] = useState('');
  const [orderNote, setOrderNote] = useState('');

  // Payment states
  const [trxId, setTrxId] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Data states
  const [activePaymentNumbers, setActivePaymentNumbers] = useState<PaymentNumberItem[]>([]);
  const [deliveryCharge, setDeliveryCharge] = useState<number>(0);
  const [breakdown, setBreakdown] = useState<PaymentBreakdown>({
    itemsSubtotal: 0,
    deliveryCharge: 0,
    totalAmount: 0,
    advanceAmountRequired: 0,
    remainingAmountDue: 0,
    paymentStatus: 'pending_verification',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const subtotal = checkoutItems.reduce((acc, it) => acc + it.subtotal, 0);

  const loadPaymentNumbers = async () => {
    try {
      const nums = await paymentService.getActivePaymentNumbers();
      setActivePaymentNumbers(nums);
    } catch (err) {
      console.error('Failed to load payment numbers', err);
    }
  };

  useEffect(() => {
    loadPaymentNumbers();
    const handlePaymentUpdate = () => loadPaymentNumbers();
    window.addEventListener('payment-config-updated', handlePaymentUpdate);
    return () => window.removeEventListener('payment-config-updated', handlePaymentUpdate);
  }, []);

  // Automatically calculate delivery charge based on Selected Area + internal total weight
  useEffect(() => {
    const updateDeliveryCharge = async () => {
      if (checkoutItems.length === 0 || !selectedArea) {
        setDeliveryCharge(0);
        return;
      }
      try {
        const charge = await deliveryService.calculateDeliveryCharge(
          selectedArea,
          checkoutItems
        );
        setDeliveryCharge(charge);
      } catch (err) {
        console.error('Failed to calculate delivery charge', err);
      }
    };
    updateDeliveryCharge();
  }, [selectedArea, checkoutItems]);

  // Update Payment Breakdown
  useEffect(() => {
    const updateBreakdown = async () => {
      try {
        const bd = await paymentService.calculatePaymentBreakdown(
          subtotal,
          deliveryCharge
        );
        setBreakdown(bd);
      } catch (err) {
        console.error('Failed to calculate breakdown', err);
      }
    };
    updateBreakdown();
  }, [subtotal, deliveryCharge]);

  const handleCopyNumber = (id: string, rawNum: string) => {
    navigator.clipboard.writeText(rawNum);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  if (checkoutItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-slate-800">
          {language === 'bn' ? 'আপনার কার্ট খালি' : 'Your Cart is Empty'}
        </h2>
        <button
          onClick={() => navigate('products')}
          className="mt-4 px-5 py-2 text-xs font-semibold text-white bg-[#065367] rounded-lg"
        >
          {language === 'bn' ? 'পণ্য দেখুন' : 'Shop Products'}
        </button>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg(
        language === 'bn'
          ? 'অনুগ্রহ করে আপনার সম্পূর্ণ নাম লিখুন।'
          : 'Please enter your Full Name.'
      );
      return;
    }

    const cleanPhone = mobileNumber.trim();
    if (!cleanPhone || cleanPhone.length < 11) {
      setErrorMsg(
        language === 'bn'
          ? 'অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন।'
          : 'Please enter a valid 11-digit Mobile Number.'
      );
      return;
    }

    if (!selectedArea) {
      setErrorMsg(
        language === 'bn'
          ? 'অনুগ্রহ করে আপনার ডেলিভারি এরিয়া নির্বাচন করুন।'
          : 'Please select an Area.'
      );
      return;
    }

    if (!fullAddress.trim()) {
      setErrorMsg(
        language === 'bn'
          ? 'অনুগ্রহ করে আপনার সম্পূর্ণ ঠিকানা লিখুন।'
          : 'Please enter your Delivery Address.'
      );
      return;
    }

    if (!trxId.trim()) {
      setErrorMsg(
        language === 'bn'
          ? 'অনুগ্রহ করে বিকাশ / নগদ / রকেট ট্রানজেকশন আইডি (TrxID) লিখুন।'
          : 'Please enter the bKash / Nagad / Rocket Transaction ID (TrxID).'
      );
      return;
    }

    setLoading(true);

    try {
      const order = await orderService.createOrder({
        customer: {
          fullName: fullName.trim(),
          mobileNumber: cleanPhone,
          area: selectedArea,
          fullAddress: fullAddress.trim(),
          orderNote: orderNote.trim() || undefined,
        },
        items: checkoutItems,
        area: selectedArea,
        trxId: trxId.trim(),
        senderPhone: senderPhone.trim() || undefined,
        orderNote: orderNote.trim() || undefined,
      });

      if (directCheckoutItem) {
        clearDirectOrder();
      } else {
        clearCart();
      }

      navigate(`order-confirmation?orderNumber=${order.orderNumber}`);
    } catch (err) {
      console.error('Order creation error', err);
      setErrorMsg(
        language === 'bn'
          ? 'অর্ডার সম্পন্ন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
          : 'Failed to process order. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
          {language === 'bn' ? 'চেকআউট' : 'Checkout'}
        </h1>
        <button
          onClick={() => (directCheckoutItem ? navigate('products') : navigate('cart'))}
          className="text-xs font-semibold text-[#065367] hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>
            {directCheckoutItem
              ? language === 'bn'
                ? 'পণ্যের পেজে ফিরুন'
                : 'Back to Products'
              : language === 'bn'
              ? 'কার্টে ফিরুন'
              : 'Back to Cart'}
          </span>
        </button>
      </div>

      <form onSubmit={handlePlaceOrder} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Left Column: Compact Shipping & Payment */}
          <div className="lg:col-span-7 space-y-3.5">
            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Shipping Details */}
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                {language === 'bn' ? 'ডেলিভারি তথ্য' : 'Shipping Details'}
              </h2>

              {/* Full Name & Mobile Number side-by-side in ONE ROW */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    {language === 'bn' ? 'সম্পূর্ণ নাম' : 'Full Name'}{' '}
                    <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'bn' ? 'আপনার নাম' : 'Full Name'}
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#065367] focus:border-[#065367]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    {language === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number'}{' '}
                    <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="017XXXXXXXX"
                    value={mobileNumber}
                    onChange={e => setMobileNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#065367] focus:border-[#065367]"
                  />
                </div>
              </div>

              {/* Single Area Dropdown: No default selected */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  {language === 'bn' ? 'এরিয়া' : 'Area'} <span className="text-rose-600">*</span>
                </label>
                <select
                  required
                  value={selectedArea}
                  onChange={e => setSelectedArea(e.target.value as DeliveryAreaType | '')}
                  className={`w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#065367] focus:border-[#065367] ${
                    !selectedArea ? 'text-slate-400' : 'text-slate-800'
                  }`}
                >
                  <option value="" disabled>
                    {language === 'bn' ? 'এরিয়া নির্বাচন করুন' : 'Select Area'}
                  </option>
                  {AREA_OPTIONS.map(areaOpt => (
                    <option key={areaOpt} value={areaOpt} className="text-slate-800">
                      {localizeArea(areaOpt)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Full Address (Two-line textarea) */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  {language === 'bn' ? 'সম্পূর্ণ ঠিকানা' : 'Full Address'}{' '}
                  <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder={
                    language === 'bn'
                      ? 'বাসা নং, রোড, এলাকা, জেলা...'
                      : 'House, Road, Area, District...'
                  }
                  value={fullAddress}
                  onChange={e => setFullAddress(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#065367] focus:border-[#065367] resize-none leading-relaxed"
                />
              </div>

              {/* Optional Order Note */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  {language === 'bn' ? 'অর্ডার নোট (ঐচ্ছিক)' : 'Order Note (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder={
                    language === 'bn'
                      ? 'ডেলিভারি সম্পর্কিত কোনো বিশেষ নির্দেশনা থাকলে লিখুন...'
                      : 'Special delivery instructions...'
                  }
                  value={orderNote}
                  onChange={e => setOrderNote(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#065367] focus:border-[#065367]"
                />
              </div>
            </div>

            {/* 2. Payment Method (Admin-managed Payment Numbers for bKash / Nagad / Rocket) */}
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-start sm:items-center justify-between gap-4 sm:gap-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 leading-snug">
                  {language === 'bn'
                    ? 'পেমেন্ট পদ্ধতি (অগ্রিম ডেলিভারি চার্জ)'
                    : 'Payment Method (Advance Delivery Charge)'}
                </h2>
                <span className="text-xs font-bold text-[#065367] tabular-nums whitespace-nowrap shrink-0 bg-[#065367]/10 px-2.5 py-1 rounded-md text-right">
                  {selectedArea
                    ? language === 'bn'
                      ? `এখন পরিশোধ করুন ৳${deliveryCharge.toLocaleString()}`
                      : `Pay ৳${deliveryCharge.toLocaleString()} Now`
                    : language === 'bn'
                    ? 'আগে এরিয়া নির্বাচন করুন'
                    : 'Select Area First'}
                </span>
              </div>

              {/* Dynamic Payment Number(s) from Admin Panel */}
              <div
                className={`grid gap-2.5 ${
                  activePaymentNumbers.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
                }`}
              >
                {activePaymentNumbers.map(item => {
                  const isCopied = copiedId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-[#065367] uppercase tracking-wide block">
                          {item.label || 'bKash / Nagad / Rocket (Send Money)'}
                        </span>
                        <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight tabular-nums block mt-0.5">
                          {item.number}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyNumber(item.id, item.number)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 border transition-colors shrink-0 ${
                          isCopied
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-[#065367] hover:text-[#065367]'
                        }`}
                        title={language === 'bn' ? 'নম্বর কপি করুন' : 'Copy payment number'}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{language === 'bn' ? 'কপি হয়েছে' : 'Copied'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? 'কপি' : 'Copy'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* TrxID & Sender Phone in ONE ROW */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    {language === 'bn' ? 'ট্রানজেকশন আইডি (TrxID)' : 'Transaction ID (TrxID)'}{' '}
                    <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'bn' ? 'যেমন: 9J3K8LM2' : 'e.g., 9J3K8LM2'}
                    value={trxId}
                    onChange={e => setTrxId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#065367] uppercase"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    {language === 'bn' ? 'প্রেরকের নম্বর (ঐচ্ছিক)' : 'Sender Number (Optional)'}
                  </label>
                  <input
                    type="tel"
                    placeholder="017XXXXXXXX"
                    value={senderPhone}
                    onChange={e => setSenderPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#065367]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Compact Order Summary with Strictly Right-Aligned Amounts */}
          <div className="lg:col-span-5">
            <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200 space-y-3 sticky top-20">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2">
                {language === 'bn'
                  ? `অর্ডার সামারি (${checkoutItems.length}টি পণ্য)`
                  : `Order Summary (${checkoutItems.length} ${
                      checkoutItems.length === 1 ? 'product' : 'products'
                    })`}
              </h3>

              {/* Compact Items List — Scrollbar positioned slightly toward the right side (-mr-2.5 pr-2.5) so it never overlaps text or prices */}
              <div className="space-y-2 max-h-56 overflow-y-auto divide-y divide-slate-200/60 order-summary-scroll -mr-2.5 pr-2.5">
                {checkoutItems.map(it => {
                  const localizedProd = localizeProduct(it.product);
                  const itemKey =
                    it.cartItemId ||
                    buildCartItemKey(it.productId, it.selectedColor, it.selectedSize);
                  return (
                    <div
                      key={itemKey}
                      className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <img
                          src={it.product.images[0]}
                          alt={localizedProd.name}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900 truncate">
                            {localizedProd.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                            <span>
                              {language === 'bn'
                                ? `পরিমাণ: ${it.quantity}`
                                : `Qty: ${it.quantity}`}
                            </span>
                            {it.selectedColor && (
                              <span className="text-slate-600">
                                · {language === 'bn' ? 'কালার:' : 'Color:'} {it.selectedColor}
                              </span>
                            )}
                            {it.selectedSize && (
                              <span className="text-slate-600">
                                · {language === 'bn' ? 'সাইজ:' : 'Size:'} {it.selectedSize}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right w-28 shrink-0">
                        <div className="font-bold text-slate-900 tabular-nums text-right leading-tight">
                          ৳{it.subtotal.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400 tabular-nums text-right leading-tight">
                          ৳{it.unitPrice.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary Breakdown — Consolidated Delivery Charge (Advance) & Prominent COD Amount, all sharing the exact right edge */}
              <div className="border-t border-slate-200 pt-2.5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600 py-0.5">
                  <span>{language === 'bn' ? 'পণ্যের মোট মূল্য' : 'Product Subtotal'}</span>
                  <span className="font-semibold text-slate-900 tabular-nums text-right w-28 shrink-0">
                    ৳{subtotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-amber-900 font-semibold bg-amber-50/80 py-1.5 border-y border-amber-200/70">
                  <span>
                    {language === 'bn'
                      ? 'ডেলিভারি চার্জ (অগ্রিম পরিশোধযোগ্য)'
                      : 'Delivery Charge (Advance Payable)'}
                  </span>
                  <span className="font-bold tabular-nums text-right w-28 shrink-0">
                    {selectedArea
                      ? `৳${deliveryCharge.toLocaleString()}`
                      : language === 'bn'
                      ? 'এরিয়া নির্বাচন করুন'
                      : 'Select Area'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-900 font-bold pt-1.5 border-t border-slate-200">
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold text-[#065367] block">
                      {language === 'bn' ? 'ক্যাশ অন ডেলিভারি (COD)' : 'COD Amount'}
                    </span>
                    <span className="text-[10px] font-medium text-slate-500 block">
                      {language === 'bn' ? 'পণ্য হাতে পেয়ে পরিশোধযোগ্য' : 'Payable upon delivery'}
                    </span>
                  </div>
                  <span className="text-sm sm:text-base font-extrabold text-[#065367] tabular-nums text-right w-28 shrink-0">
                    ৳{breakdown.remainingAmountDue.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 text-xs sm:text-sm font-bold text-white bg-[#065367] hover:bg-[#086982] rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <span>{language === 'bn' ? 'প্রসেসিং হচ্ছে...' : 'Processing...'}</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>{language === 'bn' ? 'অর্ডার কনফার্ম করুন' : 'Confirm Order'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
