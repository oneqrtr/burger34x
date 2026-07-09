import React from 'react';
import { X, Printer, CheckCircle2 } from 'lucide-react';
import type { AdminOrder } from '../../types';
import { formatTry } from '../../utils/formatPrice';
import { buildCustomerReceiptHtml, printAllOrderTickets } from '../../utils/orderReceipt';
import { formatOrderDateLabel } from './orderFormat';

interface OrderDetailModalProps {
  order: AdminOrder;
  onClose: () => void;
  onConfirm?: () => void;
  readOnly?: boolean;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, onClose, onConfirm, readOnly }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-dark-bg shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h3 className="text-xl font-black">Sipariş #{order.orderNo}</h3>
            <p className="text-xs text-white/50">{formatOrderDateLabel(order.createdAt)}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/10" aria-label="Kapat">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 flex-grow overflow-hidden">
          <div className="p-5 overflow-y-auto space-y-3 text-sm border-b lg:border-b-0 lg:border-r border-white/10">
            <p><strong>Müşteri:</strong> {order.customerName}</p>
            <p><strong>Telefon:</strong> {order.phone}</p>
            <p><strong>Ödeme:</strong> {order.paymentMethod === 'cash' ? 'Nakit' : 'Kapıda Kredi Kartı'}</p>
            <p>
              <strong>Adres:</strong>{' '}
              {order.address.neighborhood}, {order.address.street}, Bina No: {order.address.apartmentNo || '-'}
              {order.address.buildingName ? ` (${order.address.buildingName})` : ''}, Kat: {order.address.floor || '-'},
              Daire: {order.address.apartmentUnitNo || '-'}
            </p>
            {order.address.description ? <p><strong>Adres notu:</strong> {order.address.description}</p> : null}
            {order.note ? <p><strong>Sipariş notu:</strong> {order.note}</p> : null}
            <ul className="space-y-2 pt-2">
              {order.items.map((item) => (
                <li key={`${item.productId}-${item.name}`} className="flex justify-between gap-3">
                  <span>{item.name} × {item.quantity}</span>
                  <span className="shrink-0">{formatTry(item.quantity * item.unitPrice)}</span>
                </li>
              ))}
            </ul>
            <p className="text-orange-accent font-black pt-2">Toplam: {formatTry(order.totalAmount)}</p>
          </div>

          <div className="p-5 bg-white/5 overflow-y-auto">
            <p className="text-xs uppercase tracking-widest text-white/40 mb-3">Müşteri fişi önizleme</p>
            <iframe
              title={`Müşteri fişi #${order.orderNo}`}
              srcDoc={buildCustomerReceiptHtml(order)}
              className="w-full h-[420px] bg-white rounded-lg border border-white/10"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 px-5 py-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => void printAllOrderTickets(order)}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-bold flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> 3 Fiş Yazdır
          </button>
          {order.status === 'new' && !readOnly && onConfirm ? (
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-sm font-bold flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Onayla
            </button>
          ) : null}
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-bold ml-auto">
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
