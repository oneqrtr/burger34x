import React, { useState } from 'react';
import { Save } from 'lucide-react';
import type { CustomerRecord, OrderAddress } from '../../types';
import { updateCustomerRecord } from '../../services/orderService';

interface CustomersSectionProps {
  customers: CustomerRecord[];
  onRefresh: () => Promise<void>;
}

const EMPTY_ADDRESS: OrderAddress = {
  neighborhood: '',
  street: '',
  apartmentNo: '',
  buildingName: '',
  floor: '',
  apartmentUnitNo: '',
  description: '',
  locationUrl: null,
};

export const CustomersSection: React.FC<CustomersSectionProps> = ({ customers, onRefresh }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState<OrderAddress>(EMPTY_ADDRESS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const startEdit = (customer: CustomerRecord) => {
    setEditingId(customer.id);
    setName(customer.name);
    setPhone(customer.phone);
    setAddress({ ...EMPTY_ADDRESS, ...customer.address });
    setError('');
  };

  const save = async () => {
    if (!editingId) return;
    setSaving(true);
    setError('');
    try {
      await updateCustomerRecord(editingId, name, phone, address);
      setEditingId(null);
      await onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {customers.length === 0 ? (
        <p className="text-white/50 text-sm">Henüz kayıtlı müşteri yok.</p>
      ) : (
        customers.map((customer) => (
          <div key={customer.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
            {editingId === customer.id ? (
              <div className="space-y-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-dark-bg rounded-lg px-3 py-2 text-sm"
                  placeholder="Ad soyad"
                />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-dark-bg rounded-lg px-3 py-2 text-sm"
                  placeholder="Telefon"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input value={address.neighborhood} onChange={(e) => setAddress((a) => ({ ...a, neighborhood: e.target.value }))} className="bg-dark-bg rounded-lg px-3 py-2 text-sm" placeholder="Mahalle" />
                  <input value={address.street} onChange={(e) => setAddress((a) => ({ ...a, street: e.target.value }))} className="bg-dark-bg rounded-lg px-3 py-2 text-sm" placeholder="Sokak/Cadde" />
                  <input value={address.apartmentNo} onChange={(e) => setAddress((a) => ({ ...a, apartmentNo: e.target.value }))} className="bg-dark-bg rounded-lg px-3 py-2 text-sm" placeholder="Bina No" />
                  <input value={address.apartmentUnitNo} onChange={(e) => setAddress((a) => ({ ...a, apartmentUnitNo: e.target.value }))} className="bg-dark-bg rounded-lg px-3 py-2 text-sm" placeholder="Daire No" />
                  <input value={address.floor} onChange={(e) => setAddress((a) => ({ ...a, floor: e.target.value }))} className="bg-dark-bg rounded-lg px-3 py-2 text-sm" placeholder="Kat" />
                  <input value={address.buildingName} onChange={(e) => setAddress((a) => ({ ...a, buildingName: e.target.value }))} className="bg-dark-bg rounded-lg px-3 py-2 text-sm" placeholder="Apartman adı" />
                </div>
                <textarea
                  value={address.description}
                  onChange={(e) => setAddress((a) => ({ ...a, description: e.target.value }))}
                  className="w-full bg-dark-bg rounded-lg px-3 py-2 text-sm h-20"
                  placeholder="Adres notu"
                />
                {error ? <p className="text-red-400 text-xs">{error}</p> : null}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void save()}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-burgundy text-sm font-bold flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> {saving ? 'Kaydediliyor…' : 'Kaydet'}
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className="px-4 py-2 rounded-lg bg-white/10 text-sm">
                    Vazgeç
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="font-black">{customer.name}</p>
                    <p className="text-sm text-white/60">{customer.phone}</p>
                    <p className="text-xs text-white/40 mt-1">
                      {customer.address.neighborhood}, {customer.address.street}, Bina: {customer.address.apartmentNo || '-'},
                      Kat: {customer.address.floor || '-'}, Daire: {customer.address.apartmentUnitNo || '-'}
                    </p>
                  </div>
                  <div className="text-right text-xs text-white/50">
                    <p>{customer.orderCount} sipariş</p>
                    {customer.lastOrderAt ? (
                      <p>Son: {new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short' }).format(new Date(customer.lastOrderAt))}</p>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(customer)}
                  className="mt-3 px-3 py-2 text-xs rounded-lg bg-white/10 hover:bg-white/20"
                >
                  Düzenle
                </button>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
};
