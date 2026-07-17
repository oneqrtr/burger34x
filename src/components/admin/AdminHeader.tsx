import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { publicAssetUrl } from '../../utils/publicAssetUrl';
import { useAdminCartStore } from '../../store/adminCartStore';

interface AdminHeaderProps {
  deliveryOpen: boolean;
  deliveryToggling?: boolean;
  onDeliveryToggle: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  deliveryOpen,
  deliveryToggling = false,
  onDeliveryToggle,
}) => {
  const setAdminCartOpen = useAdminCartStore((s) => s.setIsOpen);
  const adminCartCount = useAdminCartStore((s) =>
    s.items.reduce((acc, item) => acc + item.quantity, 0),
  );

  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center bg-dark-bg/90 px-8 py-4 backdrop-blur-xl border-b border-white/10">
      <div className="flex items-center gap-4 shrink-0 min-w-0">
        <Link to="/admin" className="flex items-center gap-3 shrink-0">
          <img
            src={publicAssetUrl('/logo_final_vectorized.png')}
            alt="Burger34"
            className="h-10 w-auto"
          />
        </Link>
        <span className="font-black text-cream text-lg md:text-xl tracking-tight truncate">
          Burger34 Restoran Paneli
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
          <span className="text-xs font-bold text-white/70 hidden sm:inline">Paket Servisi</span>
          <button
            type="button"
            role="switch"
            aria-checked={deliveryOpen}
            aria-label="Paket servisi aç/kapa"
            disabled={deliveryToggling}
            onClick={onDeliveryToggle}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
              deliveryOpen ? 'bg-emerald-500' : 'bg-white/20'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                deliveryOpen ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span
            className={`text-[10px] font-black uppercase tracking-wider ${
              deliveryOpen ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {deliveryOpen ? 'Açık' : 'Kapalı'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setAdminCartOpen(true)}
          className="relative p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Paket siparişi"
        >
          <ShoppingCart className="w-6 h-6" />
          {adminCartCount > 0 ? (
            <span className="absolute -top-1 -right-1 bg-orange-accent text-dark-bg text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full">
              {adminCartCount}
            </span>
          ) : null}
        </button>
      </div>
    </header>
  );
};
