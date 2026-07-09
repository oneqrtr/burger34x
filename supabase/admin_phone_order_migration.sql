-- Admin panelden telefon / paket siparişi
-- paket_courier_migration.sql sonrası SQL Editor'da çalıştırın.

alter table public.orders add column if not exists order_source text not null default 'web'
  check (order_source in ('web', 'admin'));

create index if not exists idx_orders_order_source on public.orders(order_source);

create or replace function public.create_admin_order(p_payload jsonb)
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
begin
  perform public.require_admin();

  normalized_phone := public.normalize_tr_phone(p_payload->>'customer_phone');
  if normalized_phone is null or length(normalized_phone) < 10 then
    raise exception 'Geçerli bir telefon numarası girin.' using errcode = 'P0001';
  end if;

  if coalesce(trim(p_payload->>'customer_name'), '') = '' then
    raise exception 'Müşteri adı gereklidir.' using errcode = 'P0001';
  end if;

  insert into public.orders (
    customer_name,
    customer_phone,
    address_json,
    payment_method,
    note,
    status,
    seen_by_admin,
    order_source,
    total_amount
  )
  values (
    trim(p_payload->>'customer_name'),
    trim(p_payload->>'customer_phone'),
    coalesce(p_payload->'address_json', '{}'::jsonb),
    coalesce(p_payload->>'payment_method', 'cash'),
    nullif(trim(p_payload->>'note'), ''),
    'new',
    true,
    'admin',
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

  if not exists (select 1 from public.order_items where order_id = new_order_id) then
    delete from public.orders where id = new_order_id;
    raise exception 'Siparişte ürün bulunamadı.' using errcode = 'P0001';
  end if;

  select coalesce(sum(line_total), 0) into subtotal from public.order_items where order_id = new_order_id;
  update public.orders set total_amount = subtotal where id = new_order_id;

  insert into public.customers (phone, name, address_json, kvkk_accepted_at, order_count, last_order_at)
  values (
    normalized_phone,
    trim(p_payload->>'customer_name'),
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

revoke all on function public.create_admin_order(jsonb) from public;
grant execute on function public.create_admin_order(jsonb) to authenticated;

-- Sipariş listesine order_source ekle
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
        'order_source', o.order_source,
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
