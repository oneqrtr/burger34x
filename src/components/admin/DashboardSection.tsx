import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DailyDeliveryReport, DashboardStats } from '../../types';
import { formatTry } from '../../utils/formatPrice';
import { addDays, formatPanelDate, startOfLocalDay } from '../../utils/orderDate';
import { paymentMethodLabel } from '../../utils/orderStatus';

interface DashboardSectionProps {
  stats: DashboardStats | null;
  dailyReport: DailyDeliveryReport | null;
  selectedDay: Date;
  onDayChange: (day: Date) => void;
  loading: boolean;
  dailyLoading: boolean;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  stats,
  dailyReport,
  selectedDay,
  onDayChange,
  loading,
  dailyLoading,
}) => {
  if (loading && !stats) {
    return <p className="text-white/60">Dashboard yükleniyor…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-widest text-white/40">Tüm zamanlar — teslim</p>
          <p className="text-3xl font-black mt-2">{stats?.allTimeOrderCount ?? 0}</p>
          <p className="text-xs text-white/50 mt-1">Teslim edilen siparişler</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-widest text-white/40">Tüm zamanlar — ciro</p>
          <p className="text-3xl font-black mt-2 text-orange-accent">{formatTry(stats?.allTimeRevenue ?? 0)}</p>
          <p className="text-xs text-white/50 mt-1">Teslim edilen siparişlerden</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-black mb-3">Gün sonu teslimat özeti</h3>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 mb-4">
          <button
            type="button"
            onClick={() => onDayChange(addDays(selectedDay, -1))}
            className="p-2 rounded-lg hover:bg-white/10"
            aria-label="Önceki gün"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <p className="font-black text-center">{formatPanelDate(selectedDay)}</p>
          <button
            type="button"
            onClick={() => onDayChange(addDays(selectedDay, 1))}
            className="p-2 rounded-lg hover:bg-white/10"
            aria-label="Sonraki gün"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {dailyLoading ? (
          <p className="text-sm text-white/50">Günlük rapor yükleniyor…</p>
        ) : !dailyReport || dailyReport.deliveryCount === 0 ? (
          <p className="text-sm text-white/50 rounded-xl border border-white/10 bg-white/5 p-4">
            Bu gün teslim edilen sipariş yok.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-[10px] uppercase text-white/40">Teslimat</p>
                <p className="text-xl font-black">{dailyReport.deliveryCount}</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-[10px] uppercase text-white/40">Ciro</p>
                <p className="text-xl font-black text-orange-accent">{formatTry(dailyReport.totalRevenue)}</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-[10px] uppercase text-white/40">Nakit</p>
                <p className="text-xl font-black">{formatTry(dailyReport.cashTotal)}</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-[10px] uppercase text-white/40">Kapıda kart</p>
                <p className="text-xl font-black">{formatTry(dailyReport.cardTotal)}</p>
              </div>
            </div>

            {dailyReport.paymentMismatchCount > 0 ? (
              <p className="text-xs text-orange-accent bg-orange-accent/10 border border-orange-accent/20 rounded-lg px-3 py-2">
                {dailyReport.paymentMismatchCount} siparişte sipariş ödemesi ile teslimde alınan ödeme farklı.
              </p>
            ) : null}

            {dailyReport.byCourier.length > 0 ? (
              <div>
                <p className="text-sm font-bold mb-2">Kurye bazında</p>
                <div className="space-y-2">
                  {dailyReport.byCourier.map((c) => (
                    <div key={c.courierId} className="flex justify-between items-center rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                      <div>
                        <p className="font-bold">{c.courierName}</p>
                        <p className="text-xs text-white/50">{c.courierPhone} · {c.deliveryCount} teslimat</p>
                      </div>
                      <div className="text-right text-xs">
                        <p className="font-black text-orange-accent">{formatTry(c.totalRevenue)}</p>
                        <p className="text-white/50">{c.cashCount} nakit · {c.cardCount} kart</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {dailyReport.deliveries.length > 0 ? (
              <div>
                <p className="text-sm font-bold mb-2">Teslimat detayı</p>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {dailyReport.deliveries.map((d) => (
                    <div key={d.orderId} className="text-xs rounded-lg bg-white/5 px-3 py-2 flex justify-between gap-2">
                      <span>#{d.orderNo} {d.customerName} · {d.courierName}</span>
                      <span className="shrink-0 text-white/60">
                        {paymentMethodLabel(d.actualPaymentMethod)} · {formatTry(d.totalAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-black mb-3">Son 12 ay özeti</h3>
        <div className="space-y-2">
          {!stats || stats.monthly.length === 0 ? (
            <p className="text-sm text-white/50">Henüz aylık veri yok.</p>
          ) : (
            stats.monthly.map((m) => (
              <div
                key={`${m.year}-${m.month}`}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div>
                  <p className="font-bold capitalize">{m.label.trim()}</p>
                  <p className="text-xs text-white/50">{m.orderCount} teslimat</p>
                </div>
                <p className="font-black text-orange-accent">{formatTry(m.revenue)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
