import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Menu, X, ArrowRight, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useLanguage } from '../context/LanguageContext';
import { footerService } from '../services/FooterService';

interface HeaderProps {
  currentPath: string;
  navigate: (path: string) => void;
  onSearchSubmit?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPath, navigate, onSearchSubmit }) => {
  const { totalItemCount, cartIconPulse } = useCart();
  const { wishlistCount } = useWishlist();
  const { language, localizeAnnouncement } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [announcementText, setAnnouncementText] = useState(
    'Craft Materials & DIY Supplies for Miniature Making · Nationwide Home Delivery Across Bangladesh'
  );

  useEffect(() => {
    const loadAnnouncement = async () => {
      try {
        const text = await footerService.getAnnouncementText();
        setAnnouncementText(text);
      } catch {
        // ignore
      }
    };
    loadAnnouncement();
    window.addEventListener('footer-sections-updated', loadAnnouncement);
    return () => window.removeEventListener('footer-sections-updated', loadAnnouncement);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (onSearchSubmit) {
        onSearchSubmit(searchQuery.trim());
      }
      navigate(`products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { label: language === 'bn' ? 'হোম' : 'Home', path: 'home' },
    { label: language === 'bn' ? 'সকল পণ্য' : 'Products', path: 'products' },
    { label: language === 'bn' ? 'ক্যাটাগরি' : 'Categories', path: 'categories' },
    { label: language === 'bn' ? 'অর্ডার ট্র্যাকিং' : 'Track Order', path: 'order-tracking' },
    { label: language === 'bn' ? 'আমাদের সম্পর্কে' : 'About', path: 'about' },
    { label: language === 'bn' ? 'যোগাযোগ' : 'Contact', path: 'contact' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 transition-all">
      {/* Top micro announcement bar */}
      <div className="bg-[#065367] text-white text-xs py-1.5 overflow-hidden font-medium">
        <div className="animate-announcement-marquee">
          <span>{localizeAnnouncement(announcementText)}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4 min-w-0">
          {/* Zone 1: Single-Line Brand Name with Defined Replaceable Logo Placeholder */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
            <button
              onClick={() => {
                navigate('home');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 sm:gap-2.5 text-left group focus:outline-none min-w-0"
              title="Eksho Rokom - Home"
            >
              <div
                id="eksho-rokom-logo-slot"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#065367] text-white flex items-center justify-center font-bold text-sm tracking-tighter shrink-0 border border-[#065367]/20 shadow-xs"
                title="Eksho Rokom Logo"
              >
                <svg
                  className="w-5 h-5 fill-current text-amber-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
              </div>

              <span className="text-lg sm:text-2xl font-bold tracking-tight text-[#065367] whitespace-nowrap truncate">
                Eksho Rokom
              </span>
            </button>
          </div>

          {/* Zone 2: Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
            {navLinks.map(link => {
              const isActive =
                currentPath === link.path ||
                (link.path === 'products' && currentPath.startsWith('products')) ||
                (link.path === 'categories' && currentPath.startsWith('categories')) ||
                (link.path === 'order-tracking' &&
                  (currentPath === 'account' || currentPath === 'profile'));
              return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`transition-colors hover:text-[#065367] py-1 border-b-2 font-medium ${
                    isActive
                      ? 'text-[#065367] border-[#065367] font-semibold'
                      : 'border-transparent text-slate-600'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Search, Wishlist, Cart & Mobile Menu — Balanced, compact, always inside viewport */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Desktop Search Bar */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center relative">
              <input
                type="text"
                placeholder={language === 'bn' ? 'পণ্য খুঁজুন...' : 'Search products...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-44 lg:w-56 pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#065367]/20 focus:border-[#065367] transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 pointer-events-none" />
            </form>

            {/* Mobile Search Button */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="md:hidden p-1.5 text-slate-600 hover:text-[#065367] focus:outline-none shrink-0"
              aria-label={language === 'bn' ? 'খুঁজুন' : 'Search'}
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist Button beside Cart Icon — Outline heart icon, shows count badge only when > 0 */}
            <button
              id="header-wishlist-button"
              onClick={() => navigate('wishlist')}
              className={`relative flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg transition-all border shrink-0 ${
                currentPath === 'wishlist'
                  ? 'border-[#065367]/40 bg-slate-50 text-[#065367]'
                  : 'border-slate-200 hover:border-[#065367]/40 bg-slate-50/50 text-slate-700 hover:text-[#065367]'
              }`}
              aria-label={language === 'bn' ? 'উইশলিস্ট' : 'Wishlist'}
              title={language === 'bn' ? 'উইশলিস্ট' : 'Saved Wishlist'}
            >
              <Heart className="w-4 h-4 text-slate-700 fill-none stroke-[2]" />
              <span className="hidden sm:inline text-xs font-semibold text-slate-800">
                {language === 'bn' ? 'উইশলিস্ট' : 'Wishlist'}
              </span>
              {wishlistCount > 0 && (
                <span className="flex items-center justify-center min-w-4.5 h-4.5 px-1 text-[11px] font-bold text-white bg-rose-600 rounded-full tabular-nums">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Button with standard ShoppingCart icon */}
            <button
              id="header-cart-button"
              onClick={() => navigate('cart')}
              className={`relative flex items-center gap-1 px-2 sm:px-3 py-1.5 text-slate-700 hover:text-[#065367] rounded-lg transition-all border border-slate-200 hover:border-[#065367]/40 bg-slate-50/50 shrink-0 ${
                cartIconPulse ? 'scale-110 ring-2 ring-[#065367]/30' : 'scale-100'
              }`}
              aria-label={language === 'bn' ? 'কার্ট' : 'Cart'}
            >
              <ShoppingCart className="w-4 h-4 text-[#065367]" />
              <span className="hidden sm:inline text-xs font-semibold text-slate-800">
                {language === 'bn' ? 'কার্ট' : 'Cart'}
              </span>
              {totalItemCount > 0 && (
                <span className="flex items-center justify-center min-w-4.5 h-4.5 px-1 text-[11px] font-bold text-white bg-[#065367] rounded-full tabular-nums">
                  {totalItemCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-slate-600 hover:text-[#065367] focus:outline-none shrink-0"
              aria-label={language === 'bn' ? 'মেনু' : 'Toggle Menu'}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Box (Expanded) */}
        {searchOpen && (
          <div className="md:hidden py-2 border-t border-slate-100">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                autoFocus
                placeholder={
                  language === 'bn'
                    ? 'পণ্য খুঁজুন (যেমন: পিভিসি বোর্ড, গ্লু, ছুরি)...'
                    : 'Search products (e.g., PVC Board, Glue, Knife)...'
                }
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#065367]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </form>
          </div>
        )}
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-1 shadow-lg">
          <div className="py-2">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder={language === 'bn' ? 'পণ্য খুঁজুন...' : 'Search products...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#065367]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </form>
          </div>

          {navLinks.map(link => (
            <button
              key={link.path}
              onClick={() => {
                navigate(link.path);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm font-medium rounded-lg transition-colors ${
                currentPath === link.path
                  ? 'bg-[#065367]/10 text-[#065367] font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{link.label}</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          ))}

          <button
            onClick={() => {
              navigate('wishlist');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm font-medium rounded-lg transition-colors ${
              currentPath === 'wishlist'
                ? 'bg-rose-50 text-rose-600 font-semibold'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-slate-700 fill-none stroke-[2]" />
              <span>
                {language === 'bn' ? 'পছন্দের তালিকা' : 'Saved Wishlist'}
                {wishlistCount > 0 ? ` (${wishlistCount})` : ''}
              </span>
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      )}
    </header>
  );
};
