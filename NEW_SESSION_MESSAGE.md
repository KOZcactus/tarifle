Merhaba, Tarifle projesinde devam ediyoruz. Yeni session olduğu için
başlamadan önce projeye iyice hâkim olman lazım. Bir önceki oturumda
(29 Nis 2026, oturum 32, oturum 31'in ertesi günü) **27 commit'lik
MARATON GÜNÜ: Mod A v2 40a-e + 41a-d apply (prod 3508 → 3714, +206
tarif) + audit-deep 62→0 + GATE A 792→1 + IIFE format homojenleştirme
+ source-DB drift 13 SKIP kalıcı temizlik + 60. blog + Codex tetik
şablonu IIFE-free** günü oldu.
**Oturum 32 SONU FINAL kritik sonuçlar (önemli, ilk oku):**
1) **Mod A v2 Batch 40a-40e + 41a-41d apply (prod 3508 → 3714)**:
   - 40a-e (100 tarif tek apply): 7 GATE PASS, 5 minor fix
     (tekirdag-hayrabolu süre + porto-francesinha yumurta + sanliurfa-
     pitpit slug + warsaw-bigos allergen + types). Hardaliye schema
     cap fix (cookMinutes max 1440, 48 saat fermente → 24 saat).
   - 41a (20 tarif): 7 GATE PASS.
   - 41b/c/d (59 tarif): 41d 4 KRİTİK REJECT yakalandı (aynı klasik
     tarif farklı slug). REJECT'ler: turkish-tirit-konya = etli-tirit-
     konya-usulu, budapest-paprikas-csirke = paprikas-csirke-macar-
     usulu, stockholm-janssons-frestelse = janssons-frestelse, varsova-
     pierogi-ruskie = warsaw-pierogi-ruskie. Source'tan kaldırıldı,
     16 PASS apply edildi.
   - 41d retrofit (4 yeni tarif): tabriz-kufteh-tabrizi (İran),
     surabaya-rawon (Endonezya), cape-waterblommetjie-bredie (G.Afrika),
     bitlis-glorik (TR). 7 GATE PASS, kanonik formul.
   - 41e bekleniyor (kalan 16 tarif, 41 paket toplam 84/100).
2) **audit-deep 62 → 0 CRITICAL kapanış**:
   - **RECIPE_CONSISTENCY 56 fix**: vegan tag + hayvansal allergen
     çakışması (oturum 31 retrofit kalıntısı). RecipeTag relation
     üzerinden delete + vejetaryen ekleme.
   - **ALLERGEN_ACCURACY 26 fix**: Tereyağı→SUT, Zahter→SUSAM, Antep
     fıstığı→KUSUYEMIS, Tonkatsu→SOYA, Çavdar viskisi→GLUTEN, Yulaf
     içeceği→GLUTEN, Buğday nişastası→GLUTEN, İstiridye sosu→
     DENIZ_URUNLERI vb.
   - **allergen-matching algoritma rafine** (src/lib/allergen-matching.
     ts): "X yerine Y" handler (yerine deyiminde Y'ye bakar, X
     KULLANILMIYOR), GLUTEN/YUMURTA excludePatterns "kekiği"/"kekigi"
     (Meksika kekiği = Mexican oregano), "pirinç krakeri" exclude,
     DENIZ_URUNLERI keyword "balığı" possessive form ek (Turkish iyelik
     formu için), Turkish-aware word boundary `(?<![a-zçğıöşüâîû])`
     (ASCII \b yerine).
   - kete-kirigi-tava-ardahan-usulu YUMURTA ek (gerçek bug, kete
     formülü un+yumurta) + tarka-dal SUT kaldır (vegan tarif, "Tereyağı
     yerine sıvı yağ").
3) **GATE A süre algoritma 792 → 1 hit kapanış**:
   - audit-recipe-quality.ts GATE A rafine: totalMinutes = prep +
     cook + waitMinutes (waitMinutes = >30dk timerSeconds, marine
     threshold). %10/10dk tolerans.
   - 771 moderate fix (toplu, otomatik formül uygulama, ratio %200
     altı).
   - 21 extreme manuel fix kategorize: (a) cookMinutes'a passive süre
     (turron/incirli/blueberry/lamington/mizeria/ponzu/portakal-cicek/
     mandalina-reyhan/lucumali/naneli-seftalili kup tatlıları + atom-
     sos), (b) step instruction marine timer ek (hanoi-bun-cha 4h
     marine, soguk-cay 2h soğutma), (c) total fazla yüksek anomali
     fix (piyaz 780→100, sivas-peskutan 785→95, tokat-baklali 820→
     153, selanik-gigantes 830→195, sinop-keskek 865→258, hardalli-
     artsoppa 810→160, lemon-slice 85→55).
4) **GATE B 10 → 0 kapanış**:
   - hasAllergenMention Turkish-aware lookbehind/lookahead
     `(?<![TR_WORD_CHARS])kw(?![TR_WORD_CHARS])` (\b ASCII Turkish
     karakter bug, "tavuğun" → "un" match yanılgısı çözüldü).
   - ALLERGEN_EXCLUDE compound pattern: "fındık/ceviz büyüklüğünde",
     "fındık rengi", "lavaşla", "yufka ekmeği", "tereyağı yerine/
     sürün/sürerek".
   - "lavaş" GATE B keyword listesinden çıkar (servis öneri eşlik,
     ingredient ise audit-deep yakalar).
   - 2 GERÇEK SUT fix: tavuklu-nohutlu-arpa-pilavi (step "tereyağı
     ısıtın") + siirt-kitel (step "tereyağı veya yoğurtla servis").
5) **IIFE format homojenleştirme (commit f3a99c9)**:
   - Önceki: 63 IIFE bloğu spread (`...(()=>{...return [...];})()`),
     her birinde local helper (t/ing/st/r), 209 duplicate definition.
     Source-DB drift fix'lerinde format çatışması (obj vs string-pipe
     vs ing helper).
   - Yeni: scripts/lib/recipe-helpers.ts tek modül export (t/ing/st/
     r + tipler). seed-recipes.ts top-level import. 63 IIFE regex
     transform ile flat array'e düzleştirildi (CRLF \r?\n + trailing
     comma fix).
   - seed-recipes.ts 16009 → 15269 satır (-740 satır boilerplate).
   - Codex tetik şablonu IIFE-free güncelleme (commit 05f097e):
     docs/CODEX_BATCH_BRIEF.md + docs/CODEX_NEW_CHAT_INTRO.md helper
     modülünden import direktifi, IIFE wrapper YASAK.
6) **Source-DB drift 13 SKIP entry kalıcı temizlik**:
   - 11 SKIP entry oturum 32'de (audit-deep DB'ye allergen ekledi
     ama source ingredient adlarıyla eşleşmiyordu).
   - sync-11-skip-source.ts (format-aware: object/ing helper/raw
     string-pipe) ile 9 slug source ingredient ek + 2 allergen
     düzeltme (mafis Antep fıstığı + nar-eksili SUSAM kaldır).
   - 2 final SKIP (tavuklu-nohutlu-arpa + siirt-kitel) format-aware
     sync (string-pipe r({}) + obj plain {}) + Tereyağı ingredient
     ek (legitimate SUT).
   - check-allergen-source.ts SKIP_FINDINGS boş (kuru baseline).
7) **60. blog yazısı + dump pipeline**:
   - "Sebze Pişirme Teknikleri: Blanching, Sauté, Roasting, Braising
     ve Glazing Ne Zaman, Neden, Nasıl" (pisirme-teknikleri 16→17,
     1478 kelime, 8 H2 + Bonus + Kaynaklar). 5 temel teknik + Maillard
     vs karamelizasyon + 7 otoriter kaynak (Cook's Illustrated, Kenji
     López-Alt, ATK, Harold McGee, Serious Eats, USDA, Exploratorium).
   - docs/all-recipe-titles.md re-dump pipeline'a eklendi (Codex
     duplicate audit referansı, 26 Nis'ten beri eski idi).
   - docs/CODEX_BATCH_BRIEF.md apply pipeline post-step zorunlu
     bölümüne her iki dump scripti direktifi.
8) **Push disiplini**: 27 commit, pre-push 6 katman temiz tüm
   commit'lerde. 1 em-dash guard yakalandı (sync-11-skip-source
   comment'te '—'), hızlı düzeltildi. allergen-source-guard 5 kez
   yakaladı (warsaw-bigos GLUTEN over-tag, veracruz balığı possessive,
   nar-eksili SUSAM, tavuklu-nohutlu Tereyağı, siirt-kitel Tereyağı),
   her seferinde algoritma rafine veya SKIP/source ek ile çözüldü.
   2 zod ERROR (siirt-kitel obj format + ayas-efelek tag + lisbon-
   ameijoas categorySlug) düzeltildi. 1 schema cap (hardaliye 2880
   → 1475, cookMinutes 1440 max).
**Oturum 32 önemli mimari/tooling değişiklikler:**
- **scripts/lib/recipe-helpers.ts** (yeni, oturum 32): tek kaynak
  helper modülü (t, ing, st, r exports + tipler). seed-recipes.ts
  ve gelecek Codex batch'leri buradan import eder.
- **scripts/validate-mod-a-batch.ts** (oturum 31'den, oturum 32 7 GATE
  Mod A v2 validation): auto git diff slug detect, --slugs flag manual.
- **scripts/fix-gate-a-totalminutes.ts** (yeni, oturum 32): GATE A
  toplu fix tool, expected = prep + cook + waitMinutes formülü.
- **scripts/fix-21-extreme.ts** (yeni, oturum 32): GATE A extreme
  manuel-curated fix listesi (cook + total + step-timer 3 fix tipi).
- **scripts/fix-audit-deep-criticals.ts** (yeni, oturum 32): RECIPE_
  CONSISTENCY vegan tag + ALLERGEN_ACCURACY ek toplu fix.
- **scripts/sync-11-skip-source.ts** + **inspect-11-skip-slugs.ts**
  (yeni, oturum 32): format-aware source-DB sync.
- **scripts/check-batch-recipe.ts** (yeni, oturum 32): single-recipe
  inspector (Mod A v2 manuel kalite kontrol disiplini).
- **content/blog/sebze-pisirme-teknikleri-...mdx**: 60. blog.
- **docs/CODEX_BATCH_BRIEF.md** + **docs/CODEX_NEW_CHAT_INTRO.md**
  IIFE-free güncelleme + helper modülü direktifi (oturum 32
  commit 05f097e).
**Oturum 33+ ilk önce yapılması gerekenler (öncelik sırası):**
1. **Codex 41e teslim bekleme + apply pipeline**: Kalan 16 tarif
   geldiğinde validate-mod-a-batch.ts ile 7 GATE check + apply (dev
   seed + prod seed + recompute hunger-bar/nutrition/diet + dump
   tarif-listesi + dump recipe-titles). 41 paket toplam 100/100
   tamamlanır.
2. **Codex Batch 42a-42e tetik (Mod A v2 sonraki 100 tarif)**.
   Brief §5.0.0 default scope, Codex tek mesajla "Mod A v2. Batch
   42a-42e." tetiği yeterli. IIFE wrapper YOK artık (helper modülü
   üst importa güven).
3. **4. blog yazısı**: taze ot rehberi (maydanoz/kişniş/dereotu/
   fesleğen/kekik/biberiye), çikolata bilimi (kakao yüzdesi,
   temperleme, eritme), peynir eşleştirme. Mevcut 60 blog, kategori
   dengesi pisirme-teknikleri (17), malzeme-tanima (17), mutfak-
   rehberi (19).
4. **Lhci regression baseline kontrolü**: Oturum 32 sonu, 206 yeni
   tarif (3508 → 3714) sonrası 5 URL × 2 run baseline tutar mı?
5. **GATE A 1 minor + GATE B 2 false positive triage** (ROI düşük):
   audit-recipe-quality.ts kalan minor finding'ler.
6. **CI hata teşhisi**: GitHub Actions failed run'lar (oturum 30/31/
   32 kontrol edildi, lokal her şey yeşil). gh CLI veya GITHUB_TOKEN.
7. **Cloud TTS API entegrasyonu** (P2 future): Windows OS-level TTS
   limitation, kadın TR voice yüklü değilse erkek fallback.
**Codex komutları (oturum 32 SONU FINAL güncel):**
- **Mod A v2. Batch Na/Nb/Nc/Nd/Ne.** (örn. `Mod A v2. Batch 42a-
  42e.`) → Yeni tarif Quality-First default. **20 tarif × 5 paket =
  100 tarif, 7 GATE zorunlu**. Codex 5-6 saat ardışık çalışır, her
  paket sonrası "Batch Na hazır, GATE 1-7 PASS" der. scripts/
  validate-mod-a-batch.ts otomatik validation. Brief §5.0.0.
- **Mod A v2 retrofit**: Bir paket içinde KRİTİK REJECT yakalanırsa,
  yeni session açılır, Codex'e "Mod A v2. Batch Nx retrofit (Y tarif)"
  + REJECT detay + 7 GATE direktifi yollanır. 41d retrofit pattern
  (oturum 32, 4 tarif tabriz/surabaya/cape/bitlis) referans.
- **Mod B/C/D/E/F/FA/G/H/I/IA/IB/M/K → HEPSI KAPANDI**, sadece
  Mod A v2 aktif.
- Tüm modlarda em-dash (— U+2014) ve en-dash (– U+2013) YASAK
  (AGENTS.md). Yerine virgül, noktalı virgül, nokta, parantez, iki
  nokta.
- **IIFE wrapper YOK** (oturum 32 yeni): Codex doğrudan recipes[]
  sonuna r({...}) append eder. Helper'lar üst importa güven.
**Pre-push 6 katman (oturum 32 boyunca tüm 27 commit'te temiz):**
1) lint (ESLint) - logo/ klasörü ignore
2) content:validate (Zod, staple severity WARNING)
3) JSON dupe key guard
4) em-dash guard (logo/ + NEW_SESSION_MESSAGE.md skip listede)
5) allergen source guard (5 kez yakaladı, her seferinde rafine)
6) tsc --noEmit --pretty false
**Em-dash yasağı istisnaları (mevcut em-dash'lerin temizlik dışı):**
docs/CODEX_BATCH_BRIEF.md, docs/PROJECT_STATUS.md, docs/TARIFLE_
ULTIMATE_PLAN.md, docs/EM_DASH_CLEANUP.md, docs/CHANGELOG.md, docs/
BLOG_CONTENT_GUIDE.md, NEW_SESSION_MESSAGE.md, docs/all-recipe-
titles.md, plus logo/ klasörü.
**Claude directory setup (~/.claude/):**
Plugin ve skill'ler kurulu. Rule'lar common + web + typescript altında.
Gerektiğinde proje-özel subagent ve skill kullan: engineering:debug,
engineering:code-review, engineering:system-design, tdd-workflow,
security-review, browser-qa, frontend-design, nextjs-turbopack,
brand-voice, data, finance, marketing, bio-research, cowork-plugin-
management. MCP server tool'ları (calendar, Claude Preview, Claude in
Chrome, mcp-registry) ve deferred tool'lar (ToolSearch ile yüklenebilir)
mevcut. Browser preview MCP UX test için kullanılabilir. Plus WebSearch
web research (oturum 32'de Mod A v2 retrofit için klasik kanonik
formuller agent yerine direkt çıkarıldı, hız avantajı).
Cloudflare DNS, Sentry API token .env.local'de mevcut.
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
- feedback_batch_push.md (3-4 bağımsız iş paketi commit'i topla →
  tek push, Vercel build quota tasarrufu)
- feedback_codex_mod_a_v2.md (Codex Mod A v2 7 GATE pipeline workflow,
  GATE 1.5 false positive whitelist + KRİTİK REJECT pattern,
  validate-mod-a-batch.ts referansı)
- **feedback_iife_format_module.md** (oturum 32 yeni; 63 IIFE flat,
  scripts/lib/recipe-helpers.ts modülü, Codex tetik IIFE-free direktif)
- reference_sentry_api.md (.env.local'de SENTRY_AUTH_TOKEN)
- reference_codex_workflow.md (Codex aynı klasörü kullanır)
- reference_tarif_listesi.md (docs/tarif-listesi.txt alfabetik)
**Proje docs'larının tamamı .md, MUTLAKA oku (sıra önemli):**
- **docs/PROJECT_STATUS.md** → header oturum 32 SONU FINAL güncel +
  27 commit + 7 büyük başarı + Mod A v2 40a-e + 41a-d apply (84/100)
  + audit-deep 62→0 + GATE A 792→1 + IIFE format homojenleştirme +
  source-DB drift kapanış + 60. blog. İlk 200 satır yeterli.
- **docs/CODEX_BATCH_BRIEF.md** → Mod A v2 §5.0.0 + 7 GATE + GATE 1.5
  whitelist + KRİTİK REJECT pattern + IIFE-free direktif (oturum 32
  yeni, helper modülünden import).
- **docs/CODEX_NEW_CHAT_INTRO.md** → Mod A v2 aktif tek mod, IIFE-free.
- **docs/TARIFLE_ULTIMATE_PLAN.md** → single source of truth.
- **docs/DIET_SCORE_PLAN.md** → 14 bölüm, USDA coverage %99.97.
- **docs/FUTURE_PLANS.md** → Oturum 32 SONU FINAL özet + 41e bekleme
  + 42a-42e tetik + 4. blog + lhci baseline + GATE A/B minor.
- **docs/TEST_PLAN.md** → 11 bölüm test stratejisi.
- **docs/BLOG_CONTENT_GUIDE.md** → editöryal standart + table format.
- **docs/CHANGELOG.md** → kategorik akış, oturum 32 SONU FINAL header.
- **docs/all-recipe-titles.md** → cuisine+type grup, 3702 tarif (oturum
  32'de prod'dan re-dump). Codex Mod A v2 brief duplicate audit
  referansı.
- **docs/tarif-listesi.txt** → 3702 tarif alfabetik flat (oturum 32
  prod sync, 41e apply edilmemiş).
- **scripts/lib/recipe-helpers.ts** (oturum 32 yeni) → t/ing/st/r
  helper modülü, seed-recipes.ts ve Codex batch'leri import eder.
- **scripts/validate-mod-a-batch.ts** → Mod A v2 7 GATE validation.
- **scripts/fix-gate-a-totalminutes.ts** + **fix-21-extreme.ts**
  (oturum 32 yeni) → GATE A toplu + extreme fix tools.
- **scripts/fix-audit-deep-criticals.ts** (oturum 32 yeni) →
  RECIPE_CONSISTENCY + ALLERGEN_ACCURACY toplu fix.
- **scripts/check-batch-recipe.ts** (oturum 32 yeni) → single-recipe
  inspector.
- **scripts/sync-11-skip-source.ts** (oturum 32 yeni) → format-aware
  source-DB sync.
- **scripts/find-jenerik-scaffold.ts** + **find-new-boilerplate-
  patterns.ts** (oturum 31'den) → boilerplate audit + keşif tools.
- **scripts/audit-recipe-quality.ts** (oturum 31, oturum 32 rafine)
  → 5 GATE sistematik kalite audit.
- **scripts/fix-mini-rev-batch-{1..43}.ts** → 43 mini-rev paketi.
- **scripts/fix-{allergen,cuisine,macro,featured}-mismatch.ts**
  (oturum 31'den) → 4 GATE fix scripts.
**Projenin özeti:** Tarifle (tarifle.app), Türkçe tarif platformu.
Next.js 16 + Prisma 7 + Vercel-managed Neon PostgreSQL + Vercel Pro +
Cloudflare DNS + Sentry + Cloudinary + Resend. GitHub repo PRIVATE
(KOZcactus/tarifle). Codex ChatGPT Max üzerinden Mod A v2 ile çalışıyor
(B/C/D/E/F/FA/G/H/I/IA/IB/M/K HEPSI KAPANDI).
**Prod skor kartı (oturum 32 SONU FINAL):**
- **3714 tarif prod** (oturum 31 sonu 3508 → oturum 32 sonu 3714,
  +206 tarif, %5.9 büyüme; 41e gelince +16 daha = 3730)
- Mod A v2 100% pipeline canlı: 40a-e (100) + 41a-d (84) = 184 yeni
  tarif Mod A v2'den, 41e bekleniyor (16 tarif)
- Mini-rev kümülatif **289** tarif (sabit)
- Verify-tracked + verify-untracked çift kuyruk **0/116 + 0/127**
  (KAPALI)
- audit-deep **0 CRITICAL** dev+prod (PASS)
- audit-recipe-quality 5 GATE: A=1 (minor), B=2 (false positive),
  C/D/E=0
- Allergen-source-guard **0 over-tag, 0 missing, 3702 tarif** (kuru
  baseline, SKIP_FINDINGS boş)
- CUISINE_CODES **41** (sabit oturum 28'den)
- **60 blog** (oturum 32'de +1: Sebze Pişirme Teknikleri)
- **60 SEO landing entry** (sabit, oturum 31)
- Test Campaign 8/8 KAPANIŞ (oturum 28)
- Pre-push 6 katman temiz tüm 27 commit
- Lhci 5/5 URL × 2 run = 10 run PASS (oturum 31'de 2 kez kontrol;
  oturum 33'te 206 yeni tarif sonrası baseline kontrolü öneri)
- 41 mutfak, 17 kategori, 10 allergen, 15 tag, 11 rozet, 4 cron
- 180+ unit test PASS, 925 vitest PASS
- Diet-score: 10 preset prod, ~36000 RecipeDietScore satır
- IngredientGuide tablosu: 250 ingredient
- /admin/kalite composite quality skor route
- Newsletter haftalık cron canlı
- /mutfak programatik landing 16+ ülke prod canlı
- TTS Web Speech API locale-aware
- Prod nutrition recompute güncel (3702 row %98 matchedRatio)
**Tarifle mimari (oturum 15'ten değişmedi):**
- Vercel-managed Neon (ep-prod-redacted prod + ep-dev-redacted dev)
- next-intl cookie-based
- Recipe.translations JSONB shallow-merge
- --color-primary: #a03b0f
- Prisma 7 --config ./prisma/prisma.config.ts
- next 16 proxy pattern
- Tailwind 4 @custom-variant dark
- @dnd-kit admin drag-drop
**Kritik oturum 32 dersleri (kalıcı):**
1) **IIFE format → flat array + helper modülü dönüşümü**: 63 IIFE,
   209 duplicate helper definition. scripts/lib/recipe-helpers.ts tek
   kaynak. CRLF \r?\n + trailing comma fix regex. Source-DB drift
   fix'lerinde format çatışması artık yok. -740 satır boilerplate.
   Codex tetik şablonu IIFE-free.
2) **Mod A v2 retrofit pipeline ilk uygulama**: 41d 4 KRİTİK REJECT
   yakalandı, retrofit chat'te 4 yeni tarif gönderildi (tabriz/
   surabaya/cape/bitlis), tüm GATE PASS. Pattern: aynı klasik tarif
   farklı slug suffix ile prod'da varsa REJECT. Brief whitelist'e
   güvenme + manuel kontrol şart.
3) **GATE A formül rafine**: totalMinutes = prep + cook + waitMinutes
   (waitMinutes = >30dk timerSeconds). 792 hit → 1. Marine süresi
   totalMinutes'a dahil ama active step toplamına farklı yansır,
   formül brief uyumlu.
4) **Turkish-aware word boundary**: ASCII \b ğ/ş/ü Turkish karakter
   ile word boundary bug'lı ("tavuğun" → "un" match yanılgısı).
   `(?<![a-zçğıöşüâîû])kw(?![a-zçğıöşüâîû])` Turkish-aware regex.
5) **"X yerine Y" handler**: ingredient adında "yerine" deyimi varsa
   Y'ye bakar, X kullanılmıyor. allergen-matching ingredientMatches
   Allergen başına recursive call. tarka-dal "Tereyağı yerine sıvı
   yağ" SUT match etmiyor artık.
6) **Possessive form keyword genişletme**: "balığı" iyelik formu
   "balık" keyword'ünden farklı (asciiNormalize "baligi" ≠ "balik").
   Keyword listesine possessive form eklenir veya custom match.
7) **Source-DB drift kalıcı çözüm**: format-aware sync (object/ing
   helper/raw string-pipe). r({}) IIFE içinde string-pipe, plain {}
   obj format. SKIP_FINDINGS yerine kalıcı sync tercih.
8) **Schema cap'lerine dikkat**: cookMinutes max 1440 (24 saat).
   Hardaliye 48 saat fermente schema patladı, 24 saat varyant ile
   çözüldü. Codex'e schema sınırları brief'te belirtilmeli.
9) **Pre-push allergen-source-guard rafine sürecinin değeri**:
   5 kez yakaladı, her seferinde algoritma rafine veya source-DB
   sync ile kalıcı çözüldü. Push fail = öğrenme fırsatı.
İyice öğren projeyi. Acele etme, docs'ları + memory'yi sırayla oku,
prod durumunu anla. Plugin + skill'lerin Claude directory'de kurulu
olduğunu unutma. Em-dash yasağı aktif. Pre-push 6 katman aktif. Mod
B/C/D/E/F/FA/G/H/I/IA/IB/M/K HEPSI KAPANDI. **Mod A v2 Quality-First
aktif tek Codex modu**. **IIFE wrapper YOK** (yeni Codex batch'leri
recipes[] sonuna doğrudan r({...}) append eder, helper modülünden
import). Verify-tracked + verify-untracked çift kuyruk %100 KAPALI.
audit-deep 0 CRITICAL + audit-recipe-quality A=1/B=2/C=0/D=0/E=0
(minor). Site LAUNCH-READY (lhci baseline güvende, 0 P0 blocker).
Ek bilgi: Codex Batch 41a-d 84/100 apply, 41e (16 tarif) bekleniyor.
41e geldiğinde validate-mod-a-batch + apply pipeline (dev seed +
prod seed + recompute hunger-bar/nutrition/diet + dump tarif-listesi
+ dump recipe-titles). Yeni Codex Batch 42a-42e tetik (Mod A v2
sonraki 100 tarif). 4. blog yazısı opsiyonel (taze ot rehberi,
çikolata bilimi, peynir eşleştirme). Lhci baseline kontrol önerilir
(206 yeni tarif sonrası).
Projeyi iyice anla, sonra sıradaki işleri listeler misin, hangi
öncelikte ne yapabileceğimizi söyle. Tercihime göre başlarız.