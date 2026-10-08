import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';
import { productService } from '../services/ProductService';
import { useLanguage } from './LanguageContext';

interface WishlistContextType {
  wishlistIds: string[];
  wishlistProducts: Product[];
  wishlistCount: number;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => boolean;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
  wishlistToast: string | null;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = 'eksho_rokom_wishlist_v1';

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter(id => typeof id === 'string');
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [wishlistToast, setWishlistToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistIds));
    } catch {
      // ignore
    }
  }, [wishlistIds]);

  const syncWishlistProducts = async (ids: string[]) => {
    if (ids.length === 0) {
      setWishlistProducts([]);
      return;
    }
    try {
      const allProducts = await productService.getProducts();
      const map = new Map(allProducts.map(p => [p.id, p]));
      const ordered = ids
        .map(id => map.get(id))
        .filter((p): p is Product => Boolean(p));
      setWishlistProducts(ordered);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    syncWishlistProducts(wishlistIds);
    const handleProductsUpdated = () => syncWishlistProducts(wishlistIds);
    window.addEventListener('products-updated', handleProductsUpdated);
    return () => window.removeEventListener('products-updated', handleProductsUpdated);
  }, [wishlistIds]);

  const showToast = (msg: string) => {
    setWishlistToast(msg);
    setTimeout(() => {
      setWishlistToast(null);
    }, 2000);
  };

  const isInWishlist = (productId: string): boolean => {
    return wishlistIds.includes(productId);
  };

  const toggleWishlist = (product: Product): boolean => {
    const alreadySaved = wishlistIds.includes(product.id);
    if (alreadySaved) {
      setWishlistIds(prev => prev.filter(id => id !== product.id));
      showToast(language === 'bn' ? 'উইশলিস্ট থেকে সরানো হয়েছে' : 'Removed from Wishlist');
      return false;
    } else {
      setWishlistIds(prev => [product.id, ...prev.filter(id => id !== product.id)]);
      showToast(language === 'bn' ? 'উইশলিস্টে যোগ করা হয়েছে' : 'Saved to Wishlist');
      return true;
    }
  };

  const removeFromWishlist = (productId: string) => {
    setWishlistIds(prev => prev.filter(id => id !== productId));
    showToast(language === 'bn' ? 'উইশলিস্ট থেকে সরানো হয়েছে' : 'Removed from Wishlist');
  };

  const clearWishlist = () => {
    setWishlistIds([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistProducts,
        wishlistCount: wishlistIds.length,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
        wishlistToast,
      }}
    >
      {children}
      {wishlistToast && (
        <div className="fixed bottom-20 md:bottom-5 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-5 z-50 bg-slate-900/95 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg border border-slate-700 flex items-center gap-2 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
          <span>{wishlistToast}</span>
        </div>
      )}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return ctx;
};
