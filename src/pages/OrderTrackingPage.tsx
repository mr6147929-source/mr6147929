import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
  CreditCard,
  MapPin,
  Copy,
  Check,
  Hash,
  Smartphone,
  Globe,
  ChevronDown,
} from 'lucide-react';
import { Order, OrderStatusConfigItem } from '../types';
import { orderService } from '../services/OrderService';
import { useLanguage } from '../context/LanguageContext';

interface OrderTrackingPageProps {
  initialOrderNumber?: string;
  navigate: (path: string) => void;
}

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({
  initialOrderNumber,
}) => {
  const {
    language,
    setLanguage,
    localizeArea,
    localizeOrderStatus,
    localizeProductNameById,
  } = useLanguage();
  const [languageOpen, setLanguageOpen] = useState(true);
  const [trackingMode, setTrackingMode] = useState<'orderNumber' | 'mobileNumber'>('orderNumber');
  const [searchInput, setSearchInput] = useState(initialOrderNumber || '');
  const [matchedOrders, setMatchedOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [copiedOrderNum, setCopiedOrderNum] = useState(false);

  const handleTrack = async (customQuery?: string, modeOverride?: 'orderNumber' | 'mobileNumber') => {
    const query = (customQuery !== undefined ? customQuery : searchInput).trim();
    if (!query) return;

    const activeMode = modeOverride || trackingMode;
    setLoading(true);
    setNotFound(false);

    try {
      let results: Order[] = [];
      if (activeMode === 'orderNumber') {
        const byOrder = await orderService.getOrderByNumber(query);
        if (byOrder) {
          results = [byOrder];
        } else {
          // Fallback check if user entered mobile number in order number tab
          results = await orderService.getOrdersByMobile(query);
        }
      } else {
        results = await orderService.getOrdersByMobile(query);
        if (results.length === 0) {
          const byOrder = await orderService.getOrderByNumber(query);
          if (byOrder) results = [byOrder];
        }
      }

      if (results.length > 0) {
        setMatchedOrders(results);
        setSelectedOrder(results[0]);
      } else {
        setMatchedOrders([]);
        setSelectedOrder(null);
        setNotFound(true);
      }
    } catch (err) {
      console.error(err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderNumber) {
      setTrackingMode('orderNumber');
      setSearchInput(initialOrderNumber);
      handleTrack(initialOrderNumber, 'orderNumber');
    }
  }, [initialOrderNumber]);

  // Automatically refresh tracked order(s) whenever Admin updates status, cancellation reason, or details
  useEffect(() => {
    const syncTrackedOrders = async () => {
      if (!selectedOrder && matchedOrders.length === 0) return;
      const allOrders = await orderService.getOrders();
      if (matchedOrders.length > 0) {
        const refreshedMatches = matchedOrders
          .map(m => allOrders.find(o => o.id === m.id || o.orderNumber === m.orderNumber))
          .filter((o): o is Order => Boolean(o));
        if (refreshedMatches.length > 0) {
          setMatchedOrders(refreshedMatches);
        }
      }
      if (selectedOrder) {
        const refreshedSelected = allOrders.find(
          o => o.id === selectedOrder.id || o.orderNumber === selectedOrder.orderNumber
        );
        if (refreshedSelected) {
          setSelectedOrder(refreshedSelected);
        }
      }
    };

    window.addEventListener('orders-updated', syncTrackedOrders);
    window.addEventListener('storage', syncTrackedOrders);
    return () => {
      window.removeEventListener('orders-updated', syncTrackedOrders);
      window.removeEventListener('storage', syncTrackedOrders);
    };
  }, [selectedOrder, matchedOrders]);

  const handleCopyOrderNumber = (orderNumber: string) => {
    navigator.clipboard.writeText(orderNumber);
    setCopiedOrderNum(true);
    setTimeout(() => setCopiedOrderNum(false), 1800);
  };

  const allStatusConfigs: OrderStatusConfigItem[] = orderService.getStatusConfigs();

  const stepperConfigs = allStatusConfigs
    .filter(c => c.active && c.stepOrder >= 0)
    .sort((a, b) => a.stepOrder - b.stepOrder);

  const stages = stepperConfigs.map(cfg => ({
    status: cfg.code,
    label: language === 'bn' ? cfg.labelBn : cfg.labelEn,
    desc: language === 'bn' ? cfg.descriptionBn : cfg.descriptionEn,
    cfg,
  }));

  const getStageIndex = (status: string) => {
    if (String(status).toLowerCase() === 'cancelled') return -1;
    const idx = stages.findIndex(
      s => String(s.status).toLowerCase() === String(status).toLowerCase()
    );
    return idx >= 0 ? idx : 0;
  };

  const currentStageIndex = selectedOrder ? getStageIndex(selectedOrder.orderStatus) : 0;
  const selectedStatusConfig = selectedOrder
    ? orderService.getStatusConfig(selectedOrder.orderStatus)
    : null;
  const isSelectedConfirmed =
    selectedOrder && String(selectedOrder.orderStatus).toLowerCase() === 'confirmed';
  const isSelectedCancelled =
    selectedOrder && String(selectedOrder.orderStatus).toLowerCase() === 'cancelled';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Title */}
      <div className="text-center space-y-1">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          {language === 'bn' ? 'আপনার অর্ডার ট্র্যাক করুন' : 'Track Your Order'}
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {language === 'bn'
            ? 'অর্ডার নম্বর অথবা চেকআউটের সময় ব্যবহৃত মোবাইল নম্বর দিয়ে সহজেই আপনার অর্ডার ট্র্যাক করুন।'
            : 'Track your order easily using your Order Number or the Mobile Number used at checkout.'}
        </p>
      </div>

      {/* Two-Method Tracking Box (Order Number OR Mobile Number) — No Login Required & No Sample Orders */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3.5">
        {/* Method Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setTrackingMode('orderNumber');
              setSearchInput('');
              setNotFound(false);
            }}
            className={`py-2 px-3 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              trackingMode === 'orderNumber'
                ? 'bg-white text-[#065367] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'অর্ডার নম্বর দিয়ে' : 'By Order Number'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTrackingMode('mobileNumber');
              setSearchInput('');
              setNotFound(false);
            }}
            className={`py-2 px-3 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              trackingMode === 'mobileNumber'
                ? 'bg-white text-[#065367] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'মোবাইল নম্বর দিয়ে' : 'By Mobile Number'}</span>
          </button>
        </div>

        {/* Search Input Form */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleTrack();
          }}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <div className="relative flex-1">
            <input
              type={trackingMode === 'mobileNumber' ? 'tel' : 'text'}
              required
              placeholder={
                trackingMode === 'orderNumber'
                  ? language === 'bn'
                    ? 'অর্ডার নম্বর লিখুন (যেমন: ER0987)'
                    : 'Enter Order Number (e.g., ER0987)'
                  : language === 'bn'
                  ? 'অর্ডার করার সময় ব্যবহৃত মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX)'
                  : 'Enter Mobile Number used when placing the order (e.g., 017XXXXXXXX)'
              }
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className={`w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#065367]/20 focus:border-[#065367] ${
                trackingMode === 'orderNumber' ? 'uppercase' : ''
              }`}
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#065367] hover:bg-[#086982] rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98] shrink-0"
          >
            {loading ? (
              <span>{language === 'bn' ? 'খোঁজা হচ্ছে...' : 'Searching...'}</span>
            ) : (
              <span>{language === 'bn' ? 'অর্ডার খুঁজুন' : 'Track Order'}</span>
            )}
          </button>
        </form>
      </div>

      {/* Not Found Notice */}
      {notFound && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-1">
          <AlertCircle className="w-5 h-5 text-amber-600 mx-auto" />
          <p className="text-xs sm:text-sm font-bold text-amber-900">
            {language === 'bn'
              ? `"${searchInput}" দিয়ে কোনো অর্ডার পাওয়া যায়নি।`
              : `No order found matching "${searchInput}".`}
          </p>
          <p className="text-xs text-amber-700">
            {language === 'bn'
              ? 'অনুগ্রহ করে আপনার অর্ডার নম্বর অথবা চেকআউটে ব্যবহৃত মোবাইল নম্বরটি যাচাই করুন।'
              : 'Please check your Order Number or the Mobile Number used during checkout.'}
          </p>
        </div>
      )}

      {/* Multiple Orders Selector (when tracking by Mobile Number returns multiple orders) */}
      {matchedOrders.length > 1 && (
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {language === 'bn'
              ? `এই মোবাইল নম্বরে ${matchedOrders.length}টি অর্ডার পাওয়া গেছে`
              : `Found ${matchedOrders.length} Orders for this Mobile Number`}
          </h2>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            {matchedOrders.map(ord => {
              const isSelected = selectedOrder?.id === ord.id;
              return (
                <button
                  key={ord.id}
                  type="button"
                  onClick={() => setSelectedOrder(ord)}
                  className={`w-full p-3 flex items-center justify-between gap-3 text-left transition-colors ${
                    isSelected
                      ? 'bg-[#065367]/10 border-l-4 border-l-[#065367]'
                      : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-[#065367]">
                        {ord.orderNumber}
                      </span>
                      {(() => {
                        const ordCfg = orderService.getStatusConfig(ord.orderStatus);
                        return (
                          <span
                            style={{
                              backgroundColor: ordCfg.badgeBgHex,
                              color: ordCfg.badgeTextHex,
                              borderColor: ordCfg.badgeBorderHex,
                            }}
                            className="text-[11px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1"
                          >
                            <span
                              style={{ backgroundColor: ordCfg.dotColorHex }}
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                            />
                            <span>
                              {language === 'bn'
                                ? ordCfg.labelBn
                                : ordCfg.labelEn || localizeOrderStatus(ord.orderStatus)}
                            </span>
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {new Date(ord.createdAt).toLocaleDateString(
                        language === 'bn' ? 'bn-BD' : 'en-US',
                        {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }
                      )}{' '}
                      ·{' '}
                      {language === 'bn'
                        ? `${ord.items.length}টি পণ্য`
                        : `${ord.items.length} ${ord.items.length === 1 ? 'product' : 'products'}`}
                    </p>
                  </div>

                  <div className="text-right min-w-[96px]">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 tabular-nums text-right block">
                      ৳{ord.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Order Details */}
      {selectedOrder && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-4 p-4 sm:p-5">
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-[#065367]">
                  {selectedOrder.orderNumber}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyOrderNumber(selectedOrder.orderNumber)}
                  className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded flex items-center gap-1 transition-colors"
                  title={language === 'bn' ? 'অর্ডার নম্বর কপি করুন' : 'Copy Order Number'}
                >
                  {copiedOrderNum ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">
                        {language === 'bn' ? 'কপি হয়েছে' : 'Copied'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>{language === 'bn' ? 'কপি' : 'Copy'}</span>
                    </>
                  )}
                </button>
                {selectedStatusConfig && (
                  <span
                    style={{
                      backgroundColor: selectedStatusConfig.badgeBgHex,
                      color: selectedStatusConfig.badgeTextHex,
                      borderColor: selectedStatusConfig.badgeBorderHex,
                    }}
                    className="text-xs font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1.5"
                  >
                    <span
                      style={{ backgroundColor: selectedStatusConfig.dotColorHex }}
                      className="w-2 h-2 rounded-full shrink-0"
                    />
                    <span>
                      {language === 'bn'
                        ? selectedStatusConfig.labelBn
                        : selectedStatusConfig.labelEn ||
                          localizeOrderStatus(selectedOrder.orderStatus)}
                    </span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {language === 'bn' ? 'তারিখ:' : 'Date:'}{' '}
                  {new Date(selectedOrder.createdAt).toLocaleDateString(
                    language === 'bn' ? 'bn-BD' : 'en-US',
                    {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    }
                  )}
                </span>
              </p>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">
                {language === 'bn' ? 'সর্বমোট অর্ডার মূল্য:' : 'Total Order Value:'}
              </span>
              <div className="text-lg font-extrabold text-slate-900 tabular-nums text-right">
                ৳{selectedOrder.totalAmount.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Confirmed Order Green Status Banner */}
          {isSelectedConfirmed && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs flex items-start gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 mt-1 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-extrabold text-emerald-800 uppercase tracking-wide">
                  {language === 'bn'
                    ? 'অর্ডার স্ট্যাটাস: কনফার্মড (CONFIRMED)'
                    : 'Order Status: CONFIRMED'}
                </p>
                <p className="text-emerald-700 font-medium">
                  {language === 'bn'
                    ? 'আপনার অর্ডারটি সফলভাবে কনফার্ম করা হয়েছে এবং ডেলিভারির জন্য প্রস্তুত করা হচ্ছে।'
                    : 'Your order has been confirmed and is being prepared for dispatch.'}
                </p>
              </div>
            </div>
          )}

          {/* Progress Timeline OR Cancelled Red Banner with Cancellation Reason */}
          {!isSelectedCancelled ? (
            <div className="py-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
                {language === 'bn' ? 'ডেলিভারি অগ্রগতি' : 'Delivery Progress'}
              </h3>

              <div className="relative">
                <div className="hidden sm:block absolute top-3.5 left-6 right-6 h-0.5 bg-slate-200 -z-0" />

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 relative z-10">
                  {stages.map((stage, idx) => {
                    const isDone = idx <= currentStageIndex;
                    const isCurrent = idx === currentStageIndex;
                    const isGreenStep =
                      isDone &&
                      (String(stage.status).toLowerCase() === 'confirmed' ||
                        String(stage.status).toLowerCase() === 'delivered');
                    return (
                      <div
                        key={stage.status}
                        className="flex sm:flex-col items-center sm:text-center gap-2.5 sm:gap-1"
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                            isGreenStep
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : isDone
                              ? 'bg-[#065367] text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          } ${
                            isCurrent
                              ? isGreenStep
                                ? 'ring-3 ring-emerald-600/25'
                                : 'ring-3 ring-[#065367]/20'
                              : ''
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>

                        <div>
                          <p
                            className={`text-xs font-bold ${
                              isGreenStep
                                ? 'text-emerald-700'
                                : isDone
                                ? 'text-slate-900'
                                : 'text-slate-400'
                            }`}
                          >
                            {stage.label}
                          </p>
                          <p className="text-[10px] text-slate-500 hidden sm:block">
                            {stage.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-extrabold text-rose-700 text-xs sm:text-sm uppercase tracking-wide">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
                <span>
                  {language === 'bn'
                    ? 'অর্ডার স্ট্যাটাস: বাতিল (CANCELLED)'
                    : 'Order Status: CANCELLED'}
                </span>
              </div>
              <p className="text-rose-800 font-medium">
                {language === 'bn'
                  ? 'এই অর্ডারটি বাতিল করা হয়েছে।'
                  : 'This order has been cancelled.'}
              </p>
              {selectedOrder.cancellationReason && (
                <div className="pt-1.5 mt-1 border-t border-rose-200/80 text-rose-900">
                  <span className="font-bold">
                    {language === 'bn' ? 'বাতিলের কারণ (Reason): ' : 'Reason: '}
                  </span>
                  <span className="font-semibold">{selectedOrder.cancellationReason}</span>
                </div>
              )}
            </div>
          )}

          {/* Destination & Payment Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <MapPin className="w-3.5 h-3.5 text-[#065367]" />
                <span>{language === 'bn' ? 'ডেলিভারি ঠিকানা' : 'Destination Address'}</span>
              </div>
              <p className="text-slate-700 font-medium">
                {selectedOrder.customer.fullName} · {selectedOrder.customer.mobileNumber}
              </p>
              <p className="text-slate-500">{selectedOrder.customer.fullAddress}</p>
              <p className="text-slate-600 font-medium">
                {language === 'bn' ? 'এরিয়া:' : 'Area:'} {localizeArea(selectedOrder.area)}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                <CreditCard className="w-3.5 h-3.5 text-[#065367]" />
                <span>{language === 'bn' ? 'পেমেন্ট ও বিলিং' : 'Payment & Billing'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>{language === 'bn' ? 'পণ্যের মোট মূল্য:' : 'Product Subtotal:'}</span>
                <span className="font-semibold text-slate-900 tabular-nums text-right w-28 shrink-0">
                  ৳{selectedOrder.itemsSubtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>
                  {language === 'bn' ? 'ডেলিভারি চার্জ (অগ্রিম):' : 'Delivery Charge (Advance):'}
                </span>
                <span className="font-semibold text-slate-900 tabular-nums text-right w-28 shrink-0">
                  ৳{selectedOrder.advanceAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#065367] font-extrabold pt-1 border-t border-slate-200/80">
                <span>{language === 'bn' ? 'ক্যাশ অন ডেলিভারি (COD):' : 'COD Amount:'}</span>
                <span className="tabular-nums text-right w-28 shrink-0">
                  ৳{(selectedOrder.remainingAmount || selectedOrder.dueAmount).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Ordered Products List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
              {language === 'bn' ? 'এই অর্ডারের পণ্যসমূহ' : 'Products in this Order'}
            </h4>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
              {selectedOrder.items.map((item, i) => (
                <div key={i} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <img
                      src={item.productImage}
                      alt={localizeProductNameById(item.productId, item.productName)}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 truncate">
                        {localizeProductNameById(item.productId, item.productName)}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                        <span>
                          {language === 'bn'
                            ? `পরিমাণ: ${item.quantity}`
                            : `Qty: ${item.quantity}`}
                        </span>
                        {item.selectedColor && (
                          <span className="text-slate-600">
                            · {language === 'bn' ? 'কালার:' : 'Color:'} {item.selectedColor}
                          </span>
                        )}
                        {item.selectedSize && (
                          <span className="text-slate-600">
                            · {language === 'bn' ? 'সাইজ:' : 'Size:'} {item.selectedSize}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right min-w-[96px] shrink-0">
                    <div className="font-bold text-slate-900 tabular-nums text-right leading-tight">
                      ৳{item.subtotal.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400 tabular-nums text-right leading-tight">
                      ৳{item.unitPrice.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Profile Section → Language Option (বাংলা — Default | English — Optional) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setLanguageOpen(prev => !prev)}
          className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
          aria-expanded={languageOpen}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#065367]/10 text-[#065367] flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                {language === 'bn' ? 'ভাষা (Language)' : 'Language'}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {language === 'bn'
                  ? 'ওয়েবসাইটের ভাষা পরিবর্তন করুন'
                  : 'Select your preferred website language'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-[#065367]">
              {language === 'bn' ? 'বাংলা' : 'English'}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                languageOpen ? 'rotate-180 text-[#065367]' : ''
              }`}
            />
          </div>
        </button>

        {languageOpen && (
          <div className="px-4 sm:px-5 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setLanguage('bn')}
                className={`py-2.5 px-3.5 rounded-lg text-xs sm:text-sm font-bold border flex items-center justify-between transition-all ${
                  language === 'bn'
                    ? 'bg-[#065367] text-white border-[#065367] shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-[#065367]/40'
                }`}
              >
                <span>বাংলা</span>
                {language === 'bn' && <Check className="w-4 h-4 text-white shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`py-2.5 px-3.5 rounded-lg text-xs sm:text-sm font-bold border flex items-center justify-between transition-all ${
                  language === 'en'
                    ? 'bg-[#065367] text-white border-[#065367] shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-[#065367]/40'
                }`}
              >
                <span>English</span>
                {language === 'en' && <Check className="w-4 h-4 text-white shrink-0" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
