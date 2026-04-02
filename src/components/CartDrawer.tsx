import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Plus, Minus, Trash2, MapPinned, WalletCards } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useCMSStore } from '../store/cmsStore';
import { fallbackCmsData } from '../constants/fallbackCmsData';
import { formatTry } from '../utils/formatPrice';
import { PRODUCT_IMAGE_PLACEHOLDER } from '../utils/placeholderImage';
import { publicAssetUrl } from '../utils/publicAssetUrl';
import { submitPublicOrder } from '../services/orderService';
import type { OrderPaymentMethod } from '../types';

export const CartDrawer: React.FC = () => {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, totalPrice, clearCart } = useCartStore();
  const { data, fetchData } = useCMSStore();
  const contact = data?.contact ?? fallbackCmsData.contact;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [street, setStreet] = useState('');
  const [apartmentNo, setApartmentNo] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [addressDescription, setAddressDescription] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [note, setNote] = useState('');
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
    }
  }, [isOpen]);

  const paymentLabel = useMemo(
    () => (paymentMethod === 'cash' ? 'Nakit' : 'Kapıda Kredi Kartı'),
    [paymentMethod],
  );

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
    if (!name.trim() || !phone.trim() || !neighborhood.trim() || !street.trim()) {
      setSubmitError('Ad soyad, telefon, mahalle ve sokak/cadde alanlarını doldurun.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitPublicOrder({
        customerName: name.trim(),
        phone: phone.trim(),
        paymentMethod,
        note: note.trim(),
        address: {
          neighborhood: neighborhood.trim(),
          street: street.trim(),
          apartmentNo: apartmentNo.trim(),
          buildingName: buildingName.trim(),
          description: addressDescription.trim(),
          locationUrl: locationUrl.trim() || null,
        },
        items: items.map((i) => ({
          productId: i.id,
          name: i.name,
          unitPrice: i.price,
          quantity: i.quantity,
        })),
      });

      clearCart();
      setName('');
      setPhone('');
      setNeighborhood('');
      setStreet('');
      setApartmentNo('');
      setBuildingName('');
      setAddressDescription('');
      setLocationUrl('');
      setNote('');
      setPaymentMethod('cash');
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
            className="fixed right-0 top-0 h-full w-full md:w-96 z-[70] bg-dark-bg shadow-2xl flex flex-col p-6 border-l border-white/10"
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

            <div className="flex-grow space-y-6 overflow-y-auto no-scrollbar mb-8">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-40 italic">
                  <ShoppingBag className="w-12 h-12 mb-4" />
                  <p>Sepetiniz henüz boş.</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/5 shrink-0">
                      <img
                        src={item.image?.trim() ? publicAssetUrl(item.image.trim()) : PRODUCT_IMAGE_PLACEHOLDER}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
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
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="space-y-6 pt-6 border-t border-white/10">
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
                      placeholder="Apartman No"
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
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
