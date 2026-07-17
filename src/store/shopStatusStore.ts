import { create } from 'zustand';
import { fetchShopStatus } from '../services/orderService';
import { getSupabaseBrowserClient } from '../lib/supabaseClient';

interface ShopStatusState {
  deliveryOpen: boolean;
  loaded: boolean;
  fetchStatus: () => Promise<void>;
  setDeliveryOpen: (open: boolean) => void;
}

export const useShopStatusStore = create<ShopStatusState>((set) => ({
  deliveryOpen: true,
  loaded: false,
  fetchStatus: async () => {
    try {
      const status = await fetchShopStatus();
      set({ deliveryOpen: status.deliveryOpen, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
  setDeliveryOpen: (open) => set({ deliveryOpen: open }),
}));

export function subscribeShopStatusRealtime(): () => void {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return () => undefined;

  const channel = supabase
    .channel('shop-status-realtime')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'panel_settings' },
      () => {
        void useShopStatusStore.getState().fetchStatus();
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
