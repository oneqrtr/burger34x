export interface HeroData {
  title: string;
  subtitle: string;
}

export interface AboutStat {
  label: string;
  value: string;
}

export interface AboutData {
  title: string;
  content: string;
  image: string;
  stats: AboutStat[];
}

export interface ContactData {
  address: string;
  email: string;
  phone: string;
}

export interface SocialLink {
  id: string;
  label: string;
  url: string;
  enabled: boolean;
}

export interface UIContent {
  aboutLabel: string;
  blogSectionTitle: string;
  /** Sokak sanatı bölümü giriş metni */
  blogIntro: string;
  /** Marka sütunu — Burger34 altı kısa metin */
  footerDescription: string;
  /** İletişim sütunundaki özet (konum + sipariş satırı) */
  footerContactBlurb: string;
  socialLinks: SocialLink[];
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isBestSeller: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
}

export interface Promotion {
  id: string;
  title: string;
  content: string;
}

export interface CMSData {
  hero: HeroData;
  about: AboutData;
  contact: ContactData;
  ui: UIContent;
  categories: Category[];
  products: Product[];
  blog: BlogPost[];
  promotions: Promotion[];
}

export type OrderPaymentMethod = "cash" | "card_on_delivery";
export type OrderStatus = "new" | "preparing" | "cancelled";

export interface OrderAddress {
  neighborhood: string;
  street: string;
  apartmentNo: string;
  buildingName: string;
  description: string;
  locationUrl?: string | null;
}

export interface OrderItemSnapshot {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface PublicOrderPayload {
  customerName: string;
  phone: string;
  address: OrderAddress;
  paymentMethod: OrderPaymentMethod;
  items: OrderItemSnapshot[];
  note?: string;
}

export interface AdminOrder extends PublicOrderPayload {
  id: string;
  orderNo: number;
  status: OrderStatus;
  createdAt: string;
  seenByAdmin: boolean;
  totalAmount: number;
}

export interface PanelSettings {
  notificationSoundEnabled: boolean;
  autoPrintNewOrder: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}
