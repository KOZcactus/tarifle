# Haftalık DB Audit Cron, Kerem manuel adımları

Tarifle'nin `src/lib/audit/integrity-core.ts` modülü 14 hızlı
integrity check koşturur (orphan FK, duplicate email/username,
duplicate title, stale moderation, token cleanup). `/api/cron/audit-
report` endpoint'i bu check'i JSON olarak döndürür ve CRITICAL
finding varsa Sentry'ye error event atar.

## Scheduler: Vercel Cron (aktif)

`vercel.json`'da zaten tanımlı:

```json
{
  "path": "/api/cron/audit-report",
  "schedule": "0 7 * * 1"
}
```

Her pazartesi **07:00 UTC (10:00 TSİ)** otomatik koşar. IndexNow
cron'undan 1 saat önce, günlük trafik pikinden önce raporlama.

## Kerem manuel adım: `AUDIT_CRON_SECRET` Vercel env

Vercel Cron header'ı (`x-vercel-cron: 1`) edge tarafından enjekte
edilir, external spoof korumalı. Manuel test veya QStash fallback
için yine de secret gerekli (sadece Vercel'de çalışırsak bu step
opsiyonel, ama prod prosedürü için ekle).

```
# Terminal (tek seferlik)
openssl rand -base64 32
# Çıktıyı kopyala, Vercel dashboard:
#   Project Settings → Environment Variables
#   Name:  AUDIT_CRON_SECRET
#   Value: <kopya>
#   Environments: Production (Preview + Development opsiyonel)
```

## Manuel test

```sh
# Dev
curl http://localhost:3000/api/cron/audit-report \
  -H "Authorization: Bearer <AUDIT_CRON_SECRET>"

# Prod (Vercel deploy sonrası)
curl https://tarifle.app/api/cron/audit-report \
  -H "Authorization: Bearer <AUDIT_CRON_SECRET>"
```

Başarılı yanıt:

```json
{
  "ok": true,
  "report": {
    "timestamp": "2026-04-27T07:00:00.000Z",
    "totals": { "recipes": 2454, "users": 10, "variations": 7, "reviews": 3 },
    "findings": [],
    "summary": { "critical": 0, "warning": 0, "info": 0 }
  },
  "durationMs": 842
}
```

CRITICAL varsa:

```json
{
  "report": {
    "findings": [
      {
        "severity": "CRITICAL",
        "category": "orphan-fk",
        "message": "3 recipes point to deleted users via authorId",
        "value": 3
      }
    ],
    "summary": { "critical": 1, "warning": 0, "info": 0 }
  }
}
```

## Sentry alert

CRITICAL > 0 olduğunda otomatik `Sentry.captureMessage("Tarifle
integrity audit CRITICAL: ...", "error")`. Sentry projesi dashboard'ında
"Issues" sekmesinde görünür, mevcut alert rule'larından biriyle
bildirim alınır (email / Slack webhook, Kerem ayarına göre).

Manuel triage için her CRITICAL kategorisinde ne yapacağını
`docs/DB_AUDIT_2026-04-20.md` §2 (duplicate), §9 (iş paketi
önceliklendirme) anlatır.
