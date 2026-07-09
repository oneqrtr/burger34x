import type { AdminOrder } from '../types';
import { formatTry } from './formatPrice';
import { publicAssetUrl } from '../utils/publicAssetUrl';

const SITE_URL = 'https://burger34.com.tr';
const LOGO_URL = publicAssetUrl('/logo_final_vectorized.png');

export type ParsedOrderItem = {
  productId: string;
  displayName: string;
  removedIngredients: string[];
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

function qrImageUrl(target: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=8&data=${encodeURIComponent(target)}`;
}

function formatReceiptDate(iso: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(iso));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function parseOrderItemName(rawName: string): { displayName: string; removedIngredients: string[] } {
  const match = rawName.match(/^(.+?)\s*\(Çıkarılacaklar:\s*(.+)\)\s*$/);
  if (!match) {
    return { displayName: rawName.trim(), removedIngredients: [] };
  }
  return {
    displayName: match[1].trim(),
    removedIngredients: match[2]
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean),
  };
}

export function parseOrderItems(order: AdminOrder): ParsedOrderItem[] {
  return order.items.map((item) => {
    const parsed = parseOrderItemName(item.name);
    return {
      productId: item.productId,
      displayName: parsed.displayName,
      removedIngredients: parsed.removedIngredients,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.quantity * item.unitPrice,
    };
  });
}

function receiptStyles(): string {
  return `
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; padding: 16px; max-width: 320px; }
    .brand { text-align: center; margin-bottom: 10px; }
    .brand-title { font-size: 18px; font-weight: 800; letter-spacing: 0.08em; margin-bottom: 4px; }
    .brand-url { font-size: 12px; font-weight: 700; letter-spacing: 0.04em; margin-top: 6px; }
    .brand img { height: 42px; width: auto; display: block; margin: 0 auto; }
    .divider { border-top: 2px solid #111; margin: 10px 0; }
    .divider-thin { border-top: 1px dashed #bbb; margin: 8px 0; }
    .meta { font-size: 12px; line-height: 1.55; }
    .item { margin-bottom: 10px; }
    .item-name { font-weight: 700; font-size: 13px; }
    .item-sub { font-size: 11px; color: #444; margin-top: 2px; }
    .item-row { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; margin-top: 3px; }
    .total { display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; margin-top: 8px; }
    .qr { text-align: center; margin-top: 12px; padding-top: 10px; border-top: 1px dashed #bbb; }
    .qr img { width: 110px; height: 110px; }
    .qr p { font-size: 11px; color: #444; margin: 6px 0 0; line-height: 1.4; }
    .footer-msg { text-align: center; font-size: 12px; font-weight: 700; margin-top: 10px; }
    .kitchen-title { text-align: center; font-size: 14px; font-weight: 800; letter-spacing: 0.12em; margin-top: 4px; }
  `;
}

function brandHeader(subtitle?: string): string {
  return `
    <div class="brand">
      <div class="brand-title">BURGER34</div>
      <img src="${LOGO_URL}" alt="Burger34" />
      <div class="brand-url">burger34.com.tr</div>
      ${subtitle ? `<div class="kitchen-title">${escapeHtml(subtitle)}</div>` : ''}
    </div>`;
}

function formatAddress(order: AdminOrder): string {
  const parts = [
    order.address.neighborhood,
    order.address.street,
    `Bina No: ${order.address.apartmentNo || '-'}`,
    order.address.buildingName ? `(${order.address.buildingName})` : '',
    `Kat: ${order.address.floor || '-'}`,
    `Daire: ${order.address.apartmentUnitNo || '-'}`,
  ].filter(Boolean);
  let line = parts.join(', ');
  if (order.address.description?.trim()) {
    line += `\nNot: ${order.address.description.trim()}`;
  }
  return line;
}

/** Fiş 1 — Müşteri */
export function buildCustomerReceiptHtml(order: AdminOrder): string {
  const items = parseOrderItems(order);
  const itemBlocks = items
    .map(
      (item) => `
      <div class="item">
        <div class="item-name">${escapeHtml(item.displayName)}</div>
        ${item.removedIngredients.length > 0
          ? `<div class="item-sub">Çıkarılacak: ${escapeHtml(item.removedIngredients.join(', '))}</div>`
          : ''}
        <div class="item-row">
          <span>${item.quantity} adet × ${formatTry(item.unitPrice)}</span>
          <span>${formatTry(item.lineTotal)}</span>
        </div>
      </div>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>Müşteri fişi</title>
  <style>${receiptStyles()}</style>
</head>
<body>
  ${brandHeader()}
  <div class="divider"></div>
  <div class="meta" style="text-align:center;margin-bottom:8px;">${formatReceiptDate(order.createdAt)}</div>
  <div class="divider"></div>
  ${itemBlocks}
  <div class="divider"></div>
  <div class="total"><span>TOPLAM</span><span>${formatTry(order.totalAmount)}</span></div>
  <div class="divider"></div>
  <div class="qr">
    <img src="${qrImageUrl(SITE_URL)}" alt="QR" />
    <p>Daha fazla lezzet için<br/>QR kodu okutun</p>
  </div>
  <div class="footer-msg">Afiyet olsun</div>
</body>
</html>`;
}

/** Fiş 2 — Mutfak */
export function buildKitchenReceiptHtml(order: AdminOrder): string {
  const items = parseOrderItems(order);
  const itemBlocks = items
    .map(
      (item) => `
      <div class="item">
        <div class="item-name">${escapeHtml(item.displayName)} × ${item.quantity}</div>
        ${item.removedIngredients.length > 0
          ? `<div class="item-sub">Çıkar: ${escapeHtml(item.removedIngredients.join(', '))}</div>`
          : ''}
      </div>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>Mutfak fişi</title>
  <style>${receiptStyles()}</style>
</head>
<body>
  ${brandHeader('MUTFAK')}
  <div class="divider"></div>
  <div class="meta" style="text-align:center;">${formatReceiptDate(order.createdAt)}</div>
  <div class="divider"></div>
  ${itemBlocks}
  ${order.note?.trim()
    ? `<div class="divider-thin"></div><div class="item-sub"><strong>Sipariş notu:</strong> ${escapeHtml(order.note.trim())}</div>`
    : ''}
</body>
</html>`;
}

/** Fiş 3 — Kurye / teslimat */
export function buildDeliveryReceiptHtml(order: AdminOrder): string {
  const items = parseOrderItems(order);
  const locationUrl = order.address.locationUrl?.trim() || '';
  const paymentLabel = order.paymentMethod === 'cash' ? 'Nakit' : 'Kapıda Kredi Kartı';

  const itemBlocks = items
    .map(
      (item) => `
      <div class="item">
        <div class="item-row">
          <span><strong>${escapeHtml(item.displayName)}</strong> × ${item.quantity}</span>
          <span>${formatTry(item.lineTotal)}</span>
        </div>
        ${item.removedIngredients.length > 0
          ? `<div class="item-sub">Çıkar: ${escapeHtml(item.removedIngredients.join(', '))}</div>`
          : ''}
      </div>`,
    )
    .join('');

  const qrBlock = locationUrl
    ? `
  <div class="divider"></div>
  <div class="qr">
    <img src="${qrImageUrl(locationUrl)}" alt="Konum QR" />
    <p>Teslimat konumu</p>
  </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>Kurye fişi</title>
  <style>${receiptStyles()}</style>
</head>
<body>
  ${brandHeader()}
  <div class="divider"></div>
  <div class="meta" style="text-align:center;">${formatReceiptDate(order.createdAt)}</div>
  <div class="divider"></div>
  <div class="meta">
    <div><strong>${escapeHtml(order.customerName)}</strong></div>
    <div>${escapeHtml(order.phone)}</div>
  </div>
  <div class="divider-thin"></div>
  <div class="meta" style="white-space:pre-line;">${escapeHtml(formatAddress(order))}</div>
  <div class="divider"></div>
  ${itemBlocks}
  <div class="divider"></div>
  <div class="total"><span>TOPLAM</span><span>${formatTry(order.totalAmount)}</span></div>
  <div class="meta" style="margin-top:8px;"><strong>Ödeme:</strong> ${paymentLabel}</div>
  ${order.note?.trim()
    ? `<div class="meta" style="margin-top:6px;"><strong>Sipariş notu:</strong> ${escapeHtml(order.note.trim())}</div>`
    : ''}
  ${qrBlock}
</body>
</html>`;
}

/** Modal önizleme — müşteri fişi */
export function buildOrderReceiptHtml(order: AdminOrder): string {
  return buildCustomerReceiptHtml(order);
}

function printHtmlDocument(html: string, title: string): Promise<void> {
  return new Promise((resolve) => {
    const popup = window.open('', '_blank', 'width=480,height=900');
    if (!popup) {
      resolve();
      return;
    }

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      try {
        popup.close();
      } catch {
        /* ignore */
      }
      resolve();
    };

    popup.document.write(html);
    popup.document.title = title;
    popup.document.close();
    popup.focus();

    popup.onafterprint = finish;
    window.setTimeout(finish, 4000);
    popup.print();
  });
}

/** Müşteri → Mutfak → Kurye sırayla yazdır */
export async function printAllOrderTickets(order: AdminOrder): Promise<void> {
  await printHtmlDocument(buildCustomerReceiptHtml(order), 'Müşteri fişi');
  await printHtmlDocument(buildKitchenReceiptHtml(order), 'Mutfak fişi');
  await printHtmlDocument(buildDeliveryReceiptHtml(order), 'Kurye fişi');
}

/** @deprecated Tek fiş — printAllOrderTickets kullanın */
export function printOrderTicket(order: AdminOrder): void {
  void printAllOrderTickets(order);
}
