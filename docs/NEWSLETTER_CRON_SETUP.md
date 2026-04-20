# Newsletter Cron Setup

Tarifle'nin haftalık "Editör Seçimi" bülten gönderim endpoint'i (`/api/cron/newsletter`) tetikleyici-agnostik: Bearer secret doğru geldiği sürece herhangi bir zamanlayıcıdan çağrılabilir. Bu dosya önerilen üç kurulumu anlatır.

## Ön koşullar

1. `.env.production.local` (Vercel Production env) dosyasına bir secret koy:

   ```bash
   openssl rand -base64 32
   ```

2. Vercel Dashboard → Project → Settings → Environment Variables → **Production**'a ekle:

   - `NEWSLETTER_CRON_SECRET=<yukaridaki deger>`

3. Redeploy et (env değişiklikleri build-time okunur).

4. Endpoint'i manuel test et:

   ```bash
   curl -H "Authorization: Bearer $NEWSLETTER_CRON_SECRET" \
     https://tarifle.app/api/cron/newsletter
   ```

   Beklenen: `{ ok: true, total: <n>, sent: <n>, failed: 0, durationMs: <ms> }`.

## Seçenek A, Upstash QStash (önerilen)

Tarifle zaten Upstash Redis'te rate-limit tutuyor. Aynı dashboard'dan QStash ücretsiz tier etkinleştirilebilir (500 mesaj/gün, yeterli).

1. console.upstash.com → **QStash** → **Schedule** → **Create schedule**.
2. Ayarlar:
   - **Destination**: `https://tarifle.app/api/cron/newsletter`
   - **Method**: `GET`
   - **Cron**: `0 7 * * 1` (pazartesi 10:00 TSİ = 07:00 UTC)
   - **Headers**: `Authorization: Bearer <NEWSLETTER_CRON_SECRET>`
3. Test için dashboard'daki **Publish now** tıkla, Vercel logs'ta response görünmeli.

**Artılar**: retry + dead letter + signature verification altyapı var, Vercel Hobby tier cron limitine bağlı değil.

**Eksi**: ayrı bir servis (ama zaten projede Upstash var).

## Seçenek B, Vercel Cron

Vercel Hobby tier günde 1 cron kısıtına tabi (haftalık bu yeterli), Pro tier limitsiz.

1. `vercel.json`'a ekle:

   ```json
   {
     "crons": [
       {
         "path": "/api/cron/newsletter",
         "schedule": "0 7 * * 1"
       }
     ]
   }
   ```

2. **Vercel Cron kendi `Authorization` header'ını göndermez**, endpoint buna karşı iki yol sunar:
   - **(a)** Vercel'in imzalı `x-vercel-cron-signature` header'ını ek olarak kontrol etmek için route'a bir if-branch ekle (şu an yok, ileriki iyileştirme).
   - **(b)** Geçici çözüm: `vercel.json` cron bloğuna `headers` verilemiyor, bu nedenle **Seçenek A (QStash) ile birlikte kullanılması önerilir**.

**Not**: Tarifle'nin `/api/warm` endpoint'i Vercel Cron ile zaten çalışıyor (public, auth gereksiz). Newsletter endpoint'i write olduğu için auth zorunlu, QStash'ın header desteği burada kritik.

## Seçenek C, GitHub Actions

Secret Kerem'in Vercel dışında tutuluyorsa veya extra servis istenmiyorsa:

```yaml
# .github/workflows/newsletter-weekly.yml
name: Newsletter Weekly
on:
  schedule:
    - cron: "0 7 * * 1"
  workflow_dispatch:

jobs:
  send:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger newsletter
        env:
          SECRET: ${{ secrets.NEWSLETTER_CRON_SECRET }}
        run: |
          curl -f -H "Authorization: Bearer $SECRET" \
            https://tarifle.app/api/cron/newsletter
```

GitHub repo Settings → Secrets and variables → Actions → `NEWSLETTER_CRON_SECRET` ekle.

**Artılar**: Vercel dışında, ücretsiz, repo ile versiyonlu.

**Eksi**: GitHub cron 5-15 dakika gecikebilir.

## Dahili akış

```
QStash / Vercel Cron / GH Action
         │  GET /api/cron/newsletter
         │  Authorization: Bearer <secret>
         ▼
  +-------------------------+
  | /api/cron/newsletter    |
  |                         |
  | 1. Bearer auth          |
  | 2. getActiveSubscribers |
  |    getNewsletterContent │  (paralel)
  | 3. her abone için:      |
  |    sendWeeklyNewsletter │  (sequential, 100ms gap)
  | 4. summary JSON         │
  +-------------------------+
         │
         ▼
     Resend API  →  abone gelen kutusu
```

## Rate limits

- **Resend free tier**: 10 mail/sec, 100/day. Endpoint sequential 100ms gap bırakıyor → Resend'i memnun ediyor. >100 subscriber olunca tier upgrade gerekir.
- **QStash free tier**: 500 publish/day, haftalık 1 schedule = 4-5/ay.

## Monitor

Vercel Logs → Functions → `/api/cron/newsletter`:

```json
{
  "ok": true,
  "total": 42,
  "sent": 41,
  "failed": 1,
  "durationMs": 8321,
  "errors": [
    { "email": "j***@example.com", "error": "Invalid `to` field" }
  ]
}
```

Hata oranı >%10 aşarsa içerik/kurulum sorunu, Sentry alert kural eklenebilir (ayrı iş).

## Düşük riskli manuel test akışı

1. Dev'de `.env.local`'e `NEWSLETTER_CRON_SECRET=test123` koy.
2. Dev DB'de bir abone var olmalı, değilse:

   ```sql
   INSERT INTO "NewsletterSubscription"
     (id, email, status, "unsubscribeToken", "confirmedAt", "createdAt", "updatedAt")
   VALUES
     ('test', 'keroli.aga1@gmail.com', 'ACTIVE', 'dev-token', now(), now(), now());
   ```

3. `npm run dev` + `curl -H "Authorization: Bearer test123" http://localhost:3000/api/cron/newsletter`.
4. Resend API key boşsa `ConsoleEmailProvider` stdout'a basar, gerçek mail atmaz, güvenli dev testi.
