# Auto-migrate POC, Neon direct URL araştırması

> 18 Nis 2026 oturum 3, Yol A ship edildi (`scripts/migrate-prod.ts`). Yol B ve C hâlâ araştırma notu; ileride gündeme gelirse bu doküman referans.

## Kısa özet

`prisma migrate deploy`'u Neon'un **pooled** connection URL'iyle koşunca P1002 lock timeout alınıyor (PgBouncer transaction mode advisory lock desteklemiyor). Çözüm: migrate komutunu Neon'un **direct** (non-pooled) URL'iyle koş. Uygulamanın runtime query'leri yine pooled URL'de kalır.

Bu doküman üç yolu karşılaştırıyor ve önerilen yaklaşımı anlatıyor.

## Neon URL anatomisi

Neon connection string'leri host prefix'iyle iki tip:

- **Pooled**, `ep-xxxxx-pooler.region.aws.neon.tech` (PgBouncer, transaction mode, statement pooling)
- **Direct**, `ep-xxxxx.region.aws.neon.tech` (doğrudan Postgres, advisory lock destekli)

Prisma'nın `prisma migrate` komutları migration lock için `pg_advisory_lock` kullanır. PgBouncer transaction mode'da advisory lock statement sonunda düşer → `P1002` timeout. Direct URL bu sorunu tamamen çözer.

Aynı Neon branch için iki URL'i console.neon.tech → Branch → Connection Details ekranından almak 30 saniye.

## Prisma 7 config sınırı

Klasik Prisma (6.x ve öncesi) schema datasource'unda:

```prisma
datasource db {
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

`directUrl` migrate komutlarında, `url` runtime'da otomatik kullanılır.

**Prisma 7'de bu yok.** `@prisma/config` v7.7'deki `Datasource` type:

```ts
export declare type Datasource = {
    url?: string;
    shadowDatabaseUrl?: string;
};
```

`directUrl` field'ı eklenmedi. Bunun yerine Prisma 7 ekosistemi "env override" pattern'ini benimsiyor, `prisma.config.ts` `process.env.DATABASE_URL` okur, migrate zamanında başka bir URL ile override edilir.

## Üç yol

### Yol A, Lokal wrapper script (manuel devam, az sürtünme)

`scripts/migrate-prod.ts`:
1. `.env.production.local`'den `DATABASE_URL` ve `DIRECT_DATABASE_URL` okur
2. `DIRECT_DATABASE_URL` varsa onu tercih eder, yoksa `DATABASE_URL`'den `-pooler` stripleyerek türetir
3. `process.env.DATABASE_URL`'i geçici override eder, `prisma migrate deploy` spawn eder
4. 3 saniyelik "son şans" banner + `--confirm-prod` zorunlu (destructive-script convention)

**Artı:** PowerShell/Bash tek-satır komuttan daha okunur, türevsel URL hataları önler, destructive guard içinde.
**Eksi:** Hâlâ manuel. Push öncesi hatırlanması gerek.

**Efor:** ~50 satır TypeScript. Yarım saat.

### Yol B, GitHub Actions workflow

`.github/workflows/migrate-prod.yml`:
- `main` push'ta tetiklenir (veya `workflow_dispatch` manuel)
- `PROD_DIRECT_DATABASE_URL` secret ile `prisma migrate deploy` koşar
- Başarısızsa job fail; Vercel deploy yine çalışır ama schema drift kalır (alert gerekli)

**Artı:** Tamamen otomatik. Vercel'dan bağımsız.
**Eksi:** Vercel deploy ile race var, migrate job bitmeden Vercel deploy başlayabilir. Schema değişiklikleri için Vercel'ı GitHub environment dependency ile bekletmek gerek (Vercel projesini GitHub environment'a bağlamak, ek kurulum).

Senkron akış sağlamak için 3 adım:
1. Workflow migrate koşar
2. Başarıyla bitince Vercel deploy hook'u manuel tetikler (deploy pause eden değişiklik)
3. Vercel webhook dinler, deploy etmeye başlar

Bu kısım "basit CI job" olmaktan çıkıyor, `vercel-pause` / `vercel-resume` akışı veya GitHub environment approval gerekir.

**Efor:** 2-3 saat. Vercel tarafı kurulumu da içerir.

### Yol C, Vercel build'de migrate (denendi, geri alındı)

Geçmişte yapıldı (`4b528d9` → `4d6a7fe` revert). Build script'e `prisma migrate deploy` eklendi, **pooled** URL ile P1002 yedi.

Aynı deney direct URL ile yapılabilir:

```json
"build": "DATABASE_URL=\"$DIRECT_DATABASE_URL\" prisma migrate deploy && next build"
```

Koşullar:
- Vercel Production env'e `DIRECT_DATABASE_URL` eklemek
- Dev/Preview build'lerini etkilememek için guard eklemek (sadece `VERCEL_ENV=production` iken migrate)

**Artı:** Tek yerde toplu. Deploy ↔ migrate atomik.
**Eksi:** Her deploy migrate çalıştırır (schema değişmediyse no-op, ama yine 5-10sn eklenir). Build fail migrate hatasından gelirse production kırılır, rollback discipline gerekir.

**Efor:** 1 saat. Risk profili orta (geçmişteki deney rollback'li).

## Öneri

**Kısa vade:** Yol A (lokal wrapper script). Sebep:
- Mevcut manuel akışı basitleştirir, kafaya takılan "PowerShell one-liner"dan kurtulur
- Destructive-guard convention'ına uyar (`--confirm-prod`)
- Vercel tarafında hiçbir değişiklik yok, risk sıfır
- Yol B veya C'ye geçerken öğrenilen desen yeniden kullanılır (DIRECT_DATABASE_URL env var)
- İmplemente etmek yarım saat

**Orta vade:** Eğer schema değişiklikleri sıklaşırsa Yol C (Vercel build-time direct migrate). Son 3 sprintte ~5 migration oldu (user locale + review moderation + moderation log + suspension + pg_trgm), haftalık-iki haftalık ritim. Otomatikleşmeye değer.

**Uzun vade (eğer lazım olursa):** Yol B (GitHub Actions). Çoklu environment'a ihtiyaç duyulursa (staging branch, canary vb.).

## Yol A, prototip

Aşağıdaki script `scripts/migrate-prod.ts` olarak eklenebilir. Henüz commit edilmedi, Kerem onayladıktan sonra shippable.

```ts
/**
 * Apply pending Prisma migrations to the production Neon branch using the
 * direct (non-pooled) connection URL. Avoids the PgBouncer advisory-lock
 * incompatibility that makes `prisma migrate deploy` hang with P1002 on
 * the pooled URL.
 *
 *   npx tsx scripts/migrate-prod.ts                  # dry-run status
 *   npx tsx scripts/migrate-prod.ts --apply --confirm-prod
 */
import { spawn } from "node:child_process";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.production.local") });

const APPLY = process.argv.includes("--apply");
const CONFIRM_PROD = process.argv.includes("--confirm-prod");

function resolveDirectUrl(): string {
  const direct = process.env.DIRECT_DATABASE_URL;
  if (direct) return direct;
  const pooled = process.env.DATABASE_URL;
  if (!pooled) throw new Error("DATABASE_URL not set in .env.production.local");
  const stripped = pooled.replace(/-pooler(\.[a-z0-9.-]+)/, "$1");
  if (stripped === pooled) {
    throw new Error(
      "Could not derive direct URL, DATABASE_URL doesn't contain '-pooler'. Add DIRECT_DATABASE_URL to .env.production.local explicitly.",
    );
  }
  return stripped;
}

async function main() {
  const directUrl = resolveDirectUrl();
  const host = new URL(directUrl).host;
  const isProd = host.startsWith("ep-prod-redacted");

  if (isProd && !CONFIRM_PROD) {
    console.error(`⛔ migrate-prod: production host detected (${host})`);
    console.error("Pass --confirm-prod to proceed.");
    process.exit(1);
  }

  const cmd = APPLY ? ["prisma", "migrate", "deploy"] : ["prisma", "migrate", "status"];
  const fullCmd = ["npx", ...cmd, "--config", "./prisma/prisma.config.ts"];

  console.log(`🎯 target: ${host}`);
  console.log(`⚡ running: ${fullCmd.join(" ")}\n`);

  if (isProd && APPLY) {
    console.log("⚠️  3 saniye içinde migrate deploy başlayacak, Ctrl+C iptal için.");
    await new Promise((r) => setTimeout(r, 3000));
  }

  const child = spawn(fullCmd[0], fullCmd.slice(1), {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: directUrl },
    shell: process.platform === "win32",
  });
  child.on("exit", (code) => process.exit(code ?? 1));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

Kerem onaylayınca:
1. `.env.production.local`'a (opsiyonel) `DIRECT_DATABASE_URL=<Neon direct URL>` ekle
2. Script'i `scripts/migrate-prod.ts` olarak commit et
3. `PROD_PROMOTE.md`'deki "Manuel flow" PowerShell bloğunu `npx tsx scripts/migrate-prod.ts --apply --confirm-prod` ile değiştir

## Test planı

POC'yi gerçek koşmadan önce:

1. Dev branch'i için script'i koş (dev host `ep-dev-redacted`, pool'lu URL → derive direct → migrate status)
2. `--apply` dev'de, idempotent (0 pending migration → no-op)
3. Prod ortamına dokunmadan önce Kerem'e direct URL'in Neon console'dan alındığını göster
4. İlk prod koşusu sadece `migrate status` (read-only) ile → connection çalıştığını doğrula
5. Sonraki schema migration geldiğinde `--apply --confirm-prod`

## Risk değerlendirmesi

- **Veri kaybı:** Yok, `migrate deploy` sadece migration dosyalarını uygular, mevcut veriyi silmez. `check-destructive-migration.ts` DROP/TRUNCATE tarar.
- **Schema drift:** Yol A manuel kaldığı için hâlâ "push öncesi hatırla" baskısı var. Checklist gerekir (PROD_PROMOTE.md'de zaten var).
- **Connection leak:** `spawn` child process sonunda exit eder, URL env sadece child'a enjekte edilir, parent shell'e sızmaz.
- **Secret rotation:** Direct URL bir secret, `.env.production.local` zaten gitignore'da, risk profili mevcut manuel akışla aynı.

## Sonraki adımlar

1. ✅ Araştırma + POC doküman (bu dosya)
2. ✅ Yol A script'i ship edildi, `scripts/migrate-prod.ts` (18 Nis oturum 3)
3. ✅ Dev'de `migrate status` ile test, `--env dev` PASS, direct URL derivation doğru
4. ⏳ Schema değişikliği geldiğinde prod'a ilk gerçek kullanım (`--apply --confirm-prod`)
5. ⏳ İlk 3 başarılı kullanım sonrası Yol C'yi (Vercel build-time) değerlendir
