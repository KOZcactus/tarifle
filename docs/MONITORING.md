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

## 3. Sentry error tracking ✅ aktif (17 Nis'te kuruldu)

Kod altyapısı hazır (`sentry.{client,server,edge}.config.ts` +
`src/app/global-error.tsx` + `next.config.ts` wrapper). DSN env var
yoksa SDK silently disabled — dev + preview'da etki yok.

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

5. **Lokalde test** (opsiyonel) — `.env.local`'a aynı değerleri ekle, sonra:

```bash
# Tarayıcıda aç: http://localhost:3000/sentry-test
```

(Henüz bu route yok; eklemek istersen söyle.)

### Sentry capture'ın yakalayacağı senaryolar

- `authorize()` exception (bugünkü schema drift tipi)
- Server action `throw`
- RSC render hatası
- Middleware hatası
- Client-side uncaught exception + unhandled rejection
- Unhandled API route 500'ler

`NEXT_REDIRECT` ve `NEXT_NOT_FOUND` filtrelendi — normal akış gürültüsü
Sentry'ye düşmez.

### Alert kurallar (Sentry UI'da)

Önerilen kurallar:
- "Yeni issue" → Slack/email anında
- "Same issue 10 kere/1 saat" → email
- Daily digest → e-posta

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
