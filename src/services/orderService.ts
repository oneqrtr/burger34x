import { getSupabaseBrowserClient } from "../lib/supabaseClient";
import type { AdminOrder, OrderAddress, OrderItemSnapshot, OrderPaymentMethod, PanelSettings, PublicOrderPayload } from "../types";

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
  };
}

export async function submitPublicOrder(payload: PublicOrderPayload): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase yapılandırması eksik.");

  const items = normalizeItems(payload.items);
  if (items.length === 0) throw new Error("Siparişte ürün bulunamadı.");

  const { error } = await supabase.rpc("create_public_order", {
    p_payload: {
      customer_name: payload.customerName.trim(),
      customer_phone: payload.phone.trim(),
      address_json: payload.address,
      payment_method: payload.paymentMethod,
      note: payload.note?.trim() || null,
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
};

export async function fetchPanelSettings(): Promise<PanelSettings> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return DEFAULT_SETTINGS;

  const { data, error } = await supabase
    .from("panel_settings")
    .select("notification_sound_enabled,auto_print_new_order")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) return DEFAULT_SETTINGS;
  return {
    notificationSoundEnabled: Boolean(data.notification_sound_enabled),
    autoPrintNewOrder: Boolean(data.auto_print_new_order),
  };
}

export async function savePanelSettings(next: PanelSettings): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase yapılandırması eksik.");

  const { error } = await supabase.from("panel_settings").upsert({
    id: 1,
    notification_sound_enabled: next.notificationSoundEnabled,
    auto_print_new_order: next.autoPrintNewOrder,
  });
  if (error) throw new Error(error.message || "Ayarlar kaydedilemedi.");
}
