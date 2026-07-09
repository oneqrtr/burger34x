import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { resetAllOrders } from '../../services/orderService';

interface ResetOrdersSectionProps {
  onReset: () => Promise<void>;
}

export const ResetOrdersSection: React.FC<ResetOrdersSectionProps> = ({ onReset }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setError('');

    if (!password.trim()) {
      setError('Onay şifresini girin.');
      return;
    }

    const confirmed = window.confirm(
      'Tüm siparişler kalıcı olarak silinecek. Müşteri ve menü verileri korunur. Devam etmek istiyor musunuz?',
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      await resetAllOrders(password);
      setPassword('');
      await onReset();
      alert('Tüm siparişler sıfırlandı. Dashboard verileri güncellendi.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sıfırlama başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-lg font-black text-red-300">Sipariş verilerini sıfırla</h3>
          <p className="text-sm text-white/60 mt-1">
            Tüm sipariş kayıtları ve dashboard istatistikleri temizlenir. Müşteri ve ürün verileri değişmez.
          </p>
        </div>
      </div>

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Onay şifresi"
        autoComplete="off"
        className="w-full bg-dark-bg border border-white/10 rounded-xl px-4 py-3 text-sm"
      />

      {error ? <p className="text-red-400 text-sm">{error}</p> : null}

      <button
        type="button"
        onClick={() => void handleReset()}
        disabled={loading}
        className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white py-3 rounded-xl font-bold"
      >
        {loading ? 'Sıfırlanıyor…' : 'Tüm siparişleri sıfırla'}
      </button>
    </div>
  );
};
