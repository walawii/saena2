import React, { useState, useEffect } from 'react';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { SearchModal } from './components/common/SearchModal';
import { Toast } from './components/common/Toast';

import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { AccountPage } from './pages/AccountPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { FaqPage } from './pages/FaqPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Synchronize browser history and native Back/Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (path: string) => {
    if (path !== currentPath) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAddToCartSuccess = (message: string) => {
    setToastMessage(message);
  };

  // Route matching logic
  const renderCurrentPage = () => {
    // 1. Homepage
    if (currentPath === '/' || currentPath === '') {
      return (
        <HomePage
          onNavigate={handleNavigate}
          onAddToCartSuccess={handleAddToCartSuccess}
        />
      );
    }

    // 2. Product Detail: /produk/:slug
    if (currentPath.startsWith('/produk/') && currentPath !== '/produk') {
      const slug = currentPath.replace('/produk/', '');
      return (
        <ProductDetailPage
          slug={slug}
          onNavigate={handleNavigate}
          onAddToCartSuccess={handleAddToCartSuccess}
        />
      );
    }

    // 3. Category Page: /kategori/:slug
    if (currentPath.startsWith('/kategori/')) {
      const categorySlug = currentPath.replace('/kategori/', '');
      return (
        <CatalogPage
          key={categorySlug}
          initialCategory={categorySlug}
          onNavigate={handleNavigate}
          onAddToCartSuccess={handleAddToCartSuccess}
        />
      );
    }

    // 4. Product Catalog: /produk
    if (currentPath === '/produk') {
      return (
        <CatalogPage
          key="all"
          onNavigate={handleNavigate}
          onAddToCartSuccess={handleAddToCartSuccess}
        />
      );
    }

    // 5. Search Results: /search
    if (currentPath.startsWith('/search')) {
      const urlParams = new URLSearchParams(window.location.search);
      const q = urlParams.get('q') || '';
      return (
        <CatalogPage
          key={`search-${q}`}
          searchQuery={q}
          onNavigate={handleNavigate}
          onAddToCartSuccess={handleAddToCartSuccess}
        />
      );
    }

    // 6. Cart: /cart
    if (currentPath === '/cart') {
      return (
        <CartPage
          onNavigate={handleNavigate}
          onAddToCartSuccess={handleAddToCartSuccess}
        />
      );
    }

    // 7. Checkout: /checkout
    if (currentPath === '/checkout') {
      return (
        <CheckoutPage
          onNavigate={handleNavigate}
          onAddToCartSuccess={handleAddToCartSuccess}
        />
      );
    }

    // 8. Order Tracking & Detail: /order/:orderNumber
    if (currentPath.startsWith('/order/')) {
      const orderNumber = currentPath.replace('/order/', '');
      return (
        <OrderDetailPage
          orderNumber={orderNumber}
          onNavigate={handleNavigate}
          onAddToCartSuccess={handleAddToCartSuccess}
        />
      );
    }

    // 9. Account & Tabs: /account, /account/orders, /account/profile
    if (currentPath === '/account' || currentPath.startsWith('/account/')) {
      let tab: 'orders' | 'profile' | 'addresses' | 'wishlist' = 'orders';
      if (currentPath === '/account/profile') tab = 'profile';
      if (currentPath === '/account/orders') tab = 'orders';

      return (
        <AccountPage
          initialTab={tab}
          onNavigate={handleNavigate}
          onAddToCartSuccess={handleAddToCartSuccess}
        />
      );
    }

    // 10. Static Pages: /about, /contact, /faq
    if (currentPath === '/about') {
      return <AboutPage onNavigate={handleNavigate} />;
    }

    if (currentPath === '/contact') {
      return <ContactPage onAddToCartSuccess={handleAddToCartSuccess} />;
    }

    if (currentPath === '/faq') {
      return <FaqPage />;
    }

    // 11. Admin Portal: /admin
    if (currentPath.startsWith('/admin')) {
      return (
        <AdminDashboardPage
          onNavigate={handleNavigate}
          onAddToCartSuccess={handleAddToCartSuccess}
        />
      );
    }

    // Default Fallback to Homepage
    return (
      <HomePage
        onNavigate={handleNavigate}
        onAddToCartSuccess={handleAddToCartSuccess}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-800 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Top Header */}
      <Header
        currentPath={currentPath}
        onNavigate={handleNavigate}
        onOpenSearch={() => setSearchModalOpen(true)}
      />

      {/* Main Routed Content Area */}
      <main className="flex-1">
        {renderCurrentPage()}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Mobile Sticky Bottom Navigation */}
      <MobileBottomNav
        currentPath={currentPath}
        onNavigate={handleNavigate}
        onOpenSearch={() => setSearchModalOpen(true)}
      />

      {/* Global Product Search Dialog */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Toast Notification Alert */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
