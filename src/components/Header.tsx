import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { Link } from 'react-router-dom';
import { useCMSStore } from '../store/cmsStore';
import { fallbackCmsData } from '../constants/fallbackCmsData';
import { publicAssetUrl } from '../utils/publicAssetUrl';

export const Header: React.FC = () => {
  const setIsCartOpen = useCartStore(state => state.setIsOpen);
  const cartItemsCount = useCartStore(state => state.items.reduce((acc, item) => acc + item.quantity, 0));
  const { data, fetchData } = useCMSStore();
  const cmsData = data ?? fallbackCmsData;

  React.useEffect(() => {
    if (!data) fetchData();
  }, [data, fetchData]);

  return (
    <header className="fixed top-0 w-full z-50 bg-dark-bg/60 backdrop-blur-xl flex justify-between items-center px-8 py-4">
      <Link to="/" className="flex items-center gap-3">
        <img
          src={publicAssetUrl('/logo_final_vectorized.png')}
          alt="Burger34"
          className="h-10 w-auto"
        />
      </Link>
      
      <nav className="hidden md:flex items-center gap-8">
        <Link to="/menu" className="text-cream hover:text-orange-accent transition-colors font-bold tracking-tight">Menü</Link>
        <Link to="/about" className="text-cream hover:text-orange-accent transition-colors font-bold tracking-tight">{cmsData.ui.aboutLabel}</Link>
        <Link to="/news" className="text-cream hover:text-orange-accent transition-colors font-bold tracking-tight">{cmsData.ui.newsLabel}</Link>
      </nav>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsCartOpen(true)}
          className="relative p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Sepeti aç"
        >
          <ShoppingCart className="w-6 h-6" />
          {cartItemsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-orange-accent text-dark-bg text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full">
              {cartItemsCount}
            </span>
          )}
        </button>
        <Link 
          to="/menu"
          className="bg-burgundy text-white px-6 py-2 rounded-xl font-bold text-sm tracking-tight hover:bg-burgundy/80 transition-all active:scale-95"
        >
          Sipariş ver
        </Link>
      </div>
    </header>
  );
};
