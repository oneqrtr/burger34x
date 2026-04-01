import { create } from 'zustand';
import { CMSData } from '../types';
import { getCMSData, updateCMSData } from '../services/cmsService';

interface CMSStore {
  data: CMSData | null;
  isLoading: boolean;
  fetchData: () => Promise<void>;
  updateData: (newData: CMSData) => Promise<void>;
}

export const useCMSStore = create<CMSStore>((set) => ({
  data: null,
  isLoading: true,
  fetchData: async () => {
    set({ isLoading: true });
    try {
      const data = await getCMSData();
      set({ data, isLoading: false });
    } catch (error) {
      console.error(error);
      set({ isLoading: false });
    }
  },
  updateData: async (newData) => {
    try {
      await updateCMSData(newData);
      set({ data: newData });
    } catch (error) {
      console.error(error);
    }
  },
}));
