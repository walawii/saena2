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
  Printer,
  RefreshCw
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
          // Track shipping might be in unconfigured state
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

    // Auto-poll status if pending payment
    const interval = setInterval(() => {
      if (order?.orderStatus === 'PENDING_PAYMENT') {
        fetchOrder();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [orderNumber, order?.orderStatus]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onAddToCartSuccess('Nomor pembayaran berhasil disalin!');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <RefreshCw className="w-8 h-8 text-navy animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500">Memuat status pesanan #{orderNumber} dari database...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="font-serif text-2xl font-bold text-slate-900">Pesanan Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500 mt-2">
          Nomor pesanan <strong>{orderNumber}</strong> tidak ditemukan di basis data Saena.id.
        </p>
        <button
          onClick={() => onNavigate('/')}
          className="mt-6 px-6 py-2.5 bg-navy text-white font-semibold text-xs rounded-xl hover:bg-navy-dark cursor-pointer"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const isPending = order.orderStatus === 'PENDING_PAYMENT';
  const isPaid = order.orderStatus === 'PAID' || order.orderStatus === 'PROCESSING';
  const isShipped = order.orderStatus === 'SHIPPED' || order.orderStatus === 'READY_TO_SHIP';
  const isDelivered = order.orderStatus === 'DELIVERED';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      {/* Top Banner Status */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-100 gap-4">
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Detail Transaksi Resmi</span>
            <h1 className="font-serif text-2xl font-bold text-navy flex items-center gap-2">
              <span>Order #{order.orderNumber}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Dibuat pada {new Date(order.createdAt).toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })} WIB
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
              isPaid ? 'bg-emerald-100 text-emerald-800' :
              isShipped ? 'bg-blue-100 text-blue-800' :
              isDelivered ? 'bg-purple-100 text-purple-800' :
              order.orderStatus === 'CANCELLED' ? 'bg-rose-100 text-rose-800' :
              'bg-amber-100 text-amber-800'
            }`}>
              {order.orderStatus === 'PENDING_PAYMENT' ? 'MENUNGGU PEMBAYARAN' :
               order.orderStatus === 'PAID' ? 'PEMBAYARAN DIVERIFIKASI' :
               order.orderStatus === 'PROCESSING' ? 'SEDANG DIPROSES' :
               order.orderStatus === 'SHIPPED' ? 'SEDANG DIKIRIM' :
               order.orderStatus === 'DELIVERED' ? 'PESANAN DITERIMA' : order.orderStatus}
            </span>

            <button
              onClick={() => window.print()}
              className="p-2 border border-stone-200 rounded-xl hover:bg-stone-50 text-slate-600 transition cursor-pointer"
              title="Cetak Invoice"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="pt-6">
          <div className="grid grid-cols-4 text-center text-xs">
            <div className={`space-y-1.5 ${isPending || isPaid || isShipped || isDelivered ? 'text-navy font-bold' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs ${
                isPending || isPaid || isShipped || isDelivered ? 'bg-navy text-white' : 'bg-stone-200 text-slate-500'
              }`}>
                1
              </div>
              <span>Pesanan Dibuat</span>
            </div>

            <div className={`space-y-1.5 ${isPaid || isShipped || isDelivered ? 'text-navy font-bold' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs ${
                isPaid || isShipped || isDelivered ? 'bg-navy text-white' : 'bg-stone-200 text-slate-500'
              }`}>
                2
              </div>
              <span>Pembayaran Sah</span>
            </div>

            <div className={`space-y-1.5 ${isShipped || isDelivered ? 'text-navy font-bold' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs ${
                isShipped || isDelivered ? 'bg-navy text-white' : 'bg-stone-200 text-slate-500'
              }`}>
                3
              </div>
              <span>Pengiriman</span>
            </div>

            <div className={`space-y-1.5 ${isDelivered ? 'text-navy font-bold' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs ${
                isDelivered ? 'bg-navy text-white' : 'bg-stone-200 text-slate-500'
              }`}>
                4
              </div>
              <span>Selesai</span>
            </div>
          </div>
        </div>
      </div>

      {/* PAYMENT INSTRUCTION / DETAILS CARD */}
      {isPending && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-amber-900">
            <Clock className="w-5 h-5 shrink-0" />
            <h2 className="font-serif text-base font-bold">Instruksi Pembayaran DOKU Gateway</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-5 rounded-2xl border border-amber-100">
            <div>
              <p className="text-xs text-slate-500">Metode Pembayaran:</p>
              <p className="text-sm font-bold text-slate-900">{order.paymentMethod?.name || 'Virtual Account'}</p>

              {order.paymentMethod?.vaNumber && (
                <div className="mt-3">
                  <p className="text-xs text-slate-500">Nomor Virtual Account:</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-base font-bold text-navy bg-slate-100 px-3 py-1.5 rounded-xl select-all">
                      {order.paymentMethod.vaNumber}
                    </span>
                    <button
                      onClick={() => handleCopy(order.paymentMethod!.vaNumber!)}
                      className="p-2 text-slate-600 hover:text-navy rounded-lg hover:bg-slate-100 transition cursor-pointer"
                      title="Salin Nomor VA"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {order.paymentMethod?.paymentUrl && (
                <div className="mt-3">
                  <a
                    href={order.paymentMethod.paymentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-white bg-navy hover:bg-navy-dark px-4 py-2 rounded-xl transition"
                  >
                    <span>Buka Halaman Pembayaran DOKU</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {order.paymentMethod?.qrString && (
                <div className="mt-3">
                  <p className="text-xs text-slate-500">Scan QRIS:</p>
                  <div className="w-36 h-36 bg-slate-100 border border-slate-300 rounded-xl mt-1 flex flex-col items-center justify-center p-2 text-center">
                    <span className="text-[10px] font-bold text-slate-700">QRIS DOKU</span>
                    <span className="text-[9px] text-slate-500 mt-1">Pindai dengan aplikasi pembayaran apa saja</span>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-5 space-y-2">
              <p className="text-xs text-slate-500">Total Nominal Tagihan:</p>
              <p className="font-serif text-2xl font-bold text-navy">
                Rp {order.total.toLocaleString('id-ID')}
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Silakan transfer tepat sesuai nominal sebelum batas waktu 2 jam berakhir. Status pesanan akan otomatis terverifikasi begitu notifikasi webhook DOKU diterima server.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MENGANTAR TRACKING CARD */}
      {order.trackingNumber && (
        <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2 text-slate-900">
              <Truck className="w-5 h-5 text-navy shrink-0" />
              <h2 className="font-serif text-base font-bold">Pelacakan Resi Mengantar Aggregator</h2>
            </div>
            <span className="font-mono font-bold text-xs bg-slate-100 text-navy px-3 py-1 rounded-lg">
              {order.trackingNumber}
            </span>
          </div>

          <div className="text-xs text-slate-600">
            <div className="font-medium text-slate-900 mb-2">
              Layanan: {order.shippingService} &bull; Kurir: {order.shippingProvider}
            </div>

            {trackingInfo?.checkpoints && trackingInfo.checkpoints.length > 0 ? (
              <div className="space-y-3 pl-4 border-l-2 border-navy/30">
                {trackingInfo.checkpoints.map((cp: any, idx: number) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-navy" />
                    <span className="font-bold text-slate-800">{cp.status}</span>
                    <p className="text-slate-500">{cp.description}</p>
                    <span className="text-[10px] text-slate-400">{cp.timestamp}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-xs italic">
                Paket telah diserahkan ke pihak logistik Mengantar dan sedang dalam proses sorting di hub pengiriman.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ITEMS & SUMMARY CARD */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-serif font-bold text-slate-900 text-base">Detail Produk yang Dipesan</h3>

        <div className="divide-y divide-stone-100">
          {order.items.map((item, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                {item.image && (
                  <img src={item.image} alt={item.name} className="w-12 h-14 object-cover rounded-lg flex-shrink-0" />
                )}
                <div>
                  <span className="font-medium text-slate-900 text-sm">{item.name}</span>
                  <div className="text-slate-400">
                    Varian: {item.color} / {item.size} &bull; Kuantitas: {item.quantity} unit
                  </div>
                </div>
              </div>
              <span className="font-bold text-slate-900 text-sm">
                Rp {item.subtotal.toLocaleString('id-ID')}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-stone-100 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal Produk</span>
            <span>Rp {order.subtotal.toLocaleString('id-ID')}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Diskon Voucher</span>
              <span>- Rp {order.discount.toLocaleString('id-ID')}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>Biaya Pengiriman</span>
            <span>Rp {order.shippingCost.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-base font-serif font-bold text-navy pt-2 border-t border-stone-100">
            <span>Total Transaksi</span>
            <span>Rp {order.total.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
