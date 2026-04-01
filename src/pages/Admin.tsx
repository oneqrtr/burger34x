import React, { useEffect, useState } from 'react';
import { useCMSStore } from '../store/cmsStore';
import { CMSData, Product, BlogPost, AboutStat, SocialLink } from '../types';
import { uploadCMSImage } from '../services/cmsService';
import { Save, Plus, Trash2 } from 'lucide-react';

export const Admin: React.FC = () => {
  const { data, isLoading, fetchData, updateData } = useCMSStore();
  const [localData, setLocalData] = useState<CMSData | null>(null);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('admin-auth') === 'ok');
  const [uploadingProductId, setUploadingProductId] = useState<string | null>(null);
  const [uploadingBlogId, setUploadingBlogId] = useState<string | null>(null);
  const [isUploadingAboutImage, setIsUploadingAboutImage] = useState(false);
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

  const updateAbout = (field: 'title' | 'content' | 'image', value: string) => {
    setLocalData({
      ...localData,
      about: { ...localData.about, [field]: value }
    });
  };

  const updateContact = (field: 'address' | 'email' | 'phone', value: string) => {
    setLocalData({
      ...localData,
      contact: { ...localData.contact, [field]: value }
    });
  };

  const updateUI = (field: 'aboutLabel' | 'newsLabel' | 'blogSectionTitle' | 'footerDescription', value: string) => {
    setLocalData({
      ...localData,
      ui: { ...localData.ui, [field]: value }
    });
  };

  const updateSocialLink = (id: string, field: keyof SocialLink, value: string | boolean) => {
    setLocalData({
      ...localData,
      ui: {
        ...localData.ui,
        socialLinks: localData.ui.socialLinks.map((item) => item.id === id ? { ...item, [field]: value } : item)
      }
    });
  };

  const addSocialLink = () => {
    const newLink: SocialLink = {
      id: Date.now().toString(),
      label: 'Yeni platform',
      url: '',
      enabled: true,
    };
    setLocalData({
      ...localData,
      ui: {
        ...localData.ui,
        socialLinks: [...localData.ui.socialLinks, newLink]
      }
    });
  };

  const removeSocialLink = (id: string) => {
    setLocalData({
      ...localData,
      ui: {
        ...localData.ui,
        socialLinks: localData.ui.socialLinks.filter((item) => item.id !== id)
      }
    });
  };

  const updateAboutStat = (index: number, field: keyof AboutStat, value: string) => {
    const nextStats = localData.about.stats.map((stat, i) =>
      i === index ? { ...stat, [field]: value } : stat
    );
    setLocalData({
      ...localData,
      about: { ...localData.about, stats: nextStats }
    });
  };

  const addAboutStat = () => {
    setLocalData({
      ...localData,
      about: {
        ...localData.about,
        stats: [...localData.about.stats, { label: 'Yeni istatistik', value: '0' }]
      }
    });
  };

  const removeAboutStat = (index: number) => {
    setLocalData({
      ...localData,
      about: {
        ...localData.about,
        stats: localData.about.stats.filter((_, i) => i !== index)
      }
    });
  };

  const updateBlogPost = (id: string, field: keyof BlogPost, value: string) => {
    setLocalData({
      ...localData,
      blog: localData.blog.map(post => post.id === id ? { ...post, [field]: value } : post)
    });
  };

  const addBlogPost = () => {
    const newPost: BlogPost = {
      id: Date.now().toString(),
      title: 'Yeni blog yazisi',
      excerpt: 'Kisa ozet metni',
      image: '',
      category: 'Genel',
    };
    setLocalData({
      ...localData,
      blog: [...localData.blog, newPost]
    });
  };

  const removeBlogPost = (id: string) => {
    setLocalData({
      ...localData,
      blog: localData.blog.filter(post => post.id !== id)
    });
  };

  const handleAboutImageUpload = async (file: File) => {
    setIsUploadingAboutImage(true);
    try {
      const imageUrl = await uploadCMSImage(file);
      updateAbout('image', imageUrl);
    } catch (error) {
      alert('Gorsel yuklenemedi.');
    } finally {
      setIsUploadingAboutImage(false);
    }
  };

  const handleBlogImageUpload = async (blogId: string, file: File) => {
    setUploadingBlogId(blogId);
    try {
      const imageUrl = await uploadCMSImage(file);
      updateBlogPost(blogId, 'image', imageUrl);
    } catch (error) {
      alert('Gorsel yuklenemedi.');
    } finally {
      setUploadingBlogId(null);
    }
  };

  const handleProductImageUpload = async (productId: string, file: File) => {
    setUploadingProductId(productId);
    try {
      const imageUrl = await uploadCMSImage(file);
      updateProduct(productId, 'image', imageUrl);
    } catch (error) {
      alert('Gorsel yuklenemedi.');
    } finally {
      setUploadingProductId(null);
    }
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
        <div className="flex items-center gap-4">
          <img
            src="/logo_final_vectorized.png"
            alt="Burger34"
            className="h-12 w-auto"
          />
          <h1 className="text-4xl font-black">Yönetim paneli</h1>
        </div>
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
                    <div className="col-span-2 space-y-2">
                      <label className="text-xs uppercase tracking-widest text-orange-accent font-bold">Gorsel yukle</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleProductImageUpload(product.id, file);
                        }}
                        className="w-full bg-white/5 border-none rounded-lg px-4 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-burgundy file:px-3 file:py-1 file:text-xs file:font-bold file:text-white"
                      />
                      <p className="text-xs text-white/60 break-all">
                        {uploadingProductId === product.id ? 'Yukleniyor...' : (product.image || 'Henuz gorsel secilmedi.')}
                      </p>
                    </div>
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
        {activeTab === 'about' && (
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-orange-accent font-bold">Baslik</label>
              <input
                type="text"
                value={localData.about.title}
                onChange={(e) => updateAbout('title', e.target.value)}
                className="w-full bg-dark-bg border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-accent"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-orange-accent font-bold">Icerik</label>
              <textarea
                value={localData.about.content}
                onChange={(e) => updateAbout('content', e.target.value)}
                className="w-full bg-dark-bg border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-accent h-40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-orange-accent font-bold">Hakkimizda gorseli yukle</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAboutImageUpload(file);
                }}
                className="w-full bg-white/5 border-none rounded-lg px-4 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-burgundy file:px-3 file:py-1 file:text-xs file:font-bold file:text-white"
              />
              <p className="text-xs text-white/60 break-all">
                {isUploadingAboutImage ? 'Yukleniyor...' : (localData.about.image || 'Mevcut gorsel korunuyor.')}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Istatistikler</h3>
                <button
                  onClick={addAboutStat}
                  className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
                >
                  <Plus className="w-4 h-4" /> Istatistik ekle
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {localData.about.stats.map((stat, index) => (
                  <div key={`${stat.label}-${index}`} className="bg-dark-bg p-4 rounded-xl border border-white/5 grid grid-cols-12 gap-3 items-center">
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => updateAboutStat(index, 'label', e.target.value)}
                      placeholder="Etiket"
                      className="col-span-5 bg-white/5 border-none rounded-lg px-4 py-2 text-sm"
                    />
                    <input
                      type="text"
                      value={stat.value}
                      onChange={(e) => updateAboutStat(index, 'value', e.target.value)}
                      placeholder="Deger"
                      className="col-span-5 bg-white/5 border-none rounded-lg px-4 py-2 text-sm"
                    />
                    <button
                      onClick={() => removeAboutStat(index)}
                      className="col-span-2 p-2 text-white/20 hover:text-red-400 transition-colors justify-self-end"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 border-t border-white/10 pt-6">
              <h3 className="text-xl font-bold">Footer ve baslik metinleri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={localData.ui.aboutLabel}
                  onChange={(e) => updateUI('aboutLabel', e.target.value)}
                  placeholder="Hakkimizda etiketi"
                  className="bg-white/5 border-none rounded-lg px-4 py-2 text-sm"
                />
                <input
                  type="text"
                  value={localData.ui.newsLabel}
                  onChange={(e) => updateUI('newsLabel', e.target.value)}
                  placeholder="Haberler etiketi"
                  className="bg-white/5 border-none rounded-lg px-4 py-2 text-sm"
                />
                <input
                  type="text"
                  value={localData.ui.blogSectionTitle}
                  onChange={(e) => updateUI('blogSectionTitle', e.target.value)}
                  placeholder="Gece notlari basligi"
                  className="bg-white/5 border-none rounded-lg px-4 py-2 text-sm md:col-span-2"
                />
              </div>
              <textarea
                value={localData.ui.footerDescription}
                onChange={(e) => updateUI('footerDescription', e.target.value)}
                placeholder="Footer aciklama metni"
                className="w-full bg-white/5 border-none rounded-lg px-4 py-2 text-sm h-24"
              />
            </div>

            <div className="space-y-4 border-t border-white/10 pt-6">
              <h3 className="text-xl font-bold">Iletisim</h3>
              <div className="grid grid-cols-1 gap-4">
                <input
                  type="text"
                  value={localData.contact.address}
                  onChange={(e) => updateContact('address', e.target.value)}
                  placeholder="Adres"
                  className="bg-white/5 border-none rounded-lg px-4 py-2 text-sm"
                />
                <input
                  type="email"
                  value={localData.contact.email}
                  onChange={(e) => updateContact('email', e.target.value)}
                  placeholder="E-posta"
                  className="bg-white/5 border-none rounded-lg px-4 py-2 text-sm"
                />
                <input
                  type="text"
                  value={localData.contact.phone}
                  onChange={(e) => updateContact('phone', e.target.value)}
                  placeholder="Telefon"
                  className="bg-white/5 border-none rounded-lg px-4 py-2 text-sm"
                />
              </div>
            </div>

            <div className="space-y-4 border-t border-white/10 pt-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Sosyal linkler</h3>
                <button
                  onClick={addSocialLink}
                  className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
                >
                  <Plus className="w-4 h-4" /> Link ekle
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {localData.ui.socialLinks.map((social) => (
                  <div key={social.id} className="bg-dark-bg p-4 rounded-xl border border-white/5 grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-1 flex justify-center">
                      <input
                        type="checkbox"
                        checked={social.enabled}
                        onChange={(e) => updateSocialLink(social.id, 'enabled', e.target.checked)}
                        className="rounded bg-white/5 border-white/10 text-burgundy"
                      />
                    </div>
                    <input
                      type="text"
                      value={social.label}
                      onChange={(e) => updateSocialLink(social.id, 'label', e.target.value)}
                      placeholder="Platform"
                      className="col-span-4 bg-white/5 border-none rounded-lg px-4 py-2 text-sm"
                    />
                    <input
                      type="text"
                      value={social.url}
                      onChange={(e) => updateSocialLink(social.id, 'url', e.target.value)}
                      placeholder="Link URL"
                      className="col-span-6 bg-white/5 border-none rounded-lg px-4 py-2 text-sm"
                    />
                    <button
                      onClick={() => removeSocialLink(social.id)}
                      className="col-span-1 p-2 text-white/20 hover:text-red-400 transition-colors justify-self-end"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'blog' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Blog yazilari</h3>
              <button
                onClick={addBlogPost}
                className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" /> Yazi ekle
              </button>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {localData.blog.map((post) => (
                <div key={post.id} className="bg-dark-bg p-6 rounded-xl border border-white/5 grid grid-cols-1 gap-4">
                  <input
                    type="text"
                    value={post.title}
                    onChange={(e) => updateBlogPost(post.id, 'title', e.target.value)}
                    placeholder="Baslik"
                    className="bg-white/5 border-none rounded-lg px-4 py-2 text-sm"
                  />
                  <textarea
                    value={post.excerpt}
                    onChange={(e) => updateBlogPost(post.id, 'excerpt', e.target.value)}
                    placeholder="Ozet"
                    className="bg-white/5 border-none rounded-lg px-4 py-2 text-sm h-24"
                  />
                  <input
                    type="text"
                    value={post.category}
                    onChange={(e) => updateBlogPost(post.id, 'category', e.target.value)}
                    placeholder="Kategori"
                    className="bg-white/5 border-none rounded-lg px-4 py-2 text-sm"
                  />
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-orange-accent font-bold">Gorsel yukle</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleBlogImageUpload(post.id, file);
                      }}
                      className="w-full bg-white/5 border-none rounded-lg px-4 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-burgundy file:px-3 file:py-1 file:text-xs file:font-bold file:text-white"
                    />
                    <p className="text-xs text-white/60 break-all">
                      {uploadingBlogId === post.id ? 'Yukleniyor...' : (post.image || 'Mevcut gorsel korunuyor.')}
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => removeBlogPost(post.id)}
                      className="p-2 text-white/20 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
