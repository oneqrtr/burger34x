import { getSupabaseBrowserClient } from "../lib/supabaseClient";
import { formatMonthLabel } from "../utils/orderDate";
import type {
  AdminOrder,
  CustomerRecord,
  DashboardStats,
  NotificationSoundKey,
  OrderAddress,
  OrderItemSnapshot,
  OrderPaymentMethod,
  PanelSettings,
  PublicOrderPayload,
} from "../types";

const ADMIN_PIN = "131094";

function adminPin(): string {
  const raw = import.meta.env.VITE_ADMIN_CMS_PASSWORD as string | undefined;
  return (raw && raw.trim()) || ADMIN_PIN;
}

type OrderRow = {
  id: string;
  order_no: number;
  customer_name: string;
  customer_phone: string;
  address_json: OrderAddress;
  payment_method: OrderPaymentMethod;
  note: string | null;
  status: "new" | "preparing" | "cancelled";
  created_at: string;
  seen_by_admin: boolean;
  total_amount: number;
  order_items?: Array<{
    product_id: string;
    item_name_snapshot: string;
    unit_price_snapshot: number;
    quantity: number;
  }>;
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
    seenByAdmin: row.seen_by_admin,
    totalAmount: row.total_amount,
    kvkkAccepted: true,
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
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase yapılandırması eksik.");

  const { data, error } = await supabase.rpc("get_admin_orders", {
    p_password: adminPin(),
  });
  if (error) throw new Error(error.message || "Siparişler yüklenemedi.");
  return ((data || []) as OrderRow[]).map(rowToOrder);
}

export async function fetchAdminCustomers(): Promise<CustomerRecord[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase yapılandırması eksik.");

  const { data, error } = await supabase.rpc("get_admin_customers", {
    p_password: adminPin(),
  });
  if (error) throw new Error(error.message || "Müşteriler yüklenemedi.");
  return ((data || []) as CustomerRow[]).map(rowToCustomer);
}

export async function updateCustomerRecord(
  customerId: string,
  name: string,
  phone: string,
  address: OrderAddress,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase yapılandırması eksik.");

  const { error } = await supabase.rpc("update_customer_admin", {
    p_password: adminPin(),
    p_customer_id: customerId,
    p_name: name.trim(),
    p_phone: phone.trim(),
    p_address_json: address,
  });
  if (error) throw new Error(error.message || "Müşteri güncellenemedi.");
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase yapılandırması eksik.");

  const { data, error } = await supabase.rpc("get_order_dashboard_stats", {
    p_password: adminPin(),
  });
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
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase yapılandırması eksik.");

  const { error } = await supabase.rpc("update_order_admin", {
    p_password: adminPin(),
    p_order_id: orderId,
    p_status: status,
    p_seen: true,
  });
  if (error) throw new Error(error.message || "Sipariş durumu güncellenemedi.");
}

export async function markOrdersSeen(orderIds: string[]): Promise<void> {
  if (orderIds.length === 0) return;
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase yapılandırması eksik.");

  for (const id of orderIds) {
    const { error } = await supabase.rpc("update_order_admin", {
      p_password: adminPin(),
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
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase yapılandırması eksik.");

  const { error } = await supabase.from("panel_settings").upsert({
    id: 1,
    notification_sound_enabled: next.notificationSoundEnabled,
    auto_print_new_order: next.autoPrintNewOrder,
    notification_sound_key: next.notificationSoundKey,
  });
  if (error) throw new Error(error.message || "Ayarlar kaydedilemedi.");
}
