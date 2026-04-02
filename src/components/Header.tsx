import React, { useCallback, useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { Link, useLocation } from 'react-router-dom';
import { useCMSStore } from '../store/cmsStore';
import { fallbackCmsData } from '../constants/fallbackCmsData';
import { publicAssetUrl } from '../utils/publicAssetUrl';
import { HERO_SCROLL_SECTION_VH } from '../constants/heroLayout';

/** Sticky hero görünümü ~100vh; menü hero kaydırması bitince (section sonu) görünür. */
function heroScrollEndThresholdPx(): number {
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  return ((HERO_SCROLL_SECTION_VH - 100) / 100) * vh;
}

export const Header: React.FC = () => {
  const setIsCartOpen = useCartStore(state => state.setIsOpen);
  const cartItemsCount = useCartStore(state => state.items.reduce((acc, item) => acc + item.quantity, 0));
  const { data, fetchData } = useCMSStore();
  const cmsData = data ?? fallbackCmsData;
  const { pathname } = useLocation();
  const pathNorm = pathname.replace(/\/$/, '') || '/';
  const isHome = pathNorm === '/';
  const isAdmin = pathNorm === '/admin';

  const [showHeaderBar, setShowHeaderBar] = useState(() => !isHome || isAdmin);

  const updateHeaderVisibility = useCallback(() => {
    if (!isHome || isAdmin) {
      setShowHeaderBar(true);
      return;
    }
    setShowHeaderBar(window.scrollY >= heroScrollEndThresholdPx() - 1);
  }, [isHome, isAdmin]);

  useEffect(() => {
    if (!data) fetchData();
  }, [data, fetchData]);

  useEffect(() => {
    updateHeaderVisibility();
    if (!isHome || isAdmin) return;
    window.addEventListener('scroll', updateHeaderVisibility, { passive: true });
    window.addEventListener('resize', updateHeaderVisibility);
    return () => {
      window.removeEventListener('scroll', updateHeaderVisibility);
      window.removeEventListener('resize', updateHeaderVisibility);
    };
  }, [isHome, isAdmin, updateHeaderVisibility]);

  const headerShellClass =
    isHome && !isAdmin && !showHeaderBar
      ? '-translate-y-full opacity-0 pointer-events-none'
      : 'translate-y-0 opacity-100';

  return (
    <header
      className={`fixed top-0 w-full z-50 flex justify-between items-center bg-dark-bg/60 px-8 py-4 backdrop-blur-xl transition-[transform,opacity] duration-500 ease-out ${headerShellClass}`}
    >
      <div className="flex items-center gap-4 shrink-0 min-w-0">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <img
            src={publicAssetUrl('/logo_final_vectorized.png')}
            alt="Burger34"
            className="h-10 w-auto"
          />
        </Link>
        {isAdmin ? (
          <span className="font-black text-cream text-lg md:text-xl tracking-tight truncate">
            Yönetim Paneli
          </span>
        ) : null}
      </div>

      {!isAdmin ? (
        <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-8 md:flex">
          <Link to="/menu" className="text-cream hover:text-orange-accent transition-colors font-bold tracking-tight">
            Menü
          </Link>
          <Link to="/#about" className="text-cream hover:text-orange-accent transition-colors font-bold tracking-tight">
            {cmsData.ui.aboutLabel}
          </Link>
        </nav>
      ) : null}

      <div className="flex items-center gap-4 shrink-0">
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Sipariş sepeti"
        >
          <ShoppingCart className="w-6 h-6" />
          {cartItemsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-orange-accent text-dark-bg text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full">
              {cartItemsCount}
            </span>
          )}
        </button>
        {!isAdmin ? (
          <Link
            to="/menu"
            className="bg-burgundy text-white px-6 py-2 rounded-xl font-bold text-sm tracking-tight hover:bg-burgundy/80 transition-all active:scale-95"
          >
            Sipariş ver
          </Link>
        ) : null}
      </div>
    </header>
  );
};
