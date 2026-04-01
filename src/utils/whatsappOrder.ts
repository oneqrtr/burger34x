/** Türkiye cep için WhatsApp numarası (sadece rakamlar, ülke kodu 90 ile). */
export function getWhatsAppOrderNumber(phoneFromCms: string): string | null {
  const envRaw = import.meta.env.VITE_WHATSAPP_ORDER_NUMBER as string | undefined;
  const envDigits = envRaw?.replace(/\D/g, "") ?? "";
  if (envDigits.length >= 10) return envDigits;

  const d = phoneFromCms.replace(/\D/g, "");
  if (d.length === 10 && /^5\d{9}$/.test(d)) return `90${d}`;
  if (d.length === 11 && d.startsWith("0") && /^05\d{9}$/.test(d)) return `90${d.slice(1)}`;
  if (d.length === 12 && d.startsWith("90") && d[2] === "5") return d;
  return null;
}
