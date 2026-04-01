import React, { useEffect, useState } from 'react';
import { useCMSStore } from '../store/cmsStore';
import { CMSData, Product, Category, BlogPost } from '../types';
import { Save, Plus, Trash2, Edit2, Check, X } from 'lucide-react';

export const Admin: React.FC = () => {
  const { data, isLoading, fetchData, updateData } = useCMSStore();
  const [localData, setLocalData] = useState<CMSData | null>(null);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('admin-auth') === 'ok');
  const [activeTab, setActiveTab] = useState<'hero' | 'menu' | 'blog' | 'about'>('hero');

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated, fetchData]);

  useEffect(() => {
    if (data) setLocalData(JSON.parse(JSON.stringify(data)));
  }, [data]);

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

  const handleLogout = () => {
    sessionStorage.removeItem('admin-auth');
    setIsAuthenticated(false);
    setPassword('');
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
            <button
              type="submit"
              className="w-full bg-burgundy text-white px-6 py-3 rounded-xl font-bold hover:bg-burgundy/80 transition-all"
            >
              Giriş Yap
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isLoading || !localData) return <div className="h-screen flex items-center justify-center">Yönetim yükleniyor…</div>;

  const handleSave = async () => {
    await updateData(localData);
    alert('İçerik kaydedildi.');
  };

  const updateHero = (field: string, value: string) => {
    setLocalData({
      ...localData,
      hero: { ...localData.hero, [field]: value }
    });
  };

  const addProduct = () => {
    const newProduct: Product = {
      id: Date.now().toString(),
      categoryId: localData.categories[0]?.id || 'burgers',
      name: 'Yeni ürün',
      description: 'Ürün açıklaması',
      price: 0,
      image: '',
      isBestSeller: false
    };
    setLocalData({
      ...localData,
      products: [...localData.products, newProduct]
    });
  };

  const removeProduct = (id: string) => {
    setLocalData({
      ...localData,
      products: localData.products.filter(p => p.id !== id)
    });
  };

  const updateProduct = (id: string, field: keyof Product, value: any) => {
    setLocalData({
      ...localData,
      products: localData.products.map(p => p.id === id ? { ...p, [field]: value } : p)
    });
  };

  const tabLabels: Record<'hero' | 'menu' | 'blog' | 'about', string> = {
    hero: 'Ana görsel',
    menu: 'Menü',
    blog: 'Blog',
    about: 'Hakkımızda',
  };

  return (
    <div className="pt-32 pb-24 px-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-black">Yönetim paneli</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="bg-burgundy text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-burgundy/80 transition-all"
          >
            <Save className="w-5 h-5" /> Kaydet
          </button>
          <button
            onClick={handleLogout}
            className="bg-white/10 text-white px-5 py-3 rounded-xl font-bold hover:bg-white/20 transition-all"
          >
            Çıkış
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-12 border-b border-white/10">
        {(['hero', 'menu', 'blog', 'about'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-4 font-bold uppercase tracking-widest text-sm transition-all border-b-2 ${
              activeTab === tab ? 'border-orange-accent text-orange-accent' : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      <div className="bg-white/5 rounded-2xl p-8">
        {activeTab === 'hero' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-orange-accent font-bold">Ana başlık</label>
              <input 
                type="text" 
                value={localData.hero.title}
                onChange={(e) => updateHero('title', e.target.value)}
                className="w-full bg-dark-bg border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-accent"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-orange-accent font-bold">Alt başlık</label>
              <input 
                type="text" 
                value={localData.hero.subtitle}
                onChange={(e) => updateHero('subtitle', e.target.value)}
                className="w-full bg-dark-bg border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-accent"
              />
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Ürünler</h3>
              <button 
                onClick={addProduct}
                className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" /> Ürün ekle
              </button>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {localData.products.map(product => (
                <div key={product.id} className="bg-dark-bg p-6 rounded-xl border border-white/5 flex gap-6 items-start">
                  <div className="w-32 h-32 rounded-lg overflow-hidden bg-white/5 shrink-0">
                    <img src={product.image || 'https://via.placeholder.com/150'} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow grid grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      value={product.name}
                      placeholder="Ürün adı"
                      onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                      className="bg-white/5 border-none rounded-lg px-4 py-2 text-sm"
                    />
                    <input 
                      type="number" 
                      value={product.price}
                      placeholder="Fiyat"
                      onChange={(e) => updateProduct(product.id, 'price', parseFloat(e.target.value))}
                      className="bg-white/5 border-none rounded-lg px-4 py-2 text-sm"
                    />
                    <select 
                      value={product.categoryId}
                      onChange={(e) => updateProduct(product.id, 'categoryId', e.target.value)}
                      className="bg-white/5 border-none rounded-lg px-4 py-2 text-sm"
                    >
                      {localData.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={product.isBestSeller}
                        onChange={(e) => updateProduct(product.id, 'isBestSeller', e.target.checked)}
                        className="rounded bg-white/5 border-white/10 text-burgundy"
                      />
                      <label className="text-xs">Çok satan</label>
                    </div>
                    <textarea 
                      value={product.description}
                      placeholder="Açıklama"
                      onChange={(e) => updateProduct(product.id, 'description', e.target.value)}
                      className="col-span-2 bg-white/5 border-none rounded-lg px-4 py-2 text-sm h-20"
                    />
                    <input 
                      type="text" 
                      value={product.image}
                      placeholder="Görsel URL"
                      onChange={(e) => updateProduct(product.id, 'image', e.target.value)}
                      className="col-span-2 bg-white/5 border-none rounded-lg px-4 py-2 text-sm"
                    />
                  </div>
                  <button 
                    onClick={() => removeProduct(product.id)}
                    className="p-2 text-white/20 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Blog and About tabs would follow similar patterns */}
        {(activeTab === 'blog' || activeTab === 'about') && (
          <div className="text-center py-12 opacity-40 italic">
            {activeTab === 'blog' ? 'Blog' : 'Hakkımızda'} düzenlemesi bu sürümde yakında eklenecek.
          </div>
        )}
      </div>
    </div>
  );
};
