import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Save, Plus, Trash2, Bell, Settings, UtensilsCrossed, ClipboardList, Printer, Ban, Eye } from 'lucide-react';
import { useCMSStore } from '../store/cmsStore';
import { Category, CMSData, Product, AdminOrder, PanelSettings } from '../types';
import { uploadCMSImage } from '../services/cmsService';
import { fetchAdminOrders, fetchPanelSettings, markOrdersSeen, savePanelSettings, setOrderStatus } from '../services/orderService';
import { publicAssetUrl } from '../utils/publicAssetUrl';
import { formatTry } from '../utils/formatPrice';
import { getSupabaseBrowserClient } from '../lib/supabaseClient';

type PanelSection = 'orders' | 'menu' | 'settings';

function printOrderTicket(order: AdminOrder): void {
  const popup = window.open('', '_blank', 'width=480,height=800');
  if (!popup) return;

  const lines = order.items
    .map((i) => `<li>${i.name} x ${i.quantity} — ${formatTry(i.quantity * i.unitPrice)}</li>`)
    .join('');
  const address = `${order.address.neighborhood}, ${order.address.street} No:${order.address.apartmentNo || '-'} ${order.address.buildingName || ''}`;

  popup.document.write(`
    <html><body style="font-family: monospace; padding: 16px;">
    <h2>Burger34 Sipariş #${order.orderNo}</h2>
    <p><strong>Ad:</strong> ${order.customerName}</p>
    <p><strong>Tel:</strong> ${order.phone}</p>
    <p><strong>Ödeme:</strong> ${order.paymentMethod === 'cash' ? 'Nakit' : 'Kapıda Kredi Kartı'}</p>
    <p><strong>Adres:</strong><br/>${address}<br/>${order.address.description || ''}</p>
    ${order.address.locationUrl ? `<p><strong>Konum:</strong><br/>${order.address.locationUrl}</p>` : ''}
    <hr/>
    <ul>${lines}</ul>
    <hr/>
    <p><strong>Toplam:</strong> ${formatTry(order.totalAmount)}</p>
    </body></html>
  `);
  popup.document.close();
  popup.focus();
  popup.print();
}

function playBeepOnce(): void {
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = 920;
  gain.gain.value = 0.07;
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.2);
}

export const Admin: React.FC = () => {
  const { data, isLoading, fetchData, updateData } = useCMSStore();
  const [localData, setLocalData] = useState<CMSData | null>(null);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('admin-auth') === 'ok');
  const [uploadingProductId, setUploadingProductId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<PanelSection>('orders');
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [settingsData, setSettingsData] = useState<PanelSettings>({
    notificationSoundEnabled: true,
    autoPrintNewOrder: false,
  });
  const beepIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchData();
      void fetchAdminOrders().then(setOrders).catch(() => undefined);
      void fetchPanelSettings().then(setSettingsData).catch(() => undefined);
    }
  }, [isAuthenticated, fetchData]);

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
        const latest = await fetchAdminOrders().catch(() => null);
        if (!latest) return;
        setOrders(latest);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isAuthenticated]);

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
  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) || null,
    [orders, selectedOrderId],
  );

  useEffect(() => {
    if (!settingsData.notificationSoundEnabled || unseenOrders.length === 0) {
      if (beepIntervalRef.current) {
        window.clearInterval(beepIntervalRef.current);
        beepIntervalRef.current = null;
      }
      return;
    }

    if (!beepIntervalRef.current) {
      playBeepOnce();
      beepIntervalRef.current = window.setInterval(playBeepOnce, 1800);
    }
  }, [settingsData.notificationSoundEnabled, unseenOrders.length]);

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

  const updateOrderAndRefresh = async (orderId: string, status: 'preparing' | 'cancelled') => {
    await setOrderStatus(orderId, status);
    const next = await fetchAdminOrders();
    setOrders(next);
  };

  const openOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    const target = orders.find((o) => o.id === orderId);
    if (!target || target.seenByAdmin) return;
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, seenByAdmin: true } : o)));
    void markOrdersSeen([orderId]).catch(() => undefined);
  };

  return (
    <div className="pt-20 min-h-screen">
      <div className="grid grid-cols-12 min-h-[calc(100vh-5rem)]">
        <aside className="col-span-12 md:col-span-3 border-r border-white/10 bg-black/20 p-4 flex flex-col">
          <button
            onClick={() => setActiveSection('orders')}
            className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-left font-bold mb-2 ${activeSection === 'orders' ? 'bg-burgundy text-white' : 'bg-white/5 text-white/70'}`}
          >
            <span className="flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Siparişler</span>
            {unseenOrders.length > 0 ? <span className="bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">{unseenOrders.length}</span> : null}
          </button>
          <button
            onClick={() => setActiveSection('menu')}
            className={`w-full flex items-center gap-2 rounded-xl px-4 py-3 text-left font-bold mb-2 ${activeSection === 'menu' ? 'bg-burgundy text-white' : 'bg-white/5 text-white/70'}`}
          >
            <UtensilsCrossed className="w-4 h-4" /> Menü Yönetimi
          </button>
          <div className="mt-auto">
            <button
              onClick={() => setActiveSection('settings')}
              className={`w-full flex items-center gap-2 rounded-xl px-4 py-3 text-left font-bold ${activeSection === 'settings' ? 'bg-burgundy text-white' : 'bg-white/5 text-white/70'}`}
            >
              <Settings className="w-4 h-4" /> Ayarlar
            </button>
          </div>
        </aside>

        <main className="col-span-12 md:col-span-9 p-6 md:p-8">
          {activeSection === 'orders' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-black">#{order.orderNo} • {order.customerName}</p>
                        <p className="text-xs text-white/60">{order.phone}</p>
                      </div>
                      <span className={`text-xs font-bold uppercase ${order.status === 'new' ? 'text-orange-accent' : order.status === 'preparing' ? 'text-green-400' : 'text-red-400'}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => openOrder(order.id)} className="px-3 py-2 text-xs rounded-lg bg-white/10 hover:bg-white/20 flex items-center gap-1"><Eye className="w-3 h-3" /> Görüntüle</button>
                      <button onClick={() => void updateOrderAndRefresh(order.id, 'preparing')} className="px-3 py-2 text-xs rounded-lg bg-green-600/70 hover:bg-green-600 flex items-center gap-1"><Printer className="w-3 h-3" /> Yazdır</button>
                      <button onClick={() => void updateOrderAndRefresh(order.id, 'cancelled')} className="px-3 py-2 text-xs rounded-lg bg-red-600/70 hover:bg-red-600 flex items-center gap-1"><Ban className="w-3 h-3" /> İptal</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-5 min-h-[260px]">
                {selectedOrder ? (
                  <>
                    <h3 className="text-xl font-black mb-2">Sipariş #{selectedOrder.orderNo}</h3>
                    <p className="text-sm text-white/70">{selectedOrder.customerName} • {selectedOrder.phone}</p>
                    <p className="text-sm text-white/70 mt-2">
                      {selectedOrder.address.neighborhood}, {selectedOrder.address.street} No:{selectedOrder.address.apartmentNo || '-'} {selectedOrder.address.buildingName || ''}
                    </p>
                    <p className="text-xs text-white/50 mt-1">{selectedOrder.address.description}</p>
                    {selectedOrder.address.locationUrl ? (
                      <a href={selectedOrder.address.locationUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-accent">
                        Google Maps konumu aç
                      </a>
                    ) : null}
                    <ul className="mt-4 space-y-2 text-sm">
                      {selectedOrder.items.map((i) => (
                        <li key={`${i.productId}-${i.name}`} className="flex justify-between">
                          <span>{i.name} x {i.quantity}</span>
                          <span>{formatTry(i.quantity * i.unitPrice)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-orange-accent font-black">Toplam: {formatTry(selectedOrder.totalAmount)}</p>
                    <button
                      onClick={() => printOrderTicket(selectedOrder)}
                      className="mt-4 px-4 py-2 rounded-lg bg-burgundy hover:bg-burgundy/80 font-bold text-sm"
                    >
                      Yazdır
                    </button>
                  </>
                ) : (
                  <p className="text-white/60">Sipariş detayını görmek için soldan bir sipariş seçin.</p>
                )}
              </div>
            </div>
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
                            e.target.value
                              .split(',')
                              .map((x) => x.trim())
                              .filter(Boolean),
                          )
                        }
                        placeholder="İçindekiler (virgül ile)"
                        className="col-span-2 bg-white/5 border-none rounded-lg px-4 py-2 text-sm"
                      />
                      <input
                        type="text"
                        value={product.image || ''}
                        onChange={(e) => updateProduct(product.id, 'image', e.target.value)}
                        placeholder="Görsel yolu / URL (örn: /burger/cheeseburger.png)"
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
                        <p className="text-xs text-white/60 mt-1">{uploadingProductId === product.id ? 'Yükleniyor...' : (product.image || 'Görsel yok')}</p>
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
              <label className="flex items-center justify-between rounded-lg bg-dark-bg px-4 py-3">
                <span className="flex items-center gap-2"><Printer className="w-4 h-4" /> Yeni siparişte otomatik yazdır</span>
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
              <p className="text-xs text-white/50">
                Fiş yazdırma işletim sistemi yazıcı penceresiyle tetiklenir. Termal yazıcı varsayılan yazıcı ise doğrudan hızlanır.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
