Merhaba, Tarifle projesinde devam ediyoruz. Yeni session olduğu için
başlamadan önce projeye iyice hâkim olman lazım. Bir önceki oturumda
(28 Nis 2026, oturum 31, oturum 30'un aynı günü devamı) **~28
commit'lik ÇİFT KUYRUK %100 KAPANIŞ + Mod A v2 Quality-First pipeline
canlı + 5 GATE yeni audit metodoloji + 658 prod kayıt iyileşme +
2 yeni blog + SEO batch 6+7 + Codex Batch 40a-40d apply-ready
günü** oldu.

**Oturum 31 SONU FINAL kritik sonuçlar (önemli, ilk oku):**

1) **İki audit kuyruğu da %100 KAPANIŞ 🏁🏁**:
   - Verify-tracked MAJOR (mod-k-verify-report-*.md): 0/116 (paketi
     24'te kapandı, oturum 30).
   - Verify-untracked jenerik scaffold (find-jenerik-scaffold.ts
     **21 pattern**): 0/127 (paketi 25-43, 19 ardışık paket). Oturum
     30'da 13 pattern, oturum 31'de **8 yeni pattern** keşfedildi
     (find-new-boilerplate-patterns.ts ile): "ılık tabaklara alın
     yanında çayla" (25 hit), "son dokusunu kontrol edip tabaklayın"
     (21), "ritim bozulmasın" (16), "gluten gevşesin" (15), "akışı
     için" slug-leak indirect (9), "sıcak servis kıvamı korur" (9),
     "sıcak adımlarda arama yapılmasın" (6), "akışında kullanılacak
     tava" (2).

2) **15 ardışık mini-rev paketi (29-43) + 99 tarif**: Mini-rev
   kümülatif 190 → **289** (oturum 30 SONU 190 → oturum 31 SONU
   **289**, +99). 5 SLUG LEAK FIX + 1 jenerik 'Baharatlar' REMOVE +
   1 DATA ANOMALI ('Su 0 amount') + 1 DUPLICATE STEP FIX (paketi
   41 tulumlu-lor 'Karabiber serpip' iki defa). ~25 kritik essential
   keşif: Levant musakhan-bowl SOĞAN, Sichuan denge TOZ ŞEKER+SUSAM
   YAĞI, Peru sofrito KIMYON, K.Maraş MARAŞ BİBERİ, Welsh rarebit
   WORCESTERSHIRE, Rus syrniki TOZ ŞEKER+SMETANA, Edirne saray
   KUŞ ÜZÜMÜ+BADEM+TARÇIN, US BBQ PAPRIKA rub, tortilla con cebolla
   SOĞAN, Hatay zahter SUMAK+NANE, Kilis kuru NANE, Trabzon dible
   SARIMSAK, Macar túrós batyu VANILYA+LIMON KABUĞU, Kars otlu kete
   LOR, Erzurum su böreği SÜT+TUZ, Brezilya pamonha HİNDİSTAN CEVİZİ
   SÜTÜ, Norveç rømmegrøt TEREYAĞI/smjør, Avustralya brunch FRENK
   SOĞANI, Çin tea egg KARANFİL+KOYU SOYA, Polonya placki SOĞAN,
   mısır ekmeği KABARTMA TOZU.

3) **Mod A v2 Quality-First brief + pipeline (oturum 31 yeni
   ZORUNLU default)**: 13 mod cycle (B/C/D/E/F/FA/G/H/I/IA/IB/M/K)
   ve ~1700 prod correction sonrası kök neden tespiti: Mod A v1
   (50+50 tarif) hız > kalite, retrofit downstream'a aktı. v2 = inline
   gate, retrofit yerine doğum-anında doğru. Format: **20 tarif × 5
   paket** (Na/Nb/Nc/Nd/Ne, toplam 100 tarif) + **7 GATE**:
   - GATE 1 UNIQUENESS (slug + cuisine 41 sabit + title semantik
     benzerlik)
   - GATE 1.5 KRİTİK REJECT pattern + false positive whitelist
     (oturum 31 Batch 40a/40b dersi, brief §5.0.0 alt başlık)
   - GATE 2 KAYNAK (2-3 web kaynak + Kültür Portalı/CI yöre zorunlu)
   - GATE 3 KLASIK FORMUL (essential ingredients, ~25 örnek)
   - GATE 4 STEP↔INGREDIENT MATCH
   - GATE 5 ANTI-BOILERPLATE 21 pattern blacklist
   - GATE 6 SLUG-LEAK YASAĞI
   - GATE 7 EM-DASH YASAĞI

   docs/CODEX_BATCH_BRIEF.md §5.0.0 yeni alt başlık (mevcut §5.0+
   tüm kurallar geçerli). scripts/validate-mod-a-batch.ts kalıcı
   pipeline tool (auto git diff slug detect, 7 GATE check). İlk
   uygulama: Codex Batch 40a-40d 60 tarif teslim, 5+2 KRİTİK
   REJECT retrofit doğru çözüldü:
   - Batch 40a 5 retrofit: afyon-ilibada-dolmasi → kilis-gerebic;
     addis-ababa-shiro-wat → atakilt-wat-sebze-yahni; artvin-pucuko
     → isparta-zulbiye; bartin-pumpum-corbasi → kilis-mikla; lagos-
     egusi-corbasi → lagos-moi-moi.
   - Batch 40b 2 retrofit: santiago-pastel-de-choclo → santiago-
     humitas; stockholm-toast-skagen → stockholm-gubbrora.

   60 tarif (40a-40d) GATE 1+4+5+6+7 PASS, GATE 1.5 hit'leri brief
   whitelist'e uyuyor (false positive). **40e bekleniyor**, sonra
   100 tarif tek seferde apply (dev seed + prod seed).

4) **Yeni audit metodoloji 5 GATE (scripts/audit-recipe-quality.ts)**:
   - **GATE A SÜRE** (totalMinutes vs step süreleri): 393 hit, çoğu
     meşru bekleme (marine 8 saat) totalMinutes'a dahil ama
     timerSeconds'a değil. False positive yoğun. Düşük öncelik,
     algoritma rafine sonraki oturum.
   - **GATE B ALLERGEN** (step text vs allergen array): 198 rafine
     hit. **254 prod allergen ek (TIBBİ RİSK fix)** uygulandı.
     KUSUYEMIS=68, SUT=60, GLUTEN=50, YUMURTA=37, SUSAM=18, DENIZ_
     URUNLERI=10, HARDAL=8, SOYA=2, KEREVIZ=1. SUT için 'hindistan
     cevizi sütü' exclude rafine. OVER-flag > UNDER-flag tıbbi etik
     prensibi.
   - **GATE C MACRO** (4P+4C+9F vs averageCalories): 106 hit →
     **3 fix** (KOKTEYL/ICECEK skip alkol kcal formülde değil).
     Scale-up: yaglama-corbasi-kayseri (1.94), yesil-soganli-omlet-
     vietnam (1.33), zingil-tatlisi-siirt (1.30). AuditLog action
     'MACRO_FIX'.
   - **GATE D CUISINE** (slug pattern vs cuisine code): **606 → 0**
     (word boundary regex `(^|-)hint(-|$)` + compound exclude
     'hindistan-cevizi'/'sopa-de-lima'/'tarta-de-santiago' + CUISINE_
     CODES uyumlu se umbrella). 4 cuisine fix: zeytinli-labneli-fas
     'me'→'ma', 3 kuba 'mx'→'cu'. AuditLog 'CUISINE_FIX'.
   - **GATE E FEATURED** (>%10 brief ihlal): %11.3 → **%10.0**.
     46 prod unfeatured (viewCount=0 + en eski updatedAt). AuditLog
     'FEATURED_OVERFLOW_FIX'.

5) **2 yeni blog yazısı (57 → 59)**:
   - Blog 58 'Aromatik Sebze Tabanı: Mirepoix, Sofrito ve Dünya
     Mutfaklarının Başlangıç Üçlüsü' (mutfak-rehberi, 1262 kelime,
     8 H2 + Kaynaklar). 8 farklı mutfaktan üçlü karşılaştırma
     (mirepoix FR, sofrito ES/Latin/Peru, soffritto IT, holy trinity
     Cajun, suppengrün DE, włoszczyzna PL, Türk başlangıç). Mod K
     essential keşifleriyle bağ.
   - Blog 59 'Pirinç Çeşitleri Rehberi: Hangi Pilav, Risotto veya
     Sushi İçin Hangi Tip' (malzeme-tanima, 1351 kelime). 10 pirinç
     tipi (baldo, osmancık, kırmızı, basmati, jasmine, arborio,
     carnaroli, vialone nano, koshihikari/calrose, glutinous).
     Pişirme oran/süre tablosu + 12 yemek-pirinç önerisi.

6) **SEO landing batch 6 + 7 (48 → 60 entry)**:
   - Batch 6 (commit `94949ed`): 7 yeni cuisine (polonya 80, kuba
     72, avustralya 69, alman 12, endonezya 9, nijerya 6, etiyopya
     6 tarif). Top SEO derinlik 34 → 41.
   - Batch 7 (commit `525620e`): 5 yeni cuisine (pakistan, tunus,
     iran, arjantin, avusturya) + 3 diet revize (vegan, vejetaryen,
     glutensiz). Top SEO derinlik 41 → 49.
   - UNESCO ICH/TSG/PGI tescilleri: kuskus 2020, harissa 2022,
     Wiener Schnitzel TSG 2009, Wiener Kaffeehauskultur 2011, asado
     UNESCO aday, ceviche 2023.

7) **Lhci regression baseline kontrolü (oturum 31'de 2 kez)**: 5
   URL × 2 run = 10 PASS (perf ≥0.85 + a11y ≥0.95 + bp ≥0.9 + seo
   ≥0.95). Mini-rev paketi 29-43 + SEO + 2 blog + audit fix sonrası
   baseline güvende.

8) **Kümülatif prod iyileşme (~658 kayıt)**: 99 mini-rev rewrite +
   254 allergen retrofit + 4 cuisine fix + 3 macro fix + 46 featured
   iniş + 2 blog + 12 SEO entry + brief polish + memory yeni.

**Oturum 31 önemli mimari/tooling değişiklikler:**

- **scripts/find-new-boilerplate-patterns.ts** (yeni, oturum 31):
  audit pattern keşif tool, prod step text'lerden yeni boilerplate
  cümleleri yakalar. 8 yeni pattern bulundu, find-jenerik-scaffold.
  ts'e kalıcı eklendi (13 → 21 pattern).
- **scripts/audit-recipe-quality.ts** (yeni, oturum 31): 5 GATE
  sistematik kalite audit (süre + allergen + macro + cuisine +
  featured). Word boundary regex + compound exclude pattern + tip-
  bazlı tolerans rafine.
- **scripts/validate-mod-a-batch.ts** (yeni, oturum 31): Mod A v2
  Codex teslim sonrası 7 GATE validation. Auto git diff scripts/
  seed-recipes.ts → slug listesi detect, 7 GATE çalıştır.
- **scripts/fix-mini-rev-batch-{29..43}.ts**: 15 yeni mini-rev paketi
  (idempotent + AuditLog MOD_K_MANUAL_REV).
- **scripts/fix-allergen-mismatch.ts**: 254 prod allergen retrofit
  (AuditLog 'ALLERGEN_RETROFIT').
- **scripts/fix-cuisine-mismatch.ts**: 4 cuisine fix (AuditLog
  'CUISINE_FIX').
- **scripts/fix-macro-mismatch.ts**: 3 macro scale-up fix (AuditLog
  'MACRO_FIX').
- **scripts/fix-featured-overflow.ts**: 46 unfeatured (AuditLog
  'FEATURED_OVERFLOW_FIX').
- **scripts/seo-revise-batch{6,7}.mjs**: 12 yeni cuisine + 3 diet
  revize.
- **content/blog/aromatik-sebze-tabani-mirepoix-sofrito-dunya-
  mutfaklari.mdx** + **pirinc-cesitleri-rehberi-hangi-pilav-icin-
  hangi-tip.mdx**: 2 yeni blog.
- **docs/CODEX_BATCH_BRIEF.md** §5.0.0 yeni alt başlık + GATE 1.5
  whitelist + KRİTİK REJECT pattern (oturum 31 Mod A v2 dersi).

**Oturum 32+ ilk önce yapılması gerekenler (öncelik sırası):**

1. **Codex Mod A v2 Batch 40e teslim bekleme + apply pipeline**: 40e
   geldiğinde 80-100 tarif tek seferde apply (dev seed + prod seed +
   AuditLog). scripts/validate-mod-a-batch.ts ile son tüm 100 tarif
   final 7 GATE check.

2. **Codex Batch 41a-41e tetik (Mod A v2 sonraki 100 tarif)**.
   Brief §5.0.0 default scope, Codex tek mesajla "Mod A v2. Batch
   41a-41e" tetiği yeterli.

3. **3. blog yazısı**: çikolata bilimi (kakao yüzdesi, temperleme,
   eritme) veya taze ot rehberi (maydanoz/kişniş/dereotu/fesleğen/
   kekik/biberiye) veya sebze pişirme teknikleri (blanching/glazing/
   roasting/braising). Mevcut 59 blog, kategori dengesi pisirme-
   teknikleri (16) + malzeme-tanima (17) + mutfak-rehberi (19).

4. **GATE A süre algoritma rafine**: totalMinutes = prepMinutes +
   cookMinutes formülü kontrol + marine/bekleme step pattern exclude.
   Mevcut 393 hit'in büyük kısmı false positive (meşru bekleme),
   rafine sonrası ~30-50 gerçek REJECT yakalanabilir. ROI orta.

5. **CI hata teşhisi**: GitHub Actions'ta failed run'lar var
   (oturum 30/31 kontrol edildi, lokal her şey yeşil). GITHUB_TOKEN
   ile API'den log çekme veya gh CLI kurma.

6. **Cloud TTS API entegrasyonu (P2 future)**: Windows OS-level TTS
   limitation, kadın TR voice yüklü değilse erkek fallback.

**Codex komutları (oturum 31 SONU güncel):**

- **Mod A v2. Batch Na/Nb/Nc/Nd/Ne.** (örn. `Mod A v2. Batch 41a-
  41e.`) → Yeni tarif Quality-First default. **20 tarif × 5 paket
  = 100 tarif, 7 GATE zorunlu**. Codex 5-6 saat ardışık çalışır,
  her paket sonrası "Batch Na hazır, GATE 1-7 PASS" der. scripts/
  validate-mod-a-batch.ts otomatik validation. Brief §5.0.0.
- Mod B/C/D/E/F/FA/G/H/I/IA/IB/M/K → **HEPSI KAPANDI**, sadece
  Mod A v2 aktif.
- Tüm modlarda em-dash (— U+2014) ve en-dash (– U+2013) YASAK
  (AGENTS.md). Yerine virgül, noktalı virgül, nokta, parantez,
  iki nokta.

**Pre-push 6 katman (oturum 31 boyunca tüm 28 commit'te temiz):**

1) lint (ESLint) - logo/ klasörü ignore (oturum 30 kalıcı fix)
2) content:validate (Zod, staple severity WARNING)
3) JSON dupe key guard
4) em-dash guard (NEW_SESSION_MESSAGE.md + logo/ skip listede)
5) allergen source guard
6) tsc --noEmit --pretty false

Oturum 31'de 1 em-dash guard yakaladı (paketi 43 comment'te '—'),
hızlı düzeltme + tekrar push. Pattern: error tespit + fix + commit
+ push tekrar.

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
Plus WebSearch web research (oturum 29-30'da paralel agent disiplini,
oturum 31'de klasik kanonik tarifler için agent yerine direkt klasik
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
- feedback_batch_push.md (3-4 bağımsız iş paketi commit'i topla →
  tek push, Vercel build quota tasarrufu)
- **feedback_codex_mod_a_v2.md** (oturum 31 yeni; Codex Mod A v2
  7 GATE pipeline workflow, GATE 1.5 false positive whitelist +
  KRİTİK REJECT pattern, validate-mod-a-batch.ts referansı)
- reference_sentry_api.md (.env.local'de SENTRY_AUTH_TOKEN)
- reference_codex_workflow.md (Codex aynı klasörü kullanır)
- reference_tarif_listesi.md (docs/tarif-listesi.txt alfabetik)

**Proje docs'larının tamamı .md, MUTLAKA oku (sıra önemli):**

- **docs/PROJECT_STATUS.md** → header oturum 31 SONU FINAL güncel
  + 28 commit + 8 büyük başarı + iki kuyruk %100 KAPANIŞ + Mod A
  v2 pipeline + 5 GATE audit + 2 blog + SEO 6+7 + Codex 40a-40d
  apply-ready. İlk 200 satır yeterli.
- **docs/CODEX_BATCH_BRIEF.md** → Mod A v2 §5.0.0 + GATE 1.5
  whitelist + KRİTİK REJECT pattern (oturum 31 yeni alt başlıklar).
  Mod B/C/D/E/F/FA/G/H/I/IA/IB/M/K HEPSI KAPALI.
- **docs/CODEX_NEW_CHAT_INTRO.md** → Mod A v2 aktif tek mod.
- **docs/TARIFLE_ULTIMATE_PLAN.md** → single source of truth.
- **docs/DIET_SCORE_PLAN.md** → 14 bölüm, USDA coverage %99.97.
- **docs/FUTURE_PLANS.md** → Oturum 31 SONU FINAL özet + 40e
  bekleme + 41a-41e tetik + 3. blog + GATE A rafine + CI teşhis.
- **docs/TEST_PLAN.md** → 11 bölüm test stratejisi.
- **docs/BLOG_CONTENT_GUIDE.md** → editöryal standart + table format.
- **docs/CHANGELOG.md** → kategorik akış, oturum 31 SONU FINAL header.
- **docs/all-recipe-titles.md** → cuisine+type grup, Mod I baz.
- **docs/tarif-listesi.txt** → 3508 tarif alfabetik flat (sabit
  oturum 31 boyunca, 40a-40d apply edilmedi yet).
- **scripts/fix-mini-rev-batch-{1..43}.ts** → 43 mini-rev paketi
  script. Yeni paketi 44 için pattern paketi 43 referans.
- **scripts/find-jenerik-scaffold.ts** → 21 pattern audit tool
  (oturum 31 8 yeni pattern eklendi).
- **scripts/find-new-boilerplate-patterns.ts** (oturum 31 yeni) →
  audit pattern keşif tool, yeni boilerplate cümleleri yakalar.
- **scripts/audit-recipe-quality.ts** (oturum 31 yeni) → 5 GATE
  sistematik kalite audit.
- **scripts/validate-mod-a-batch.ts** (oturum 31 yeni) → Mod A v2
  7 GATE validation pipeline.
- **scripts/fix-{allergen,cuisine,macro,featured}-mismatch.ts**
  (oturum 31 yeni) → 4 GATE fix scripts.

**Projenin özeti:** Tarifle (tarifle.app), Türkçe tarif platformu.
Next.js 16 + Prisma 7 + Vercel-managed Neon PostgreSQL + Vercel
Pro + Cloudflare DNS + Sentry + Cloudinary + Resend. GitHub repo
PRIVATE (KOZcactus/tarifle). Codex ChatGPT Max üzerinden Mod A v2
ile çalışıyor (B/C/D/E/F/FA/G/H/I/IA/IB/M/K HEPSI KAPANDI).

**Prod skor kartı (oturum 31 SONU FINAL):**

- **3508 tarif prod sabit** (40a-40d 60 tarif henüz apply edilmedi,
  40e bekleniyor; 100 tamamlanınca tek seferde 3508 → 3608)
- Mini-rev kümülatif **289** tarif (paketi 1-43; oturum 30 SONU 190
  → oturum 31 SONU **289**, +99)
- Mini-rev verify-tracked kuyruk **0/116** (KAPALI paketi 24)
- Mini-rev verify-untracked jenerik scaffold kuyruğu **0/127**
  (KAPALI paketi 25-43, 21 pattern)
- Mod A v2 pipeline canlı: 60 tarif (40a-40d) apply-ready, 40e
  bekleniyor
- Yeni audit metodoloji 5 GATE: 4'ü ✅ (sadece A meşru bekleme
  süreleri)
- **254 prod allergen ek (TIBBİ RİSK fix)** + 4 cuisine + 3 macro
  + 46 featured iniş = 307 prod quality fix
- CUISINE_CODES **41** (sabit oturum 28'den)
- **59 blog** (oturum 31'de +2: Aromatik Sebze Tabanı + Pirinç
  Çeşitleri)
- **60 SEO landing entry** (oturum 31'de +12: batch 6+7, top SEO
  derinlik 49 cuisine kapsama)
- Test Campaign 8/8 KAPANIŞ (oturum 28)
- Pre-push 6 katman temiz (oturum 31 28 commit/28 temiz)
- Lhci 5/5 URL × 2 run = 10 run PASS (oturum 31'de 2 kez kontrol)
- 41 mutfak, 17 kategori, 10 allergen, 15 tag, 11 rozet, 4 cron
- 180+ unit test PASS, 925 vitest PASS
- Diet-score özelliği: 10 preset prod, 311 NutritionData (%99.97)
- IngredientGuide tablosu: 250 ingredient
- /admin/kalite composite quality skor route
- Newsletter haftalık cron canlı
- /mutfak/{portekiz,sili,gurcu,avusturya,kanada,polonya,kuba,
  avustralya,alman,endonezya,nijerya,etiyopya,pakistan,tunus,iran,
  arjantin} programatik landing prod canlı
- TTS Web Speech API locale-aware (oturum 28 K8 fix)
- Prod nutrition recompute güncel (3508 row %98 matchedRatio>=0.5)

**Tarifle mimari (oturum 15'ten değişmedi):**

- Vercel-managed Neon (ep-icy-mountain prod + ep-jolly-haze dev)
- next-intl cookie-based
- Recipe.translations JSONB shallow-merge
- --color-primary: #a03b0f
- Prisma 7 --config ./prisma/prisma.config.ts
- next 16 proxy pattern
- Tailwind 4 @custom-variant dark
- @dnd-kit admin drag-drop

**Kritik oturum 31 dersleri (kalıcı):**

1) **Mod A v1 → v2 dönüşümü**: 13 mod cycle ve ~1700 prod correction
   sonrası kök neden = Mod A v1'de hız > kalite, retrofit downstream'a
   aktı. v2 = inline gate, retrofit yerine doğum-anında doğru. 20
   tarif × 5 paket + 7 GATE. ROI yüksek (5+2 KRİTİK REJECT ilk
   teslimde yakalandı, retrofit cycle önlendi).

2) **Audit metodoloji çeşitlendirmesi**: 21 boilerplate pattern
   text-based audit + 5 GATE structured audit (allergen/macro/
   cuisine/featured/süre). Tıbbi etik prensibi: OVER-flag > UNDER-
   flag (kullanıcı false alarm tolere edebilir, gerçek alerji UNDER-
   flag riskli).

3) **Find-new-boilerplate-patterns.ts pattern keşif workflow**:
   Mevcut audit kuyruğu kapandığında yeni pattern aramak için tool
   yazılır (manuel inspect output'tan token frequency analysis).
   Oturum 31'de 8 yeni pattern bulundu, kuyruğu canlı tutmak için
   pattern.

4) **Word boundary regex faydası**: Cuisine algoritma 606 hit
   (substring match) → 0 hit (word boundary `(^|-)hint(-|$)` +
   compound exclude). Slug pattern matching'de critical.

5) **Compound exclude pattern**: 'hindistan-cevizi' (coconut) 'sopa-
   de-lima' (Yucatan) gibi domain-specific yanlış eşleşmeleri
   önlemek için compound word listesi tutmak şart.

6) **Tip-bazlı tolerans**: KOKTEYL/ICECEK macro denklem skip (alkol
   kcal formülde değil), YEMEK/CORBA/TATLI %20 tolerans. Audit
   algoritmaları tarif tipine göre rafine edilebilir.

7) **GATE 1.5 false positive whitelist disiplini**: 7 desen
   öğrenildi (aynı yöre prefiksi farklı yemek, klasik vs varyant,
   dana/tavuk versiyon, farklı yöre aynı yemek, dolma vs kavurma,
   klasik orijinal vs ülke varyantı, bölgesel yöre versiyonu). Brief
   §5.0.0'a kalıcı eklendi.

8) **Codex teslim flow**: Her batch ayrı session, ayrı mesaj.
   Validate auto git diff → REJECT varsa retrofit mesajı → re-
   validate → tüm GATE PASS olunca apply pipeline. 5-6 saat ardışık
   Codex süreç + ben paralelde mini-rev/blog/audit ile devam.

İyice öğren projeyi. Acele etme, docs'ları + memory'yi sırayla oku,
prod durumunu anla. Plugin + skill'lerin Claude directory'de kurulu
olduğunu unutma. Em-dash yasağı aktif (NEW_SESSION_MESSAGE.md + logo/
skip listede). Pre-push 6 katman aktif. Mod B/C/D/E/F/FA/G/H/I/IA/
IB/M/K HEPSI KAPANDI. **Mod A v2 Quality-First aktif tek Codex
modu**. Verify-tracked + verify-untracked çift kuyruk %100 KAPALI
🏁🏁. 5 GATE yeni audit metodoloji canlı (4'ü %0/OK). Site LAUNCH-
READY (lhci baseline güvende, 0 P0 blocker).

Ek bilgi: Codex Batch 40a-40d 60 tarif apply-ready, 40e bekleniyor.
40e geldiğinde tüm 100 tarif tek seferde apply (dev seed + prod
seed + AuditLog). Yeni Codex Batch 41a-41e tetik (Mod A v2 sonraki
100 tarif). 3. blog yazısı opsiyonel (çikolata/taze ot/sebze
pişirme). GATE A süre algoritma rafine ROI orta.

Projeyi iyice anla, sonra sıradaki işleri listeler misin, hangi
öncelikte ne yapabileceğimizi söyle. Tercihime göre başlarız.
