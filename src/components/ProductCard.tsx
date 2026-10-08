import React, { useState, useRef } from 'react';
import { ShoppingCart, Check, Heart } from 'lucide-react';
import { getActiveProductVariants, Product } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useLanguage } from '../context/LanguageContext';

interface ProductCardProps {
  product: Product;
  onViewDetails: (id: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onViewDetails }) => {
  const { addToCart, showNotification } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { language, localizeProduct } = useLanguage();
  const [justAdded, setJustAdded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const addedTimerRef = useRef<number | null>(null);

  const isSaved = isInWishlist(product.id);
  const isOutOfStock = product.stock <= 0;
  const hasDiscount = Boolean(
    product.originalPrice && product.originalPrice > product.sellingPrice
  );
  const localizedProduct = localizeProduct(product);
  const activeVariants = getActiveProductVariants(product);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;

    // If a variant (Color and/or Size) is required for this product, customer must select it on the product details page
    if (activeVariants.hasVariants) {
      showNotification(
        language === 'bn'
          ? 'অনুগ্রহ করে প্রথমে কালার / সাইজ নির্বাচন করুন।'
          : 'Please select Color / Size options first.'
      );
      onViewDetails(product.id);
      return;
    }

    const ok = addToCart(product, 1, imageRef.current);
    if (ok) {
      if (addedTimerRef.current) {
        window.clearTimeout(addedTimerRef.current);
      }
      setJustAdded(true);
      addedTimerRef.current = window.setTimeout(() => {
        setJustAdded(false);
      }, 1500);
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div
      onClick={() => onViewDetails(product.id)}
      className="group bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 hover:shadow-sm transition-all duration-200 flex flex-col cursor-pointer"
    >
      {/* Product Image Area */}
      <div className="relative aspect-square bg-slate-50 overflow-hidden">
        <img
          ref={imageRef}
          src={product.images[0]}
          alt={localizedProduct.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
        />

        {/* Wishlist Heart Icon (Top-Right over product image — Outline when not saved, Filled red when saved, NO number/count) */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label={
            isSaved
              ? language === 'bn'
                ? 'উইশলিস্ট থেকে সরান'
                : 'Remove from Wishlist'
              : language === 'bn'
              ? 'উইশলিস্টে রাখুন'
              : 'Save to Wishlist'
          }
          title={
            isSaved
              ? language === 'bn'
                ? 'উইশলিস্ট থেকে সরান'
                : 'Remove from Wishlist'
              : language === 'bn'
              ? 'উইশলিস্টে রাখুন'
              : 'Save to Wishlist'
          }
          className="absolute top-2.5 right-2.5 z-10 inline-flex items-center justify-center p-1 bg-transparent border-0 shadow-none focus:outline-none transition-transform active:scale-90"
        >
          <Heart
            className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-colors drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)] ${
              isSaved
                ? 'fill-rose-600 text-rose-600'
                : 'fill-none text-slate-700 hover:text-rose-600 stroke-[2]'
            }`}
          />
        </button>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px] flex items-center justify-center">
            <span className="px-3 py-1 bg-rose-600 text-white text-[11px] font-bold uppercase tracking-wider rounded shadow-xs">
              {language === 'bn' ? 'স্টক শেষ' : 'Out of Stock'}
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3 flex-1 flex flex-col justify-between gap-2.5">
        <h3 className="text-xs sm:text-sm font-medium text-slate-800 group-hover:text-[#065367] transition-colors line-clamp-2 leading-snug">
          {localizedProduct.name}
        </h3>

        {/* Price & Full-Width Add To Cart Button */}
        <div className="pt-1 border-t border-slate-100 flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="text-sm sm:text-base font-bold text-slate-900 tabular-nums">
              ৳{product.sellingPrice.toLocaleString()}
            </span>
            {hasDiscount && product.originalPrice && (
              <span className="text-[11px] text-slate-400 line-through tabular-nums">
                ৳{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            type="button"
            title={
              isOutOfStock
                ? language === 'bn'
                  ? 'স্টক শেষ'
                  : 'Out of Stock'
                : language === 'bn'
                ? 'কার্টে যোগ করুন'
                : 'Add To Cart'
            }
            aria-label={
              isOutOfStock
                ? language === 'bn'
                  ? 'স্টক শেষ'
                  : 'Out of Stock'
                : language === 'bn'
                ? 'কার্টে যোগ করুন'
                : 'Add To Cart'
            }
            className={`w-full py-2 px-3 rounded-md text-xs sm:text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                : justAdded
                ? 'bg-emerald-100 text-emerald-800 shadow-2xs'
                : 'bg-[#065367] text-white hover:bg-[#086982] active:scale-[0.99] shadow-2xs'
            }`}
          >
            {justAdded ? (
              <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 stroke-[2.5]" />
            ) : (
              <ShoppingCart className="w-3.5 h-3.5 text-white shrink-0" />
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
        </div>
      </div>
    </div>
  );
};
