import type { OrderAddress } from '../types';

const STORAGE_KEY = 'burger34-customer-profile';

export interface StoredCustomerProfile {
  name: string;
  phone: string;
  address: OrderAddress;
  kvkkAcceptedAt: string | null;
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

export function loadCustomerProfile(): StoredCustomerProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredCustomerProfile;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      name: parsed.name || '',
      phone: parsed.phone || '',
      address: { ...EMPTY_ADDRESS, ...(parsed.address || {}) },
      kvkkAcceptedAt: parsed.kvkkAcceptedAt || null,
    };
  } catch {
    return null;
  }
}

export function saveCustomerProfile(profile: StoredCustomerProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function hasKvkkConsent(): boolean {
  return Boolean(loadCustomerProfile()?.kvkkAcceptedAt);
}
