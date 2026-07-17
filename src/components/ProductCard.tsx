import React from 'react';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { Product } from '../types';
import { useCartStore } from '../store/cartStore';
import { useShopStatusStore } from '../store/shopStatusStore';
import { formatTry } from '../utils/formatPrice';
import { publicAssetUrl } from '../utils/publicAssetUrl';
import { productHasImage } from '../utils/productImage';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const addItem = useCartStore(state => state.addItem);
  const deliveryOpen = useShopStatusStore((s) => s.deliveryOpen);
  const hasImage = productHasImage(product.image);

  if (!hasImage) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="group rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col sm:flex-row sm:items-center gap-4"
      >
        <div className="flex-grow min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-lg font-bold">{product.name}</h3>
            <span className="bg-black/40 text-orange-accent px-2.5 py-0.5 rounded-full text-xs font-bold">
              {formatTry(product.price)}
            </span>
            {product.isBestSeller ? (
              <span className="bg-burgundy text-white px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                Çok satan
              </span>
            ) : null}
          </div>
          <p className="text-white/60 text-sm leading-relaxed line-clamp-2">{product.description}</p>
        </div>
        {deliveryOpen ? (
          <button
            onClick={() => addItem(product)}
            className="shrink-0 bg-white/5 hover:bg-burgundy text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Sepete ekle
          </button>
        ) : null}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group flex flex-col space-y-4"
    >
      <div className="aspect-[4/5] overflow-hidden rounded-xl bg-white/5 relative">
        <img
          src={publicAssetUrl(product.image.trim())}
          alt={product.name}
          className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
        />
        <div className="absolute top-4 right-4">
          <span className="bg-black/40 backdrop-blur-md text-orange-accent px-3 py-1 rounded-full text-xs font-bold tracking-widest">
            {formatTry(product.price)}
          </span>
        </div>
        {product.isBestSeller && (
          <div className="absolute top-4 left-4">
            <span className="bg-burgundy text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              Çok satan
            </span>
          </div>
        )}
      </div>
      <div className="px-2">
        <h3 className="text-2xl font-bold mb-2">{product.name}</h3>
        <p className="text-white/60 text-sm leading-relaxed mb-6 line-clamp-2">
          {product.description}
        </p>
        {deliveryOpen ? (
          <button
            onClick={() => addItem(product)}
            className="w-full bg-white/5 hover:bg-burgundy text-white py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 group/btn"
          >
            <Plus className="w-5 h-5 group-hover/btn:rotate-90 transition-transform" />
            Sepete ekle
          </button>
        ) : null}
      </div>
    </motion.div>
  );
};
