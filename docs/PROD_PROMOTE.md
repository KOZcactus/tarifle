# Prod Promote Runbook

Tarifle'nin iki Neon branch'i var:

- **`production`** (parent) — tarifle.app + Vercel Production env
- **`dev`** (child) — lokal + Vercel Preview/Development env

## Aktif kurulum tablosu

| Katman | Production | Dev |
|---|---|---|
| Neon DB branch | `production` | `dev` (child of production) |
| Neon host prefix | `ep-broad-pond-...` | `ep-dry-bread-...` |
| Vercel env scope | Production | Preview + Development (a.k.a "All Pre-Production") |
| Vercel deploy tetikleyici | `main` branch push → tarifle.app | PR → `<hash>.vercel.app` preview URL |
| Lokal `.env.local` | — | ✅ dev URL (default) |
| Lokal `.env.production.local` | ✅ prod URL (gitignore'lı) | — |
| Destructive script guard | `--confirm-prod` zorunlu | Serbest geçer |
| Codex'in bildiği URL | ❌ (asla) | `codex-import` branch (kendi child'ı) |

Host prefix'leri `scripts/lib/db-env.ts`'de sabit. Branch reset edip farklı host alırsan o sabitleri de güncelle.

## Standart akış

Lokal `.env.local` varsayılan olarak **dev** branch'ine bakar. Prod'a yazmak için bu dosya iki şey yapmanı ister:

1. `DATABASE_URL`'i geçici olarak prod URL'ye override et
2. Scripti `--confirm-prod` flag'iyle koş

Her destructive script (`seed-recipes`, `fix-*`, `retrofit-*`, `rollback-batch`, `sync-*`, `patch-source-from-db`) `assertDbTarget()` ile başlar. Flag yoksa script durur:

```
⛔ [script-name] PRODUCTION DB (ep-broad-pond-...)

Bu script prod'a yazıyor. Emin değilsen durdur.
Devam etmek için: --confirm-prod flag'i gerekli.
```

## Normal akış

```
1. Codex (dev)  → seed  → dev Neon'a yazar
2. Claude       → audit → dev Neon'da doğrular
3. Claude       → fix'ler (varsa) → dev Neon
4. Kerem        → "prod'a geçir" onayı
5. Prod promote → aşağıdaki komutlar
```

## Schema migration — MANUEL (17 Nis 2026 deneme sonrası)

**Denedik, olmadı:** Auto-migrate (`build` script'inde `prisma migrate deploy`) Neon pooler connection'ı ile Prisma advisory lock çakışmasından dolayı `P1002 timeout` ile patlıyor. Neon'un pooled bağlantısı statement-level pooling yapar, advisory lock (`pg_advisory_lock`) korunmaz.

Çözüm senaryoları:
1. **Schema'ya `directUrl` ekle** + Vercel'e ayrı `DIRECT_URL` env var (Neon direct connection URL). Extra iş, henüz yapmadık.
2. **GitHub Actions ayrı job** — `main` push'unda prod'a migrate deploy. CI'da PROD_DATABASE_URL secret. Yine direct URL kullanır. Yapılacak iş.
3. **Manuel flow** — aşağıdaki adımlar. Şu an aktif.

### Manuel flow (mevcut)

Migration dev'e uygulanır, push öncesi prod'a da manuel uygulanır. `docs/MONITORING.md` deploy checklist'e bu adım **ZORUNLU** olarak eklendi.

**Schema değişikliği yaparken sıra:**

1. `prisma/schema.prisma` güncelle
2. `npx prisma migrate dev --config ./prisma/prisma.config.ts --name <isim>` → dev'e uygula
3. Kod değişikliklerini yap, commit'le
4. **PUSH ÖNCESİ** prod'a migration uygula (aşağıdaki komut)
5. `git push`

**PowerShell:**

```powershell
$env:DATABASE_URL = (Get-Content .env.production.local | Select-String '^DATABASE_URL' | ForEach-Object { $_ -replace '^DATABASE_URL="?','' -replace '"$','' })
npx prisma migrate deploy --config ./prisma/prisma.config.ts
Remove-Item Env:\DATABASE_URL
```

**Bash / Git Bash:**

```bash
PROD_URL=$(grep '^DATABASE_URL' .env.production.local | sed -E 's/^DATABASE_URL="?//; s/"$//')
DATABASE_URL="$PROD_URL" npx prisma migrate deploy --config ./prisma/prisma.config.ts
```

Destructive check lokalde push öncesi koş (kendin için):
```bash
npm run db:check-destructive
```

## Prod promote — hangi komutu ne zaman

### A. Sadece migration (schema değişti)

Yukarıdaki "Manuel flow" bölümüne bak — push öncesi prod'a migration uygulanır.

Eğer Vercel deploy öncesinde yine prod'a migration uygulamak istersen:

**PowerShell (Windows):**

```powershell
$env:DATABASE_URL = (Get-Content .env.production.local | Select-String '^DATABASE_URL' | ForEach-Object { $_ -replace '^DATABASE_URL="?','' -replace '"$','' })
npx prisma migrate deploy --config ./prisma/prisma.config.ts
Remove-Item Env:\DATABASE_URL
```

**Bash/Git Bash:**

```bash
DATABASE_URL="$(grep ^DATABASE_URL .env.production.local | cut -d'"' -f2)" \
  npx prisma migrate deploy --config ./prisma/prisma.config.ts
```

Migration deploy flag gerektirmez (Prisma'nın kendi komutu, `assertDbTarget` yok); ama `DATABASE_URL`'i geçici override yeterli — sonrasında hemen `unset` et ki alışkanlıkla yanlış script'i prod'a koşmayasın.

### B. Yeni tarif batch seed + retrofit + audit (Codex batch promote)

Dev'de batch temizse prod'a şu sırayla:

```bash
# 1. Env'i prod'a geçir (bu shell oturumu için)
$env:DATABASE_URL = (Get-Content .env.production.local | Select-String '^DATABASE_URL' | ForEach-Object { $_ -replace '^DATABASE_URL="?','' -replace '"$','' })

# 2. Seed (idempotent — zaten olanı atlar)
npx tsx scripts/seed-recipes.ts --confirm-prod

# 3. Retrofit (allergens + diet + cuisine)
npx tsx scripts/retrofit-all.ts --confirm-prod

# 4. Audit — PASS bekliyoruz
npx tsx scripts/audit-deep.ts

# 5. CRITICAL varsa ilgili fix'i apply (dev'de yaptıklarının aynısı)
npx tsx scripts/fix-critical-allergens-batch11.ts --apply --confirm-prod
npx tsx scripts/retrofit-diet-tags.ts --confirm-prod

# 6. Env'i temizle
Remove-Item Env:\DATABASE_URL
```

Her adımda 3 saniye "son şans" warning görürsün:

```
⚠️ [seed-recipes] PRODUCTION write (ep-broad-pond-...) — 3 saniye içinde başlayacak...
   İptal için Ctrl+C (şimdi).
```

### C. Tek seferlik fix (dev'de yakalanan bug prod'a da uygulanacak)

```bash
# 1. Fix scriptini önce dev'de --apply ile koş, audit PASS olduğunu gör
npx tsx scripts/fix-X.ts --apply

# 2. Prod override + --confirm-prod
$env:DATABASE_URL = (Get-Content .env.production.local | Select-String '^DATABASE_URL' | ForEach-Object { $_ -replace '^DATABASE_URL="?','' -replace '"$','' })
npx tsx scripts/fix-X.ts --apply --confirm-prod
Remove-Item Env:\DATABASE_URL

# 3. Prod audit
$env:DATABASE_URL = (Get-Content .env.production.local | Select-String '^DATABASE_URL' | ForEach-Object { $_ -replace '^DATABASE_URL="?','' -replace '"$','' })
npx tsx scripts/audit-deep.ts
Remove-Item Env:\DATABASE_URL
```

## Dev branch'i prod'la tekrar senkronize etmek

Prod'a birçok değişiklik gitti + dev geride kaldı → dev'i reset etmek istiyorsun:

1. **console.neon.tech** → tarifle → Branches → dev → **More** → **Reset from parent**
2. Onay ver; saniyeler içinde dev = prod snapshot'ı (copy-on-write)

Bu **destructive**: dev'deki extra deneyler silinir. Emin ol.

## Codex ne yapıyor?

Codex'in PC'sindeki `.env.local` **her zaman dev URL** içerir — prod URL'ini görmez. Codex batch push ettiğinde:

- GitHub'a push → Vercel Preview deploy tetiklenir (dev DB'ye bağlı)
- Kerem preview'a bakar, diff review eder
- Temizse main'e merge → Vercel Production deploy (prod DB)
- Prod'a seed ve retrofit'i Kerem bu runbook'la elle koşar

## Hata durumları

### Guard beni bloklıyor, ama dev'de çalışmak istiyorum

`.env.local` dev URL'ye bakmalı. Host prefix `ep-dry-bread` → guard "dev branch" der, serbest geçer. Eğer `ep-broad-pond` görürsen `.env.local` yanlış.

### Prod'a yanlışlıkla yazdım

Muhtemelen yazmadın — guard iki katman engel koyar:

1. `--confirm-prod` flag yoksa script exit 1 yapar, hiçbir query koşmaz
2. Flag varsa 3 saniye "son şans" warning bekler — Ctrl+C'e zamanın olur

Yine de şüphedeysen `audit-deep.ts` koş, değerleri prod'la karşılaştır (Neon dashboard → Tables).

### Migration prod'da farklı sonuç verirse

`prisma migrate deploy` idempotent. Farklı davrandıysa (ör. prod'da eksik bir kolon) manuel SQL + `prisma migrate resolve --applied` gerekebilir; sessiz kalma, Kerem'e flagle.

## Host prefix'leri güncellemek

`scripts/lib/db-env.ts`'de iki sabit var:

```ts
const PROD_HOST_PREFIX = "ep-broad-pond";
const DEV_HOST_PREFIX = "ep-dry-bread";
```

Neon branch'i sıfırlayıp farklı host alırsan buraya da yeni prefix'i yaz. Yoksa guard "unknown branch" der, warn verir ama devam eder — ideal değil.
