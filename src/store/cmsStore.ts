import { create } from 'zustand';
import { CMSData } from '../types';
import { getCMSData, updateCMSData } from '../services/cmsService';
import { fallbackCmsData } from '../constants/fallbackCmsData';

function cloneFallback(): CMSData {
  return JSON.parse(JSON.stringify(fallbackCmsData)) as CMSData;
}

interface CMSStore {
  data: CMSData | null;
  isLoading: boolean;
  loadError: string | null;
  fetchData: () => Promise<void>;
  updateData: (newData: CMSData) => Promise<boolean>;
}

export const useCMSStore = create<CMSStore>((set) => ({
  data: null,
  isLoading: true,
  loadError: null,
  fetchData: async () => {
    set({ isLoading: true, loadError: null });
    try {
      const data = await getCMSData();
      set({ data, isLoading: false, loadError: null });
    } catch (error) {
      console.error(error);
      set({
        data: cloneFallback(),
        isLoading: false,
        loadError:
          'İçerik sunucudan yüklenemedi. Şablon açıldı; canlı sitede API yoksa Kaydet çalışmaz. Bağlantınızı veya sunucu yapılandırmasını kontrol edin.',
      });
    }
  },
  updateData: async (newData) => {
    try {
      await updateCMSData(newData);
      set({ data: newData, loadError: null });
      return true;
    } catch (error) {
      console.error(error);
      set({
        loadError:
          'Kayıt başarısız. Sunucu (/api/cms) erişilemiyor veya şifre reddedildi.',
      });
      return false;
    }
  },
}));
