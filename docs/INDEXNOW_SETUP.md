# IndexNow Setup, Bing / Yandex / Seznam otomatik ping

Tarifle'nin yeni/güncellenen içeriklerini Bing, Yandex, Seznam ve Naver'a
otomatik ping'lemesini sağlar. Manuel günlük submit (100/gün Bing,
10/gün Google) ihtiyacını ortadan kaldırır.

> Google IndexNow'u **desteklemiyor**. Google tarafı için Search Console +
> sitemap.xml + RSS feed yeterli (hepsi canlı).

## Kerem manuel adımları (tek sefer, ~5 dk)

### 1. Vercel env değişkenleri

Vercel → tarifle projesi → Settings → Environment Variables (Production):

```
INDEXNOW_KEY=d1277d55b71ba70595c7a887577dc9a0
INDEXNOW_CRON_SECRET=$(openssl rand -base64 32)
```

`INDEXNOW_KEY`, 32-char lowercase hex (yukarıdaki oturum 9'da üretildi).
Değiştirmek istersen `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"`.

`INDEXNOW_CRON_SECRET`, cron endpoint bearer auth. Newsletter cron ile
aynı pattern, ayrı secret (kaza önleme).

Lokal test için `.env.local`'e de ekle (git'lemez).

### 2. Deploy

Vercel env ekledikten sonra redeploy tetikle (boş commit yeter):

```
git commit --allow-empty -m "chore: deploy to pick up IndexNow env"
git push
```

Doğrula: `https://tarifle.app/d1277d55b71ba70595c7a887577dc9a0.txt` →
200 + plaintext `d1277d55b71ba70595c7a887577dc9a0` dönmeli.

### 3. Scheduler kur (iki seçenek)

**A) Vercel Cron** (önerilen, tek cron, yerinde):

`vercel.json` proje kökünde zaten hazır (oturum 9 sonu commit'lendi):

```json
{
  "crons": [
    { "path": "/api/cron/indexnow", "schedule": "0 8 * * 1" }
  ]
}
```

Pazartesi 11:00 TSİ (08:00 UTC). Son 7 gün eklenmiş/güncellenen tariflerden
liste toplanıp Bing + Yandex + Seznam'a tek POST ile gönderilir.

Vercel Cron Hobby tier'da günde 1, haftada 1 yeterli. Pro tier no-limit.

**Auth:** Endpoint Vercel Cron isteklerini `x-vercel-cron: 1` header ile
doğrular (Vercel edge otomatik enjekte eder, dışarıdan spoof edilemez).
Manuel tetik/QStash için hâlâ `INDEXNOW_CRON_SECRET` bearer kabul eder
Her iki yol da birlikte çalışır.

**B) Upstash QStash** (newsletter cron zaten burada):

QStash dashboard → Create Schedule:
- Destination: `https://tarifle.app/api/cron/indexnow`
- Schedule: `0 8 * * 1` (pazartesi 11:00 TSİ)
- Headers: `Authorization: Bearer <INDEXNOW_CRON_SECRET>`

### 4. İlk bulk ping (tek sefer, 2320 tarif)

Lokalden manuel:

```
npx tsx scripts/indexnow-ping.ts --all
```

Tüm PUBLISHED tarifleri tek API çağrısında gönderir (10k limit
rahat yetiyor). Bing index'e düşüş 24-72 saat.

## Sonraki akış

Haftalık cron çalıştıkça:
- Yeni eklenen tarifler → Bing'e 24 saat içinde push
- Güncellenen tarifler (update) → yine 24 saat içinde re-index sinyali
- Sitemap otomatik güncel (Prisma `updatedAt` desc), Bing ikincil kanal

Manuel tek sefer lazım olursa:

```
# Spesifik URL'ler
npx tsx scripts/indexnow-ping.ts --urls "https://tarifle.app/tarif/abc,..."

# Son 200 tarif
npx tsx scripts/indexnow-ping.ts --recent 200

# docs/search-submission-urls.txt'i tümden ping
npx tsx scripts/indexnow-ping.ts --file docs/search-submission-urls.txt
```

## Doğrulama & debugging

Key file erişilebilirliği:

```
curl -v https://tarifle.app/d1277d55b71ba70595c7a887577dc9a0.txt
```

200 + plaintext beklenir. 404 gelirse env eksik veya deploy tetiklenmemiş.

Cron endpoint manuel tetik:

```
curl -H "Authorization: Bearer $INDEXNOW_CRON_SECRET" \
  https://tarifle.app/api/cron/indexnow
```

Dönüş JSON: `{ ok: true, submitted: N, windowDays: 7, ... }`.

Bing Webmaster Tools (https://www.bing.com/webmasters) → "URL Submission"
tabında günlük submitted count'u gör. Tipik 24-48 saat sonra `Indexed`
sayısı artar.

## Mimari notlar

- **Key rotation:** env güncelle + redeploy. Middleware çalışma zamanında
  env okuyor, yeni key ile eski anahtar invalidate olur.
- **Edge Function:** `src/middleware.ts` Edge runtime (Prisma yok,
  ağır bağımlılık yok). 1MB Vercel limit'e uzak.
- **Idempotent:** Aynı URL tekrar ping'lenebilir, IndexNow spec gereği
  penalty yok.
- **Rate limit:** Tek istek başına 10 000 URL. `pingIndexNow` helper
  gerekirse chunk'lar.
- **Observability:** Cron endpoint JSON summary döner; Sentry
  istisna yakalar (endpoint 500 olursa alert tetiklenir).
