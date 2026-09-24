import React, { useState, useEffect } from 'react';
import { Trash2, ArrowRight, ShoppingBag, Tag, Sparkles, Check, AlertCircle } from 'lucide-react';
import { Cart } from '../types';
import { cartStorage } from '../services/cartStorage';
import { api } from '../services/api';

interface CartPageProps {
  onNavigate: (path: string) => void;
  onAddToCartSuccess: (message: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onNavigate, onAddToCartSuccess }) => {
  const [cart, setCart] = useState<Cart>(cartStorage.getCart());
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherMessage, setVoucherMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    const update = () => setCart(cartStorage.getCart());
    window.addEventListener('saena_cart_updated', update);
    return () => window.removeEventListener('saena_cart_updated', update);
  }, []);

  const handleUpdateQty = (itemId: string, delta: number) => {
    cartStorage.updateQuantity(itemId, delta);
  };

  const handleRemove = (itemId: string) => {
    cartStorage.removeItem(itemId);
    onAddToCartSuccess('Produk dihapus dari keranjang.');
  };

  const handleApplyVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherInput.trim()) return;

    setVoucherLoading(true);
    setVoucherMessage(null);

    try {
      const res = await api.validateVoucher(voucherInput.trim(), cart.subtotal);
      const updatedCart = { ...cart, voucherCode: res.data.code, discount: res.data.discount };
      cartStorage.recalculate(updatedCart);
      cartStorage.saveCart(updatedCart);
      setVoucherMessage({ text: res.data.message, isError: false });
    } catch (err: any) {
      setVoucherMessage({ text: err.message || 'Kode voucher tidak valid.', isError: true });
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleRemoveVoucher = () => {
    const updatedCart = { ...cart, voucherCode: undefined, discount: 0 };
    cartStorage.recalculate(updatedCart);
    cartStorage.saveCart(updatedCart);
    setVoucherInput('');
    setVoucherMessage(null);
  };

  if (cart.items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-slate-900">Keranjang Belanja Masih Kosong</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2">
          Anda belum memilih busana muslim favorit. Jelajahi katalog anggun Saena.id dan temukan koleksi terbaik Anda.
        </p>
        <button
          onClick={() => onNavigate('/produk')}
          className="mt-6 px-8 py-3 bg-blue-900 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-md transition-colors"
        >
          Mulai Belanja Sekarang
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="font-serif text-3xl font-bold text-slate-900 mb-2">Keranjang Belanja</h1>
      <p className="text-xs sm:text-sm text-slate-500 mb-8">
        Terdapat <strong>{cart.items.reduce((s, i) => s + i.quantity, 0)} item</strong> busana siap dicheckout
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="divide-y divide-stone-200 bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-xs">
            {cart.items.map((item) => (
              <div key={item.id} className="p-4 sm:p-5 flex gap-4 items-center">
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-20 h-24 object-cover rounded-xl bg-stone-100 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-slate-400">{item.product.categoryName}</p>
                      <h3
                        onClick={() => onNavigate(`/produk/${item.product.slug}`)}
                        className="font-semibold text-sm text-slate-900 truncate hover:text-blue-900 cursor-pointer"
                      >
                        {item.product.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Warna: <span className="font-medium text-slate-800">{item.selectedColor}</span> · Ukuran: <span className="font-medium text-slate-800">{item.selectedSize}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center border border-stone-200 rounded-lg bg-stone-50 p-0.5">
                      <button
                        onClick={() => handleUpdateQty(item.id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-white rounded text-xs"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-semibold text-slate-900 tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(item.id, 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-white rounded text-xs"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900 tabular-nums">
                        Rp {item.totalPrice.toLocaleString('id-ID')}
                      </span>
                      {item.quantity > 1 && (
                        <p className="text-[11px] text-slate-400 tabular-nums">
                          (@ Rp {item.price.toLocaleString('id-ID')})
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center text-xs">
            <button
              onClick={() => onNavigate('/produk')}
              className="text-blue-900 hover:underline font-semibold"
            >
              ← Lanjut Pilih Busana Lain
            </button>
            <button
              onClick={() => {
                cartStorage.clearCart();
                onAddToCartSuccess('Keranjang telah dikosongkan.');
              }}
              className="text-slate-400 hover:text-rose-600"
            >
              Kosongkan Keranjang
            </button>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="font-serif text-lg font-bold text-slate-900">Ringkasan Pesanan</h2>

            {/* Voucher Input */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-600" />
                <span>Punya Kode Voucher?</span>
              </label>

              {cart.voucherCode ? (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="font-bold text-emerald-900 block">{cart.voucherCode}</span>
                    <span className="text-emerald-700 text-[11px]">Hemat Rp {(cart.discount || 0).toLocaleString('id-ID')}</span>
                  </div>
                  <button
                    onClick={handleRemoveVoucher}
                    className="text-xs text-rose-600 hover:underline font-semibold"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyVoucher} className="flex gap-2">
                  <input
                    type="text"
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                    placeholder="Contoh: SAENABARU"
                    className="flex-1 text-xs uppercase p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-blue-900"
                  />
                  <button
                    type="submit"
                    disabled={voucherLoading || !voucherInput.trim()}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-blue-900 disabled:bg-stone-300 text-white text-xs font-semibold rounded-xl transition-colors"
                  >
                    {voucherLoading ? 'Cek...' : 'Terapkan'}
                  </button>
                </form>
              )}

              {voucherMessage && (
                <div className={`mt-2 text-xs flex items-center gap-1.5 ${
                  voucherMessage.isError ? 'text-rose-600' : 'text-emerald-700'
                }`}>
                  {voucherMessage.isError ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <Check className="w-3.5 h-3.5 shrink-0" />}
                  <span>{voucherMessage.text}</span>
                </div>
              )}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2 pt-3 border-t border-stone-100 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Belanja Produk</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  Rp {cart.subtotal.toLocaleString('id-ID')}
                </span>
              </div>

              {cart.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Diskon Voucher</span>
                  <span className="font-semibold tabular-nums">
                    - Rp {cart.discount.toLocaleString('id-ID')}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Estimasi Berat Paket</span>
                <span className="tabular-nums">{(cart.totalWeight / 1000).toFixed(1)} kg</span>
              </div>

              <div className="flex justify-between text-slate-500 text-[11px] pt-1">
                <span>Ongkos Kirim Mengantar</span>
                <span className="italic">Dihitung di checkout</span>
              </div>
            </div>

            {/* Total Row */}
            <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900">Total Sementara</span>
              <span className="font-serif text-xl font-bold text-blue-900 tabular-nums">
                Rp {cart.total.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Checkout CTA */}
            <button
              onClick={() => onNavigate('/checkout')}
              className="w-full py-3.5 bg-blue-900 hover:bg-slate-900 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Lanjut ke Pembayaran</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center text-[11px] text-slate-400">
              Transaksi aman dilindungi oleh <strong>DOKU Jokul</strong> & <strong>Mengantar Logistik</strong>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
