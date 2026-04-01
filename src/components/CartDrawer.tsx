import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { formatTry } from '../utils/formatPrice';

export const CartDrawer: React.FC = () => {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, totalPrice } = useCartStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full md:w-96 z-[70] bg-dark-bg shadow-2xl flex flex-col p-6 border-l border-white/10"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-widest">Sepetiniz</h2>
                <p className="text-xs text-white/60">Seçtikleriniz</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Kapat"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-grow space-y-6 overflow-y-auto no-scrollbar mb-8">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-40 italic">
                  <ShoppingBag className="w-12 h-12 mb-4" />
                  <p>Sepetiniz henüz boş.</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/5 shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-sm">{item.name}</h3>
                        <span className="text-orange-accent font-bold text-sm">{formatTry(item.price)}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            aria-label="Azalt"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            aria-label="Artır"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-white/40 hover:text-red-400 transition-colors"
                          aria-label="Kaldır"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="space-y-6 pt-6 border-t border-white/10">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-white/60">
                    <span>Ara toplam</span>
                    <span>{formatTry(totalPrice())}</span>
                  </div>
                  <div className="flex justify-between text-lg font-black pt-2 border-t border-white/5">
                    <span>Toplam</span>
                    <span className="text-orange-accent">{formatTry(totalPrice())}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="Ad soyad" 
                    className="w-full bg-white/5 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-accent transition-all placeholder:text-white/20"
                  />
                  <input 
                    type="tel" 
                    placeholder="Telefon" 
                    className="w-full bg-white/5 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-accent transition-all placeholder:text-white/20"
                  />
                  <textarea 
                    placeholder="Teslimat adresi" 
                    rows={2}
                    className="w-full bg-white/5 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-accent transition-all placeholder:text-white/20"
                  />
                </div>

                <button className="w-full bg-burgundy text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-burgundy/80 transition-all active:scale-95">
                  Siparişi tamamla
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
