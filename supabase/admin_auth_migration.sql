-- Burger34 Admin Auth: Supabase e-posta + şifre (JWT)
-- Önce Supabase Dashboard → Authentication → Users ile admin kullanıcı oluşturun.
-- Sign ups kapalı olsun. SQL Editor'da bu dosyayı bir kez çalıştırın.

-- Eski PIN tabanlı fonksiyonları kaldır
drop function if exists public.merge_site_cms(text, jsonb);
drop function if exists public.get_admin_orders(text);
drop function if exists public.update_order_admin(text, uuid, text, boolean);
drop function if exists public.get_admin_customers(text);
drop function if exists public.update_customer_admin(text, uuid, text, text, jsonb);
drop function if exists public.get_order_dashboard_stats(text);

create or replace function public.require_admin()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Unauthorized' using errcode = 'P0001';
  end if;
end;
$$;

-- CMS kayıt (yalnızca giriş yapmış admin)
create or replace function public.merge_site_cms(p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_admin();

  update public.cms_content
  set data = p_payload
  where id = 1;

  if not found then
    insert into public.cms_content (id, data) values (1, p_payload);
  end if;
end;
$$;

revoke all on function public.merge_site_cms(jsonb) from public;
grant execute on function public.merge_site_cms(jsonb) to authenticated;

-- Sipariş listesi
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

revoke all on function public.get_admin_orders() from public;
grant execute on function public.get_admin_orders() to authenticated;

-- Sipariş güncelle
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
begin
  perform public.require_admin();

  update public.orders
  set
    status = coalesce(p_status, status),
    seen_by_admin = coalesce(p_seen, seen_by_admin)
  where id = p_order_id;
end;
$$;

revoke all on function public.update_order_admin(uuid, text, boolean) from public;
grant execute on function public.update_order_admin(uuid, text, boolean) to authenticated;

-- Müşteriler
create or replace function public.get_admin_customers()
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

revoke all on function public.get_admin_customers() from public;
grant execute on function public.get_admin_customers() to authenticated;

create or replace function public.update_customer_admin(
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
  normalized_phone text;
begin
  perform public.require_admin();

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

revoke all on function public.update_customer_admin(uuid, text, text, jsonb) from public;
grant execute on function public.update_customer_admin(uuid, text, text, jsonb) to authenticated;

-- Dashboard
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

revoke all on function public.get_order_dashboard_stats() from public;
grant execute on function public.get_order_dashboard_stats() to authenticated;

-- Realtime + panel ayarları: yalnızca giriş yapmış admin
drop policy if exists "orders_select_authenticated" on public.orders;
create policy "orders_select_authenticated"
  on public.orders for select
  to authenticated
  using (true);

drop policy if exists "panel_settings_upsert" on public.panel_settings;
drop policy if exists "panel_settings_admin_write" on public.panel_settings;
create policy "panel_settings_admin_write"
  on public.panel_settings for all
  to authenticated
  using (true)
  with check (true);

-- Realtime publication (çoğu projede zaten açıktır)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
     ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end;
$$;
