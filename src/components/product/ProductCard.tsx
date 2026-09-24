import React, { useState } from 'react';
import { Heart, Star, ShoppingBag } from 'lucide-react';
import { Product } from '../../types';
import { cartStorage } from '../../services/cartStorage';

interface ProductCardProps {
  product: Product;
  onNavigate: (path: string) => void;
  onAddToCartSuccess?: (message: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onNavigate,
  onAddToCartSuccess
}) => {
  const [isWishlisted, setIsWishlisted] = useState(() => cartStorage.isInWishlist(product.id));

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const added = cartStorage.toggleWishlist(product);
    setIsWishlisted(added);
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const defaultVariant = product.variants[0] || {
      id: `${product.id}-default`,
      sku: product.sku,
      colorName: product.colors[0]?.name || 'Standard',
      colorHex: product.colors[0]?.hex || '#000000',
      size: (product.sizes[0] || 'All Size') as any,
      stock: product.stock
    };

    cartStorage.addItem(product, defaultVariant, 1);
    if (onAddToCartSuccess) {
      onAddToCartSuccess(`Berhasil menambahkan ${product.name} ke keranjang!`);
    }
  };

  const displayPrice = product.discountPrice || product.price;
  const hasDiscount = Boolean(product.discountPrice && product.discountPrice < product.price);
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;

  return (
    <div
      onClick={() => onNavigate(`/produk/${product.slug}`)}
      className="group relative bg-white rounded-2xl border border-stone-200/70 overflow-hidden hover:border-stone-300 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col"
    >
      {/* Image Area */}
      <div className="relative aspect-[4/5] sm:aspect-[3/4] bg-stone-100 overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-300"
          loading="lazy"
        />

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-xs text-slate-600 hover:text-rose-600 hover:bg-white shadow-sm transition-all z-10"
          title={isWishlisted ? 'Hapus dari Favorit' : 'Simpan ke Favorit'}
          aria-label="Wishlist"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-600'
            }`}
          />
        </button>

        {/* Discount & Stock indicator (Quiet single tag, no badge sandwich) */}
        {hasDiscount && (
          <div className="absolute top-3 left-3 bg-amber-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded shadow-sm">
            Hemat {discountPercent}%
          </div>
        )}

        {/* Quick Add Overlay on Hover for Desktop */}
        <div className="hidden lg:flex absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handleQuickAdd}
            className="w-full bg-slate-900/95 hover:bg-blue-900 text-white text-xs font-semibold py-2.5 px-4 rounded-xl backdrop-blur-xs flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>+ Keranjang Cepat</span>
          </button>
        </div>
      </div>

      {/* Info Area */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Unboxed Metadata: Category & Sizes */}
          <div className="text-[11px] text-slate-500 tracking-wide flex items-center gap-1.5 mb-1 truncate">
            <span>{product.categoryName || product.category}</span>
            <span aria-hidden="true">·</span>
            <span>{product.sizes.join(', ')}</span>
          </div>

          {/* Product Name */}
          <h3 className="font-sans text-sm font-semibold text-slate-900 line-clamp-1 group-hover:text-blue-900 transition-colors">
            {product.name}
          </h3>
        </div>

        {/* Price & Rating Row */}
        <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-baseline justify-between">
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 text-[15px] tabular-nums">
              Rp {displayPrice.toLocaleString('id-ID')}
            </span>
            {hasDiscount && (
              <span className="text-[11px] text-slate-400 line-through tabular-nums">
                Rp {product.price.toLocaleString('id-ID')}
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 text-xs text-slate-600 tabular-nums">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-medium text-slate-800">{product.rating}</span>
            <span className="text-slate-400 text-[11px]">({product.reviewCount})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
