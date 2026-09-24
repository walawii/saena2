import React, { useState, useEffect } from 'react';
import { User as UserIcon, Package, MapPin, Heart, LogOut, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { User, Order, Product, ShippingAddress } from '../types';
import { cartStorage } from '../services/cartStorage';
import { api } from '../services/api';
import { ProductCard } from '../components/product/ProductCard';

interface AccountPageProps {
  onNavigate: (path: string) => void;
  onAddToCartSuccess: (message: string) => void;
  initialTab?: 'orders' | 'profile' | 'addresses' | 'wishlist';
}

export const AccountPage: React.FC<AccountPageProps> = ({
  onNavigate,
  onAddToCartSuccess,
  initialTab = 'orders'
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(cartStorage.getCurrentUser());
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'addresses' | 'wishlist'>(initialTab);

  // Auth form state for guests
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Orders list state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Wishlist
  const [wishlist, setWishlist] = useState<Product[]>(cartStorage.getWishlist());

  // New Address modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addrRecipient, setAddrRecipient] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrProvince, setAddrProvince] = useState('DKI Jakarta');
  const [addrCity, setAddrCity] = useState('');
  const [addrSubdistrict, setAddrSubdistrict] = useState('');
  const [addrPostalCode, setAddrPostalCode] = useState('');
  const [addrFull, setAddrFull] = useState('');

  useEffect(() => {
    if (currentUser?.email) {
      setLoadingOrders(true);
      api.getCustomerOrders(currentUser.email)
        .then(res => setOrders(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoadingOrders(false));
    }
  }, [currentUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await api.login(email.trim(), password);
      localStorage.setItem('saena_auth_token', res.token);
      cartStorage.saveCurrentUser(res.user);
      setCurrentUser(res.user);
      onAddToCartSuccess(`Selamat datang kembali, ${res.user.name}!`);

      if (res.user.role === 'ADMIN') {
        localStorage.setItem('saena_admin_token', res.token);
        onNavigate('/admin');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Email atau kata sandi tidak valid.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (password.length < 8) {
        throw new Error('Kata sandi minimal 8 karakter');
      }

      const res = await api.register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password
      });
      localStorage.setItem('saena_auth_token', res.token);
      cartStorage.saveCurrentUser(res.user);
      setCurrentUser(res.user);
      onAddToCartSuccess('Akun berhasil didaftarkan! Selamat berbelanja di Saena.id.');
    } catch (err: any) {
      setAuthError(err.message || 'Pendaftaran akun gagal.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('saena_auth_token');
    cartStorage.saveCurrentUser(null);
    setCurrentUser(null);
    onAddToCartSuccess('Anda telah keluar dari akun.');
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const newAddress: ShippingAddress = {
        id: `addr-${Date.now()}`,
        recipientName: addrRecipient.trim(),
        phone: addrPhone.trim(),
        province: addrProvince,
        city: addrCity.trim(),
        subdistrict: addrSubdistrict.trim(),
        postalCode: addrPostalCode.trim(),
        fullAddress: addrFull.trim(),
        isDefault: currentUser.addresses.length === 0
      };

      try {
        await api.addAddress(newAddress);
      } catch (e) {
        console.warn('Persisting address locally fallback:', e);
      }

      cartStorage.addOrUpdateUserAddress(newAddress);
      const updatedUser = cartStorage.getCurrentUser();
      if (updatedUser) {
        setCurrentUser(updatedUser);
      }
      setShowAddressModal(false);
      onAddToCartSuccess('Alamat pengiriman berhasil disimpan!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // If user is not logged in: Show Login / Register form
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
        <div className="bg-white rounded-3xl border border-stone-200 shadow-md p-6 sm:p-8">
          <div className="text-center mb-6">
            <span className="font-serif text-2xl font-bold text-slate-900">
              Saena<span className="text-amber-600 font-sans text-xl">.id</span>
            </span>
            <h1 className="font-serif text-xl font-bold text-slate-900 mt-2">
              {isLoginView ? 'Masuk ke Akun Pelanggan' : 'Daftar Akun Pelanggan'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {isLoginView
                ? 'Pantau riwayat pesanan busana muslim & nikmati promo eksklusif'
                : 'Bergabung untuk kemudahan checkout & simpan alamat pengiriman'}
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {isLoginView ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-navy"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Kata Sandi</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-navy"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-navy hover:bg-navy-dark text-white font-semibold text-xs rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                {authLoading ? 'Memproses...' : 'Masuk Sekarang'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setIsLoginView(false); setAuthError(''); }}
                  className="text-xs text-slate-600 hover:text-navy font-medium cursor-pointer"
                >
                  Belum punya akun? <strong className="text-navy underline">Daftar di sini</strong>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Lengkap Anda"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-navy"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email Aktif</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-navy"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">No. WhatsApp / HP</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-navy"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Kata Sandi (Min. 8 karakter)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-navy"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-navy hover:bg-navy-dark text-white font-semibold text-xs rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                {authLoading ? 'Mendaftarkan...' : 'Daftar Akun Baru'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setIsLoginView(true); setAuthError(''); }}
                  className="text-xs text-slate-600 hover:text-navy font-medium cursor-pointer"
                >
                  Sudah punya akun? <strong className="text-navy underline">Masuk di sini</strong>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      {/* Account Header */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 mb-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 text-2xl font-serif font-bold">
            {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-slate-900">{currentUser.name}</h1>
              {currentUser.role === 'ADMIN' && (
                <span className="text-[10px] font-bold bg-navy text-gold px-2 py-0.5 rounded-full">
                  ADMIN
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{currentUser.email} &bull; {currentUser.phone}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {currentUser.role === 'ADMIN' && (
            <button
              onClick={() => onNavigate('/admin')}
              className="text-xs bg-navy text-gold hover:bg-navy-dark px-4 py-2.5 rounded-xl font-bold transition shadow-sm cursor-pointer"
            >
              Buka Portal Admin
            </button>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 px-4 py-2.5 rounded-xl font-semibold transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-stone-200 mb-8 overflow-x-auto no-scrollbar">
        {[
          { id: 'orders', label: `Pesanan Saya (${orders.length})`, icon: Package },
          { id: 'addresses', label: `Buku Alamat (${currentUser.addresses?.length || 0})`, icon: MapPin },
          { id: 'wishlist', label: `Favorit (${wishlist.length})`, icon: Heart },
          { id: 'profile', label: 'Profil Saya', icon: UserIcon }
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-xs whitespace-nowrap transition cursor-pointer ${
                active
                  ? 'border-navy text-navy font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {loadingOrders ? (
            <div className="p-12 text-center text-slate-400 text-xs">Memuat daftar pesanan...</div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-serif text-base font-bold text-slate-800">Belum Ada Pesanan</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
                Anda belum pernah melakukan pembelian busana di Saena.id. Temukan koleksi gamis &amp; mukena premium kami.
              </p>
              <button
                onClick={() => onNavigate('/produk')}
                className="bg-navy text-white text-xs font-semibold px-6 py-3 rounded-xl hover:bg-navy-dark transition shadow-sm cursor-pointer"
              >
                Mulai Belanja Sekarang
              </button>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-sm text-navy">{order.orderNumber}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      order.orderStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                      order.orderStatus === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                      order.orderStatus === 'DELIVERED' ? 'bg-purple-100 text-purple-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {order.orderStatus}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-stone-100">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-medium text-slate-800">{item.name}</span>
                        <div className="text-slate-400">
                          {item.color} / {item.size} &times; {item.quantity}
                        </div>
                      </div>
                      <span className="font-semibold text-slate-800">
                        Rp {item.subtotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-stone-100">
                  <div>
                    <span className="text-xs text-slate-500">Total Pembayaran:</span>
                    <span className="font-bold text-navy text-sm ml-2">
                      Rp {order.total.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <button
                    onClick={() => onNavigate(`/order/${order.orderNumber}`)}
                    className="flex items-center space-x-1 text-xs font-bold text-navy hover:underline cursor-pointer"
                  >
                    <span>Lacak Pesanan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB CONTENT: ADDRESSES */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-serif font-bold text-slate-900 text-lg">Alamat Pengiriman Tersimpan</h3>
            <button
              onClick={() => setShowAddressModal(true)}
              className="bg-navy hover:bg-navy-dark text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              + Tambah Alamat Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(currentUser.addresses || []).map(addr => (
              <div key={addr.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm relative">
                {addr.isDefault && (
                  <span className="absolute top-4 right-4 bg-gold/15 text-navy border border-gold/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    UTAMA
                  </span>
                )}
                <h4 className="font-bold text-slate-900 text-sm">{addr.recipientName}</h4>
                <p className="text-xs text-slate-600 mt-1">{addr.phone}</p>
                <p className="text-xs text-slate-700 mt-2 leading-relaxed">{addr.fullAddress}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {addr.subdistrict}, {addr.city}, {addr.province} - {addr.postalCode}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: WISHLIST */}
      {activeTab === 'wishlist' && (
        <div>
          {wishlist.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center">
              <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-serif text-base font-bold text-slate-800">Daftar Favorit Masih Kosong</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
                Klik ikon hati pada produk busana untuk menyimpannya di sini.
              </p>
              <button
                onClick={() => onNavigate('/produk')}
                className="bg-navy text-white text-xs font-semibold px-6 py-3 rounded-xl hover:bg-navy-dark transition shadow-sm cursor-pointer"
              >
                Jelajahi Produk
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {wishlist.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onNavigate={onNavigate}
                  onAddToCartSuccess={onAddToCartSuccess}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 max-w-xl shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-slate-900 text-lg">Informasi Akun</h3>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Nama Lengkap</span>
              <span className="text-slate-900 font-semibold text-sm">{currentUser.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Email Terdaftar</span>
              <span className="text-slate-900 font-semibold text-sm">{currentUser.email}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Nomor Telepon</span>
              <span className="text-slate-900 font-semibold text-sm">{currentUser.phone}</span>
            </div>
          </div>
        </div>
      )}

      {/* Add Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-serif font-bold text-lg text-slate-900 mb-4">Tambah Alamat Baru</h3>
            <form onSubmit={handleAddAddress} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Penerima</label>
                <input
                  type="text"
                  required
                  value={addrRecipient}
                  onChange={(e) => setAddrRecipient(e.target.value)}
                  placeholder="Contoh: Siti Rahma"
                  className="w-full p-2.5 border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp / HP</label>
                <input
                  type="tel"
                  required
                  value={addrPhone}
                  onChange={(e) => setAddrPhone(e.target.value)}
                  placeholder="08123456789"
                  className="w-full p-2.5 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Provinsi</label>
                  <input
                    type="text"
                    required
                    value={addrProvince}
                    onChange={(e) => setAddrProvince(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kota / Kabupaten</label>
                  <input
                    type="text"
                    required
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    placeholder="Contoh: Jakarta Selatan"
                    className="w-full p-2.5 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kecamatan</label>
                  <input
                    type="text"
                    required
                    value={addrSubdistrict}
                    onChange={(e) => setAddrSubdistrict(e.target.value)}
                    placeholder="Contoh: Cilandak"
                    className="w-full p-2.5 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Pos</label>
                  <input
                    type="text"
                    required
                    value={addrPostalCode}
                    onChange={(e) => setAddrPostalCode(e.target.value)}
                    placeholder="12430"
                    className="w-full p-2.5 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alamat Lengkap</label>
                <textarea
                  required
                  rows={2}
                  value={addrFull}
                  onChange={(e) => setAddrFull(e.target.value)}
                  placeholder="Nama jalan, nomor rumah, RT/RW, patokan..."
                  className="w-full p-2.5 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-2 border border-stone-300 rounded-xl text-slate-600 hover:bg-stone-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-navy text-white font-semibold rounded-xl hover:bg-navy-dark cursor-pointer"
                >
                  Simpan Alamat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
