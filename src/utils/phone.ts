export function normalizeTrPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}
