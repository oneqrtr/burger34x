import type { Product } from '../types';

export function isProductVisible(product: Product): boolean {
  return !product.isHidden;
}

export function visibleProducts(products: Product[]): Product[] {
  return products.filter(isProductVisible);
}
