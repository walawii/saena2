import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Tag,
  ArrowRight,
  Lock,
  RefreshCw
} from 'lucide-react';
import { Cart, ShippingAddress, ShippingServiceOption, User } from '../types';
import { cartStorage } from '../services/cartStorage';
import { api } from '../services/api';

interface CheckoutPageProps {
  onNavigate: (path: string) => void;
  onAddToCartSuccess: (message: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate, onAddToCartSuccess }) => {
  const [cart, setCart] = useState<Cart>(cartStorage.getCart());
  const [user, setUser] = useState<User | null>(cartStorage.getCurrentUser());

  // Customer Contact State
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');

  // Shipping Address State
  const defaultAddress = user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0];
  const [recipientName, setRecipientName] = useState(defaultAddress?.recipientName || user?.name || '');
  const [phone, setPhone] = useState(defaultAddress?.phone || user?.phone || '');
  const [province, setProvince] = useState(defaultAddress?.province || 'DKI Jakarta');
  const [city, setCity] = useState(defaultAddress?.city || 'Jakarta Selatan');
  const [subdistrict, setSubdistrict] = useState(defaultAddress?.subdistrict || 'Cilandak');
  const [postalCode, setPostalCode] = useState(defaultAddress?.postalCode || '12430');
  const [fullAddress, setFullAddress] = useState(defaultAddress?.fullAddress || '');
  const [orderNotes, setOrderNotes] = useState('');

  // Shipping Rates & Option
  const [shippingOptions, setShippingOptions] = useState<ShippingServiceOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingServiceOption | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState('');
  const [shippingWarning, setShippingWarning] = useState('');

  // Payment Method Selection
  const [paymentMethodCode, setPaymentMethodCode] = useState('BCA_VA');

  // Submit State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch Shipping Rates when destination changes
  useEffect(() => {
    if (!province || !city || !subdistrict || !postalCode) return;

    const fetchRates = async () => {
      setLoadingShipping(true);
      setShippingError('');
      try {
        const res = await api.calculateShippingRates({
          destinationProvince: province,
          destinationCity: city,
          destinationSubdistrict: subdistrict,
          destinationPostalCode: postalCode,
          weightInGrams: Math.max(cart.totalWeight, 300)
        });

        if (res.warning) {
          setShippingWarning(res.warning);
        } else {
          setShippingWarning('');
        }

        setShippingOptions(res.data);
        if (res.data.length > 0) {
          setSelectedShipping(res.data[0]);
        }
      } catch (err: any) {
        setShippingError(err.message || 'Tarif pengiriman belum dapat diperoleh. Silakan coba beberapa saat lagi.');
        setShippingOptions([]);
        setSelectedShipping(null);
      } finally {
        setLoadingShipping(false);
      }
    };

    fetchRates();
  }, [province, city, subdistrict, postalCode, cart.totalWeight]);

  if (cart.items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="font-serif text-2xl font-bold text-navy">Keranjang Belanja Kosong</h2>
        <p className="text-xs text-slate-500 mt-2">Silakan pilih produk sebelum melanjutkan ke pembayaran.</p>
        <button
          onClick={() => onNavigate('/produk')}
          className="mt-6 px-6 py-2.5 bg-navy text-white font-semibold text-xs rounded-xl hover:bg-navy-dark cursor-pointer"
        >
          Lihat Katalog Produk
        </button>
      </div>
    );
  }

  const shippingFee = selectedShipping ? selectedShipping.cost : 0;
  const grandTotal = Math.max(0, cart.subtotal - (cart.discount || 0) + shippingFee);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName || !customerEmail || !customerPhone) {
      setErrorMessage('Harap lengkapi informasi kontak pemesan.');
      return;
    }

    if (!recipientName || !phone || !province || !city || !fullAddress || !postalCode) {
      setErrorMessage('Harap lengkapi alamat pengiriman secara lengkap.');
      return;
    }

    if (!selectedShipping) {
      setErrorMessage(shippingError || 'Tarif pengiriman resmi Mengantar belum dapat diperoleh. Harap periksa kembali alamat tujuan atau coba beberapa saat lagi.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create order in backend (atomic stock reservation with PostgreSQL SELECT FOR UPDATE)
      const orderPayload = {
        customer: {
          name: customerName.trim(),
          email: customerEmail.trim().toLowerCase(),
          phone: customerPhone.trim(),
        },
        items: cart.items.map(i => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        shippingAddress: {
          recipientName: recipientName.trim(),
          phone: phone.trim(),
          province,
          city,
          subdistrict,
          postalCode,
          fullAddress: fullAddress.trim(),
          notes: orderNotes
        },
        shippingOption: selectedShipping,
        voucherCode: cart.voucherCode,
        paymentMethodCode,
        notes: orderNotes
      };

      const orderRes = await api.createOrder(orderPayload);
      const newOrder = orderRes.data;

      // Clear cart
      cartStorage.clearCart();

      onAddToCartSuccess('Pesanan berhasil dibuat! Silakan selesaikan pembayaran.');
      onNavigate(`/order/${newOrder.orderNumber}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses pesanan. Periksa stok atau coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">Checkout &amp; Pembayaran</h1>
        <p className="text-xs text-slate-500 mt-1">
          Transaksi aman terenkripsi &bull; Reservasi stok otomatis &bull; Pengiriman resmi Mengantar
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {shippingWarning && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
          <span>{shippingWarning}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Contact */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
            <h2 className="font-serif font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-navy text-white text-xs flex items-center justify-center font-sans font-bold">1</span>
              Informasi Pemesan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Pemesan</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama Lengkap"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-navy"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-navy"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">No. WhatsApp</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-navy"
                />
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
            <h2 className="font-serif font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-navy text-white text-xs flex items-center justify-center font-sans font-bold">2</span>
              Alamat Pengiriman
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Penerima</label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Nama Penerima Paket"
                    className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-navy"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">No. HP Penerima</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-navy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Provinsi</label>
                  <input
                    type="text"
                    required
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-navy"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Kota / Kab</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-navy"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Kecamatan</label>
                  <input
                    type="text"
                    required
                    value={subdistrict}
                    onChange={(e) => setSubdistrict(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-navy"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Kode Pos</label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="12430"
                    className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-navy"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Alamat Lengkap</label>
                <textarea
                  required
                  rows={2}
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  placeholder="Nama jalan, nomor rumah, RT/RW, patokan..."
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-navy"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Contoh: Titipkan di pos satpam bila rumah kosong"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-navy"
                />
              </div>
            </div>
          </div>

          {/* Shipping Service Selection */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
            <h2 className="font-serif font-bold text-slate-900 text-base mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-navy text-white text-xs flex items-center justify-center font-sans font-bold">3</span>
                Layanan Kurir (Mengantar Aggregator)
              </span>
              {loadingShipping && <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />}
            </h2>

            {shippingError ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-semibold">{shippingError}</p>
                  <p className="text-[11px] text-amber-700 mt-1">
                    Silakan pastikan nama kecamatan dan kode pos terisi sesuai standar Indonesia, atau coba beberapa saat lagi.
                  </p>
                </div>
              </div>
            ) : shippingOptions.length === 0 && !loadingShipping ? (
              <p className="text-xs text-slate-500">Lengkapi alamat tujuan di atas untuk memuat estimasi ongkos kirim.</p>
            ) : (
              <div className="space-y-2">
                {shippingOptions.map((opt, idx) => {
                  const isSelected = selectedShipping?.serviceCode === opt.serviceCode;
                  return (
                    <label
                      key={idx}
                      className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ${
                        isSelected
                          ? 'border-navy bg-navy/5 shadow-xs'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping_service"
                          checked={isSelected}
                          onChange={() => setSelectedShipping(opt)}
                          className="w-4 h-4 text-navy focus:ring-navy"
                        />
                        <div>
                          <span className="font-semibold text-xs text-slate-900 block">{opt.serviceName}</span>
                          <span className="text-[11px] text-slate-500">Estimasi tiba: {opt.estimatedDays}</span>
                        </div>
                      </div>
                      <span className="font-bold text-sm text-navy">
                        Rp {opt.cost.toLocaleString('id-ID')}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment Method Selection */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
            <h2 className="font-serif font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-navy text-white text-xs flex items-center justify-center font-sans font-bold">4</span>
              Metode Pembayaran (DOKU Gateway)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { code: 'BCA_VA', label: 'BCA Virtual Account', desc: 'Transfer otomatis 24 jam' },
                { code: 'MANDIRI_VA', label: 'Mandiri Virtual Account', desc: 'Livin by Mandiri & ATM' },
                { code: 'BRI_VA', label: 'BRI Virtual Account', desc: 'BRIMO & ATM BRI' },
                { code: 'BNI_VA', label: 'BNI Virtual Account', desc: 'BNI Mobile & ATM' },
                { code: 'QRIS', label: 'QRIS Standard', desc: 'GoPay, OVO, Dana, ShopeePay' },
                { code: 'CREDIT_CARD', label: 'Kartu Kredit / Debit', desc: 'Visa & Mastercard' }
              ].map(method => (
                <label
                  key={method.code}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                    paymentMethodCode === method.code
                      ? 'border-navy bg-navy/5 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value={method.code}
                    checked={paymentMethodCode === method.code}
                    onChange={(e) => setPaymentMethodCode(e.target.value)}
                    className="w-4 h-4 text-navy focus:ring-navy mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">{method.label}</span>
                    <span className="text-[11px] text-slate-500">{method.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm sticky top-24">
            <h3 className="font-serif font-bold text-slate-900 text-base pb-3 border-b border-stone-100">
              Ringkasan Pembelian
            </h3>

            <div className="py-4 space-y-3 border-b border-stone-100 max-h-60 overflow-y-auto no-scrollbar">
              {cart.items.map(item => (
                <div key={item.id} className="flex justify-between items-start text-xs">
                  <div>
                    <span className="font-medium text-slate-800 block">{item.product.name}</span>
                    <span className="text-[11px] text-slate-400">
                      {item.selectedColor} &bull; {item.selectedSize} &times; {item.quantity}
                    </span>
                  </div>
                  <span className="font-bold text-slate-800 ml-2">
                    Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>

            <div className="py-4 space-y-2 text-xs border-b border-stone-100">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Produk</span>
                <span>Rp {cart.subtotal.toLocaleString('id-ID')}</span>
              </div>
              {cart.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Diskon Kupon</span>
                  <span>- Rp {cart.discount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Ongkos Kirim</span>
                <span>Rp {shippingFee.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="pt-4 pb-6 flex justify-between items-baseline">
              <span className="font-serif font-bold text-slate-900 text-sm">Total Tagihan</span>
              <span className="font-serif font-bold text-xl text-navy">
                Rp {grandTotal.toLocaleString('id-ID')}
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-navy hover:bg-navy-dark text-white font-bold text-xs rounded-xl shadow-md transition duration-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Bayar Sekarang (Rp {grandTotal.toLocaleString('id-ID')})</span>
                </>
              )}
            </button>

            <div className="mt-4 pt-4 border-t border-stone-100 text-center">
              <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Diverifikasi aman oleh DOKU Jokul Payment Gateway
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
