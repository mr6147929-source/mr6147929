import React, { createContext, useContext, useState, useEffect } from 'react';
import { buildCartItemKey, CartItem, Product } from '../types';
import { useLanguage } from './LanguageContext';

interface FlyingAnimationItem {
  id: string;
  imageUrl: string;
  startX: number;
  startY: number;
  startW: number;
  startH: number;
  endX: number;
  endY: number;
  phase: 'initial' | 'shrinking' | 'flying';
}

export interface VariantSelection {
  selectedColor?: string;
  selectedSize?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (
    product: Product,
    quantity?: number,
    sourceImageEl?: HTMLElement | null,
    variants?: VariantSelection
  ) => boolean;
  removeFromCart: (cartItemKey: string) => void;
  updateQuantity: (cartItemKey: string, quantity: number) => boolean;
  clearCart: () => void;
  totalItemCount: number;
  subtotal: number;
  directCheckoutItem: CartItem | null;
  startDirectOrder: (
    product: Product,
    quantity?: number,
    variants?: VariantSelection
  ) => boolean;
  clearDirectOrder: () => void;
  feedbackMessage: string | null;
  showNotification: (msg: string) => void;
  cartIconPulse: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'eksho_rokom_cart';

function getItemKey(item: CartItem): string {
  return (
    item.cartItemId ||
    buildCartItemKey(item.productId, item.selectedColor, item.selectedSize)
  );
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (!stored) return [];
      const parsed: CartItem[] = JSON.parse(stored);
      return parsed.map(item => ({
        ...item,
        cartItemId: getItemKey(item),
      }));
    } catch {
      return [];
    }
  });

  const [directCheckoutItem, setDirectCheckoutItem] = useState<CartItem | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [flyingItems, setFlyingItems] = useState<FlyingAnimationItem[]>([]);
  const [cartIconPulse, setCartIconPulse] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const showNotification = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 2400);
  };

  const commitCartAddition = (
    product: Product,
    quantity: number,
    variants?: VariantSelection
  ) => {
    const selectedColor = variants?.selectedColor?.trim() || undefined;
    const selectedSize = variants?.selectedSize?.trim() || undefined;
    const targetKey = buildCartItemKey(product.id, selectedColor, selectedSize);

    setItems(prev => {
      const existingIndex = prev.findIndex(i => getItemKey(i) === targetKey);
      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].quantity;
        const newQty = Math.min(currentQty + quantity, product.stock);
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          cartItemId: targetKey,
          quantity: newQty,
          subtotal: newQty * product.sellingPrice,
          selectedColor,
          selectedSize,
        };
        return updated;
      } else {
        const qty = Math.min(quantity, product.stock);
        return [
          ...prev,
          {
            cartItemId: targetKey,
            productId: product.id,
            product,
            quantity: qty,
            unitPrice: product.sellingPrice,
            subtotal: qty * product.sellingPrice,
            selectedColor,
            selectedSize,
          },
        ];
      }
    });

    setCartIconPulse(true);
    setTimeout(() => setCartIconPulse(false), 350);
  };

  const getVisibleCartTargetRect = (): DOMRect | null => {
    const bottomNavCart = document.getElementById('bottom-nav-cart-button');
    if (bottomNavCart) {
      const rect = bottomNavCart.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return rect;
      }
    }
    const headerCart = document.getElementById('header-cart-button');
    if (headerCart) {
      const rect = headerCart.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return rect;
      }
    }
    return null;
  };

  const addToCart = (
    product: Product,
    quantity = 1,
    sourceImageEl?: HTMLElement | null,
    variants?: VariantSelection
  ): boolean => {
    if (product.stock <= 0) {
      showNotification(
        language === 'bn'
          ? 'দুঃখিত, এই পণ্যটি বর্তমানে স্টকে নেই।'
          : 'Sorry, this product is currently out of stock.'
      );
      return false;
    }

    const selectedColor = variants?.selectedColor?.trim() || undefined;
    const selectedSize = variants?.selectedSize?.trim() || undefined;
    const targetKey = buildCartItemKey(product.id, selectedColor, selectedSize);

    const existing = items.find(i => getItemKey(i) === targetKey);
    if (existing && existing.quantity + quantity > product.stock) {
      showNotification(
        language === 'bn'
          ? `সর্বোচ্চ ${product.stock}টি পণ্য স্টকে রয়েছে।`
          : `Maximum available stock is ${product.stock} products.`
      );
      return false;
    }

    const targetRect = getVisibleCartTargetRect();
    const sourceRect = sourceImageEl ? sourceImageEl.getBoundingClientRect() : null;

    if (sourceRect && targetRect && product.images && product.images[0]) {
      const animId = `fly-${Date.now()}-${Math.random()}`;
      const endX = targetRect.left + targetRect.width / 2 - 16;
      const endY = targetRect.top + targetRect.height / 2 - 16;

      const newFly: FlyingAnimationItem = {
        id: animId,
        imageUrl: product.images[0],
        startX: sourceRect.left,
        startY: sourceRect.top,
        startW: sourceRect.width,
        startH: sourceRect.height,
        endX,
        endY,
        phase: 'initial',
      };

      setFlyingItems(prev => [...prev, newFly]);

      // Stage 1: Gradually shrink in place so customer clearly feels the shrink
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setFlyingItems(prev =>
            prev.map(f => (f.id === animId ? { ...f, phase: 'shrinking' } : f))
          );
        });
      });

      // Stage 2: Smoothly glide toward the cart icon
      setTimeout(() => {
        setFlyingItems(prev =>
          prev.map(f => (f.id === animId ? { ...f, phase: 'flying' } : f))
        );
      }, 420);

      // Complete animation & update cart count after it reaches the cart icon
      setTimeout(() => {
        setFlyingItems(prev => prev.filter(f => f.id !== animId));
        commitCartAddition(product, quantity, variants);
      }, 1650);

      return true;
    }

    // Fallback if no DOM elements available
    commitCartAddition(product, quantity, variants);
    return true;
  };

  const removeFromCart = (cartItemKey: string) => {
    setItems(prev =>
      prev.filter(
        i => getItemKey(i) !== cartItemKey && i.productId !== cartItemKey
      )
    );
  };

  const updateQuantity = (cartItemKey: string, quantity: number): boolean => {
    const existing = items.find(
      i => getItemKey(i) === cartItemKey || i.productId === cartItemKey
    );
    if (!existing) return false;

    const exactKey = getItemKey(existing);

    if (quantity <= 0) {
      removeFromCart(exactKey);
      return true;
    }

    if (quantity > existing.product.stock) {
      showNotification(
        language === 'bn'
          ? `সর্বোচ্চ ${existing.product.stock}টি পণ্য স্টকে রয়েছে।`
          : `Maximum available stock is ${existing.product.stock} products.`
      );
      return false;
    }

    setItems(prev =>
      prev.map(item =>
        getItemKey(item) === exactKey
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.unitPrice,
            }
          : item
      )
    );
    return true;
  };

  const clearCart = () => {
    setItems([]);
  };

  const startDirectOrder = (
    product: Product,
    quantity = 1,
    variants?: VariantSelection
  ): boolean => {
    if (product.stock <= 0) {
      showNotification(
        language === 'bn'
          ? 'দুঃখিত, এই পণ্যটি বর্তমানে স্টকে নেই।'
          : 'Sorry, this product is currently out of stock.'
      );
      return false;
    }

    const selectedColor = variants?.selectedColor?.trim() || undefined;
    const selectedSize = variants?.selectedSize?.trim() || undefined;
    const qty = Math.min(quantity, product.stock);
    setDirectCheckoutItem({
      cartItemId: buildCartItemKey(product.id, selectedColor, selectedSize),
      productId: product.id,
      product,
      quantity: qty,
      unitPrice: product.sellingPrice,
      subtotal: qty * product.sellingPrice,
      selectedColor,
      selectedSize,
    });
    return true;
  };

  const clearDirectOrder = () => {
    setDirectCheckoutItem(null);
  };

  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItemCount,
        subtotal,
        directCheckoutItem,
        startDirectOrder,
        clearDirectOrder,
        feedbackMessage,
        showNotification,
        cartIconPulse,
      }}
    >
      {children}

      {/* Smooth Two-Stage Shrink & Fly-to-Cart Overlay */}
      {flyingItems.map(fly => {
        const isShrinking = fly.phase === 'shrinking';
        const isFlying = fly.phase === 'flying';

        const shrinkW = Math.max(44, fly.startW * 0.42);
        const shrinkH = Math.max(44, fly.startH * 0.42);
        const shrinkX = fly.startX + (fly.startW - shrinkW) / 2;
        const shrinkY = fly.startY + (fly.startH - shrinkH) / 2;

        return (
          <img
            key={fly.id}
            src={fly.imageUrl}
            alt=""
            aria-hidden="true"
            style={{
              position: 'fixed',
              zIndex: 9999,
              pointerEvents: 'none',
              objectFit: 'cover',
              left: isFlying ? `${fly.endX}px` : isShrinking ? `${shrinkX}px` : `${fly.startX}px`,
              top: isFlying ? `${fly.endY}px` : isShrinking ? `${shrinkY}px` : `${fly.startY}px`,
              width: isFlying ? '28px' : isShrinking ? `${shrinkW}px` : `${fly.startW}px`,
              height: isFlying ? '28px' : isShrinking ? `${shrinkH}px` : `${fly.startH}px`,
              borderRadius: isFlying ? '9999px' : '12px',
              opacity: isFlying ? 0.25 : 0.96,
              boxShadow: '0 12px 28px rgba(6, 83, 103, 0.32)',
              border: '2px solid #065367',
              transition: isFlying
                ? 'all 1.2s cubic-bezier(0.22, 1, 0.36, 1)'
                : 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        );
      })}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
};
