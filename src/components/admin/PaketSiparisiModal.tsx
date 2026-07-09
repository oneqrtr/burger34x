import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  WalletCards,
} from 'lucide-react';
import type { CMSData, CustomerRecord, OrderPaymentMethod } from '../../types';
import { useAdminCartStore } from '../../store/adminCartStore';
import { submitAdminPhoneOrder } from '../../services/orderService';
import { formatTry } from '../../utils/formatPrice';
import { publicAssetUrl } from '../../utils/publicAssetUrl';
import { productHasImage } from '../../utils/productImage';
import { normalizeTrPhone } from '../../utils/phone';

type Step = 'menu' | 'checkout';

interface PaketSiparisiModalProps {
  data: CMSData;
  customers: CustomerRecord[];
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export const PaketSiparisiModal: React.FC<PaketSiparisiModalProps> = ({
  data,
  customers,
  onClose,
  onSuccess,
}) => {
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    toggleRemovedIngredient,
    clearCart,
    totalPrice,
  } = useAdminCartStore();

  const [step, setStep] = useState<Step>('menu');
  const [activeCategory, setActiveCategory] = useState('all');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [street, setStreet] = useState('');
  const [apartmentNo, setApartmentNo] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [floor, setFloor] = useState('');
  const [apartmentUnitNo, setApartmentUnitNo] = useState('');
  const [addressDescription, setAddressDescription] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<OrderPaymentMethod>('cash');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const products = data.products;
  const filteredProducts =
    activeCategory === 'all'
      ? products
      : products.filter((p) => p.categoryId === activeCategory);

  const customerByPhone = useMemo(() => {
    const map = new Map<string, CustomerRecord>();
    for (const c of customers) {
      map.set(normalizeTrPhone(c.phone), c);
    }
    return map;
  }, [customers]);

  useEffect(() => {
    const normalized = normalizeTrPhone(phone);
    if (normalized.length < 10) return;
    const found = customerByPhone.get(normalized);
    if (!found) return;

    setName(found.name);
    setNeighborhood(found.address.neighborhood);
    setStreet(found.address.street);
    setApartmentNo(found.address.apartmentNo);
    setBuildingName(found.address.buildingName);
    setFloor(found.address.floor);
    setApartmentUnitNo(found.address.apartmentUnitNo);
    setAddressDescription(found.address.description);
  }, [phone, customerByPhone]);

  const handleClose = () => {
    setStep('menu');
    setSubmitError('');
    onClose();
  };

  const handleConfirmCart = () => {
    if (items.length === 0) {
      setSubmitError('Sepete en az bir ürün ekleyin.');
      return;
    }
    setSubmitError('');
    setStep('checkout');
  };

  const handleSubmit = async () => {
    setSubmitError('');

    if (
      !name.trim()
      || !phone.trim()
      || !neighborhood.trim()
      || !street.trim()
      || !apartmentNo.trim()
      || !apartmentUnitNo.trim()
    ) {
      setSubmitError('Ad soyad, telefon, mahalle, sokak/cadde, bina no ve daire no zorunludur.');
      return;
    }

    if (items.length === 0) {
      setSubmitError('Sepet boş.');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderNote = [note.trim(), 'Telefon siparişi'].filter(Boolean).join(' · ');

      await submitAdminPhoneOrder({
        customerName: name.trim(),
        phone: phone.trim(),
        paymentMethod,
        note: orderNote || undefined,
        address: {
          neighborhood: neighborhood.trim(),
          street: street.trim(),
          apartmentNo: apartmentNo.trim(),
          buildingName: buildingName.trim(),
          floor: floor.trim(),
          apartmentUnitNo: apartmentUnitNo.trim(),
          description: addressDescription.trim(),
          locationUrl: null,
        },
        items: items.map((i) => ({
          productId: i.id,
          name:
            i.removedIngredients && i.removedIngredients.length > 0
              ? `${i.name} (Çıkarılacaklar: ${i.removedIngredients.join(', ')})`
              : i.name,
          unitPrice: i.price,
          quantity: i.quantity,
        })),
      });

      clearCart();
      setStep('menu');
      await onSuccess();
      handleClose();
      alert('Paket siparişi oluşturuldu. Siparişler sekmesinden onaylayabilirsiniz.');
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Sipariş oluşturulamadı.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-5xl max-h-[92vh] rounded-2xl border border-white/10 bg-dark-bg shadow-2xl flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              {step === 'checkout' ? (
                <button
                  type="button"
                  onClick={() => {
                    setStep('menu');
                    setSubmitError('');
                  }}
                  className="p-2 rounded-lg hover:bg-white/10"
                  aria-label="Geri"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : null}
              <div>
                <h2 className="text-xl font-black">Paket Siparişi</h2>
                <p className="text-xs text-white/50">
                  {step === 'menu' ? 'Ürün seçin ve sepeti onaylayın' : 'Müşteri bilgilerini girin'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-white/10"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === 'menu' ? (
            <>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  <button
                    type="button"
                    onClick={() => setActiveCategory('all')}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${
                      activeCategory === 'all' ? 'bg-burgundy text-white' : 'bg-white/10 text-white/70'
                    }`}
                  >
                    Tümü
                  </button>
                  {data.categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${
                        activeCategory === cat.id ? 'bg-burgundy text-white' : 'bg-white/10 text-white/70'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`rounded-xl border p-3 flex flex-col gap-2 ${
                        product.isHidden ? 'border-white/5 bg-white/[0.02] opacity-70' : 'border-white/10 bg-white/5'
                      }`}
                    >
                      {productHasImage(product.image) ? (
                        <div className="aspect-[4/3] rounded-lg overflow-hidden bg-dark-bg">
                          <img
                            src={publicAssetUrl(product.image.trim())}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-[4/3] rounded-lg bg-white/5" />
                      )}
                      <div className="flex-grow min-w-0">
                        <p className="font-bold text-sm line-clamp-1">{product.name}</p>
                        <p className="text-orange-accent text-sm font-black">{formatTry(product.price)}</p>
                        {product.isHidden ? (
                          <p className="text-[10px] text-white/40 uppercase mt-1">Gizli ürün</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => addItem(product)}
                        className="w-full py-2 rounded-lg bg-burgundy hover:bg-burgundy/80 text-xs font-bold flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Sepete ekle
                      </button>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <h3 className="font-black mb-3 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" /> Sepet
                  </h3>
                  {items.length === 0 ? (
                    <p className="text-sm text-white/50">Henüz ürün eklenmedi.</p>
                  ) : (
                    <div className="space-y-4">
                      {items.map((item) => (
                        <div key={item.id} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="font-bold text-sm">{item.name}</p>
                              <p className="text-orange-accent text-sm font-black">{formatTry(item.price)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, -1)}
                                  className="p-1 hover:bg-white/10 rounded"
                                  aria-label="Azalt"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, 1)}
                                  className="p-1 hover:bg-white/10 rounded"
                                  aria-label="Artır"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="p-1 text-white/40 hover:text-red-400"
                                aria-label="Kaldır"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {item.ingredients && item.ingredients.length > 0 ? (
                            <div className="mt-2">
                              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
                                Çıkarılacaklara tıkla
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {item.ingredients.map((ing) => {
                                  const removed = (item.removedIngredients || []).includes(ing);
                                  return (
                                    <button
                                      key={ing}
                                      type="button"
                                      onClick={() => toggleRemovedIngredient(item.id, ing)}
                                      className={`text-[11px] rounded-full px-2 py-0.5 border ${
                                        removed
                                          ? 'border-red-400/70 bg-red-500/15 text-red-200 line-through'
                                          : 'border-white/20 bg-white/5 text-white/70'
                                      }`}
                                    >
                                      {ing}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="shrink-0 border-t border-white/10 px-5 py-4 bg-black/20">
                {submitError ? <p className="text-red-400 text-xs mb-2">{submitError}</p> : null}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-white/50">Toplam</p>
                    <p className="text-2xl font-black text-orange-accent">{formatTry(totalPrice())}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleConfirmCart}
                    disabled={items.length === 0}
                    className="px-6 py-3 rounded-xl bg-burgundy hover:bg-burgundy/80 disabled:opacity-40 font-bold"
                  >
                    Sepeti onayla
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <p className="text-xs text-white/50">Sepet tutarı</p>
                <p className="text-2xl font-black text-orange-accent">{formatTry(totalPrice())}</p>
                <p className="text-xs text-white/40 mt-1">{items.length} farklı ürün</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ad soyad *"
                  className="bg-dark-bg border border-white/10 rounded-xl px-4 py-3 text-sm"
                />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Telefon *"
                  className="bg-dark-bg border border-white/10 rounded-xl px-4 py-3 text-sm"
                />
                <input
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Mahalle *"
                  className="bg-dark-bg border border-white/10 rounded-xl px-4 py-3 text-sm"
                />
                <input
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Sokak / cadde *"
                  className="bg-dark-bg border border-white/10 rounded-xl px-4 py-3 text-sm"
                />
                <input
                  value={apartmentNo}
                  onChange={(e) => setApartmentNo(e.target.value)}
                  placeholder="Apartman / bina no *"
                  className="bg-dark-bg border border-white/10 rounded-xl px-4 py-3 text-sm"
                />
                <input
                  value={apartmentUnitNo}
                  onChange={(e) => setApartmentUnitNo(e.target.value)}
                  placeholder="Daire no *"
                  className="bg-dark-bg border border-white/10 rounded-xl px-4 py-3 text-sm"
                />
                <input
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="Kat"
                  className="bg-dark-bg border border-white/10 rounded-xl px-4 py-3 text-sm"
                />
                <input
                  value={buildingName}
                  onChange={(e) => setBuildingName(e.target.value)}
                  placeholder="Bina adı"
                  className="bg-dark-bg border border-white/10 rounded-xl px-4 py-3 text-sm"
                />
                <textarea
                  value={addressDescription}
                  onChange={(e) => setAddressDescription(e.target.value)}
                  placeholder="Adres notu"
                  className="md:col-span-2 bg-dark-bg border border-white/10 rounded-xl px-4 py-3 text-sm h-20"
                />
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Sipariş notu"
                  className="md:col-span-2 bg-dark-bg border border-white/10 rounded-xl px-4 py-3 text-sm h-20"
                />
              </div>

              <div>
                <p className="text-xs text-white/50 mb-2 flex items-center gap-1">
                  <WalletCards className="w-3 h-3" /> Ödeme yöntemi *
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`rounded-xl px-4 py-3 text-sm font-bold ${
                      paymentMethod === 'cash' ? 'bg-burgundy text-white' : 'bg-white/10 text-white/70'
                    }`}
                  >
                    Nakit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card_on_delivery')}
                    className={`rounded-xl px-4 py-3 text-sm font-bold ${
                      paymentMethod === 'card_on_delivery' ? 'bg-burgundy text-white' : 'bg-white/10 text-white/70'
                    }`}
                  >
                    Kapıda kart
                  </button>
                </div>
              </div>

              {submitError ? <p className="text-red-400 text-sm">{submitError}</p> : null}

              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-40 font-bold"
              >
                {isSubmitting ? 'Kaydediliyor…' : 'Siparişi oluştur'}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
