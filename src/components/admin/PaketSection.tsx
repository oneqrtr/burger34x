import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, PackageCheck } from 'lucide-react';
import type { AdminOrder, Courier } from '../../types';
import { formatTry } from '../../utils/formatPrice';
import {
  addDays,
  formatPanelDate,
  isSameLocalDay,
  isSameLocalDayFromIso,
  startOfLocalDay,
} from '../../utils/orderDate';
import { formatOrderDateLabel, formatOrderTime } from './orderFormat';
import { hasPaymentMismatch, orderStatusLabel, paymentMethodLabel } from '../../utils/orderStatus';
import { OrderDetailModal } from './OrderDetailModal';
import { DeliverOrderModal } from './DeliverOrderModal';

interface PaketSectionProps {
  orders: AdminOrder[];
  couriers: Courier[];
  onRefresh: () => Promise<void>;
  onDeliver: (orderId: string, courierId: string, actualPayment: AdminOrder['paymentMethod']) => Promise<void>;
}

type PaketTab = 'pending' | 'completed';

export const PaketSection: React.FC<PaketSectionProps> = ({
  orders,
  couriers,
  onRefresh,
  onDeliver,
}) => {
  const [selectedDay, setSelectedDay] = useState(() => startOfLocalDay(new Date()));
  const [tab, setTab] = useState<PaketTab>('pending');
  const [detailOrder, setDetailOrder] = useState<AdminOrder | null>(null);
  const [deliverOrder, setDeliverOrder] = useState<AdminOrder | null>(null);

  const pendingOrders = useMemo(
    () =>
      orders.filter(
        (o) => o.status === 'preparing' && isSameLocalDay(o.createdAt, selectedDay),
      ),
    [orders, selectedDay],
  );

  const completedOrders = useMemo(
    () =>
      orders.filter(
        (o) => o.status === 'delivered' && isSameLocalDayFromIso(o.deliveredAt, selectedDay),
      ),
    [orders, selectedDay],
  );

  const visibleOrders = tab === 'pending' ? pendingOrders : completedOrders;

  const handleDeliver = async (courierId: string, actualPayment: AdminOrder['paymentMethod']) => {
    if (!deliverOrder) return;
    await onDeliver(deliverOrder.id, courierId, actualPayment);
    setDeliverOrder(null);
    await onRefresh();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black">Paket</h2>
        <p className="text-sm text-white/50 mt-1">Onaylanan siparişlerin teslim takibi</p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <button
          type="button"
          onClick={() => setSelectedDay((d) => addDays(d, -1))}
          className="p-2 rounded-lg hover:bg-white/10"
          aria-label="Önceki gün"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="font-black">{formatPanelDate(selectedDay)}</p>
          <p className="text-xs text-white/50">
            {pendingOrders.length} hazırlanıyor · {completedOrders.length} teslim edildi
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSelectedDay((d) => addDays(d, 1))}
          className="p-2 rounded-lg hover:bg-white/10"
          aria-label="Sonraki gün"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('pending')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold ${tab === 'pending' ? 'bg-burgundy text-white' : 'bg-white/10 text-white/70'}`}
        >
          Hazırlanıyor ({pendingOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('completed')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold ${tab === 'completed' ? 'bg-burgundy text-white' : 'bg-white/10 text-white/70'}`}
        >
          Teslim edildi ({completedOrders.length})
        </button>
      </div>

      {visibleOrders.length === 0 ? (
        <p className="text-white/50 text-sm rounded-xl border border-white/10 bg-white/5 p-6 text-center">
          {tab === 'pending' ? 'Bu gün için bekleyen paket yok.' : 'Bu gün teslim edilen paket yok.'}
        </p>
      ) : (
        <div className="space-y-3">
          {visibleOrders.map((order) => {
            const mismatch = hasPaymentMismatch(order.paymentMethod, order.actualPaymentMethod);
            const courierName = order.courierFirstName
              ? `${order.courierFirstName} ${order.courierLastName || ''}`.trim()
              : null;

            return (
              <div
                key={order.id}
                className={`rounded-xl border p-4 ${
                  mismatch ? 'border-orange-accent/40 bg-orange-accent/5' : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="font-black">#{order.orderNo} • {order.customerName}</p>
                    <p className="text-xs text-white/60">{order.phone}</p>
                    <p className="text-xs text-white/40 mt-1">
                      {tab === 'completed' && order.deliveredAt
                        ? formatOrderDateLabel(order.deliveredAt)
                        : formatOrderDateLabel(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-green-400 block mb-1">
                      {orderStatusLabel(order.status)}
                    </span>
                    <span className="text-sm font-black text-orange-accent">{formatTry(order.totalAmount)}</span>
                  </div>
                </div>

                <p className="text-xs text-white/60 mt-2">
                  Sipariş ödemesi: {paymentMethodLabel(order.paymentMethod)}
                </p>
                {tab === 'completed' && order.actualPaymentMethod ? (
                  <p className="text-xs text-white/60">
                    Teslimde alınan: {paymentMethodLabel(order.actualPaymentMethod)}
                    {courierName ? ` · Kurye: ${courierName}` : ''}
                  </p>
                ) : null}
                {mismatch ? (
                  <p className="text-[11px] text-orange-accent mt-1">Ödeme yöntemi farklı kaydedildi</p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailOrder(order)}
                    className="px-3 py-2 text-xs rounded-lg bg-white/10 hover:bg-white/20 flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" /> Görüntüle
                  </button>
                  {tab === 'pending' ? (
                    <button
                      type="button"
                      onClick={() => setDeliverOrder(order)}
                      className="px-3 py-2 text-xs rounded-lg bg-green-600/70 hover:bg-green-600 flex items-center gap-1"
                    >
                      <PackageCheck className="w-3 h-3" /> Teslim et
                    </button>
                  ) : null}
                </div>
                <p className="text-[11px] text-white/40 mt-2">
                  {order.items.length} kalem · {formatOrderTime(order.createdAt)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {detailOrder ? (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          readOnly
        />
      ) : null}

      {deliverOrder ? (
        <DeliverOrderModal
          order={deliverOrder}
          couriers={couriers}
          onClose={() => setDeliverOrder(null)}
          onComplete={handleDeliver}
        />
      ) : null}
    </div>
  );
};
