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
  Key
} from 'lucide-react';
import { Order, Product } from '../types';
import { api } from '../services/api';

interface AdminDashboardPageProps {
  onNavigate: (path: string) => void;
  onAddToCartSuccess: (message: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onNavigate,
  onAddToCartSuccess
}) => {
  const [adminKey, setAdminKey] = useState(
    localStorage.getItem('saena_admin_key') || 'admin_saena_secret_pass'
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'integrations'>('overview');
  const [loading, setLoading] = useState(false);

  // Status Filter for Orders
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Tracking Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [courierInput, setCourierInput] = useState('Mengantar Express');
  const [updatingTracking, setUpdatingTracking] = useState(false);

  const fetchDashboard = async (keyToUse = adminKey) => {
    setLoading(true);
    try {
      const res = await api.getAdminDashboard(keyToUse);
      setDashboardData(res.data);
      setIsAuthenticated(true);
      localStorage.setItem('saena_admin_key', keyToUse);

      const ordRes = await api.getAdminOrders({
        status: orderStatusFilter || undefined,
        search: orderSearchQuery || undefined
      });
      setOrders(ordRes.data);

      const prodRes = await api.getProducts();
      setProducts(prodRes.data);
    } catch (err: any) {
      console.error(err);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(adminKey);
  }, [orderStatusFilter, orderSearchQuery]);

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminKey(keyInput.trim());
    fetchDashboard(keyInput.trim());
  };

  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !trackingInput.trim()) return;

    setUpdatingTracking(true);
    try {
      await api.adminSetOrderTracking(selectedOrder.orderNumber, trackingInput.trim(), courierInput);
      onAddToCartSuccess(`Nomor resi ${trackingInput} berhasil disimpan untuk ${selectedOrder.orderNumber}`);
      setSelectedOrder(null);
      setTrackingInput('');
      fetchDashboard();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan nomor resi');
    } finally {
      setUpdatingTracking(false);
    }
  };

  const handleUpdateStatus = async (orderNumber: string, status: string) => {
    try {
      await api.adminUpdateOrderStatus(orderNumber, status, `Diubah oleh admin via dashboard`);
      onAddToCartSuccess(`Status pesanan ${orderNumber} diubah ke ${status}`);
      fetchDashboard();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="bg-white rounded-3xl border border-stone-200 shadow-xl p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">Portal Admin Saena.id</h1>
          <p className="text-xs text-slate-500">
            Masukkan Admin Secret Key untuk mengelola pesanan, stok busana, resi Mengantar, dan DOKU gateway.
          </p>

          <form onSubmit={handleKeySubmit} className="space-y-3 pt-2 text-left">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Admin Secret Key</label>
              <input
                type="password"
                required
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="admin_saena_secret_pass"
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-blue-900"
              />
              <p className="text-[11px] text-slate-400 mt-1">Default key: admin_saena_secret_pass</p>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-900 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-md transition-colors"
            >
              Buka Dashboard Admin
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
              Admin Portal
            </span>
            <span className="text-xs text-slate-500">Saena.id Management Console</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-slate-900 mt-1">
            Dashboard Penjualan & Logistik
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchDashboard()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Data</span>
          </button>
          <button
            onClick={() => onNavigate('/')}
            className="px-3.5 py-2 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-xl"
          >
            Lihat Toko Publik →
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      {dashboardData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1">
            <p className="text-xs font-semibold text-slate-500">Total Omset Penjualan</p>
            <p className="font-serif text-2xl font-bold text-slate-900 tabular-nums">
              Rp {dashboardData.totalSales.toLocaleString('id-ID')}
            </p>
            <p className="text-[11px] text-emerald-700 font-medium">Dari pesanan berstatus Lunas (PAID)</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1">
            <p className="text-xs font-semibold text-slate-500">Total Pesanan</p>
            <p className="font-serif text-2xl font-bold text-slate-900 tabular-nums">
              {dashboardData.totalOrders}
            </p>
            <p className="text-[11px] text-slate-500">{dashboardData.pendingPayment} menunggu pembayaran</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1">
            <p className="text-xs font-semibold text-slate-500">Siap Dikirim / Diproses</p>
            <p className="font-serif text-2xl font-bold text-amber-700 tabular-nums">
              {dashboardData.processing}
            </p>
            <p className="text-[11px] text-slate-500">Perlu input resi kurir Mengantar</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1">
            <p className="text-xs font-semibold text-slate-500">Stok Menipis (&lt; 10 pcs)</p>
            <p className="font-serif text-2xl font-bold text-rose-700 tabular-nums">
              {dashboardData.lowStockCount}
            </p>
            <p className="text-[11px] text-slate-500">Perlu restock produksi</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-stone-200 text-xs sm:text-sm font-semibold pb-1">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl transition-colors ${
            activeTab === 'orders' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-stone-100'
          }`}
        >
          Kelola Pesanan ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-xl transition-colors ${
            activeTab === 'products' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-stone-100'
          }`}
        >
          Katalog & Stok ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('integrations')}
          className={`px-4 py-2 rounded-xl transition-colors ${
            activeTab === 'integrations' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-stone-100'
          }`}
        >
          Status Gateway DOKU & Mengantar
        </button>
      </div>

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                placeholder="Cari order #, nama, no HP..."
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-blue-900 bg-white"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="text-xs p-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none"
              >
                <option value="">Semua Status Pesanan</option>
                <option value="PENDING_PAYMENT">Menunggu Pembayaran</option>
                <option value="PAID">Lunas (Paid)</option>
                <option value="PROCESSING">Diproses Gudang</option>
                <option value="SHIPPED">Dikirim (Shipped)</option>
                <option value="DELIVERED">Diterima (Delivered)</option>
                <option value="CANCELLED">Dibatalkan</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">No. Pesanan</th>
                    <th className="p-4">Pelanggan</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Status Order</th>
                    <th className="p-4">Resi Mengantar</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-stone-50/50">
                      <td className="p-4 font-mono font-bold text-blue-900">
                        <button
                          onClick={() => onNavigate(`/order/${ord.orderNumber}`)}
                          className="hover:underline text-left"
                        >
                          {ord.orderNumber}
                        </button>
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {new Date(ord.createdAt).toLocaleDateString('id-ID')}
                        </span>
                      </td>

                      <td className="p-4">
                        <p className="font-semibold text-slate-800">{ord.customer.name}</p>
                        <p className="text-[11px] text-slate-400">{ord.shippingAddress.city}</p>
                      </td>

                      <td className="p-4 font-bold tabular-nums">
                        Rp {ord.total.toLocaleString('id-ID')}
                      </td>

                      <td className="p-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          ord.orderStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : ord.orderStatus === 'SHIPPED'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {ord.orderStatus.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="p-4">
                        {ord.trackingNumber ? (
                          <span className="font-mono text-xs font-bold text-slate-700 bg-stone-100 px-2 py-0.5 rounded">
                            {ord.trackingNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Belum diinput</span>
                        )}
                      </td>

                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(ord);
                            setTrackingInput(ord.trackingNumber || '');
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg"
                        >
                          {ord.trackingNumber ? 'Edit Resi' : '+ Input Resi'}
                        </button>

                        <button
                          onClick={() => onNavigate(`/order/${ord.orderNumber}`)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-stone-100 hover:bg-stone-200 rounded-lg"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Produk Busana</th>
                    <th className="p-4">Kategori</th>
                    <th className="p-4">Harga Normal</th>
                    <th className="p-4">Harga Diskon</th>
                    <th className="p-4">Stok Total</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-stone-50/50">
                      <td className="p-4 flex items-center gap-3">
                        <img src={p.images[0]} alt={p.name} className="w-10 h-12 object-cover rounded-lg bg-stone-100" />
                        <div>
                          <p className="font-semibold text-slate-900">{p.name}</p>
                          <p className="text-[10px] text-slate-400">SKU: {p.sku}</p>
                        </div>
                      </td>

                      <td className="p-4 text-slate-600">{p.categoryName}</td>

                      <td className="p-4 tabular-nums">
                        Rp {p.price.toLocaleString('id-ID')}
                      </td>

                      <td className="p-4 tabular-nums text-emerald-700 font-semibold">
                        {p.discountPrice ? `Rp ${p.discountPrice.toLocaleString('id-ID')}` : '-'}
                      </td>

                      <td className="p-4">
                        <span className={`font-bold tabular-nums ${p.stock < 10 ? 'text-rose-600' : 'text-slate-900'}`}>
                          {p.stock} pcs
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* INTEGRATIONS TAB */}
      {activeTab === 'integrations' && dashboardData?.integrations && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif text-base font-bold text-slate-900">DOKU Payment Gateway</h3>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                dashboardData.integrations.doku.hasCredentials ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
              }`}>
                {dashboardData.integrations.doku.hasCredentials ? 'Live Connected' : 'Simulated Sandbox'}
              </span>
            </div>

            <div className="text-xs space-y-2 text-slate-600">
              <p><strong>Provider:</strong> {dashboardData.integrations.doku.providerName}</p>
              <p><strong>Mode Lingkungan:</strong> {dashboardData.integrations.doku.environment}</p>
              <p><strong>Status Kredensial .env:</strong> {dashboardData.integrations.doku.hasCredentials ? 'DOKU_CLIENT_ID & DOKU_SECRET_KEY Terpasang' : 'Menggunakan Mock Provider (Aman untuk Uji Coba UI)'}</p>
              <p><strong>Metode Didukung:</strong> BCA VA, Mandiri VA, BRI VA, BNI VA, QRIS Standar, Kartu Kredit.</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif text-base font-bold text-slate-900">Mengantar Shipping Aggregator</h3>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                dashboardData.integrations.mengantar.hasApiKey ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
              }`}>
                {dashboardData.integrations.mengantar.hasApiKey ? 'Live Connected' : 'Simulated Mode'}
              </span>
            </div>

            <div className="text-xs space-y-2 text-slate-600">
              <p><strong>Provider:</strong> {dashboardData.integrations.mengantar.providerName}</p>
              <p><strong>Base URL:</strong> {dashboardData.integrations.mengantar.baseUrl}</p>
              <p><strong>Status Kredensial .env:</strong> {dashboardData.integrations.mengantar.hasApiKey ? 'MENGANTAR_API_KEY Terpasang' : 'Menggunakan Mock Provider (Estimasi & Resi Realistis Seluruh Indonesia)'}</p>
              <p><strong>Ekspedisi Terintegrasi:</strong> SiCepat, JNE, J&T Express.</p>
            </div>
          </div>
        </div>
      )}

      {/* TRACKING MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-serif text-lg font-bold text-slate-900">
              Input Resi Kurir Mengantar
            </h3>
            <p className="text-xs text-slate-500">
              Order #{selectedOrder.orderNumber} · Penerima: {selectedOrder.shippingAddress.recipientName} ({selectedOrder.shippingAddress.city})
            </p>

            <form onSubmit={handleSaveTracking} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Kurir / Layanan</label>
                <input
                  type="text"
                  required
                  value={courierInput}
                  onChange={(e) => setCourierInput(e.target.value)}
                  placeholder="Mengantar Express (SiCepat / JNE)"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nomor Resi / AWB *</label>
                <input
                  type="text"
                  required
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
                  placeholder="Contoh: MGT-8829401"
                  className="w-full text-xs font-mono font-bold p-3 rounded-xl border border-stone-300"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updatingTracking}
                  className="flex-1 py-2.5 rounded-xl bg-blue-900 text-white text-xs font-semibold"
                >
                  {updatingTracking ? 'Menyimpan...' : 'Simpan & Kirim Notif'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
