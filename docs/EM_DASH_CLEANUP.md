# Em-dash (U+2014) Temizliği, Session Planı

Kullanıcı geri bildirimi: em-dash metni "AI yazdı" hissi veriyor; her
yerden kaldırıldı. Bu dosya kural özetini ve tarihsel kayıt olarak
yapılan işi tutar.

## Kural (AGENTS.md'de ana kaynak)

- Em-dash (U+2014) **yasak**.
- Yerine: virgül, noktalı virgül, nokta, parantez veya iki nokta.
- En-dash (U+2013) **serbest** (`1–2`, `2.7–3.3 s` gibi range separator).
- Hyphen (`-`) birleşik kelimede serbest (`scale-to-zero`).
- **Pre-push hook**: `scripts/check-emdash.mjs` her push öncesi tüm
  `.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.md` dosyalarında em-dash
  detector çalıştırır; eşleşme bulursa push bloklanır. Bypass
  `git push --no-verify`.

Hook istisna dosyaları (kural referansı veya tarihsel kayıt):

```
AGENTS.md
docs/CODEX_BATCH_BRIEF.md
docs/EM_DASH_CLEANUP.md
docs/PROJECT_STATUS.md
docs/CHANGELOG.md
```

## Oturum 9 sonunda tamamlanan

### Kural + altyapı
- AGENTS.md: em-dash yasak kuralı + alternatif punct örnekleri
- docs/CODEX_BATCH_BRIEF.md: §3 yasaklara Codex için madde eklendi
- scripts/check-emdash.mjs: pre-push guard (Node ile cross-platform
  reliable, bash escape sorunlarından kaçınma)
- scripts/git-hooks/pre-push: guard'ı koşturan komut eklendi

### Kaynak kod + UI
- AGENTS.md: 2 em-dash (kural hariç)
- messages/tr.json: 78 em-dash + signature/subject formatı
- messages/en.json: 92 em-dash + paralel düzeltmeler
- src/**/*.{ts,tsx}: 737 em-dash 205 dosyada (user-facing + yorumlar)
- scripts/**/*.ts: ~100 em-dash (toplu replace)
- next.config.ts, playwright.config.ts: ~10 em-dash (yorum satırları)
- scripts/seed-recipes.ts: 7 em-dash (source-of-truth)
- src/app/yasal/gizlilik/page.tsx: "Auth.js session token" teknik
  ifadesi insancıl hale getirildi
- Cookie banner, signature, fonksiyonel placeholder'lar

### Dokümantasyon (.md)
- docs/*.md: 1135 em-dash 17 dosyada (CHANGELOG ve PROJECT_STATUS
  istisna, tarihsel)
- scripts/git-hooks/README.md: 1 em-dash

### Veritabanı (dev + prod, script ile)
- scripts/fix-emdash-translations.ts (yeni): Recipe.translations JSONB
  içindeki EN/DE string alanlarında em-dash temizliği
- Dev DB: 163 tarif güncellendi, 272 em-dash silindi
- Prod DB: 163 tarif güncellendi, 272 em-dash silindi
- docs/translations-batch-0/1/2.json: 272 em-dash (source)

**Toplam temizlenen em-dash: ~2500+ karakter**

## Kapsam dışında bırakılan

- `prisma/migrations/` (eski migration SQL'leri, tarihsel kayıt)
- `test-results/`, `playwright-report/` (gitignore, auto-gen)
- `node_modules/`, `.next/`, `.git/`

## Sonraki geliştirmeler (opsiyonel)

- CHANGELOG ve PROJECT_STATUS tarihsel commit başlıklarındaki em-dash'ler
  gelecekte bir refactor fırsatıyla temizlenebilir (zorunlu değil).
- Pre-commit hook (pre-push'tan farklı olarak commit öncesi) daha
  erken yakalama sağlar ama pre-push yeterli bir güvenlik katmanı.
