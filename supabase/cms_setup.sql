-- Burger34 CMS — Supabase kurulumu (SQL Editor’da tek sefer çalıştırın)
-- Tablo zaten varsa yalnızca policy ve fonksiyon kısımlarını uyarlayın.

-- Örnek tablo (yoksa):
-- create table if not exists public.cms_content (
--   id int primary key,
--   data jsonb not null default '{}'::jsonb
-- );
-- insert into public.cms_content (id, data) values (1, '{}'::jsonb) on conflict (id) do nothing;

alter table public.cms_content enable row level security;

drop policy if exists "cms_content_select_public" on public.cms_content;
create policy "cms_content_select_public"
  on public.cms_content for select
  using (id = 1);

-- Doğrudan UPDATE kapalı; yalnızca aşağıdaki RPC (SECURITY DEFINER) yazabilir.
drop policy if exists "cms_content_update_anon" on public.cms_content;

revoke update on public.cms_content from anon;
revoke update on public.cms_content from authenticated;

-- Panel şifresi: BURADAKİ sabiti .env içindeki VITE_ADMIN_CMS_PASSWORD ile AYNI yapın (varsayılan 131094).
create or replace function public.merge_site_cms(p_password text, p_payload jsonb)
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

  update public.cms_content
  set data = p_payload
  where id = 1;

  if not found then
    insert into public.cms_content (id, data) values (1, p_payload);
  end if;
end;
$$;

revoke all on function public.merge_site_cms(text, jsonb) from public;
grant execute on function public.merge_site_cms(text, jsonb) to anon;
grant execute on function public.merge_site_cms(text, jsonb) to authenticated;

-- --- İsteğe bağlı: görseller için Storage ---
-- Bucket: burger34-uploads (public)
-- Policies: anon için INSERT + SELECT (kendi projenize göre sıkılaştırın)
