-- Paket sekmesi + kurye yönetimi + teslim edildi durumu
-- admin_auth_migration.sql sonrası SQL Editor'da çalıştırın.

create table if not exists public.couriers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  phone text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('new', 'preparing', 'cancelled', 'delivered'));

alter table public.orders add column if not exists courier_id uuid references public.couriers(id);
alter table public.orders add column if not exists actual_payment_method text
  check (actual_payment_method is null or actual_payment_method in ('cash', 'card_on_delivery'));
alter table public.orders add column if not exists delivered_at timestamptz;

create index if not exists idx_orders_delivered_at on public.orders(delivered_at desc);
create index if not exists idx_orders_courier_id on public.orders(courier_id);

alter table public.couriers enable row level security;
drop policy if exists "couriers_select_none" on public.couriers;
create policy "couriers_select_none" on public.couriers for select using (false);

drop trigger if exists trg_couriers_touch_updated_at on public.couriers;
create trigger trg_couriers_touch_updated_at
before update on public.couriers
for each row execute function public.touch_updated_at();

-- Sipariş listesi (kurye + teslim alanları dahil)
create or replace function public.get_admin_orders()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  perform public.require_admin();

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', o.id,
        'order_no', o.order_no,
        'customer_name', o.customer_name,
        'customer_phone', o.customer_phone,
        'address_json', o.address_json,
        'payment_method', o.payment_method,
        'actual_payment_method', o.actual_payment_method,
        'note', o.note,
        'status', o.status,
        'created_at', o.created_at,
        'delivered_at', o.delivered_at,
        'seen_by_admin', o.seen_by_admin,
        'total_amount', o.total_amount,
        'courier_id', o.courier_id,
        'courier_first_name', c.first_name,
        'courier_last_name', c.last_name,
        'courier_phone', c.phone,
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
  from public.orders o
  left join public.couriers c on c.id = o.courier_id;

  return result;
end;
$$;

-- Sipariş güncelle (teslim edilmiş siparişler değiştirilemez)
create or replace function public.update_order_admin(
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
  current_status text;
begin
  perform public.require_admin();

  select status into current_status from public.orders where id = p_order_id;
  if current_status is null then
    raise exception 'Sipariş bulunamadı.' using errcode = 'P0001';
  end if;
  if current_status = 'delivered' then
    raise exception 'Teslim edilmiş sipariş güncellenemez.' using errcode = 'P0001';
  end if;
  if current_status = 'preparing' and p_status = 'cancelled' then
    raise exception 'Paketteki sipariş iptal edilemez.' using errcode = 'P0001';
  end if;

  update public.orders
  set
    status = coalesce(p_status, status),
    seen_by_admin = coalesce(p_seen, seen_by_admin)
  where id = p_order_id;
end;
$$;

-- Teslim tamamla
create or replace function public.complete_order_delivery(
  p_order_id uuid,
  p_courier_id uuid,
  p_actual_payment_method text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status text;
  courier_active boolean;
begin
  perform public.require_admin();

  if p_actual_payment_method not in ('cash', 'card_on_delivery') then
    raise exception 'Geçerli bir ödeme yöntemi seçin.' using errcode = 'P0001';
  end if;

  select status into current_status from public.orders where id = p_order_id;
  if current_status is distinct from 'preparing' then
    raise exception 'Yalnızca hazırlanan siparişler teslim edilebilir.' using errcode = 'P0001';
  end if;

  select is_active into courier_active from public.couriers where id = p_courier_id;
  if courier_active is distinct from true then
    raise exception 'Seçilen kurye aktif değil.' using errcode = 'P0001';
  end if;

  update public.orders
  set
    status = 'delivered',
    courier_id = p_courier_id,
    actual_payment_method = p_actual_payment_method,
    delivered_at = now(),
    seen_by_admin = true
  where id = p_order_id;
end;
$$;

revoke all on function public.complete_order_delivery(uuid, uuid, text) from public;
grant execute on function public.complete_order_delivery(uuid, uuid, text) to authenticated;

-- Kuryeler
create or replace function public.get_admin_couriers()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  perform public.require_admin();

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'first_name', c.first_name,
        'last_name', c.last_name,
        'phone', c.phone,
        'is_active', c.is_active,
        'created_at', c.created_at
      )
      order by c.is_active desc, c.first_name, c.last_name
    ),
    '[]'::jsonb
  ) into result
  from public.couriers c;

  return result;
end;
$$;

revoke all on function public.get_admin_couriers() from public;
grant execute on function public.get_admin_couriers() to authenticated;

create or replace function public.upsert_courier_admin(
  p_courier_id uuid,
  p_first_name text,
  p_last_name text,
  p_phone text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  perform public.require_admin();

  if coalesce(trim(p_first_name), '') = '' or coalesce(trim(p_last_name), '') = '' then
    raise exception 'Ad ve soyad zorunludur.' using errcode = 'P0001';
  end if;
  if coalesce(trim(p_phone), '') = '' then
    raise exception 'Telefon zorunludur.' using errcode = 'P0001';
  end if;

  if p_courier_id is null then
    insert into public.couriers (first_name, last_name, phone)
    values (trim(p_first_name), trim(p_last_name), trim(p_phone))
    returning id into new_id;
    return new_id;
  end if;

  update public.couriers
  set
    first_name = trim(p_first_name),
    last_name = trim(p_last_name),
    phone = trim(p_phone),
    updated_at = now()
  where id = p_courier_id;

  return p_courier_id;
end;
$$;

revoke all on function public.upsert_courier_admin(uuid, text, text, text) from public;
grant execute on function public.upsert_courier_admin(uuid, text, text, text) to authenticated;

create or replace function public.set_courier_active_admin(
  p_courier_id uuid,
  p_is_active boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_admin();

  update public.couriers
  set is_active = coalesce(p_is_active, is_active), updated_at = now()
  where id = p_courier_id;
end;
$$;

revoke all on function public.set_courier_active_admin(uuid, boolean) from public;
grant execute on function public.set_courier_active_admin(uuid, boolean) to authenticated;

-- Günlük teslimat özeti (Dashboard)
create or replace function public.get_daily_delivery_report(p_day date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
  day_start timestamptz := p_day::timestamptz;
  day_end timestamptz := (p_day + 1)::timestamptz;
begin
  perform public.require_admin();

  select jsonb_build_object(
    'day', p_day,
    'delivery_count', count(*)::int,
    'total_revenue', coalesce(sum(o.total_amount), 0),
    'cash_total', coalesce(sum(o.total_amount) filter (where o.actual_payment_method = 'cash'), 0),
    'card_total', coalesce(sum(o.total_amount) filter (where o.actual_payment_method = 'card_on_delivery'), 0),
    'payment_mismatch_count', count(*) filter (where o.payment_method is distinct from o.actual_payment_method)::int,
    'by_courier', coalesce((
      select jsonb_agg(row order by (row->>'courier_name'))
      from (
        select jsonb_build_object(
          'courier_id', c.id,
          'courier_name', c.first_name || ' ' || c.last_name,
          'courier_phone', c.phone,
          'delivery_count', count(*)::int,
          'total_revenue', coalesce(sum(o2.total_amount), 0),
          'cash_count', count(*) filter (where o2.actual_payment_method = 'cash')::int,
          'card_count', count(*) filter (where o2.actual_payment_method = 'card_on_delivery')::int
        ) as row
        from public.orders o2
        join public.couriers c on c.id = o2.courier_id
        where o2.status = 'delivered'
          and o2.delivered_at >= day_start
          and o2.delivered_at < day_end
        group by c.id, c.first_name, c.last_name, c.phone
      ) sub
    ), '[]'::jsonb),
    'deliveries', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'order_id', o3.id,
          'order_no', o3.order_no,
          'customer_name', o3.customer_name,
          'total_amount', o3.total_amount,
          'payment_method', o3.payment_method,
          'actual_payment_method', o3.actual_payment_method,
          'courier_name', c3.first_name || ' ' || c3.last_name,
          'delivered_at', o3.delivered_at
        )
        order by o3.delivered_at desc
      )
      from public.orders o3
      left join public.couriers c3 on c3.id = o3.courier_id
      where o3.status = 'delivered'
        and o3.delivered_at >= day_start
        and o3.delivered_at < day_end
    ), '[]'::jsonb)
  ) into result
  from public.orders o
  where o.status = 'delivered'
    and o.delivered_at >= day_start
    and o.delivered_at < day_end;

  if result is null then
    result := jsonb_build_object(
      'day', p_day,
      'delivery_count', 0,
      'total_revenue', 0,
      'cash_total', 0,
      'card_total', 0,
      'payment_mismatch_count', 0,
      'by_courier', '[]'::jsonb,
      'deliveries', '[]'::jsonb
    );
  end if;

  return result;
end;
$$;

revoke all on function public.get_daily_delivery_report(date) from public;
grant execute on function public.get_daily_delivery_report(date) to authenticated;

-- Dashboard ciro: teslim edilenler delivered statüsünde sayılır
create or replace function public.get_order_dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  all_time_count int;
  all_time_revenue numeric(12,2);
  monthly jsonb;
begin
  perform public.require_admin();

  select count(*), coalesce(sum(total_amount), 0)
  into all_time_count, all_time_revenue
  from public.orders
  where status = 'delivered';

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
      extract(year from coalesce(o.delivered_at, o.created_at))::int as year,
      extract(month from coalesce(o.delivered_at, o.created_at))::int as month,
      to_char(date_trunc('month', coalesce(o.delivered_at, o.created_at)), 'TMMonth YYYY') as label,
      count(*)::int as order_count,
      coalesce(sum(o.total_amount), 0)::numeric(12,2) as revenue
    from public.orders o
    where o.status = 'delivered'
      and coalesce(o.delivered_at, o.created_at) >= date_trunc('month', now()) - interval '11 months'
    group by 1, 2, 3
  ) m;

  return jsonb_build_object(
    'all_time_order_count', all_time_count,
    'all_time_revenue', all_time_revenue,
    'monthly', monthly
  );
end;
$$;
