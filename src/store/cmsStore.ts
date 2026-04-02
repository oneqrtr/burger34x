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
  /** false ise içerik API yerine cms.json / derleme paketinden geldi (statik canlı yayın). */
  cmsFromApi: boolean;
  fetchData: () => Promise<void>;
  updateData: (newData: CMSData) => Promise<boolean>;
}

export const useCMSStore = create<CMSStore>((set) => ({
  data: null,
  isLoading: true,
  loadError: null,
  cmsFromApi: false,
  fetchData: async () => {
    set({ isLoading: true, loadError: null });
    try {
      const { data, fromApi } = await getCMSData();
      set({
        data,
        isLoading: false,
        loadError: null,
        cmsFromApi: fromApi,
      });
    } catch (error) {
      console.error(error);
      set({
        data: cloneFallback(),
        isLoading: false,
        loadError:
          'İçerik yüklenirken beklenmeyen bir hata oluştu. Sayfayı yenileyin veya daha sonra tekrar deneyin.',
        cmsFromApi: false,
      });
    }
  },
  updateData: async (newData) => {
    try {
      await updateCMSData(newData);
      set({ data: newData, loadError: null, cmsFromApi: true });
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
