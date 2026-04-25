# Tarifle Test Planı (Launch Öncesi)

Tarifle launch'a yaklaşırken manuel test yetersiz; otomatik test katmanlarıyla
kritik akışları sürekli doğrulama gerek. Mevcut altyapı (752 unit + 16 E2E)
zaten güçlü: bu plan **kalan boşlukları** + **launch gates** + **deploy
sonrası verification** sürecini tarif eder.

---

## Test Piramidi (mevcut + planlanan)

```
                  ▲
                 ╱╲    Manual + Lighthouse + a11y audit
                ╱  ╲   (haftada 1, launch öncesi 1 tam tur)
               ╱────╲
              ╱      ╲  E2E Critical Path (Playwright, 16+ spec)
             ╱        ╲ (her PR + nightly)
            ╱──────────╲
           ╱            ╲ Integration (Vitest + Prisma test DB)
          ╱   1-2 yeni    ╲ (her commit)
         ╱──────────────────╲
        ╱                    ╲ Unit (Vitest, 752+)
       ╱                      ╲ (her commit, < 30s)
      ╱────────────────────────╲
```

---

## 1. Smoke Test (deploy sonrası, ~30 sn)

**Amaç**: Vercel deploy sonrası kritik endpoint'lerin 200 döndüğü, security
header'larının düşmediği, structured data'nın geçerli olduğu hızlı doğrulama.

### Kapsam
- [x] Ana sayfa (`/`) 200, HTML doğru, hero render ediyor
- [x] Listing pages (`/tarifler`, `/kategoriler`, `/blog`, `/kesfet`) 200
- [x] Random 3 tarif slug detail page 200
- [x] Random 1 blog slug detail page 200
- [x] Sitemap.xml + robots.txt + manifest.json valid + parse edilebilir
- [x] OG image endpoint çalışıyor (`/blog/[slug]/opengraph-image`)
- [x] Security headers: HSTS, X-Frame-Options, X-Content-Type-Options, CSP Report-Only
- [x] Cron endpoint'leri 401 dönüyor (auth guard): 4 cron için
- [x] CSP report endpoint POST kabul ediyor (200 + log)
- [x] Article + BreadcrumbList JSON-LD blog detail'de var

### Implementation
`scripts/smoke-test.ts` (bu commit ile ship). Çalıştırma:
```bash
SMOKE_BASE_URL=https://tarifle.app npm run smoke
```

Cron job veya GitHub Actions post-deploy hook olarak haftalık koşulabilir.

---

## 2. E2E Critical Path (Playwright, mevcut + planlanan)

**Mevcut spec'ler** (`tests/e2e/`):
- `home.spec.ts`: anasayfa render
- `auth-pages.spec.ts` + `auth-roundtrip.spec.ts`: kayıt + giriş + logout
- `recipe-detail.spec.ts`: tarif detay sayfası
- `search-autocomplete.spec.ts` + `search-detail-bookmark-flow.spec.ts`
- `ai-asistan-flow.spec.ts`: AI asistan kural-tabanlı akış
- `menu-planner-ai.spec.ts`: haftalık menü planlama
- `cooking-mode-flow.spec.ts`: pişirme modu (TTS, timer, step nav)
- `collection-flow.spec.ts`: koleksiyon CRUD
- `shopping-list-flow.spec.ts`: alışveriş listesi
- `review-flow.spec.ts` + `variation-flow.spec.ts`: yorum + uyarlama
- `notifications.spec.ts`: bildirim
- `a11y-audit.spec.ts`: axe-core ile WCAG smoke

### Planlanan eklemeler (oturum 19 yeni feature'ları)
- [ ] **`welcome-email-flow.spec.ts`**: Kayıt sonrası welcome email mock + içerik doğrulama
- [ ] **`profile-banner.spec.ts`**: Profil eksik banner görünür/dismissable testi (login + bio NULL)
- [ ] **`kvkk-delete-account.spec.ts`**: deleteAccountAction transaction (auth + rate limit + cascade) + newsletter orphan cleanup
- [ ] **`error-boundary-recovery.spec.ts`**: 4 sub-route error.tsx (tarif, dolap, ai-asistan, admin) reset butonu
- [ ] **`csp-report-endpoint.spec.ts`**: `/api/csp-report` POST + Sentry forward
- [ ] **`pwa-i18n-standalone.spec.ts`**: PWA standalone modu cookie + locale + raw key check
- [ ] **`newsletter-subscribe-confirm.spec.ts`**: footer subscribe + confirm email + unsubscribe link

### Çalıştırma
```bash
npx playwright test                    # tümü, local dev server boot
npx playwright test --ui              # UI runner (debug)
npx playwright test home.spec.ts      # tek spec
CI=1 npx playwright test              # CI mode (chromium only, retries 2)
```

---

## 3. Visual Regression (Playwright screenshot)

**Amaç**: CSS/component değişiklikleri görsel bozulma yarattı mı yakala.

### Kapsam (planlanan)
- [ ] Anasayfa hero (light + dark theme)
- [ ] Tarif detay (random 1 popüler slug)
- [ ] Blog detay
- [ ] /tarifler listing
- [ ] /ai-asistan formu
- [ ] /dolap (login + 3 item): auth fixture
- [ ] /menu-planlayici grid
- [ ] Cooking Mode aktif step

### Implementation
`tests/e2e/visual/` klasörü altında `*.visual.spec.ts`. Playwright built-in
`expect(page).toHaveScreenshot()` snapshot. Baseline `*.png` git'e commit
edilir, değişiklik fark üretirse PR review'da görsel diff gösterilir.

---

## 4. Lighthouse CI (perf + a11y + SEO + best practices)

**Amaç**: Performance regression + a11y + SEO baseline koruması.

### Kapsam (planlanan)
- Anasayfa, /tarifler, /tarif/[slug], /blog, /ai-asistan, /menu-planlayici
- Mobile + desktop preset
- Hedef skorlar:
  - Performance ≥ 75 (mevcut ~73)
  - Accessibility ≥ 95
  - Best Practices ≥ 95
  - SEO ≥ 100

### Implementation
`@lhci/cli` paketi + `.lighthouserc.js` config. GitHub Actions post-deploy
hook olarak koşar; baseline'dan -5 puan düşüşü PR'da yorum olarak yazar.

---

## 5. DB Integrity (audit-deep)

**Amaç**: Tarif content drift, allergen tutarlılığı, foreign key bütünlüğü.

### Mevcut
- `scripts/audit-deep.ts`: kapsamlı audit (oturum 19'da 4 vegan+SUT
  CRITICAL'i bu raporladı)
- Haftalık cron `/api/cron/audit-report` (Pazartesi 07:00 UTC)
- Sentry alert: CRITICAL > 0 ise ekibe bildirim

### Tetikleme
```bash
npx tsx scripts/audit-deep.ts                     # local dev DB
DATABASE_URL=... npx tsx scripts/audit-deep.ts    # prod (read-only audit)
```

### Launch öncesi
Manuel olarak prod'da bir kez koş, RESULT PASS olduğundan emin ol.

---

## 6. Security Smoke

**Amaç**: Header'lar düşmedi, rate limit aktif, CSP report çalışıyor.

### Kapsam
- [x] HSTS `max-age=63072000`
- [x] X-Content-Type-Options: nosniff
- [x] X-Frame-Options: DENY
- [x] Referrer-Policy: strict-origin-when-cross-origin
- [x] Permissions-Policy: camera/microphone/geolocation ()
- [x] Content-Security-Policy-Report-Only aktif
- [ ] Rate limit endpoint test (login 6 kere → 429 al)
- [ ] CSP report POST → /api/csp-report 204
- [ ] /api/cron/* endpoint'leri auth'suz 401
- [ ] DMARC kaydı (yetkili DNS check, launch öncesi DNS hazırlık sonrası)

### Implementation
`scripts/smoke-test.ts` içinde header + endpoint check. Rate limit için ayrı
spec (yan etki ister).

---

## 7. Email Deliverability

**Amaç**: Resend prod'a mail gerçekten gidiyor mu, spam'e düşmüyor mu.

### Mail tipleri
- [x] Verification email (kayıt sonrası fire-and-forget)
- [x] Welcome email (oturum 19 yeni)
- [x] Password reset
- [x] OAuth-only password reset
- [x] Newsletter weekly (Pazartesi 06:00 UTC cron)

### Test akışı (manuel, launch öncesi 1 tur)
1. Yeni email adresine kayıt ol → 2 email gelmeli (verification + welcome)
2. Inbox'ta görünüyor mu (spam değil)
3. Welcome email link'leri çalışıyor mu (CTA → /, blog link → /blog)
4. Verification token tıklama → /dogrula/[token] success
5. Şifre sıfırlama isteği → reset link gelmeli
6. Newsletter footer subscribe → confirm email + unsubscribe link

### Spam check
- mail-tester.com'a verification email yolla, **8/10+ skor** beklenir
- DKIM PASS, SPF PASS doğrulanmalı (DMARC eklendiyse o da PASS)

---

## 8. PWA Smoke

**Amaç**: PWA install + standalone mode + cache + manifest.

### Kapsam
- [x] Manifest.json `display: standalone`, ikon dosyaları erişilebilir
- [x] Tarayıcıda "Ana ekrana ekle" prompt görünür
- [x] Standalone mode'da i18n key'leri **resolve** ediyor (oturum 19 home dupe bug fix sonrası)
- [ ] Service worker (varsa) cache stale değil, deploy sonrası yenileniyor
- [ ] Offline mode behavior (varsayılan: 200 + statik HTML, dynamic fail)

### Test akışı
Chrome DevTools → Application → Manifest panel → install. Sonra standalone
pencerede:
- Anasayfa render
- /tarifler navigation
- Login + AI asistan flow
- "home.heroTitle" gibi raw key görünmemeli

---

## 9. Cron Health Smoke

**Amaç**: Pazartesi cron'ların gerçekten çalıştığını doğrula.

### Cron'lar
- `/api/cron/leaderboard`: Pazartesi 05:00 UTC
- `/api/cron/newsletter`: Pazartesi 06:00 UTC
- `/api/cron/audit-report`: Pazartesi 07:00 UTC
- `/api/cron/indexnow`: Pazartesi 08:00 UTC

### Doğrulama
- Vercel Dashboard → Crons sayfası → son çalışma timestamp + duration + status
- Sentry → cron tag'li issue yoksa OK
- Audit-report cron CRITICAL bulduysa Sentry message gönderir, alert tetiklenir

### Manuel test
```bash
# Local dev'de cron tetikleme (header simulate)
curl -H "Authorization: Bearer $AUDIT_CRON_SECRET" \
  http://localhost:3000/api/cron/audit-report
```

---

## 10. Launch Checklist (manual, 1 tur)

Launch'tan 24 saat önce:

- [ ] `scripts/smoke-test.ts` prod'a karşı PASS
- [ ] `npx tsx scripts/audit-deep.ts` prod RESULT PASS, 0 CRITICAL
- [ ] Playwright `--project=chromium` PASS (16+ E2E)
- [ ] Lighthouse manuel: 4 ana sayfa tipinde Perf ≥75, A11y ≥95, SEO ≥100
- [ ] Verification + welcome email manuel test (yeni hesap aç)
- [ ] Newsletter subscribe + confirm + unsubscribe tam tur
- [ ] Sentry son 7 gün error rate < 1% session
- [ ] Vercel cron'ların son çalışma sağlıklı
- [ ] DMARC TXT kaydı eklendi (Cloudflare DNS)
- [ ] CSP Report-Only Sentry'de violation olmadığı doğrulandı (1 hafta izleme)
- [ ] PWA install + standalone i18n çalışıyor (oturum 19 dupe bug regresyon yok)
- [ ] /tarif/[slug-rastgele] manuel kontrol (5-10 tane farklı bölge tarifi)
- [ ] Mobile responsiveness 320/375/768 kırılma noktaları kontrol
- [ ] Dark theme spot check (login + dolap + cooking mode)

Launch günü:
- [ ] Cron'lar canlı, sayfa yüklemesi smooth
- [ ] Sentry dashboard açık
- [ ] Vercel logs canlı izleme

Launch + 1 hafta:
- [ ] CSP Report-Only → enforce geçiş kararı (violation analizi)
- [ ] DMARC `p=none` → `p=quarantine` geçişi (rapor varsa)
- [ ] Hero A/B reenable kararı (yeterli trafik mi)

---

## 11. Test Implementasyonu Önceliği (sıralı)

**P1 (launch öncesi, ~3-5 saat)**:
1. `scripts/smoke-test.ts` ✅ ship (bu commit)
2. Welcome email + KVKK delete + profil banner E2E spec'leri (3 spec, 2 saat)
3. Visual regression baseline (5-7 sayfa screenshot, 1 saat)
4. Manuel launch checklist 1 tur (1 saat)

**P2 (launch sonrası 1-2 hafta)**:
5. Lighthouse CI GitHub Actions hook (1 saat)
6. Newsletter + PWA + CSP report E2E spec'leri (3 spec, 2 saat)
7. Cron health smoke automated (cron tag'li Sentry issue alert, 30 dk)

**P3 (launch sonrası, dedicated sprint)**:
8. Visual regression detaylı (15+ sayfa, dark+light, mobile+desktop)
9. Performance budget CI gate (Lighthouse threshold)
10. Cross-browser (Firefox + Safari) E2E

---

## Notlar

- **Test fixtures**: `tests/e2e/helpers/` klasörü: auth fixture, DB cleanup,
  random slug fetch helper'ları. Yeni spec yazarken bu pattern'i takip et.
- **Test DB**: E2E `.env.local`'daki gerçek dev DB'yi kullanıyor; test
  user'ları `keroli.aga2@gmail.com` gibi `keroli.aga[N]` pattern'iyle.
  Spec sonu cleanup şart.
- **Snapshot management**: Playwright snapshot'lar git'te commit'li.
  Görsel değişiklik PR'da diff render eder; UX onayı sonrası `--update-snapshots`.
- **Flaky test toleransı**: CI'da retry 2; flaky spec'i 3'üncü kez fail
  ederse `test.fail()` veya `.skip()` ile flag, root cause sonra incele.
