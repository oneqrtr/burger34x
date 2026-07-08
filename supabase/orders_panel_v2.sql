-- Burger34 sipariş paneli v2: müşteriler, rate limit, dashboard, bildirim sesi
-- Supabase SQL Editor'da çalıştırın (orders_panel_setup.sql sonrası).

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  name text not null,
  address_json jsonb not null default '{}'::jsonb,
  kvkk_accepted_at timestamptz,
  order_count int not null default 0,
  last_order_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customers_last_order_at on public.customers(last_order_at desc);

alter table public.customers enable row level security;

drop policy if exists "customers_select_none" on public.customers;
create policy "customers_select_none"
  on public.customers for select
  using (false);

drop policy if exists "customers_insert_none" on public.customers;
create policy "customers_insert_none"
  on public.customers for insert
  with check (false);

drop policy if exists "customers_update_none" on public.customers;
create policy "customers_update_none"
  on public.customers for update
  using (false)
  with check (false);

alter table public.panel_settings
  add column if not exists notification_sound_key text not null default 'sound1'
  check (notification_sound_key in ('sound1', 'sound2', 'sound3'));

create or replace function public.normalize_tr_phone(p_phone text)
returns text
language sql
immutable
as $$
  select nullif(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), '');
$$;

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
  normalized_phone text;
  recent_count int;
begin
  if coalesce(trim(p_payload->>'website'), '') <> '' then
    raise exception 'Geçersiz istek.' using errcode = 'P0001';
  end if;

  if coalesce((p_payload->>'kvkk_accepted')::boolean, false) is not true then
    raise exception 'KVKK onayı gereklidir.' using errcode = 'P0001';
  end if;

  normalized_phone := public.normalize_tr_phone(p_payload->>'customer_phone');
  if normalized_phone is null or length(normalized_phone) < 10 then
    raise exception 'Geçerli bir telefon numarası girin.' using errcode = 'P0001';
  end if;

  select count(*) into recent_count
  from public.orders o
  where public.normalize_tr_phone(o.customer_phone) = normalized_phone
    and o.created_at > now() - interval '1 hour';

  if recent_count >= 2 then
    raise exception 'Bu telefon numarası ile son 1 saat içinde en fazla 2 sipariş verilebilir.' using errcode = 'P0001';
  end if;

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

  insert into public.customers (phone, name, address_json, kvkk_accepted_at, order_count, last_order_at)
  values (
    normalized_phone,
    coalesce(trim(p_payload->>'customer_name'), ''),
    coalesce(p_payload->'address_json', '{}'::jsonb),
    now(),
    1,
    now()
  )
  on conflict (phone) do update
  set
    name = excluded.name,
    address_json = excluded.address_json,
    kvkk_accepted_at = coalesce(public.customers.kvkk_accepted_at, excluded.kvkk_accepted_at),
    order_count = public.customers.order_count + 1,
    last_order_at = now(),
    updated_at = now();

  return new_order_id;
end;
$$;

create or replace function public.get_admin_customers(p_password text)
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
        'id', c.id,
        'phone', c.phone,
        'name', c.name,
        'address_json', c.address_json,
        'kvkk_accepted_at', c.kvkk_accepted_at,
        'order_count', c.order_count,
        'last_order_at', c.last_order_at,
        'created_at', c.created_at
      )
      order by c.last_order_at desc nulls last
    ),
    '[]'::jsonb
  ) into result
  from public.customers c;

  return result;
end;
$$;

create or replace function public.update_customer_admin(
  p_password text,
  p_customer_id uuid,
  p_name text,
  p_phone text,
  p_address_json jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  expected text := '131094';
  normalized_phone text;
begin
  if p_password is distinct from expected then
    raise exception 'Unauthorized' using errcode = 'P0001';
  end if;

  normalized_phone := public.normalize_tr_phone(p_phone);
  if normalized_phone is null or length(normalized_phone) < 10 then
    raise exception 'Geçerli bir telefon numarası girin.' using errcode = 'P0001';
  end if;

  update public.customers
  set
    name = coalesce(trim(p_name), name),
    phone = normalized_phone,
    address_json = coalesce(p_address_json, address_json),
    updated_at = now()
  where id = p_customer_id;
end;
$$;

create or replace function public.get_order_dashboard_stats(p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  expected text := '131094';
  all_time_count int;
  all_time_revenue numeric(12,2);
  monthly jsonb;
begin
  if p_password is distinct from expected then
    raise exception 'Unauthorized' using errcode = 'P0001';
  end if;

  select count(*), coalesce(sum(total_amount), 0)
  into all_time_count, all_time_revenue
  from public.orders
  where status <> 'cancelled';

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'year', m.year,
        'month', m.month,
        'label', m.label,
        'order_count', m.order_count,
        'revenue', m.revenue
      )
      order by m.year desc, m.month desc
    ),
    '[]'::jsonb
  ) into monthly
  from (
    select
      extract(year from o.created_at)::int as year,
      extract(month from o.created_at)::int as month,
      to_char(date_trunc('month', o.created_at), 'TMMonth YYYY') as label,
      count(*)::int as order_count,
      coalesce(sum(o.total_amount), 0)::numeric(12,2) as revenue
    from public.orders o
    where o.status <> 'cancelled'
      and o.created_at >= date_trunc('month', now()) - interval '11 months'
    group by 1, 2, 3
  ) m;

  return jsonb_build_object(
    'all_time_order_count', all_time_count,
    'all_time_revenue', all_time_revenue,
    'monthly', monthly
  );
end;
$$;

revoke all on function public.get_admin_customers(text) from public;
grant execute on function public.get_admin_customers(text) to anon, authenticated;

revoke all on function public.update_customer_admin(text, uuid, text, text, jsonb) from public;
grant execute on function public.update_customer_admin(text, uuid, text, text, jsonb) to anon, authenticated;

revoke all on function public.get_order_dashboard_stats(text) from public;
grant execute on function public.get_order_dashboard_stats(text) to anon, authenticated;
