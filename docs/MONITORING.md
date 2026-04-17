# Tarifle — Monitoring & Ops Safety

Bugün (17 Nis 2026) prod login kırıldı (schema drift). Bunun bir daha
yaşanmaması için 2 savunma kuruldu + 1 denendi ama Neon uyumsuzluğu
nedeniyle geri alındı.

---

## 1. Manuel migration flow (zorunlu, runbook) ✅ aktif

**Vercel build-time auto-migrate denendi ama geri alındı** (`4d6a7fe`
commit'i). Sebep: Neon pooled connection üzerinden `prisma migrate
deploy` **P1002 lock timeout** veriyor. PgBouncer transaction pooling
mode'u Postgres advisory lock desteklemiyor; Prisma migration lock
mekanizması çalışmıyor. Bilinen bir Neon kısıtı.

Alternatif yaklaşımlar (gelecek iş):
- Ayrı bir "direct connection" URL (non-pooled) migration için
- GitHub Actions job: main push'ta `migrate deploy` koşsun (secret ile)
- Veya manuel flow'u disiplinle (runbook uygulanır)

**Şu anki disiplin:** Schema migration dev'e uyguladıktan sonra `main`
push öncesi **mutlaka** prod'a da uygula. Adımlar: `docs/PROD_PROMOTE.md`
bölüm A. Bugün gibi bir outage bir daha yaşanmaması için push öncesi
checklist:

- [ ] `prisma migrate dev` dev'e uygulandı
- [ ] **`prisma migrate deploy` prod'a da uygulandı** (PROD_PROMOTE runbook)
- [ ] `npm run build` lokal clean
- [ ] `git push` main

## 2. Destructive migration check — opsiyonel

`scripts/check-destructive-migration.ts` pending migration SQL'lerini
tarar. Build pipeline'a henüz entegre değil (auto-migrate ile birlikte
geri alındı). Manuel olarak koşmak için:

```bash
npm run db:check-destructive
```

Error pattern'lar:

| Pattern | Severity |
|---|---|
| `DROP TABLE` | ❌ error |
| `DROP COLUMN` | ❌ error |
| `TRUNCATE TABLE` | ❌ error |
| `DROP TYPE / DROP ENUM` | ❌ error |
| `DELETE FROM <t>` (tam tablo) | ❌ error |
| `ALTER TABLE ... TYPE` | ⚠️ warn |
| `DROP INDEX` | ⚠️ warn |

**Bypass** (kasıtlı destructive için tek seferlik):

```bash
ALLOW_DESTRUCTIVE_MIGRATION=1 npm run db:check-destructive
```

## 3. Sentry error tracking ✅ aktif + smoke test PASS

Kod altyapısı `src/` altında (`src/instrumentation.ts` +
`src/instrumentation-client.ts` + `src/sentry.{server,edge}.config.ts` +
`src/app/global-error.tsx` + `next.config.ts` `withSentryConfig`
wrapper). DSN env var yoksa SDK silently disabled — dev + preview'da
etki yok.

**Kritik Next.js 16 + src-folder gotcha:** `src/` konvansiyonu
kullanan projelerde instrumentation dosyaları **mutlaka** `src/`
altında olmalı, root'ta değil. Root'taki dosyaları Next discover
etmiyor → register() çağrılmıyor → Sentry server SDK hiç init olmuyor.
18 Nis oturumunda bu yakalandı (commit `de70a66`), smoke test öncesi
server event'leri hiç Sentry'ye ulaşmıyordu.

**Tunnel route `/api/tarifle-ingest`** — default `/monitoring`
EasyPrivacy/AdGuard filter listelerinde (ERR_BLOCKED_BY_CLIENT).
Obscure `/api/*` path'i ad-blocker'ları atlar.

### Vercel'de aktive etmek için Kerem'in yapacakları

1. **Sentry.io'da hesap aç** (ücretsiz tier 5K error/ay yeter)
2. Project oluştur: `tarifle-web`, Platform: Next.js
3. Proje ayarlarından şunları al:
   - **DSN** — `https://<key>@<org>.ingest.sentry.io/<project>`
   - **Organization slug** — örn. `tarifle-co`
   - **Project slug** — örn. `tarifle-web`
   - **Auth token** (Settings → Account → Auth Tokens, "project-releases" scope'lu)

4. **Vercel Environment Variables** (tarifle projesi → Settings):

| Key | Value | Scopes |
|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | DSN | All |
| `SENTRY_DSN` | Aynı DSN | Production |
| `SENTRY_ORG` | slug | Production |
| `SENTRY_PROJECT` | slug | Production |
| `SENTRY_AUTH_TOKEN` | token | Production |

5. **Prod smoke test** — tarifle.app/sentry-test (admin-only,
   `robots: noindex`). 3 buton (client throw / server action throw /
   RSC throw) Sentry Feed'de 3 ayrı event açar. 18 Nis oturumunda
   doğrulandı, route + nav link ileride health check için bırakıldı.

### Sentry capture'ın yakalayacağı senaryolar

- `authorize()` exception (bugünkü schema drift tipi)
- Server action `throw`
- RSC render hatası
- Middleware hatası
- Client-side uncaught exception + unhandled rejection
- Unhandled API route 500'ler

`NEXT_REDIRECT` ve `NEXT_NOT_FOUND` filtrelendi — normal akış gürültüsü
Sentry'ye düşmez.

### Alert kurallar ✅ aktif (18 Nis)

Sentry Alerts kurulumu canlı, email hedefi `koz.devs@gmail.com`:

| Alert | Trigger | Interval | Scope |
|---|---|---|---|
| `New issue — instant email` | A new issue is created | 5 min | All Envs |
| `Issue escalation — 10 events/hour` | Event frequency > 10 / 1 hour | 1 hour | production |

Notification kategorileri (`Settings → Account → Notifications`):
- **Issue Alerts** On (alert rule email'i)
- **Issue Workflow** On (regression/resolve state)
- **Spend** On (free tier quota — Errors + Replays + Spans kategorileri;
  Attachments/Cron/Profile/Uptime/Logs/Contributors/Seer Off)
- **Weekly Reports** On (haftalık özet)

Şu an tek Sentry member (Developer free plan 1 user limit). İkinci
maille yedek için Gmail forwarding rule veya Team plan ($26/ay) ile
invite. Alert action'ı `Member → kozcactus`.

---

## Diğer öneriler (henüz değil, referans için)

- **DB restore runbook** (`docs/DB_RESTORE.md`) — Neon point-in-time restore 7 gün, adım adım
- **Vercel preview smoke test** — PR'da 5 kritik route 200 dönüyor mu
- **`.env.production.local` yedek** — 1Password / Bitwarden Vault
- **Uptime monitoring** — Better Stack veya Vercel'in kendi monitoring'i (Pro+)
- **Synthetic test** — dakikada bir tarif detay sayfasını fetch (200 check)

## Checklist — Deploy öncesi

- [ ] `npm run typecheck` clean
- [ ] `npm run test` clean
- [ ] `npm run db:check-destructive` yeşil
- [ ] `npm run build` lokal temiz
- [ ] Kritik path'lerde smoke test (login, tarif detay, /admin)
- [ ] Merge to main → Vercel auto-deploy → ekran görüntüsüyle doğrula
