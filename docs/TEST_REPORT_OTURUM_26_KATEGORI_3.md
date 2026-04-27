# Test Report: Oturum 26 Kategori 3 (Sayfa/Route Smoke + 404 Audit)

Tarih: 2026-04-27 (oturum 26)
Test kapsamı: Desktop + Mobile viewport, Console error capture, 404 davranışı, Auth/Admin guard

## Özet (üst seviye)

| Test | Sonuç |
|---|---|
| **Desktop smoke (118 route)** | ✅ 118/118 PASS (%100) |
| **Mobile viewport spot-check (8 route)** | ✅ 0 horizontal overflow, viewport meta doğru |
| **Console error capture** | ⚠️ 1 false-positive React 19 dev warning (P2 monitoring) |
| **404 davranışı (5 test)** | ✅ 5/5 PASS, doğru 404 status |
| **Auth guard (4 route)** | ✅ 4/4 PASS, anonim → /giris redirect |
| **Admin guard (3 route)** | ✅ 3/3 PASS, anonim 307 redirect |
| **API/meta (5 route)** | ✅ 5/5 PASS (sitemap/robots/manifest/feed/llms) |
| **A11y mobile touch target** | ⚠️ Breadcrumb link ~18px height (P1, Kategori 6 scope) |

## Bulgular (P0/P1/P2 önceliği)

### P0 - Launch blocker
**Yok.** Hiçbir route 5xx veya beklenmeyen 404 dönmedi.

### P1 - Yüksek değer
1. **Mobile touch target çok küçük (breadcrumb)**
   - Sayfa: `/tarif/adana-kebap` ve diğer tarif detay sayfaları
   - Bulgu: Breadcrumb link'leri ~18px yükseklik (örn. "Tarifler" 44×18, "🥩 Et Yemekleri" 102×18, "Dolabımı düzenle →" 112×16)
   - Standart: WCAG 2.5.5 Target Size (Enhanced) AAA = 44×44; Apple HIG mobile = 44×44; Google Material = 48×48
   - Etki: Mobil kullanıcılar yanlış link'e dokunma riski yüksek
   - Fix önerisi: Breadcrumb container'a mobil için `min-height: 44px` veya `py-3` (vertical padding artışı)
   - Scope: Kategori 6 (A11y Deep Audit) ile birleştirilebilir

### P2 - Monitoring
1. **React 19 dev console warning (false-positive)**
   - Mesaj: "Encountered a script tag while rendering React component. Scripts inside React components are never executed when rendering on the client."
   - Kaynak: `src/app/layout.tsx:144-150` (siteSchemas JSON-LD), `src/app/blog/page.tsx:71`, ve diğer detay sayfalarda
   - Pattern: `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />`
   - Bu pattern Next.js docs'da SEO için kabul edilen pattern (https://nextjs.org/docs/app/building-your-application/optimizing/metadata#json-ld). React 19'un yeni script tag warning'i false-positive bu use case için (JSON-LD execute edilmesi gerekmez, crawler okur)
   - Etki: Sentry'ye düşebilir (monitor önerisi); kullanıcı görmez (sadece dev console)
   - Önerilen takip: Production Sentry'de "script tag" filter'ı 1 hafta gözle, eğer prod'da aktif ise Next.js `Script` component veya children pattern'e migrate et
   - Acil değil

### Expected behavior (bug değil, dokumentasyon)
- `/leaderboard` → 404 (feature flag `isLeaderboardEnabled()` kapalı, intentional)
- `/manifest.json` → 404, `/manifest.webmanifest` → 200 (Next.js convention)
- `/sifre-sifirla`, `/dogrula` → token-only dynamic, doğrudan erişim 404 normal
- `/favoriler`, `/koleksiyon`, `/profil` standalone route'lar yok (kendi profil için `/profil/[username]`, koleksiyon için `/koleksiyon/[id]`)

## Detay

- **PASS**: 118 (100.0%)
- **FAIL**: 0
- **WARN**: 0

## Group bazında

| Group | Total | PASS | FAIL | WARN |
|---|---:|---:|---:|---:|
| public | 20 | 20 | 0 | 0 |
| kategori | 17 | 17 | 0 | 0 |
| mutfak | 36 | 36 | 0 | 0 |
| diyet | 5 | 5 | 0 | 0 |
| etiket | 15 | 15 | 0 | 0 |
| tarif-detail | 5 | 5 | 0 | 0 |
| blog-detail | 3 | 3 | 0 | 0 |
| auth-required | 4 | 4 | 0 | 0 |
| admin | 3 | 3 | 0 | 0 |
| api | 5 | 5 | 0 | 0 |
| 404-test | 5 | 5 | 0 | 0 |

## En yavaş 10 route

- 1680ms - `/admin/kalite` (admin, status=200)
- 1677ms - `/admin/yorumlar` (admin, status=200)
- 1664ms - `/sitemap.xml` (api, status=200)
- 1524ms - `/blog/yag-kimyasi-ve-duman-noktalari` (blog-detail, status=200)
- 1523ms - `/dolap` (auth-required, status=200)
- 1523ms - `/ayarlar` (auth-required, status=200)
- 1522ms - `/alisveris-listesi` (auth-required, status=200)
- 1522ms - `/admin` (admin, status=200)
- 1521ms - `/bildirimler` (auth-required, status=200)
- 1475ms - `/kesfet` (public, status=200)

## Tüm route'lar (verdict, status, duration, finalUrl)

| # | Path | Group | Verdict | Status | DurationMs | NeedleMatch | Final URL |
|---|---|---|---|---:|---:|---|---|
| 1 | / | public | **PASS** | 200 | 1238 | true | / |
| 2 | /tarifler | public | **PASS** | 200 | 919 | true | /tarifler |
| 3 | /kategoriler | public | **PASS** | 200 | 760 | true | /kategoriler |
| 4 | /kesfet | public | **PASS** | 200 | 1475 | null | /kesfet |
| 5 | /menu-planlayici | public | **PASS** | 200 | 944 | null | /menu-planlayici |
| 6 | /ai-asistan | public | **PASS** | 200 | 1397 | true | /ai-asistan |
| 7 | /hakkimizda | public | **PASS** | 200 | 1001 | null | /hakkimizda |
| 8 | /iletisim | public | **PASS** | 200 | 939 | null | /iletisim |
| 9 | /blog | public | **PASS** | 200 | 942 | null | /blog |
| 10 | /yasal | public | **PASS** | 200 | 938 | null | /yasal |
| 11 | /yasal/kvkk | public | **PASS** | 200 | 516 | null | /yasal/kvkk |
| 12 | /yasal/gizlilik | public | **PASS** | 200 | 516 | null | /yasal/gizlilik |
| 13 | /yasal/kullanim-kosullari | public | **PASS** | 200 | 516 | null | /yasal/kullanim-kosullari |
| 14 | /yasal/cerez-politikasi | public | **PASS** | 200 | 516 | null | /yasal/cerez-politikasi |
| 15 | /yasal/guvenlik | public | **PASS** | 200 | 517 | null | /yasal/guvenlik |
| 16 | /yasal/iletisim-aydinlatma | public | **PASS** | 200 | 518 | null | /yasal/iletisim-aydinlatma |
| 17 | /kayit | public | **PASS** | 200 | 518 | null | /kayit |
| 18 | /giris | public | **PASS** | 200 | 556 | null | /giris |
| 19 | /sifremi-unuttum | public | **PASS** | 200 | 556 | null | /sifremi-unuttum |
| 20 | /akis | public | **PASS** | 200 | 677 | null | /giris?callbackUrl=/akis |
| 21 | /tarifler/aperatifler | kategori | **PASS** | 200 | 933 | null | /tarifler/aperatifler |
| 22 | /tarifler/atistirmaliklar | kategori | **PASS** | 200 | 886 | null | /tarifler/atistirmaliklar |
| 23 | /tarifler/baklagil-yemekleri | kategori | **PASS** | 200 | 951 | null | /tarifler/baklagil-yemekleri |
| 24 | /tarifler/corbalar | kategori | **PASS** | 200 | 951 | null | /tarifler/corbalar |
| 25 | /tarifler/et-yemekleri | kategori | **PASS** | 200 | 933 | null | /tarifler/et-yemekleri |
| 26 | /tarifler/hamur-isleri | kategori | **PASS** | 200 | 951 | null | /tarifler/hamur-isleri |
| 27 | /tarifler/icecekler | kategori | **PASS** | 200 | 952 | null | /tarifler/icecekler |
| 28 | /tarifler/kahvaltiliklar | kategori | **PASS** | 200 | 964 | null | /tarifler/kahvaltiliklar |
| 29 | /tarifler/kahve-sicak-icecekler | kategori | **PASS** | 200 | 956 | null | /tarifler/kahve-sicak-icecekler |
| 30 | /tarifler/kokteyller | kategori | **PASS** | 200 | 973 | null | /tarifler/kokteyller |
| 31 | /tarifler/makarna-pilav | kategori | **PASS** | 200 | 708 | null | /tarifler/makarna-pilav |
| 32 | /tarifler/salatalar | kategori | **PASS** | 200 | 710 | null | /tarifler/salatalar |
| 33 | /tarifler/sebze-yemekleri | kategori | **PASS** | 200 | 712 | null | /tarifler/sebze-yemekleri |
| 34 | /tarifler/smoothie-shake | kategori | **PASS** | 200 | 730 | null | /tarifler/smoothie-shake |
| 35 | /tarifler/soslar-dippler | kategori | **PASS** | 200 | 730 | null | /tarifler/soslar-dippler |
| 36 | /tarifler/tatlilar | kategori | **PASS** | 200 | 737 | null | /tarifler/tatlilar |
| 37 | /tarifler/tavuk-yemekleri | kategori | **PASS** | 200 | 767 | null | /tarifler/tavuk-yemekleri |
| 38 | /mutfak/turk | mutfak | **PASS** | 200 | 709 | null | /mutfak/turk |
| 39 | /mutfak/italyan | mutfak | **PASS** | 200 | 711 | null | /mutfak/italyan |
| 40 | /mutfak/fransiz | mutfak | **PASS** | 200 | 709 | null | /mutfak/fransiz |
| 41 | /mutfak/ispanyol | mutfak | **PASS** | 200 | 740 | null | /mutfak/ispanyol |
| 42 | /mutfak/yunan | mutfak | **PASS** | 200 | 740 | null | /mutfak/yunan |
| 43 | /mutfak/japon | mutfak | **PASS** | 200 | 741 | null | /mutfak/japon |
| 44 | /mutfak/cin | mutfak | **PASS** | 200 | 754 | null | /mutfak/cin |
| 45 | /mutfak/kore | mutfak | **PASS** | 200 | 755 | null | /mutfak/kore |
| 46 | /mutfak/tay | mutfak | **PASS** | 200 | 756 | null | /mutfak/tay |
| 47 | /mutfak/hint | mutfak | **PASS** | 200 | 758 | null | /mutfak/hint |
| 48 | /mutfak/meksika | mutfak | **PASS** | 200 | 758 | null | /mutfak/meksika |
| 49 | /mutfak/abd | mutfak | **PASS** | 200 | 756 | null | /mutfak/abd |
| 50 | /mutfak/orta-dogu | mutfak | **PASS** | 200 | 756 | null | /mutfak/orta-dogu |
| 51 | /mutfak/kuzey-afrika | mutfak | **PASS** | 200 | 734 | null | /mutfak/kuzey-afrika |
| 52 | /mutfak/vietnam | mutfak | **PASS** | 200 | 733 | null | /mutfak/vietnam |
| 53 | /mutfak/brezilya | mutfak | **PASS** | 200 | 714 | null | /mutfak/brezilya |
| 54 | /mutfak/kuba | mutfak | **PASS** | 200 | 726 | null | /mutfak/kuba |
| 55 | /mutfak/rus | mutfak | **PASS** | 200 | 727 | null | /mutfak/rus |
| 56 | /mutfak/macar | mutfak | **PASS** | 200 | 728 | null | /mutfak/macar |
| 57 | /mutfak/iskandinav | mutfak | **PASS** | 200 | 729 | null | /mutfak/iskandinav |
| 58 | /mutfak/peru | mutfak | **PASS** | 200 | 729 | null | /mutfak/peru |
| 59 | /mutfak/ingiliz | mutfak | **PASS** | 200 | 759 | null | /mutfak/ingiliz |
| 60 | /mutfak/polonya | mutfak | **PASS** | 200 | 731 | null | /mutfak/polonya |
| 61 | /mutfak/avustralya | mutfak | **PASS** | 200 | 604 | null | /mutfak/avustralya |
| 62 | /mutfak/alman | mutfak | **PASS** | 200 | 605 | null | /mutfak/alman |
| 63 | /mutfak/iran | mutfak | **PASS** | 200 | 606 | null | /mutfak/iran |
| 64 | /mutfak/pakistan | mutfak | **PASS** | 200 | 670 | null | /mutfak/pakistan |
| 65 | /mutfak/endonezya | mutfak | **PASS** | 200 | 671 | null | /mutfak/endonezya |
| 66 | /mutfak/etiyopya | mutfak | **PASS** | 200 | 673 | null | /mutfak/etiyopya |
| 67 | /mutfak/nijerya | mutfak | **PASS** | 200 | 671 | null | /mutfak/nijerya |
| 68 | /mutfak/tunus | mutfak | **PASS** | 200 | 673 | null | /mutfak/tunus |
| 69 | /mutfak/arjantin | mutfak | **PASS** | 200 | 669 | null | /mutfak/arjantin |
| 70 | /mutfak/kolombiya | mutfak | **PASS** | 200 | 672 | null | /mutfak/kolombiya |
| 71 | /mutfak/venezuela | mutfak | **PASS** | 200 | 569 | null | /mutfak/venezuela |
| 72 | /mutfak/danimarka | mutfak | **PASS** | 200 | 570 | null | /mutfak/danimarka |
| 73 | /mutfak/guney-afrika | mutfak | **PASS** | 200 | 589 | null | /mutfak/guney-afrika |
| 74 | /diyet/vegan | diyet | **PASS** | 200 | 662 | null | /diyet/vegan |
| 75 | /diyet/vejetaryen | diyet | **PASS** | 200 | 763 | null | /diyet/vejetaryen |
| 76 | /diyet/glutensiz | diyet | **PASS** | 200 | 764 | null | /diyet/glutensiz |
| 77 | /diyet/sutsuz | diyet | **PASS** | 200 | 776 | null | /diyet/sutsuz |
| 78 | /diyet/alkolsuz | diyet | **PASS** | 200 | 777 | null | /diyet/alkolsuz |
| 79 | /etiket/30-dakika-alti | etiket | **PASS** | 200 | 766 | null | /etiket/30-dakika-alti |
| 80 | /etiket/alkollu | etiket | **PASS** | 200 | 767 | null | /etiket/alkollu |
| 81 | /etiket/alkolsuz | etiket | **PASS** | 200 | 652 | null | /etiket/alkolsuz |
| 82 | /etiket/butce-dostu | etiket | **PASS** | 200 | 696 | null | /etiket/butce-dostu |
| 83 | /etiket/cocuk-dostu | etiket | **PASS** | 200 | 680 | null | /etiket/cocuk-dostu |
| 84 | /etiket/dusuk-kalorili | etiket | **PASS** | 200 | 759 | null | /etiket/dusuk-kalorili |
| 85 | /etiket/firinda | etiket | **PASS** | 200 | 850 | null | /etiket/firinda |
| 86 | /etiket/kis-tarifi | etiket | **PASS** | 200 | 759 | null | /etiket/kis-tarifi |
| 87 | /etiket/misafir-sofrasi | etiket | **PASS** | 200 | 852 | null | /etiket/misafir-sofrasi |
| 88 | /etiket/pratik | etiket | **PASS** | 200 | 850 | null | /etiket/pratik |
| 89 | /etiket/tek-tencere | etiket | **PASS** | 200 | 853 | null | /etiket/tek-tencere |
| 90 | /etiket/vegan | etiket | **PASS** | 200 | 851 | null | /etiket/vegan |
| 91 | /etiket/vejetaryen | etiket | **PASS** | 200 | 777 | null | /etiket/vejetaryen |
| 92 | /etiket/yaz-tarifi | etiket | **PASS** | 200 | 822 | null | /etiket/yaz-tarifi |
| 93 | /etiket/yuksek-protein | etiket | **PASS** | 200 | 823 | null | /etiket/yuksek-protein |
| 94 | /tarif/adana-kebap | tarif-detail | **PASS** | 200 | 1234 | null | /tarif/adana-kebap |
| 95 | /tarif/brik-tunus-usulu | tarif-detail | **PASS** | 200 | 1208 | null | /tarif/brik-tunus-usulu |
| 96 | /tarif/boza | tarif-detail | **PASS** | 200 | 1245 | null | /tarif/boza |
| 97 | /tarif/peanut-butter-milkshake | tarif-detail | **PASS** | 200 | 1265 | null | /tarif/peanut-butter-milkshake |
| 98 | /tarif/baklava | tarif-detail | **PASS** | 200 | 1259 | null | /tarif/baklava |
| 99 | /blog/kuruyemis-cesitleri | blog-detail | **PASS** | 200 | 761 | null | /blog/kuruyemis-cesitleri |
| 100 | /blog/salamura-ve-marine-bilimi | blog-detail | **PASS** | 200 | 762 | null | /blog/salamura-ve-marine-bilimi |
| 101 | /blog/yag-kimyasi-ve-duman-noktalari | blog-detail | **PASS** | 200 | 1524 | null | /blog/yag-kimyasi-ve-duman-noktalari |
| 102 | /dolap | auth-required | **PASS** | 200 | 1523 | null | /giris?callbackUrl=/dolap |
| 103 | /ayarlar | auth-required | **PASS** | 200 | 1523 | null | /giris?callbackUrl=/ayarlar |
| 104 | /bildirimler | auth-required | **PASS** | 200 | 1521 | null | /giris?callbackUrl=/bildirimler |
| 105 | /alisveris-listesi | auth-required | **PASS** | 200 | 1522 | null | /giris?callbackUrl=/alisveris-listesi |
| 106 | /admin | admin | **PASS** | 200 | 1522 | null | /giris |
| 107 | /admin/kalite | admin | **PASS** | 200 | 1680 | null | /giris |
| 108 | /admin/yorumlar | admin | **PASS** | 200 | 1677 | null | /giris |
| 109 | /sitemap.xml | api | **PASS** | 200 | 1664 | true | /sitemap.xml |
| 110 | /robots.txt | api | **PASS** | 200 | 475 | true | /robots.txt |
| 111 | /manifest.webmanifest | api | **PASS** | 200 | 14 | true | /manifest.webmanifest |
| 112 | /feed.xml | api | **PASS** | 200 | 271 | true | /feed.xml |
| 113 | /llms.txt | api | **PASS** | 200 | 27 | true | /llms.txt |
| 114 | /tarif/nonexistent-slug-test-12345 | 404-test | **PASS** | 404 | 258 | null | /tarif/nonexistent-slug-test-12345 |
| 115 | /mutfak/uydurma-mutfak-xyz | 404-test | **PASS** | 404 | 405 | null | /mutfak/uydurma-mutfak-xyz |
| 116 | /blog/uydurma-yazi-xyz | 404-test | **PASS** | 404 | 404 | null | /blog/uydurma-yazi-xyz |
| 117 | /tarifler/uydurma-kategori-xyz | 404-test | **PASS** | 404 | 405 | null | /tarifler/uydurma-kategori-xyz |
| 118 | /diyet/uydurma-diet | 404-test | **PASS** | 404 | 406 | null | /diyet/uydurma-diet |
