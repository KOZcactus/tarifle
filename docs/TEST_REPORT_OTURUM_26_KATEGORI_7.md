# Test Report: Oturum 26 Kategori 7 (Bug Hunt + Edge Case + Security)

Tarih: 2026-04-27 (oturum 26)
Test kapsamı: Security headers + cookie + auth bypass + XSS + boundary + rate limit + data integrity
Süre: ~1 saat
Yöntem: curl HTTP header inspection + browser preview MCP + tek-seferlik mock USER user (oturum26-k7@tarifle.local) + scripts (allergen + nutrition audit)

## Özet (üst seviye)

| Test | Sonuç |
|---|---|
| Security headers (localhost) | ✅ CSP enforce + X-Frame-Options DENY + nosniff + Referrer-Policy + Permissions-Policy |
| Security headers (prod) | ✅ Yukarıdakiler + HSTS max-age=63072000 (2 yıl) |
| HSTS hardening | ⚠️ includeSubDomains + preload yok (P2) |
| Cookie security (Auth.js) | ✅ session-token HttpOnly (JS document.cookie'den görünmüyor) |
| Auth bypass (USER → /admin) | ✅ Anasayfaya redirect (P3: silent, toast iyileştirme) |
| XSS in search query | ✅ Entity-encoded (`&lt;script&gt;`), React auto-escape ✓ |
| 500 char query | ⚠️ 200 OK, 0.62s response (P3: server cap yok) |
| Login rate limit (curl 10x) | ⚠️ Tüm 302 (test invalid - CSRF eksik). Source-code rate limit MEVCUT (auth.ts checkRateLimit('login')) |
| Allergen consistency | ✅ TEMİZ (0 over-tag, 0 missing on 3518 source recipes) |
| Nutrition anomaly | ⚠️ 1162 → 1181 (Mod K v2 sonrası ingredient değişti, recompute gerekli) |

## Bulgular

### P0 - Launch blocker
**Yok.**

### P1 - Yüksek değer
**Yok yeni P1.** Login rate limit infrastructure mevcut, test methodolojisi invalid (curl CSRF eksik) - production'da real e2e ile doğrulanmalı.

### P2 - Monitoring / iyileştirme

**1. HSTS hardening (includeSubDomains + preload eksik)**
- Lokasyon: prod response header
- Mevcut: `Strict-Transport-Security: max-age=63072000` (2 yıl, 2-year caching)
- Önerilen: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- Plus: hstspreload.org'a `tarifle.app` submit (Chrome HSTS preload list)
- Etki: Subdomain'lerde HTTPS-only force + first-visit'te bile HSTS protection
- Acil değil, prod ship'lendi sonrası standart hardening

**2. Search query server-side maxLength cap yok**
- Lokasyon: `/tarifler?q=...`
- Mevcut: 500 char query 200 OK, 0.62s response
- Sorun: Aşırı uzun query (10000 char) full-text search load oluşturabilir
- Önerilen: Server-side Zod schema veya middleware'de `q.max(200)` cap
- Etki: DoS amplification engellenir
- Acil değil, prod CDN cache + Vercel function timeout zaten koruma sağlıyor

**3. Nutrition anomaly count Mod K v2 sonrası arttı**
- Önceki (oturum 25 baseline): 1162 anomali (763 high + 398 medium + 1 low)
- Mevcut: 1181 anomali (776 high + 404 medium + 1 low) - +19 net artış
- Sebep: Mod K v2 8 batch + 7 manuel mini-rev sonrası ingredient list değişti (örn. denizli-yen-boregi mısır unu + kuzu kıyma + iç yağı), ama macro fields (averageCalories/protein/carbs/fat) recompute edilmedi
- Önerilen: Mod K v2 batch apply pipeline'a nutrition recompute step eklenmeli (apply → audit-nutrition-anomaly auto). Veya ayrı script `recompute-nutrition.ts` Mod K bitince koşturulur.
- Etki: Tarif doğru ingredient ile yazıldı ama macro değerleri eskimiş; user "1 porsiyon = 250 kcal" görür ama gerçek 350 kcal olabilir
- Mod K v2 71 sub-batch tamamlanınca recompute en mantıklı

### P3 - Düşük öncelik

**4. USER role /admin silent redirect**
- Lokasyon: middleware veya admin layout auth guard
- Mevcut: USER role mock user `/admin` → `/` redirect (no toast/feedback)
- Önerilen: Sayfaya redirect öncesi toast/banner "Bu sayfaya erişim yetkin yok" + `/giris?error=AccessDenied`
- Etki: User feedback (niye redirect olduğunu bilir)
- Acil değil, security açısından doğru çalışıyor

## PASS bulguları (iyi pattern, sürdürmek için kayıt)

**1. CSP ENFORCE (Report-Only değil)**
- Full directive set: default-src + script-src (unsafe-inline+eval Vercel/Sentry için) + worker-src blob: + style-src (Google Fonts) + img-src (Cloudinary + Google avatar) + font-src + connect-src (Vitals + Sentry) + frame-ancestors 'none' + form-action 'self' + base-uri 'self' + object-src 'none' + report-uri /api/csp-report
- 14 gün Sentry monitoring sonrası enforce'a geçildi (oturum 21)
- 'unsafe-inline' + 'unsafe-eval' Next.js + Vercel Analytics + Sentry inline script için zorunlu (modern app pattern)

**2. Production HSTS aktif**
- `max-age=63072000` (2 yıl), HTTPS-only force
- HTTP → HTTPS redirect Vercel platform-level

**3. X-Frame-Options DENY + frame-ancestors 'none'**
- Çift koruma (header + CSP), clickjacking attack vector kapalı

**4. Cookie HttpOnly (Auth.js session)**
- `next-auth.session-token` JS'den okunamıyor (XSS-protected)
- document.cookie sadece public cookie'ler gösteriyor (tarifle_hero_v + NEXT_LOCALE + __next_hmr_refresh_hash__)

**5. Auth guard çalışıyor (USER → admin)**
- Mock USER role'lu user `/admin` ziyaretinde anasayfaya redirect
- Admin sub-route'ları aynı pattern (K3 smoke test'te zaten test edildi: 307 redirect)

**6. XSS auto-escape (React)**
- Search query `<script>alert(1)</script>` URL-encoded gönderildi
- HTML response'da `&lt;script&gt;alert(1)&lt;/script&gt;` (entity-encoded) görünüyor
- React'in default JSX auto-escape çalışıyor, dangerouslySetInnerHTML yalnız JSON-LD için (oturum 26 K3 raporundaki React 19 warning, false-positive)

**7. Allergen consistency**
- check-allergen-source.ts: ✅ TEMİZ (0 over-tag, 0 missing on 3518 recipes)
- Pre-push hook'ta otomatik koşar, drift'i yakalar

**8. Login rate limit infrastructure mevcut**
- `src/lib/auth.ts` `checkRateLimit("login", rateLimitIdentifier(null, ip))` Upstash Redis ile entegre
- Plus auth.ts'de register + password-reset + forgot-password rate limit'leri de var (5 endpoint toplam)
- Production env'de Upstash Redis credentials zorunlu (dev mode'da stub olabilir)

## Test edilemediler (sınırlamalar)

- **Login rate limit real e2e**: curl CSRF eksik test, browser-based form submit ile gerçek brute force test gerek (5+ wrong → 6. attempt 429 mı?)
- **Concurrent ops**: 2 tab simulation MCP'de zor (single browser context)
- **Network failures (offline mode + 3G throttle)**: Lighthouse veya Chrome DevTools throttle profile gerek
- **PWA cache hit/miss**: real install + offline navigation test gerek
- **Cross-browser security headers**: Chrome OK, Safari + Firefox aynı pattern beklenir ama explicit test yok
- **CSRF protection real test**: form action + token validation, manuel POST denenmedi
- **SQL injection test**: Prisma parameterized queries OK by design, explicit pen test yok

## Test ortamı

- Curl HTTP header inspection (localhost + tarifle.app prod)
- Browser preview MCP (Chrome DevTools, document.cookie API)
- Mock USER role: `oturum26-k7@tarifle.local` (auth bypass test için, --delete cleanup)
- Scripts: `check-allergen-source.ts` (3518 source recipe), `audit-nutrition-anomaly.ts` (3517 published recipe)
- Source code review: `src/lib/auth.ts` rate limit, validators.ts password schema

## Sonraki adım

K7 bulguları küçük (0 P0 + 0 yeni P1 + 3 P2 + 1 P3). Production prod ship'lendi sonrası standart security hardening:

1. **HSTS includeSubDomains + preload** (5 dk Vercel header config edit + hstspreload.org submit)
2. **Search query server cap** (15 dk Zod middleware veya page-level)
3. **Nutrition recompute Mod K v2 bitince** (script mevcut, sadece pipeline'a eklenecek - 5 dk)
4. **USER /admin toast** (15 dk middleware veya layout fallback UI)

Test Campaign sıradakiler:
- **K6 (A11y Deep Audit, P1, ~45 dk)** - keyboard, screen reader, color contrast, K3'te bulunan breadcrumb 18px touch target
- **K4 (Form + Input Edge Case, P1, ~1 saat)** - daha derin form test (already covered partially)
- **K5 (Perf + SEO + Structured Data, P1, ~1 saat)** - Lighthouse + Rich Results Test
- **K8 (Cross-browser + Responsive + PWA, P2, ~45 dk)** - real cihaz test, gerçek iOS Safari
