import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Truck, RefreshCw, Star, ChevronDown, Check } from 'lucide-react';
import { Product } from '../types';
import { api } from '../services/api';
import { ProductCard } from '../components/product/ProductCard';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onAddToCartSuccess: (message: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onAddToCartSuccess }) => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await api.getProducts();
        const prods = res.data;
        setFeaturedProducts(prods.filter(p => p.isFeatured).slice(0, 4));
        setBestSellers(prods.filter(p => p.isBestSeller).slice(0, 4));
        setNewArrivals(prods.filter(p => p.isNewArrival).slice(0, 4));
      } catch (err) {
        console.error('Failed to load homepage products:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const categories = [
    { slug: 'gamis', name: 'Gamis Syar\'i', desc: 'Anggun & Wudhu Friendly', tag: 'Favorit' },
    { slug: 'dress-muslim', name: 'Dress Muslim', desc: 'Plisket & Pesta Modern', tag: 'Koleksi Eksklusif' },
    { slug: 'mukena', name: 'Mukena Silk', desc: 'Armani Silk & Renda', tag: 'Terlaris' },
    { slug: 'hijab', name: 'Voal & Hijab', desc: 'Ultrafine Laser Cut', tag: 'Breathable' },
    { slug: 'daster', name: 'Daster Chic', desc: 'Rayon Dingin Rumahan', tag: 'Adem Seharian' },
    { slug: 'setelan', name: 'Setelan Muslim', desc: 'Tunic & Kulot 2-Piece', tag: 'Praktis' },
    { slug: 'anak', name: 'Busana Anak', desc: 'Gamis & Bergo Si Kecil', tag: 'Bahan Lembut' },
    { slug: 'best-seller', name: 'Best Seller', desc: 'Pilihan Terbanyak', tag: 'Paling Dicari' },
  ];

  const testimonials = [
    {
      name: 'Ustadzah Nurul Latifah',
      location: 'Jakarta Selatan',
      comment: 'Kain gamis Ameera Silk dari Saena.id luar biasa lembut dan tidak menerawang. Potongan bajunya sangat syar\'i namun tetap berkelas untuk menghadiri kajian formal.',
      product: 'Ameera Silk Gamis Dress',
      rating: 5
    },
    {
      name: 'Ratri Pramudita, S.E.',
      location: 'Bandung',
      comment: 'Pengiriman kurir Mengantar cepat sekali, order Senin siang hari Selasa sore sudah sampai di Bandung. Daster Valencia-nya juara ademnya, ga luntur!',
      product: 'Rayon Valencia Daster Chic',
      rating: 5
    },
    {
      name: 'Dr. Sarah Amalia',
      location: 'Surabaya',
      comment: 'Mukena Khawla Silk saya jadikan seserahan pernikahan. Packaging rapi sekali, pouch cantik dan renda chantilly-nya sangat mewah. Sangat direkomendasikan!',
      product: 'Khawla Royal Silk Mukena',
      rating: 5
    }
  ];

  const faqs = [
    {
      q: 'Apakah seluruh produk Saena.id menggunakan bahan no-terawang?',
      a: 'Ya, seluruh produk kami melalui standar kurasi ketat. Untuk bahan sifon atau plisket, kami selalu menyertakan furing katun adem berlapis sehingga 100% aman dan tidak menerawang.'
    },
    {
      q: 'Bagaimana metode pembayaran yang tersedia di Saena.id?',
      a: 'Kami bekerjasama resmi dengan DOKU Payment Gateway. Anda dapat membayar melalui Virtual Account Bank (BCA, Mandiri, BRI, BNI), QRIS instan (GoPay, OVO, Dana, ShopeePay), dan Kartu Kredit secara aman dan otomatis terverifikasi.'
    },
    {
      q: 'Berapa lama estimasi pengiriman pesanan?',
      a: 'Pengiriman didukung oleh agregator kurir Mengantar (JNE, SiCepat, J&T). Wilayah Jabodetabek estimasi 1-2 hari kerja, Pulau Jawa 2-3 hari, dan luar Jawa 3-5 hari kerja. Nomor resi otomatis dapat dilacak langsung di website.'
    },
    {
      q: 'Bagaimana jika ukuran baju yang saya beli tidak pas?',
      a: 'Kami menyediakan fasilitas tukar ukuran dalam waktu 3x24 jam sejak barang diterima sesuai resi Mengantar, selama tag label masih terpasang dan produk belum dicuci.'
    }
  ];

  return (
    <div className="space-y-16 lg:space-y-24">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF7F0] via-white to-white pt-8 pb-12 sm:pt-14 sm:pb-20 border-b border-stone-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Headline Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-semibold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Koleksi Eksklusif Busana Muslimah Indonesia</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.15] text-balance">
                Keanggunan Berbusana <br className="hidden sm:inline" />
                <span className="italic font-normal text-blue-900">Muslimah Modern</span> & Santun.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Koleksi gamis syar'i, dress plisket elegan, mukena sutra armani, dan hijab voal dengan material adem berkualitas tinggi. Didesain untuk kenyamanan ibadah dan keseharian muslimah Indonesia.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
                <button
                  onClick={() => onNavigate('/produk')}
                  className="w-full sm:w-auto px-8 py-3.5 bg-blue-900 hover:bg-slate-900 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Belanja Sekarang</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => onNavigate('/kategori/best-seller')}
                  className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-stone-50 text-slate-800 font-semibold text-sm rounded-xl border border-stone-200 shadow-xs hover:border-stone-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Lihat Best Seller</span>
                </button>
              </div>

              {/* Social Proof Metric in Hero */}
              <div className="pt-4 border-t border-stone-200/80 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0 text-left">
                <div>
                  <div className="font-serif text-2xl font-bold text-slate-900 tabular-nums">45.000+</div>
                  <div className="text-xs text-slate-500 mt-0.5">Muslimah Terlayani</div>
                </div>
                <div>
                  <div className="font-serif text-2xl font-bold text-slate-900 tabular-nums">4.9 / 5.0</div>
                  <div className="text-xs text-slate-500 mt-0.5">Rating Kepuasan</div>
                </div>
                <div>
                  <div className="font-serif text-2xl font-bold text-slate-900 tabular-nums">100%</div>
                  <div className="text-xs text-slate-500 mt-0.5">Bahan Premium</div>
                </div>
              </div>
            </div>

            {/* Right Showcase Visual Column */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md rounded-3xl overflow-hidden border border-stone-200 bg-white p-3 shadow-xl">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-stone-100">
                  <img
                    src={featuredProducts[0]?.images[0] || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="%230F172A"/></svg>'}
                    alt="Saena.id Koleksi Busana Muslim"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent text-white">
                    <p className="text-xs font-medium text-amber-300 tracking-wider uppercase">Highlight Pekan Ini</p>
                    <h3 className="font-serif text-lg font-bold">Ameera Silk Gamis Syar'i</h3>
                    <p className="text-xs text-stone-200 mt-0.5">Mulberry Silk Crepe · Manset Wudhu Friendly</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. CATEGORY TILES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-widest">Katalog Pilihan</p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Kategori Busana Muslim
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/produk')}
            className="text-xs font-semibold text-blue-900 hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Semua Kategori</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <div
              key={cat.slug}
              onClick={() => onNavigate(`/kategori/${cat.slug}`)}
              className="group p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 hover:border-blue-900/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-50/80 px-2 py-0.5 rounded">
                  {cat.tag}
                </span>
                <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900 mt-2 group-hover:text-blue-900 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-snug">{cat.desc}</p>
              </div>
              <div className="mt-4 pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-medium text-slate-700 group-hover:text-blue-900">
                <span>Jelajahi</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS (PRODUK UNGGULAN) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-widest">Pilihan Butik</p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Produk Unggulan Saena
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/produk')}
            className="text-xs font-semibold text-blue-900 hover:underline flex items-center gap-1"
          >
            <span>Lihat Semua Produk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-72 rounded-2xl bg-stone-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onNavigate={onNavigate}
                onAddToCartSuccess={onAddToCartSuccess}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. PROMOTIONAL EDITORIAL BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#0F172A] text-white p-6 sm:p-10 lg:p-12 relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-xl space-y-4">
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-widest">
              Voucher Sambutan Baru
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold leading-tight">
              Kenyamanan Sutra & Voal Halus untuk Keseharian Berkah.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Gunakan kode voucher <strong>SAENABARU</strong> saat checkout untuk potongan harga langsung Rp 30.000 + pengiriman aman ke alamat Anda dengan Mengantar Express.
            </p>
            <div className="pt-2 flex flex-wrap gap-3 items-center">
              <button
                onClick={() => onNavigate('/produk')}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl shadow-md transition-colors"
              >
                Gunakan Voucher Sekarang
              </button>
              <div className="bg-slate-800/80 border border-slate-700 px-3 py-2 rounded-xl text-xs font-mono font-semibold tracking-widest text-amber-300">
                KODE: SAENABARU
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BEST SELLERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-widest">Paling Populer</p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Best Seller Pilihan Pelanggan
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/kategori/best-seller')}
            className="text-xs font-semibold text-blue-900 hover:underline flex items-center gap-1"
          >
            <span>Semua Best Seller</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {bestSellers.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              onNavigate={onNavigate}
              onAddToCartSuccess={onAddToCartSuccess}
            />
          ))}
        </div>
      </section>

      {/* 6. TESTIMONIALS */}
      <section className="bg-stone-50/70 border-y border-stone-200/80 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-widest">Ulasan Pelanggan</p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Kata Mereka Tentang Saena.id
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Kisah nyata dari muslimah di seluruh Indonesia yang telah mempercayakan busana mereka kepada kami.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-3">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed italic">
                    "{t.comment}"
                  </p>
                </div>
                <div className="pt-4 border-t border-stone-100 mt-4">
                  <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.location} · Pembeli {t.product}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FAQ ACCORDION */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-widest">Bantuan Belanja</p>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Pertanyaan yang Sering Diajukan
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-stone-200/80 bg-white overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 font-semibold text-sm text-slate-900 hover:text-blue-900"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-blue-900' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-stone-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
