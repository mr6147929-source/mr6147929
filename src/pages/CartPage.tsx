import React from 'react';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ArrowLeft } from 'lucide-react';
import { buildCartItemKey } from '../types';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

interface CartPageProps {
  navigate: (path: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ navigate }) => {
  const { items, removeFromCart, updateQuantity, subtotal, clearDirectOrder } = useCart();
  const { language, localizeProduct } = useLanguage();

  const handleProceedToCheckout = () => {
    clearDirectOrder();
    navigate('checkout');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          {language === 'bn' ? 'আপনার কার্ট খালি' : 'Your Cart is Empty'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          {language === 'bn'
            ? 'এখনো কোনো পণ্য যোগ করা হয়নি। কেনাকাটা শুরু করতে আমাদের পণ্যসমূহ দেখুন।'
            : 'No products added yet. Explore our product catalog to start shopping.'}
        </p>
        <button
          onClick={() => navigate('products')}
          className="mt-6 px-6 py-3 text-xs sm:text-sm font-semibold text-white bg-[#065367] hover:bg-[#086982] rounded-lg shadow-sm transition-all"
        >
          {language === 'bn' ? 'পণ্য দেখুন' : 'Shop Products'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {language === 'bn' ? 'শপিং কার্ট' : 'Shopping Cart'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'bn'
              ? `আপনার কার্টে ${items.length}টি পণ্য রয়েছে`
              : `${items.length} ${items.length === 1 ? 'product' : 'products'} in your cart`}
          </p>
        </div>

        <button
          onClick={() => navigate('products')}
          className="text-xs font-semibold text-[#065367] hover:underline flex items-center gap-1 self-start sm:self-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'কেনাকাটা চালিয়ে যান' : 'Continue Shopping'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white divide-y divide-slate-100">
            {items.map(item => {
              const maxStock = item.product.stock;
              const localizedProd = localizeProduct(item.product);
              const itemKey =
                item.cartItemId ||
                buildCartItemKey(item.productId, item.selectedColor, item.selectedSize);
              return (
                <div
                  key={itemKey}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  {/* Image & Title */}
                  <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:w-auto">
                    <div
                      onClick={() => navigate(`product?id=${item.productId}`)}
                      className="w-16 h-16 bg-slate-50 rounded-lg overflow-hidden shrink-0 border border-slate-200 cursor-pointer"
                    >
                      <img
                        src={item.product.images[0]}
                        alt={localizedProd.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <h3
                        onClick={() => navigate(`product?id=${item.productId}`)}
                        className="text-xs sm:text-sm font-semibold text-slate-900 hover:text-[#065367] cursor-pointer line-clamp-2 leading-tight"
                      >
                        {localizedProd.name}
                      </h3>

                      {(item.selectedColor || item.selectedSize) && (
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          {item.selectedColor && (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {language === 'bn' ? 'কালার:' : 'Color:'} {item.selectedColor}
                            </span>
                          )}
                          {item.selectedSize && (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {language === 'bn' ? 'সাইজ:' : 'Size:'} {item.selectedSize}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="text-[11px] text-slate-400">
                        {language === 'bn'
                          ? `স্টকে আছে (${maxStock}টি)`
                          : `In Stock (${maxStock} available)`}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Stepper, Remove & Strictly Right-Aligned Unit/Subtotal Prices */}
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 sm:gap-5 self-end sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0">
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center border border-slate-200 rounded-md bg-white">
                        <button
                          type="button"
                          onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                          title={language === 'bn' ? 'কমান' : 'Decrease'}
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <input
                          type="number"
                          min="1"
                          max={maxStock}
                          value={item.quantity}
                          onChange={e =>
                            updateQuantity(itemKey, Number(e.target.value))
                          }
                          className="w-9 text-center font-semibold text-xs text-slate-900 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />

                        <button
                          type="button"
                          onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                          disabled={item.quantity >= maxStock}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                          title={language === 'bn' ? 'বাড়ান' : 'Increase'}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeFromCart(itemKey)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors shrink-0"
                        title={language === 'bn' ? 'মুছে ফেলুন' : 'Remove item'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Right-aligned Unit Price & Item Subtotal on exact same right edge */}
                    <div className="text-right w-28 shrink-0">
                      <div className="text-sm font-bold text-slate-900 tabular-nums text-right leading-tight">
                        ৳{item.subtotal.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-400 tabular-nums text-right leading-tight mt-0.5">
                        ৳{item.unitPrice.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-4">
          <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4 sticky top-20">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2">
              {language === 'bn' ? 'কার্ট সামারি' : 'Cart Summary'}
            </h3>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>{language === 'bn' ? 'পণ্যের মোট মূল্য' : 'Product Subtotal'}</span>
                <span className="font-semibold text-slate-900 tabular-nums text-right w-28 shrink-0">
                  ৳{subtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>
                  {language === 'bn' ? 'ডেলিভারি চার্জ (অগ্রিম)' : 'Delivery Charge (Advance)'}
                </span>
                <span className="text-slate-500 italic text-xs text-right w-28 shrink-0">
                  {language === 'bn' ? 'চেকআউটে নির্ধারিত হবে' : 'At checkout'}
                </span>
              </div>

              <div className="border-t border-slate-200 pt-2.5 flex items-center justify-between text-slate-900">
                <div>
                  <span className="text-sm sm:text-base font-extrabold text-[#065367] block">
                    {language === 'bn' ? 'ক্যাশ অন ডেলিভারি (COD)' : 'COD Amount'}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 block">
                    {language === 'bn' ? 'পণ্য হাতে পেয়ে পরিশোধযোগ্য' : 'Payable upon delivery'}
                  </span>
                </div>
                <span className="text-base sm:text-lg font-extrabold text-[#065367] tabular-nums text-right w-28 shrink-0">
                  ৳{subtotal.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={handleProceedToCheckout}
              className="w-full py-3.5 px-4 text-xs sm:text-sm font-semibold text-white bg-[#065367] hover:bg-[#086982] rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <span>{language === 'bn' ? 'অর্ডার করুন' : 'Order Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center text-[11px] text-slate-400">
              {language === 'bn'
                ? '🔒 অগ্রিম ডেলিভারি চার্জে অর্ডার বুকিং · সারা বাংলাদেশে ডেলিভারি'
                : '🔒 Delivery Charge Advance Booking · Nationwide Delivery'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
