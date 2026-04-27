# Tarifle Oturum 26+ Test Campaign

## Felsefe

Mevcut otomatik altyapı sağlam (752 unit + 16 E2E + smoke + Lighthouse + axe-core a11y). Bu campaign **mevcut otomatik testlerin yakalamadığı insan-perspektifli sorunlara** odaklanır: gerçek kullanıcı akışları, edge case'ler, içerik kalitesi, görsel polish, edge browser'lar, gerçek mobil cihaz davranışı.

Her kategori **ayrı oturumda** yapılır (bağımsız scope, kendi içinde başlangıç + sonuç). Bulunan her bug için ayrı issue/commit. Önceliği yüksek olan kategoriler önce.

## 8 Kategori

### 1. Yeni Kullanıcı Onboarding Testi (P0, ~1 saat)

**Ne**: Sıfırdan bir kullanıcı (yeni email + yeni cihaz/incognito) Tarifle'ye geldiğinde ilk 30 dakikada ne yaşar?

**Test akışı:**
1. Anasayfa landing (cookie banner, hero, CTA görünürlüğü)
2. Tarif keşfi (anonim) → "Kaydet" tıkla → giriş zorunlu hissi
3. /kayit formu (email valid, password strength, telefon yok, captcha?)
4. Welcome email (Resend) → inbox vs spam check, 5 dk içinde geliyor mu
5. Email doğrulama linki → success sayfa
6. İlk login → home page'de "profil eksik tamamla" banner
7. Profile düzenle (avatar + bio)
8. Dolap sayfası → empty state CTA → ilk 5 malzeme ekle
9. AI Asistan deneme → autocomplete, mantıklı öneri, hızlı dene chips
10. İlk tarifi favoriye ekle → bookmark animasyon
11. İlk koleksiyon oluştur ("Hafta sonu denemeleri")
12. Logout + 1 hafta sonra geri dön (session, tema, dil persistence)

**Çıktı**: Friction noktaları + bug listesi + UX iyileştirme önerileri.

---

### 2. Returning User Flow Testi (P0, ~45 dk)

**Ne**: Aktif kullanıcı (favori + koleksiyon + 5+ pişirme geçmişi) günlük tarifte hangi akışları kullanır?

**Test akışı:**
1. Login → personal shelf "Pişirdiklerim" doğru görünür
2. Anasayfa "Bu hafta en çok pişirilenler" + retention CTA'lar
3. AI Asistan → mevcut dolap içeriğine göre öneri
4. Menü planlayıcı → 7 günlük plan + alışveriş listesi export
5. /tarifler/[kategori] → fuzzy search + filter (cuisine + allergen + diet)
6. Tarif detay → pişirme modu (TTS) + step nav + timer
7. Pişirdim ✓ → rozet + dolap eksiltme
8. Yorum + yıldız bırak
9. Variation paylaş (markdown + opsiyonel görsel)
10. Bir kullanıcıyı follow et → feed update
11. PDF export → tek tarif + koleksiyon
12. Dark mode toggle + dil toggle (TR↔EN) + persistance

**Çıktı**: Returning user friction + perf gözlemi.

---

### 3. Sayfa/Route Smoke + 404 Audit (P0, ~30 dk)

**Ne**: Tüm public + auth route'ları gerçekten 200 dönüyor mu, beklenen içeriği render ediyor mu?

**Kapsam:**
- Public: anasayfa, /tarifler, /tarif/[3-5 random slug], /kategoriler, /tarifler/[17 kategori], /mutfak/[36 cuisine], /diyet/[5 diet], /etiket/[15 tag], /blog, /blog/[57 post], /yasal/[6 sayfa], /kesfet, /menu-planlayici landing, /ai-asistan, /hakkimizda, /iletisim
- Auth: /kayit, /giris, /sifre-sifirla, /dogrula
- Login required: /dolap, /favoriler, /koleksiyon, /profil/[username], /ayarlar, /bildirimler, /alisveris-listesi
- Admin: /admin/*, /admin/kalite (auth guard)
- API: /api/sitemap, /api/feed.xml, /api/llms.txt, /api/csp-report
- Error: 404 (geçersiz slug), 500 (force trigger)

**Nasıl yapılır:**
- `scripts/smoke-test.ts` extend (mevcut script + yeni paths)
- Her sayfa için: status 200, h1 var, no console error, no 5xx network call
- Random slugs için DB'den prod query (3-5 popular)
- Programatik landing'ler full enumeration

**Çıktı**: Status raporu (hangi route 200, hangi 404/500, hangi yavaş) + bulguya göre fix commit'leri.

---

### 4. Form + Input Edge Case Testi (P1, ~1 saat)

**Ne**: Tüm input alanları kötü/boundary input'lara nasıl tepki veriyor?

**Test setleri:**

**A. Auth formları:**
- Çok uzun email (300 char), invalid format
- Password: 1 char, 1000 char, sadece sayı, sadece harf, special char
- Email zaten kayıtlı (duplicate handling)
- Doğrulama token expired/invalid (24 saat sonrası)
- Şifre sıfırla token expired

**B. Content formları (yorum, variation):**
- HTML injection: `<script>alert(1)</script>`, `<img src=x onerror=...>`
- SQL injection attempt: `'; DROP TABLE--`
- Markdown edge: ![](javascript:alert(1)), [click](javascript:...)
- Unicode/emoji: çok uzun emoji string
- 10000 char yorum
- Boş submit (validation message)
- Rate limit: 50 yorum 1 dakikada (429)

**C. Search:**
- Boş query
- 500 char query
- Sadece special char
- TR character (öğürşıüç)
- SQL/XSS attempt
- Çok kısa (1-2 char)

**D. AI Asistan + Menü Planlayıcı:**
- Boş malzeme
- 50+ malzeme
- Çelişen filtreler (vegan + et)
- Zaman 0 dk
- Person count 0 ve 100

**E. Newsletter + iletişim:**
- Geçersiz email
- Disposable email (mailinator)
- Aynı email tekrar (idempotent mi)

**Çıktı**: Bulunan validation gap'leri için fix commit.

---

### 5. Performance + SEO + Structured Data Audit (P1, ~1 saat)

**A. Lighthouse:**
- 10 kritik sayfa (anasayfa, /tarifler, /tarif/[popular slug], /kategoriler/ana-yemekler, /mutfak/turk, /diyet/vegan, /blog, /blog/[popular], /ai-asistan, /menu-planlayici)
- Mobile + desktop preset
- Run 3x avg (variance kontrol)
- Hedef: Perf >= 85, SEO=100, A11y=100, BP >= 95

**B. Bundle analyzer:**
- `next build` çıktısı
- First-load JS budget kontrolü (landing < 150kb gzipped)
- Largest chunks → lazy load fırsatı

**C. Structured data:**
- Google Rich Results Test 5 sayfa (Recipe, Article, BreadcrumbList, FAQ, ItemList)
- schema.org validator
- Eksik field warning'leri

**D. Image optimization:**
- Hero/featured tarif görselleri AVIF/WebP
- Explicit width/height
- Lazy load below-fold
- Cloudinary transformation params doğru

**E. Cache check:**
- Vercel Analytics deploy sonrası ilk 5 dk
- ISR revalidate trigger doğru çalışıyor mu

**Çıktı**: Perf raporu + bottleneck listesi + öncelikli optimizasyon önerileri.

---

### 6. Accessibility Deep Audit (P1, ~45 dk)

**A. Keyboard navigation:**
- Tab order anasayfa → /tarifler → tarif detay → AI Asistan
- Skip link var mı, çalışıyor mu
- Modal trap (variation form, share modal, login modal)
- Escape key modal close
- Focus visible her interactive element

**B. Screen reader (NVDA Windows / VoiceOver Mac):**
- Anasayfa heading hierarchy mantıklı (h1>h2>h3)
- Tarif detay malzeme listesi `<ul>` doğru anons
- Form label association
- Button vs link semantik
- ARIA-live (toast notification, loading state)

**C. Color contrast (manuel):**
- Light mode primary CTA (--color-primary #a03b0f)
- Dark mode primary text on bg
- Disabled button state
- Hover/focus state contrast

**D. Touch target (mobil):**
- 44x44 minimum (Apple HIG)
- Bookmark button, share button, comment input
- Pagination buttons
- Tabs

**E. Reduced motion:**
- prefers-reduced-motion: reduce → animasyonlar kapalı/yumuşak
- Page transitions
- Hero parallax

**Çıktı**: A11y bulgu listesi + WCAG AA conformance raporu + fix commit'leri.

---

### 7. Bug Hunt + Edge Case + Security (P1, ~1 saat)

**A. Boundary conditions:**
- 0 yorum → empty state CTA
- 0 favori, 0 koleksiyon → onboarding hint
- 1 takipçi vs 999 takipçi → grammar correctness
- Tarife 0 ingredient (data corruption)
- Çok uzun başlık (200 char) → ellipsis

**B. Concurrent ops:**
- 2 tab aynı anda yorum yaz → idempotency
- Login → diğer tab logout → token refresh
- Aynı tarifte 2 cihazdan eş zamanlı pişirme modu

**C. Security:**
- CSP enforce kontrol (browser console violation)
- HSTS preload check
- X-Frame-Options DENY (iframe testi)
- CORS / API origin check
- Login brute force (rate limit 429)
- Search spam (rate limit)
- AI Asistan spam (Upstash Redis rate limit)
- Admin route'a non-admin login → 403/redirect
- Hidden field manipulation (form action)
- Cookie security (HttpOnly, Secure, SameSite)

**D. Data integrity:**
- audit-nutrition-anomaly tekrar koş (1162 anomali → düşmüş mü)
- check-allergen-source.ts (0 over-tag, 0 missing)
- Mod K v2 audit kalite (CORRECTION mantıklı mı)

**E. Network failures:**
- Offline mode (PWA cache hit/miss)
- 3G slow throttle
- API timeout (cron, Resend)

**Çıktı**: Security & robustness raporu + kritik bulgular için P0 fix.

---

### 8. Cross-Browser + Responsive + PWA (P2, ~45 dk)

**Browser matrix:**
- Chrome 120+ (Blink)
- Firefox 120+ (Gecko)
- Safari 17 macOS (WebKit)
- Edge 120+ (Blink)
- Mobile Safari iOS 17
- Chrome Android 120+

**Viewport setleri:**
- 320x568 (small mobile)
- 375x812 (iPhone)
- 768x1024 (tablet)
- 1024x768 (laptop)
- 1440x900 (desktop)
- 1920x1080 (wide)

**Test akışı:**
- Anasayfa → /tarifler → tarif detay → AI Asistan
- Pişirme modu (TTS Web Speech API kontrol)
- Dark mode toggle persistence
- Theme + dil cookie sync
- PWA install banner (Chrome only)
- PWA standalone mode

**Çıktı**: Browser-specific bug listesi.

---

## Toplam Tahmini Süre

| Kategori | Süre | Öncelik |
|---|---|---|
| 1. Yeni kullanıcı onboarding | ~1 saat | P0 |
| 2. Returning user flow | ~45 dk | P0 |
| 3. Sayfa/route smoke + 404 | ~30 dk | P0 |
| 4. Form + input edge case | ~1 saat | P1 |
| 5. Perf + SEO + structured data | ~1 saat | P1 |
| 6. A11y deep audit | ~45 dk | P1 |
| 7. Bug hunt + edge + security | ~1 saat | P1 |
| 8. Cross-browser + responsive + PWA | ~45 dk | P2 |
| **Toplam** | **~7 saat** | (8 oturuma yayılır) |

## Tools matrisi

- **Otomatik script genişletme**: smoke-test.ts (3), audit-nutrition-anomaly (7D), seo-validator
- **Browser preview MCP**: 1, 2, 3, 4, 6, 8 (preview_eval, preview_screenshot, preview_inspect, preview_resize)
- **Lighthouse CLI**: 5
- **Manual cihaz**: 8 (gerçek iPhone/Android tercih)
- **Web research/external**: 4 (mailinator, disposable email)

## Öncelik sıralaması

**P0 (launch blocker):** 1 → 2 → 3 (~2.5 saat, 3 oturum). Kritik akışlar.
**P1 (kalite):** 4 → 6 → 7 → 5 (~3.5 saat, 4 oturum). Form+a11y öncelikli.
**P2 (nice-to-have):** 8 (~45 dk, 1 oturum). Cross-browser launch öncesi son pas.

**Önerim:** İlk oturumda **kategori 3 (sayfa/route smoke + 404)** ile başla, en hızlı ve en geniş kapsam.

---

## Bulgu raporu formatı

Her test oturumu sonunda:

```
## Kategori N test raporu (DD Nis 2026)

### Genel
- Toplam test edilen: X
- PASS: Y
- FAIL: Z
- WARN: W

### Bulgular
1. [P0/P1/P2] Bulgu başlığı
   - Sayfa/component
   - Beklenen vs gözlenen
   - Ekran görüntüsü (varsa)
   - Repro adımları
   - Önerilen fix
```

Her oturumda raporu `docs/TEST_REPORT_OTURUM_26_KATEGORI_N.md` olarak yazılır.
