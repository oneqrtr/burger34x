-- Burger34 Sipariş Paneli SQL (Supabase SQL Editor)
-- Şimdilik admin auth yerine PIN + RPC yaklaşımı kullanılır.

create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no bigint generated always as identity unique,
  customer_name text not null,
  customer_phone text not null,
  address_json jsonb not null,
  payment_method text not null check (payment_method in ('cash', 'card_on_delivery')),
  note text,
  status text not null default 'new' check (status in ('new', 'preparing', 'cancelled')),
  seen_by_admin boolean not null default false,
  total_amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  item_name_snapshot text not null,
  unit_price_snapshot numeric(12,2) not null,
  quantity int not null check (quantity > 0),
  line_total numeric(12,2) generated always as (unit_price_snapshot * quantity) stored
);

create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_order_items_order_id on public.order_items(order_id);

create table if not exists public.panel_settings (
  id int primary key,
  notification_sound_enabled boolean not null default true,
  auto_print_new_order boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.panel_settings (id) values (1) on conflict (id) do nothing;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_orders_touch_updated_at on public.orders;
create trigger trg_orders_touch_updated_at
before update on public.orders
for each row execute function public.touch_updated_at();

drop trigger if exists trg_panel_settings_touch_updated_at on public.panel_settings;
create trigger trg_panel_settings_touch_updated_at
before update on public.panel_settings
for each row execute function public.touch_updated_at();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.panel_settings enable row level security;

-- Public sipariş ekleme
drop policy if exists "orders_public_insert" on public.orders;
create policy "orders_public_insert"
  on public.orders for insert
  with check (true);

drop policy if exists "order_items_public_insert" on public.order_items;
create policy "order_items_public_insert"
  on public.order_items for insert
  with check (true);

-- Admin PIN ile tüm siparişleri okuyabilir/güncelleyebilir (RPC + SECURITY DEFINER)
drop policy if exists "orders_select_none" on public.orders;
create policy "orders_select_none"
  on public.orders for select
  using (false);

drop policy if exists "orders_update_none" on public.orders;
create policy "orders_update_none"
  on public.orders for update
  using (false)
  with check (false);

drop policy if exists "order_items_select_none" on public.order_items;
create policy "order_items_select_none"
  on public.order_items for select
  using (false);

drop policy if exists "panel_settings_select_none" on public.panel_settings;
create policy "panel_settings_select_none"
  on public.panel_settings for select
  using (true);

drop policy if exists "panel_settings_upsert" on public.panel_settings;
create policy "panel_settings_upsert"
  on public.panel_settings for all
  using (true)
  with check (true);

-- Public sipariş oluşturma RPC
create or replace function public.create_public_order(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_order_id uuid;
  item jsonb;
  subtotal numeric(12,2) := 0;
begin
  insert into public.orders (
    customer_name, customer_phone, address_json, payment_method, note, status, seen_by_admin, total_amount
  )
  values (
    coalesce(trim(p_payload->>'customer_name'), ''),
    coalesce(trim(p_payload->>'customer_phone'), ''),
    coalesce(p_payload->'address_json', '{}'::jsonb),
    coalesce(p_payload->>'payment_method', 'cash'),
    nullif(trim(p_payload->>'note'), ''),
    'new',
    false,
    0
  )
  returning id into new_order_id;

  for item in select * from jsonb_array_elements(coalesce(p_payload->'items', '[]'::jsonb))
  loop
    insert into public.order_items(order_id, product_id, item_name_snapshot, unit_price_snapshot, quantity)
    values (
      new_order_id,
      coalesce(item->>'product_id', ''),
      coalesce(item->>'item_name_snapshot', ''),
      coalesce((item->>'unit_price_snapshot')::numeric, 0),
      greatest(coalesce((item->>'quantity')::int, 1), 1)
    );
  end loop;

  select coalesce(sum(line_total), 0) into subtotal from public.order_items where order_id = new_order_id;
  update public.orders set total_amount = subtotal where id = new_order_id;

  return new_order_id;
end;
$$;

revoke all on function public.create_public_order(jsonb) from public;
grant execute on function public.create_public_order(jsonb) to anon;
grant execute on function public.create_public_order(jsonb) to authenticated;

-- Admin okuma RPC (PIN kontrollü)
create or replace function public.get_admin_orders(p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  expected text := '131094';
  result jsonb;
begin
  if p_password is distinct from expected then
    raise exception 'Unauthorized' using errcode = 'P0001';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', o.id,
        'order_no', o.order_no,
        'customer_name', o.customer_name,
        'customer_phone', o.customer_phone,
        'address_json', o.address_json,
        'payment_method', o.payment_method,
        'note', o.note,
        'status', o.status,
        'created_at', o.created_at,
        'seen_by_admin', o.seen_by_admin,
        'total_amount', o.total_amount,
        'order_items', (
          select coalesce(jsonb_agg(jsonb_build_object(
            'product_id', oi.product_id,
            'item_name_snapshot', oi.item_name_snapshot,
            'unit_price_snapshot', oi.unit_price_snapshot,
            'quantity', oi.quantity
          )), '[]'::jsonb)
          from public.order_items oi
          where oi.order_id = o.id
        )
      )
      order by o.created_at desc
    ),
    '[]'::jsonb
  ) into result
  from public.orders o;

  return result;
end;
$$;

revoke all on function public.get_admin_orders(text) from public;
grant execute on function public.get_admin_orders(text) to anon;
grant execute on function public.get_admin_orders(text) to authenticated;

-- Admin update RPC (durum + seen)
create or replace function public.update_order_admin(
  p_password text,
  p_order_id uuid,
  p_status text,
  p_seen boolean default true
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  expected text := '131094';
begin
  if p_password is distinct from expected then
    raise exception 'Unauthorized' using errcode = 'P0001';
  end if;

  update public.orders
  set
    status = coalesce(p_status, status),
    seen_by_admin = coalesce(p_seen, seen_by_admin)
  where id = p_order_id;
end;
$$;

revoke all on function public.update_order_admin(text, uuid, text, boolean) from public;
grant execute on function public.update_order_admin(text, uuid, text, boolean) to anon;
grant execute on function public.update_order_admin(text, uuid, text, boolean) to authenticated;
