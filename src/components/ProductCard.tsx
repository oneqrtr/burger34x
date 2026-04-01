import React from 'react';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { Product } from '../types';
import { useCartStore } from '../store/cartStore';
import { formatTry } from '../utils/formatPrice';
import { PRODUCT_IMAGE_PLACEHOLDER } from '../utils/placeholderImage';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const addItem = useCartStore(state => state.addItem);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group flex flex-col space-y-4"
    >
      <div className="aspect-[4/5] overflow-hidden rounded-xl bg-white/5 relative">
        <img 
          src={product.image?.trim() ? product.image : PRODUCT_IMAGE_PLACEHOLDER} 
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
        <button 
          onClick={() => addItem(product)}
          className="w-full bg-white/5 hover:bg-burgundy text-white py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 group/btn"
        >
          <Plus className="w-5 h-5 group-hover/btn:rotate-90 transition-transform" />
          Sepete ekle
        </button>
      </div>
    </motion.div>
  );
};
