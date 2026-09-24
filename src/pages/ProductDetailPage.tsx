import React, { useState, useEffect } from 'react';
import {
  Heart,
  Star,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RefreshCw,
  Ruler,
  Share2,
  Check,
  AlertCircle
} from 'lucide-react';
import { Product, ProductVariant, Review } from '../types';
import { api } from '../services/api';
import { cartStorage } from '../services/cartStorage';
import { ProductCard } from '../components/product/ProductCard';

interface ProductDetailPageProps {
  slug: string;
  onNavigate: (path: string) => void;
  onAddToCartSuccess: (message: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  slug,
  onNavigate,
  onAddToCartSuccess,
}) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Review Form state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await api.getProduct(slug);
        const prod = res.data;
        setProduct(prod);
        setRelated(res.related || []);
        setIsWishlisted(cartStorage.isInWishlist(prod.id));

        // Default selections
        if (prod.colors.length > 0) {
          setSelectedColor(prod.colors[0].name);
        }
        if (prod.sizes.length > 0) {
          setSelectedSize(prod.sizes[0]);
        }

        // Fetch reviews
        const revRes = await api.getReviews(prod.id);
        setReviews(revRes.data);
      } catch (err) {
        console.error('Failed to load product detail:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500">Memuat koleksi busana...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="font-serif text-2xl font-bold text-slate-900">Produk Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500 mt-2">Busana yang Anda cari mungkin sudah tidak tersedia atau link tidak valid.</p>
        <button
          onClick={() => onNavigate('/produk')}
          className="mt-6 px-6 py-2.5 bg-blue-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-900"
        >
          Lihat Koleksi Lainnya
        </button>
      </div>
    );
  }

  // Find matching variant
  const currentVariant: ProductVariant | undefined = product.variants.find(
    v => v.colorName.toLowerCase() === selectedColor.toLowerCase() && v.size === selectedSize
  ) || product.variants[0];

  const currentStock = currentVariant ? currentVariant.stock : product.stock;
  const isOutOfStock = currentStock <= 0;

  const displayPrice = product.discountPrice || product.price;
  const hasDiscount = Boolean(product.discountPrice && product.discountPrice < product.price);
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!currentVariant || isOutOfStock) return;
    cartStorage.addItem(product, currentVariant, quantity);
    onAddToCartSuccess(`Berhasil menambahkan ${quantity}x ${product.name} (${selectedColor} - ${selectedSize}) ke keranjang!`);
  };

  const handleBuyNow = () => {
    if (!currentVariant || isOutOfStock) return;
    cartStorage.addItem(product, currentVariant, quantity);
    onNavigate('/checkout');
  };

  const handleToggleWishlist = () => {
    const nextState = cartStorage.toggleWishlist(product);
    setIsWishlisted(nextState);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName || !reviewComment) return;

    setSubmittingReview(true);
    try {
      const res = await api.submitReview({
        productId: product.id,
        customerName: reviewName,
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviews([res.data, ...reviews]);
      setShowReviewModal(false);
      setReviewComment('');
      setReviewName('');
      onAddToCartSuccess('Terima kasih! Ulasan Anda telah berhasil dipublikasikan.');
    } catch (err: any) {
      alert(err.message || 'Gagal mengirimkan ulasan');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav className="text-xs text-slate-500 mb-6 flex items-center gap-1.5 truncate">
        <button onClick={() => onNavigate('/')} className="hover:underline">Beranda</button>
        <span>/</span>
        <button onClick={() => onNavigate('/produk')} className="hover:underline">Koleksi</button>
        <span>/</span>
        <button onClick={() => onNavigate(`/kategori/${product.category}`)} className="hover:underline">
          {product.categoryName}
        </button>
        <span>/</span>
        <span className="text-slate-900 font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-stone-100 border border-stone-200/80 shadow-xs">
            <img
              src={product.images[selectedImageIndex] || product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
            {hasDiscount && (
              <span className="absolute top-4 left-4 bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-lg shadow-sm">
                Diskon {discountPercent}%
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-20 h-24 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImageIndex === idx
                      ? 'border-blue-900 shadow-sm ring-2 ring-blue-900/20'
                      : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`${product.name} view ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Contiguous Purchase Module */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span>SKU: {product.sku}</span>
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-slate-900 text-xs">{product.rating}</span>
                <span className="text-slate-400">({product.reviewCount} ulasan)</span>
              </div>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
              {product.name}
            </h1>

            {/* Price Row */}
            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
                Rp {displayPrice.toLocaleString('id-ID')}
              </span>
              {hasDiscount && (
                <span className="text-sm sm:text-base text-slate-400 line-through tabular-nums">
                  Rp {product.price.toLocaleString('id-ID')}
                </span>
              )}
            </div>
          </div>

          {/* Color Selection */}
          {product.colors.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Pilihan Warna: <span className="font-medium text-blue-900 capitalize">{selectedColor}</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => {
                  const isSelected = selectedColor.toLowerCase() === c.name.toLowerCase();
                  return (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c.name)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
                        isSelected
                          ? 'border-blue-900 bg-blue-50/50 text-blue-900 ring-2 ring-blue-900/10'
                          : 'border-stone-200 text-slate-700 hover:border-stone-400'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-stone-300"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size Selection */}
          {product.sizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Pilihan Ukuran: <span className="font-medium text-blue-900">{selectedSize}</span>
                </span>
                <span className="text-xs text-slate-500">
                  Stok: <strong className={currentStock < 5 ? 'text-rose-600' : 'text-slate-800'}>{currentStock} pcs</strong>
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => {
                  const isSelected = selectedSize === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`min-w-12 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Stepper */}
          <div>
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-2">
              Jumlah Pembelian
            </span>
            <div className="inline-flex items-center border border-stone-200 rounded-xl bg-white p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-stone-100 disabled:opacity-30"
              >
                -
              </button>
              <span className="w-12 text-center text-sm font-semibold text-slate-900 tabular-nums">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                disabled={quantity >= currentStock}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-stone-100 disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>

          {/* Action CTA Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 py-3.5 bg-blue-900 hover:bg-slate-900 disabled:bg-stone-300 text-white font-semibold text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isOutOfStock ? 'Stok Habis' : 'Tambah ke Keranjang'}</span>
              </button>

              <button
                onClick={handleToggleWishlist}
                className={`p-3.5 rounded-xl border transition-colors ${
                  isWishlisted
                    ? 'border-rose-300 bg-rose-50 text-rose-600'
                    : 'border-stone-300 text-slate-600 hover:border-stone-400'
                }`}
                title={isWishlisted ? 'Hapus dari Favorit' : 'Simpan ke Favorit'}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
              </button>
            </div>

            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-200 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Beli Sekarang Langsung
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2.5 text-xs text-slate-600">
            <div className="flex items-center gap-2 text-slate-800">
              <Truck className="w-4 h-4 text-blue-900 shrink-0" />
              <span>Didukung kurir <strong>Mengantar</strong> (JNE, SiCepat, J&T) dengan estimasi 1-3 hari</span>
            </div>
            <div className="flex items-center gap-2 text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Pembayaran aman terenkripsi <strong>DOKU Gateway</strong> (BCA, Mandiri, QRIS)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-800">
              <RefreshCw className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Garansi 100% original & tukar ukuran jika tidak pas</span>
            </div>
          </div>

          {/* Product Description */}
          <div className="pt-4 border-t border-stone-200 space-y-3">
            <h3 className="font-serif text-base font-bold text-slate-900">Deskripsi & Spesifikasi Busana</h3>
            <div className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line space-y-2">
              {product.description}
            </div>

            <div className="pt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                <span className="text-slate-400 block">Berat Paket:</span>
                <span className="font-semibold text-slate-800">{product.weight} gram</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                <span className="text-slate-400 block">Dimensi:</span>
                <span className="font-semibold text-slate-800">{product.dimensions.length}x{product.dimensions.width}x{product.dimensions.height} cm</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <section className="mt-16 pt-12 border-t border-stone-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-serif text-2xl font-bold text-slate-900">Ulasan Pembeli Terverifikasi</h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <span>Rata-rata <strong>{product.rating}</strong> dari <strong>{reviews.length}</strong> ulasan</span>
            </div>
          </div>

          <button
            onClick={() => setShowReviewModal(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-blue-900 text-white text-xs font-semibold rounded-xl transition-colors self-start sm:self-auto cursor-pointer"
          >
            + Tulis Ulasan Produk
          </button>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-10 bg-stone-50 rounded-2xl border border-stone-200">
            <p className="text-sm font-semibold text-slate-700">Belum ada ulasan untuk busana ini.</p>
            <p className="text-xs text-slate-500 mt-1">Jadilah pelanggan pertama yang memberikan review!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-5 rounded-2xl bg-white border border-stone-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-900 text-xs font-bold flex items-center justify-center">
                      {rev.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{rev.customerName}</p>
                      <p className="text-[10px] text-slate-400">{new Date(rev.createdAt).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                  <div className="flex text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                  "{rev.comment}"
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Review Submission Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-serif text-lg font-bold text-slate-900">Tulis Ulasan untuk {product.name}</h3>
            
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  placeholder="Misal: Fatimah Azzahra"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Rating Produk</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Ulasan / Testimoni</label>
                <textarea
                  required
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Ceritakan tentang kenyamanan kain, kesesuaian ukuran, jahitan, atau keanggunan modelnya..."
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-blue-900"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-slate-700 hover:bg-stone-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 py-2.5 rounded-xl bg-blue-900 hover:bg-slate-900 text-white text-xs font-semibold"
                >
                  {submittingReview ? 'Mengirim...' : 'Kirim Ulasan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Related Products Grid */}
      {related.length > 0 && (
        <section className="mt-16 pt-12 border-t border-stone-200">
          <h2 className="font-serif text-2xl font-bold text-slate-900 mb-6">
            Koleksi Terkait yang Serupa
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onNavigate={onNavigate}
                onAddToCartSuccess={onAddToCartSuccess}
              />
            ))}
          </div>
        </section>
      )}

      {/* Mobile Sticky Purchase Bar */}
      <div className="lg:hidden fixed bottom-14 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-stone-200 p-3 shadow-lg flex items-center justify-between gap-3">
        <div>
          <span className="text-[11px] text-slate-500 block">Total Harga:</span>
          <span className="font-bold text-slate-900 text-sm tabular-nums">
            Rp {(displayPrice * quantity).toLocaleString('id-ID')}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="px-4 py-2 bg-blue-900 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>+ Keranjang</span>
          </button>
          <button
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="px-4 py-2 bg-amber-600 text-white text-xs font-semibold rounded-xl"
          >
            Beli
          </button>
        </div>
      </div>
    </div>
  );
};
