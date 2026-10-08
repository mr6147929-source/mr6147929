import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { CartProvider, useCart } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { BottomNavigation } from './components/BottomNavigation';

// Pages
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailsPage } from './pages/ProductDetailsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CartPage } from './pages/CartPage';
import { WishlistPage } from './pages/WishlistPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { AdminSalesApp } from './pages/AdminSalesApp';

interface ParsedRoute {
  path: string;
  params: Record<string, string>;
}

function parseLocationHash(): ParsedRoute {
  const hash = window.location.hash.replace(/^#\/?/, '') || 'home';
  const [pathPart, queryPart] = hash.split('?');
  const params: Record<string, string> = {};

  if (queryPart) {
    const searchParams = new URLSearchParams(queryPart);
    searchParams.forEach((val, key) => {
      params[key] = val;
    });
  }

  return {
    path: pathPart || 'home',
    params,
  };
}

const AppContent: React.FC = () => {
  const [route, setRoute] = useState<ParsedRoute>(parseLocationHash);
  const { feedbackMessage } = useCart();

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseLocationHash());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (fullPath: string) => {
    const cleanPath = fullPath.replace(/^#\/?/, '');
    window.location.hash = `#${cleanPath}`;
  };

  if (route.path === 'admin' || route.path === 'sales-admin') {
    return <AdminSalesApp />;
  }

  const renderCurrentPage = () => {
    switch (route.path) {
      case 'home':
        return <HomePage navigate={navigate} />;

      case 'products':
        return (
          <ProductsPage
            navigate={navigate}
            initialCategoryId={route.params.category}
            initialSearchQuery={route.params.search}
          />
        );

      case 'product':
        return (
          <ProductDetailsPage
            productId={route.params.id || 'prod-pvc-2mm'}
            navigate={navigate}
          />
        );

      case 'categories':
        return <CategoriesPage navigate={navigate} />;

      case 'cart':
        return <CartPage navigate={navigate} />;

      case 'wishlist':
        return <WishlistPage navigate={navigate} />;

      case 'checkout':
        return <CheckoutPage navigate={navigate} />;

      case 'order-confirmation':
        return (
          <OrderConfirmationPage
            orderNumber={route.params.orderNumber || ''}
            navigate={navigate}
          />
        );

      case 'order-tracking':
      case 'account':
      case 'profile':
        return (
          <OrderTrackingPage
            initialOrderNumber={route.params.orderNumber}
            navigate={navigate}
          />
        );

      case 'about':
        return <AboutPage navigate={navigate} />;

      case 'contact':
        return <ContactPage />;

      default:
        return <HomePage navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800">
      {/* Toast Notification */}
      {feedbackMessage && (
        <div className="fixed bottom-20 md:bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Header */}
      <Header
        currentPath={route.path}
        navigate={navigate}
        onSearchSubmit={q => navigate(`products?search=${encodeURIComponent(q)}`)}
      />

      {/* Main Page Body */}
      <main className="flex-1 pb-4 md:pb-0">{renderCurrentPage()}</main>

      {/* Footer */}
      <Footer navigate={navigate} />

      {/* Fixed Bottom Navigation (Mobile Only) */}
      <BottomNavigation currentPath={route.path} navigate={navigate} />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <WishlistProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </WishlistProvider>
    </LanguageProvider>
  );
}
