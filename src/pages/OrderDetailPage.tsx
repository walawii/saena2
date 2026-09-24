import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  Truck,
  Copy,
  Check,
  Package,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Printer
} from 'lucide-react';
import { Order } from '../types';
import { api } from '../services/api';

interface OrderDetailPageProps {
  orderNumber: string;
  onNavigate: (path: string) => void;
  onAddToCartSuccess: (message: string) => void;
}

export const OrderDetailPage: React.FC<OrderDetailPageProps> = ({
  orderNumber,
  onNavigate,
  onAddToCartSuccess,
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState<any>(null);

  const fetchOrder = async () => {
    try {
      const res = await api.getOrderByNumber(orderNumber);
      setOrder(res.data);

      if (res.data.trackingNumber) {
        try {
          const trackRes = await api.trackShipping(res.data.trackingNumber);
          setTrackingInfo(trackRes.data);
        } catch (e) {
          console.error(e);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderNumber]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onAddToCartSuccess('Nomor Virtual Account berhasil disalin!');
  };

  const handleSimulatePayment = async () => {
    if (!order) return;
    setSimulating(true);
    try {
      await api.simulatePayment(order.orderNumber, 'PAID');
      await fetchOrder();
      onAddToCartSuccess('Simulasi Berhasil: Status pesanan telah diperbarui menjadi PAID & No. Resi Mengantar terbit!');
    } catch (e: any) {
      alert(e.message || 'Gagal simulasi pembayaran');
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500">Memuat status pesanan {orderNumber}...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="font-serif text-2xl font-bold text-slate-900">Pesanan Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500 mt-2">
          Nomor pesanan <strong>{orderNumber}</strong> tidak ditemukan di database Saena.id.
        </p>
        <button
          onClick={() => onNavigate('/')}
          className="mt-6 px-6 py-2.5 bg-blue-900 text-white font-semibold text-xs rounded-xl"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const isPending = order.orderStatus === 'PENDING_PAYMENT';
  const isPaid = order.paymentStatus === 'PAID';
  const isShipped = order.orderStatus === 'SHIPPED';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      {/* Top Banner Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">Invoice #{order.orderNumber}</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
              isPaid ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              {order.orderStatus.replace(/_/g, ' ')}
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 mt-1">
            {isPaid ? 'Terima Kasih, Pesanan Anda Siap Dikirim!' : 'Menunggu Pembayaran Pesanan'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dipesan pada {new Date(order.createdAt).toLocaleString('id-ID')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Invoice</span>
          </button>
        </div>
      </div>

      {/* PAYMENT INSTRUCTION / DETAILS CARD */}
      {isPending && (
        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-900">
            <Clock className="w-5 h-5 shrink-0" />
            <h2 className="font-serif text-base font-bold">Instruksi Pembayaran DOKU Gateway</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-amber-100">
            <div>
              <p className="text-xs text-slate-500">Metode Pembayaran:</p>
              <p className="text-sm font-bold text-slate-900">{order.paymentMethod?.name || 'Virtual Account'}</p>

              {order.paymentMethod?.vaNumber && (
                <div className="mt-3">
                  <p className="text-xs text-slate-500">Nomor Virtual Account:</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-base font-bold text-blue-900 bg-stone-100 px-3 py-1.5 rounded-lg select-all">
                      {order.paymentMethod.vaNumber}
                    </span>
                    <button
                      onClick={() => handleCopy(order.paymentMethod!.vaNumber!)}
                      className="p-2 text-slate-600 hover:text-blue-900 rounded-lg hover:bg-stone-100 transition-colors"
                      title="Salin Nomor VA"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {order.paymentMethod?.qrString && (
                <div className="mt-3">
                  <p className="text-xs text-slate-500">Scan QRIS:</p>
                  <div className="w-36 h-36 bg-stone-100 border border-stone-300 rounded-xl mt-1 flex flex-col items-center justify-center p-2 text-center">
                    <span className="text-[10px] font-bold text-slate-600">QRIS STANDAR</span>
                    <span className="text-[9px] text-slate-400 mt-1">Pindai dari e-wallet favorit</span>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t sm:border-t-0 sm:border-l border-stone-100 pt-3 sm:pt-0 sm:pl-4 space-y-2">
              <p className="text-xs text-slate-500">Total Tagihan:</p>
              <p className="font-serif text-2xl font-bold text-slate-900 tabular-nums">
                Rp {order.total.toLocaleString('id-ID')}
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {order.paymentMethod?.instructions || 'Silakan transfer sesuai nominal tepat ke nomor Virtual Account di atas sebelum batas waktu berakhir.'}
              </p>

              {/* Developer / Demo Simulator Button */}
              <div className="pt-2">
                <button
                  onClick={handleSimulatePayment}
                  disabled={simulating}
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{simulating ? 'Memverifikasi...' : '⚡ Simulasikan Pembayaran Berhasil'}</span>
                </button>
                <span className="text-[10px] text-slate-400 block text-center mt-1">
                  (Klik tombol ini untuk menguji verifikasi otomatis DOKU & penerbitan resi Mengantar)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MENGANTAR TRACKING CARD */}
      {order.trackingNumber && (
        <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2 text-slate-900">
              <Truck className="w-5 h-5 text-blue-900 shrink-0" />
              <h2 className="font-serif text-base font-bold">Pelacakan Kurir Mengantar Logistik</h2>
            </div>
            <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg">
              Resi: {order.trackingNumber}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block">Layanan Pengiriman:</span>
              <span className="font-semibold text-slate-800">{order.shippingService}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Status Pengiriman:</span>
              <span className="font-semibold text-emerald-700">Dalam Perjalanan / Sedang Diantar</span>
            </div>
          </div>

          {/* Timeline Checkpoints */}
          {trackingInfo?.checkpoints && (
            <div className="pt-3 border-t border-stone-100 space-y-3">
              <p className="text-xs font-bold text-slate-700">Riwayat Perjalanan Paket:</p>
              <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                {trackingInfo.checkpoints.map((cp: any, idx: number) => (
                  <div key={idx} className="relative pl-6 text-xs">
                    <div className="absolute left-1 top-1 w-2.5 h-2.5 rounded-full bg-blue-900 ring-2 ring-white" />
                    <p className="font-semibold text-slate-900">{cp.location}</p>
                    <p className="text-slate-600 mt-0.5">{cp.description}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{cp.timestamp}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ORDER ITEMS & BREAKDOWN */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="font-serif text-base font-bold text-slate-900 pb-3 border-b border-stone-100">
          Rincian Produk Pesanan
        </h2>

        <div className="divide-y divide-stone-100">
          {order.items.map((item, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-14 h-16 object-cover rounded-xl bg-stone-100 shrink-0"
                />
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900">{item.name}</h4>
                  <p className="text-xs text-slate-500">
                    Warna: {item.color} · Ukuran: {item.size} · Jumlah: x{item.quantity}
                  </p>
                </div>
              </div>

              <span className="text-xs sm:text-sm font-bold text-slate-900 tabular-nums shrink-0">
                Rp {item.subtotal.toLocaleString('id-ID')}
              </span>
            </div>
          ))}
        </div>

        {/* Pricing Subtotals */}
        <div className="pt-3 border-t border-stone-100 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal Produk</span>
            <span className="font-semibold text-slate-900 tabular-nums">
              Rp {order.subtotal.toLocaleString('id-ID')}
            </span>
          </div>

          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Diskon Voucher ({order.voucherCode})</span>
              <span className="font-semibold tabular-nums">
                - Rp {order.discount.toLocaleString('id-ID')}
              </span>
            </div>
          )}

          <div className="flex justify-between text-slate-600">
            <span>Biaya Pengiriman Kurir Mengantar</span>
            <span className="font-semibold text-slate-900 tabular-nums">
              Rp {order.shippingCost.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline font-bold text-sm">
            <span className="text-slate-900">Total Pembayaran</span>
            <span className="font-serif text-xl text-blue-900 tabular-nums">
              Rp {order.total.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {/* SHIPPING ADDRESS & CONTACT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs text-xs">
        <div>
          <h3 className="font-serif text-sm font-bold text-slate-900 mb-2">Alamat Pengiriman</h3>
          <p className="font-semibold text-slate-800">{order.shippingAddress.recipientName} ({order.shippingAddress.phone})</p>
          <p className="text-slate-600 mt-1 leading-relaxed">
            {order.shippingAddress.fullAddress}
          </p>
          <p className="text-slate-500 mt-0.5">
            {order.shippingAddress.subdistrict}, {order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.postalCode}
          </p>
          {order.shippingAddress.notes && (
            <p className="text-amber-800 bg-amber-50 p-2 rounded-lg mt-2">
              Catatan: {order.shippingAddress.notes}
            </p>
          )}
        </div>

        <div>
          <h3 className="font-serif text-sm font-bold text-slate-900 mb-2">Informasi Pemesan</h3>
          <p className="text-slate-600">Nama: <span className="font-semibold text-slate-800">{order.customer.name}</span></p>
          <p className="text-slate-600 mt-1">Email: <span className="font-semibold text-slate-800">{order.customer.email}</span></p>
          <p className="text-slate-600 mt-1">WhatsApp: <span className="font-semibold text-slate-800">{order.customer.phone}</span></p>
        </div>
      </div>

      <div className="text-center pt-4">
        <button
          onClick={() => onNavigate('/produk')}
          className="px-6 py-2.5 bg-blue-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-900"
        >
          Lanjut Belanja Busana Muslim
        </button>
      </div>
    </div>
  );
};
