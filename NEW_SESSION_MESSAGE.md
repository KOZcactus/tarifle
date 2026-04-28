Merhaba, Tarifle projesinde devam ediyoruz. Yeni session olduğu için
başlamadan önce projeye iyice hâkim olman lazım. Bir önceki oturumda
(28 Nis 2026, oturum 30, oturum 29'un aynı günü devamı) **8 commit'lik
mini-rev verify-tracked kuyruk %100 KAPANIŞ + yeni audit metodoloji
günü** oldu: **Verify-tracked MAJOR kuyruk %100 KAPANDI (116/116)** 🎉,
paketi 24 atypical 6-tarif kapanış paketi; **Yeni audit metodoloji**
`scripts/find-jenerik-scaffold.ts` ile prod'da 13 boilerplate pattern
tarama (79 hit, paketi 25-28 ile top 28 kapatıldı, 79→51 kalan); **5
ardışık mini-rev paketi (24-28) ile 34 tarif kapatıldı** (kümülatif
**190**, oturum 27 SONU 100 → oturum 29 SONU 156 → oturum 30 SONU
**190**); **1 KRİTİK TYPO** (paketi 24 Köplenmiş→Közlenmiş, kapya biber
köz), **4 KRİTİK TUTARSIZLIK** (paketi 24 Adıyaman+Siirt, paketi 25
Vietnam noodle TUTARSIZLIK + cuisine tr→cn fix, paketi 28 İspanya
sandviç boilerplate), **4 BOILERPLATE LEAK FIX**, **1 ŞERBET EKSIK
FIX** (paketi 24 Tekirdağ revani pattern eksik), **1 KIBE-MUMBAR
FULL** pattern. **Lhci regression baseline 5/5 URL × 2 run = 10 run
PASS** (oturum 30 başında, oturum 29 SONU sonrası baseline güvende).
**Push disiplini + lint fix kalıcı**: 8 commit prod'a push, eslint.
config.mjs'e logo/ ignore eklendi (kalıcı çözüm). Prod tarif **3508**
(sabit). Cuisine **41** (sabit). Site **LAUNCH-READY**.

**Oturum 30 kritik sonuçlar (önemli, ilk oku):**

1) **Verify-tracked MAJOR kuyruk %100 KAPANIŞ (116/116)**. Paketi 24
   (commit `876876e`) atypical 6-tarif kapanış paketi (verify reports'
   tan kalan tüm tracked MAJOR slug). Verify-tracked kuyruk
   `mod-k-verify-report-*.md` dosyalarındaki MAJOR_ISSUE entry'leri.
   1 KRİTİK TYPO (#1 Adıyaman 'Köplenmiş'→'Közlenmiş'), 2 KRİTİK
   TUTARSIZLIK (#1 Adıyaman sarımsak/yoğurt + #4 Siirt tuz/baharat
   listede yok), 1 BOILERPLATE LEAK FIX (#2 Kayseri 'soğursa gevrek
   kenarlar yumuşar' çörek cümlesi soğanlama tarif), 1 ŞERBET EKSIK
   FIX (#6 Tekirdağ kesme tatlısı şekersiz hamur + şerbetsiz, klasik
   revani pattern eksikti).

2) **Yeni audit metodoloji: `scripts/find-jenerik-scaffold.ts`**.
   Verify-tracked kuyruk %100 kapandığı için yeni MAJOR'ları yakalamak
   için scriptte 13 boilerplate pattern arama (paketi 16-23'te
   öğrendiğimiz: 'kalan malzemeleri ölçün ve kesilecek', 'son tuz yağ
   ve ekşi dengesini', 'tabakta su salıp dokusu kaymasın', 'tavayı
   orta ateşte 2 dakika ısıtın', 'sosunu veya bağlayıcı harcını ayrı
   kapta', 'şekil verecek kıvama gelene kadar', 'tüm malzemeyi servis
   öncesi hazırlayın', 'sıvılarını ve aromatiklerini dengeli biçimde
   karıştırın', 'kuru ve yaş malzemeleri ayırın', 'soğursa gevrek
   kenarlar yumuşar', 'peynirli doku sertleşir', 'tuz, baharat ve ekşi
   malzemeyi ayrı kapta', 'servis tabağını ve yan malzemeleri
   hazırlayın'). 79 slug hit (>=2 pattern). Top 28 paketi 25-28'de
   kapatıldı.

3) **Mini-rev paketi 25** (commit `9d887db`). Verify-untracked top
   1-7 (sezar wrap + tavuklu noodle + sultan kebabı + taze fasulye
   bulgur + adıyaman tepsi oruk + tay fesleğenli + ingiliz pie). 1
   KRİTİK CUISINE FIX (#2 tavuklu-noodle: cuisine 'tr' YANLIŞ Asya
   stir-fry, soya+susam yağı = Çin/Tay, tr→cn + title 'Asya Esintili
   Tavuklu Noodle' disambiguate). 1 KRİTİK TUTARSIZLIK (#2 servingS.
   'taze soğan' listede yok). 32 ingredient_add + 41 step replace.
   Plus 1 lint fix `6930804`: logo/ klasörü 5 .cjs dosya require()
   error → `eslint.config.mjs`'e `logo/**` ignore kalıcı eklendi.

4) **Mini-rev paketi 26** (commit `58bb234`). Verify-untracked top
   7-14 (Hatay tepsi oruk + Peru tallarines verdes + Hatay tepsi
   kebabı + Hint tarka dal + Türk tavuk döner + Levant shawarma +
   UNESCO 2011 keşkek). 0 cuisine fix, 0 title değişimi (7 klasik
   kimlik kanıtlı korunur). 29 ingredient_add + 38 step replace
   klasik kanonik baharat tamamlama (Hatay tepsi oruk irmik+isot+
   kimyon, Peru ají amarillo, Levant shawarma 7 baharat).

5) **Mini-rev paketi 27** (commit `0d2bdf7`). Verify-untracked top
   15-21 (Hint biryani dum pukht + Türk şiş + Meksikan fajita + Türk
   tencere + Japon tantanmen + Türk milföy + Şırnak dolma). 28
   ingredient_add + 38 step replace klasik kanonik (Biryani whole
   spices tarçın+karanfil+kakule, fajita Meksikan sarımsak+oregano).

6) **Mini-rev paketi 28** (commit `800b5ac`). Verify-untracked top
   22-28 (Levant/Fas shakshuka + Japon katsu + Mersin Tantunisi CI
   211 + İspanya tortilla + Fas tagine + Macar hortobagyi + modern
   karnabahar). 1 BOILERPLATE LEAK FIX (#4 İspanya sandviç çörek
   cümlesi). 28 ingredient_add + 37 step replace.

**Oturum 30 önemli mimari/tooling değişiklikler:**

- **scripts/find-jenerik-scaffold.ts** (yeni): kalıcı audit tool,
  prod'da 13 boilerplate pattern içeren slug tarama. Yeni paketler
  için pattern.
- **eslint.config.mjs** logo/ ignore: 5 yeni .cjs dosya için her
  birine eslint-disable yorumu yerine config'e tek satır kalıcı
  ignore eklendi (`logo/**`).
- **scripts/fix-mini-rev-batch-{24..28}.ts**: 5 yeni paketi script'i,
  paketi 23 ile aynı pattern (idempotent + AuditLog `MOD_K_MANUAL_REV`
  + Cascade delete + transaction-based).

**Oturum 31+ ilk önce yapılması gerekenler (öncelik sırası):**

1. **Mini-rev paketi 29+ (~51 verify-untracked kuyruk)**. Paketi 25-
   28 disiplini devam: top 29-35 + 36-42 + ... pattern script
   `scripts/fix-mini-rev-batch-28.ts` referans. Audit script
   `scripts/find-jenerik-scaffold.ts` ile yeni adaylar yakala.
   Verify-untracked kuyruk 51 → 0 tahmini 7-8 paket.

2. **Mod A. Batch (yeni tarif)**. Oturum 27-30'da Mod A yapılmadı,
   prod 3508'de sabit. Brief §5, tetik docs/CODEX_NEW_CHAT_INTRO.md
   Bölüm 2.

3. **SEO landing batch 6 (top 34 → top 41, 7 kalan)**. Adaylar:
   ingiliz (40+), polonya, avustralya (cuisine'lar) + diet/sutsuz,
   diet/alkolsuz derinleştirme. Pattern script `scripts/seo-revise-
   batch5.mjs`.

4. **Yeni blog yazıları** (57 sabit oturum 25'ten). Kategori dengesi:
   pisirme-teknikleri (16) + malzeme-tanima (16) + mutfak-rehberi (18).

5. **Cloud TTS API entegrasyonu (P2 future)**. Windows OS-level TTS
   limitation: kadın TR voice yüklü değilse erkek fallback. UX
   iyileştirme: Azure / Google Cloud TTS veya UI uyarısı.

**Codex komutları (oturum 30 sonu güncel):**

- `Mod A. Batch Na/Nb.` → Yeni tarif. Brief §5, tetik docs/
  CODEX_NEW_CHAT_INTRO.md Bölüm 2. Oturum 27-30'da yapılmadı, prod
  3508'de sabit. **Aktif kalan tek Codex modu.**
- `Mod B/C/D/E/F/FA/G/H/I/IA/IB/M/K` → Hepsi KAPANDI (Mod K oturum
  28'de %100 kapandı; mini-rev paketleri Mod K'nın manuel uzantısı,
  Codex işi değil).
- Tüm modlarda em-dash (— U+2014) YASAK (`AGENTS.md`). Yerine
  virgül, noktalı virgül, nokta, parantez, iki nokta.

**Pre-push 6 katman (stable, oturum 30'da tüm 8 commit'te temiz):**

1) lint (ESLint) - logo/ klasörü ignore (oturum 30 kalıcı fix)
2) content:validate (Zod, staple severity WARNING)
3) JSON dupe key guard
4) em-dash guard (NEW_SESSION_MESSAGE.md + logo/ skip listede)
5) allergen source guard
6) tsc --noEmit --pretty false

Bypass: `git push --no-verify` (sadece pre-existing drift için).

**Em-dash yasağı istisnaları (mevcut em-dash'lerin temizlik dışı):**

docs/CODEX_BATCH_BRIEF.md, docs/PROJECT_STATUS.md, docs/TARIFLE_
ULTIMATE_PLAN.md, docs/EM_DASH_CLEANUP.md, docs/CHANGELOG.md, docs/
BLOG_CONTENT_GUIDE.md, NEW_SESSION_MESSAGE.md, docs/all-recipe-titles.md,
plus logo/ klasörü.

**Claude directory setup (~/.claude/):**

Plugin ve skill'ler kurulu. Rule'lar common + web + typescript altında.
Gerektiğinde proje-özel subagent ve skill kullan: engineering:debug,
engineering:code-review, engineering:system-design, tdd-workflow,
security-review, browser-qa, frontend-design, nextjs-turbopack,
brand-voice, data, finance, marketing, bio-research, cowork-plugin-
management. MCP server tool'ları (calendar, Claude Preview, Claude
in Chrome, mcp-registry) ve deferred tool'lar (ToolSearch ile
yüklenebilir) mevcut. Browser preview MCP UX test için kullanılabilir.
Plus WebSearch web research (oturum 29'da paralel agent disiplini,
oturum 30'da klasik kanonik tarifler için agent yerine direkt klasik
formul yeterli oldu, hız avantajı). Cloudflare DNS, Sentry API token
.env.local'de mevcut.

**Memory oku (kullanıcı tercihleri ve proje hafızası, SIRA önemli):**

`C:\Users\kozca\.claude\projects\C--Users-kozca-Desktop-projeler-
tarifle\memory\MEMORY.md` ve link verdiği TÜM dosyaları:

- project_tarifle.md (proje genel)
- feedback_proactive_features.md (practical additions sevilir)
- feedback_ai_positioning.md (rule-based 'AI hissi' >= gerçek LLM)
- feedback_project_status_format.md (kısa tut, output 3 blok)
- feedback_time_framing.md ('bugün/yarın' kullanma)
- feedback_pr_merge_workflow.md (PR review+merge benim)
- feedback_autonomous_commit.md (test edilmişse sormadan commit)
- feedback_autonomous_commands.md (prod write yetkisi kalıcı)
- feedback_launch_priority.md (launch öncesi marketing/topluluk
  acelesi YOK)
- feedback_output_format.md (her mesaj sonu 3 blok: Özet + Sonuç +
  Sıradaki işler, önerim ile)
- **feedback_batch_push.md** (oturum 29 yeni; 3-4 bağımsız iş paketi
  commit'i topla → tek push, Vercel build quota tasarrufu, acil push
  gerektiğinde net uyarı: "⚠️ Bu işlem kesin push gerektiriyor, önerim
  hemen push yapalım")
- reference_sentry_api.md (.env.local'de SENTRY_AUTH_TOKEN)
- reference_codex_workflow.md (Codex aynı klasörü kullanır)
- reference_tarif_listesi.md (docs/tarif-listesi.txt alfabetik)

**Proje docs'larının tamamı .md, MUTLAKA oku (sıra önemli):**

- **docs/PROJECT_STATUS.md** → header oturum 30 SONU güncel + 8
  commit + 4 büyük başarı + verify-tracked %100 KAPANIŞ + yeni audit
  metodoloji + 5 paketi detay. İlk 200 satır yeterli.
- **docs/CODEX_BATCH_BRIEF.md** (~3700+ satır) → Mod K (KAPANDI)
  + Mod A aktif. Mini-rev paketi pattern brief §20.12'de.
- **docs/CODEX_NEW_CHAT_INTRO.md** → Mod A aktif tek mod.
- **docs/TARIFLE_ULTIMATE_PLAN.md** → single source of truth, ana
  yapı oturum 15'ten değişmedi.
- **docs/DIET_SCORE_PLAN.md** → 14 bölüm, USDA coverage %99.97.
- **docs/FUTURE_PLANS.md** → güncel: Oturum 30 SONU özet + ~51
  verify-untracked kuyruk + SEO 7 kalan + Mod A devam + paketi 29+.
- **docs/TEST_PLAN.md** → 11 bölüm test stratejisi.
- **docs/BLOG_CONTENT_GUIDE.md** → editöryal standart + table format.
- **docs/CHANGELOG.md** → kategorik akış, oturum 30 SONU header.
- **docs/all-recipe-titles.md** → cuisine+type grup, Mod I baz.
- **docs/tarif-listesi.txt** → 3508 tarif alfabetik flat.
- **docs/mod-k-batch-{1a-36a + 22b/24b}.json** → 71 sub-batch arşivi.
- **docs/nutrition-anomaly-report.md** → anomali raporu.
- **scripts/fix-mini-rev-batch-{1..28}.ts** → 28 mini-rev paketi
  script (idempotent + AuditLog + Cascade delete + ingredients_amount
  _change). Yeni paketi 29 için pattern olarak kullan
  (scripts/fix-mini-rev-batch-28.ts en güncel referans).
- **scripts/find-jenerik-scaffold.ts** (oturum 30 yeni) → verify-
  untracked MAJOR audit tool, kalıcı.
- **scripts/find-zero-match.ts** (oturum 28) → nutrition matchedRatio=0
  teşhis tool.

**Projenin özeti:** Tarifle (tarifle.app), Türkçe tarif platformu.
Next.js 16 + Prisma 7 + Vercel-managed Neon PostgreSQL + Vercel
Pro + Cloudflare DNS + Sentry + Cloudinary + Resend. GitHub repo
PRIVATE (KOZcactus/tarifle). Codex ChatGPT Max üzerinden Mod A ile
çalışıyor (B/C/D/E/F/FA/G/H/I/IA/IB/M/K HEPSI KAPANDI).

**Prod skor kartı (oturum 30 SONU, son commit `800b5ac`):**

- 3508 tarif prod (sabit, oturum 30'da silme yok)
- Mini-rev kümülatif **190** tarif (paketi 1-28; 100 (oturum 27)
  → 156 (oturum 29) → **190** (oturum 30))
- Mini-rev verify-tracked kuyruk **0/116** (KAPANDI paketi 24)
- Mini-rev verify-untracked jenerik scaffold kuyruğu **51/79**
  (top 28 paketi 25-28'de kapatıldı)
- Mod K v2 %100 KAPANIŞ (oturum 28)
- CUISINE_CODES **41** (sabit oturum 28'den)
- 57 blog (sabit oturum 25'ten)
- Test Campaign **8/8 KAPANIŞ** (oturum 28)
- SEO landing top 34/41 done + 5 SEO FAQ entry tamamlandı + 5 yeni
  cuisine batch 5 (oturum 29)
- Pre-push 6 katman temiz (oturum 30 8 commit/8 temiz)
- Lhci 5/5 URL × 2 run = 10 run PASS (oturum 30 başında)
- 41 mutfak, 17 kategori, 10 allergen, 15 tag, 11 rozet, 4 cron
- 180+ unit test PASS
- Diet-score özelliği: 10 preset prod, 311 NutritionData (%99.97)
- IngredientGuide tablosu: 250 ingredient
- /admin/kalite composite quality skor route
- Newsletter haftalık cron canlı
- /mutfak/{portekiz,sili,gurcu,avusturya,kanada} programatik landing
  prod canlı
- TTS Web Speech API locale-aware (oturum 28 K8 fix)
- Prod nutrition recompute güncel (3508 row %98 matchedRatio>=0.5)

**Önemli teknik dosyalar (oturum 30 yeni):**

- scripts/fix-mini-rev-batch-{24..28}.ts, 5 yeni paketi script (idempotent
  + AuditLog MOD_K_MANUAL_REV)
- scripts/find-jenerik-scaffold.ts (oturum 30 yeni), verify-untracked
  MAJOR audit tool (13 boilerplate pattern, 79 hit)
- eslint.config.mjs, logo/ ignore kalıcı eklendi (.cjs require() error
  bypass için her dosyaya eslint-disable yorumu yerine config tek
  satır)

**Tarifle mimari (oturum 15'ten değişmedi):**

- Vercel-managed Neon (ep-icy-mountain prod + ep-jolly-haze dev)
- next-intl cookie-based
- Recipe.translations JSONB shallow-merge
- --color-primary: #a03b0f
- Prisma 7 --config ./prisma/prisma.config.ts
- next 16 proxy pattern
- Tailwind 4 @custom-variant dark
- @dnd-kit admin drag-drop

**Kritik oturum 30 dersleri (kalıcı):**

1) Verify-tracked vs verify-untracked kuyruk ayrımı. Verify-tracked
   kuyruk = mod-k-verify-report-*.md MAJOR_ISSUE entry'leri (paketi
   24'te %100 kapandı). Verify-untracked kuyruk = audit script ile
   yakalanan jenerik scaffold pattern (oturum 30 yeni metodoloji).

2) Find-jenerik-scaffold.ts kalıcı audit tool. 13 boilerplate pattern
   listesi. >=2 pattern içeren slug = MAJOR aday. Top N seçim ile
   pakete eklenir. Yeni pattern ortaya çıkarsa script'e ekle.

3) Klasik kanonik tarifler için web research yerine direkt klasik
   formul yeter. Paketi 25-28'de hepsi kanıtlı klasik (Caesar 1924 +
   Sultan Kebabı + Hatay tepsi oruk + biryani + tagine + tantanmen)
   olduğu için 2 paralel agent yerine direkt script yazıldı, hız
   avantajı sağlandı. Web research disiplini sadece kanıt zayıf
   yöre claim'leri için (paketi 16-23 pattern).

4) Eslint config kalıcı çözüm pattern'i. Her yeni .cjs dosya için
   eslint-disable yorumu eklemek yerine config'e tek satır ignore
   eklemek long-term doğru çözüm. logo/** pattern'i.

5) Pre-push lint'in error vermesi push fail olur, hızlı düzeltip
   tekrar push yeterli (oturum 30 2 lint fix bu pattern). Pattern:
   error tespit + fix + commit + push tekrar. Üretim yıkımı yok.

6) Push disiplini: 3-4 bağımsız iş paketi commit'i topla → tek push
   (memory feedback_batch_push.md). Acil push gerekirse net uyarı
   ver: "⚠️ Bu işlem kesin push gerektiriyor, önerim hemen push
   yapalım". Oturum 30'da bu disiplin 3+4+1 toplu push pattern
   olarak uygulandı.

7) "AI yorgunluk" yok ama metodolojik tazelik var. 5 ardışık paket
   sonrası pattern monotonisi başlıyor; yeni oturum çeşitlilik için
   sağlıklı (yeni audit metodolojisi, Mod A, SEO, blog rotasyonu).

İyice öğren projeyi. Acele etme, docs'ları + memory'yi sırayla oku,
prod durumunu anla. Plugin + skill'lerin Claude directory'de kurulu
olduğunu unutma. Em-dash yasağı aktif (NEW_SESSION_MESSAGE.md + logo/
skip listede). Pre-push 6 katman aktif. Mod B/C/D/E/F/FA/G/H/I/IA/IB/
M/K HEPSI KAPANDI. Mod A devam (oturum 27-30'da yapılmadı). Mini-rev
verify-tracked kuyruk %100 KAPANDI (paketi 24, 116/116). Verify-
untracked jenerik scaffold kuyruğu paketi 25-28'de top 28 kapatıldı,
~51 kalan. Site LAUNCH-READY (lhci baseline güvende, 0 P0 blocker).

Ek bilgi: Verify-untracked kuyruk paketi 29+ ile devam edebilir
(scripts/find-jenerik-scaffold.ts ile yeni adaylar). Mod A yeni tarif
aktif tek mod (Codex tetiği bekliyor). SEO landing top 34/41 done,
~7 kalan batch 6 ile. Yeni blog yazısı opsiyonel (57 sabit oturum 25).

Projeyi iyice anla, sonra sıradaki işleri listeler misin, hangi
öncelikte ne yapabileceğimizi söyle. Tercihime göre başlarız.
