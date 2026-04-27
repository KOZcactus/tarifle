Merhaba, Tarifle projesinde devam ediyoruz. Yeni session olduğu için
başlamadan önce projeye iyice hâkim olman lazım. Bir önceki oturumda
(27 Nis 2026, oturum 27, oturum 26'nın aynı gün devamı) **26
commit'lik MUTLAK REKOR Mod K v2 + mini-rev maraton günü** oldu:
**Mod K v2 31 batch apply (11a → 27a) ile 51/71 sub-batch (%71.8)**,
~650 net yeni prod correction, 22b + 24b BAD reject; **CUISINE_CODES
36 → 37** (pt Portekiz eklendi); **45 mini-rev kapandı (paketi
1+2+3+4+5+6+7)** 9 silme + 36 REWRITE, 2 KRİTİK cuisine fix
(pina-colada in→cu, pupusa cn→mx) + 1 KRİTİK data corruption fix
(kibe-mumbar Diyarbakır coğrafi işaret); **SEO landing top 12 → top
29 sayfa** (batch 3 + 4, 8 + 9 sayfa derinleştirildi). Prod tarif
3517 → **3508** (-9 Codex halüsinasyonu silme). Site **LAUNCH-READY**.

**Oturum 27 kritik sonuçlar (önemli, ilk oku):**

1) **Mod K v2 31 batch apply (11a → 27a)**. 7 ana paket: (Pak 1)
   16 batch 11a-18b commit `49f4545` 283 yeni prod correction +
   6 onayli MAJOR; (Pak 2) 6 batch 19a-21b commit `22eb807` 113
   yeni; (Pak 3) 22a + 23a commit `6e67b9f` 71 yeni + 22b BAD
   reject (4 BLOCKED Kural 9 + Kural 1 ihlal); (Pak 4) 23b + 24a
   commit `2f9b770` 60 yeni; (Pak 5) 25a commit `6a8d445` 38 yeni
   + 24b BAD reject (12 BLOCKED); (Pak 6) 25b + 26a + 26b commit
   `c1bf27f` 88 yeni (26a 18 MAJOR yöre yoğun); (Pak 7) 27a commit
   `0cbb715` 35 yeni. Toplam Mod K v2 prod correction kümülatif
   ~480 → ~1130. PASS oran trend %44 → %10 (Codex sıkılaştı, mini-
   rev oranı arttı).

2) **CUISINE_CODES `pt` (Portekiz) ekleme** (commit `43844f0`).
   36 → 37 cuisine. 7 map (CODES + LABEL + SLUG + DESCRIPTION_TR/EN
   + FLAG + REGION mediterranean-levant) + 8 SLUG_PATTERNS
   (bacalhau, pastel-de-nata, francesinha, caldo-verde, bifana,
   piri-piri, bolinho-de-bacalhau, queijada) + 6 TEXT_KEYWORDS
   (portekiz/portekizli/lizbon/porto + 2 varyant) + verify-mod-k
   VALID_CUISINES + i18n TR + EN + 3 yeni test (46/46 PASS).
   `scripts/fix-portekiz-cuisine.ts` ile lisbon-nohutlu-morina +
   lizbon-portakalli-badem-keki es → pt otomatik fix. /mutfak/
   portekiz programatik landing prod canlı.

3) **Mini-rev paketi 1 (commit `7db92af`)**. 4 önceki oturum 26
   kalan: 2 REWRITE + 2 DELETE. **REWRITE**: feijao-tropeiro
   (klasik etli + bacon + linguica + couve), feslegenli-tavuklu-
   pirinc (Pad Kra Pao Gai stir-fry, sade fesleğen+su çıkar).
   **DELETE** (kullanıcı onayı): erzsebet-sour-macar (klasik
   Macar kokteyl yok, Wikipedia + WebSearch teyitsiz), findikli-
   keskek-toplari-ordu (yöresel yemek yok + scaffold). Cascade
   delete + AuditLog MOD_K_REJECT_DELETE.

4) **Mini-rev paketi 2 (commit `2f9b770`)**. 7 yöresel REWRITE
   Doğu Anadolu + Kayseri. 2 paralel web research agent + 13+
   kaynak teyit. helise-malatya (Bitlis/Van menşeli), kelecos-
   erzurum/van (kurut+kavurma + bakliyat+et+pazı keledoş), kiraz-
   yaprak ×2 malatya (yoğurt+yumurta sos klasik, padişah yemeği),
   **kayseri-kursun-asi** (KRİTİK: mevcut DB unlu hamur YANLIŞ,
   klasik bulgur+kıyma köfte Kültür Portalı resmi), kayseri-yag-
   mantisi (mayalı bohça kızartma).

5) **Mini-rev paketi 3 (commit `6a8d445`)**. 6 yabancı klasik +
   Türk yöresel REWRITE. 2 paralel agent + 14+ kaynak. **3 type
   değişimi**: kayisili-irmik (YEMEK→TATLI tejbegríz), kabak-
   bastisi (TATLI→YEMEK etli klasik), helle-tatlisi (TATLI→CORBA
   Tokat un çorbası). jeyuk-bokkeum + jokai-bableves TR pazar
   uyarlaması (sucuk + dana, "klasik domuz iledir" disambiguate).

6) **Mini-rev paketi 4 (commit `b2f4509`)**. 4 REWRITE + 3 DELETE.
   2 paralel agent + 18+ kaynak (3 resmi ktb.gov.tr/valilik +
   Vikipedi). **REWRITE**: kerebic-mersin (cöven köpük klasik),
   **kibe-mumbar** (KRİTİK data corruption fix - "Kibe" ingredient
   olarak yazılmış, doğrusu kuzu işkembesi; Diyarbakır coğrafi
   işaret TPMK 2022), kilis-oruk (şiş kebap klasik), katikli-ekmek-
   kilis (Hatay/Antakya kanonik). **DELETE**: keskekli-istavrit-
   sinop, kestaneli-hamsi-zonguldak, kayisava-trabzon (3'ü de
   resmi ktb.gov.tr listelerinde yok). Prod 3517 → 3515 (-2)
   sonra 3515 → 3512 (-3 paketi 4).

7) **SEO landing batch 3 + 4 (commit `b39b4df` + `36fff69`)**.
   8 + 9 sayfa intro derinleştirildi (top 12 → 29). 5 mevcut
   revize + 3 yeni (atistirmaliklar + sebze-yemekleri + portekiz)
   batch 3 + 7 cuisine revize + 2 yeni (smoothie-shake + soslar-
   dippler) batch 4. Otorite kaynakları: USDA + Akdeniz Diyet
   Vakfı + UNESCO 2010 (Akdeniz + Meksika) + KOCIS 2013 (Kore) +
   Auguste Escoffier 1903 + Verace Pesto Genovese 1865 + Pasteis
   de Belém 1837. Em-dash 0. `scripts/seo-revise-batch3.mjs` +
   `seo-revise-batch4.mjs` pattern.

8) **Mini-rev paketi 5 (commit `c1bf27f`)**. 7 Türk yöresel
   REWRITE. 25+ kaynak teyit. Slug korunur (URL break önleme),
   description-light disambiguate yaklaşımı: kastamonu-siyez
   (İhsangazi yoğurt+ebegümeci klasik), icli-tava-sinop (pirinçli
   iç harç + yumurtalı kapama Kültür Portalı resmi), patila-kars
   (Tunceli/Elazığ klasiği + içli varyant), patatesli-kete-ardahan
   (kete kuşağı), hatay-zahterli-nohut (Gaziantep coğrafi işaret),
   hurmali-kirklareli (Trakya jenerik), mincili-laz-boregi-rize
   (klasik tatlı disambiguate, tuzlu varyant kalır).

9) **Mini-rev paketi 6 (commit `0cbb715`)**. 5 REWRITE + 2 DELETE.
   2 paralel agent + 20+ kaynak. REWRITE description-light:
   bazlama-isparta (Akdeniz esintili), findikli-pide-duzce
   (Karadeniz esintili), sikma-konya (Çukurova/Adana, salça +
   step revize), incir-kupu-canakkale (Ege esintili), kabak-cicegi-
   balikesir (Ege/Marmara). DELETE: firikli-gozleme-kahramanmaras
   (Maraş + firik kombinasyon ikisi de uydurma), peynirli-manyok-
   kase-brezilya (Brezilya kanonik pão de queijo, mevcut akrabası
   bile değil). Prod 3512 → 3510.

10) **Mini-rev paketi 7 (commit `ea25210`)**. 5 REWRITE + 2 DELETE
    + **2 KRİTİK cuisine fix**. 18+ kaynak. REWRITE: bursa-mucver-
    tost (Bursa atfı kaldır), pezik-diyarbakir (yöre düzelt
    Karadeniz/Giresun + 6 ingredient_add), picarones-peru (klasik
    halka formu + tatlı patates + chancaca şurup), **pina-colada
    cuisine in (Hint!) → cu (Karayip/Porto Riko 1954 Caribe Hilton
    Ramón Marrero, IBA klasik)**, **pupusa cuisine cn (Çin!) →
    mx (Mezoamerika; El Salvador Pipil mirası, UNESCO 2022 ICH +
    curtido eklendi)**. DELETE: yozgat-mercimek (Yozgat ispanak/
    pastırma klasik, mercimekli yok), samsun-pirasa-misir-unlu-
    pide (Bafra pidesi buğday unu, mısır unu pide hamurunda
    teknik anomali). Prod 3510 → **3508** (-2 silme).

**Oturum 28+ ilk önce yapılması gerekenler (öncelik sırası):**

1. **Mod K Batch 27b + 28a verify+apply (~30-45 dk)**. Codex'in
   oturum 27 sırasında teslim ettiği 2 batch (`docs/mod-k-batch-
   27b.json` + `docs/mod-k-batch-28a.json`). Standart verify-mod-
   k-batch + manuel review + apply-mod-k-batch dev/prod pipeline.
   Mod K v2 51 → 53/71 (%74.6) hedef.

2. **Mini-rev paketi 8 (~2-2.5 saat)**. Kalan 39 mini-rev'den
   5-7 tarif paketleme. 26a kalan 11 (peynirli-X-Y-Z-usulu yöre
   yoğun) + 25b/26b/27a yeni 8 + 25a kalan 4. 2 paralel web
   research agent + script pattern oturum 27 paketi 1-7 ile aynı.
   Kuyruk 39 → 32-33 hedef.

3. **K8 Cross-browser + PWA test (sen telefondan, ~45 dk)**. Test
   Campaign'in son kategorisi. iOS Safari (TTS Web Speech API +
   reduced-motion), Firefox (Gecko), Edge (Blink), Mobile Safari,
   Chrome Android. PWA install banner + standalone mode. Sen test
   eder bulguları paylaşırsın, ben rapora ekleyip 8/8 campaign
   resmi kapatırım.

4. **Codex'ten 22b + 24b yeniden iste (sen tetikler)**. Brief
   sec.20.3 Kural 1 (description şişirme yasak max %20) + Kural 9
   (süre tutarlılığı) disiplini hatırlatma. Codex yeniden teslim
   ettiğinde verify+apply pipeline.

5. **Mod K Batch 28b + 29a-36b devam (Codex tetik)**. ~17 sub-
   batch kalan. Sen 1-satır tetik atar (`Mod K. Batch 28b.`),
   ben verify+apply pipeline.

6. **SEO landing batch 5 (~1.5 saat, 5-7 sayfa)**. Top 29 → top
   36. Adaylar: vietnam (29), brezilya (15), küba (12), peru (15),
   rus (24), macar (12), iskandinav (18), ingiliz (40+), polonya,
   avustralya cuisine + diet/sutsuz, diet/alkolsuz + kahveler/
   kokteyller/icecekler kategoriler. `scripts/seo-revise-batch4.
   mjs` pattern genişler.

7. **Nutrition recompute (~10 dk)**. Mod K v2 31 batch apply
   sonrası ingredient değişiklikleri macro recompute gerektiriyor.
   `npx tsx scripts/compute-recipe-nutrition.ts` ile düzelt,
   nutrition anomaly 1181 → ~1250'den geriye düşürür.

**Codex komutları (oturum 27 sonu güncel):**

- **"Mod K. Batch Nx."** → Tarif kontrol v2 (Kural 9/10/11). 50'lik
  sub-batch (28b → 36b kalan, 27b + 28a zaten teslim disk'te).
  Tetik docs/CODEX_NEW_CHAT_INTRO.md Bölüm 6, brief §20 + §20.7 +
  §20.8 + §20.9 + §20.10 + §20.11 + §20.12. **22b + 24b yeniden
  iste**: Brief sec.20.3 Kural 1 + Kural 9 disiplini hatırlatma.
- **"Mod A. Batch Na/Nb."** → Yeni tarif (oturum 27'de Mod A
  yapılmadı, prod 3508'de sabit). Brief §5, tetik docs/CODEX_NEW_
  CHAT_INTRO.md Bölüm 2.
- **"Mod B/C/D/E/F/FA/G/H/I/IA/IB/M"** → Hepsi KAPANDI.
- Tüm modlarda **em-dash (— U+2014) YASAK** (AGENTS.md). Yerine
  virgül, noktalı virgül, nokta, parantez, iki nokta.

**Pre-push 6 katman (stable, oturum 27'de tüm 26 commit'te temiz):**

1) lint (ESLint)
2) content:validate (Zod, staple severity WARNING)
3) JSON dupe key guard
4) em-dash guard (NEW_SESSION_MESSAGE.md skip listede)
5) allergen source guard
6) tsc --noEmit --pretty false

Bypass: `git push --no-verify` (sadece pre-existing drift için, sandbox
main branch için reddeder).

**Em-dash yasağı istisnaları (mevcut em-dash'lerin temizlik dışı):**

docs/CODEX_BATCH_BRIEF.md, docs/PROJECT_STATUS.md, docs/TARIFLE_
ULTIMATE_PLAN.md, docs/EM_DASH_CLEANUP.md, docs/CHANGELOG.md, docs/
BLOG_CONTENT_GUIDE.md, NEW_SESSION_MESSAGE.md, docs/all-recipe-titles.md.

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
preview_fill) UX test için kullanılabilir. Plus WebSearch web research
(oturum 27 mini-rev paketi 1-7'de 2 paralel agent ortalama 18+ kaynak/
paket teyit). Cloudflare DNS, Sentry API token (issue management
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

- **docs/PROJECT_STATUS.md** → header oturum 27 SONU güncel + 26
  commit + 4 büyük başarı + 7 mini-rev paketi detay. İlk 250-300
  satır yeterli.
- **docs/CODEX_BATCH_BRIEF.md** (~3700+ satır) → §17 Mod G + §18
  Mod H + §19 Mod M (KAPANDI) + §20 Mod K (aktif, en son §20.3
  Kural 9/10/11 + §20.7 yeniden audit + §20.8 oturum 25 sonu +
  §20.9 oturum 27 başı + §20.10 ikinci paket + §20.11 üçüncü paket
  + **§20.12 Oturum 27 SONU durum**). Kural 6/7/16 + 5 web teyit +
  8 anlaşılır dil + 14 jargon yasak. Mini-rev paketi pattern
  (oturum 27'de oluşturuldu) brief §20.12'de.
- **docs/CODEX_NEW_CHAT_INTRO.md** → ChatGPT Max yeni chat başlangıç
  + 5 mod detaylı tetik. Mod durum tablosu Mod K row 'v2 audit
  aktif, 51/71 sub-batch done'.
- **docs/TEST_CAMPAIGN_OTURUM_26.md** → 8 kategori test plan + tools
  matrisi + öncelik sıralaması (referans, K8 hala kalan).
- **docs/TEST_REPORT_OTURUM_26_KATEGORI_{1,2,3,4,5,6,7}.md** → 7
  detaylı test raporu (referans).
- **docs/MOD_M_TRIGGER.md / MOD_I/IA/IB_TRIGGER.md** → KAPANDI ama
  referans (verify pattern + apply pipeline).
- **docs/TARIFLE_ULTIMATE_PLAN.md** → single source of truth, ana
  yapı oturum 15'ten değişmedi.
- **docs/DIET_SCORE_PLAN.md** → 14 bölüm, Faz 0-2 detay, USDA
  coverage %99.97.
- **docs/FUTURE_PLANS.md** → güncel: Mod K v2 51/71 done + 39 mini-
  rev kuyruk + Codex 27b/28a teslim + 22b/24b BAD reject + SEO top
  29/41 done (12+ kalan) + Mod A 40+ + yeni blog yazıları.
- **docs/TEST_PLAN.md** → 11 bölüm test stratejisi (mevcut).
- **docs/BLOG_CONTENT_GUIDE.md** → editöryal standart + table format
  remark-gfm aktif.
- **docs/CHANGELOG.md** → kategorik akış, oturum 27 SONU header.
- **docs/all-recipe-titles.md** → cuisine+type grup, Mod I baz
  (KAPANDI ama referans).
- **docs/tarif-listesi.txt** → 3508 tarif alfabetik flat, manuel
  kontrol için (Ctrl+F).
- **docs/mod-k-batch-{1a-28a}.json** → 71 sub-batch Codex input
  arşivi, oturum 27 sonu 27b + 28a teslim hazır apply pending.
- **docs/mod-k-archive-pre-rule17/** → eski 1a-4b v1 outputs
  (referans).
- **docs/nutrition-anomaly-report.md** → 1181 → ~1250 anomali
  tarama raporu (Mod K v2 sonrası macro recompute gerekli).
- **scripts/fix-mini-rev-batch-1.ts** → **scripts/fix-mini-rev-
  batch-7.ts** → 7 mini-rev paketi script'leri (idempotent +
  AuditLog + Cascade delete + type field destek). Yeni paketi 8
  için pattern olarak kullan.

**Projenin özeti:** Tarifle (tarifle.app), Türkçe tarif platformu.
Next.js 16 + Prisma 7 + Vercel-managed Neon PostgreSQL + Vercel
Pro + Cloudflare DNS + Sentry + Cloudinary + Resend. GitHub repo
PRIVATE (KOZcactus/tarifle). Codex ChatGPT Max üzerinden Mod A/K
ile çalışıyor (B/C/D/E/F/FA/G/H/I/IA/IB/M KAPANDI).

**Prod skor kartı (oturum 27 SONU, son commit `fb806ff`):**

- **3508 tarif prod** (3517 → 3508, -9 silme oturum 27 mini-rev
  paketi 1+4+6+7'de Codex halüsinasyonu temizlendi)
- **Mod K v2 aktif paket** (51/71 sub-batch done %71.8, 17 kalan;
  PASS oran trend %44 → %10 sıkı audit; Codex 27b + 28a working
  tree'de hazır)
- **Mini-rev kuyruğu 39** (45 mini-rev kapandı oturum 27, 9 silme +
  36 REWRITE + 3 KRİTİK fix dahil)
- **3 KRİTİK fix** (oturum 27): kibe-mumbar data corruption +
  pina-colada cuisine in→cu + pupusa cuisine cn→mx
- **CUISINE_CODES 37** (oturum 27 pt eklendi)
- **57 blog** (sabit oturum 25'ten)
- **Test Campaign 7/8 DONE** (K1-K7, K8 sen telefondan kalan)
- **SEO landing top 29/41 done** (oturum 27 batch 3 + 4)
- **Personal "Pişirdiklerim" anasayfa shelf canlı**
- **Pişirdim rozet sistemi + RecipeTimeline visual canlı**
- **37 mutfak, 17 kategori, 10 allergen, 15 tag, 11 rozet, 4 cron**
- **170+ unit test PASS** (46 cuisine + diğerleri)
- **Smoke test 0 ERROR**
- **Lighthouse CI** Perf threshold 0.85
- **30 formal migration**
- **Pre-push 6 katman sabit**, tsc 0 error (26 commit/26 temiz)
- **A11y mobile touch target 44×44** (oturum 26)
- **CSP ENFORCE CANLI** + **HSTS includeSubDomains+preload** (oturum
  26)
- **JSON-LD XSS hardening** (8 sayfa, oturum 26)
- **Cloudflare Email Routing 3 alias CANLI** ✅
- **DMARC TXT live** (`p=none` monitor mode)
- **Diet-score özelliği**: 10 preset prod, 311 NutritionData (%99.97
  coverage)
- **IngredientGuide tablosu**: 250 ingredient
- **/admin/kalite** composite quality skor route
- **Newsletter haftalık cron canlı**
- **/mutfak/portekiz** (oturum 27 yeni)

**Önemli teknik dosyalar (oturum 27 yeni)**:

- `scripts/fix-portekiz-cuisine.ts` — pt cuisine fix (lisbon-
  nohutlu-morina + lizbon-portakalli-badem-keki)
- `scripts/seo-revise-batch3.mjs` + `seo-revise-batch4.mjs` — SEO
  landing pattern (top 12 → top 29)
- `scripts/fix-mini-rev-batch-1.ts` → `fix-mini-rev-batch-7.ts` —
  7 mini-rev paketi script'leri (idempotent + AuditLog
  MOD_K_MANUAL_REV / MOD_K_REJECT_DELETE + Cascade delete + type
  field destek)
- `src/lib/cuisines.ts` — 36 → 37 (pt eklendi 7 map + SLUG +
  TEXT_KEYWORDS)
- `tests/unit/cuisine-inference.test.ts` — 43 → 46 PASS (3 yeni
  pt test)
- `messages/tr.json` + `en.json` — cuisines.pt key

**Tarifle mimari (oturum 15'ten değişmedi):**

- Vercel-managed Neon (ep-icy-mountain prod + ep-jolly-haze dev)
- next-intl cookie-based
- Recipe.translations JSONB shallow-merge
- --color-primary: #a03b0f
- Prisma 7 --config ./prisma/prisma.config.ts
- next 16 proxy pattern
- Tailwind 4 @custom-variant dark
- @dnd-kit admin drag-drop

**Kritik oturum 27 dersleri (kalıcı):**

1) **Mini-rev paketi disiplini**. 7 paket boyunca pattern oturdu:
   DB state çek → 2 paralel web research agent (3-4 tarif/agent,
   ortalama 2-3 kaynak/tarif) → karar matrisi (REWRITE / DESC_ONLY
   / REJECT / KEEP / DELETE) → kullanıcı onayı (DELETE için
   destructive op disiplini) → idempotent script + AuditLog →
   dev test + idempotent re-run + prod apply → dump-tarif-listesi
   (silme varsa) → commit + push. ~2-2.5 saat per paketi 7 tarif.

2) **Slug korunur, description-light disambiguate yaklaşımı**.
   Yöre atfı yanlış olan tariflerde slug rename URL break
   önlemek için yapılmadı. Description'da yöre yumuşatılarak
   "Karadeniz esintili" / "Akdeniz esintili" / "Doğu Anadolu"
   jenerik atıfa çevrildi. Slug + title kalır, içerik kalitesi
   korunur.

3) **2 KRİTİK cuisine fix pattern**. pina-colada in (Hint!) → cu,
   pupusa cn (Çin!) → mx. CUISINE_CODES'ta El Salvador veya Porto
   Riko spesifik kodu yoksa en yakın Mezoamerika/Karayip temsili
   seçilir. Marka algısı için kritik düzeltme.

4) **DELETE pattern** (Codex halüsinasyonu için). 9 tarif silindi
   oturum 27'de (kuyruk düşürme). Hepsi resmi yöresel listelerde
   yok (ktb.gov.tr / valilik / belediye coğrafi işaret) + jenerik
   konsept de ikna etmiyor. Kullanıcı onayı şart (destructive op,
   memory feedback_autonomous_commands "geri dönüşü olmayan silme
   için flag" disiplini).

5) **22b + 24b BAD reject pattern**. 12 + 4 BLOCKED format ihlali
   (Kural 9 süre tutarsız + Kural 1 description şişirme). Codex
   disiplin ihlali için yeniden iste, tamamen SKIP.

6) **3 KRİTİK fix dokümante**. kibe-mumbar (data corruption -
   "Kibe" ingredient yanlış, doğrusu işkembe), pina-colada cuisine
   in→cu, pupusa cuisine cn→mx. Bu üç fix marka kalitesi için
   önemli, brief §20.12'de detaylı kayıt.

7) **Mini-rev paketi 3'te type değişikliği pattern**. 3 type
   değişimi: kayisili-irmik YEMEK→TATLI, kabak-bastisi TATLI→YEMEK,
   helle-tatlisi TATLI→CORBA. Type field script'te destekleniyor
   (paketi 3+ ile eklendi).

İyice öğren projeyi. Acele etme, docs'ları + memory'yi sırayla oku,
prod durumunu anla. Plugin + skill'lerin Claude directory'de kurulu
olduğunu unutma. Em-dash yasağı aktif (NEW_SESSION_MESSAGE.md skip
listede). Pre-push 6 katman aktif. Mod B/C/D/E/F/FA/G/H/I/IA/IB/M
KAPANDI. Mod A devam (oturum 27'de yapılmadı), **Mod K v2 aktif
51/71 sub-batch / ~1130 toplam correction prod, 17 sub-batch kalan
(28b-36b + 22b/24b yeniden), Codex 27b + 28a working tree'de hazır
verify+apply bekliyor**. Test Campaign 7/8 done (K8 sen telefondan).
**Mini-rev kuyruğu 39, paketi 1-7 ile 45 mini-rev kapandı**. CSP
enforce + HSTS hardened + JSON-LD XSS guard + 2 KRİTİK cuisine fix +
1 data corruption fix prod. Site **LAUNCH-READY** (0 P0 launch
blocker yok, 5 P1 hepsi fix oturum 26).

Ek bilgi: Codex `Mod K. Batch 27b` ve `Batch 28a` çıktıları zaten
oturum 27 sonu disk'te (`docs/mod-k-batch-{27b,28a}.json`), verify+
apply pipeline ilk işlerden olabilir. Plus 22b + 24b BAD reject
yeniden tetik gerek (Codex'e brief sec.20.3 disiplini hatırlatma).
Plus 39 mini-rev kuyruktan paketi 8 hazır (5-7 tarif paralel agent +
script pattern oturum 27 paketi 1-7 ile aynı). Plus K8 cross-
browser PWA test (sen telefondan, 8/8 Test Campaign kapanış).

Projeyi iyice anla, sonra sıradaki işleri listeler misin, hangi
öncelikte ne yapabileceğimizi söyle. Tercihime göre başlarız.
