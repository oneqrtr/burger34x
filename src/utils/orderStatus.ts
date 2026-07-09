import type { OrderPaymentMethod, OrderStatus } from '../types';

export function orderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'new':
      return 'Yeni';
    case 'preparing':
      return 'Hazırlanıyor';
    case 'delivered':
      return 'Teslim edildi';
    case 'cancelled':
      return 'İptal';
    default:
      return status;
  }
}

export function paymentMethodLabel(method: OrderPaymentMethod): string {
  return method === 'cash' ? 'Nakit' : 'Kapıda kredi kartı';
}

export function hasPaymentMismatch(
  ordered: OrderPaymentMethod,
  actual?: OrderPaymentMethod | null,
): boolean {
  if (!actual) return false;
  return ordered !== actual;
}
