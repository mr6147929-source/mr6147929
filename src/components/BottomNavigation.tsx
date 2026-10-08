import React from 'react';
import { Home, Grid, ShoppingCart, Package, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

interface BottomNavigationProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentPath,
  navigate,
}) => {
  const { totalItemCount, cartIconPulse } = useCart();
  const { language } = useLanguage();

  const isHome = currentPath === 'home' || currentPath === '';
  const isCategories = currentPath.startsWith('categories');
  const isCart = currentPath === 'cart' || currentPath === 'checkout';
  const isProducts = currentPath.startsWith('products') || currentPath.startsWith('product');
  const isAccount =
    currentPath === 'order-tracking' ||
    currentPath === 'account' ||
    currentPath === 'profile';

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]"
    >
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto px-1">
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => navigate('home')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            isHome ? 'text-[#065367]' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Home className={`w-5 h-5 ${isHome ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] font-semibold tracking-tight">
            {language === 'bn' ? 'হোম' : 'Home'}
          </span>
        </button>

        {/* 2. Categories */}
        <button
          type="button"
          onClick={() => navigate('categories')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            isCategories ? 'text-[#065367]' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Grid className={`w-5 h-5 ${isCategories ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] font-semibold tracking-tight">
            {language === 'bn' ? 'ক্যাটাগরি' : 'Categories'}
          </span>
        </button>

        {/* 3. Center Highlighted Cart Button */}
        <div className="flex items-center justify-center relative">
          <button
            id="bottom-nav-cart-button"
            type="button"
            onClick={() => navigate('cart')}
            aria-label={language === 'bn' ? 'শপিং কার্ট' : 'Shopping Cart'}
            className={`-mt-11 w-13 h-13 rounded-full bg-[#065367] text-white shadow-md border-4 border-white flex flex-col items-center justify-center relative transition-transform active:scale-95 ${
              isCart ? 'ring-2 ring-[#065367]/30' : ''
            } ${cartIconPulse ? 'scale-110 ring-4 ring-[#065367]/30' : 'scale-100'}`}
          >
            <ShoppingCart className="w-5 h-5 -mt-0.5" />
            {totalItemCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold flex items-center justify-center border border-white tabular-nums">
                {totalItemCount}
              </span>
            )}
          </button>
          <span
            onClick={() => navigate('cart')}
            className={`absolute bottom-1.5 text-[10px] font-semibold tracking-tight cursor-pointer ${
              isCart ? 'text-[#065367] font-bold' : 'text-slate-600'
            }`}
          >
            {language === 'bn' ? 'কার্ট' : 'Cart'}
          </span>
        </div>

        {/* 4. Products */}
        <button
          type="button"
          onClick={() => navigate('products')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            isProducts ? 'text-[#065367]' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Package className={`w-5 h-5 ${isProducts ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] font-semibold tracking-tight">
            {language === 'bn' ? 'সকল পণ্য' : 'Products'}
          </span>
        </button>

        {/* 5. Profile / Order Tracking */}
        <button
          type="button"
          onClick={() => navigate('order-tracking')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            isAccount ? 'text-[#065367]' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <User className={`w-5 h-5 ${isAccount ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] font-semibold tracking-tight">
            {language === 'bn' ? 'প্রোফাইল' : 'Profile'}
          </span>
        </button>
      </div>
    </nav>
  );
};
