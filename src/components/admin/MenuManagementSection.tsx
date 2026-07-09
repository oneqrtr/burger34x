import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import type { Category, CMSData, Product } from '../../types';
import { uploadCMSImage } from '../../services/cmsService';
import { publicAssetUrl } from '../../utils/publicAssetUrl';
import { formatTry } from '../../utils/formatPrice';
import { productHasImage } from '../../utils/productImage';

interface MenuManagementSectionProps {
  data: CMSData;
  onChange: (next: CMSData) => void;
  onSave: (payload: CMSData) => Promise<boolean>;
}

export const MenuManagementSection: React.FC<MenuManagementSectionProps> = ({
  data,
  onChange,
  onSave,
}) => {
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [uploadingProductId, setUploadingProductId] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const accordionRef = useRef<HTMLDivElement>(null);

  const scrollToAccordion = useCallback(() => {
    requestAnimationFrame(() => {
      const target = accordionRef.current;
      if (!target) return;

      const main = document.getElementById('admin-main-panel');
      if (main) {
        const mainTop = main.getBoundingClientRect().top;
        const targetTop = target.getBoundingClientRect().top;
        main.scrollBy({ top: targetTop - mainTop - 12, behavior: 'smooth' });
        return;
      }

      target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, []);

  useEffect(() => {
    if (expandedCategoryId && !data.categories.some((c) => c.id === expandedCategoryId)) {
      setExpandedCategoryId(null);
      setEditingProductId(null);
    }
  }, [data.categories, expandedCategoryId]);

  const expandCategory = useCallback(
    (categoryId: string) => {
      setExpandedCategoryId(categoryId);
      setEditingProductId((prev) => {
        if (!prev) return null;
        const product = data.products.find((p) => p.id === prev);
        return product?.categoryId === categoryId ? prev : null;
      });
      scrollToAccordion();
    },
    [data.products, scrollToAccordion],
  );

  const toggleCategory = useCallback(
    (categoryId: string, isExpanded: boolean) => {
      if (isExpanded) {
        setExpandedCategoryId(null);
        return;
      }
      expandCategory(categoryId);
    },
    [expandCategory],
  );

  const openProductEdit = useCallback(
    (productId: string, isSelected: boolean) => {
      setEditingProductId(isSelected ? null : productId);
      if (!isSelected) scrollToAccordion();
    },
    [scrollToAccordion],
  );

  const expandedCategory = useMemo(
    () => data.categories.find((c) => c.id === expandedCategoryId) ?? null,
    [data.categories, expandedCategoryId],
  );

  const categoryProducts = useMemo(() => {
    if (!expandedCategoryId) return [];
    return data.products.filter((p) => p.categoryId === expandedCategoryId);
  }, [data.products, expandedCategoryId]);

  const editingProduct = useMemo(
    () => data.products.find((p) => p.id === editingProductId) ?? null,
    [data.products, editingProductId],
  );

  const productCountByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of data.products) {
      map.set(p.categoryId, (map.get(p.categoryId) || 0) + 1);
    }
    return map;
  }, [data.products]);

  const patch = (next: CMSData) => onChange(next);

  const updateProduct = (id: string, field: keyof Product, value: Product[keyof Product]) => {
    patch({
      ...data,
      products: data.products.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    });
  };

  const updateCategory = (id: string, field: keyof Category, value: string) => {
    const normalized = field === 'id' ? value.trim().toLowerCase().replace(/\s+/g, '-') : value;
    const nextCategories = data.categories.map((c) =>
      c.id === id ? { ...c, [field]: normalized } : c,
    );
    const nextProducts =
      field === 'id'
        ? data.products.map((p) => (p.categoryId === id ? { ...p, categoryId: normalized } : p))
        : data.products;
    patch({ ...data, categories: nextCategories, products: nextProducts });
    if (field === 'id' && expandedCategoryId === id) setExpandedCategoryId(normalized);
    if (field === 'id' && editingCategoryId === id) setEditingCategoryId(normalized);
  };

  const saveAll = async (key: string) => {
    setSavingKey(key);
    try {
      const ok = await onSave(data);
      alert(ok ? 'Kaydedildi.' : 'Kayıt başarısız.');
    } finally {
      setSavingKey(null);
    }
  };

  const addCategory = () => {
    const newCat: Category = { id: `cat-${Date.now()}`, name: 'Yeni kategori' };
    patch({ ...data, categories: [...data.categories, newCat] });
    setExpandedCategoryId(newCat.id);
    setEditingCategoryId(newCat.id);
    scrollToAccordion();
  };

  const removeCategory = async (categoryId: string) => {
    const count = productCountByCategory.get(categoryId) || 0;
    if (count > 0) {
      alert('Bu kategoride ürün var. Silmek için önce ürünleri taşıyın veya silin.');
      return;
    }
    if (!window.confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return;
    const next = {
      ...data,
      categories: data.categories.filter((c) => c.id !== categoryId),
    };
    patch(next);
    if (expandedCategoryId === categoryId) setExpandedCategoryId(next.categories[0]?.id ?? null);
    const ok = await onSave(next);
    alert(ok ? 'Kategori silindi.' : 'Kayıt başarısız.');
  };

  const addProduct = (categoryId: string) => {
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      categoryId,
      name: 'Yeni ürün',
      description: '',
      price: 0,
      image: '',
      isBestSeller: false,
      isHidden: false,
    };
    patch({ ...data, products: [...data.products, newProduct] });
    setEditingProductId(newProduct.id);
    scrollToAccordion();
  };

  const removeProduct = async (productId: string) => {
    if (!window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    const next = { ...data, products: data.products.filter((p) => p.id !== productId) };
    patch(next);
    if (editingProductId === productId) setEditingProductId(null);
    const ok = await onSave(next);
    alert(ok ? 'Ürün silindi.' : 'Kayıt başarısız.');
  };

  const toggleHidden = async (product: Product) => {
    const nextHidden = !product.isHidden;
    const next = {
      ...data,
      products: data.products.map((p) =>
        p.id === product.id ? { ...p, isHidden: nextHidden } : p,
      ),
    };
    patch(next);
    const ok = await onSave(next);
    if (!ok) alert('Kayıt başarısız.');
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
          `${message}\n\nStorage yükleme başarısız olduğu için görsel geçici olarak data URL ile eklendi.`,
        );
      } catch {
        alert(message);
      }
    } finally {
      setUploadingProductId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black">Menü Yönetimi</h2>
        <button
          type="button"
          onClick={addCategory}
          className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Kategori ekle
        </button>
      </div>

      {/* Kategori ızgarası */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {data.categories.map((category) => {
          const isExpanded = expandedCategoryId === category.id;
          const isEditing = editingCategoryId === category.id;
          const count = productCountByCategory.get(category.id) || 0;

          return (
            <div
              key={category.id}
              className={`rounded-xl border p-4 transition-all ${
                isExpanded ? 'border-burgundy bg-burgundy/10' : 'border-white/10 bg-white/5'
              }`}
            >
              {isEditing ? (
                <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    value={category.name}
                    onChange={(e) => updateCategory(category.id, 'name', e.target.value)}
                    className="w-full bg-dark-bg rounded-lg px-3 py-2 text-sm font-bold"
                    placeholder="Kategori adı"
                  />
                  <input
                    value={category.id}
                    onChange={(e) => updateCategory(category.id, 'id', e.target.value)}
                    className="w-full bg-dark-bg rounded-lg px-3 py-2 text-xs text-white/60"
                    placeholder="Slug (id)"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void saveAll(`cat-${category.id}`)}
                      disabled={savingKey === `cat-${category.id}`}
                      className="flex-1 px-2 py-1.5 rounded-lg bg-burgundy text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <Save className="w-3 h-3" />
                      {savingKey === `cat-${category.id}` ? '...' : 'Kaydet'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCategoryId(null)}
                      className="px-2 py-1.5 rounded-lg bg-white/10 text-xs"
                    >
                      Tamam
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.id, isExpanded)}
                    className="w-full text-left"
                  >
                    <p className="font-black text-lg">{category.name}</p>
                    <p className="text-xs text-white/50 mt-1">{count} ürün</p>
                  </button>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        expandCategory(category.id);
                        setEditingCategoryId(category.id);
                      }}
                      className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-bold uppercase flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" /> Düzenle
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeCategory(category.id)}
                      className="px-2 py-1 rounded-md bg-red-600/20 hover:bg-red-600/40 text-[10px] font-bold uppercase flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Sil
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCategory(category.id, isExpanded)}
                      className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-bold uppercase ml-auto flex items-center gap-1"
                    >
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Akordiyon içeriği */}
      {expandedCategory ? (
        <div
          ref={accordionRef}
          className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden scroll-mt-24"
        >
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-black text-xl flex items-center gap-2">
              <ChevronDown className="w-5 h-5 text-orange-accent" />
              {expandedCategory.name}
            </h3>
            <button
              type="button"
              onClick={() => addProduct(expandedCategory.id)}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Ürün ekle
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Seçili ürün düzenleme paneli — üstte */}
            {editingProduct && editingProduct.categoryId === expandedCategory.id ? (
              <div className="rounded-xl border border-burgundy/40 bg-burgundy/5 p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-black">Ürün düzenle: {editingProduct.name}</h4>
                  <button
                    type="button"
                    onClick={() => void saveAll(`prod-${editingProduct.id}`)}
                    disabled={savingKey === `prod-${editingProduct.id}`}
                    className="px-4 py-2 rounded-lg bg-burgundy hover:bg-burgundy/80 text-sm font-bold flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {savingKey === `prod-${editingProduct.id}` ? 'Kaydediliyor…' : 'Kaydet'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    value={editingProduct.name}
                    onChange={(e) => updateProduct(editingProduct.id, 'name', e.target.value)}
                    className="bg-dark-bg rounded-lg px-4 py-2 text-sm"
                    placeholder="Ürün adı"
                  />
                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => updateProduct(editingProduct.id, 'price', Number(e.target.value) || 0)}
                    className="bg-dark-bg rounded-lg px-4 py-2 text-sm"
                    placeholder="Fiyat"
                  />
                  <textarea
                    value={editingProduct.description}
                    onChange={(e) => updateProduct(editingProduct.id, 'description', e.target.value)}
                    className="md:col-span-2 bg-dark-bg rounded-lg px-4 py-2 text-sm h-24"
                    placeholder="Açıklama"
                  />
                  <input
                    value={(editingProduct.ingredients || []).join(', ')}
                    onChange={(e) =>
                      updateProduct(
                        editingProduct.id,
                        'ingredients',
                        e.target.value.split(',').map((x) => x.trim()).filter(Boolean),
                      )
                    }
                    className="md:col-span-2 bg-dark-bg rounded-lg px-4 py-2 text-sm"
                    placeholder="İçindekiler (virgül ile)"
                  />
                  <input
                    value={editingProduct.image || ''}
                    onChange={(e) => updateProduct(editingProduct.id, 'image', e.target.value)}
                    onBlur={(e) => {
                      const raw = e.target.value.trim();
                      if (!raw || raw.startsWith('http') || raw.startsWith('/') || raw.startsWith('data:')) return;
                      updateProduct(editingProduct.id, 'image', `/${raw}`);
                    }}
                    className="md:col-span-2 bg-dark-bg rounded-lg px-4 py-2 text-sm"
                    placeholder="Görsel yolu / URL"
                  />
                  <div className="md:col-span-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleProductImageUpload(editingProduct.id, file);
                      }}
                      className="w-full bg-dark-bg rounded-lg px-4 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-burgundy file:px-3 file:py-1 file:text-xs file:font-bold file:text-white"
                    />
                    <p className="text-xs text-white/50 mt-1">
                      {uploadingProductId === editingProduct.id ? 'Yükleniyor…' : (editingProduct.image ? 'Görsel tanımlı' : 'Görsel yok')}
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editingProduct.isBestSeller}
                      onChange={(e) => updateProduct(editingProduct.id, 'isBestSeller', e.target.checked)}
                    />
                    Çok satan
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.isHidden)}
                      onChange={(e) => updateProduct(editingProduct.id, 'isHidden', e.target.checked)}
                    />
                    Sitede gizle
                  </label>
                </div>
              </div>
            ) : null}

            {/* Ürün kartları — altta */}
            {categoryProducts.length === 0 ? (
              <p className="text-sm text-white/50 text-center py-8">Bu kategoride henüz ürün yok.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categoryProducts.map((product) => {
                  const isSelected = editingProductId === product.id;
                  return (
                    <div
                      key={product.id}
                      className={`rounded-xl border overflow-hidden transition-all ${
                        product.isHidden ? 'opacity-50 border-white/5' : 'border-white/10'
                      } ${isSelected ? 'ring-2 ring-burgundy' : 'bg-white/5'}`}
                    >
                      <div className="aspect-[4/3] bg-dark-bg relative">
                        {productHasImage(product.image) ? (
                          <img
                            src={publicAssetUrl(product.image.trim())}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/5" />
                        )}
                        {product.isHidden ? (
                          <span className="absolute top-2 left-2 bg-black/70 text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                            Gizli
                          </span>
                        ) : null}
                        {product.isBestSeller ? (
                          <span className="absolute top-2 right-2 bg-burgundy text-[10px] font-bold px-2 py-0.5 rounded">
                            Çok satan
                          </span>
                        ) : null}
                      </div>
                      <div className="p-3">
                        <p className="font-bold text-sm line-clamp-1">{product.name}</p>
                        <p className="text-orange-accent text-sm font-black mt-1">{formatTry(product.price)}</p>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          <button
                            type="button"
                            onClick={() => openProductEdit(product.id, isSelected)}
                            className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-bold uppercase flex items-center gap-1"
                          >
                            <Pencil className="w-3 h-3" /> Düzenle
                          </button>
                          <button
                            type="button"
                            onClick={() => void toggleHidden(product)}
                            className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-bold uppercase flex items-center gap-1"
                          >
                            {product.isHidden ? (
                              <><Eye className="w-3 h-3" /> Göster</>
                            ) : (
                              <><EyeOff className="w-3 h-3" /> Gizle</>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => void removeProduct(product.id)}
                            className="px-2 py-1 rounded-md bg-red-600/20 hover:bg-red-600/40 text-[10px] font-bold uppercase flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-white/50 text-sm">Ürünleri görmek için bir kategori seçin.</p>
      )}
    </div>
  );
};
