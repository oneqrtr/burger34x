import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Save, Plus, Trash2, Bell, Settings, UtensilsCrossed, ClipboardList, LayoutDashboard, Users } from 'lucide-react';
import { useCMSStore } from '../store/cmsStore';
import { Category, CMSData, Product, AdminOrder, PanelSettings, CustomerRecord, DashboardStats, NotificationSoundKey } from '../types';
import { uploadCMSImage } from '../services/cmsService';
import {
  fetchAdminOrders,
  fetchAdminCustomers,
  fetchDashboardStats,
  fetchPanelSettings,
  markOrdersSeen,
  savePanelSettings,
  setOrderStatus,
} from '../services/orderService';
import { publicAssetUrl } from '../utils/publicAssetUrl';
import { getSupabaseBrowserClient } from '../lib/supabaseClient';
import { playNotificationSound } from '../utils/orderSounds';
import { OrdersSection } from '../components/admin/OrdersSection';
import { DashboardSection } from '../components/admin/DashboardSection';
import { CustomersSection } from '../components/admin/CustomersSection';

type PanelSection = 'dashboard' | 'orders' | 'customers' | 'menu' | 'settings';

const SOUND_OPTIONS: Array<{ key: NotificationSoundKey; label: string }> = [
  { key: 'sound1', label: 'Klasik bip' },
  { key: 'sound2', label: 'Çift bip' },
  { key: 'sound3', label: 'Zil' },
];

export const Admin: React.FC = () => {
  const { data, isLoading, fetchData, updateData } = useCMSStore();
  const [localData, setLocalData] = useState<CMSData | null>(null);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('admin-auth') === 'ok');
  const [uploadingProductId, setUploadingProductId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<PanelSection>('orders');
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [settingsData, setSettingsData] = useState<PanelSettings>({
    notificationSoundEnabled: true,
    autoPrintNewOrder: false,
    notificationSoundKey: 'sound1',
  });
  const beepIntervalRef = useRef<number | null>(null);

  const refreshOrders = useCallback(async () => {
    const next = await fetchAdminOrders();
    setOrders(next);
  }, []);

  const refreshCustomers = useCallback(async () => {
    const next = await fetchAdminCustomers();
    setCustomers(next);
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

  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchData();
    void refreshOrders().catch(() => undefined);
    void refreshCustomers().catch(() => undefined);
    void refreshDashboard().catch(() => undefined);
    void fetchPanelSettings().then(setSettingsData).catch(() => undefined);
  }, [isAuthenticated, fetchData, refreshOrders, refreshCustomers, refreshDashboard]);

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
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isAuthenticated, refreshOrders, refreshDashboard]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '131094') {
      sessionStorage.setItem('admin-auth', 'ok');
      setIsAuthenticated(true);
      setAuthError('');
      return;
    }
    setAuthError('Şifre hatalı.');
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

  if (!isAuthenticated) {
    return (
      <div className="pt-32 pb-24 px-8 max-w-md mx-auto">
        <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
          <h1 className="text-3xl font-black mb-2">Yönetim girişi</h1>
          <p className="text-white/60 text-sm mb-6">Admin paneline erişmek için şifre girin.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifre"
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

  const updateProduct = (id: string, field: keyof Product, value: string | number | boolean | string[]) => {
    setLocalData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        products: prev.products.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
      };
    });
  };

  const handleProductImageUpload = async (productId: string, file: File) => {
    setUploadingProductId(productId);
    try {
      const imageUrl = await uploadCMSImage(file);
      updateProduct(productId, 'image', imageUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Görsel yükleme başarısız.';
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('Dosya okunamadı.'));
          reader.readAsDataURL(file);
        });
        updateProduct(productId, 'image', dataUrl);
        alert(
          `${message}\n\nStorage yükleme başarısız olduğu için görsel geçici olarak data URL ile eklendi. Kaydet dersen menü içinde çalışır.`,
        );
      } catch {
        alert(`${message}\n\nNot: Canlıda yükleme için Supabase Storage bucket ve policy tanımlı olmalı.`);
      }
    } finally {
      setUploadingProductId(null);
    }
  };

  const saveMenu = async () => {
    const ok = await updateData(localData);
    alert(ok ? 'Menü kaydedildi.' : 'Kayıt başarısız.');
  };

  const addCategory = () => {
    setLocalData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        categories: [...prev.categories, { id: `cat-${Date.now()}`, name: 'Yeni kategori' }],
      };
    });
  };

  const updateCategory = (id: string, field: keyof Category, value: string) => {
    setLocalData((prev) => {
      if (!prev) return prev;
      const normalized = field === 'id' ? value.trim().toLowerCase().replace(/\s+/g, '-') : value;
      const nextCategories = prev.categories.map((c) => (c.id === id ? { ...c, [field]: normalized } : c));
      const nextProducts =
        field === 'id'
          ? prev.products.map((p) => (p.categoryId === id ? { ...p, categoryId: normalized } : p))
          : prev.products;
      return { ...prev, categories: nextCategories, products: nextProducts };
    });
  };

  const removeCategory = (id: string) => {
    setLocalData((prev) => {
      if (!prev) return prev;
      const fallback = prev.categories.find((c) => c.id !== id)?.id;
      if (!fallback) return prev;
      return {
        ...prev,
        categories: prev.categories.filter((c) => c.id !== id),
        products: prev.products.map((p) => (p.categoryId === id ? { ...p, categoryId: fallback } : p)),
      };
    });
  };

  const addProduct = () => {
    setLocalData((prev) => {
      if (!prev || prev.categories.length === 0) return prev;
      const newProduct: Product = {
        id: Date.now().toString(),
        categoryId: prev.categories[0].id,
        name: 'Yeni ürün',
        description: '',
        price: 0,
        image: '',
        isBestSeller: false,
      };
      return { ...prev, products: [...prev.products, newProduct] };
    });
  };

  const removeProduct = (id: string) => {
    setLocalData((prev) => {
      if (!prev) return prev;
      return { ...prev, products: prev.products.filter((p) => p.id !== id) };
    });
  };

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
          {navButton('customers', <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Müşteriler</span>)}
          {navButton('menu', <span className="flex items-center gap-2"><UtensilsCrossed className="w-4 h-4" /> Menü Yönetimi</span>)}
          <div className="mt-auto">
            {navButton('settings', <span className="flex items-center gap-2"><Settings className="w-4 h-4" /> Ayarlar</span>)}
          </div>
        </aside>

        <main className="col-span-12 md:col-span-9 p-6 md:p-8">
          {activeSection === 'dashboard' && (
            <DashboardSection stats={dashboardStats} loading={dashboardLoading} />
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

          {activeSection === 'customers' && (
            <CustomersSection customers={customers} onRefresh={refreshCustomers} />
          )}

          {activeSection === 'menu' && (
            <div className="space-y-6">
              <div className="sticky top-20 z-20 border-b border-white/10 bg-dark-bg/90 pb-4">
                <button onClick={saveMenu} className="bg-burgundy text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-burgundy/80 transition-all">
                  <Save className="w-5 h-5" /> Kaydet
                </button>
              </div>

              <div className="space-y-4 border-b border-white/10 pb-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">Kategoriler</h3>
                  <button onClick={addCategory} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all">
                    <Plus className="w-4 h-4" /> Kategori ekle
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {localData.categories.map((category) => (
                    <div key={category.id} className="bg-dark-bg p-4 rounded-xl border border-white/5 grid grid-cols-12 gap-3 items-center">
                      <input type="text" value={category.id} onChange={(e) => updateCategory(category.id, 'id', e.target.value)} className="col-span-5 bg-white/5 border-none rounded-lg px-4 py-2 text-sm" />
                      <input type="text" value={category.name} onChange={(e) => updateCategory(category.id, 'name', e.target.value)} className="col-span-6 bg-white/5 border-none rounded-lg px-4 py-2 text-sm" />
                      <button onClick={() => removeCategory(category.id)} className="col-span-1 p-2 text-white/20 hover:text-red-400 transition-colors justify-self-end"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Ürünler</h3>
                <button onClick={addProduct} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all">
                  <Plus className="w-4 h-4" /> Ürün ekle
                </button>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {localData.products.map((product) => (
                  <div key={product.id} className="bg-dark-bg p-6 rounded-xl border border-white/5 flex gap-6 items-start">
                    <div className="w-28 h-28 rounded-lg overflow-hidden bg-white/5 shrink-0">
                      <img src={product.image ? publicAssetUrl(product.image) : 'https://via.placeholder.com/150'} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow grid grid-cols-2 gap-4">
                      <input type="text" value={product.name} onChange={(e) => updateProduct(product.id, 'name', e.target.value)} className="bg-white/5 border-none rounded-lg px-4 py-2 text-sm" />
                      <input type="number" value={product.price} onChange={(e) => updateProduct(product.id, 'price', Number(e.target.value) || 0)} className="bg-white/5 border-none rounded-lg px-4 py-2 text-sm" />
                      <select value={product.categoryId} onChange={(e) => updateProduct(product.id, 'categoryId', e.target.value)} className="bg-white/5 border-none rounded-lg px-4 py-2 text-sm">
                        {localData.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <label className="flex items-center gap-2 text-xs">
                        <input type="checkbox" checked={product.isBestSeller} onChange={(e) => updateProduct(product.id, 'isBestSeller', e.target.checked)} />
                        Çok satan
                      </label>
                      <textarea value={product.description} onChange={(e) => updateProduct(product.id, 'description', e.target.value)} className="col-span-2 bg-white/5 border-none rounded-lg px-4 py-2 text-sm h-20" />
                      <input
                        type="text"
                        value={(product.ingredients || []).join(', ')}
                        onChange={(e) =>
                          updateProduct(
                            product.id,
                            'ingredients',
                            e.target.value.split(',').map((x) => x.trim()).filter(Boolean),
                          )
                        }
                        placeholder="İçindekiler (virgül ile)"
                        className="col-span-2 bg-white/5 border-none rounded-lg px-4 py-2 text-sm"
                      />
                      <input
                        type="text"
                        value={product.image || ''}
                        onChange={(e) => updateProduct(product.id, 'image', e.target.value)}
                        onBlur={(e) => {
                          const raw = e.target.value.trim();
                          if (!raw) return;
                          if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/')) return;
                          updateProduct(product.id, 'image', `/${raw}`);
                        }}
                        placeholder="Görsel yolu / URL"
                        className="col-span-2 bg-white/5 border-none rounded-lg px-4 py-2 text-sm"
                      />
                      <div className="col-span-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void handleProductImageUpload(product.id, file);
                          }}
                          className="w-full bg-white/5 border-none rounded-lg px-4 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-burgundy file:px-3 file:py-1 file:text-xs file:font-bold file:text-white"
                        />
                        <p className="text-xs text-white/60 mt-1">{uploadingProductId === product.id ? 'Yükleniyor...' : (product.image ? 'Görsel tanımlı' : 'Görsel yok')}</p>
                      </div>
                    </div>
                    <button onClick={() => removeProduct(product.id)} className="p-2 text-white/20 hover:text-red-400 transition-colors"><Trash2 className="w-5 h-5" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="max-w-xl rounded-xl border border-white/10 bg-white/5 p-6 space-y-5">
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
          )}
        </main>
      </div>
    </div>
  );
};
