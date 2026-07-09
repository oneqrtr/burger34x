import React, { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import type { CMSData } from '../../types';
import { publicAssetUrl } from '../../utils/publicAssetUrl';
import { formatTry } from '../../utils/formatPrice';
import { productHasImage } from '../../utils/productImage';

interface PricesSectionProps {
  data: CMSData;
  onChange: (next: CMSData) => void;
  onSave: (payload: CMSData) => Promise<boolean>;
}

export const PricesSection: React.FC<PricesSectionProps> = ({ data, onChange, onSave }) => {
  const [draftPrices, setDraftPrices] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const next: Record<string, number> = {};
    for (const p of data.products) {
      next[p.id] = p.price;
    }
    setDraftPrices(next);
  }, [data.products]);

  const productsByCategory = useMemo(() => {
    return data.categories.map((cat) => ({
      category: cat,
      products: data.products.filter((p) => p.categoryId === cat.id),
    }));
  }, [data.categories, data.products]);

  const hasChanges = useMemo(() => {
    return data.products.some((p) => draftPrices[p.id] !== undefined && draftPrices[p.id] !== p.price);
  }, [data.products, draftPrices]);

  const setDraftPrice = (productId: string, value: number) => {
    setDraftPrices((prev) => ({ ...prev, [productId]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const next: CMSData = {
        ...data,
        products: data.products.map((p) => ({
          ...p,
          price: Math.max(0, Number(draftPrices[p.id] ?? p.price) || 0),
        })),
      };
      onChange(next);
      const ok = await onSave(next);
      alert(ok ? 'Fiyatlar kaydedildi.' : 'Kayıt başarısız.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h2 className="text-2xl font-black">Fiyatlar</h2>
        <p className="text-sm text-white/50 mt-1">
          Toplu fiyat güncellemesi için yeni fiyatları girin ve en alttan kaydedin.
        </p>
      </div>

      <div className="space-y-8">
        {productsByCategory.map(({ category, products }) => {
          if (products.length === 0) return null;
          return (
            <section key={category.id}>
              <h3 className="text-sm font-bold uppercase tracking-widest text-orange-accent mb-3">
                {category.name}
              </h3>
              <div className="space-y-2">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-xl border px-4 py-3 ${
                      draftPrices[product.id] !== product.price
                        ? 'border-orange-accent/40 bg-orange-accent/5'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-white/5 shrink-0">
                        {productHasImage(product.image) ? (
                          <img
                            src={publicAssetUrl(product.image.trim())}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{product.name}</p>
                        {product.isHidden ? (
                          <span className="text-[10px] uppercase text-white/40">Gizli</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                      <div className="text-right min-w-[88px]">
                        <p className="text-[10px] uppercase tracking-wider text-white/40">Mevcut</p>
                        <p className="font-bold text-sm">{formatTry(product.price)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Yeni fiyat</p>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={draftPrices[product.id] ?? product.price}
                          onChange={(e) => setDraftPrice(product.id, Number(e.target.value) || 0)}
                          className="w-28 bg-dark-bg border border-white/10 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-orange-accent"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="sticky bottom-0 z-10 -mx-1 mt-8 border-t border-white/10 bg-dark-bg/95 backdrop-blur-md px-1 py-4">
        <div className="max-w-3xl flex items-center justify-between gap-4">
          <p className="text-xs text-white/50">
            {hasChanges ? 'Kaydedilmemiş değişiklik var.' : 'Tüm fiyatlar güncel.'}
          </p>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !hasChanges}
            className="bg-burgundy text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-burgundy/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Kaydediliyor…' : 'Fiyatları Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
};
