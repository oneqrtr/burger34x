import { CMSData } from "../types";

export const fallbackCmsData: CMSData = {
  hero: {
    title: "Burger34",
    subtitle: "Gerçek burger. Gerçek lezzet.",
  },
  about: {
    title: "MKP sokaklarında hakiki burger.",
    content:
      "Burger34, tutkulu bir ekip ve net bir fikirle yola çıktı: sokağın enerjisini, sahici malzemeler ve bol çeşitle buluşturan bir burger deneyimi. Hamzabey, Bursa Caddesi üzerinde Mustafakemalpaşa'da misafirlerimizi ağırlıyoruz.\n\nKöfteden tavuğa her üründe aynı disiplin var: taze hazırlık, dengeli soslar ve abartısız ama iddialı lezzet. Bizim için Burger34 yalnızca bir menü değil; mahallenin tempolu gününe eşlik eden, geceye uzanan bir durak.",
    image: "/logo_final.png",
    stats: [
      { label: "Konum", value: "Mustafakemalpaşa" },
      { label: "Çizgi", value: "Sokak lezzeti" },
    ],
  },
  contact: {
    address: "Hamzabey, Bursa Cd. No. 144/A, 16500 Mustafakemalpaşa/Bursa",
    email: "",
    phone: "0552 669 05 55",
  },
  ui: {
    aboutLabel: "Hakkımızda",
    blogSectionTitle: "Sokak sanatı",
    blogIntro:
      "Gece şehri değil, bizim şehir: sokak kültürü, renk, müzik ve kısa duraklar. Burada sokak sanatı dediğimiz şey, tabaktaki detay kadar sokağın kendi ritmi — paylaşılan bir an, bir kahkaha, bir burger molası.",
    footerDescription:
      "Sokak lezzetini tabağa taşıyoruz — taze, çıtır, samimi. MKP'de her ısırdıkta aynı özen.",
    footerContactBlurb:
      "Mustafakemalpaşa (Bursa) burger ve sokak lezzetleri. Hamzabey, Bursa Cd. Sipariş: 0552 669 05 55.",
    socialLinks: [
      {
        id: "instagram",
        label: "Instagram",
        url: "https://www.instagram.com/burger34.mkp/",
        enabled: true,
      },
    ],
  },
  categories: [],
  products: [],
  blog: [],
  promotions: [],
};
