# Test Report: Oturum 26 Kategori 5 (Perf + SEO + Structured Data)

Tarih: 2026-04-27 (oturum 26)
Test kapsamı: JSON-LD structured data + meta/OG/Twitter + image optimization + sitemap/robots/RSS/llms + internal linking + canonical
Süre: ~1 saat
Yöntem: curl + node JSON-LD parser + DOM regex audit (5 sayfa)

## Özet (üst seviye)

| Test | Sonuç |
|---|---|
| **Structured data (5 sayfa, 7 schema tip)** | ✅ Tüm major tip mevcut: Recipe + Article + BreadcrumbList + FAQPage + ItemList + WebSite + Organization |
| Recipe schema field completeness | ✅ 15+ field (name/desc/image/author/datePublished/prepTime/cookTime/totalTime/recipeYield/category/cuisine/ingredients/instructions/nutrition/keywords) |
| ISO 8601 duration (Recipe) | ✅ cookTime PT20M, totalTime PT110M format doğru |
| **Meta tags + OG + Twitter** | ✅ 5 sayfa hepsi title + canonical + og:title/desc/url/image set |
| OG image dimensions | ✅ 1200×630 (Facebook + Twitter spec, og:image:width + height) |
| Twitter card | ✅ summary_large_image (kategori/mutfak) |
| Anasayfa OG image | ⚠️ localhost URL (dev only, prod'da tarifle.app) |
| Recipe aggregateRating | ⚠️ Yok (yorum sistemi var, schema'ya inject önerisi) |
| Image optimization | ✅ Tarifle emoji-based pattern (Cloudinary integration ileri foto wave için) |
| **Sitemap.xml** | ✅ 3647 URL valid XML, lastmod ISO 8601, changefreq daily, priority 1 |
| **robots.txt** | ✅ Disallow disipline: /admin/* + /ayarlar + /bildirimler + token routes + query string crawl trap |
| **feed.xml RSS** | ✅ Valid RSS 2.0, channel + atom:link self + tr-TR |
| **llms.txt** | ✅ AI/LLM crawler-friendly, Recipe schema referansı |
| **Internal linking** | ✅ 106 (anasayfa) / 38-51 (detay sayfalar) zengin navigation |
| **h1 + canonical + indexable** | ✅ 5 sayfa hepsi h1=1, canonical doğru, noindex=false |

## Bulgular

### P0 - Launch blocker
**Yok.**

### P1 - Yüksek değer
**Yok yeni P1.** SEO foundation excellent.

### P2 - Monitoring / iyileştirme

**1. Recipe schema aggregateRating yok**
- Lokasyon: tarif detay JSON-LD Recipe schema
- Mevcut: 15+ field var (Recipe + nutrition + keywords + additionalProperty), ama `aggregateRating` field eksik
- Sebep: Şu an mock/test data'da yorum yok, dynamic injection gerekli
- Önerilen: `lib/seo/structured-data.ts` Recipe builder'a `aggregateRating: { '@type': 'AggregateRating', ratingValue: avg, reviewCount: count }` ekle (rating > 0 ise)
- Etki: Google Rich Results yıldız display, CTR artışı (önemli SEO win)
- Scope: 30 dk Recipe schema + Review aggregate query

**2. Anasayfa OG image dev URL leak**
- Lokasyon: anasayfa `<meta property="og:image" content="http://localhost:3000/opengraph-image?...">`
- Mevcut: Dev mode'da localhost URL HTML'de
- Sebep: SITE_URL env veya generateMetadata absolute URL eksik
- Karşılaştırma: Tarif detay og:image `https://tarifle.app/tarif/adana-kebap/opengraph-image/tr` ✓ (prod URL)
- Önerilen: anasayfa generateMetadata'da `metadataBase` veya manuel SITE_URL prefix
- Etki: Production'da kontrol et, prod'da localhost olmamalı (test gerek)

### P3 - Düşük öncelik

**3. RSS feed atom:link type "application/rss+xml"**
- Lokasyon: feed.xml channel
- Mevcut: `<atom:link href="..." rel="self" type="application/rss+xml" />`
- Marjinal: RSS 2.0 + Atom self-link kombinasyonu valid ama puristik değil
- Önerilen takip: optional, RSS validators OK genelde
- Acil değil

## PASS bulguları (mükemmel SEO foundation)

**1. Structured data 7 schema tip prod**
- Anasayfa: WebSite + Organization (foundation)
- Tarif detay: + Recipe + BreadcrumbList + FAQPage (rich result-eligible)
- Blog detay: + Article + BreadcrumbList (rich result + breadcrumb)
- Kategori/Mutfak/Diyet: + ItemList + BreadcrumbList + FAQPage (programatik landing)

Recipe schema 15+ field (Google Rich Results Recipe spec'inin tüm önerilen alanları):
- @context schema.org, @type Recipe
- name, description, image, author, datePublished
- prepTime, cookTime, totalTime (ISO 8601 PT_M format)
- recipeYield, recipeCategory, recipeCuisine
- recipeIngredient (array, 7 entry)
- supply (kitchen tools), tool, recipeInstructions (5 step)
- nutrition (object)
- keywords, additionalProperty

**2. Meta tags + OG + Twitter parite**
- 5 sayfa hepsi: title (page-specific) + canonical + og:title/desc/url + og:image
- Facebook spec: og:image 1200×630 + og:image:width + height
- Twitter spec: twitter:card summary_large_image (kategori/mutfak'ta)
- Locale: og:locale tr_TR

**3. Sitemap.xml**
- 3647 URL: 3517 tarif + 56 blog + 17 kategori + 36 mutfak + 5 diyet + 15 etiket + statikler
- lastmod (ISO 8601), changefreq, priority
- Prod URL https://tarifle.app

**4. robots.txt sıkı disipline**
- Allow: /
- Disallow: /admin/*, /ayarlar, /bildirimler, /dogrula/*, /sifre-sifirla/*, /akis, /menu-planlayici (auth-only paths)
- Crawl trap koruma: ?sayfa=, ?page=, ?utm_, ?fbclid=, ?gclid= disallow
- Host directive + Sitemap link

**5. RSS feed valid**
- RSS 2.0 + atom self-link
- channel title + link + description + language tr-TR

**6. llms.txt AI-friendly**
- "Modern, Türkçe tarif platformu, 2000+ tarif" intro
- Recipe + HowTo schema referansı
- Crawl policy: hız sınırı yok, allow indexing
- AI yanıtlarında doğrudan alıntı + kaynak link policy

**7. Internal linking density**
- Anasayfa: 106 internal link (zengin discoverability)
- Tarif detay: 38 (breadcrumb + similar + ingredient + cuisine links)
- Blog detay: 26 internal + 17 external (kaynak link'leri)
- Kategori/mutfak: 37-51 (recipe cards + cross-references)

**8. h1 + canonical + index policy**
- 5 sayfa hepsi h1=1 (tek h1 per page, SEO best practice)
- canonical → https://tarifle.app/<path> (apex domain, www redirect 308)
- noindex=false on indexable pages
- Page>1 paginated sayfalar noindex (oturum 25 P0 fix)

## Test edilemediler (sınırlamalar)

- **Lighthouse audit (mobile + desktop)**: CI baseline koruma 0.85+ perf threshold mevcut (lhci config), yeni run delta yok. Vercel preview deploy + lhci collect/assert ile prod-spesifik ölçüm gerek.
- **Bundle analyzer (next build)**: dev server açık, prod build için kapatma + `next build` gerek (~3-5 dk). Mevcut state web vital monitoring Vercel Analytics ile prod'da
- **Google Rich Results Test**: real prod URL gerek (validator.schema.org veya search.google.com/test/rich-results)
- **Real perf metrics (LCP, INP, CLS, FCP)**: Vercel Web Analytics prod'da, dev mode unrepresentative
- **Image optimization detail**: Tarifle emoji-based pattern, Cloudinary integration var ama henüz çoğu tarif emoji-only. Foto upload feature ileri ship'lenince image audit detaylı yapılır

## Test ortamı

- curl HTTP fetch + node JSON-LD parser
- Sayfalar: anasayfa, /tarif/adana-kebap, /blog/kuruyemis-cesitleri, /tarifler/tatlilar, /mutfak/turk
- Localhost dev server (prod URL test ayrı: tarifle.app curl)

## Sonraki adım

K5 bulguları küçük (0 P0 + 0 P1 + 2 P2 + 1 P3); SEO foundation çok güçlü.

Geri kalan iyileştirmeler:
1. Recipe aggregateRating injection (30 dk, Google Rich Results yıldız display)
2. Anasayfa OG image prod URL doğrulama (10 dk, prod'da test)
3. Lighthouse CI prod run (deploy sonrası)
4. Real Google Rich Results Test (search console submit sonrası)

Test Campaign sıradakiler (3 kalan):
- **K4 (Form Edge Case, P1, ~1 saat)** - daha derin form test
- **K8 (Cross-browser + PWA, P2, ~45 dk)** - real cihaz test (kullanıcı telefonundan)
- **K6 P2 polish paketi** (~90 dk) - newsletter label + header mobile + action btn + contrast + motion-safe
