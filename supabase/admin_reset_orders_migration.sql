-- Tüm siparişleri sıfırla (müşteri + menü dokunulmaz, dashboard siparişlerden hesaplanır)
-- admin_phone_order_migration.sql sonrası SQL Editor'da çalıştırın.

create or replace function public.reset_orders_admin(p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count int;
begin
  perform public.require_admin();

  if coalesce(trim(p_password), '') <> '180695' then
    raise exception 'Onay şifresi hatalı.' using errcode = 'P0001';
  end if;

  select count(*) into deleted_count from public.orders;
  truncate table public.orders restart identity cascade;

  return jsonb_build_object('deleted_count', deleted_count);
end;
$$;

revoke all on function public.reset_orders_admin(text) from public;
grant execute on function public.reset_orders_admin(text) to authenticated;
