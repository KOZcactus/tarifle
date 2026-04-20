# Prod Promote Runbook

Tarifle'nin iki Neon branch'i var:

- **`production`** (parent), tarifle.app + Vercel Production env
- **`dev`** (child), lokal + Vercel Preview/Development env

## Aktif kurulum tablosu

| Katman | Production | Dev |
|---|---|---|
| Neon DB branch | `production` | `dev` (child of production) |
| Neon host prefix | `ep-broad-pond-...` | `ep-dry-bread-...` |
| Vercel env scope | Production | Preview + Development (a.k.a "All Pre-Production") |
| Vercel deploy tetikleyici | `main` branch push → tarifle.app | PR → `<hash>.vercel.app` preview URL |
| Lokal `.env.local` |, | ✅ dev URL (default) |
| Lokal `.env.production.local` | ✅ prod URL (gitignore'lı) |, |
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

## Schema migration, MANUEL (17 Nis 2026 deneme sonrası)

**Geçmiş:** Auto-migrate (`build` script'inde `prisma migrate deploy`) Neon pooler URL'iyle advisory lock çakışmasından `P1002 timeout` yedi (`4b528d9` → `4d6a7fe` revert). Neon'un pooled bağlantısı PgBouncer transaction mode, `pg_advisory_lock` korunmaz.

**Şu anki akış:** Manuel, ama PowerShell one-liner yerine `scripts/migrate-prod.ts` wrapper script kullanılıyor. Script Neon'un **direct (non-pooled)** URL'ini türetir (`-pooler` suffix strip) ve `DATABASE_URL`'i geçici override ederek migrate deploy spawn eder. Destructive-guard convention'a uyar (`--confirm-prod`).

Alternatif otomasyon yolları için bkz. `docs/AUTO_MIGRATE_POC.md`.

### Schema değişikliği yaparken sıra

1. `prisma/schema.prisma` güncelle
2. `npx prisma migrate dev --config ./prisma/prisma.config.ts --name <isim>` → dev'e uygula
3. Kod değişikliklerini yap, commit'le
4. **PUSH ÖNCESİ** prod'a migration uygula:

```bash
# Önce status kontrolü (read-only, herhangi bir değişiklik yapmaz)
npx tsx scripts/migrate-prod.ts

# Temizse apply
npx tsx scripts/migrate-prod.ts --apply --confirm-prod
```

5. `git push`

Script `.env.production.local`'den `DATABASE_URL`'i okur, `-pooler` suffix'ini çıkararak direct URL'e çevirir (advisory lock için gerekli). `DIRECT_DATABASE_URL` env var set edilmişse onu kullanır. Prod host detection: `--confirm-prod` olmadan prod'da koşmaz, koşunca 3 saniye iptal penceresi.

Dev ortamı testi (status kontrolü):

```bash
npx tsx scripts/migrate-prod.ts --env dev
```

Destructive check lokalde push öncesi koş (kendin için):
```bash
npm run db:check-destructive
```

## Prod promote, hangi komutu ne zaman

### A. Sadece migration (schema değişti)

Yukarıdaki "Schema değişikliği yaparken sıra" bölümüne bak, `scripts/migrate-prod.ts` wrapper'ı push öncesi prod'a migrate eder.

### B. Yeni tarif batch seed + retrofit + audit (Codex batch promote)

Dev'de batch temizse prod'a şu sırayla:

```bash
# 1. Env'i prod'a geçir (bu shell oturumu için)
$env:DATABASE_URL = (Get-Content .env.production.local | Select-String '^DATABASE_URL' | ForEach-Object { $_ -replace '^DATABASE_URL="?','' -replace '"$','' })

# 2. Seed (idempotent, zaten olanı atlar)
npx tsx scripts/seed-recipes.ts --confirm-prod

# 3. Retrofit (allergens + diet + cuisine)
npx tsx scripts/retrofit-all.ts --confirm-prod

# 4. Audit, PASS bekliyoruz
npx tsx scripts/audit-deep.ts

# 5. CRITICAL varsa ilgili fix'i apply (dev'de yaptıklarının aynısı)
npx tsx scripts/fix-critical-allergens-batch11.ts --apply --confirm-prod
npx tsx scripts/retrofit-diet-tags.ts --confirm-prod

# 6. Env'i temizle
Remove-Item Env:\DATABASE_URL
```

Her adımda 3 saniye "son şans" warning görürsün:

```
⚠️ [seed-recipes] PRODUCTION write (ep-broad-pond-...), 3 saniye içinde başlayacak...
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

Codex'in PC'sindeki `.env.local` **her zaman dev URL** içerir, prod URL'ini görmez. Codex batch push ettiğinde:

- GitHub'a push → Vercel Preview deploy tetiklenir (dev DB'ye bağlı)
- Kerem preview'a bakar, diff review eder
- Temizse main'e merge → Vercel Production deploy (prod DB)
- Prod'a seed ve retrofit'i Kerem bu runbook'la elle koşar

## Hata durumları

### Guard beni bloklıyor, ama dev'de çalışmak istiyorum

`.env.local` dev URL'ye bakmalı. Host prefix `ep-dry-bread` → guard "dev branch" der, serbest geçer. Eğer `ep-broad-pond` görürsen `.env.local` yanlış.

### Prod'a yanlışlıkla yazdım

Muhtemelen yazmadın, guard iki katman engel koyar:

1. `--confirm-prod` flag yoksa script exit 1 yapar, hiçbir query koşmaz
2. Flag varsa 3 saniye "son şans" warning bekler, Ctrl+C'e zamanın olur

Yine de şüphedeysen `audit-deep.ts` koş, değerleri prod'la karşılaştır (Neon dashboard → Tables).

### Migration prod'da farklı sonuç verirse

`prisma migrate deploy` idempotent. Farklı davrandıysa (ör. prod'da eksik bir kolon) manuel SQL + `prisma migrate resolve --applied` gerekebilir; sessiz kalma, Kerem'e flagle.

## Host prefix'leri güncellemek

`scripts/lib/db-env.ts`'de iki sabit var:

```ts
const PROD_HOST_PREFIX = "ep-broad-pond";
const DEV_HOST_PREFIX = "ep-dry-bread";
```

Neon branch'i sıfırlayıp farklı host alırsan buraya da yeni prefix'i yaz. Yoksa guard "unknown branch" der, warn verir ama devam eder, ideal değil.
