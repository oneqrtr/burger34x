import React, { useState } from 'react';
import { Plus, Save } from 'lucide-react';
import type { Courier } from '../../types';
import { saveCourier, setCourierActive } from '../../services/orderService';

interface CouriersSettingsSectionProps {
  couriers: Courier[];
  onRefresh: () => Promise<void>;
}

export const CouriersSettingsSection: React.FC<CouriersSettingsSectionProps> = ({
  couriers,
  onRefresh,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFirst, setEditFirst] = useState('');
  const [editLast, setEditLast] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await saveCourier(null, firstName, lastName, phone);
      setFirstName('');
      setLastName('');
      setPhone('');
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (c: Courier) => {
    setEditingId(c.id);
    setEditFirst(c.firstName);
    setEditLast(c.lastName);
    setEditPhone(c.phone);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    setError('');
    try {
      await saveCourier(editingId, editFirst, editLast, editPhone);
      setEditingId(null);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: Courier) => {
    try {
      await setCourierActive(c.id, !c.isActive);
      await onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Güncellenemedi.');
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
      <h4 className="font-black flex items-center gap-2">
        <Plus className="w-4 h-4" /> Kuryeler
      </h4>

      <form onSubmit={(e) => void handleAdd(e)} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Ad"
          required
          className="bg-dark-bg rounded-lg px-3 py-2 text-sm"
        />
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Soyad"
          required
          className="bg-dark-bg rounded-lg px-3 py-2 text-sm"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Telefon"
          required
          className="bg-dark-bg rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={saving}
          className="sm:col-span-3 bg-burgundy text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" /> Kurye ekle
        </button>
      </form>

      {error ? <p className="text-red-400 text-xs">{error}</p> : null}

      <div className="space-y-2">
        {couriers.length === 0 ? (
          <p className="text-sm text-white/50">Henüz kurye eklenmedi.</p>
        ) : (
          couriers.map((c) => (
            <div
              key={c.id}
              className={`rounded-lg px-3 py-3 ${c.isActive ? 'bg-dark-bg' : 'bg-dark-bg/50 opacity-60'}`}
            >
              {editingId === c.id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <input value={editFirst} onChange={(e) => setEditFirst(e.target.value)} className="bg-white/5 rounded px-2 py-1 text-sm" />
                    <input value={editLast} onChange={(e) => setEditLast(e.target.value)} className="bg-white/5 rounded px-2 py-1 text-sm" />
                    <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="bg-white/5 rounded px-2 py-1 text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => void saveEdit()} className="text-xs bg-burgundy px-3 py-1 rounded font-bold">Kaydet</button>
                    <button type="button" onClick={() => setEditingId(null)} className="text-xs bg-white/10 px-3 py-1 rounded">Vazgeç</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-sm">{c.firstName} {c.lastName}</p>
                    <p className="text-xs text-white/50">{c.phone}</p>
                    {!c.isActive ? <span className="text-[10px] uppercase text-white/40">Pasif</span> : null}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => startEdit(c)} className="text-xs bg-white/10 px-2 py-1 rounded">Düzenle</button>
                    <button
                      type="button"
                      onClick={() => void toggleActive(c)}
                      className="text-xs bg-white/10 px-2 py-1 rounded"
                    >
                      {c.isActive ? 'Pasif yap' : 'Aktif yap'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
