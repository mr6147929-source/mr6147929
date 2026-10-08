import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  Truck,
  ArrowRight,
  Printer,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Order } from '../types';
import { orderService } from '../services/OrderService';
import { useLanguage } from '../context/LanguageContext';

interface OrderConfirmationPageProps {
  orderNumber: string;
  navigate: (path: string) => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({
  orderNumber,
  navigate,
}) => {
  const {
    language,
    localizeArea,
    localizeOrderStatus,
    localizeProductNameById,
  } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderNumber) {
        setLoading(false);
        return;
      }
      try {
        const found = await orderService.getOrderByNumber(orderNumber);
        setOrder(found);
      } catch (err) {
        console.error('Failed to get order', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderNumber]);

  const handleCopyOrderNumber = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center animate-pulse">
        <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4" />
        <div className="h-6 bg-slate-100 rounded w-1/3 mx-auto mb-2" />
        <div className="h-4 bg-slate-100 rounded w-1/2 mx-auto" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">
          {language === 'bn' ? 'অর্ডারটি পাওয়া যায়নি' : 'Order Not Found'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {language === 'bn'
            ? 'অনুগ্রহ করে আপনার অর্ডার নম্বর যাচাই করুন অথবা অর্ডার ট্র্যাকিং পেজে যান।'
            : 'Please check your order number or visit the Order Tracking page.'}
        </p>
        <button
          onClick={() => navigate('order-tracking')}
          className="mt-5 px-6 py-2.5 text-xs font-semibold text-white bg-[#065367] rounded-lg"
        >
          {language === 'bn' ? 'অর্ডার ট্র্যাক করুন' : 'Track Order'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5 print:p-0">
      {/* Success Badge */}
      <div className="text-center space-y-1.5 print:hidden">
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
          <CheckCircle className="w-7 h-7" />
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          {language === 'bn'
            ? 'অর্ডার সফলভাবে সম্পন্ন হয়েছে!'
            : 'Order Successfully Placed!'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          {language === 'bn' ? (
            <>
              ধন্যবাদ, <strong className="text-slate-900">{order.customer.fullName}</strong>! আপনার
              অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে।
            </>
          ) : (
            <>
              Thank you, <strong className="text-slate-900">{order.customer.fullName}</strong>! Your
              order has been registered.
            </>
          )}
        </p>
      </div>

      {/* Main Order Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {/* Header Bar */}
        <div className="bg-slate-50 p-3.5 sm:p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <span className="text-[11px] text-slate-500 font-medium">
              {language === 'bn' ? 'অর্ডার নম্বর:' : 'Order Number:'}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-base sm:text-lg font-bold text-[#065367] tracking-wider">
                {order.orderNumber}
              </span>
              <button
                onClick={handleCopyOrderNumber}
                className="px-2 py-1 text-[11px] font-semibold bg-white border border-slate-200 rounded text-slate-600 hover:text-[#065367] hover:border-[#065367] flex items-center gap-1 transition-colors print:hidden"
                title={language === 'bn' ? 'অর্ডার নম্বর কপি করুন' : 'Copy order number'}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">
                      {language === 'bn' ? 'কপি হয়েছে' : 'Copied'}
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'কপি' : 'Copy'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#065367]/10 text-[#065367]">
              {language === 'bn'
                ? `স্ট্যাটাস: ${localizeOrderStatus(order.orderStatus)}`
                : `Status: ${order.orderStatus}`}
            </span>
            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-md print:hidden"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'রসিদ প্রিন্ট করুন' : 'Print Receipt'}</span>
            </button>
          </div>
        </div>

        {/* Customer & Delivery Summary */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <h4 className="font-bold text-slate-900 mb-1">
              {language === 'bn' ? 'গ্রাহকের তথ্য:' : 'Customer Details:'}
            </h4>
            <p className="text-slate-700 font-medium">{order.customer.fullName}</p>
            <p className="text-slate-500">
              {language === 'bn' ? 'মোবাইল:' : 'Phone:'} {order.customer.mobileNumber}
            </p>
            <p className="text-slate-500 mt-0.5">
              {language === 'bn' ? 'ঠিকানা:' : 'Address:'} {order.customer.fullAddress}
            </p>
            {order.orderNote && (
              <p className="text-slate-500 italic mt-0.5">
                {language === 'bn' ? 'নোট:' : 'Note:'} "{order.orderNote}"
              </p>
            )}
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-1">
              {language === 'bn' ? 'এরিয়া ও পেমেন্ট তথ্য:' : 'Area & Payment Details:'}
            </h4>
            <p className="text-slate-700">
              {language === 'bn' ? 'এরিয়া:' : 'Area:'}{' '}
              <span className="font-semibold">{localizeArea(order.area)}</span>
            </p>
            <p className="text-slate-700 mt-0.5">
              {language === 'bn' ? 'পেমেন্ট পদ্ধতি:' : 'Payment Method:'}{' '}
              <span className="font-semibold">
                {language === 'bn' ? 'অগ্রিম ডেলিভারি চার্জ' : 'Advance Delivery Charge'}
              </span>
            </p>
            {order.trxId && (
              <p className="text-slate-700 mt-0.5">
                TrxID: <span className="font-bold text-pink-700">{order.trxId}</span>
              </p>
            )}
            <p className="text-slate-400 mt-0.5">
              {language === 'bn' ? 'অর্ডারের তারিখ:' : 'Order Date:'}{' '}
              {new Date(order.createdAt).toLocaleDateString(
                language === 'bn' ? 'bn-BD' : 'en-US',
                {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }
              )}
            </p>
          </div>
        </div>

        {/* Itemized Products */}
        <div className="p-3.5 sm:p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
            {language === 'bn' ? 'অর্ডারকৃত পণ্যসমূহ' : 'Ordered Products'}
          </h4>

          {/* Itemized Products */}
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
            {order.items.map((item, idx) => (
              <div key={idx} className="p-2.5 flex items-center justify-between gap-3 text-xs">
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
                    <div className="flex flex-wrap items-center gap-1.5 text-slate-400 text-[11px]">
                      <span>
                        {language === 'bn' ? `পরিমাণ: ${item.quantity}` : `Qty: ${item.quantity}`}
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

                <div className="text-right w-28 shrink-0">
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

          {/* Totals Breakdown — Strictly Right-Aligned to the Same Edge */}
          <div className="mt-3 pt-2.5 border-t border-slate-200 px-2.5 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 py-0.5">
              <span>{language === 'bn' ? 'পণ্যের মোট মূল্য' : 'Product Subtotal'}</span>
              <span className="tabular-nums font-semibold text-slate-900 text-right w-28 shrink-0">
                ৳{order.itemsSubtotal.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between text-amber-900 font-semibold bg-amber-50/80 py-1.5 border-y border-amber-200/70">
              <span>
                {language === 'bn'
                  ? 'ডেলিভারি চার্জ (অগ্রিম পরিশোধিত)'
                  : 'Delivery Charge (Advance Paid)'}
              </span>
              <span className="tabular-nums font-bold text-right w-28 shrink-0">
                ৳{order.advanceAmount.toLocaleString()}
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
              <span className="text-sm sm:text-base tabular-nums text-[#065367] font-extrabold text-right w-28 shrink-0">
                ৳{(order.remainingAmount || order.dueAmount).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1 print:hidden">
        <button
          onClick={() => navigate(`order-tracking?orderNumber=${order.orderNumber}`)}
          className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#065367] hover:bg-[#086982] rounded-lg shadow-xs flex items-center justify-center gap-2"
        >
          <Truck className="w-4 h-4" />
          <span>{language === 'bn' ? 'অর্ডার ট্র্যাক করুন' : 'Track Order Status'}</span>
        </button>

        <button
          onClick={() => navigate('products')}
          className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center justify-center gap-2"
        >
          <span>{language === 'bn' ? 'কেনাকাটা চালিয়ে যান' : 'Continue Shopping'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
