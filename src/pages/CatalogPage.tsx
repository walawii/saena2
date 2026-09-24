import React, { useState, useEffect } from 'react';
import { Filter, SlidersHorizontal, ArrowUpDown, X, Check } from 'lucide-react';
import { Product } from '../types';
import { api } from '../services/api';
import { ProductCard } from '../components/product/ProductCard';

interface CatalogPageProps {
  initialCategory?: string;
  searchQuery?: string;
  onNavigate: (path: string) => void;
  onAddToCartSuccess: (message: string) => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  initialCategory,
  searchQuery,
  onNavigate,
  onAddToCartSuccess
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('newest');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const res = await api.getProducts({
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          search: searchQuery || undefined,
          size: selectedSize || undefined,
          sort: sortOption
        });
        setProducts(res.data);
      } catch (err) {
        console.error('Failed to fetch catalog:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [selectedCategory, searchQuery, selectedSize, sortOption]);

  const categoryList = [
    { slug: 'all', label: 'Semua Koleksi' },
    { slug: 'gamis', label: 'Gamis Syar\'i' },
    { slug: 'dress-muslim', label: 'Dress Muslim' },
    { slug: 'mukena', label: 'Mukena Silk' },
    { slug: 'hijab', label: 'Hijab & Voal' },
    { slug: 'daster', label: 'Daster Chic' },
    { slug: 'setelan', label: 'Setelan Tunic' },
    { slug: 'anak', label: 'Busana Anak' },
    { slug: 'best-seller', label: 'Best Seller' },
  ];

  const sizeList = ['S', 'M', 'L', 'XL', 'XXL', 'All Size'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Catalog Header */}
      <div className="border-b border-stone-200 pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
            <button onClick={() => onNavigate('/')} className="hover:underline">Beranda</button>
            <span>/</span>
            <span className="text-slate-900 font-medium">Katalog Produk</span>
            {searchQuery && (
              <>
                <span>/</span>
                <span className="text-blue-900">Hasil: "{searchQuery}"</span>
              </>
            )}
          </nav>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 capitalize">
            {selectedCategory === 'all'
              ? 'Seluruh Koleksi Saena.id'
              : selectedCategory === 'best-seller'
              ? 'Koleksi Best Seller'
              : `Koleksi ${selectedCategory.replace(/-/g, ' ')}`}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Menampilkan {products.length} model busana muslimah pilihan berkualitas butik
          </p>
        </div>

        {/* Sorting Dropdown & Mobile Filter Button */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-slate-700 hover:bg-stone-50"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filter</span>
          </button>

          {/* Sort Select */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 hidden sm:inline">Urutkan:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-900 cursor-pointer"
            >
              <option value="newest">Terbaru</option>
              <option value="best-seller">Paling Populer</option>
              <option value="price-asc">Harga: Rendah ke Tinggi</option>
              <option value="price-desc">Harga: Tinggi ke Rendah</option>
              <option value="rating">Rating Tertinggi</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Left Sidebar Filter */}
        <aside className="hidden lg:block space-y-6 pr-4 border-r border-stone-100">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Kategori
            </h3>
            <div className="space-y-1">
              {categoryList.map((cat) => {
                const isSelected = selectedCategory === cat.slug;
                return (
                  <button
                    key={cat.slug}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900 font-bold'
                        : 'text-slate-600 hover:bg-stone-50 hover:text-slate-900'
                    }`}
                  >
                    <span>{cat.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-900" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Pilihan Ukuran
            </h3>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedSize('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  selectedSize === ''
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-stone-200 hover:border-stone-400'
                }`}
              >
                Semua
              </button>
              {sizeList.map((size) => {
                const isSelected = selectedSize === size;
                return (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(isSelected ? '' : size)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200">
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-1">
              <p className="font-semibold">Bebas Ongkir Pengiriman</p>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Gunakan kupon <strong>SAENABARU</strong> saat checkout untuk diskon spesial.
              </p>
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-72 rounded-2xl bg-stone-100 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-300 p-8">
              <p className="font-serif text-xl font-bold text-slate-800">Produk Tidak Ditemukan</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Maaf, tidak ada produk yang cocok dengan filter atau kata kunci pencarian Anda. Silakan coba kategori lain.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedSize('');
                }}
                className="mt-4 px-4 py-2 bg-blue-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-900"
              >
                Reset Semua Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onNavigate={onNavigate}
                  onAddToCartSuccess={onAddToCartSuccess}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileFilterOpen(false)} />
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white p-5 shadow-2xl flex flex-col z-10">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-serif text-lg font-bold text-slate-900">Filter Katalog</h3>
              <button onClick={() => setMobileFilterOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-6">
              <div>
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Kategori</p>
                <div className="space-y-1">
                  {categoryList.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => {
                        setSelectedCategory(cat.slug);
                        setMobileFilterOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                        selectedCategory === cat.slug ? 'bg-blue-50 text-blue-900 font-bold' : 'text-slate-600'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Ukuran</p>
                <div className="flex flex-wrap gap-1.5">
                  {sizeList.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                        selectedSize === size ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200">
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-3 bg-blue-900 text-white text-xs font-semibold rounded-xl"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
