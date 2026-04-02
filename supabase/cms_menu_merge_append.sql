-- Mevcut cms_content.data korunur; yalnızca aşağıdaki kategoriler ve ürünler EKLENİR.
-- Aynı id zaten varsa atlanır (tekrar çalıştırmak güvenli).
-- Supabase SQL Editor (postgres) ile çalıştırın.

insert into public.cms_content (id, data)
values (1, '{}'::jsonb)
on conflict (id) do nothing;

do $merge$
declare
  v_data jsonb;
  v_new_cats constant jsonb := $cats$
[
  { "id": "kizarmis-tavuk", "name": "Kızarmış Tavuk" },
  { "id": "kumru", "name": "Kumru" },
  { "id": "aperatifler", "name": "Aperatifler" }
]
$cats$::jsonb;
  v_new_prods constant jsonb := $prods$
[
  { "id": "kt-tenders-6", "categoryId": "kizarmis-tavuk", "name": "Tenders (6 Parça)", "description": "Özel marinasyonlu ve baharat kaplamalı 300 gr kızarmış tavuk. Yanında 100 gr patates kızartması ile sunulur.", "price": 200, "image": "", "ingredients": ["Tavuk", "Özel marinasyon", "Baharat kaplama", "Patates kızartması"], "isBestSeller": false },
  { "id": "kt-baget-2", "categoryId": "kizarmis-tavuk", "name": "Baget (2 Parça)", "description": "Özel marinasyonlu ve baharat kaplamalı 300 gr kızarmış tavuk. Yanında 100 gr patates kızartması ile sunulur.", "price": 200, "image": "", "ingredients": ["Tavuk", "Özel marinasyon", "Baharat kaplama", "Patates kızartması"], "isBestSeller": false },
  { "id": "kt-kanat-6", "categoryId": "kizarmis-tavuk", "name": "Kanat (6 Parça)", "description": "Özel marinasyonlu ve baharat kaplamalı 300 gr kızarmış tavuk. Yanında 100 gr patates kızartması ile sunulur.", "price": 240, "image": "", "ingredients": ["Tavuk", "Özel marinasyon", "Baharat kaplama", "Patates kızartması"], "isBestSeller": false },
  { "id": "kt-pirzola-2", "categoryId": "kizarmis-tavuk", "name": "Pirzola (2 Parça)", "description": "Özel marinasyonlu ve baharat kaplamalı 300 gr kızarmış tavuk. Yanında 100 gr patates kızartması ile sunulur.", "price": 200, "image": "", "ingredients": ["Tavuk", "Özel marinasyon", "Baharat kaplama", "Patates kızartması"], "isBestSeller": false },
  { "id": "kt-pirzola-but-2", "categoryId": "kizarmis-tavuk", "name": "Pirzola But (2 Parça)", "description": "Özel marinasyonlu ve baharat kaplamalı 300 gr kızarmış tavuk. Yanında 100 gr patates kızartması ile sunulur.", "price": 200, "image": "", "ingredients": ["Tavuk", "Özel marinasyon", "Baharat kaplama", "Patates kızartması"], "isBestSeller": false },
  { "id": "kt-kanat-tenders-6", "categoryId": "kizarmis-tavuk", "name": "Kanat Tenders (6 Parça)", "description": "Özel marinasyonlu ve baharat kaplamalı 300 gr kızarmış tavuk. Yanında 100 gr patates kızartması ile sunulur.", "price": 240, "image": "", "ingredients": ["Tavuk", "Özel marinasyon", "Baharat kaplama", "Patates kızartması"], "isBestSeller": false },
  { "id": "kt-but-tenders-5", "categoryId": "kizarmis-tavuk", "name": "But & Tenders (5 Parça)", "description": "Özel marinasyonlu ve baharat kaplamalı 300 gr kızarmış tavuk. Yanında 100 gr patates kızartması ile sunulur.", "price": 200, "image": "", "ingredients": ["Tavuk", "Özel marinasyon", "Baharat kaplama", "Patates kızartması"], "isBestSeller": false },
  { "id": "kt-but-kanat-5", "categoryId": "kizarmis-tavuk", "name": "But & Kanat (5 Parça)", "description": "Özel marinasyonlu ve baharat kaplamalı 300 gr kızarmış tavuk. Yanında 100 gr patates kızartması ile sunulur.", "price": 240, "image": "", "ingredients": ["Tavuk", "Özel marinasyon", "Baharat kaplama", "Patates kızartması"], "isBestSeller": false },
  { "id": "km-eritme", "categoryId": "kumru", "name": "Eritme Kumru", "description": "Eritilmiş kaşarlı özel kumru.", "price": 170, "image": "", "ingredients": ["Sosis", "Salam", "Sucuk", "Eritilmiş kaşar", "Ketçap", "Mayonez", "Turşu"], "isBestSeller": false },
  { "id": "km-kasap", "categoryId": "kumru", "name": "Kasap Kumru", "description": "Dana jambonlu özel kumru.", "price": 190, "image": "", "ingredients": ["Sosis", "Salam", "Sucuk", "Eritilmiş kaşar", "Ketçap", "Mayonez", "Turşu", "Dana jambon"], "isBestSeller": false },
  { "id": "km-mantarli", "categoryId": "kumru", "name": "Mantarlı Kumru", "description": "Mantarlı özel kumru.", "price": 190, "image": "", "ingredients": ["Sosis", "Salam", "Sucuk", "Eritilmiş kaşar", "Ketçap", "Mayonez", "Turşu", "Mantar"], "isBestSeller": false },
  { "id": "km-koz", "categoryId": "kumru", "name": "Köz Kumru", "description": "Köz patlıcanlı özel kumru.", "price": 190, "image": "", "ingredients": ["Sosis", "Salam", "Sucuk", "Eritilmiş kaşar", "Ketçap", "Mayonez", "Turşu", "Köz patlıcan"], "isBestSeller": false },
  { "id": "km-meksikan", "categoryId": "kumru", "name": "Meksikan Kumru", "description": "Jalapeno biberli özel kumru.", "price": 190, "image": "", "ingredients": ["Sosis", "Salam", "Sucuk", "Eritilmiş kaşar", "Ketçap", "Mayonez", "Turşu", "Jalapeno biber"], "isBestSeller": false },
  { "id": "km-34", "categoryId": "kumru", "name": "Kumru 34", "description": "Pastırmalı özel kumru.", "price": 220, "image": "", "ingredients": ["Sosis", "Salam", "Sucuk", "Eritilmiş kaşar", "Ketçap", "Mayonez", "Turşu", "Pastırma"], "isBestSeller": false },
  { "id": "ap-tabak", "categoryId": "aperatifler", "name": "Burger34 Tabağı", "description": "Burger34'e özel yan lezzet tabağı.", "price": 200, "image": "", "ingredients": [], "isBestSeller": false },
  { "id": "ap-sogan-5", "categoryId": "aperatifler", "name": "Soğan Halkası (5 Adet)", "description": "5 adet çıtır soğan halkası.", "price": 50, "image": "", "ingredients": [], "isBestSeller": false },
  { "id": "ap-sogan-10", "categoryId": "aperatifler", "name": "Soğan Halkası (10 Adet)", "description": "10 adet çıtır soğan halkası.", "price": 100, "image": "", "ingredients": [], "isBestSeller": false },
  { "id": "ap-tavuk-top-5", "categoryId": "aperatifler", "name": "Çıtır Tavuk Topları (5 Adet)", "description": "5 adet çıtır tavuk topu.", "price": 60, "image": "", "ingredients": [], "isBestSeller": false },
  { "id": "ap-tavuk-top-10", "categoryId": "aperatifler", "name": "Çıtır Tavuk Topları (10 Adet)", "description": "10 adet çıtır tavuk topu.", "price": 120, "image": "", "ingredients": [], "isBestSeller": false },
  { "id": "ap-patates-5", "categoryId": "aperatifler", "name": "Patates Kızartması (5 Adet)", "description": "5 adet porsiyon patates kızartması.", "price": 50, "image": "", "ingredients": ["Patates", "Kızartma yağı", "Tuz"], "isBestSeller": false },
  { "id": "ap-patates-10", "categoryId": "aperatifler", "name": "Patates Kızartması (10 Adet)", "description": "10 adet porsiyon patates kızartması.", "price": 100, "image": "", "ingredients": [], "isBestSeller": false },
  { "id": "ap-nugget", "categoryId": "aperatifler", "name": "Nugget", "description": "Çıtır tavuk nugget.", "price": 80, "image": "", "ingredients": [], "isBestSeller": false },
  { "id": "ap-kroket", "categoryId": "aperatifler", "name": "Patates Kroket", "description": "Dışı çıtır, içi yumuşak patates kroket.", "price": 70, "image": "", "ingredients": [], "isBestSeller": false },
  { "id": "ap-kanat-2", "categoryId": "aperatifler", "name": "2'li Kanat", "description": "2 adet ekstra kanat.", "price": 79, "image": "", "ingredients": [], "isBestSeller": false },
  { "id": "ap-baget-1", "categoryId": "aperatifler", "name": "+1 Baget", "description": "1 adet ekstra baget.", "price": 59, "image": "", "ingredients": [], "isBestSeller": false },
  { "id": "ap-tenders-2", "categoryId": "aperatifler", "name": "2'li Tenders", "description": "2 adet ekstra tenders.", "price": 59, "image": "", "ingredients": [], "isBestSeller": false },
  { "id": "ap-pirzola-2", "categoryId": "aperatifler", "name": "2'li Pirzola", "description": "2 adet ekstra pirzola.", "price": 59, "image": "", "ingredients": [], "isBestSeller": false }
]
$prods$::jsonb;
  item jsonb;
begin
  select c.data into v_data
  from public.cms_content c
  where c.id = 1
  for update;

  if v_data is null then
    raise exception 'cms_content id=1 bulunamadı';
  end if;

  if v_data->'categories' is null or jsonb_typeof(v_data->'categories') <> 'array' then
    v_data := jsonb_set(v_data, '{categories}', '[]'::jsonb, true);
  end if;

  if v_data->'products' is null or jsonb_typeof(v_data->'products') <> 'array' then
    v_data := jsonb_set(v_data, '{products}', '[]'::jsonb, true);
  end if;

  for item in select * from jsonb_array_elements(v_new_cats)
  loop
    if not exists (
      select 1
      from jsonb_array_elements(v_data->'categories') c
      where c->>'id' = item->>'id'
    ) then
      v_data := jsonb_set(
        v_data,
        '{categories}',
        (v_data->'categories') || jsonb_build_array(item),
        true
      );
    end if;
  end loop;

  for item in select * from jsonb_array_elements(v_new_prods)
  loop
    if not exists (
      select 1
      from jsonb_array_elements(v_data->'products') p
      where p->>'id' = item->>'id'
    ) then
      v_data := jsonb_set(
        v_data,
        '{products}',
        (v_data->'products') || jsonb_build_array(item),
        true
      );
    end if;
  end loop;

  update public.cms_content
  set data = v_data
  where id = 1;
end
$merge$;
