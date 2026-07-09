import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, CheckCircle2, Ban } from 'lucide-react';
import type { AdminOrder } from '../../types';
import { formatTry } from '../../utils/formatPrice';
import { addDays, formatPanelDate, isSameLocalDay, startOfLocalDay } from '../../utils/orderDate';
import { formatOrderDateLabel, formatOrderTime } from './orderFormat';
import { orderStatusLabel } from '../../utils/orderStatus';
import { OrderDetailModal } from './OrderDetailModal';
import { CancelOrderModal } from './CancelOrderModal';

interface OrdersSectionProps {
  orders: AdminOrder[];
  onRefresh: () => Promise<void>;
  onMarkSeen: (orderId: string) => void;
  onConfirmOrder: (orderId: string) => Promise<void>;
  onCancelOrder: (orderId: string) => Promise<void>;
}

export const OrdersSection: React.FC<OrdersSectionProps> = ({
  orders,
  onRefresh,
  onMarkSeen,
  onConfirmOrder,
  onCancelOrder,
}) => {
  const [selectedDay, setSelectedDay] = useState(() => startOfLocalDay(new Date()));
  const [detailOrder, setDetailOrder] = useState<AdminOrder | null>(null);
  const [cancelOrder, setCancelOrder] = useState<AdminOrder | null>(null);

  const dayOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          isSameLocalDay(o.createdAt, selectedDay)
          && (o.status === 'new' || o.status === 'cancelled'),
      ),
    [orders, selectedDay],
  );

  const openDetail = (order: AdminOrder) => {
    setDetailOrder(order);
    onMarkSeen(order.id);
  };

  const handleConfirm = async (orderId: string) => {
    await onConfirmOrder(orderId);
    setDetailOrder(null);
    await onRefresh();
  };

  const handleCancel = async (orderId: string) => {
    await onCancelOrder(orderId);
    setCancelOrder(null);
    setDetailOrder(null);
    await onRefresh();
  };

  return (
    <div className="space-y-4">
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
          <p className="text-xs text-white/50">{dayOrders.length} sipariş</p>
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

      {dayOrders.length === 0 ? (
        <p className="text-white/50 text-sm rounded-xl border border-white/10 bg-white/5 p-6 text-center">
          Bu gün için sipariş bulunmuyor.
        </p>
      ) : (
        <div className="space-y-3">
          {dayOrders.map((order) => (
            <div key={order.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <p className="font-black">#{order.orderNo} • {order.customerName}</p>
                  {order.orderSource === 'admin' ? (
                    <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wide bg-orange-accent/20 text-orange-accent px-2 py-0.5 rounded">
                      Paket Siparişi
                    </span>
                  ) : null}
                  <p className="text-xs text-white/60">{order.phone}</p>
                  <p className="text-xs text-white/40 mt-1">{formatOrderDateLabel(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold block mb-1 ${
                    order.status === 'new' ? 'text-orange-accent' : 'text-red-400'
                  }`}>
                    {orderStatusLabel(order.status)}
                  </span>
                  <span className="text-sm font-black text-orange-accent">{formatTry(order.totalAmount)}</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openDetail(order)}
                  className="px-3 py-2 text-xs rounded-lg bg-white/10 hover:bg-white/20 flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" /> Görüntüle
                </button>
                {order.status === 'new' ? (
                  <button
                    type="button"
                    onClick={() => void handleConfirm(order.id)}
                    className="px-3 py-2 text-xs rounded-lg bg-green-600/70 hover:bg-green-600 flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Onayla
                  </button>
                ) : null}
                {order.status !== 'cancelled' ? (
                  <button
                    type="button"
                    onClick={() => setCancelOrder(order)}
                    className="px-3 py-2 text-xs rounded-lg bg-red-600/70 hover:bg-red-600 flex items-center gap-1"
                  >
                    <Ban className="w-3 h-3" /> İptal
                  </button>
                ) : null}
              </div>
              <p className="text-[11px] text-white/40 mt-2">
                {order.items.length} kalem • {formatOrderTime(order.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}

      {detailOrder ? (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          onConfirm={() => void handleConfirm(detailOrder.id)}
        />
      ) : null}

      {cancelOrder ? (
        <CancelOrderModal
          order={cancelOrder}
          onClose={() => setCancelOrder(null)}
          onConfirmCancel={() => void handleCancel(cancelOrder.id)}
        />
      ) : null}
    </div>
  );
};
