import React, { useState, useRef } from 'react';
import { Heart, ShoppingCart, Trash2, ArrowLeft, Check } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { getActiveProductVariants, Product } from '../types';

interface WishlistPageProps {
  navigate: (path: string) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({ navigate }) => {
  const { wishlistProducts, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart, showNotification } = useCart();
  const { language, localizeProduct } = useLanguage();
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const imageRefs = useRef<Record<string, HTMLImageElement | null>>({});

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) return;
    const activeVariants = getActiveProductVariants(product);
    if (activeVariants.hasVariants) {
      showNotification(
        language === 'bn'
          ? 'অনুগ্রহ করে প্রথমে কালার / সাইজ নির্বাচন করুন।'
          : 'Please select Color / Size options first.'
      );
      navigate(`product?id=${product.id}`);
      return;
    }

    const imgEl = imageRefs.current[product.id];
    const ok = addToCart(product, 1, imgEl);
    if (ok) {
      setAddedIds(prev => ({ ...prev, [product.id]: true }));
      setTimeout(() => {
        setAddedIds(prev => ({ ...prev, [product.id]: false }));
      }, 1500);
    }
  };

  if (wishlistProducts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Heart className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          {language === 'bn' ? 'আপনার উইশলিস্ট খালি' : 'Your Wishlist is Empty'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          {language === 'bn'
            ? 'যেকোনো পণ্যের হার্ট আইকনে ট্যাপ করে আপনার পছন্দের তালিকায় যুক্ত করুন।'
            : 'Tap the heart icon on any product to save your favorite products here.'}
        </p>
        <button
          onClick={() => navigate('products')}
          className="mt-6 px-6 py-3 text-xs sm:text-sm font-semibold text-white bg-[#065367] hover:bg-[#086982] rounded-lg shadow-sm transition-all"
        >
          {language === 'bn' ? 'পণ্য দেখুন' : 'Browse Products'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {language === 'bn' ? 'পছন্দের তালিকা (উইশলিস্ট)' : 'Saved Wishlist'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'bn'
              ? `${wishlistProducts.length}টি পছন্দের পণ্য`
              : `${wishlistProducts.length} saved ${
                  wishlistProducts.length === 1 ? 'product' : 'products'
                }`}
          </p>
        </div>

        <div className="flex items-center gap-4 self-start sm:self-auto">
          <button
            onClick={clearWishlist}
            className="text-xs font-medium text-slate-500 hover:text-rose-600 hover:underline"
          >
            {language === 'bn' ? 'সব মুছে ফেলুন' : 'Clear Wishlist'}
          </button>
          <button
            onClick={() => navigate('products')}
            className="text-xs font-semibold text-[#065367] hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'কেনাকাটা চালিয়ে যান' : 'Continue Shopping'}</span>
          </button>
        </div>
      </div>

      {/* Saved Items List with Right-Aligned Prices */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white divide-y divide-slate-100">
        {wishlistProducts.map(product => {
          const isOutOfStock = product.stock <= 0;
          const hasDiscount = Boolean(
            product.originalPrice && product.originalPrice > product.sellingPrice
          );
          const justAdded = Boolean(addedIds[product.id]);
          const localizedProd = localizeProduct(product);

          return (
            <div
              key={product.id}
              className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 hover:bg-slate-50/40 transition-colors"
            >
              {/* Product Thumbnail & Name */}
              <div className="flex items-center gap-3.5 flex-1 min-w-0 w-full sm:w-auto">
                <div
                  onClick={() => navigate(`product?id=${product.id}`)}
                  className="w-16 h-16 sm:w-18 sm:h-18 bg-slate-50 rounded-lg overflow-hidden shrink-0 border border-slate-200 cursor-pointer"
                >
                  <img
                    ref={el => {
                      imageRefs.current[product.id] = el;
                    }}
                    src={product.images[0]}
                    alt={localizedProd.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <h3
                    onClick={() => navigate(`product?id=${product.id}`)}
                    className="text-xs sm:text-sm font-semibold text-slate-900 hover:text-[#065367] cursor-pointer line-clamp-2 leading-snug"
                  >
                    {localizedProd.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    {isOutOfStock ? (
                      <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/70">
                        {language === 'bn' ? 'স্টক শেষ' : 'Out of Stock'}
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-emerald-700">
                        {language === 'bn'
                          ? `স্টকে আছে (${product.stock}টি)`
                          : `In Stock (${product.stock} available)`}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right-Aligned Price & Actions */}
              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 border-t sm:border-t-0 pt-2.5 sm:pt-0">
                <div className="text-right min-w-[90px]">
                  <div className="text-sm sm:text-base font-bold text-slate-900 tabular-nums text-right">
                    ৳{product.sellingPrice.toLocaleString()}
                  </div>
                  {hasDiscount && product.originalPrice && (
                    <div className="text-xs text-slate-400 line-through tabular-nums text-right">
                      ৳{product.originalPrice.toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(product)}
                    disabled={isOutOfStock}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      isOutOfStock
                        ? 'border border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
                        : justAdded
                        ? 'bg-emerald-100 text-emerald-800 shadow-xs'
                        : 'bg-[#065367] text-white hover:bg-[#086982] shadow-xs active:scale-[0.98]'
                    }`}
                  >
                    {justAdded ? (
                      <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 stroke-[2.5]" />
                    ) : (
                      <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>
                      {justAdded
                        ? language === 'bn'
                          ? 'কার্টে যোগ করা হয়েছে'
                          : 'Added to Cart'
                        : language === 'bn'
                        ? 'কার্টে যোগ করুন'
                        : 'Add To Cart'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => removeFromWishlist(product.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors"
                    title={language === 'bn' ? 'উইশলিস্ট থেকে সরান' : 'Remove from Wishlist'}
                    aria-label={language === 'bn' ? 'উইশলিস্ট থেকে সরান' : 'Remove from Wishlist'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
