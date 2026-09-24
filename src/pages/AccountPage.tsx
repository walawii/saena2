import React, { useState, useEffect } from 'react';
import { User as UserIcon, Package, MapPin, Heart, LogOut, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { User, Order, Product } from '../types';
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
        localStorage.setItem('saena_admin_key', process.env.ADMIN_KEY || 'admin_saena_secret_pass');
        onNavigate('/admin');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Login gagal.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await api.register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim()
      });
      localStorage.setItem('saena_auth_token', res.token);
      cartStorage.saveCurrentUser(res.user);
      setCurrentUser(res.user);
      onAddToCartSuccess('Akun berhasil dibuat! Selamat berbelanja di Saena.id.');
    } catch (err: any) {
      setAuthError(err.message || 'Pendaftaran gagal.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    cartStorage.saveCurrentUser(null);
    setCurrentUser(null);
    onAddToCartSuccess('Anda telah keluar dari akun.');
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const newAddress = {
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

      const updatedAddrs = cartStorage.addOrUpdateUserAddress(newAddress);
      setCurrentUser({ ...currentUser, addresses: updatedAddrs });
      setShowAddressModal(false);
      onAddToCartSuccess('Alamat pengiriman berhasil ditambahkan!');
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
              {isLoginView ? 'Masuk ke Akun Anda' : 'Daftar Akun Baru'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {isLoginView
                ? 'Pantau pesanan busana dan nikmati promo eksklusif'
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
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-blue-900"
                />
                <p className="text-[11px] text-slate-400 mt-1">Demo login: Masukkan email apa saja atau admin@saena.id</p>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-blue-900 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-md transition-colors"
              >
                {authLoading ? 'Memproses...' : 'Masuk Sekarang'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setIsLoginView(false); setAuthError(''); }}
                  className="text-xs text-slate-600 hover:text-blue-900 font-medium"
                >
                  Belum punya akun? <strong className="text-blue-900 underline">Daftar di sini</strong>
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
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-blue-900"
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
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">No. WhatsApp / HP</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08123456789"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-blue-900"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-blue-900 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-md transition-colors"
              >
                {authLoading ? 'Mendaftarkan...' : 'Daftar Akun Baru'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setIsLoginView(true); setAuthError(''); }}
                  className="text-xs text-slate-600 hover:text-blue-900 font-medium"
                >
                  Sudah punya akun? <strong className="text-blue-900 underline">Masuk di sini</strong>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Logged-in Customer Dashboard View
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-900 text-white font-serif text-xl font-bold flex items-center justify-center">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-slate-900">{currentUser.name}</h1>
            <p className="text-xs text-slate-500">{currentUser.email} · {currentUser.phone}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Akun</span>
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-2 border-b border-stone-200 mb-8 overflow-x-auto pb-1 text-xs sm:text-sm font-semibold">
        {[
          { key: 'orders', label: 'Riwayat Pesanan', icon: Package },
          { key: 'addresses', label: 'Buku Alamat', icon: MapPin },
          { key: 'wishlist', label: 'Favorit Saya', icon: Heart },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors shrink-0 ${
                isActive
                  ? 'bg-blue-900 text-white'
                  : 'text-slate-600 hover:bg-stone-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ORDERS HISTORY */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {loadingOrders ? (
            <div className="py-12 text-center text-xs text-slate-500">Memuat riwayat pesanan...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-stone-50 rounded-2xl border border-stone-200 p-6">
              <Package className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="font-serif text-lg font-bold text-slate-800">Belum Ada Pesanan</p>
              <p className="text-xs text-slate-500 mt-1">Anda belum melakukan pembelian di Saena.id.</p>
              <button
                onClick={() => onNavigate('/produk')}
                className="mt-4 px-6 py-2 bg-blue-900 text-white text-xs font-semibold rounded-xl"
              >
                Mulai Belanja
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => onNavigate(`/order/${order.orderNumber}`)}
                  className="bg-white rounded-2xl border border-stone-200/80 p-5 hover:border-blue-900/40 hover:shadow-xs transition-all cursor-pointer space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100 text-xs">
                    <div>
                      <span className="font-mono font-bold text-blue-900">{order.orderNumber}</span>
                      <span className="text-slate-400 ml-2">· {new Date(order.createdAt).toLocaleDateString('id-ID')}</span>
                    </div>
                    <span className="font-bold px-2 py-0.5 rounded text-[11px] bg-blue-50 text-blue-900 self-start sm:self-auto">
                      {order.orderStatus.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <img
                      src={order.items[0]?.image}
                      alt={order.items[0]?.name}
                      className="w-16 h-18 object-cover rounded-xl bg-stone-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{order.items[0]?.name}</p>
                      <p className="text-xs text-slate-500">
                        {order.items.length > 1 ? `+ ${order.items.length - 1} produk lainnya` : `${order.items[0]?.color} · ${order.items[0]?.size}`}
                      </p>
                      <p className="text-xs font-bold text-slate-900 mt-1 tabular-nums">
                        Total Tagihan: Rp {order.total.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ADDRESSES */}
      {activeTab === 'addresses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-serif text-lg font-bold text-slate-900">Buku Alamat Pengiriman</h2>
            <button
              onClick={() => setShowAddressModal(true)}
              className="px-4 py-2 bg-blue-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-900"
            >
              + Tambah Alamat Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentUser.addresses.map((addr) => (
              <div
                key={addr.id}
                className={`p-5 rounded-2xl border text-xs space-y-2 ${
                  addr.isDefault ? 'border-blue-900 bg-blue-50/20 ring-1 ring-blue-900/30' : 'border-stone-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{addr.recipientName}</span>
                  {addr.isDefault && (
                    <span className="text-[10px] font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                      Utama
                    </span>
                  )}
                </div>
                <p className="text-slate-600">{addr.phone}</p>
                <p className="text-slate-700 leading-relaxed">{addr.fullAddress}</p>
                <p className="text-slate-500">{addr.subdistrict}, {addr.city}, {addr.province} {addr.postalCode}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: WISHLIST */}
      {activeTab === 'wishlist' && (
        <div>
          {wishlist.length === 0 ? (
            <div className="text-center py-16 bg-stone-50 rounded-2xl border border-stone-200 p-6">
              <Heart className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="font-serif text-lg font-bold text-slate-800">Daftar Favorit Masih Kosong</p>
              <p className="text-xs text-slate-500 mt-1">Simpan model busana muslimah favorit Anda dengan mengklik ikon hati.</p>
              <button
                onClick={() => onNavigate('/produk')}
                className="mt-4 px-6 py-2 bg-blue-900 text-white text-xs font-semibold rounded-xl"
              >
                Jelajahi Busana
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {wishlist.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onNavigate={onNavigate}
                  onAddToCartSuccess={onAddToCartSuccess}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-serif text-lg font-bold text-slate-900">Tambah Alamat Baru</h3>
            <form onSubmit={handleAddAddress} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nama Penerima</label>
                  <input
                    type="text"
                    required
                    value={addrRecipient}
                    onChange={(e) => setAddrRecipient(e.target.value)}
                    placeholder="Nama Lengkap"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">No. HP</label>
                  <input
                    type="tel"
                    required
                    value={addrPhone}
                    onChange={(e) => setAddrPhone(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kota / Kabupaten</label>
                  <input
                    type="text"
                    required
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    placeholder="Jakarta / Bandung"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kecamatan</label>
                  <input
                    type="text"
                    required
                    value={addrSubdistrict}
                    onChange={(e) => setAddrSubdistrict(e.target.value)}
                    placeholder="Kecamatan"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Kode Pos</label>
                <input
                  type="text"
                  required
                  value={addrPostalCode}
                  onChange={(e) => setAddrPostalCode(e.target.value)}
                  placeholder="12430"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Alamat Lengkap</label>
                <textarea
                  required
                  rows={3}
                  value={addrFull}
                  onChange={(e) => setAddrFull(e.target.value)}
                  placeholder="Nama jalan, nomor rumah, RT/RW, patokan"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-slate-700 hover:bg-stone-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-900 text-white text-xs font-semibold"
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
