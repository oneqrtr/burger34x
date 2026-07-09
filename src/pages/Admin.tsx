import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Settings, UtensilsCrossed, ClipboardList, LayoutDashboard, Users, Banknote, LogOut, Package } from 'lucide-react';
import { useCMSStore } from '../store/cmsStore';
import { CMSData, AdminOrder, PanelSettings, CustomerRecord, DashboardStats, NotificationSoundKey, Courier, DailyDeliveryReport } from '../types';
import {
  fetchAdminOrders,
  fetchAdminCustomers,
  fetchDashboardStats,
  fetchDailyDeliveryReport,
  fetchPanelSettings,
  fetchCouriers,
  markOrdersSeen,
  savePanelSettings,
  setOrderStatus,
  completeOrderDelivery,
} from '../services/orderService';
import { getAdminSession, onAdminAuthChange, signInAdmin, signOutAdmin } from '../services/adminAuthService';
import { getSupabaseBrowserClient } from '../lib/supabaseClient';
import { playNotificationSound } from '../utils/orderSounds';
import { OrdersSection } from '../components/admin/OrdersSection';
import { DashboardSection } from '../components/admin/DashboardSection';
import { CustomersSection } from '../components/admin/CustomersSection';
import { MenuManagementSection } from '../components/admin/MenuManagementSection';
import { PricesSection } from '../components/admin/PricesSection';
import { PaketSection } from '../components/admin/PaketSection';
import { CouriersSettingsSection } from '../components/admin/CouriersSettingsSection';
import { toLocalDateIso, startOfLocalDay } from '../utils/orderDate';

type PanelSection = 'dashboard' | 'orders' | 'paket' | 'customers' | 'menu' | 'prices' | 'settings';

const SOUND_OPTIONS: Array<{ key: NotificationSoundKey; label: string }> = [
  { key: 'sound1', label: 'Klasik bip' },
  { key: 'sound2', label: 'Çift bip' },
  { key: 'sound3', label: 'Zil' },
];

export const Admin: React.FC = () => {
  const { data, isLoading, fetchData, updateData } = useCMSStore();
  const [localData, setLocalData] = useState<CMSData | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeSection, setActiveSection] = useState<PanelSection>('orders');
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [dailyReport, setDailyReport] = useState<DailyDeliveryReport | null>(null);
  const [dashboardDay, setDashboardDay] = useState(() => startOfLocalDay(new Date()));
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [settingsData, setSettingsData] = useState<PanelSettings>({
    notificationSoundEnabled: true,
    autoPrintNewOrder: false,
    notificationSoundKey: 'sound1',
  });
  const beepIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getAdminSession().then((session) => {
      if (!cancelled) {
        setIsAuthenticated(Boolean(session));
        setAuthChecking(false);
      }
    });
    const unsubscribe = onAdminAuthChange((signedIn) => {
      setIsAuthenticated(signedIn);
      setAuthChecking(false);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const refreshOrders = useCallback(async () => {
    const next = await fetchAdminOrders();
    setOrders(next);
  }, []);

  const refreshCustomers = useCallback(async () => {
    const next = await fetchAdminCustomers();
    setCustomers(next);
  }, []);

  const refreshCouriers = useCallback(async () => {
    const next = await fetchCouriers();
    setCouriers(next);
  }, []);

  const refreshDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const stats = await fetchDashboardStats();
      setDashboardStats(stats);
    } catch {
      setDashboardStats(null);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  const refreshDailyReport = useCallback(async (day: Date) => {
    setDailyLoading(true);
    try {
      const report = await fetchDailyDeliveryReport(toLocalDateIso(day));
      setDailyReport(report);
    } catch {
      setDailyReport(null);
    } finally {
      setDailyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchData();
    void refreshOrders().catch(() => undefined);
    void refreshCouriers().catch(() => undefined);
    void refreshCustomers().catch(() => undefined);
    void refreshDashboard().catch(() => undefined);
    void refreshDailyReport(dashboardDay).catch(() => undefined);
    void fetchPanelSettings().then(setSettingsData).catch(() => undefined);
  }, [isAuthenticated, fetchData, refreshOrders, refreshCouriers, refreshCustomers, refreshDashboard, refreshDailyReport, dashboardDay]);

  useEffect(() => {
    if (data) setLocalData(JSON.parse(JSON.stringify(data)));
  }, [data]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, async () => {
        await refreshOrders().catch(() => undefined);
        await refreshCustomers().catch(() => undefined);
        await refreshDashboard().catch(() => undefined);
        await refreshDailyReport(dashboardDay).catch(() => undefined);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isAuthenticated, refreshOrders, refreshCustomers, refreshDashboard, refreshDailyReport, dashboardDay]);

  const paketPendingCount = useMemo(
    () => orders.filter((o) => o.status === 'preparing').length,
    [orders],
  );

  const handleDeliverOrder = async (
    orderId: string,
    courierId: string,
    actualPayment: AdminOrder['paymentMethod'],
  ) => {
    await completeOrderDelivery(orderId, courierId, actualPayment);
    await refreshOrders();
    await refreshDashboard();
    await refreshDailyReport(dashboardDay);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInAdmin(email, password);
      setIsAuthenticated(true);
      setPassword('');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Giriş başarısız.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOutAdmin();
    } finally {
      setIsAuthenticated(false);
      setEmail('');
      setPassword('');
    }
  };

  const unseenOrders = useMemo(() => orders.filter((o) => !o.seenByAdmin && o.status === 'new'), [orders]);

  useEffect(() => {
    if (!settingsData.notificationSoundEnabled || unseenOrders.length === 0) {
      if (beepIntervalRef.current) {
        window.clearInterval(beepIntervalRef.current);
        beepIntervalRef.current = null;
      }
      return;
    }

    if (!beepIntervalRef.current) {
      playNotificationSound(settingsData.notificationSoundKey);
      beepIntervalRef.current = window.setInterval(
        () => playNotificationSound(settingsData.notificationSoundKey),
        1800,
      );
    }
  }, [settingsData.notificationSoundEnabled, settingsData.notificationSoundKey, unseenOrders.length]);

  const handleMarkSeen = (orderId: string) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, seenByAdmin: true } : o)));
    void markOrdersSeen([orderId]).catch(() => undefined);
  };

  const handleConfirmOrder = async (orderId: string) => {
    await setOrderStatus(orderId, 'preparing');
    await refreshOrders();
  };

  const handleCancelOrder = async (orderId: string) => {
    await setOrderStatus(orderId, 'cancelled');
    await refreshOrders();
    await refreshDashboard();
  };

  if (authChecking) {
    return <div className="h-screen flex items-center justify-center">Oturum kontrol ediliyor…</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="pt-32 pb-24 px-8 max-w-md mx-auto">
        <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
          <h1 className="text-3xl font-black mb-2">Yönetim girişi</h1>
          <p className="text-white/60 text-sm mb-6">Supabase hesabınızla giriş yapın.</p>
          <form onSubmit={(e) => void handleLogin(e)} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta"
              autoComplete="email"
              required
              className="w-full bg-dark-bg border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-accent"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifre"
              autoComplete="current-password"
              required
              className="w-full bg-dark-bg border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-accent"
            />
            {authError && <p className="text-red-400 text-sm">{authError}</p>}
            <button type="submit" className="w-full bg-burgundy text-white px-6 py-3 rounded-xl font-bold hover:bg-burgundy/80 transition-all">
              Giriş Yap
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isLoading || !localData) {
    return <div className="h-screen flex items-center justify-center">Panel yükleniyor…</div>;
  }

  const navButton = (section: PanelSection, label: React.ReactNode) => (
    <button
      type="button"
      onClick={() => setActiveSection(section)}
      className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-left font-bold mb-2 ${
        activeSection === section ? 'bg-burgundy text-white' : 'bg-white/5 text-white/70'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="pt-20 min-h-screen">
      <div className="grid grid-cols-12 min-h-[calc(100vh-5rem)]">
        <aside className="col-span-12 md:col-span-3 border-r border-white/10 bg-black/20 p-4 flex flex-col md:sticky md:top-20 md:h-[calc(100vh-5rem)]">
          {navButton('dashboard', <span className="flex items-center gap-2"><LayoutDashboard className="w-4 h-4" /> Dashboard</span>)}
          {navButton(
            'orders',
            <>
              <span className="flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Siparişler</span>
              {unseenOrders.length > 0 ? (
                <span className="bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
                  {unseenOrders.length}
                </span>
              ) : null}
            </>,
          )}
          {navButton(
            'paket',
            <>
              <span className="flex items-center gap-2"><Package className="w-4 h-4" /> Paket</span>
              {paketPendingCount > 0 ? (
                <span className="bg-orange-accent text-black text-xs w-6 h-6 rounded-full flex items-center justify-center">
                  {paketPendingCount}
                </span>
              ) : null}
            </>,
          )}
          {navButton('customers', <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Müşteriler</span>)}
          {navButton('menu', <span className="flex items-center gap-2"><UtensilsCrossed className="w-4 h-4" /> Menü Yönetimi</span>)}
          {navButton('prices', <span className="flex items-center gap-2"><Banknote className="w-4 h-4" /> Fiyatlar</span>)}
          <div className="mt-auto space-y-2">
            {navButton('settings', <span className="flex items-center gap-2"><Settings className="w-4 h-4" /> Ayarlar</span>)}
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="w-full flex items-center gap-2 rounded-xl px-4 py-3 text-left font-bold bg-white/5 text-white/70 hover:bg-white/10"
            >
              <LogOut className="w-4 h-4" /> Çıkış
            </button>
          </div>
        </aside>

        <main className="col-span-12 md:col-span-9 p-6 md:p-8">
          {activeSection === 'dashboard' && (
            <DashboardSection
              stats={dashboardStats}
              dailyReport={dailyReport}
              selectedDay={dashboardDay}
              onDayChange={setDashboardDay}
              loading={dashboardLoading}
              dailyLoading={dailyLoading}
            />
          )}

          {activeSection === 'orders' && (
            <OrdersSection
              orders={orders}
              onRefresh={refreshOrders}
              onMarkSeen={handleMarkSeen}
              onConfirmOrder={handleConfirmOrder}
              onCancelOrder={handleCancelOrder}
            />
          )}

          {activeSection === 'paket' && (
            <PaketSection
              orders={orders}
              couriers={couriers}
              onRefresh={refreshOrders}
              onDeliver={handleDeliverOrder}
            />
          )}

          {activeSection === 'customers' && (
            <CustomersSection customers={customers} onRefresh={refreshCustomers} />
          )}

          {activeSection === 'menu' && (
            <MenuManagementSection
              data={localData}
              onChange={setLocalData}
              onSave={updateData}
            />
          )}

          {activeSection === 'prices' && (
            <PricesSection
              data={localData}
              onChange={setLocalData}
              onSave={updateData}
            />
          )}

          {activeSection === 'settings' && (
            <div className="max-w-xl space-y-5">
              <CouriersSettingsSection couriers={couriers} onRefresh={refreshCouriers} />
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-5">
              <h3 className="text-xl font-black">Panel Ayarları</h3>
              <label className="flex items-center justify-between rounded-lg bg-dark-bg px-4 py-3">
                <span className="flex items-center gap-2"><Bell className="w-4 h-4" /> Bildirim sesi</span>
                <input
                  type="checkbox"
                  checked={settingsData.notificationSoundEnabled}
                  onChange={(e) => setSettingsData((s) => ({ ...s, notificationSoundEnabled: e.target.checked }))}
                />
              </label>
              <div className="rounded-lg bg-dark-bg px-4 py-3 space-y-2">
                <p className="text-sm font-bold">Bildirim sesi seçeneği</p>
                {SOUND_OPTIONS.map((opt) => (
                  <label key={opt.key} className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
                    <input
                      type="radio"
                      name="notification-sound"
                      checked={settingsData.notificationSoundKey === opt.key}
                      onChange={() => {
                        setSettingsData((s) => ({ ...s, notificationSoundKey: opt.key }));
                        playNotificationSound(opt.key);
                      }}
                    />
                    {opt.label}
                  </label>
                ))}
                <p className="text-xs text-white/40">MP3 dosyalarını public/sounds/order-1.mp3, order-2.mp3, order-3.mp3 olarak ekleyebilirsiniz.</p>
              </div>
              <label className="flex items-center justify-between rounded-lg bg-dark-bg px-4 py-3">
                <span className="flex items-center gap-2">Yeni siparişte otomatik yazdır</span>
                <input
                  type="checkbox"
                  checked={settingsData.autoPrintNewOrder}
                  onChange={(e) => setSettingsData((s) => ({ ...s, autoPrintNewOrder: e.target.checked }))}
                />
              </label>
              <button
                onClick={() => void savePanelSettings(settingsData).then(() => alert('Ayarlar kaydedildi.'))}
                className="bg-burgundy text-white px-6 py-3 rounded-xl font-bold hover:bg-burgundy/80"
              >
                Ayarları Kaydet
              </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
