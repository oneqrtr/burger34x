-- Paket servisi aç/kapa + özel bildirim sesi
-- Supabase SQL Editor'da çalıştırın.

alter table public.panel_settings
  add column if not exists delivery_auto_schedule boolean not null default true,
  add column if not exists delivery_open_time time not null default '12:00',
  add column if not exists delivery_close_time time not null default '22:00',
  add column if not exists delivery_open boolean not null default true,
  add column if not exists delivery_manual_closed_on date,
  add column if not exists delivery_force_open boolean not null default false,
  add column if not exists notification_sound_custom_url text;

alter table public.panel_settings
  drop constraint if exists panel_settings_notification_sound_key_check;

alter table public.panel_settings
  add constraint panel_settings_notification_sound_key_check
  check (notification_sound_key in ('sound1', 'sound2', 'sound3', 'custom'));

create or replace function public.is_delivery_open()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  s record;
  now_local time;
  today_local date;
  in_hours boolean;
begin
  select * into s from public.panel_settings where id = 1;
  if not found then
    return true;
  end if;

  now_local := (timezone('Europe/Istanbul', now()))::time;
  today_local := (timezone('Europe/Istanbul', now()))::date;
  in_hours := now_local >= s.delivery_open_time and now_local < s.delivery_close_time;

  if not s.delivery_auto_schedule then
    return coalesce(s.delivery_open, true);
  end if;

  if coalesce(s.delivery_force_open, false) then
    if now_local < s.delivery_close_time then
      return true;
    end if;
  end if;

  if s.delivery_manual_closed_on = today_local and in_hours then
    return false;
  end if;

  return in_hours;
end;
$$;

create or replace function public.get_shop_status()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return jsonb_build_object('delivery_open', public.is_delivery_open());
end;
$$;

revoke all on function public.get_shop_status() from public;
grant execute on function public.get_shop_status() to anon, authenticated;

create or replace function public.set_delivery_open(p_open boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  s record;
  now_local time;
  today_local date;
  in_hours boolean;
begin
  perform public.require_admin();

  select * into s from public.panel_settings where id = 1;
  if not found then
    raise exception 'Panel ayarları bulunamadı.' using errcode = 'P0001';
  end if;

  now_local := (timezone('Europe/Istanbul', now()))::time;
  today_local := (timezone('Europe/Istanbul', now()))::date;
  in_hours := now_local >= s.delivery_open_time and now_local < s.delivery_close_time;

  if not s.delivery_auto_schedule then
    update public.panel_settings
    set delivery_open = p_open
    where id = 1;
    return;
  end if;

  if p_open then
    update public.panel_settings
    set
      delivery_manual_closed_on = null,
      delivery_force_open = not in_hours
    where id = 1;
  else
    update public.panel_settings
    set
      delivery_manual_closed_on = today_local,
      delivery_force_open = false
    where id = 1;
  end if;
end;
$$;

revoke all on function public.set_delivery_open(boolean) from public;
grant execute on function public.set_delivery_open(boolean) to authenticated;

-- create_public_order: paket servisi kapalıysa engelle
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
  if not public.is_delivery_open() then
    raise exception 'Restoran şu an paket servise kapalı.' using errcode = 'P0001';
  end if;

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
    last_order_at = now();

  return new_order_id;
end;
$$;

-- Realtime: ana site paket durumu değişikliğini dinleyebilsin
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'panel_settings'
     ) then
    alter publication supabase_realtime add table public.panel_settings;
  end if;
end;
$$;
