import React, { useState, useEffect } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { Product } from '../../types';
import { api } from '../../services/api';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.getProducts({ search: query.trim() });
        setResults(res.data.slice(0, 5));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const popularSearches = ['Gamis Syar\'i', 'Mukena Silk', 'Daster Chic', 'Voal Hijab', 'Dress Plisket'];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-start bg-black/60 backdrop-blur-xs p-4 sm:p-6 md:p-10 animate-in fade-in duration-150">
      <div className="max-w-2xl w-full mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-stone-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari gamis, mukena, hijab, atau daster..."
            autoFocus
            className="w-full text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-stone-100 text-slate-700 hover:bg-stone-200 transition-colors"
          >
            Tutup
          </button>
        </div>

        {/* Results or Suggestions */}
        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-8 text-center text-sm text-slate-500">Mencari busana...</div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Hasil Pencarian</p>
              {results.map((product) => (
                <div
                  key={product.id}
                  onClick={() => {
                    onNavigate(`/produk/${product.slug}`);
                    onClose();
                  }}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-stone-50 cursor-pointer transition-colors border border-transparent hover:border-stone-200"
                >
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-12 h-14 object-cover rounded-lg bg-stone-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">{product.categoryName}</p>
                    <h4 className="text-sm font-semibold text-slate-900 truncate">{product.name}</h4>
                    <p className="text-xs font-semibold text-slate-900 mt-0.5">
                      Rp {(product.discountPrice || product.price).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              ))}
              <button
                onClick={() => {
                  onNavigate(`/search?q=${encodeURIComponent(query)}`);
                  onClose();
                }}
                className="w-full text-center py-2.5 text-xs font-semibold text-blue-900 hover:underline mt-2"
              >
                Lihat semua hasil untuk "{query}" →
              </button>
            </div>
          ) : query ? (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-slate-700">Tidak ada produk yang cocok dengan "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">Coba gunakan kata kunci lain seperti gamis, hijab, atau mukena.</p>
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Pencarian Populer</p>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setQuery(item);
                    }}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-slate-700 transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
