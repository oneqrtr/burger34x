-- Burger34: tüm menü + mevcut hero/about/contact/ui/blog/promotions (data alanını BAŞTAN YAZAR).
-- Supabase’teki mevcut ürünleri/kategorileri SİLMEMEK için: cms_menu_merge_append.sql kullanın.
-- Supabase SQL Editor'da çalıştır. id=1 satırı yoksa önce cms_setup.sql ile oluştur.

insert into public.cms_content (id, data)
values (1, '{}'::jsonb)
on conflict (id) do nothing;

update public.cms_content
set data = $cms$
{
  "hero": {
    "title": "Burger34",
    "subtitle": "Gerçek burger. Gerçek lezzet."
  },
  "about": {
    "title": "MKP sokaklarında hakiki burger.",
    "content": "Burger34, tutkulu bir ekip ve net bir fikirle yola çıktı: sokağın enerjisini, sahici malzemeler ve bol çeşitle buluşturan bir burger deneyimi. Hamzabey, Bursa Caddesi üzerinde Mustafakemalpaşa'da misafirlerimizi ağırlıyoruz.\n\nKöfteden tavuğa her üründe aynı disiplin var: taze hazırlık, dengeli soslar ve abartısız ama iddialı lezzet. Bizim için Burger34 yalnızca bir menü değil; mahallenin tempolu gününe eşlik eden, geceye uzanan bir durak.",
    "image": "/logo_final.png",
    "stats": [
      { "label": "Konum", "value": "Mustafakemalpaşa" },
      { "label": "Çizgi", "value": "Sokak lezzeti" }
    ]
  },
  "contact": {
    "address": "Hamzabey, Bursa Cd. No. 144/A, 16500 Mustafakemalpaşa/Bursa",
    "email": "",
    "phone": "0552 669 05 55"
  },
  "ui": {
    "aboutLabel": "Hakkımızda",
    "blogSectionTitle": "Sokak sanatı",
    "blogIntro": "Gece şehri değil, bizim şehir: sokak kültürü, renk, müzik ve kısa duraklar. Burada sokak sanatı dediğimiz şey, tabaktaki detay kadar sokağın kendi ritmi — paylaşılan bir an, bir kahkaha, bir burger molası.",
    "footerDescription": "Sokak lezzetini tabağa taşıyoruz — taze, çıtır, samimi. MKP'de her ısırdıkta aynı özen.",
    "footerContactBlurb": "Mustafakemalpaşa (Bursa) burger ve sokak lezzetleri. Hamzabey, Bursa Cd. Sipariş: 0552 669 05 55.",
    "socialLinks": [
      {
        "id": "instagram",
        "label": "Instagram",
        "url": "https://www.instagram.com/burger34.mkp/",
        "enabled": true
      }
    ]
  },
  "categories": [
    { "id": "burger", "name": "Burger" },
    { "id": "kizarmis-tavuk", "name": "Kızarmış Tavuk" },
    { "id": "kumru", "name": "Kumru" },
    { "id": "aperatifler", "name": "Aperatifler" }
  ],
  "products": [
    { "id": "burger-cheeseburger", "categoryId": "burger", "name": "CHEESEBURGER", "description": "100g sulu dana köfte, eriyen cheddar, karamelize soğan ve turşunun dengesiyle klasik ve tatmin edici bir lezzet.", "price": 270, "image": "/burger/cheeseburger.png", "ingredients": ["Welly Sos", "Cheddar Peyniri", "Yeşillik", "Karamelize Soğan", "Turşu"], "isBestSeller": false },
    { "id": "burger-mushroom-burger", "categoryId": "burger", "name": "MUSHROOM BURGER", "description": "100g dana köfte, sotelenmiş mantar ve cheddar ile yumuşak ve aromatik bir lezzet sunar.", "price": 280, "image": "", "ingredients": ["Welly Sos", "Cheddar Peyniri", "Yeşillik", "Karamelize Soğan", "Mantar"], "isBestSeller": false },
    { "id": "burger-steak-burger", "categoryId": "burger", "name": "STEAK BURGER", "description": "200g dana köfte, cheddar, karamelize soğan ve turşu ile dengeli ve doyurucu bir lezzet sunar.", "price": 360, "image": "", "ingredients": ["Welly Sos", "Cheddar Peyniri", "Yeşillik", "Karamelize Soğan", "Turşu"], "isBestSeller": false },
    { "id": "burger-cift-kat", "categoryId": "burger", "name": "ÇİFT KAT BURGER", "description": "İki kat 100g dana köfte, bol cheddar ve özel sosla gerçek bir burger deneyimi.", "price": 370, "image": "", "ingredients": ["Welly Sos", "Cheddar Peyniri", "Yeşillik", "Karamelize Soğan", "Köz Biber"], "isBestSeller": false },
    { "id": "burger-34-imza", "categoryId": "burger", "name": "BURGER34 İMZA LEZZET", "description": "200g dana köfte, pastırma ve özel 34 sos ile zenginleşmiş, yoğun ve imza niteliğinde bir burger.", "price": 380, "image": "", "ingredients": ["34 Sos", "Pastırma", "Köz Biber", "Cheddar Peyniri", "Yeşillik", "Karamelize Soğan", "Turşu"], "isBestSeller": true },
    { "id": "burger-gurme", "categoryId": "burger", "name": "GURME BURGER", "description": "200g dana köfte, dana jambon ve relish sosla birleşir; köz biber ve karamelize soğanla tamamlanır.", "price": 380, "image": "", "ingredients": ["Dana Jambon", "Relish Sos", "Köz Biber", "Cheddar Peyniri", "Yeşillik", "Karamelize Soğan"], "isBestSeller": false },
    { "id": "burger-uc-kat", "categoryId": "burger", "name": "ÜÇ KAT BURGER", "description": "Toplam 300g dana köfte, cheddar ve özel sosla maksimum doyuruculuk arayanlar için.", "price": 400, "image": "", "ingredients": ["Welly Sos", "Cheddar Peyniri", "Yeşillik", "Karamelize Soğan", "Köz Biber"], "isBestSeller": false },
    { "id": "burger-mexican", "categoryId": "burger", "name": "MEXICAN BURGER", "description": "100g dana köfte, jalapeno ve köz biberin hafif acılığıyla buluşur; cheddar ve özel sosla dengelenir.", "price": 280, "image": "", "ingredients": ["Welly Sos", "Jalapeno Biberi", "Köz Biberi", "Yeşillik"], "isBestSeller": false },
    { "id": "burger-tifil", "categoryId": "burger", "name": "TIFIL BURGER", "description": "100g dana köfte, cheddar ve özel sosla hazırlanmış, sade ama güçlü bir klasik.", "price": 260, "image": "", "ingredients": ["Welly Sos", "Cheddar Peyniri", "Yeşillik"], "isBestSeller": false },
    { "id": "burger-kasap", "categoryId": "burger", "name": "KASAP BURGER", "description": "100g dana köfte, dana jambon ve cheddar ile zenginleşen, karamelize soğanla tamamlanan doyurucu bir burger.", "price": 280, "image": "", "ingredients": ["Welly Sos", "Cheddar Peyniri", "Yeşillik", "Karamelize Soğan", "Dana Jambon"], "isBestSeller": false },

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
  ],
  "blog": [
    {
      "id": "1",
      "title": "MKP gecesi: sokağın kalbinde mola",
      "excerpt": "Mustafakemalpaşa'nın akışına uyum sağlayan bir lezzet durağı; hızlı servis, sıcak misafirperverlik.",
      "image": "",
      "category": "Sokak"
    },
    {
      "id": "2",
      "title": "Tencere değil, ızgara: sahici tat",
      "excerpt": "Sosları abartmadan kuruyor, malzemeyi öne çıkarıyoruz — her tabakta aynı netlik.",
      "image": "https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&q=80&w=800",
      "category": "Mutfak"
    }
  ],
  "promotions": [
    {
      "id": "1",
      "title": "Trüf sezonu başladı",
      "content": "Sınırlı üretim Trüf Umami burgerimizde kış trüfleri ve altın yapraklı aioli bulunuyor."
    }
  ]
}
$cms$::jsonb
where id = 1;
