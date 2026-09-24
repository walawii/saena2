import React, { useState, useEffect } from 'react';
import { Home, Grid, Search, ShoppingBag, User } from 'lucide-react';
import { cartStorage } from '../../services/cartStorage';

interface MobileBottomNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenSearch: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentPath,
  onNavigate,
  onOpenSearch,
}) => {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const update = () => {
      const cart = cartStorage.getCart();
      const count = cart.items.reduce((sum, i) => sum + i.quantity, 0);
      setCartCount(count);
    };

    update();
    window.addEventListener('saena_cart_updated', update);
    return () => window.removeEventListener('saena_cart_updated', update);
  }, []);

  const navItems = [
    { label: 'Home', path: '/', icon: Home, isAction: false },
    { label: 'Katalog', path: '/produk', icon: Grid, isAction: false },
    { label: 'Cari', path: '/search', icon: Search, isAction: true, action: onOpenSearch },
    { label: 'Keranjang', path: '/cart', icon: ShoppingBag, isAction: false, badge: cartCount },
    { label: 'Akun', path: '/account', icon: User, isAction: false },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/80 px-2 py-1 shadow-lg"
      aria-label="Mobile Navigation Bar"
    >
      <div className="grid grid-cols-5 items-center justify-around h-14 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              onClick={() => {
                if (item.isAction && item.action) {
                  item.action();
                } else {
                  onNavigate(item.path);
                }
              }}
              className={`flex flex-col items-center justify-center py-1 transition-colors relative ${
                isActive ? 'text-blue-900 font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-blue-900 text-white text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center ring-1 ring-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
