import React, { useEffect, useState, useRef } from 'react';
import {
  ShoppingCart,
  Zap,
  Check,
  ChevronRight,
  AlertCircle,
  Heart,
} from 'lucide-react';
import { Category, getActiveProductVariants, Product } from '../types';
import { productService } from '../services/ProductService';
import { categoryService } from '../services/CategoryService';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useLanguage } from '../context/LanguageContext';
import { ProductCard } from '../components/ProductCard';

interface ProductDetailsPageProps {
  productId: string;
  navigate: (path: string) => void;
}

export const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({
  productId,
  navigate,
}) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [variantError, setVariantError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [justAdded, setJustAdded] = useState(false);

  const mainImageRef = useRef<HTMLImageElement>(null);
  const { addToCart, startDirectOrder, showNotification } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { language, localizeProduct, localizeCategory } = useLanguage();

  const loadProductData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const prod = await productService.getProductById(productId);
      if (prod) {
        setProduct(prod);
        if (isInitial) {
          setQuantity(1);
          setActiveImageIndex(0);
          setSelectedColor('');
          setSelectedSize('');
          setVariantError(null);
        } else {
          setQuantity(prev => Math.max(1, Math.min(prev, Math.max(1, prod.stock))));
        }

        const [cat, related] = await Promise.all([
          categoryService.getCategoryById(prod.categoryId),
          productService.getRelatedProducts(prod.id, prod.categoryId, 4),
        ]);
        setCategory(cat);
        setRelatedProducts(related);
      } else {
        setProduct(null);
      }
    } catch (err) {
      console.error('Error loading product details', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    loadProductData(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const handleProductsUpdated = () => {
      loadProductData(false);
    };
    window.addEventListener('products-updated', handleProductsUpdated);
    return () => window.removeEventListener('products-updated', handleProductsUpdated);
  }, [productId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
          <div className="bg-slate-100 rounded-lg aspect-square" />
          <div className="space-y-4">
            <div className="h-6 bg-slate-100 rounded w-1/3" />
            <div className="h-10 bg-slate-100 rounded w-3/4" />
            <div className="h-8 bg-slate-100 rounded w-1/4" />
            <div className="h-24 bg-slate-100 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">
          {language === 'bn' ? 'পণ্যটি পাওয়া যায়নি' : 'Product Not Found'}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {language === 'bn'
            ? 'অনুগ্রহ করে আমাদের ক্যাটালগ থেকে অন্যান্য পণ্য দেখুন।'
            : 'Please explore our product catalog to find available products.'}
        </p>
        <button
          onClick={() => navigate('products')}
          className="mt-5 px-6 py-2.5 text-xs font-semibold text-white bg-[#065367] rounded-lg"
        >
          {language === 'bn' ? 'সকল পণ্য দেখুন' : 'View All Products'}
        </button>
      </div>
    );
  }

  const isSaved = isInWishlist(product.id);
  const isOutOfStock = product.stock <= 0;
  const hasDiscount = Boolean(
    product.originalPrice && product.originalPrice > product.sellingPrice
  );
  const localizedProduct = localizeProduct(product);
  const localizedCategory = category ? localizeCategory(category) : null;
  const activeVariants = getActiveProductVariants(product);

  const handleQuantityChange = (val: number) => {
    if (val < 1) return;
    if (val > product.stock) {
      setQuantity(product.stock);
      return;
    }
    setQuantity(val);
  };

  const validateRequiredVariants = (): boolean => {
    const missingColor = activeVariants.hasColors && !selectedColor;
    const missingSize = activeVariants.hasSizes && !selectedSize;

    if (missingColor && missingSize) {
      const msg =
        language === 'bn'
          ? 'অনুগ্রহ করে প্রথমে কালার এবং সাইজ নির্বাচন করুন।'
          : 'Please select a Color and Size before continuing.';
      setVariantError(msg);
      showNotification(msg);
      return false;
    }

    if (missingColor) {
      const msg =
        language === 'bn'
          ? 'অনুগ্রহ করে প্রথমে একটি কালার নির্বাচন করুন।'
          : 'Please select a Color before continuing.';
      setVariantError(msg);
      showNotification(msg);
      return false;
    }

    if (missingSize) {
      const msg =
        language === 'bn'
          ? 'অনুগ্রহ করে প্রথমে একটি সাইজ নির্বাচন করুন।'
          : 'Please select a Size before continuing.';
      setVariantError(msg);
      showNotification(msg);
      return false;
    }

    setVariantError(null);
    return true;
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    if (!validateRequiredVariants()) return;

    const ok = addToCart(product, quantity, mainImageRef.current, {
      selectedColor: activeVariants.hasColors ? selectedColor : undefined,
      selectedSize: activeVariants.hasSizes ? selectedSize : undefined,
    });
    if (ok) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1500);
    }
  };

  const handleOrderNow = () => {
    if (isOutOfStock) return;
    if (!validateRequiredVariants()) return;

    startDirectOrder(product, quantity, {
      selectedColor: activeVariants.hasColors ? selectedColor : undefined,
      selectedSize: activeVariants.hasSizes ? selectedSize : undefined,
    });
    navigate('checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <button onClick={() => navigate('home')} className="hover:text-[#065367]">
          {language === 'bn' ? 'হোম' : 'Home'}
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <button onClick={() => navigate('products')} className="hover:text-[#065367]">
          {language === 'bn' ? 'সকল পণ্য' : 'Products'}
        </button>
        {category && localizedCategory && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <button
              onClick={() => navigate(`products?category=${category.id}`)}
              className="hover:text-[#065367]"
            >
              {localizedCategory.name}
            </button>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-800 font-medium truncate max-w-[160px] sm:max-w-xs">
          {localizedProduct.name}
        </span>
      </nav>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-10">
        {/* Left: Product Images Gallery */}
        <div className="lg:col-span-6 space-y-3">
          <div className="relative aspect-[4/3] sm:aspect-square bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center">
            <img
              ref={mainImageRef}
              src={product.images[activeImageIndex] || product.images[0]}
              alt={localizedProduct.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />

            {/* Wishlist Heart Button on Main Product Image — Outline when not in wishlist, Filled red when in wishlist, NO number/count */}
            <button
              type="button"
              onClick={() => toggleWishlist(product)}
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
              className="absolute top-3 right-3.5 z-10 inline-flex items-center justify-center p-1 bg-transparent border-0 shadow-none focus:outline-none transition-transform active:scale-95"
            >
              <Heart
                className={`w-5 h-5 transition-colors drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)] ${
                  isSaved
                    ? 'fill-rose-600 text-rose-600'
                    : 'fill-none text-slate-700 hover:text-rose-600 stroke-[2]'
                }`}
              />
            </button>

            {isOutOfStock && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                <span className="px-4 py-2 bg-rose-600 text-white text-xs font-bold uppercase tracking-wider rounded-md shadow-md">
                  {language === 'bn' ? 'স্টক শেষ' : 'Out of Stock'}
                </span>
              </div>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-14 h-14 rounded-lg border-2 overflow-hidden shrink-0 transition-all ${
                    activeImageIndex === idx
                      ? 'border-[#065367] ring-1 ring-[#065367]'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${localizedProduct.name} thumbnail ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Purchase Module */}
        <div className="lg:col-span-6 space-y-3.5">
          <div>
            {localizedCategory && (
              <span className="text-[11px] font-semibold text-[#065367] uppercase tracking-wider">
                {localizedCategory.name}
              </span>
            )}
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 mt-0.5 leading-snug">
              {localizedProduct.name}
            </h1>

            {/* Stock Display: Only "In Stock" or "Out of Stock" (no exact quantity, no Saved in Wishlist badge) */}
            <div className="mt-1.5">
              {isOutOfStock ? (
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200 inline-block">
                  {language === 'bn' ? 'স্টক শেষ' : 'Out of Stock'}
                </span>
              ) : (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 inline-block">
                  {language === 'bn' ? 'স্টকে আছে' : 'In Stock'}
                </span>
              )}
            </div>
          </div>

          {/* Product Variants Selector (Color & Size) when enabled by Admin */}
          {activeVariants.hasVariants && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              {activeVariants.hasColors && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">
                      {language === 'bn' ? 'কালার:' : 'Color:'}{' '}
                      <span className="text-rose-600">*</span>
                    </span>
                    {selectedColor && (
                      <span className="text-[#065367] font-bold">{selectedColor}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeVariants.colors.map(colorOpt => {
                      const isSelected = selectedColor === colorOpt;
                      return (
                        <button
                          key={colorOpt}
                          type="button"
                          onClick={() => {
                            setSelectedColor(colorOpt);
                            setVariantError(null);
                          }}
                          className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                            isSelected
                              ? 'bg-[#065367] text-white border-[#065367] shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-[#065367]/50'
                          }`}
                        >
                          {colorOpt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeVariants.hasSizes && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">
                      {language === 'bn' ? 'সাইজ:' : 'Size:'}{' '}
                      <span className="text-rose-600">*</span>
                    </span>
                    {selectedSize && (
                      <span className="text-[#065367] font-bold">{selectedSize}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeVariants.sizes.map(sizeOpt => {
                      const isSelected = selectedSize === sizeOpt;
                      return (
                        <button
                          key={sizeOpt}
                          type="button"
                          onClick={() => {
                            setSelectedSize(sizeOpt);
                            setVariantError(null);
                          }}
                          className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                            isSelected
                              ? 'bg-[#065367] text-white border-[#065367] shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-[#065367]/50'
                          }`}
                        >
                          {sizeOpt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {variantError && (
                <p className="text-xs text-rose-600 font-semibold flex items-center gap-1.5 pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{variantError}</span>
                </p>
              )}
            </div>
          )}

          {/* Quantity Selector on Left, Right-Aligned Prices on Right */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-4">
            {!isOutOfStock ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">
                  {language === 'bn' ? 'পরিমাণ:' : 'Qty:'}
                </span>
                <div className="flex items-center border border-slate-300 rounded-md bg-white shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                    className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={product.stock}
                    value={quantity}
                    onChange={e => handleQuantityChange(Number(e.target.value))}
                    aria-label="Product quantity"
                    className="w-10 text-center font-bold text-slate-800 text-xs focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= product.stock}
                    aria-label="Increase quantity"
                    className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-400 italic">
                {language === 'bn' ? 'পাওয়া যাচ্ছে না' : 'Unavailable'}
              </span>
            )}

            <div className="flex flex-col items-end text-right ml-auto">
              {hasDiscount && product.originalPrice && (
                <span className="text-xs text-slate-400 line-through tabular-nums text-right leading-none mb-0.5">
                  ৳{product.originalPrice.toLocaleString()}
                </span>
              )}
              <span className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums text-right leading-tight">
                ৳{product.sellingPrice.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Action Buttons: Add To Cart & Order Now on the SAME horizontal line */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              type="button"
              className={`w-full py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                isOutOfStock
                  ? 'border-slate-200 text-slate-400 bg-slate-100 cursor-not-allowed'
                  : justAdded
                  ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
                  : 'border-[#065367] text-[#065367] bg-white hover:bg-[#065367]/5 active:scale-[0.98]'
              }`}
            >
              {justAdded ? (
                <Check className="w-4 h-4 text-emerald-700 shrink-0 stroke-[2.5]" />
              ) : (
                <ShoppingCart className="w-4 h-4 shrink-0" />
              )}
              <span className="truncate">
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
              onClick={handleOrderNow}
              disabled={isOutOfStock}
              type="button"
              className={`w-full py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all text-white ${
                isOutOfStock
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-[#065367] hover:bg-[#086982] shadow-xs active:scale-[0.98]'
              }`}
            >
              <Zap className="w-4 h-4 fill-white text-white shrink-0" />
              <span className="truncate">
                {language === 'bn' ? 'অর্ডার করুন' : 'Order Now'}
              </span>
            </button>
          </div>

          {/* Product Description Only (Promotional/informational cards below removed) */}
          <div className="pt-3 border-t border-slate-200 space-y-1.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {language === 'bn' ? 'পণ্যের বিবরণ' : 'Product Description'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {localizedProduct.description}
            </p>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="pt-6 border-t border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {language === 'bn' ? 'সম্পর্কিত পণ্যসমূহ' : 'Related Products'}
            </h2>
            <button
              onClick={() => category && navigate(`products?category=${category.id}`)}
              className="text-xs font-semibold text-[#065367] hover:underline"
            >
              {language === 'bn' ? 'আরও দেখুন' : 'View More'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
            {relatedProducts.map(rel => (
              <ProductCard
                key={rel.id}
                product={rel}
                onViewDetails={id => navigate(`product?id=${id}`)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
