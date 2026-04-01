import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Plus, Minus, Trash2, Copy, MessageCircle } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useCMSStore } from '../store/cmsStore';
import { fallbackCmsData } from '../constants/fallbackCmsData';
import { formatTry } from '../utils/formatPrice';
import { getWhatsAppOrderNumber } from '../utils/whatsappOrder';
import { PRODUCT_IMAGE_PLACEHOLDER } from '../utils/placeholderImage';
import { publicAssetUrl } from '../utils/publicAssetUrl';

export const CartDrawer: React.FC = () => {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, totalPrice, clearCart } = useCartStore();
  const { data, fetchData } = useCMSStore();
  const contact = data?.contact ?? fallbackCmsData.contact;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen, fetchData]);

  useEffect(() => {
    if (!isOpen) {
      setSubmitError('');
    }
  }, [isOpen]);

  const buildOrderText = () => {
    const lines = [
      '🍔 *Burger34 sipariş*',
      '',
      `*Ödeme:* Kapıda nakit`,
      '',
      '*Ürünler:*',
      ...items.map(
        (i) => `• ${i.name} × ${i.quantity} — ${formatTry(i.price * i.quantity)}`
      ),
      '',
      `*Ara toplam:* ${formatTry(totalPrice())}`,
      `*Toplam:* ${formatTry(totalPrice())}`,
      '',
      '*Müşteri:*',
      `Ad soyad: ${name.trim()}`,
      `Telefon: ${phone.trim()}`,
      `Adres: ${address.trim()}`,
    ];
    if (note.trim()) lines.push('', `*Not:* ${note.trim()}`);
    return lines.join('\n');
  };

  const copyOrderText = async () => {
    const text = buildOrderText();
    try {
      await navigator.clipboard.writeText(text);
      alert('Sipariş özeti panoya kopyalandı. WhatsApp veya telefon ile iletebilirsiniz.');
    } catch {
      alert(text);
    }
  };

  const handleCompleteOrder = async () => {
    setSubmitError('');
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setSubmitError('Lütfen ad soyad, telefon ve teslimat adresini doldurun.');
      return;
    }

    const text = encodeURIComponent(buildOrderText());
    const wa = getWhatsAppOrderNumber(contact.phone);

    if (wa) {
      window.open(`https://wa.me/${wa}?text=${text}`, '_blank', 'noopener,noreferrer');
    } else {
      await copyOrderText();
    }

    clearCart();
    setName('');
    setPhone('');
    setAddress('');
    setNote('');
    setIsOpen(false);
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
                  Ödeme teslimatta nakit alınır. Kart veya online ödeme yoktur.
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
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Teslimat adresi *"
                    rows={2}
                    autoComplete="street-address"
                    className="w-full bg-white/5 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-accent transition-all placeholder:text-white/20"
                  />
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
                  className="w-full bg-burgundy text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-burgundy/80 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Siparişi tamamla
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!name.trim() || !phone.trim() || !address.trim()) {
                      setSubmitError('Lütfen ad soyad, telefon ve teslimat adresini doldurun.');
                      return;
                    }
                    void copyOrderText();
                  }}
                  className="w-full bg-white/10 text-white py-3 rounded-xl font-bold text-sm hover:bg-white/15 transition-all flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Metni kopyala
                </button>

                <p className="text-[10px] text-white/40 text-center leading-relaxed">
                  WhatsApp için iletişim telefonunu cep numarası (05xx) olarak güncelleyin veya geliştirici ayarında sipariş WhatsApp numarası tanımlayın.
                </p>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
