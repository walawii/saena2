import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Package,
  Clock,
  Truck,
  AlertTriangle,
  Search,
  CheckCircle2,
  ExternalLink,
  Edit,
  Plus,
  RefreshCw,
  Key,
  LogOut,
  Users,
  Tag,
  Star,
  FileText,
  Sliders,
  DollarSign
} from 'lucide-react';
import { Order, Product, Voucher, Review } from '../types';
import { api } from '../services/api';

interface AdminDashboardPageProps {
  onNavigate: (path: string) => void;
  onAddToCartSuccess: (message: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onNavigate,
  onAddToCartSuccess
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem('saena_admin_token'))
  );
  const [adminUser, setAdminUser] = useState<any>(null);

  // Login form state
  const [emailInput, setEmailInput] = useState('admin@saena.id');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard Data State
  const [activeTab, setActiveTab] = useState<
    'overview' | 'orders' | 'inventory' | 'products' | 'vouchers' | 'reviews' | 'customers' | 'audit' | 'integrations'
  >('overview');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Order filters
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Modals
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [courierInput, setCourierInput] = useState('Mengantar Express');
  const [updatingTracking, setUpdatingTracking] = useState(false);

  // Stock adjust modal
  const [adjustModalVariant, setAdjustModalVariant] = useState<any>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [dashRes, ordRes, prodRes, invRes, movRes, vouchRes, revRes, custRes, logRes] = await Promise.all([
        api.getAdminDashboard(),
        api.getAdminOrders({ status: orderStatusFilter || undefined, search: orderSearchQuery || undefined }),
        api.getProducts(),
        api.getAdminInventory(),
        api.getAdminInventoryMovements(),
        api.getAdminVouchers(),
        api.getAdminReviews(),
        api.getAdminCustomers(),
        api.getAdminAuditLogs()
      ]);

      setDashboardData(dashRes.data);
      setOrders(ordRes.data);
      setProducts(prodRes.data);
      setInventory(invRes.data);
      setMovements(movRes.data);
      setVouchers(vouchRes.data);
      setReviews(revRes.data);
      setCustomers(custRes.data);
      setAuditLogs(logRes.data);
      setIsAuthenticated(true);
    } catch (err: any) {
      console.error('[Admin Load Error]:', err.message);
      if (err.message?.includes('Akses ditolak') || err.message?.includes('token')) {
        setIsAuthenticated(false);
        localStorage.removeItem('saena_admin_token');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated, orderStatusFilter, orderSearchQuery]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await api.adminLogin(emailInput.trim(), passwordInput);
      localStorage.setItem('saena_admin_token', res.token);
      setAdminUser(res.user);
      setIsAuthenticated(true);
      onAddToCartSuccess('Autentikasi Administrator Berhasil');
    } catch (err: any) {
      setLoginError(err.message || 'Login administrator gagal. Periksa email & kata sandi.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('saena_admin_token');
    setIsAuthenticated(false);
    setAdminUser(null);
    onAddToCartSuccess('Anda telah keluar dari Portal Admin.');
  };

  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !trackingInput.trim()) return;

    setUpdatingTracking(true);
    try {
      await api.adminSetOrderTracking(selectedOrder.orderNumber, trackingInput.trim(), courierInput.trim());
      onAddToCartSuccess(`Resi pengiriman ${trackingInput} berhasil diinput.`);
      setSelectedOrder(null);
      setTrackingInput('');
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan resi');
    } finally {
      setUpdatingTracking(false);
    }
  };

  const handleStatusChange = async (orderNumber: string, newStatus: string) => {
    if (!confirm(`Ubah status order ${orderNumber} menjadi ${newStatus}?`)) return;
    try {
      await api.adminUpdateOrderStatus(orderNumber, newStatus, `Diubah oleh admin via dashboard`);
      onAddToCartSuccess(`Status order ${orderNumber} berhasil diubah.`);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status');
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalVariant || adjustDelta === 0 || !adjustReason) return;
    try {
      await api.adminAdjustStock(adjustModalVariant.variant_id, adjustDelta, adjustReason);
      onAddToCartSuccess('Penyesuaian stok berhasil disimpan.');
      setAdjustModalVariant(null);
      setAdjustDelta(0);
      setAdjustReason('');
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyesuaikan stok');
    }
  };

  const handleReviewModeration = async (reviewId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.adminModerateReview(reviewId, status);
      onAddToCartSuccess(`Ulasan telah di-${status.toLowerCase()}`);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Gagal memoderasi ulasan');
    }
  };

  // If not authenticated, render strict Admin Login Form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-navy text-gold rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-navy/20">
              <ShieldCheck className="w-9 h-9" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-navy">Saena.id Admin Portal</h1>
            <p className="text-sm text-slate-500 mt-1">Autentikasi Aman Administrator Berbasis Database</p>
          </div>

          {loginError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-700 text-sm">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Administrator
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="admin@saena.id"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Kata Sandi
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Masukkan kata sandi admin"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy text-sm font-medium"
              />
              <p className="text-xs text-slate-400 mt-1">
                Default terdaftar: password terenkripsi bcrypt pada database PostgreSQL.
              </p>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full mt-4 bg-navy hover:bg-navy-dark text-white font-medium py-3 rounded-xl transition duration-200 flex items-center justify-center space-x-2 shadow-md shadow-navy/20 cursor-pointer disabled:opacity-50"
            >
              {loginLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Masuk Portal Admin</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <button
              onClick={() => onNavigate('/')}
              className="text-xs text-slate-500 hover:text-navy underline cursor-pointer"
            >
              &larr; Kembali ke Beranda Saena.id
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Bar */}
      <header className="bg-navy text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gold text-navy rounded-xl flex items-center justify-center font-bold font-serif shadow-sm">
              S
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif font-bold text-lg text-white">Saena.id</span>
                <span className="bg-gold/20 text-gold text-[10px] font-semibold px-2 py-0.5 rounded-full border border-gold/40">
                  PRODUCTION ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-300">Database &amp; Transaction Control Center</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={loadAllData}
              disabled={loading}
              title="Refresh Data"
              className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleAdminLogout}
              className="flex items-center space-x-1.5 text-xs text-rose-300 hover:text-rose-100 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex space-x-1 overflow-x-auto no-scrollbar border-t border-white/10 text-xs">
          {[
            { id: 'overview', label: 'Ringkasan', icon: TrendingUp },
            { id: 'orders', label: `Pesanan (${orders.length})`, icon: Package },
            { id: 'inventory', label: 'Inventaris Stok', icon: Sliders },
            { id: 'products', label: `Produk (${products.length})`, icon: Tag },
            { id: 'vouchers', label: `Voucher (${vouchers.length})`, icon: DollarSign },
            { id: 'reviews', label: `Ulasan (${reviews.length})`, icon: Star },
            { id: 'customers', label: `Pelanggan (${customers.length})`, icon: Users },
            { id: 'audit', label: 'Audit Trail', icon: FileText },
            { id: 'integrations', label: 'Integrasi', icon: ShieldCheck }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-4 flex items-center space-x-2 font-medium whitespace-nowrap border-b-2 transition cursor-pointer ${
                  active
                    ? 'border-gold text-gold bg-white/5 font-semibold'
                    : 'border-transparent text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 uppercase">Total Pendapatan</span>
                <p className="text-2xl font-bold text-navy mt-1">
                  Rp {(dashboardData?.totalRevenue || 0).toLocaleString('id-ID')}
                </p>
                <span className="text-[11px] text-emerald-600 font-medium">Dari pesanan terverifikasi PAID</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 uppercase">Total Pesanan</span>
                <p className="text-2xl font-bold text-navy mt-1">{dashboardData?.totalOrders || 0}</p>
                <span className="text-[11px] text-slate-500">Semua status transaksi</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-amber-600 uppercase">Menunggu Pembayaran</span>
                <p className="text-2xl font-bold text-amber-700 mt-1">{dashboardData?.pendingPaymentOrders || 0}</p>
                <span className="text-[11px] text-amber-600">Stok di-reservasi di DB</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-emerald-600 uppercase">Siap Dikirim / Diproses</span>
                <p className="text-2xl font-bold text-emerald-700 mt-1">{dashboardData?.paidOrders || 0}</p>
                <span className="text-[11px] text-emerald-600">Perlu input no resi</span>
              </div>
            </div>

            {/* Integration Status Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-serif font-bold text-navy mb-4 flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-gold" />
                <span>Status Kesiapan Produksi &amp; Layanan Eksternal</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* PostgreSQL Database */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-slate-800">PostgreSQL Database</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                      PERSISTENT DB
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">
                    27 tabel terelasi dengan row-level locking (SELECT FOR UPDATE) untuk reservasi stok aman.
                  </p>
                  <div className="text-[11px] text-slate-500 font-mono">DATABASE_URL di backend</div>
                </div>

                {/* DOKU Gateway */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-slate-800">DOKU Jokul Gateway</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        dashboardData?.integrations?.doku?.isLive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {dashboardData?.integrations?.doku?.status || 'CONFIG'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">
                    Env: {dashboardData?.integrations?.doku?.environment || 'sandbox'}. Webhook signature HMAC-SHA256 &amp; Idempotency key verified.
                  </p>
                  <div className="text-[11px] text-slate-500 font-mono">DOKU_CLIENT_ID / DOKU_SECRET_KEY</div>
                </div>

                {/* Mengantar Aggregator */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-slate-800">Mengantar Shipping</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        dashboardData?.integrations?.mengantar?.isLive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {dashboardData?.integrations?.mengantar?.status || 'CONFIG'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">
                    Tarif live SiCepat, J&amp;T, JNE via aggregator resmi Mengantar.
                  </p>
                  <div className="text-[11px] text-slate-500 font-mono">MENGANTAR_API_KEY / BASE_URL</div>
                </div>
              </div>
            </div>

            {/* Quick Orders Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-serif font-bold text-navy">Pesanan Terbaru</h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-navy font-semibold hover:underline cursor-pointer"
                >
                  Lihat Semua Pesanan &rarr;
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {orders.slice(0, 5).map(o => (
                  <div key={o.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-sm text-navy">{o.orderNumber}</span>
                        <span className="text-xs text-slate-500">&bull; {o.customer.name}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {o.items.length} item &bull; Rp {o.total.toLocaleString('id-ID')} &bull; {o.shippingProvider} ({o.shippingService})
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        o.orderStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                        o.orderStatus === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                        o.orderStatus === 'PENDING_PAYMENT' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {o.orderStatus}
                      </span>
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="text-xs text-navy border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 font-medium cursor-pointer"
                      >
                        Detail
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-2 flex-1">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari order number, nama pelanggan, no telepon..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="w-full text-sm bg-transparent border-none focus:outline-none text-slate-900"
                />
              </div>

              <div className="flex items-center space-x-3">
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium"
                >
                  <option value="">Semua Status</option>
                  <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                  <option value="PAID">PAID</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="EXPIRED">EXPIRED</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">No Pesanan</th>
                    <th className="py-3 px-4">Pelanggan</th>
                    <th className="py-3 px-4">Total Belanja</th>
                    <th className="py-3 px-4">Status Order</th>
                    <th className="py-3 px-4">Resi / Kurir</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-mono font-bold text-navy">{o.orderNumber}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{o.customer.name}</div>
                        <div className="text-xs text-slate-400">{o.customer.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        Rp {o.total.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          o.orderStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                          o.orderStatus === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                          o.orderStatus === 'PENDING_PAYMENT' ? 'bg-amber-100 text-amber-800' :
                          o.orderStatus === 'DELIVERED' ? 'bg-purple-100 text-purple-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {o.orderStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {o.trackingNumber ? (
                          <div className="font-mono text-navy font-semibold">{o.trackingNumber}</div>
                        ) : (
                          <span className="text-slate-400">Belum ada resi</span>
                        )}
                        <div className="text-[11px] text-slate-400">{o.shippingService}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {new Date(o.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg font-medium cursor-pointer"
                        >
                          Kelola
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: INVENTORY */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif font-bold text-navy text-lg">Stok Varian &amp; Reservasi Real-Time</h3>
                  <p className="text-xs text-slate-500">
                    Stok dikunci secara atomik (SELECT ... FOR UPDATE) saat checkout. Kolom 'Tersedia' = Stok - Reservasi.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Produk</th>
                      <th className="py-3 px-4">SKU / Varian</th>
                      <th className="py-3 px-4 text-center">Fisik (Stock)</th>
                      <th className="py-3 px-4 text-center">Reserved</th>
                      <th className="py-3 px-4 text-center">Tersedia</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inventory.map((inv, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 font-medium text-slate-900">{inv.product_name}</td>
                        <td className="py-3.5 px-4 font-mono text-xs">
                          <span className="font-semibold text-navy">{inv.sku}</span> &bull; {inv.color_name} ({inv.size})
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-800">{inv.stock}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-amber-600">{inv.reserved}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-emerald-600">{inv.available}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setAdjustModalVariant(inv);
                              setAdjustDelta(0);
                              setAdjustReason('');
                            }}
                            className="text-xs bg-navy text-white px-3 py-1.5 rounded-lg hover:bg-navy-dark font-medium cursor-pointer"
                          >
                            Sesuaikan Stok
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inventory Movements Log */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h4 className="font-serif font-bold text-navy text-base mb-3">Log Pergerakan Inventaris (Ledger)</h4>
              <div className="divide-y divide-slate-100 text-xs">
                {movements.slice(0, 10).map((m, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className={`font-semibold px-2 py-0.5 rounded text-[10px] mr-2 ${
                        m.type === 'RESERVE' ? 'bg-amber-100 text-amber-800' :
                        m.type === 'ORDER_FULFILLED' ? 'bg-emerald-100 text-emerald-800' :
                        m.type === 'RELEASE_RESERVE' ? 'bg-rose-100 text-rose-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {m.type}
                      </span>
                      <span className="font-medium text-slate-800">{m.product_name || m.variant_id}</span>
                      <span className="text-slate-400 ml-2">({m.notes || m.reference_id})</span>
                    </div>
                    <div className="text-slate-500 font-mono">
                      Qty: {m.quantity} &bull; {new Date(m.created_at).toLocaleTimeString('id-ID')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PRODUCTS */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-navy text-lg">Katalog Produk Busana Muslim</h3>
                <p className="text-xs text-slate-500">Kelola informasi produk, harga normal, harga diskon, dan status aktif.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {products.map(p => (
                <div key={p.id} className="border border-slate-200 rounded-xl p-4 flex space-x-3 bg-slate-50/50">
                  <img src={p.images[0]} alt={p.name} className="w-20 h-24 object-cover rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase text-gold bg-gold/10 px-1.5 py-0.5 rounded">
                      {p.category}
                    </span>
                    <h4 className="font-medium text-slate-900 text-sm truncate mt-1">{p.name}</h4>
                    <div className="text-xs text-navy font-bold mt-1">
                      Rp {(p.discountPrice || p.price).toLocaleString('id-ID')}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {p.variants.length} Varian &bull; Stok total: {p.stock}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: VOUCHERS */}
        {activeTab === 'vouchers' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-navy text-lg">Kupon &amp; Voucher Diskon</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vouchers.map(v => (
                <div key={v.id} className="border border-dashed border-gold/60 bg-cream/30 p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-base text-navy">{v.code}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      {(v.isActive ?? v.active) ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-700 mt-1">{v.name || v.description}</p>
                  <div className="text-xs text-gold font-bold mt-2">
                    {(v.discountType || v.type) === 'PERCENTAGE'
                      ? `${v.discountValue ?? v.value ?? 0}% OFF`
                      : `Potongan Rp ${(v.discountValue ?? v.value ?? 0).toLocaleString('id-ID')}`}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Min belanja: Rp {(v.minSpend ?? v.minimumPurchase ?? 0).toLocaleString('id-ID')} &bull; Terpakai: {v.usedCount}/{(v.quota ?? v.usageLimit ?? 100)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-navy text-lg">Moderasi Ulasan Produk</h3>
            <div className="divide-y divide-slate-100">
              {reviews.map(r => (
                <div key={r.id} className="py-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm text-slate-900">{r.customerName}</span>
                      <span className="text-xs text-amber-500">{'★'.repeat(r.rating)}</span>
                      <span className="text-xs text-slate-400">&bull; {r.productName}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{r.comment}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleReviewModeration(r.id, 'APPROVED')}
                      className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100 cursor-pointer font-medium"
                    >
                      Setujui
                    </button>
                    <button
                      onClick={() => handleReviewModeration(r.id, 'REJECTED')}
                      className="text-xs px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded hover:bg-rose-100 cursor-pointer font-medium"
                    >
                      Tolak
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: CUSTOMERS */}
        {activeTab === 'customers' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-navy text-lg">Basis Data Pelanggan Terdaftar</h3>
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama Pelanggan</th>
                  <th className="py-3 px-4">Kontak</th>
                  <th className="py-3 px-4 text-center">Total Order</th>
                  <th className="py-3 px-4">Total Belanja (PAID)</th>
                  <th className="py-3 px-4">Bergabung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-900">{c.name}</td>
                    <td className="py-3 px-4 text-xs">
                      <div>{c.email}</div>
                      <div className="text-slate-400">{c.phone}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold">{c.total_orders}</td>
                    <td className="py-3 px-4 font-bold text-navy">
                      Rp {Number(c.total_spent || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {new Date(c.created_at).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 8: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-navy text-lg">Audit Trail Aktivitas Administrator</h3>
            <div className="divide-y divide-slate-100 text-xs">
              {auditLogs.map((log, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-navy mr-2">[{log.action}]</span>
                    <span className="text-slate-700 font-medium">{log.entity_type} {log.entity_id || ''}</span>
                    <span className="text-slate-400 ml-2">oleh {log.admin_name || 'Admin'}</span>
                  </div>
                  <div className="text-slate-500 font-mono">
                    {new Date(log.created_at).toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 9: INTEGRATIONS */}
        {activeTab === 'integrations' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h3 className="font-serif font-bold text-navy text-lg">Konfigurasi Gateway &amp; Agregator Eksternal</h3>

            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <h4 className="font-bold text-navy text-sm mb-1">DOKU Payment Gateway (Official Jokul API)</h4>
                <p className="text-xs text-slate-600 mb-3">
                  Menggunakan endpoint resmi DOKU untuk pembuatan Virtual Account (BCA, Mandiri, BRI, BNI), QRIS, dan Kartu Kredit.
                  Verifikasi webhook dilakukan menggunakan cryptographic digest SHA-256 dan HMAC-SHA256 signature.
                </p>
                <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-xs">
                  <div>Status DOKU: {dashboardData?.integrations?.doku?.isConfigured ? 'READY (Terkoneksi)' : 'Belum Dikonfigurasi'}</div>
                  <div>Mode: {dashboardData?.integrations?.doku?.environment || 'production'}</div>
                  <div>Origin Webhook: /api/payments/doku/webhook</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <h4 className="font-bold text-navy text-sm mb-1">Mengantar Shipping Aggregator</h4>
                <p className="text-xs text-slate-600 mb-3">
                  Kalkulasi tarif ongkir live dan pelacakan resi kurir (SiCepat, J&amp;T, JNE).
                </p>
                <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-xs">
                  <div>Status Mengantar: {dashboardData?.integrations?.mengantar?.isConfigured ? 'READY (Terkoneksi)' : 'Belum Dikonfigurasi'}</div>
                  <div>Base URL: {dashboardData?.integrations?.mengantar?.baseUrl || 'https://api-public.mengantar.com'}</div>
                  <div>Origin: Cilandak (12430)</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Order Detail & Tracking Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-serif font-bold text-xl text-navy">Pesanan #{selectedOrder.orderNumber}</h3>
                <span className="text-xs text-slate-500">Status saat ini: {selectedOrder.orderStatus}</span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="py-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
                <div>
                  <span className="text-slate-400 block">Penerima:</span>
                  <span className="font-bold text-slate-800">{selectedOrder.customer.name}</span>
                  <p className="text-slate-600">{selectedOrder.customer.phone}</p>
                </div>
                <div>
                  <span className="text-slate-400 block">Alamat Pengiriman:</span>
                  <p className="text-slate-700">{selectedOrder.shippingAddress.fullAddress}</p>
                  <p className="text-slate-500">
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postalCode}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-semibold text-xs text-slate-700 uppercase mb-2">Item Pesanan</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-100">
                      <span>{i.name} ({i.color} / {i.size}) &times; {i.quantity}</span>
                      <span className="font-bold">Rp {i.subtotal.toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Input Tracking Form */}
              <form onSubmit={handleSaveTracking} className="bg-blue-50/60 border border-blue-200 p-4 rounded-xl space-y-3">
                <h4 className="font-semibold text-xs text-blue-900 uppercase">Input / Update Resi Pengiriman</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">Nomor Resi</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: MGT12345678"
                      value={trackingInput}
                      onChange={(e) => setTrackingInput(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">Nama Kurir</label>
                    <input
                      type="text"
                      required
                      value={courierInput}
                      onChange={(e) => setCourierInput(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={updatingTracking}
                  className="bg-navy hover:bg-navy-dark text-white text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  {updatingTracking ? 'Menyimpan...' : 'Simpan Resi & Ubah Status ke SHIPPED'}
                </button>
              </form>

              {/* Status Transition Actions */}
              <div className="pt-2">
                <h4 className="font-semibold text-xs text-slate-700 uppercase mb-2">Transisi Status Pesanan</h4>
                <div className="flex flex-wrap gap-2">
                  {['PROCESSING', 'READY_TO_SHIP', 'DELIVERED', 'CANCELLED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(selectedOrder.orderNumber, st)}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 font-medium cursor-pointer"
                    >
                      Set ke {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustModalVariant && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-serif font-bold text-lg text-navy mb-1">Penyesuaian Stok Fisik</h3>
            <p className="text-xs text-slate-500 mb-4">
              {adjustModalVariant.product_name} &bull; {adjustModalVariant.color_name} ({adjustModalVariant.size})
            </p>

            <form onSubmit={handleStockAdjustment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Perubahan Jumlah (+ / -)
                </label>
                <input
                  type="number"
                  required
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(Number(e.target.value))}
                  placeholder="Contoh: +10 atau -5"
                  className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alasan Penyesuaian</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Contoh: Restock batch baru / Rusak pada gudang"
                  className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setAdjustModalVariant(null)}
                  className="text-xs px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="text-xs px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy-dark font-semibold cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
