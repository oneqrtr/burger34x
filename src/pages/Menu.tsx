import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCMSStore } from '../store/cmsStore';
import { ProductCard } from '../components/ProductCard';
import { fallbackCmsData } from '../constants/fallbackCmsData';

export const Menu: React.FC = () => {
  const { data, isLoading, fetchData } = useCMSStore();
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const cmsData = data ?? fallbackCmsData;

  const filteredProducts = activeCategory === 'all' 
    ? cmsData.products 
    : cmsData.products.filter(p => p.categoryId === activeCategory);

  return (
    <div className="pt-32 pb-24 px-8 max-w-7xl mx-auto">
      <div className="mb-16 text-center">
        <h1 className="text-6xl font-black tracking-tighter mb-4">Menü</h1>
        <p className="text-orange-accent tracking-[0.3em] uppercase text-sm">Gece lezzetleri</p>
      </div>

      {/* Category Filter */}
      <div className="flex justify-center gap-4 mb-16 overflow-x-auto no-scrollbar pb-4">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-8 py-2 rounded-full font-bold transition-all whitespace-nowrap ${
            activeCategory === 'all' ? 'bg-burgundy text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          Tümü
        </button>
        {cmsData.categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-8 py-2 rounded-full font-bold transition-all whitespace-nowrap ${
              activeCategory === cat.id ? 'bg-burgundy text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </AnimatePresence>
      </div>
      {isLoading && (
        <p className="mt-8 text-center text-sm text-white/50">Icerik guncelleniyor...</p>
      )}
    </div>
  );
};
