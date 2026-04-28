Merhaba, Tarifle projesinde devam ediyoruz. Yeni session olduğu için
başlamadan önce projeye iyice hâkim olman lazım. Bir önceki oturumda
(28 Nis 2026, oturum 28, oturum 27'nin ertesi günü) **20 commit'lik
Mod K v2 maraton finalı + Test Campaign 8/8 kapanış günü** oldu:
**Mod K v2 71/71 sub-batch (%100 KAPANIŞ)** 🎉, +571 net prod
correction (oturum 28), kümülatif Mod K correction prod ~1701;
**CUISINE_CODES 37 → 41** (+4 yeni: cl Şili paketi 8 + ge Gürcü
paketi 9 + at Avusturya paketi 11 + ca Kanada paketi 14); **8 mini-rev
paketi (paketi 8-15) ile 55 tarif kapatıldı** (kümülatif 100), 35
yeni KRİTİK fix (oturum 28; toplam 38), 5 KIBE-MUMBAR data corruption
+ 8 cuisine fix + 4 definition fix + 2 GIDA GÜVENLİĞİ/SÜRE fix + 5
type değişimi + 3 KRİTİK keşif; **Test Campaign 8/8 RESMİ KAPANIŞ**
(K8 + 1 P1 TTS locale-unaware bug fix); **5 SEO entry FAQ tamamlandı**
(atistirmaliklar/sebze-yemekleri/smoothie-shake/soslar-dippler/portekiz,
20 q+a); **5 prod bug fix** (RecipeCard "0" + Home CTA move + SEO
Sentry crash + TTS K8 + picanha nutrition). Prod tarif **3508**
(sabit, oturum 28'de silme yok). Site **LAUNCH-READY** + Mod K v2
maraton finalı.

**Oturum 28 kritik sonuçlar (önemli, ilk oku):**

1) **Mod K v2 71/71 (%100 KAPANIŞ)**. 6 apply turu:
   - (a) `c8ab40f` 5 batch (27b/28a/28b/29b/30a) 143 prod correction;
   - (b) `ef92299` 29a yeniden teslim 35 corr (sec.20.3 disiplinine
     uygun, önceki teslimde 2 BLOCKED vardı);
   - (c) `9b0ec71` 5 batch (30b/31a/31b/32a/32b) 131 corr;
   - (d) `eb7928b` 33a+33b+34a 94 corr;
   - (e) `aedc4f7` 4 batch (34b/35a/35b/36a) 101 corr (Mod K v2
     %97.2 noktasına geldi);
   - (f) `ecafcca` 22b+24b yeniden teslim 67 corr (MOD K v2 %100
     KAPANIŞ).
   Toplam +571 net prod correction (oturum 28). Kümülatif Mod K
   correction prod ~1130 → ~1701. PASS oran trend %26-36 (Codex
   sıkı disiplin), 0 BLOCKED tüm 6 apply turunda.

2) **4 yeni CUISINE_CODES (37 → 41)**. Her biri 9 location migration
   (CODES + LABEL + SLUG + DESCRIPTION_TR/EN + FLAG + REGION + 8
   SLUG_PATTERNS + 6-9 TEXT_KEYWORDS) + i18n + verify-mod-k
   VALID_CUISINES + 3 yeni test:
   - `cl` Şili (commit `d6c8782` paketi 8), santiago-misirli-pastel-
     de-choclo cuisine fix mx→cl. Region latin-america.
   - `ge` Gürcü (commit `dd3af14` paketi 9), tkemali cuisine fix
     ru→ge. Region caucasus yeni cluster.
   - `at` Avusturya (commit `8261354` paketi 11), viyana-kaiserschmarrn
     hu→at + viena-tavuk-schnitzel BONUS de→at. Region west-europe.
   - `ca` Kanada (commit `c0dbf7b` paketi 14), toronto-akcaagacli-
     yulaf-bar us→ca. Region anglo-americas.
   Cuisine tests 46 → 58/58 PASS. Pattern oturum 28 cl/ge/at/ca
   single-recipe national-icon ile aynı disiplin.

3) **Mini-rev paketi 8** (commit `d6c8782`). 5 KRİTİK + cl cuisine
   ekleme paketi. samsun-kaz-tiridi (CI YANLIŞ, klasik bulgur+kaz
   yağı), sanliurfa-borani-pazili (CI Türk Patent 316), santiago-
   pastel-de-choclo (cuisine mx→cl), sirnak-serbidev (KIBE-MUMBAR,
   yarma+çökelek değil köfteli yoğurt yanlış), siyah-fasulyeli-
   yumurta-tostada cu→mx.

4) **Mini-rev paketi 9** (commit `dd3af14`). 7 KRİTİK + ge cuisine.
   tkemali ru→ge (Gürcü erik sosu), tokat-cemeni KIBE-MUMBAR (mevcut
   cevizli salça ezmesi, klasik çemen otu), tokyo-tonkatsu disambiguate
   (jeyuk-bokkeum pattern, dana=Türk uyarlama), suspiro-limeno klasik
   bileşen ekle (Lima sömürge porto şarabı), tamal-en-cazuela
   disambiguate (Küba klasik domuz), tacos-al-pastor disambiguate
   (Meksika domuz marinasyonu), tepsi-kebabi-adana kimlik fix
   (Antakya klasiği).

5) **Mini-rev paketi 10** (commit `7880a9e`). 4 KRİTİK + 3 jenerik.
   uunijuusto cuisine se KORUNUR (Fin için ayrı kod gerekmez), van-
   keledos KIBE-MUMBAR (Türk Patent tescil 8 Kasım 2017), vatapa
   metadata corruption fix (tipNote tavuk + serv kuzu YANLIŞ, doğru
   karidesli + Bahia gelenek), uzum-pekmezli-keskek KAHVALTI→TATLI
   type değişimi (UNESCO 2011 keşkek geleneği). Plus 3 jenerik:
   sumakli-kuru-dolma-bitlis (yöre düşür) + sumakli-mahluta-mardin
   (bulgur+pirinç eksik definition fix) + tahinli-portakal-cilbiri-
   antalya (yoğurt eksik, çılbır tanımı zorunlu).

6) **Mini-rev paketi 11** (commit `8261354`). 7 KRİTİK + 1 BONUS +
   at cuisine. viyana-kaiserschmarrn hu→at, viena-tavuk-schnitzel
   BONUS de→at, yaglama-corbasi-kayseri CORBA→YEMEK type fix
   (kat kat şebit + kıyma + sarımsaklı yoğurt + 200°C fırın klasik),
   xiao-long-bao + warsaw-kotlet-schabowy disambiguate (Türk pazar
   uyarlama), zeytinli-labneli-fas ma→me (Levant klasiği), zingil-
   tatlisi-siirt KÜLTÜR PORTALI'NDA DİYARBAKIR KAYITLI title fix
   (Siirt yanlış), banh-mi vietnam definition fix (turşulu sebze
   + cilantro + jalapeño + Maggi şart).

7) **Mini-rev paketi 12** (commit `b9ce41a`). 4 KRİTİK + 3 jenerik.
   mugla-sundirme KIBE-MUMBAR (peynirli kuymak değil, sündürme=turp
   otunun tavada sünmesi), moqueca-de-banana Bahia disambiguate
   (plantain + dendê), murtuga-pide-tostu klasik forma çek (pide
   tost kombo modern fusion), palamutlu-pazi-diblesi forma çek
   (palamut REMOVE, klasik Karadeniz sebze). Plus 3 jenerik. Yeni
   feature: ingredients_amount_change field paketi 12 script'te.

8) **Mini-rev paketi 13** (commit `09c2438`). 7 KRİTİK. sanghay-
   susamli-dan-dan-noodle region fix (Sichuan title), urfa-agzi-
   acik KIBE-MUMBAR REWRITE FULL (CI tescilli açık pide), spaghetti-
   carbonara disambiguate (Türk Pazarı Uyarlaması, dinlendirme adımı
   sil), su-boregi forma çek (klasik el açma yumurtalı hamur, hazır
   yufka REMOVE), tatar-boregi-eskisehir KIBE-MUMBAR (kıyma+yumurta
   eksik), hindistan-pulao kimlik güçlendir (13 baharat ekle), siyezli-
   kes-durumu-kastamonu yöre yumuşatma. Plus em-dash guard logo/
   skip ekleme.

9) **Mini-rev paketi 14** (commit `c0dbf7b`). 7 KRİTİK + ca cuisine
   + 5 SEO FAQ. toronto-akcaagacli us→ca, tokat-bati KIBE-MUMBAR
   (yeşil mercimek eksik), somonlu-arpa-isvec yumuşatma (laxpudding
   orzo'suz), siyah-fasulyeli-balkabagi-brezilya sofrito ekle
   (feijão com abóbora kanonik), sucuklu-mercimek-kayseri yöre
   yumuşatma, sembusek-tostu-mardin KIBE-MUMBAR forma çek (yarım ay
   kapalı lahmacun, tost kombo yok), sardalyali-canakkale GIDA
   GÜVENLİĞİ KRİTİK (çiğ sardalya pişirme zorunlu). Plus 5 SEO
   entry için 4'er gerçek FAQ (20 q+a toplam, atistirmaliklar/sebze-
   yemekleri/smoothie-shake/soslar-dippler/portekiz).

10) **Mini-rev paketi 15** (commit `f00426c`). 7 KRİTİK. salatalikli-
    dereotlu-isvec kanıtlı klasik (kall gurksoppa Arla resmi, Codex
    yanılmış), susamli-kabak-corbasi-japon kimlik güçlendir (miso+
    dashi+kabocha, zencefil çıkar), sosisli-arpali-lahana-polonya
    kapusta+krupnik kanonik, sumakli-kabak-sinkonta-manisa KIBE-
    MUMBAR FULL (Kültür Portalı resmi: balkabağı + sos + 200°C
    60dk; sumak kanonsız çıkar), sirnak-fistikli-kuzu yöre yumuşatma
    (Güneydoğu), simsir-coregi-kirsehir title fix (KEŞİF: "Şimşir"
    küçük kaşık adı, çörek değil), sikhye SÜRE KRİTİK FIX 45→275
    dk (Kore klasik 4-8 saat enzimleme, Maangchi otoriter).

**Oturum 28 önemli bug fix'ler (5):**

- `3c21dd0` RecipeCard footer "0" bug. React `{0}` literal render
  bug, 3508 tarif kart altında "0" görünüyordu. Outer condition
  `cookedCount=0` iken `(false || (0 && false))` = `0` (sayı, falsy
  değil). Fix: `(recipe.cookedCount ?? 0) > 0` boolean'a normalize.
- `7845476` Home CTA sayfa altına taşı. Yeni-user için ana sayfa
  hero altında "Mutfağın daha pratik olsun" CTA dağıtık görünüyordu;
  alttaki jenerik "Kendi tarifini paylaş" CTA'sı heroAnonCta versiyonu
  ile değiştirildi. Tek güçlü CTA sayfa %91 noktasında.
- `d8b9858` SEO faqs eksik 5 entry için defensive guard. 5 entry'de
  `faqs: []` undefined → `buildFaqPageSchema(undefined).map()` crash
  → Server Components render error. 3 katmanlı fix: structured-data.ts
  defensive guard + 3 calling site empty check + seo-copy-v1.json'a
  `faqs: []` schema uyumu.
- `60439df` TTS K8 fix. Pişirme modunda site EN'de iken Türkçe
  okuyordu. `utter.lang = "tr-TR"` hardcoded. Fix: useLocale() hook,
  dinamik `ttsLang = locale === "en" ? "en-US" : "tr-TR"`, voice-
  picker.ts BCP-47 prefix match, EN voices pattern. 18/18 test PASS.
- `d220083` Picanha nutrition 0-match fix. "Picanha dana eti" +
  "İri tuz" NutritionData'da yok. Adlar "Dana eti (picanha)" + "Tuz"
  uyumlu hale getirildi. 0 match: 2 → 1 (sadece sazerac kokteyl
  kaldı, beklenen).

**Oturum 29+ ilk önce yapılması gerekenler (öncelik sırası):**

1. **Mini-rev paketi 16+ (~110 MAJOR kuyrukta)**. KRİTİK kandidatların
   büyük kısmı kapatıldı, kalan jenerik "yöre yumuşatma" pattern
   ağırlıklı. 7 tarif/paket pattern devam edebilir. Pattern script
   `scripts/fix-mini-rev-batch-15.ts` referans. Paketi 16-25 arası
   ~10 paket daha.

2. **SEO landing batch 5+ (top 29 → top 36+, 12 kalan)**. Adaylar:
   vietnam (29), brezilya (15), küba (12), peru (15), rus (24),
   macar (12), iskandinav (18), ingiliz (40+), polonya, avustralya
   (cuisine'lar). diet/sutsuz, diet/alkolsuz (diet'lar). Pattern
   script `scripts/seo-revise-batch4.mjs`.

3. **Mod A. Batch (yeni tarif)**. Oturum 27-28'de Mod A yapılmadı,
   prod 3508'de sabit. Brief §5, tetik docs/CODEX_NEW_CHAT_INTRO.md
   Bölüm 2.

4. **Lighthouse + a11y regression taraması**. Oturum 26'da K1-K7 +
   oturum 28'de K8 yapıldı, ama yeni Mod K v2 değişiklikleri
   sonrası baseline regression olabilir. Lighthouse CI threshold
   0.85 perf.

5. **Cloud TTS API entegrasyonu (P2 future)**. Windows OS-level TTS
   limitation: kadın TR voice yüklü değilse erkek fallback. UX
   iyileştirme: Azure / Google Cloud TTS veya UI uyarısı.

**Codex komutları (oturum 28 sonu güncel):**

- `Mod K. Batch Nx.` → KAPANDI (71/71 sub-batch tamamlandı). Yeni
  Mod K batch işi yok. Gelecekte ek Mod K v3 audit oluşursa brief
  §20 yeniden açılabilir, şu an gerek yok.
- `Mod A. Batch Na/Nb.` → Yeni tarif. Brief §5, tetik docs/
  CODEX_NEW_CHAT_INTRO.md Bölüm 2. Oturum 27-28'de yapılmadı,
  prod 3508'de sabit. Aktif kalan tek Codex modu.
- `Mod B/C/D/E/F/FA/G/H/I/IA/IB/M/K` → Hepsi KAPANDI (Mod K
  oturum 28'de %100 kapandı).
- Tüm modlarda em-dash (— U+2014) YASAK (`AGENTS.md`). Yerine
  virgül, noktalı virgül, nokta, parantez, iki nokta.

**Pre-push 6 katman (stable, oturum 28'de tüm 20 commit'te temiz):**

1) lint (ESLint)
2) content:validate (Zod, staple severity WARNING)
3) JSON dupe key guard
4) em-dash guard (NEW_SESSION_MESSAGE.md + logo/ skip listede)
5) allergen source guard
6) tsc --noEmit --pretty false

Bypass: `git push --no-verify` (sadece pre-existing drift için, sandbox
main branch için reddeder).

**Em-dash yasağı istisnaları (mevcut em-dash'lerin temizlik dışı):**

docs/CODEX_BATCH_BRIEF.md, docs/PROJECT_STATUS.md, docs/TARIFLE_
ULTIMATE_PLAN.md, docs/EM_DASH_CLEANUP.md, docs/CHANGELOG.md, docs/
BLOG_CONTENT_GUIDE.md, NEW_SESSION_MESSAGE.md, docs/all-recipe-titles.md,
plus `logo/` klasörü (oturum 28 paketi 13'te skip listesine eklendi,
tasarım keşif notları).

**Claude directory setup (~/.claude/):**

Plugin ve skill'ler kurulu. Rule'lar common + web + typescript altında.
Gerektiğinde proje-özel subagent ve skill kullan: engineering:debug,
engineering:code-review, engineering:system-design, tdd-workflow,
security-review, browser-qa, frontend-design, nextjs-turbopack,
brand-voice, data, finance, marketing, bio-research, cowork-plugin-
management. MCP server tool'ları (calendar, Claude Preview, Claude
in Chrome, mcp-registry) ve deferred tool'lar (ToolSearch ile
yüklenebilir) mevcut. Browser preview MCP (Chrome DevTools emulator,
preview_start + preview_eval + preview_resize + preview_click +
preview_fill) UX test için kullanılabilir (oturum 28'de RecipeCard
"0" bug fix + TTS K8 verify için kullanıldı). Plus WebSearch web
research (oturum 28'de 8 mini-rev paketinde 2 paralel agent ortalama
20+ kaynak/paket). Cloudflare DNS, Sentry API token (issue management
scope'larıyla) .env.local'de mevcut.

**Memory oku (kullanıcı tercihleri ve proje hafızası, SIRA önemli):**

`C:\Users\kozca\.claude\projects\C--Users-kozca-Desktop-projeler-
tarifle\memory\MEMORY.md` ve link verdiği TÜM dosyaları:

- project_tarifle.md (proje genel)
- feedback_proactive_features.md (practical additions sevilir)
- feedback_ai_positioning.md (rule-based 'AI hissi' >= gerçek LLM)
- feedback_project_status_format.md (kısa tut 2-4 satır, output 3
  blok)
- feedback_time_framing.md ('bugün/yarın' kullanma)
- feedback_pr_merge_workflow.md (PR review+merge benim)
- feedback_autonomous_commit.md (test edilmişse sormadan commit)
- feedback_autonomous_commands.md (prod write yetkisi kalıcı + Mod
  I/IA/IB/M/K batch'lerinde + tek-tarif transfer + benzer küçük
  scope'da sormadan apply yetkisi var)
- feedback_launch_priority.md (launch öncesi marketing/topluluk
  acelesi YOK)
- feedback_output_format.md (her mesaj sonu 3 blok: Özet + Sonuç +
  Sıradaki işler, önerim ile)
- reference_sentry_api.md (.env.local'de SENTRY_AUTH_TOKEN issue
  management scope'larıyla mevcut)
- reference_codex_workflow.md (Codex aynı klasörü kullanır,
  scripts/seed-recipes.ts'e veya docs/mod-*.json'a direkt yazar;
  "Batch X hazır" demesi = lokal disk'te değişiklik var demek)
- reference_tarif_listesi.md (docs/tarif-listesi.txt alfabetik tüm
  prod tarif başlıkları)

**Proje docs'larının tamamı .md, MUTLAKA oku (sıra önemli):**

- **docs/PROJECT_STATUS.md** → header oturum 28 SONU güncel + 20
  commit + 5 büyük başarı + 8 mini-rev paketi + 4 cuisine + Test
  Campaign 8/8 + 5 bug fix detay. İlk 200-250 satır yeterli.
- **docs/CODEX_BATCH_BRIEF.md** (~3700+ satır) → §17 Mod G + §18
  Mod H + §19 Mod M + §20 Mod K (HEPSI KAPANDI). Kural 6/7/16 + 5
  web teyit + 8 anlaşılır dil + 14 jargon yasak. Mini-rev paketi
  pattern brief §20.12'de.
- **docs/CODEX_NEW_CHAT_INTRO.md** → ChatGPT Max yeni chat başlangıç
  + Mod A aktif tek mod (B/C/D/E/F/FA/G/H/I/IA/IB/M/K KAPANDI).
- **docs/TEST_CAMPAIGN_OTURUM_26.md** → 8 kategori test plan
  (referans, K8 oturum 28'de kapatıldı).
- **docs/TEST_REPORT_OTURUM_26_KATEGORI_{1,2,3,4,5,6,7,8}.md** →
  8 detaylı test raporu (8/8 KAPANIŞ, K8 oturum 28 + TTS bug fix).
- **docs/MOD_M_TRIGGER.md / MOD_I/IA/IB_TRIGGER.md** → KAPANDI ama
  referans (verify pattern + apply pipeline).
- **docs/TARIFLE_ULTIMATE_PLAN.md** → single source of truth, ana
  yapı oturum 15'ten değişmedi.
- **docs/DIET_SCORE_PLAN.md** → 14 bölüm, Faz 0-2 detay, USDA
  coverage %99.97.
- **docs/FUTURE_PLANS.md** → güncel: Oturum 28 SONU özet + ~110
  mini-rev kuyruk + SEO 12+ kalan + Mod A devam.
- **docs/TEST_PLAN.md** → 11 bölüm test stratejisi (mevcut).
- **docs/BLOG_CONTENT_GUIDE.md** → editöryal standart + table format
  remark-gfm aktif.
- **docs/CHANGELOG.md** → kategorik akış, oturum 28 SONU header.
- **docs/all-recipe-titles.md** → cuisine+type grup, Mod I baz
  (KAPANDI ama referans).
- **docs/tarif-listesi.txt** → 3508 tarif alfabetik flat, manuel
  kontrol için (Ctrl+F).
- **docs/mod-k-batch-{1a-36a + 22b/24b}.json** → 71 sub-batch Codex
  input arşivi (hepsi apply edildi, Mod K v2 %100).
- **docs/nutrition-anomaly-report.md** → anomali tarama raporu (Mod
  K v2 sonrası prod recompute edildi, 1 sazerac kokteyl 0-match
  kaldı, kabul edildi).
- **scripts/fix-mini-rev-batch-1.ts → fix-mini-rev-batch-15.ts** →
  15 mini-rev paketi script'leri (idempotent + AuditLog + Cascade
  delete + type field + ingredients_amount_change paketi 12'de
  eklendi). Yeni paketi 16 için pattern olarak kullan.
- **scripts/find-zero-match.ts** (oturum 28 yeni) → recipe_nutrition
  matchedRatio=0 teşhis tool, anomaly tarama için kalıcı.

**Projenin özeti:** Tarifle (tarifle.app), Türkçe tarif platformu.
Next.js 16 + Prisma 7 + Vercel-managed Neon PostgreSQL + Vercel
Pro + Cloudflare DNS + Sentry + Cloudinary + Resend. GitHub repo
PRIVATE (KOZcactus/tarifle). Codex ChatGPT Max üzerinden Mod A ile
çalışıyor (B/C/D/E/F/FA/G/H/I/IA/IB/M/K HEPSI KAPANDI).

**Prod skor kartı (oturum 28 SONU, son commit `f00426c`):**

- 3508 tarif prod (sabit, oturum 28'de silme yok; oturum 27'de
  3517 → 3508 -9 silme)
- Mod K v2 %100 KAPANIŞ (71/71 sub-batch, kümülatif ~1701 prod
  correction)
- Mini-rev kuyruğu ~110 (paketi 1-15 ile 100 kapatıldı)
- 38 KRİTİK fix toplam (oturum 27: 3 + oturum 28: 35 yeni;
  KIBE-MUMBAR + cuisine + definition + GIDA GÜVENLİĞİ + type +
  KRİTİK keşif kategorileri)
- CUISINE_CODES 41 (oturum 28'de +4: cl + ge + at + ca)
- 57 blog (sabit oturum 25'ten)
- Test Campaign 8/8 KAPANIŞ (K1-K7 oturum 26 + K8 oturum 28
  + TTS bug fix)
- SEO landing top 29/41 done (oturum 27 batch 3 + 4) + 5 SEO
  FAQ entry tamamlandı (oturum 28 paketi 14)
- Personal "Pişirdiklerim" anasayfa shelf canlı
- Pişirdim rozet sistemi + RecipeTimeline visual canlı
- 41 mutfak (37→41), 17 kategori, 10 allergen, 15 tag, 11 rozet,
  4 cron
- 180+ unit test PASS (58 cuisine + 18 voice picker + diğerleri)
- Smoke test 0 ERROR
- Lighthouse CI Perf threshold 0.85
- 30 formal migration
- Pre-push 6 katman sabit, tsc 0 error (20 commit/20 temiz)
- A11y mobile touch target 44×44 (oturum 26)
- CSP ENFORCE CANLI + HSTS includeSubDomains+preload (oturum 26)
- JSON-LD XSS hardening (8 sayfa, oturum 26)
- Cloudflare Email Routing 3 alias CANLI
- DMARC TXT live (`p=none` monitor mode)
- Diet-score özelliği: 10 preset prod, 311 NutritionData (%99.97
  coverage)
- IngredientGuide tablosu: 250 ingredient
- /admin/kalite composite quality skor route
- Newsletter haftalık cron canlı
- /mutfak/{portekiz,sili,gurcu,avusturya,kanada} programatik
  landing prod canlı (oturum 27 + 28)
- TTS Web Speech API locale-aware (oturum 28 K8 fix)
- Prod nutrition recompute güncel (3508 row %98 matchedRatio>=0.5
  coverage, oturum 28)

**Önemli teknik dosyalar (oturum 28 yeni):**

- scripts/fix-mini-rev-batch-{8..15}.ts, 8 mini-rev paketi
  (idempotent + AuditLog MOD_K_MANUAL_REV + RecipeType + Difficulty
  + ingredients_amount_change paketi 12)
- scripts/fix-picanha-ingredients.ts (oturum 28), 0-match nutrition
  fix
- scripts/find-zero-match.ts (oturum 28), kalıcı teşhis tool
- src/lib/cuisines.ts, 37 → 41 (cl + ge + at + ca eklendi 9
  location her biri)
- tests/unit/cuisine-inference.test.ts, 46 → 58 PASS (12 yeni test)
- tests/unit/voice-picker.test.ts, 13 → 18 PASS (5 yeni TTS K8 test)
- messages/tr.json + en.json, cuisines.{cl, ge, at, ca} key
- src/components/recipe/CookingMode.tsx, useLocale + ttsLang
  dinamik (K8)
- src/lib/tts/voice-picker.ts, lang parametresi + BCP-47 prefix
  match + EN voices pattern
- src/lib/seo/structured-data.ts, buildFaqPageSchema defensive guard
- src/components/recipe/RecipeCard.tsx, footer "0" React `{0}`
  bug fix
- src/app/page.tsx, Home CTA sayfa altına taşıma
- docs/seo-copy-v1.json, 5 entry için 4'er FAQ tamamlandı (20 q+a)

**Tarifle mimari (oturum 15'ten değişmedi):**

- Vercel-managed Neon (ep-icy-mountain prod + ep-jolly-haze dev)
- next-intl cookie-based
- Recipe.translations JSONB shallow-merge
- --color-primary: #a03b0f
- Prisma 7 --config ./prisma/prisma.config.ts
- next 16 proxy pattern
- Tailwind 4 @custom-variant dark
- @dnd-kit admin drag-drop

**Kritik oturum 28 dersleri (kalıcı):**

1) Mod K v2 maraton finalı. 71 sub-batch verify+apply pipeline 2
   oturum (27 + 28) içinde tamamlandı. Pattern: dev DRY-RUN + dev
   APPLY + idempotent re-run + prod APPLY + nutrition recompute +
   commit. 6 apply turu oturum 28'de hatasız geçti.

2) Single-recipe national-icon cuisine ekleme pattern. 4 yeni
   cuisine code (cl + ge + at + ca) hepsi tek tarif için eklendi
   ama kuvvetli national icon statüsünde (pastel-de-choclo Şili,
   tkemali Gürcü, kaiserschmarrn Avusturya, akçaağaç şurubu
   Kanada). Pattern oturum 27 pt (Portekiz) ile başlamıştı, oturum
   28'de standart oldu.

3) KIBE-MUMBAR pattern dokümante. Slug doğru yöresel yemeği işaret
   ediyor ama içerik tamamen başka şablona bulaşmış = data
   corruption. Oturum 28 örnekleri: tatar-boregi-eskisehir (paketi
   13), su-boregi (paketi 13), yaglama-corbasi-kayseri (paketi 11),
   sumakli-kabak-sinkonta-manisa (paketi 15), mugla-sundirme
   (paketi 12), tokat-bati (paketi 14), urfa-agzi-acik (paketi 13),
   sirnak-serbidev (paketi 8), sembusek-tostu-mardin (paketi 14).
   Çözüm: REWRITE FULL klasik forma çek.

4) Codex'in cuisine itirazları her zaman doğru değil. Oturum 28
   paketi 15'te 4 cuisine itirazı 4'ünde de yanlış çıktı (kall
   gurksoppa İsveç klasik + kabocha miso Japon + kapusta+krupnik
   Polonya + feijão-com-abóbora Brezilya). Web research bağımsız
   doğrulama şart. Cuisine korunup içerik kanonik kanona çekilir.

5) Definition fix pattern (paketi 10+). Tarif tanımı gereği zorunlu
   bileşen eksikse (mahluta=karışık tahıl, çılbır=yoğurt, muhallebi
   =vanilya+şeker, banh-mi=đồ chua+cilantro, sikhye=4-8 saat
   enzimleme), REWRITE definition fix.

6) Type değişimi pattern (paketi 10+, paketi 12'de `recipeType`
   field eklendi). Mevcut: KAHVALTI→TATLI (uzum-pekmezli-keskek,
   paketi 10), CORBA→YEMEK (yaglama-corbasi-kayseri, paketi 11).
   UI surface'leri yanlış tetikliyordu.

7) Süre kritik fix (paketi 15 sikhye). 45 dk → 275 dk (4 saat
   enzimleme). Klasik fermente/enzimle bekleme süresi DB'de
   eksikse total süresi gerçeğe uymaz.

8) GIDA GÜVENLİĞİ FIX (paketi 14 sardalya). Çiğ sardalya parazit
   riski (sushi-grade olmayan balık çiğ tüketilemez). DB tarif
   sardalya pişirme adımı yoktu, REWRITE pişirme zorunlu (iç
   sıcaklık 63°C).

9) 3 KRİTİK keşif (paketi 11 + 14 + 15). (a) "Şimşir" Türk mutfak
   sözlüğünde KÜÇÜK KAŞIK adı (Kayseri mantı için), çörek adı
   değil (paketi 15). (b) Vatapa tipNote/servingSuggestion "tavuk
   + kuzu pembesi" tamamen yanlış metadata, doğrusu karidesli +
   Bahia gelenek (paketi 10). (c) zingil-tatlisi Kültür Portalı'nda
   DİYARBAKIR kayıtlı, slug'da "siirt" yanlış (paketi 11).

10) TTS Web Speech API locale-aware fix (K8 P1). Site EN'de iken
    pişirme modu Türkçe okuyordu (`utter.lang = "tr-TR"` hardcoded).
    Fix: useLocale() hook + dinamik ttsLang + voice-picker.ts
    BCP-47 prefix match. 18/18 test PASS.

İyice öğren projeyi. Acele etme, docs'ları + memory'yi sırayla oku,
prod durumunu anla. Plugin + skill'lerin Claude directory'de kurulu
olduğunu unutma. Em-dash yasağı aktif (NEW_SESSION_MESSAGE.md + logo/
skip listede). Pre-push 6 katman aktif. Mod B/C/D/E/F/FA/G/H/I/IA/IB/
M/K HEPSI KAPANDI (Mod K oturum 28'de %100 finalı). Mod A devam
(oturum 27-28'de yapılmadı, prod 3508'de sabit, Codex tetik bekliyor).
Test Campaign 8/8 RESMİ KAPANIŞ (K8 + TTS bug fix). Mod K v2 71/71
KAPANIŞ + 4 yeni cuisine + 8 mini-rev paketi + 5 SEO FAQ + 5 prod
bug fix oturum 28'de. CSP enforce + HSTS hardened + JSON-LD XSS
guard + 8 cuisine fix + 5 KIBE-MUMBAR fix + 4 definition fix prod.
Site LAUNCH-READY (0 P0 launch blocker yok, oturum 27-28'de P1
hepsi fix).

Ek bilgi: Mod K v2 %100 kapandı, ek Codex Mod K batch işi yok. Mod A
yeni tarif aktif tek mod (Codex tetiği bekliyor, oturum 27-28 hiç
Mod A yapılmadı). Mini-rev paketi 16+ ~110 MAJOR kuyruktan devam
edebilir (KRİTİK kandidat azaldı, jenerik yöre yumuşatma ağırlık).
SEO landing top 29/41 done, 12+ kalan batch 5+ ile (oturum 28 paketi
14 ile 5 entry FAQ tamamlandı). Plus prod nutrition recompute güncel
(3508 row, sazerac kokteyl tek 0-match kabul). Plus K8 cross-
browser PWA test 8/8 RESMİ KAPANIŞ.

Projeyi iyice anla, sonra sıradaki işleri listeler misin, hangi
öncelikte ne yapabileceğimizi söyle. Tercihime göre başlarız.
