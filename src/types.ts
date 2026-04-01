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
  stats: AboutStat[];
}

export interface ContactData {
  address: string;
  email: string;
  phone: string;
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
  categories: Category[];
  products: Product[];
  blog: BlogPost[];
  promotions: Promotion[];
}

export interface CartItem extends Product {
  quantity: number;
}
