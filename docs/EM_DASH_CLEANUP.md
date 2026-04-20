# Em-dash (—) Temizliği, Session Planı

Kullanıcı geri bildirimi: em-dash metni "AI yazdı" hissi veriyor, her
yerden kaldırılacak. Bu dosya planı ve kalan scope'u tutar.

## Kural (AGENTS.md'de, buradan referans)

- Em-dash (—, U+2014) ve en-dash (–, U+2013) **yasak**.
- Yerine: virgül, noktalı virgül, nokta, parantez veya iki nokta.
- Hyphen (`-`) birleşik kelimede serbest ("scale-to-zero").
- Yeni yazılan her metinde kural geçerli. Mevcut dosyalarda temizlik iş
  paketi halinde ilerliyor.

## Oturum 9'da tamamlanan (bu session)

- ✅ `AGENTS.md`: kural eklendi + mevcut 2 em-dash temizlendi.
- ✅ `docs/CODEX_BATCH_BRIEF.md`: §3 yasaklara eklendi, mevcut 125
  em-dash temizlendi (kural açıklamasındaki U+2014 referansları hariç).
- ✅ `messages/tr.json`: 76 em-dash kaldırıldı + signature/subject
  formatları düzeltildi.
- ✅ `messages/en.json`: 88 em-dash kaldırıldı + paralel düzeltme.
- ✅ `src/**/*.{ts,tsx}`: 737 em-dash 205 dosyada temizlendi (user-facing
  metinler + kod yorumları dahil).
- ✅ `scripts/seed-recipes.ts`: 7 em-dash temizlendi (source-of-truth).
- ✅ `src/app/yasal/gizlilik/page.tsx`: "Auth.js session token" teknik
  açıklaması insancıl hale getirildi + em-dash kaldırıldı.

## Sonraki session(lar)da yapılacak

### 1. Çeviri batch JSON'ları (en acil, prod'da canlı)

```
docs/translations-batch-0.json   182 em-dash
docs/translations-batch-1.json    62 em-dash
docs/translations-batch-2.json    28 em-dash
```

Bu JSON'lar prod DB'deki `Recipe.translations` JSONB kolonuna merge
edilmiş durumda. Yani prod'daki EN/DE tarif metinleri bu em-dash'leri
içeriyor (tarif okuyucular görür).

**Plan:**
1. JSON dosyalarında toplu replace (` — ` → `, `), spot-check
2. `scripts/import-translations-b.ts` ile dev'e re-apply (shallow merge
   batch-0,1,2'nin title/description/tipNote/servingSuggestion/ingredients/
   steps alanlarını üzerine yazar, em-dash'siz versiyonla)
3. Prod'a aynı re-apply (`--apply --confirm-prod`)
4. Audit: prod DB'deki `Recipe.translations` içinde `—` grep'i 0 olmalı

### 2. Tarif TR içeriği (prod DB canlı)

`scripts/seed-recipes.ts` source temizlendi; ama **prod DB'deki mevcut
tariflerin description/tipNote/servingSuggestion TR alanları** seed'in
önceki halini yansıtıyor. Bu alanlarda em-dash hâlâ var.

**Sayım:** Prod DB'ye bir `SELECT count(*) WHERE description ~ '—'`
script'iyle başla.

**Plan:**
- Seçenek A, **hedefli script:** `scripts/patch-source-to-db.ts`
  benzeri bir script yaz, sadece em-dash içeren description/tipNote/
  servingSuggestion alanlarını source'tan okuyup DB'ye yansıt
  (idempotent, re-seed drift sıfır). Diff küçük olur, prod'a güvenle
  uygulanır.
- Seçenek B, **full re-seed:** Risk büyük (yeni/güncellenmiş her şey
  source'tan geliyor), review kayıtları etkilenmez ama tarif alanları
  baştan yazılır. Audit daha uzun.

Önerilen: Seçenek A.

### 3. Internal docs (tarihsel, düşük öncelik)

Bunlar prod'da görünmez, sadece repoyu okuyan geliştirici/agent
görür. Ama kural global olduğundan zamanla hepsi temizlenmeli:

```
docs/PROJECT_STATUS.md         419
docs/CHANGELOG.md              260
docs/TARIFLE_ULTIMATE_PLAN.md   71
docs/COMPETITIVE_ANALYSIS.md    62
docs/CODEX_HANDOFF.md           60
docs/RECIPE_FORMAT.md           37
docs/PERFORMANCE_BASELINE.md    33
docs/IMAGE_GENERATION_PLAN.md   30
docs/AUTO_MIGRATE_POC.md        19
docs/MONITORING.md              18
docs/SEO_SUBMISSION.md          15
docs/PROD_PROMOTE.md            14
docs/NEWSLETTER_CRON_SETUP.md    9
docs/CODEX_BATCH_BRIEF.md        7  (kural açıklaması referansları, kalabilir)
docs/INDEXNOW_SETUP.md           6
```

**Plan:** Tek toplu script ile hepsinde `' — '` → `', '` replace, spot
check. CHANGELOG ve PROJECT_STATUS'deki commit başlıkları tarihsel kayıt
olduğu için "aynen kalsın" denebilir, sonradan yazacakları etkilemez.

### 4. Lint otomasyonu (long-term guard)

ESLint custom rule veya pre-commit hook:
- Tüm `.ts`, `.tsx`, `.md`, `.json` dosyalarında em-dash (—) detector
- Commit öncesi `grep -rn '—' --include='*.ts' --include='*.tsx' --include='*.json' --include='*.md'` exit 1 olursa commit block
- `scripts/git-hooks/pre-commit` içine eklenir

## Özet

Bu session: **kurallar + user-facing metinler** (i18n + tsx + seed
source + legal gizlilik sayfası) tamamlandı. Toplam **1137 em-dash**
kaldırıldı, 0 CRITICAL regression.

Kalan iş: **prod DB tarif içerikleri** (translations JSON re-apply
+ TR content patch) + **internal docs** + **lint hook**. Tahmini
sonraki 1-2 session.
