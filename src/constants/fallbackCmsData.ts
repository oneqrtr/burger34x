import { CMSData } from "../types";

export const fallbackCmsData: CMSData = {
  hero: {
    title: "Burger34",
    subtitle: "Gerçek burger. Gerçek lezzet.",
  },
  about: {
    title: "Istanbul'dan Bursa'ya uzanan lezzet.",
    content:
      "Burger34, Istanbul'da kurulan bir restoran olarak gercek burger tutkusuyla yola cikti. Kisa surede kendine sadik bir lezzet cizgisi olusturdu ve bu hikayeyi buyutmek icin rotasini Bursa Mustafakemalpasa'ya cevirdi.\n\nBugun Mustafakemalpasa'da, ilk gunden beri benimsedigimiz kalite anlayisiyla hizmet veriyoruz: ozenle secilen malzeme, dengeli receteler ve her tabakta ayni standart. Bizim icin burger sadece bir urun degil, her misafire ayni ozeni hissettiren bir deneyim.",
    image: "/logo_final.png",
    stats: [
      { label: "Kurulus", value: "Istanbul" },
      { label: "Yeni durak", value: "Bursa MKP" },
    ],
  },
  contact: {
    address: "Gece Sokağı No: 34, Kadıköy / İstanbul",
    email: "merhaba@burger34.com",
    phone: "+90 (212) 555 34 34",
  },
  ui: {
    aboutLabel: "Hakkımızda",
    newsLabel: "Haberler",
    blogSectionTitle: "Gece notları",
    footerDescription: "Fine dining ruhu, rahat bir ortamda. Modern lezzet tutkunları için seçkin burger deneyimi.",
    socialLinks: [
      { id: "instagram", label: "Instagram", url: "", enabled: true },
      { id: "facebook", label: "Facebook", url: "", enabled: true },
      { id: "x", label: "X (Twitter)", url: "", enabled: true },
    ],
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
