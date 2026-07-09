import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { AdminOrder, Courier, OrderPaymentMethod } from '../../types';
import { paymentMethodLabel } from '../../utils/orderStatus';

interface DeliverOrderModalProps {
  order: AdminOrder;
  couriers: Courier[];
  onClose: () => void;
  onComplete: (courierId: string, actualPayment: OrderPaymentMethod) => Promise<void>;
}

export const DeliverOrderModal: React.FC<DeliverOrderModalProps> = ({
  order,
  couriers,
  onClose,
  onComplete,
}) => {
  const activeCouriers = couriers.filter((c) => c.isActive);
  const [courierId, setCourierId] = useState(activeCouriers[0]?.id || '');
  const [actualPayment, setActualPayment] = useState<OrderPaymentMethod>(order.paymentMethod);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courierId) {
      setError('Kurye seçin.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onComplete(courierId, actualPayment);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-dark-bg p-6 shadow-2xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-black">Teslim et</h3>
            <p className="text-sm text-white/60">#{order.orderNo} • {order.customerName}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-white/10" aria-label="Kapat">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-white/70 mb-4 rounded-lg bg-white/5 px-3 py-2">
          Siparişte seçilen ödeme: <strong>{paymentMethodLabel(order.paymentMethod)}</strong>
        </p>

        {activeCouriers.length === 0 ? (
          <p className="text-orange-accent text-sm mb-4">
            Aktif kurye yok. Ayarlar bölümünden kurye ekleyin.
          </p>
        ) : null}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label className="text-xs text-white/50 block mb-1">Kurye</label>
            <select
              value={courierId}
              onChange={(e) => setCourierId(e.target.value)}
              className="w-full bg-dark-bg border border-white/10 rounded-xl px-4 py-3 text-sm"
              required
            >
              <option value="">Kurye seçin</option>
              {activeCouriers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} — {c.phone}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-white/50 block mb-2">Gerçekte alınan ödeme</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActualPayment('cash')}
                className={`rounded-xl px-3 py-3 text-xs font-bold ${actualPayment === 'cash' ? 'bg-burgundy text-white' : 'bg-white/10 text-white/70'}`}
              >
                Nakit
              </button>
              <button
                type="button"
                onClick={() => setActualPayment('card_on_delivery')}
                className={`rounded-xl px-3 py-3 text-xs font-bold ${actualPayment === 'card_on_delivery' ? 'bg-burgundy text-white' : 'bg-white/10 text-white/70'}`}
              >
                Kapıda kart
              </button>
            </div>
          </div>

          {actualPayment !== order.paymentMethod ? (
            <p className="text-xs text-orange-accent bg-orange-accent/10 border border-orange-accent/20 rounded-lg px-3 py-2">
              Müşteri farklı ödeme seçmişti; teslimde farklı ödeme alındı olarak kaydedilecek.
            </p>
          ) : null}

          {error ? <p className="text-red-400 text-xs">{error}</p> : null}

          <button
            type="submit"
            disabled={saving || activeCouriers.length === 0}
            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white py-3 rounded-xl font-bold"
          >
            {saving ? 'Kaydediliyor…' : 'Teslim edildi olarak kaydet'}
          </button>
        </form>
      </div>
    </div>
  );
};
