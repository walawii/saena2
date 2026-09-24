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
  Lock
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

  // Payment Method Selection
  const [paymentMethodCode, setPaymentMethodCode] = useState('BCA_VA');

  // Submit State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch Shipping Rates when destination changes
  useEffect(() => {
    if (!province || !city) return;

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

        setShippingOptions(res.data);
        if (res.data.length > 0) {
          setSelectedShipping(res.data[0]);
        }
      } catch (err: any) {
        setShippingError(err.message || 'Gagal menghitung ongkos kirim');
      } finally {
        setLoadingShipping(false);
      }
    };

    fetchRates();
  }, [province, city, subdistrict, cart.totalWeight]);

  if (cart.items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="font-serif text-2xl font-bold text-slate-900">Keranjang Belanja Kosong</h2>
        <p className="text-xs text-slate-500 mt-2">Silakan pilih produk sebelum melanjutkan ke pembayaran.</p>
        <button
          onClick={() => onNavigate('/produk')}
          className="mt-6 px-6 py-2.5 bg-blue-900 text-white font-semibold text-xs rounded-xl"
        >
          Lihat Katalog
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

    if (!recipientName || !phone || !province || !city || !fullAddress) {
      setErrorMessage('Harap lengkapi alamat pengiriman.');
      return;
    }

    if (!selectedShipping) {
      setErrorMessage('Pilih salah satu layanan kurir pengiriman Mengantar.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create order in backend (triggers server-side pricing, inventory lock, and DB persist)
      const orderPayload = {
        customer: {
          name: customerName.trim(),
          email: customerEmail.trim().toLowerCase(),
          phone: customerPhone.trim(),
        },
        items: cart.items.map(i => ({
          productId: i.productId,
          variantId: i.variantId,
          name: i.product.name,
          color: i.selectedColor,
          size: i.selectedSize,
          price: i.price,
          quantity: i.quantity,
        })),
        shippingAddress: {
          id: `addr-${Date.now()}`,
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

      // 2. Initiate DOKU Payment
      try {
        await api.createPayment(newOrder.orderNumber, paymentMethodCode);
      } catch (payErr: any) {
        console.warn('Payment init returned note:', payErr.message);
      }

      // 3. Clear local cart
      cartStorage.clearCart();

      // 4. Save session customer details for easy return
      if (!user) {
        cartStorage.saveCurrentUser({
          id: `guest-${Date.now()}`,
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          role: 'CUSTOMER',
          addresses: [orderPayload.shippingAddress],
          createdAt: new Date().toISOString()
        });
      }

      onAddToCartSuccess('Pesanan Anda berhasil dibuat!');
      onNavigate(`/order/${newOrder.orderNumber}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses pesanan. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Checkout Header */}
      <div className="max-w-3xl mb-8">
        <h1 className="font-serif text-3xl font-bold text-slate-900">Checkout Pesanan</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Lengkapi detail pengiriman dan selesaikan pembayaran aman dengan DOKU & Mengantar Logistik
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Steps */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* STEP 1: INFORMASI PEMESAN */}
          <div className="p-5 sm:p-6 bg-white rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
              <div className="w-6 h-6 rounded-full bg-blue-900 text-white text-xs font-bold flex items-center justify-center">
                1
              </div>
              <h2 className="font-serif text-base font-bold text-slate-900">Informasi Kontak Pemesan</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Pemesan *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama Lengkap Anda"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email * (untuk info resi)</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">No. WhatsApp / HP *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="08123456789"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-blue-900"
                />
              </div>
            </div>
          </div>

          {/* STEP 2: ALAMAT PENGIRIMAN */}
          <div className="p-5 sm:p-6 bg-white rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
              <div className="w-6 h-6 rounded-full bg-blue-900 text-white text-xs font-bold flex items-center justify-center">
                2
              </div>
              <h2 className="font-serif text-base font-bold text-slate-900">Alamat Pengiriman Paket</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Penerima *</label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Nama Penerima Paket"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">No. HP Penerima *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812xxxxxxxx"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Provinsi *</label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-blue-900 bg-white"
                >
                  <option value="DKI Jakarta">DKI Jakarta</option>
                  <option value="Jawa Barat">Jawa Barat</option>
                  <option value="Jawa Tengah">Jawa Tengah</option>
                  <option value="DI Yogyakarta">DI Yogyakarta</option>
                  <option value="Jawa Timur">Jawa Timur</option>
                  <option value="Banten">Banten</option>
                  <option value="Bali">Bali</option>
                  <option value="Sumatera Utara">Sumatera Utara</option>
                  <option value="Sumatera Barat">Sumatera Barat</option>
                  <option value="Riau">Riau</option>
                  <option value="Lampung">Lampung</option>
                  <option value="Kalimantan Selatan">Kalimantan Selatan</option>
                  <option value="Sulawesi Selatan">Sulawesi Selatan</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Kota / Kabupaten *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Contoh: Jakarta Selatan / Bandung"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Kecamatan *</label>
                <input
                  type="text"
                  required
                  value={subdistrict}
                  onChange={(e) => setSubdistrict(e.target.value)}
                  placeholder="Contoh: Cilandak / Coblong"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Kode Pos *</label>
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="12430"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-blue-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">Alamat Lengkap (Jalan, No. Rumah, RT/RW, Patokan) *</label>
                <textarea
                  required
                  rows={3}
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  placeholder="Jl. Flamboyan No. 12, RT 03/RW 05, Kel. Harum, patokan pagar hitam"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-blue-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">Catatan Tambahan untuk Kurir (Opsional)</label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Misal: Titipkan di satpam perumahan jika tidak ada di rumah"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-blue-900"
                />
              </div>
            </div>
          </div>

          {/* STEP 3: OPSI PENGIRIMAN MENGANTAR */}
          <div className="p-5 sm:p-6 bg-white rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-900 text-white text-xs font-bold flex items-center justify-center">
                  3
                </div>
                <h2 className="font-serif text-base font-bold text-slate-900">Kurir Pengiriman Mengantar</h2>
              </div>
              <span className="text-[11px] font-semibold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                Logistik Mengantar
              </span>
            </div>

            {loadingShipping ? (
              <div className="py-6 text-center text-xs text-slate-500">
                Menghitung tarif kurir Mengantar ke {city}...
              </div>
            ) : shippingError ? (
              <div className="p-3 rounded-xl bg-amber-50 text-amber-900 text-xs">
                {shippingError}
              </div>
            ) : (
              <div className="space-y-2.5">
                {shippingOptions.map((opt) => {
                  const isSelected = selectedShipping?.serviceCode === opt.serviceCode;
                  return (
                    <div
                      key={opt.serviceCode}
                      onClick={() => setSelectedShipping(opt)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-blue-900 bg-blue-50/40 ring-1 ring-blue-900/30'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-blue-900 bg-blue-900' : 'border-stone-400'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{opt.serviceName}</p>
                          <p className="text-[11px] text-slate-500">Estimasi sampai: <strong>{opt.estimatedDays}</strong></p>
                        </div>
                      </div>

                      <span className="font-bold text-xs text-slate-900 tabular-nums">
                        Rp {opt.cost.toLocaleString('id-ID')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* STEP 4: METODE PEMBAYARAN DOKU */}
          <div className="p-5 sm:p-6 bg-white rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-900 text-white text-xs font-bold flex items-center justify-center">
                  4
                </div>
                <h2 className="font-serif text-base font-bold text-slate-900">Metode Pembayaran DOKU Gateway</h2>
              </div>
              <span className="text-[11px] font-semibold text-slate-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                Otomatis Terverifikasi
              </span>
            </div>

            <div className="space-y-2">
              {[
                { code: 'BCA_VA', name: 'BCA Virtual Account', badge: 'Paling Populer', desc: 'Bayar via BCA Mobile, KlikBCA, atau ATM BCA' },
                { code: 'MANDIRI_VA', name: 'Mandiri Virtual Account', badge: 'Instan', desc: 'Bayar via Livin\' by Mandiri atau ATM' },
                { code: 'BRI_VA', name: 'BRI BRIVA', badge: 'Instan', desc: 'Bayar via BRImo atau ATM BRI' },
                { code: 'BNI_VA', name: 'BNI Virtual Account', badge: 'Instan', desc: 'Bayar via BNI Mobile Banking atau ATM BNI' },
                { code: 'QRIS', name: 'QRIS (Semua E-Wallet & Bank)', badge: 'Scan & Pay', desc: 'GoPay, OVO, ShopeePay, DANA, BCA, dan bank lainnya' },
                { code: 'CC', name: 'Kartu Kredit / Online Debit', badge: '3D Secure', desc: 'Visa & Mastercard terproteksi' },
              ].map((m) => {
                const isSelected = paymentMethodCode === m.code;
                return (
                  <div
                    key={m.code}
                    onClick={() => setPaymentMethodCode(m.code)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-blue-900 bg-blue-50/40 ring-1 ring-blue-900/30'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-blue-900 bg-blue-900' : 'border-stone-400'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900">{m.name}</p>
                          <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded font-semibold">
                            {m.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{m.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sticky Order Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 sm:p-6 shadow-xs space-y-4 sticky top-24">
            <h2 className="font-serif text-lg font-bold text-slate-900 pb-3 border-b border-stone-100">
              Detail Pembayaran Pesanan
            </h2>

            {/* Item list mini */}
            <div className="max-h-60 overflow-y-auto divide-y divide-stone-100 pr-1 space-y-2">
              {cart.items.map((item) => (
                <div key={item.id} className="pt-2 flex items-center gap-3">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-12 h-14 object-cover rounded-lg bg-stone-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{item.product.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {item.selectedColor} · {item.selectedSize} · x{item.quantity}
                    </p>
                    <p className="text-xs font-bold text-slate-900 mt-0.5 tabular-nums">
                      Rp {item.totalPrice.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-3 border-t border-stone-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({cart.items.reduce((s, i) => s + i.quantity, 0)} item)</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  Rp {cart.subtotal.toLocaleString('id-ID')}
                </span>
              </div>

              {cart.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Diskon Voucher ({cart.voucherCode})</span>
                  <span className="font-semibold tabular-nums">
                    - Rp {cart.discount.toLocaleString('id-ID')}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Ongkir Kurir Mengantar</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  Rp {shippingFee.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Grand Total */}
            <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline">
              <div>
                <span className="text-xs font-semibold text-slate-500 block">Total Tagihan:</span>
                <span className="font-serif text-2xl font-bold text-blue-900 tabular-nums">
                  Rp {grandTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Place Order CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-blue-900 hover:bg-slate-900 disabled:bg-stone-300 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{isSubmitting ? 'Memproses Pesanan...' : 'Bayar Sekarang Aman'}</span>
            </button>

            <div className="pt-2 text-center text-[11px] text-slate-400 space-y-1">
              <p>🔒 Dilindungi enkripsi 256-bit DOKU Payment Gateway.</p>
              <p>Nomor resi pengiriman Mengantar akan dikirimkan otomatis.</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
