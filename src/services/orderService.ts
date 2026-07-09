import { getSupabaseBrowserClient } from "../lib/supabaseClient";
import { requireAdminClient } from "../lib/requireAdminClient";
import { formatMonthLabel } from "../utils/orderDate";
import type {
  AdminOrder,
  Courier,
  CustomerRecord,
  DailyDeliveryReport,
  DashboardStats,
  NotificationSoundKey,
  OrderAddress,
  OrderItemSnapshot,
  OrderPaymentMethod,
  OrderStatus,
  PanelSettings,
  PublicOrderPayload,
} from "../types";

type OrderRow = {
  id: string;
  order_no: number;
  customer_name: string;
  customer_phone: string;
  address_json: OrderAddress;
  payment_method: OrderPaymentMethod;
  actual_payment_method: OrderPaymentMethod | null;
  note: string | null;
  status: OrderStatus;
  created_at: string;
  delivered_at: string | null;
  seen_by_admin: boolean;
  total_amount: number;
  courier_id: string | null;
  courier_first_name: string | null;
  courier_last_name: string | null;
  courier_phone: string | null;
  order_items?: Array<{
    product_id: string;
    item_name_snapshot: string;
    unit_price_snapshot: number;
    quantity: number;
  }>;
};

type CourierRow = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_active: boolean;
  created_at: string;
};

type CustomerRow = {
  id: string;
  phone: string;
  name: string;
  address_json: OrderAddress;
  kvkk_accepted_at: string | null;
  order_count: number;
  last_order_at: string | null;
  created_at: string;
};

function normalizeItems(items: OrderItemSnapshot[]): OrderItemSnapshot[] {
  return items
    .filter((i) => i.quantity > 0)
    .map((i) => ({
      productId: i.productId,
      name: i.name,
      unitPrice: Number(i.unitPrice),
      quantity: Number(i.quantity),
    }));
}

function rowToOrder(row: OrderRow): AdminOrder {
  const items = (row.order_items || []).map((it) => ({
    productId: it.product_id,
    name: it.item_name_snapshot,
    unitPrice: it.unit_price_snapshot,
    quantity: it.quantity,
  }));

  return {
    id: row.id,
    orderNo: row.order_no,
    customerName: row.customer_name,
    phone: row.customer_phone,
    address: row.address_json,
    paymentMethod: row.payment_method,
    note: row.note || "",
    items,
    status: row.status,
    createdAt: row.created_at,
    deliveredAt: row.delivered_at,
    seenByAdmin: row.seen_by_admin,
    totalAmount: row.total_amount,
    actualPaymentMethod: row.actual_payment_method,
    courierId: row.courier_id,
    courierFirstName: row.courier_first_name,
    courierLastName: row.courier_last_name,
    courierPhone: row.courier_phone,
    kvkkAccepted: true,
  };
}

function rowToCourier(row: CourierRow): Courier {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function rowToCustomer(row: CustomerRow): CustomerRecord {
  return {
    id: row.id,
    phone: row.phone,
    name: row.name,
    address: row.address_json,
    kvkkAcceptedAt: row.kvkk_accepted_at,
    orderCount: row.order_count,
    lastOrderAt: row.last_order_at,
    createdAt: row.created_at,
  };
}

export async function submitPublicOrder(payload: PublicOrderPayload): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase yapılandırması eksik.");

  if (payload.website?.trim()) throw new Error("Geçersiz istek.");
  if (!payload.kvkkAccepted) throw new Error("KVKK onayı gereklidir.");

  const items = normalizeItems(payload.items);
  if (items.length === 0) throw new Error("Siparişte ürün bulunamadı.");

  const { error } = await supabase.rpc("create_public_order", {
    p_payload: {
      customer_name: payload.customerName.trim(),
      customer_phone: payload.phone.trim(),
      address_json: payload.address,
      payment_method: payload.paymentMethod,
      note: payload.note?.trim() || null,
      kvkk_accepted: payload.kvkkAccepted,
      website: payload.website || "",
      items: items.map((i) => ({
        product_id: i.productId,
        item_name_snapshot: i.name,
        unit_price_snapshot: i.unitPrice,
        quantity: i.quantity,
      })),
    },
  });

  if (error) throw new Error(error.message || "Sipariş gönderilemedi.");
}

export async function fetchAdminOrders(): Promise<AdminOrder[]> {
  const supabase = await requireAdminClient();

  const { data, error } = await supabase.rpc("get_admin_orders");
  if (error) throw new Error(error.message || "Siparişler yüklenemedi.");
  return ((data || []) as OrderRow[]).map(rowToOrder);
}

export async function fetchAdminCustomers(): Promise<CustomerRecord[]> {
  const supabase = await requireAdminClient();

  const { data, error } = await supabase.rpc("get_admin_customers");
  if (error) throw new Error(error.message || "Müşteriler yüklenemedi.");
  return ((data || []) as CustomerRow[]).map(rowToCustomer);
}

export async function updateCustomerRecord(
  customerId: string,
  name: string,
  phone: string,
  address: OrderAddress,
): Promise<void> {
  const supabase = await requireAdminClient();

  const { error } = await supabase.rpc("update_customer_admin", {
    p_customer_id: customerId,
    p_name: name.trim(),
    p_phone: phone.trim(),
    p_address_json: address,
  });
  if (error) throw new Error(error.message || "Müşteri güncellenemedi.");
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const supabase = await requireAdminClient();

  const { data, error } = await supabase.rpc("get_order_dashboard_stats");
  if (error) throw new Error(error.message || "Dashboard yüklenemedi.");

  const raw = (data || {}) as {
    all_time_order_count?: number;
    all_time_revenue?: number;
    monthly?: Array<{
      year: number;
      month: number;
      label: string;
      order_count: number;
      revenue: number;
    }>;
  };

  return {
    allTimeOrderCount: Number(raw.all_time_order_count || 0),
    allTimeRevenue: Number(raw.all_time_revenue || 0),
    monthly: (raw.monthly || []).map((m) => ({
      year: m.year,
      month: m.month,
      label: formatMonthLabel(m.year, m.month - 1),
      orderCount: m.order_count,
      revenue: Number(m.revenue),
    })),
  };
}

export async function setOrderStatus(orderId: string, status: "preparing" | "cancelled"): Promise<void> {
  const supabase = await requireAdminClient();

  const { error } = await supabase.rpc("update_order_admin", {
    p_order_id: orderId,
    p_status: status,
    p_seen: true,
  });
  if (error) throw new Error(error.message || "Sipariş durumu güncellenemedi.");
}

export async function markOrdersSeen(orderIds: string[]): Promise<void> {
  if (orderIds.length === 0) return;
  const supabase = await requireAdminClient();

  for (const id of orderIds) {
    const { error } = await supabase.rpc("update_order_admin", {
      p_order_id: id,
      p_status: null,
      p_seen: true,
    });
    if (error) throw new Error(error.message || "Siparişler görüldü olarak işaretlenemedi.");
  }
}

const DEFAULT_SETTINGS: PanelSettings = {
  notificationSoundEnabled: true,
  autoPrintNewOrder: false,
  notificationSoundKey: "sound1",
};

function parseSoundKey(value: unknown): NotificationSoundKey {
  if (value === "sound2" || value === "sound3") return value;
  return "sound1";
}

export async function fetchPanelSettings(): Promise<PanelSettings> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return DEFAULT_SETTINGS;

  const { data, error } = await supabase
    .from("panel_settings")
    .select("notification_sound_enabled,auto_print_new_order,notification_sound_key")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) return DEFAULT_SETTINGS;
  return {
    notificationSoundEnabled: Boolean(data.notification_sound_enabled),
    autoPrintNewOrder: Boolean(data.auto_print_new_order),
    notificationSoundKey: parseSoundKey(data.notification_sound_key),
  };
}

export async function savePanelSettings(next: PanelSettings): Promise<void> {
  const supabase = await requireAdminClient();

  const { error } = await supabase.from("panel_settings").upsert({
    id: 1,
    notification_sound_enabled: next.notificationSoundEnabled,
    auto_print_new_order: next.autoPrintNewOrder,
    notification_sound_key: next.notificationSoundKey,
  });
  if (error) throw new Error(error.message || "Ayarlar kaydedilemedi.");
}

export async function fetchCouriers(): Promise<Courier[]> {
  const supabase = await requireAdminClient();
  const { data, error } = await supabase.rpc("get_admin_couriers");
  if (error) throw new Error(error.message || "Kuryeler yüklenemedi.");
  return ((data || []) as CourierRow[]).map(rowToCourier);
}

export async function saveCourier(
  courierId: string | null,
  firstName: string,
  lastName: string,
  phone: string,
): Promise<void> {
  const supabase = await requireAdminClient();
  const { error } = await supabase.rpc("upsert_courier_admin", {
    p_courier_id: courierId,
    p_first_name: firstName.trim(),
    p_last_name: lastName.trim(),
    p_phone: phone.trim(),
  });
  if (error) throw new Error(error.message || "Kurye kaydedilemedi.");
}

export async function setCourierActive(courierId: string, isActive: boolean): Promise<void> {
  const supabase = await requireAdminClient();
  const { error } = await supabase.rpc("set_courier_active_admin", {
    p_courier_id: courierId,
    p_is_active: isActive,
  });
  if (error) throw new Error(error.message || "Kurye durumu güncellenemedi.");
}

export async function completeOrderDelivery(
  orderId: string,
  courierId: string,
  actualPaymentMethod: OrderPaymentMethod,
): Promise<void> {
  const supabase = await requireAdminClient();
  const { error } = await supabase.rpc("complete_order_delivery", {
    p_order_id: orderId,
    p_courier_id: courierId,
    p_actual_payment_method: actualPaymentMethod,
  });
  if (error) throw new Error(error.message || "Teslimat kaydedilemedi.");
}

export async function fetchDailyDeliveryReport(dayIso: string): Promise<DailyDeliveryReport> {
  const supabase = await requireAdminClient();
  const { data, error } = await supabase.rpc("get_daily_delivery_report", { p_day: dayIso });
  if (error) throw new Error(error.message || "Günlük rapor yüklenemedi.");

  const raw = (data || {}) as {
    day?: string;
    delivery_count?: number;
    total_revenue?: number;
    cash_total?: number;
    card_total?: number;
    payment_mismatch_count?: number;
    by_courier?: Array<{
      courier_id: string;
      courier_name: string;
      courier_phone: string;
      delivery_count: number;
      total_revenue: number;
      cash_count: number;
      card_count: number;
    }>;
    deliveries?: Array<{
      order_id: string;
      order_no: number;
      customer_name: string;
      total_amount: number;
      payment_method: OrderPaymentMethod;
      actual_payment_method: OrderPaymentMethod;
      courier_name: string;
      delivered_at: string;
    }>;
  };

  return {
    day: raw.day || dayIso,
    deliveryCount: Number(raw.delivery_count || 0),
    totalRevenue: Number(raw.total_revenue || 0),
    cashTotal: Number(raw.cash_total || 0),
    cardTotal: Number(raw.card_total || 0),
    paymentMismatchCount: Number(raw.payment_mismatch_count || 0),
    byCourier: (raw.by_courier || []).map((c) => ({
      courierId: c.courier_id,
      courierName: c.courier_name,
      courierPhone: c.courier_phone,
      deliveryCount: c.delivery_count,
      totalRevenue: Number(c.total_revenue),
      cashCount: c.cash_count,
      cardCount: c.card_count,
    })),
    deliveries: (raw.deliveries || []).map((d) => ({
      orderId: d.order_id,
      orderNo: d.order_no,
      customerName: d.customer_name,
      totalAmount: Number(d.total_amount),
      paymentMethod: d.payment_method,
      actualPaymentMethod: d.actual_payment_method,
      courierName: d.courier_name,
      deliveredAt: d.delivered_at,
    })),
  };
}
