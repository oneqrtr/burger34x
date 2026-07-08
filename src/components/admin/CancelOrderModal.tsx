import React from 'react';
import { Phone, X } from 'lucide-react';
import type { AdminOrder } from '../../types';

interface CancelOrderModalProps {
  order: AdminOrder;
  onClose: () => void;
  onConfirmCancel: () => void;
}

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({ order, onClose, onConfirmCancel }) => {
  const telHref = `tel:${order.phone.replace(/\s/g, '')}`;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-dark-bg p-6 shadow-2xl">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-black">Siparişi iptal et</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-white/10" aria-label="Kapat">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-white/70 mb-4">
          Sipariş #{order.orderNo} iptal edilecek. Müşteriyi bilgilendirmek ister misiniz?
        </p>

        <div className="rounded-xl bg-white/5 p-4 mb-5 text-sm space-y-1">
          <p><strong>Ad Soyad:</strong> {order.customerName}</p>
          <p><strong>Telefon:</strong> {order.phone}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <a
            href={telHref}
            className="flex-1 px-4 py-3 rounded-xl bg-orange-accent/20 text-orange-accent hover:bg-orange-accent/30 text-sm font-bold flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4" /> Müşteriyi ara
          </a>
          <button
            type="button"
            onClick={onConfirmCancel}
            className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-bold"
          >
            İptal et
          </button>
        </div>
        <button type="button" onClick={onClose} className="w-full mt-2 px-4 py-2 text-sm text-white/50 hover:text-white/80">
          Vazgeç
        </button>
      </div>
    </div>
  );
};
