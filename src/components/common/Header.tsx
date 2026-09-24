import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Heart, User, Menu, X, Sparkles, ShieldCheck } from 'lucide-react';
import { cartStorage } from '../../services/cartStorage';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPath, onNavigate, onOpenSearch }) => {
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(cartStorage.getCurrentUser());

  useEffect(() => {
    const updateCounts = () => {
      const cart = cartStorage.getCart();
      const count = cart.items.reduce((acc, i) => acc + i.quantity, 0);
      setCartCount(count);

      const wishlist = cartStorage.getWishlist();
      setWishlistCount(wishlist.length);

      setUser(cartStorage.getCurrentUser());
    };

    updateCounts();

    window.addEventListener('saena_cart_updated', updateCounts);
    window.addEventListener('saena_wishlist_updated', updateCounts);
    window.addEventListener('saena_auth_updated', updateCounts);

    return () => {
      window.removeEventListener('saena_cart_updated', updateCounts);
      window.removeEventListener('saena_wishlist_updated', updateCounts);
      window.removeEventListener('saena_auth_updated', updateCounts);
    };
  }, []);

  const navLinks = [
    { label: 'Koleksi', path: '/produk' },
    { label: 'Gamis', path: '/kategori/gamis' },
    { label: 'Dress Muslim', path: '/kategori/dress-muslim' },
    { label: 'Mukena', path: '/kategori/mukena' },
    { label: 'Hijab', path: '/kategori/hijab' },
    { label: 'Daster Chic', path: '/kategori/daster' },
    { label: 'Setelan', path: '/kategori/setelan' },
  ];

  return (
    <>
      {/* Top Notification Announcement Bar */}
      <div className="bg-[#0F172A] text-slate-100 text-xs py-2 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
        <span>Gratis Ongkir se-Indonesia & Voucher Diskon hingga Rp 50.000 dengan kode <strong>SAENABARU</strong></span>
      </div>

      {/* Main Header following Top Bar Contract: 3 zones */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Zone 1: Brand title, single clean text wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-stone-100 transition-colors"
              aria-label="Buka Menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <button
              onClick={() => onNavigate('/')}
              className="text-left group flex items-baseline gap-1.5 focus:outline-none"
            >
              <span className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 group-hover:text-blue-900 transition-colors">
                Saena<span className="text-amber-600 font-sans text-xl font-semibold">.id</span>
              </span>
            </button>
          </div>

          {/* Zone 2: Clean text navigation links */}
          <nav className="hidden lg:flex items-center gap-7 text-[14px] font-medium text-slate-700">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => onNavigate(link.path)}
                  className={`relative py-1 transition-colors hover:text-slate-900 whitespace-nowrap ${
                    isActive ? 'text-blue-900 font-semibold' : ''
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-900 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary interactive controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search */}
            <button
              onClick={onOpenSearch}
              className="p-2.5 text-slate-700 hover:text-slate-900 rounded-full hover:bg-stone-100 transition-colors"
              title="Cari Busana Muslim"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist (Desktop) */}
            <button
              onClick={() => onNavigate('/account/profile')}
              className="hidden sm:flex relative p-2.5 text-slate-700 hover:text-slate-900 rounded-full hover:bg-stone-100 transition-colors"
              title="Favorit Saya"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 bg-amber-600 text-white text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Icon */}
            <button
              onClick={() => onNavigate('/cart')}
              className="relative p-2.5 text-slate-700 hover:text-slate-900 rounded-full hover:bg-stone-100 transition-colors"
              title="Keranjang Belanja"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-blue-900 text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Account Icon */}
            <button
              onClick={() => onNavigate('/account')}
              className="p-2.5 text-slate-700 hover:text-slate-900 rounded-full hover:bg-stone-100 transition-colors flex items-center gap-1.5"
              title="Akun Saya"
            >
              <User className="w-5 h-5" />
              {user && (
                <span className="hidden xl:inline text-xs font-medium text-slate-700 max-w-[90px] truncate">
                  {user.name.split(' ')[0]}
                </span>
              )}
            </button>

            {/* Admin shortcut button */}
            <button
              onClick={() => onNavigate('/admin')}
              className="hidden md:flex items-center gap-1 ml-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
              title="Buka Dashboard Admin"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-900" />
              <span>Admin</span>
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <span className="font-serif text-2xl font-bold text-slate-900">
                Saena<span className="text-amber-600 font-sans text-lg">.id</span>
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-500 hover:text-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">
                Kategori Busana
              </div>
              {navLinks.map(link => (
                <button
                  key={link.path}
                  onClick={() => {
                    onNavigate(link.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPath === link.path
                      ? 'bg-blue-50 text-blue-900 font-semibold'
                      : 'text-slate-700 hover:bg-stone-100'
                  }`}
                >
                  {link.label}
                </button>
              ))}

              <div className="pt-4 border-t border-stone-100 mt-4 text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">
                Menu Lainnya
              </div>
              <button
                onClick={() => {
                  onNavigate('/account/orders');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-stone-100"
              >
                Lacak Pesanan Saya
              </button>
              <button
                onClick={() => {
                  onNavigate('/about');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-stone-100"
              >
                Tentang Saena.id
              </button>
              <button
                onClick={() => {
                  onNavigate('/faq');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-stone-100"
              >
                Pertanyaan Umum (FAQ)
              </button>
              <button
                onClick={() => {
                  onNavigate('/contact');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-stone-100"
              >
                Hubungi Customer Care
              </button>

              <div className="pt-4 border-t border-stone-100">
                <button
                  onClick={() => {
                    onNavigate('/admin');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-blue-900 bg-blue-50 hover:bg-blue-100"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Admin Dashboard
                  </span>
                  <span className="text-xs bg-white text-blue-900 px-2 py-0.5 rounded border border-blue-200">Buka</span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 text-xs text-slate-500">
              <p className="font-medium text-slate-700">Butuh Bantuan Cepat?</p>
              <p className="mt-0.5">WhatsApp CS: +62 812-3456-7890</p>
              <p className="text-[11px] text-slate-400 mt-1">Senin - Sabtu: 08.00 - 21.00 WIB</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
