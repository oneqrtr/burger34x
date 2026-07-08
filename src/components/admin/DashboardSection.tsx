import React from 'react';
import type { DashboardStats } from '../../types';
import { formatTry } from '../../utils/formatPrice';

interface DashboardSectionProps {
  stats: DashboardStats | null;
  loading: boolean;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({ stats, loading }) => {
  if (loading) {
    return <p className="text-white/60">Dashboard yükleniyor…</p>;
  }

  if (!stats) {
    return <p className="text-white/60">Dashboard verisi alınamadı.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-widest text-white/40">Tüm zamanlar — sipariş</p>
          <p className="text-3xl font-black mt-2">{stats.allTimeOrderCount}</p>
          <p className="text-xs text-white/50 mt-1">İptal edilenler hariç</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-widest text-white/40">Tüm zamanlar — ciro</p>
          <p className="text-3xl font-black mt-2 text-orange-accent">{formatTry(stats.allTimeRevenue)}</p>
          <p className="text-xs text-white/50 mt-1">İptal edilenler hariç</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-black mb-3">Son 12 ay özeti</h3>
        <div className="space-y-2">
          {stats.monthly.length === 0 ? (
            <p className="text-sm text-white/50">Henüz aylık veri yok.</p>
          ) : (
            stats.monthly.map((m) => (
              <div
                key={`${m.year}-${m.month}`}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div>
                  <p className="font-bold capitalize">{m.label.trim()}</p>
                  <p className="text-xs text-white/50">{m.orderCount} sipariş</p>
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
