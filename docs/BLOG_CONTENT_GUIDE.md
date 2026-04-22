# Tarifle Blog Yazım Rehberi

Bu rehber sonraki oturumlarda blog yazısı yazarken uyulacak standardı
tanımlar. Mevcut 5 yazı bu disiplinle yazıldı (soğan, yedi bölge,
zeytinyağı, maya/kabartma, et mühürleme).

## Konu seçimi

**Öncelik**: mevcut yazılarla overlap etmeyen yeni bir domain açan konu.
Yayınlanmış 5 yazıyı oku, aynı alanı tekrar eden fikri ele.

**İyi konu kriterleri:**
- Yüksek arama hacmi (Türkçe Google, tarif ilişkili)
- Evergreen (bir yıl sonra da geçerli olacak bilgi)
- Sıkça yanlış bilinen (mit çürütme, netleştirme fırsatı)
- Tarifle DB'sindeki tariflere örtük geri bağlantı kurabilir

**Üç kategori (sabit, yeni ekleme gerekirse planla konuş):**
- `pisirme-teknikleri` — teknik, bilim, mutfak temel becerileri
- `malzeme-tanima` — tek malzeme derinliği, kimya, seçim rehberi
- `mutfak-rehberi` — kültür, mutfak coğrafyası, stil

## Editörial ton

**AI gibi yazma.** Kerem net direktif: "resmi gibi ama robotik değil,
doğal yaz, site içeriğinin aynısını tekrar etme".

**Kaçınılacak AI kalıpları:**
- Klişe başlangıç: "Dünyada...", "Her şey...", "Hepimiz biliriz..."
- Aşırı bullet list (her şeyi listeleme)
- Her paragrafta bold vurgu
- "Öyle ki...", "O kadar ki..." gibi yapay bağlaçlar
- Sondaki "Umarım bu yazı sana yardımcı olur" gibi köpüksü kapanış

**Tercih edilen ton:**
- Doğrudan konuya gir
- Kısa cümle + uzun cümle ritmi karışık
- Bold sadece gerçek vurgu için (paragraf başına 0-2)
- Somut sayı, süre, sıcaklık, malzeme adı
- Ciddi ama sıcak (kitap yazarı gibi, öğretmen gibi değil)

## Doğruluk (KRİTİK)

Tarif / pişirme / gıda güvenliği yazısı yanlış bilgi barındıramaz.
Yemek-sağlık kritiktir (örn. tavuk 74°C'nin altı → salmonella).

**Yazmadan önce teyit:**
- Kritik iddiaları WebSearch veya bilinen kaynaklardan kontrol et
- Kaynaklar hierarchy:
  1. **Resmî kurum**: USDA FSIS, International Olive Council, NAOOA,
     FDA, EFSA (gıda güvenliği, yasal tanımlar)
  2. **Bilim editörlü site**: Serious Eats (López-Alt), Cook's Illustrated,
     ATK, King Arthur Baking (hamur), Harold McGee kitap
  3. **Otoriteli gıda medyası**: Bon Appetit, NY Times Cooking, BBC Food
  4. **Türkçe referans**: yemek.com, nefisyemektarifleri.com
     (kültür/lokalizasyon için)

**Güvenilmez kaynaklar (kullanma):**
- Pinterest, Instagram, TikTok tarif paylaşımları
- Blog yorumları, forum iddialari
- AI generated içerik siteleri (içerik döngüsü)
- Wikipedia spesifik iddia için (temel tanımda OK, detay için kaynak)

## Citation (kaynak atıf)

Mevcut 4 yazıda uygulanan editörial blog standardı (Serious Eats,
Atlantic, HBR patterni):

### 1. Inline link (paragraf içinde kritik iddia)

```md
[Kenji López-Alt](https://www.seriouseats.com/.../cooking-steak) 
deneyi %1.68 daha fazla nem kaybı gösterdi.
```

**Ne zaman inline:** Spesifik bir kişi/kurumun bir çalışması, çıkarımı,
ölçümü referans ediliyor.

### 2. Yazı sonu "Kaynaklar" bölümü

```md
## Kaynaklar

- [Kaynak adı](https://url): Kısa ne açıkladığı (1 cümle).
- ...
```

**Ne zaman Kaynaklar bölümü:** Her bilimsel/teknik yazı sonunda. En az
2-3 kaynak. Açıklama cümlesi SEO ve okur rehberi için.

### Teknik detay

`src/components/blog/mdxComponents.tsx`'teki `Anchor` component:
- External linkleri otomatik `target="_blank"` + `rel="noopener noreferrer"`
- Internal (`/` ile başlayan) linkler Next.js `<Link>` ile
- Primary renk + underline on hover

Ek MDX özelliği gerekmez, standart Markdown link syntax çalışır.

### Atlanabilir

Kültür / mutfak rehberi içerik (ör. "Türk Mutfağının Yedi Bölgesi")
citation az kritik, atlanabilir. Bilim / teknik / iddia yoğun içerikte
ise zorunlu.

## Em-dash yasağı

AGENTS.md kuralı: em-dash (— U+2014) ve en-dash (– U+2013) YASAK.
Yerine: virgül, nokta, parantez, iki nokta, noktalı virgül.

ASCII hyphen (-) serbest: "180-200°C", "15-20 dakika" gibi aralıklar OK.

`scripts/check-emdash.mjs` pre-push hook'ta taramyor. MDX dosyalarında
em-dash varsa push bloklanır.

## Frontmatter

```md
---
title: "Yazı Başlığı: Alt Başlık"
description: "Meta description, 150-160 karakter, SEO için doğru."
date: "2026-04-23"
author: "Tarifle Editörleri"
tags: ["slug", "slug", "slug"]
category: "pisirme-teknikleri"
coverEmoji: "🥩"
---
```

**Zorunlu**: title, description, date.
**Opsiyonel**: author, tags, category, coverEmoji, cover (public/ yolu).

**Kategori slug kullanımı:** Listede olmayan yeni kategori ekleme
gerekiyorsa `src/lib/blog.ts`'deki `BLOG_CATEGORIES` dizisine önce ekle.

## Dosya adlandırma

`content/blog/<slug>.mdx`

Slug TR karakter yok, lowercase, tire ayraç. Örn:
- ✅ `et-muhurlemenin-bilimi.mdx`
- ✅ `maya-kabartma-tozu-karbonat-farki.mdx`
- ❌ `Et-Mühürleme.mdx`

## Uzunluk

**İyi aralık:** 1000-1500 kelime. Altında yüzeysel, üstünde okuma kayıp.
4-8 H2 başlık. H3 opsiyonel, sadece alt başlık net bir kırılma ise.

## Tablolar

**MDX'te standart table syntax render edilmiyor** (remark-gfm eklenmedi).
Tablo yerine bullet list veya H3 alt bölüm kullan.

Eğer gerçekten tablo gerekiyorsa `src/app/blog/[slug]/page.tsx` MDX
render pipeline'ına remark-gfm eklenmeli (ayrı iş).

## Tarife bağlantı

İçerik tarif Tarifle DB'sinde varsa paragraf içinde internal link:

```md
Bu teknik [karnıyarık](/tarif/karniyarik-tarifi) tarifinde de kullanılır.
```

MDX Anchor component internal linkleri Next.js `<Link>` ile render eder,
SPA navigation.

## Pre-commit kontrolleri

Her yazı sonrası:
1. `node scripts/check-emdash.mjs` (em-dash guard)
2. `npx tsc --noEmit --pretty false` (tsc compile)
3. Preview ile `/blog/<slug>` render (H1, H2 sayısı, link render)

`git push` öncesi pre-push 5 katman zaten otomatik.

## Oturum 14 öncesi yayınlı 5 yazı

Referans için mevcut:

| Slug | Kategori | Tarih | Kaynaklar |
|---|---|---|---|
| `soganin-dogru-kavrulmasi` | pisirme-teknikleri | 2026-04-15 | 3 |
| `turk-mutfaginin-yedi-bolgesi` | mutfak-rehberi | 2026-04-12 | — |
| `zeytinyagi-secimi` | malzeme-tanima | 2026-04-10 | 3 |
| `maya-kabartma-tozu-karbonat-farki` | malzeme-tanima | 2026-04-22 | 3 |
| `et-muhurlemenin-bilimi` | pisirme-teknikleri | 2026-04-23 | 6 |

## Sonraki oturumda

Yeni yazı konusu önerirken:
1. Mevcut 5'in hangi domainleri kapsadığına bak
2. Tekrarlanan alan yerine yeni domain öner
3. Yüksek arama hacmi + evergreen + Tarifle tarif bağlantısı
4. Kullanıcıya 3-5 seçenek + öneri ile sun (kararı o versin)
