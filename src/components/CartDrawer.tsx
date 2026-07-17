import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Plus, Minus, Trash2, MapPinned, WalletCards } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useCMSStore } from '../store/cmsStore';
import { fallbackCmsData } from '../constants/fallbackCmsData';
import { formatTry } from '../utils/formatPrice';
import { publicAssetUrl } from '../utils/publicAssetUrl';
import { productHasImage } from '../utils/productImage';
import { submitPublicOrder } from '../services/orderService';
import { useShopStatusStore } from '../store/shopStatusStore';
import { loadCustomerProfile, saveCustomerProfile, hasKvkkConsent } from '../utils/customerStorage';
import { canSubmitOrderNow, markOrderSubmitted } from '../utils/orderSpamGuard';
import type { OrderPaymentMethod } from '../types';

export const CartDrawer: React.FC = () => {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, totalPrice, clearCart, toggleRemovedIngredient } = useCartStore();
  const deliveryOpen = useShopStatusStore((s) => s.deliveryOpen);
  const { fetchData } = useCMSStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [street, setStreet] = useState('');
  const [apartmentNo, setApartmentNo] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [floor, setFloor] = useState('');
  const [apartmentUnitNo, setApartmentUnitNo] = useState('');
  const [addressDescription, setAddressDescription] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [note, setNote] = useState('');
  const [website, setWebsite] = useState('');
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<OrderPaymentMethod>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen, fetchData]);

  useEffect(() => {
    if (!isOpen) {
      setSubmitError('');
      return;
    }

    const saved = loadCustomerProfile();
    if (!saved) {
      setKvkkAccepted(false);
      return;
    }

    setName(saved.name);
    setPhone(saved.phone);
    setNeighborhood(saved.address.neighborhood);
    setStreet(saved.address.street);
    setApartmentNo(saved.address.apartmentNo);
    setBuildingName(saved.address.buildingName);
    setFloor(saved.address.floor);
    setApartmentUnitNo(saved.address.apartmentUnitNo);
    setAddressDescription(saved.address.description);
    setLocationUrl(saved.address.locationUrl || '');
    setKvkkAccepted(Boolean(saved.kvkkAcceptedAt));
  }, [isOpen]);

  const needsKvkk = !hasKvkkConsent();

  const paymentLabel = useMemo(
    () => (paymentMethod === 'cash' ? 'Nakit' : 'Kapıda Kredi Kartı'),
    [paymentMethod],
  );

  const persistProfile = (kvkkAt: string | null) => {
    saveCustomerProfile({
      name: name.trim(),
      phone: phone.trim(),
      address: {
        neighborhood: neighborhood.trim(),
        street: street.trim(),
        apartmentNo: apartmentNo.trim(),
        buildingName: buildingName.trim(),
        floor: floor.trim(),
        apartmentUnitNo: apartmentUnitNo.trim(),
        description: addressDescription.trim(),
        locationUrl: locationUrl.trim() || null,
      },
      kvkkAcceptedAt: kvkkAt,
    });
  };

  const resolveLocation = async () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Tarayıcınız konum desteği sunmuyor.');
      return;
    }

    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
      });
    }).catch(() => null);

    if (!position) {
      setLocationError('Konum alınamadı. İzin verdiğinizden emin olun.');
      return;
    }

    const lat = position.coords.latitude.toFixed(6);
    const lng = position.coords.longitude.toFixed(6);
    setLocationUrl(`https://maps.google.com/?q=${lat},${lng}`);
  };

  const handleCompleteOrder = async () => {
    setSubmitError('');

    if (!deliveryOpen) {
      setSubmitError('Restoran şu an paket servise kapalı.');
      return;
    }

    if (website.trim()) return;

    const cooldown = canSubmitOrderNow();
    if (!cooldown.ok) {
      setSubmitError(`Lütfen ${cooldown.waitSeconds} saniye bekleyip tekrar deneyin.`);
      return;
    }

    if (
      !name.trim()
      || !phone.trim()
      || !neighborhood.trim()
      || !street.trim()
      || !apartmentNo.trim()
      || !floor.trim()
      || !apartmentUnitNo.trim()
    ) {
      setSubmitError('Ad soyad, telefon, mahalle, sokak/cadde, bina no, kat ve daire no alanlarını doldurun.');
      return;
    }

    if (needsKvkk && !kvkkAccepted) {
      setSubmitError('Devam etmek için KVKK onayını işaretleyin.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitPublicOrder({
        customerName: name.trim(),
        phone: phone.trim(),
        paymentMethod,
        note: note.trim(),
        kvkkAccepted: needsKvkk ? kvkkAccepted : true,
        website,
        address: {
          neighborhood: neighborhood.trim(),
          street: street.trim(),
          apartmentNo: apartmentNo.trim(),
          buildingName: buildingName.trim(),
          floor: floor.trim(),
          apartmentUnitNo: apartmentUnitNo.trim(),
          description: addressDescription.trim(),
          locationUrl: locationUrl.trim() || null,
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

      const kvkkAt = needsKvkk && kvkkAccepted ? new Date().toISOString() : loadCustomerProfile()?.kvkkAcceptedAt || new Date().toISOString();
      persistProfile(kvkkAt);
      markOrderSubmitted();

      clearCart();
      setNote('');
      setPaymentMethod('cash');
      setWebsite('');
      setIsOpen(false);
      alert('Siparişiniz alındı. Kuryemiz en kısa sürede yola çıkacak.');
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Sipariş gönderilemedi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full md:w-96 z-[70] bg-dark-bg shadow-2xl flex flex-col p-4 md:p-6 border-l border-white/10 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-widest">Sepetiniz</h2>
                <p className="text-xs text-white/60">Kapıda ödeme</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Kapat"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto no-scrollbar pr-1">
              <div className="space-y-6">
                {items.length === 0 ? (
                  <div className="h-[40vh] flex flex-col items-center justify-center opacity-40 italic">
                    <ShoppingBag className="w-12 h-12 mb-4" />
                    <p>Sepetiniz henüz boş.</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="flex gap-4 items-center">
                      {productHasImage(item.image) ? (
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/5 shrink-0">
                          <img
                            src={publicAssetUrl(item.image.trim())}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-white/5 shrink-0" aria-hidden />
                      )}
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold text-sm">{item.name}</h3>
                          <span className="text-orange-accent font-bold text-sm shrink-0">
                            {formatTry(item.price)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="p-1 hover:bg-white/10 rounded transition-colors"
                              aria-label="Azalt"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="p-1 hover:bg-white/10 rounded transition-colors"
                              aria-label="Artır"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-white/40 hover:text-red-400 transition-colors"
                            aria-label="Kaldır"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {item.ingredients && item.ingredients.length > 0 ? (
                          <div className="mt-3">
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
                              İçindekiler (çıkarılacaklara tıkla)
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {item.ingredients.map((ing) => {
                                const removed = (item.removedIngredients || []).includes(ing);
                                return (
                                  <button
                                    key={ing}
                                    type="button"
                                    onClick={() => toggleRemovedIngredient(item.id, ing)}
                                    className={`text-[11px] rounded-full px-2.5 py-1 border transition-all ${
                                      removed
                                        ? 'border-red-400/70 bg-red-500/15 text-red-200 line-through'
                                        : 'border-white/20 bg-white/5 text-white/70 hover:bg-white/10'
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
                    </div>
                  ))
                )}
              </div>

              {items.length > 0 && (
                <div className="space-y-6 pt-6 border-t border-white/10 mt-8 pb-6">
                  <p className="text-xs text-orange-accent/90 leading-relaxed rounded-lg bg-orange-accent/10 border border-orange-accent/20 px-3 py-2">
                    Lezzetin size daha çabuk ulaşması için lütfen zorunlu alanları eksiksiz doldurun.
                  </p>
                  <p className="text-xs text-white/50 leading-relaxed rounded-lg bg-white/5 px-3 py-2">
                    Kapıda ödeme tipini seçin: Nakit veya Kapıda Kredi Kartı.
                  </p>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-white/60">
                      <span>Ara toplam</span>
                      <span>{formatTry(totalPrice())}</span>
                    </div>
                    <div className="flex justify-between text-lg font-black pt-2 border-t border-white/5">
                      <span>Toplam</span>
                      <span className="text-orange-accent">{formatTry(totalPrice())}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden
                      className="hidden"
                    />

                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ad soyad *"
                      autoComplete="name"
                      className="w-full bg-white/5 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-accent transition-all placeholder:text-white/20"
                    />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Telefon *"
                      autoComplete="tel"
                      className="w-full bg-white/5 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-accent transition-all placeholder:text-white/20"
                    />
                    <input
                      type="text"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder="Mahalle *"
                      className="w-full bg-white/5 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-accent transition-all placeholder:text-white/20"
                    />
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Sokak / Cadde *"
                      className="w-full bg-white/5 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-accent transition-all placeholder:text-white/20"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={apartmentNo}
                        onChange={(e) => setApartmentNo(e.target.value)}
                        placeholder="Bina No *"
                        className="w-full bg-white/5 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-accent transition-all placeholder:text-white/20"
                      />
                      <input
                        type="text"
                        value={buildingName}
                        onChange={(e) => setBuildingName(e.target.value)}
                        placeholder="Apartman Adı"
                        className="w-full bg-white/5 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-accent transition-all placeholder:text-white/20"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={floor}
                        onChange={(e) => setFloor(e.target.value)}
                        placeholder="Kat *"
                        className="w-full bg-white/5 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-accent transition-all placeholder:text-white/20"
                      />
                      <input
                        type="text"
                        value={apartmentUnitNo}
                        onChange={(e) => setApartmentUnitNo(e.target.value)}
                        placeholder="Daire No *"
                        className="w-full bg-white/5 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-accent transition-all placeholder:text-white/20"
                      />
                    </div>
                    <textarea
                      value={addressDescription}
                      onChange={(e) => setAddressDescription(e.target.value)}
                      placeholder="Adres açıklaması (kurye için not)"
                      rows={2}
                      className="w-full bg-white/5 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-accent transition-all placeholder:text-white/20"
                    />
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => void resolveLocation()}
                        className="w-full bg-white/10 text-white py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/15 transition-all flex items-center justify-center gap-2"
                      >
                        <MapPinned className="w-4 h-4" />
                        Konum paylaş (Google Maps)
                      </button>
                      {locationUrl ? (
                        <a
                          href={locationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-orange-accent break-all"
                        >
                          {locationUrl}
                        </a>
                      ) : null}
                      {locationError ? <p className="text-red-400 text-xs">{locationError}</p> : null}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cash')}
                        className={`rounded-xl px-3 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
                          paymentMethod === 'cash'
                            ? 'bg-burgundy text-white'
                            : 'bg-white/10 text-white/70 hover:bg-white/15'
                        }`}
                      >
                        Nakit
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card_on_delivery')}
                        className={`rounded-xl px-3 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
                          paymentMethod === 'card_on_delivery'
                            ? 'bg-burgundy text-white'
                            : 'bg-white/10 text-white/70 hover:bg-white/15'
                        }`}
                      >
                        Kapıda Kredi Kartı
                      </button>
                    </div>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Sipariş notu (isteğe bağlı)"
                      rows={2}
                      className="w-full bg-white/5 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-accent transition-all placeholder:text-white/20"
                    />

                    {needsKvkk ? (
                      <label className="flex items-start gap-3 rounded-xl bg-white/5 px-3 py-3 text-xs text-white/70 leading-relaxed cursor-pointer">
                        <input
                          type="checkbox"
                          checked={kvkkAccepted}
                          onChange={(e) => setKvkkAccepted(e.target.checked)}
                          className="mt-0.5"
                        />
                        <span>
                          Kişisel verilerimin siparişin iletilmesi, teslimat ve müşteri hizmetleri amacıyla
                          işlenmesini kabul ediyorum (KVKK).
                        </span>
                      </label>
                    ) : null}
                  </div>

                  {submitError && <p className="text-red-400 text-xs">{submitError}</p>}

                  <button
                    type="button"
                    onClick={handleCompleteOrder}
                    disabled={isSubmitting}
                    className="w-full bg-burgundy text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-burgundy/80 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <WalletCards className="w-5 h-5" />
                    {isSubmitting ? 'Gönderiliyor...' : `Siparişi tamamla (${paymentLabel})`}
                  </button>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
