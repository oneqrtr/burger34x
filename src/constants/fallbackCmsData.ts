import { CMSData } from "../types";

export const fallbackCmsData: CMSData = {
  hero: {
    title: "Burger34",
    subtitle: "Gerçek burger. Gerçek lezzet.",
  },
  about: {
    title: "Sıradan Köftenin Ötesinde.",
    content:
      "Burger34 bir toplantı odasında doğmadı. Neon ışıklı bir sokakta, saat 03:00'te doğdu.",
    stats: [
      { label: "Gizli baharat", value: "34" },
      { label: "Çayır otlatma", value: "%100" },
    ],
  },
  contact: {
    address: "Gece Sokağı No: 34, Kadıköy / İstanbul",
    email: "merhaba@burger34.com",
    phone: "+90 (212) 555 34 34",
  },
  categories: [
    { id: "burgers", name: "Burgerler" },
    { id: "chicken", name: "Tavuk" },
    { id: "drinks", name: "İçecekler" },
    { id: "extras", name: "Ekstralar" },
  ],
  products: [],
  blog: [],
  promotions: [],
};
