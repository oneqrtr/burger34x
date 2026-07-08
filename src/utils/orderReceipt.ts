import type { AdminOrder } from '../types';
import { formatTry } from './formatPrice';
import { publicAssetUrl } from './publicAssetUrl';

const SITE_URL = 'https://burger34.com.tr';

function qrImageUrl(target: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=8&data=${encodeURIComponent(target)}`;
}

function formatOrderDate(iso: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
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

export function buildOrderReceiptHtml(order: AdminOrder): string {
  const addressLine = [
    order.address.neighborhood,
    order.address.street,
    `Bina No: ${order.address.apartmentNo || '-'}`,
    order.address.buildingName ? `(${order.address.buildingName})` : '',
    `Kat: ${order.address.floor || '-'}`,
    `Daire: ${order.address.apartmentUnitNo || '-'}`,
  ]
    .filter(Boolean)
    .join(', ');

  const itemRows = order.items
    .map((item) => {
      const lineTotal = item.quantity * item.unitPrice;
      return `
        <tr>
          <td style="padding:8px 0;border-bottom:1px dashed #ddd;vertical-align:top;">
            <strong>${escapeHtml(item.name)}</strong>
            <div style="font-size:12px;color:#666;margin-top:2px;">${item.quantity} adet × ${formatTry(item.unitPrice)}</div>
          </td>
          <td style="padding:8px 0;border-bottom:1px dashed #ddd;text-align:right;vertical-align:top;font-weight:700;">
            ${formatTry(lineTotal)}
          </td>
        </tr>`;
    })
    .join('');

  const qrTarget = order.address.locationUrl?.trim() || SITE_URL;
  const qrLabel = order.address.locationUrl?.trim()
    ? 'Teslimat konumu (Google Maps)'
    : 'burger34.com.tr';

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>Sipariş #${order.orderNo}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; padding: 16px; max-width: 320px; }
    .brand { text-align: center; margin-bottom: 12px; }
    .brand-url { font-size: 13px; font-weight: 700; letter-spacing: 0.04em; margin-bottom: 6px; }
    .brand img { height: 44px; width: auto; }
    .meta { font-size: 12px; line-height: 1.5; margin-bottom: 10px; }
    .divider { border-top: 2px solid #111; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .total { display:flex; justify-content:space-between; font-size:16px; font-weight:800; margin-top:10px; }
    .qr { text-align:center; margin-top:14px; padding-top:10px; border-top:1px dashed #bbb; }
    .qr img { width:120px; height:120px; }
    .qr p { font-size:11px; color:#666; margin:6px 0 0; }
  </style>
</head>
<body>
  <div class="brand">
    <div class="brand-url">burger34.com.tr</div>
    <img src="${publicAssetUrl('/logo_final_vectorized.png')}" alt="Burger34" />
  </div>
  <div class="meta">
    <div><strong>Sipariş No:</strong> #${order.orderNo}</div>
    <div><strong>Tarih:</strong> ${formatOrderDate(order.createdAt)}</div>
    <div><strong>Müşteri:</strong> ${escapeHtml(order.customerName)}</div>
    <div><strong>Telefon:</strong> ${escapeHtml(order.phone)}</div>
    <div><strong>Ödeme:</strong> ${order.paymentMethod === 'cash' ? 'Nakit' : 'Kapıda Kredi Kartı'}</div>
    <div><strong>Adres:</strong> ${escapeHtml(addressLine)}</div>
    ${order.address.description ? `<div><strong>Not:</strong> ${escapeHtml(order.address.description)}</div>` : ''}
    ${order.note ? `<div><strong>Sipariş notu:</strong> ${escapeHtml(order.note)}</div>` : ''}
  </div>
  <div class="divider"></div>
  <table>${itemRows}</table>
  <div class="total"><span>TOPLAM</span><span>${formatTry(order.totalAmount)}</span></div>
  <div class="qr">
    <img src="${qrImageUrl(qrTarget)}" alt="QR" />
    <p>${escapeHtml(qrLabel)}</p>
  </div>
</body>
</html>`;
}

export function printOrderTicket(order: AdminOrder): void {
  const popup = window.open('', '_blank', 'width=480,height=900');
  if (!popup) return;
  popup.document.write(buildOrderReceiptHtml(order));
  popup.document.close();
  popup.focus();
  popup.print();
}
