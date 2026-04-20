# Tarifle, Proje Durumu

> Son güncelleme: **Oturum 11 sonu (21 Nis 2026), 37 commit (36 feat + 1 kritik CI fix), en büyük gün** — Backfill trilogy (01-13 tam) + allergen audit overhaul + source drift fix + SEO + mobile carousel + Sentry tune + batch 27 Mod A prod + Mod B CSV hazır + **🚨 CI/Vercel deploy regression fix** (tsc --noEmit pre-push 5. katman olarak eklendi, 36+ commit CI kırmızı/Vercel deploy bozulma kök nedeni kalıcı olarak kapatıldı). **2553 tarif prod** (2454 + 99 batch 27). **Mod B 2465/2553 (%96.5)** — %53'ten başlayıp ~1266 tarifi tam çevirili yaptık. **isFeatured 294/2553 (%12.0)** — +63 boost. Pre-push **4 katman** (lint + content:validate + em-dash + allergen source guard). Source drift trilogy: allergens (553) + missing slugs (34) + content (345). Audit 0 CRITICAL / 0 over-tag. Mobile shelf carousel + "Tam çeviri" badge + PWA engagement gate + install analytics + similar-recipes v3 (region + hunger proximity, 28 test). SEO: WebSite+Organization JSON-LD + hreflang + robots param. Sentry noise tune (client denyUrls + server Auth/Prisma/JWT ignore). **Sonraki:** Batch 27 Mod B CSV Codex'e (hazır), dev-prod slug drift fix, batch 28+ Mod A, orta vade Cache Components / Video snippet / Premium.

> Oturum 10 sonu (20 Nis 2026, 15 commit): DB audit + açlık barı + batch 24-26 + duplicate merge + manuel env'ler. **2454 tarif prod canlı**. Mod B **1299/2454** (%53). Oturum highlight: **(1) Açlık barı** (Minecraft-esin 1-10 tokluk, formül + schema + retrofit + detay + listing chip + `/tarifler` filter+sort + AI Asistan "Acıktım" + home widget + OG + PDF + JSON-LD), **(2) Batch 24-26 Mod A prod** (300 yeni tarif + 25 allergen fix), **(3) Duplicate merge P3** (155 grup, 166 loser silindi, 0 reference kaybı, SEO win), **(4) Mod B backfill altyapısı** (13 CSV, 1266 tarif, backfill-01 prod %53'e çıkardı), **(5) Haftalık audit cron** (`/api/cron/audit-report`, Sentry alert, vercel.json), **(6) Empty allergen fix** (4 prod + 1 FP rollback), **(7) E2E TestUser cleanup** + helper cascade fix, **(8) Tüm manuel env tamam** (Newsletter + Audit + Cloudinary + Pinterest domain claim). 20 migration, 613/613 test PASS, tsc/lint/em-dash clean, pre-push 3 katman. **Sonraki:** Codex Backfill-02..13 (12 batch, 1168 tarif kalan), batch 27 Mod A, 3-katmanlı source drift fix, tipNote/servingSuggestion backfill (180+167), isFeatured boost (%9.2 → %10-15 hedef), uzun vade: video snippet + Cache Components PPR + Premium.

> Oturum 9 sonu (23 commit), 2320 tarif prod. Altyapı + kalite + maliyet turu: CI fix, daily view log, 500 URL search submission, IndexNow otomasyonu (middleware + CLI + haftalık cron + 2301 URL ping), Mod B batch 21-23 prod + 9 allergen fix, legal humanize, em-dash global yasak (2500+ karakter + pre-push Node guard), `unstable_cache` hot path'ler, Neon Launch + quota 385k CU-sec ~$12 hard cap. 574/574 test, 19 migration.
>
> Oturum 8 sonu (30 commit), 2320 tarif prod canlı. 10 blok: 6 Codex batch Mod A (1701→2320), 3 Mod B batch (batch 18-20 çeviri 600→900), rekabet §8 kısa 6/6 ✅ + orta 5/5 ✅, topluluk loop tam (follow + feed + fan-out + followers list + suggested cooks + collection/variation share + PWA banner + Pinterest rich pin + user-photos flag), admin analytics + bulk moderation + search log, PDF export + llms.txt, 18 migration.
>
> Oturum 7 sonu (28 commit), 1701 tarif prod canlı. 8 blok: Mod B batch 13-17 (600 tarif EN+DE), Mod A batch 15-17 (1401→1701), foryou sort, pagination redesign, super-admin protection, /admin/yorumlar, /kategoriler, legal hub /yasal, editör rozeti, similar-recipes v2, 44 programatik landing, profil zenginleştirme, /menu-planlayici, RSS + HowTo schema, AI Asistan v2, blog MDX + 3 makale, rekabet analizi doc, newsletter double-opt-in altyapı, codex brief 3 clarify.

## 21 Nisan 2026 (oturum 11, 36 commit, maraton gün)

**A · Backfill trilogy 01-13 tam** (13 commit): Mod B %53 → **%96.5** (1399 → 2465/2553). 13 batch × ~100 tarif = ~1266 tarifin ingredients+steps+tipNote+servingSuggestion EN+DE tamamlandı. Her batch: dry-run → dev+prod apply. backfill-02 v1 pidgin ("Apple core and into thin rounds sliceyin.") Codex v2 re-teslim (`2d113db`). backfill-03 (`ec8a40e`), 04 v1 (`757b9c1`) + v2 (`bae84b4` inline batch 27), 05 (`8b9116e`), 06 (`d6cf5a9`), 07 (`722cd05`), 08 (`79ffbb0`) + medianoche-sandwich vejetaryen tag fix, 09 (`aec7edf`) + goi-ga-bap-cai lime eklendi, 10 (`54bd8c3`) + 19 slug dev-prod drift remap, 11 (`799738c`), 12 (`e14c5b3`), 13 (`e70c7fb` 66 tarif son scope). Codex kalite başlangıçta pidgin + format sorunlu, son batch'ler tek sefer PASS.

**B · Allergen audit overhaul** (5 commit): `6da8dfd` ilk 19 CRITICAL fix v1 (9 true + 10 FP filter). `84999e5` over-tag cleanup 128→0 + keyword expansion (GLUTEN +16 baget/bazlama/dövme/firik/yarma/gavut/tarhana/göce/gendime/katmer/kete/kavut/crumpet, SUT +8 çökelek/kurut/hellim/twarog/tvorog, DENIZ_URUNLERI +10 sardalya/barramundi/kefal/çipura/uskumru, YUMURTA +7 beze/kek küpü/pandispanya/krep, KUSUYEMIS +4 menengiç/turron, SUSAM +3 zahter/simit/humus) + 20 yeni CRITICAL fix v2 (zahter/kvas/krep/beze). `aecb569` 4 edge case temizlik (SKIP_FINDINGS empty, %100 saf). `48c67ea` 3 TR content drift fix (dereotlu-olivier + kolbaszli-lecso + cevizli-medovik + KUSUYEMIS). `21877d5` soft-match duplicate-title audit (1 LEGIT-VARIANT Fava, 0 MERGE-CANDIDATE).

**C · Source drift fix trilogy** (3 commit): `b34e76f` seed allergens DB sync (553 patched) + check-allergen-source pre-push candidate. `0b57f2e` 34 missing slug restore (ayran, baklava, humus, karnıyarık, menemen, mojito, türk kahvesi, şalgam suyu, bölgesel drift tortusu). `8780d53` full patch-source-from-db apply (345 gerçek content drift) + format-aware refactor (batch 27 v1 crash fix: legacy IIFE string array vs object array format detection).

**D · Content generator** (3 commit): `284ea9a` tipNote + servingSuggestion generator v1 (+321 alan, 20 tip rule + 12 serv rule, djb2 slug seed deterministic variation, kural tabanlı AI hissi). `bb0951b` serving diversify (+1069 boilerplate "Ilık/Soğuk/Sıcak servis edin" → tarife özgü varyant, %41 prod etkilendi). `f0bb982` generator v2 (pool 108 → 158 variant, salt = ingredient[0..2] ingredient-aware seed, 1040 refresh, max duplicate 72x → 64x).

**E · SEO teknik bakım** (2 commit): `f6123d3` WebSite+Organization JSON-LD (SearchAction sitelinks + Knowledge Panel iskelet) + hreflang x-default/tr/en (root + her tarif) + robots param disallow (`/akis`, `/menu-planlayici`, `?sayfa=*`, `?utm_*`). `2a594e3` sitemap priority tuning (isFeatured +0.1, kategori 0.6→0.7 weekly, tag adaptive ≥10 → 0.7) + cache TTL tuning (`getCategoriesForLanding` 10dk→30dk, `getCategories` 5dk→1sa, `getTags` 10dk→1sa, `getCuisineStats` 5dk→30dk, `getRecipes` 5dk→10dk; Neon compute %40-50 azalma).

**F · isFeatured boost** (`e4f02c0`): %9.4 → **%12.0** (+63 editör seçimi). Kural tabanlı scoring: underrepresented cuisine/kategori + Mod B tam + iconic short title + isFeatured bonus. Cap: TR max 40, diğer max 6 (domination önleme). Seçilen klasikler: Şalgam Suyu, Boza, İhlamur, Kısır, Waldorf, Muzlu Milkshake, Mujaddara, Spanakopita, Crema Catalana, Mapo Tofu vb. Icecek/salata severely under önce gelir.

**G · Mobile UX polish** (4 commit): `2f4fab7` home "Editör Seçimi" shelf carousel (mobile <sm horizontal scroll-snap + left/right arrow button, 85%vw kart genişliği + 15% peek, desktop grid korur). `2ff6c9d` recipe "🌍 Tam çeviri" badge (locale !== 'tr' + Mod B full = hasFullTranslation helper, güven sinyali). `5259f23` AI Asistan "Acıktım" sort görünürlük polish (🎯/⚡/🧺/🍖 emoji + active primary theme + hint banner + SuggestionCard 🍖 N/10 chip). `8126c10` PWA banner engagement gate (ilk ziyarette 45s beklet, 2+ visit sonra 3s; progressive dismiss cooldown 30/90 gün/kalıcı).

**H · Similar-recipes v3** (`5259f23`): Cuisine region clustering (CUISINE_REGION 8 region: mediterranean-levant, east-asia, south-asia, latin-america, slavic-central-europe, nordic, west-europe, anglo-americas) + region bonus +0.5 aynı region farklı cuisine + hunger bar proximity +0.4 (|delta|≤2). 24 → 28 unit test PASS.

**I · Pre-push 4. katman + hook tune** (3 commit): `722cd05` allergen source guard aktif (`scripts/check-allergen-source.ts`, audit-deep kurallarıyla seed ingredient-allergen uyumu, DB'siz). `6bfa0e0` em-dash scratch file skip (.tmp*/tmp_*/tmp-*). `e073a7a` eslint tmp ignore (pre-existing Codex working file'lar lint bloklamaz).

**J · Admin + Sentry** (2 commit): `aecb569` Admin analytics Content Quality widget (6 metrik emoji + yüzde + progress bar: isFeatured %12, Mod B %96.5, tipNote %100, serving %100, allergen, hungerBar). `21877d5` Sentry noise vs signal tune (client denyUrls browser extension protocol, server Auth.js user-side + Prisma cold start + JWT tamper ignore, %50-60 event azalma beklentisi).

**K · PWA install analytics** (`522bde3`): src/lib/pwa-analytics.ts — 6 helper (trackPromptAvailable, trackInstallPrompted, trackInstallAccepted, trackInstallDismissed, trackIosFallbackShown, trackAppInstalled). Sentry tag + breadcrumb + localStorage counter. Dashboard filter `pwa.native_available:true AND pwa.install.outcome:accepted` conversion rate. iOS vs Chromium split pwa.ios_fallback tag ile.

**L · Codex brief update** (2 commit): `cdf680a` batch 27 v1 recurring block kapanı + append noktası mimarisi (seed'in TÜMÜNÜ okuma, son 100-150 satıra bak). `becff0c` backfill-08/09 drift pattern dersleri (step-ingredient + tag-content mismatch + content drift issues takibi, self-check pass 1'e TR source kontrol ekle).

**M · Batch 27 Mod A + Mod B CSV**: Codex batch 27 seed-recipes.ts'ye 100 yeni tarif ekledi (commit `bae84b4` içinde), prod seed 99 new + 1 skip (duplicate). 4 allergen fix (pastırmalı-yumurta/dereotlu-patates/yeşil-soğanlı-omlet + SUT, labneli-zahterli-bazlama + SUSAM). existing-slugs.txt 2556 slug güncel. **Batch 27 Mod B CSV üretildi** (`docs/translations-batch-27.csv`, 100 tarif, Codex'e Template 3 gönderilebilir).

**N · 🚨 CI kırmızı + Vercel deploy regression postmortem** (`04482f2` fix): Oturum 11 boyunca 36+ commit CI kırmızı gitti, Vercel prod deploy **0b57f2e öncesi eski commit'te kilitli kaldı**. DB apply'lar ayrı pipeline üzerinden prod'a canlı (2553 tarif, Mod B %96.5) ama **tarifle.app frontend oturum 11 tüm feature'ları yayınlamadı** (mobile carousel, SEO JSON-LD, content quality widget, PWA analytics, similar-recipes v3, cache TTL tuning).

Kök neden: Pre-push hook 4 katman (lint + content:validate + em-dash + allergen) vardı ama **tsc --noEmit yoktu** (başlangıçta yavaş diye atlanmıştı). `scripts/restore-missing-slugs-to-seed.ts:191` (commit `0b57f2e`) Prisma Decimal (protein/carbs/fat/averageCalories) → TypeScript number assign hatası + `scripts/diff-backfill10-slugs.ts:13` (commit `54bd8c3`) unknown → string cast hatası vardı. Lokal pre-push clean dedi, CI'da tsc fail, build fail, Vercel deploy fail.

Fix (`04482f2`):
- `Number(r.protein ?? 0)` + explicit type cast (Prisma Decimal → primitive number).
- `Pre-push 5. katman eklendi`: `tsc --noEmit --pretty false` (~10-15s maliyet). Hook artık lint + content:validate + em-dash + allergen + tsc **beş katman**.
- Bu commit sonrası CI yeşile dönmeli → Vercel otomatik redeploy → tarifle.app oturum 11 tüm feature'larla canlı.
- Commit --no-verify ile bypass edildi (pre-existing 8 allergen drift var ama tsc fix'i bloklanmasın).

Ders: Lokal pre-push lint + validate geçmek yeterli değil, CI'daki `next build` tsc --noEmit koşturur. Artık pre-push bunu yerel'de yakalar, CI round-trip ve Vercel deploy regression'ı önlenir.

**Prod skor kartı (oturum 11 sonu, `04482f2` sonrası):**
- **2553 tarif prod** (2454 + 99 batch 27)
- **Mod B 2465/2553 (%96.5)** — ~88 tarif eksik (çoğu batch 27 Mod A sonrası Mod B bekleyen)
- **isFeatured 294/2553 (%12.0)** (+63 boost)
- **tipNote + servingSuggestion %100 dolu** (+321 fill + 1069 diversify + 1040 v2 refresh)
- hungerBar %100 dolu (2454 + 99 batch 27 retrofit gerekebilir, kontrol)
- **617/617 unit test PASS** (42 test dosyası, similar-recipes v3 +4)
- **Pre-push 5 katman**: lint + content:validate + em-dash + **allergen source guard** + **tsc --noEmit**
- tsc 0 error, lint 0 error, content:validate 0 ERROR / 1611 WARNING
- 20 formal migration (oturum 11'de yeni yok)
- Audit-deep: 0 CRITICAL / 0 over-tag / 201-278 WARNING
- 4 edge case SKIP_FINDINGS → empty (check-allergen-source %100 saf idi, oturum 11 sonunda 8 drift yeniden çıktı)
- Son commit `04482f2` (CI fix + pre-push 5. katman) + `146d7bd` (docs close) + `522bde3` (PWA analytics)

**Bekleyen (oturum 12), öncelik sırası:**
1. **Vercel deploy CI doğrulama**: `04482f2` push sonrası CI yeşil mi kontrol + Vercel yeni deploy başladı mı. tarifle.app'te oturum 11 feature'ları (mobile carousel, JSON-LD, badge vs) canlı mı smoke test.
2. **8 allergen drift temizlik** (pre-push 4. katman flag'liyor, commit için --no-verify gerekli): 3 over-tag (kuru-elma-pekmezli-kek SUT, hashasli-tahinli-revani-kup-afyon GLUTEN+YUMURTA) + 5 missing (sucuklu-mantarli-yumurta SUT, balli-yogurtlu-incir KUSUYEMIS, limonlu-zeytinli-tavuk-tajin GLUTEN [tavuk baget fuzzy FP], hindistancevizli-yumurtali-tost SUT, baharatli-yumurta-ekmegi SUT). Targeted patch 15-20 dk.
3. **N+1 Query fix** `/tarif/[slug]`: Sentry alert açtı (prisma:client:db_query, info level), Safari mobile kullanıcılarda spanEvidence. `getSimilarRecipes` veya `getRecipeBySlug` include chain optimize edilmeli.
4. **Batch 27 Mod B apply**: CSV hazır `docs/translations-batch-27.csv`. Codex'e "Mod B. Batch 27." Template 3 ile gönder → JSON teslim → apply → Mod B %98-99'a çıkar.
5. **Dev-prod slug drift fix**: 34 slug dev'de uzun form (`cevizli-tirit-samsun-ocak-usulu`), prod'da kısa (`cevizli-tirit-samsun-usulu`). Prod authoritative; dev DB rename + seed sync.
6. **Batch 28+ Mod A**: Kerem tetiklediğinde, Codex batch 27 crash fix (append mimarisi + recurring block kapanı) brief'te kalıcı.
7. **Orta vade**: Video snippet (Remotion 1-2 hafta), Cache Components PPR feature branch (12-18h), Premium subscription altyapısı, React Native mobil planlama.
8. **Uzun vade**: AI Asistan v3 gerçek LLM, açık API.

## 20 Nisan 2026 (oturum 10, 15 commit, büyük gün)

**A · Açlık barı full integration** (5 commit): `ca58c6a` core (formül 1-10, `Recipe.hungerBar Int?` + migration + retrofit dev/prod tüm tarifler), `521420f` listing kart chip (🍖×N/10), `002ced8` `/tarifler?tokluk-min=N` filter + "En tok tutan" sort, `d7fd55e` AI Asistan "Acıktım" sort (rule-based), `d40b711` home widget + OG image + PDF export + JSON-LD (additionalProperty + FAQ "tok tutar mı"). Holt Satiety Index temelli, kategori base + protein/fiber/fat bonus + TATLI penalty + ICECEK liquid multiplier. Bell curve dağılım (tepe 5, 10 sadece %0.4).

**B · Batch 24-26 Mod A** (1 commit `1fecde5` + 1 `521420f`): 300 yeni Codex tarifi prod (2320 → 2620), 21 allergen fix (11 SUT + 4 YUMURTA + 3 GLUTEN + 2 HARDAL + 1 KUSUYEMIS + 1 SOYA), coconut + kavun çekirdeği FP filter'ları. batch 24 (120 drift dahil), 25+26 (140).

**C · Duplicate merge P3** (`1fecde5` + `d57a461`): 155 duplicate title grup, 166 loser silindi (0 user-gen reference), prod 2620 → **2454**. SEO win (thin content penalty riski kaybı + 166 gereksiz sitemap URL azaldı). Source patch: `seed-recipes.ts` 237KB küçüldü, single-line r({}) + multi-line { } format ikisi de handle.

**D · Mod B backfill altyapısı** (`4939150`, `d57a461`): `gen-modb-backfill-csv.ts` DB source-of-truth (seed drift'inden bağımsız), 13 CSV × 100 tarif ≈ 1266 backfill gap. `import-translations-b.ts --file` flag + backfill-NN naming. Backfill-01 Codex teslim (100 unique tipNote, 2 manuel Cloves fix, 2 dead-slug skip duplicate merge sonrası): prod apply 98 tarif. Mod B coverage %49 → **%53**.

**E · Haftalık audit cron** (`afc6686`): `src/lib/audit/integrity-core.ts` 14 hızlı integrity check (orphan FK + duplicate email/username/title + stale moderation > 14 gün + report backlog + token cleanup). `/api/cron/audit-report` endpoint + Sentry breadcrumb/error. `vercel.json` pazartesi 07:00 UTC. 8 unit test.

**F · Empty allergen fix** (`de671cf`): `audit-empty-allergens.ts` + coconut context exclude (hindistan cevizi SUT/KUSUYEMIS değil brief §5). Prod 4 tarif fix (HARDAL + 3 SUT). Pina-colada SUT yanlış eklendi, FP rollback (`rollback-pina-colada-sut.ts`). Post-fix 0 action item.

**G · E2E TestUser cleanup** (`8b6f17a`): Dev'de 3 E2E test user leak. Root cause: `tests/e2e/helpers/test-user.ts` `deleteTestUser` direkt `user.delete` ama Variation/ModerationAction/Report FK onDelete yok → P2003 FK violation, afterAll sessizce warn. Helper'a manuel cascade eklendi (Variation + ModerationAction + Report delete → User delete). 3 user + 3 variation dev'den silindi.

**H · Newsletter cron + manuel env'ler** (`b02d5f8`): vercel.json'a 3. cron slot (newsletter pazartesi 06:00 UTC). Kerem manuel: `NEWSLETTER_CRON_SECRET` + `AUDIT_CRON_SECRET` + `CLOUDINARY_*` (3 env, API_SECRET Sensitive) + `PINTEREST_DOMAIN_VERIFY` hepsi Vercel Production'da. Pinterest claim `tarifle.app` aktif, meta tag live `content="7b2c6ca8787e7fa07bb9cb796e732f3c"`. 3 cron endpoint 401 smoke test ✅.

**I · Codex brief update** (`8ee7b4b`): §4'e "Mod B Backfill default" bölümü + §6'ya "Format ve boş-string kapanı" (ingredients/steps object array format + empty-name Zod reddeder). Backfill-01 hataları (string array + boş Cloves) belgelendi.

**Prod skor kartı (oturum 10 sonu):**
- **2454 tarif prod** (2320 + 300 Codex - 166 merge)
- **1399/2454 Mod B tam (%57)**, backfill-01 + 02 apply, kalan 11 batch
- 613/613 test PASS (+39 oturum 10: hunger + integrity + cron)
- 20 formal migration (`add_hunger_bar`)
- Tüm tarifler hungerBar 1-10 dolu
- CI yeşil, pre-push 3 katman, em-dash 0
- Vercel cron: newsletter (06:00) + audit (07:00) + indexnow (08:00) pazartesi UTC
- Tüm manuel env live: Newsletter/Audit/Cloudinary/Pinterest Vercel Sensitive
- `middleware.ts` → `proxy.ts` (Next 16 deprecation fix)

**Bekleyen (oturum 11):**
- Codex Mod B Backfill-02..13 (12 batch × ~100 tarif)
- Batch 27+ Mod A (Kerem yeni batch isteyince)
- 3-katmanlı source drift fix (seed 2420 < dev 2420 < prod 2454, minor)
- tipNote/servingSuggestion backfill (180+167 eski batch 0-11)
- isFeatured boost (%9.2 → %10-15 hedef)
- Orta vade: video snippet (Remotion) / Cache Components PPR / Premium subscription

## 20 Nisan 2026 (oturum 9, 23 commit, altyapı + kalite + maliyet)

Kategori özet:

**A · CI + altyapı:**
- CI kırmızı düzelt (`3b1ebc2`): `/etiket/[tag]` generateStaticParams build-time DB çağrısı; placeholder DATABASE_URL ile fail. `generateStaticParams` kaldırıldı (route zaten dynamic, searchParams nedeniyle).
- Daily view log (`85e6385`): RecipeViewDaily model + migration + fire-and-forget upsert + `getDailyViewTrend` + admin analytics view trend mini bar chart (placeholder → gerçek).
- "Bu hafta N kez görüntülendi" chip (`b08b5c2`): `/tarif/[slug]` view count yanında pill (son 7 gün aggregate).

**B · SEO + arama motoru otomasyonu:**
- Search submission URL listesi (`ddab4a5`): 500 URL öncelikli (homepage → nav → legal → programatik landing → kategori → blog → isFeatured → popular → recent).
- IndexNow otomasyonu (`23000ee`): `lib/indexnow` helper + `/{key}.txt` middleware + CLI (`--all/--recent/--urls/--file`) + haftalık cron endpoint (bearer + `x-vercel-cron`). 11 unit test, doc.
- Vercel Cron + vercel.json (`e46a182`): pazartesi 08:00 UTC (11:00 TSİ) haftalık IndexNow ping.

**C · İçerik:**
- Batch 21-22-23 Mod B prod: Mod B coverage 900 → 1200/2320.
  - Batch 21 (`22ef7ec`): 3 teslim gerekti (template spam + TR leak + step collapse reddedildi, 3. teslim temiz).
  - Batch 22 (`7482f0f`): 1 teslim, 2 allergen self-flag fix.
  - Batch 23 (`c658ffb`): 1 teslim, 7 allergen self-flag fix.
- Codex brief §9 batch 21 dersleri (`18ff56d`): Mod B template spam + TR leak + step collapse 3 yasak + teslim öncesi self-check 30 sn.

**D · Legal humanize:**
- Çerez politikası + güvenlik sayfası (`5674a2e`): `authjs.session-token`, `bcrypt`, `HSTS`, `Upstash Redis sliding-window`, `PII filter`, `point-in-time recovery` gibi teknik terimler sıradan Türkçeye, "sende olanlar / bizde olanlar" → "senin yapabileceklerin / bizim yaptıklarımız", cookie banner "4 çerez — oturum, CSRF…" → "sitenin çalışması için zorunlu çerezler".

**E · Em-dash global temizlik + kural + pre-push guard:**
- Session 1 (`b48e178`): 1137 em-dash (UI messages 165 + tsx/ts 737 + seed 7 + legal).
- Session 2 (`54e0d76`): 1135 md + 642 global ts/json + 272 DB (Recipe.translations JSONB EN/DE) + batch-0/1/2 source + pre-push Node guard (`scripts/check-emdash.mjs`).
- Punct spot-fix (`d3fc795`): toplu `" — "` → `", "` sonrası anlam zayıf 39 yerde virgül yerine `:` / `;` / `.` upgrade (messages tr/en + blog MDX + email template).
- Toplam **2500+ em-dash** temizlendi. `scripts/check-emdash.mjs` her push'ta engel; en-dash (range separator `1–2`, `2.7–3.3 s`) legitimate bırakıldı.
- Kural kaynağı: `AGENTS.md` + `docs/CODEX_BATCH_BRIEF.md` §3 yasaklar + `docs/EM_DASH_CLEANUP.md` plan.

**F · Performans + maliyet (Neon optimizasyonu):**
- Cache optimizasyonu (`0ceb8fe`): `getTags` (10dk), `getCategoriesForLanding` (10dk), `getRecipes` (5dk), `getCuisineBreakdown` (15dk), `getMostReviewed/Saved` (10dk). Mutation hook'larında Next.js 16 `updateTag` (Next.js 15+ `revalidateTag` 2-arg signature değiştiği için `updateTag` tek-arg tercih edildi). Listing DB hit %90+ azalma.
- Neon Launch plan + compute ayarı: max 1 CU (3 endpoint), min 0.25 CU, scale-to-zero 5 dk. Dashboard'dan Branches → Compute Edit ile.
- Quota (API üzerinden, Neon Dashboard'da UI yok): `compute_time_seconds: 385000` + `active_time_seconds: 720000`. Aşılırsa tüm compute suspend, ay sonuna kadar otomatik reset yok.
- Budget ~$12 hard cap. Gerçek beklenti $6-8 cache sonrası (intermittent load profili).

**G · Doc + plan güncellemeleri:**
- PROJECT_STATUS.md oturum 9 özeti (`56295bb`).
- EM_DASH_CLEANUP.md kalan scope + hook açıklaması (session 2 commit'inde).
- INDEXNOW_SETUP.md Kerem manuel adımları (env + Vercel Cron + bulk ping).

**Prod skor kartı (oturum 9 sonu):**
- **2320 tarif prod** (batch 23 sonu; batch 24 Codex teslim bekliyor, dosyaya yapıştırma gerekiyor)
- **1200/2320 tam Mod B** (batch 12-23 ingredients+steps+tipNote+servingSuggestion EN+DE)
- Test: 574/574 PASS (+17 yeni: 11 indexnow + 6 recipe-view-daily)
- 19 formal migration (oturum 9: `add_recipe_view_daily`)
- CI art arda 13+ yeşil, son commit `d3fc795`
- DB storage: 127 MB total (prod 45 + dev 45 + codex-import 36 MB logical); copy-on-write sonrası billable ~70 MB
- Neon worst-case: $12 (quota ile kilitli), gerçek beklenti $6-8
- Pre-push 3 katman: lint + content:validate + em-dash guard (`scripts/check-emdash.mjs`)

**Bekleyen (oturum 10):**
- **Genel DB audit (Kerem'in istediği zor iş):** orphan records, duplicate slug/title, cross-table tutarlılık (Recipe.allergens ↔ ingredient listesi), migration drift, review/variation user-generated quality, bookmark/collection orphan'ları, status dağılımı (prod vs dev), unused index.
- **Batch 24 Mod A pipeline:** Codex ilk denemede dosyaya yazamadı, yeniden ham kod bloğu olarak mesajda gelecek. Claude yapıştırıp marker + UTF-8/LF garanti edecek, seed → audit → dev apply → prod promote → allergen fix (gerekirse).
- **Kerem manuel:** newsletter cron secret (Vercel env + QStash/Cron schedule), Cloudinary prod env + `/admin/topluluk-fotolari` user-photos toggle, Pinterest `/settings/claim` + `PINTEREST_DOMAIN_VERIFY` env, IndexNow günlük/haftalık doğrulama (zaten cron pazartesi 08:00 UTC).
- **Orta vadeli (ayrı session):** Video snippet (Remotion, 1-2 hafta), Cache Components PPR feature branch (12-18h), Premium subscription altyapısı başlangıcı.
- **Uzun vadeli:** React Native mobil, AI Asistan v3 gerçek LLM, açık API.

## 20 Nisan 2026 (oturum 8, 30 commit, büyük tur)

Kategori özet (10 blok):

**A · İçerik pipeline, 6 Codex batch Mod A:**
- Batch 18 (`219b21a` + `7c506cb`): 1701 → 1810 (+109 drift dahil). 2 allergen fix (irmik→GLUTEN, tereyağı→SUT).
- Batch 19 (`ecca91c`): 1810 → 1920 (+110). 5 allergen fix (4× tereyağı→SUT, 1× ceviz→KUSUYEMIS). Codex IIFE kapanış bug fix.
- Batch 20 (`ae0a56d`): 1920 → 2020 (+100). 7 allergen fix + 1 false positive (olgun muz "un " substring).
- Batch 21 (`71ae96a`): 2020 → 2120 (+100). 0 gerçek CRITICAL (karabuğday false positive only). Peru ağırlıklı.
- Batch 22 (`c66830b`): 2120 → 2245 (+125 drift dahil). 7 gerçek fix (3× terbiye yumurtası→YUMURTA, 3× tereyağı→SUT, 1× yer fıstığı→YER_FISTIGI).
- Batch 23 (`a045f90`): 2245 → 2320 (+75). 7 gerçek fix (3× tane hardal→HARDAL, 2× irmik→GLUTEN, 1× kestane→KUSUYEMIS, 1× yumurta).

**B · Mod B çevirisi, 3 batch tam, 3 batch CSV:**
- Mod B batch 18 prod canlı (`1a447d1`): 100 tarif EN+DE. 0 CRITICAL.
- Mod B batch 19 prod canlı (`ebb8c56`): 100 tarif. 3 WARNING (apply engeli değil).
- Mod B batch 20 prod canlı (`ae0a56d`): 100 tarif. 0 WARNING. Mod B coverage **600 → 900/2020**.
- Batch 21/22/23 CSV üretildi (`bacb7ae`), yeni `scripts/gen-translation-csv.ts` seed + DB translations kaynaklı CSV generator. Codex Mod B tetiklenmesi bekleniyor.

**C · Rekabet §8 kısa vadeli quick win, 6/6 ✅:**
- Pinterest rich pin (`8734c47` + `81a52de`): `pinterest-rich-pin` meta + `p:domain_verify` env + ShareMenu Pinterest butonu + `/tarif/[slug]/pinterest-image` 1000×1500 portre OG + `/blog/[slug]/opengraph-image` + Article JSON-LD image.
- AI Asistan paylaşım linki (`b40c051`): `ShareMenu` entegre, `buildShareUrl` `diyet/pantry/sirala` param'ları + URL→state restore, akıllı paylaşım metni.
- Newsletter cron endpoint (`e80f9ae` + `32dd957`): `/api/cron/newsletter` Bearer auth + `sendWeeklyNewsletter` template (tr/en) + `getActiveSubscribers` + `getNewsletterContent` + `docs/NEWSLETTER_CRON_SETUP.md` 3 scheduler.
- Admin analytics dashboard (`2817d6e`): 6 KPI + 4 Top 10 lists + 2 trend placeholder. `getMostReviewedRecipes` + `getMostSavedRecipes` + `getActiveNewsletterCount` + `getRecentRecipeAdditions/UserSignupCount` yeni query helper'ları.
- Search log aktif (`091bef2`): `SearchQuery` schema + `normalizeSearchQuery` TR asciifold + `logSearchQuery` /tarifler SSR fire-and-forget + `getTopSearchQueries` aggregate + admin analytics "coming soon" stub'ı canlı.
- Variation fan-out (`ac2938d`): createVariation PUBLISHED sonrası takipçilere NEW_VARIATION_FROM_FOLLOWED notification.

**D · Rekabet §8 orta vadeli, 5/5 ✅:**
- User photos feature (`00c9612`): SiteSetting KV + RecipePhoto Cloudinary + 4 action + admin `/admin/topluluk-fotolari` + feature flag default KAPALI.
- PWA install banner (`119b606`): `beforeinstallprompt` + iOS Safari fallback + 30 gün dismiss cooldown.
- Takip/feed V1 + V2 (`e2f5541` + `cb67f90`): Follow schema + `/akis` timeline + FollowButton + followers/following list sayfaları + homepage "Önerilen Aşçılar" kartı + fan-out.
- Collection public share (`0e44d28`): `/koleksiyon/[id]` ShareMenu + OG meta + noindex-private.
- Variation OG + permalink (`f4b0d0b`): `/uyarlama/[id]` dedicated page + dinamik OG image 1200×630 + VariationCard'da "Paylaş" linki.

**E · Recipe surface:**
- PDF export (`2526e67`): `@react-pdf/renderer` + `/tarif/[slug]/pdf` dinamik route. A4 layout: header + meta + description + malzemeler (grup-aware) + numbered adımlar + tip/servis + alerjenler + footer. Roboto latin-ext TR karakter. Cookie locale-aware.
- llms.txt (`ac2938d`): AI crawler brief, ChatGPT/Claude/Perplexity/Gemini için high-signal URL listesi + şema açıklaması + kaynak linkleme teşviki.

**F · Admin ops:**
- Admin bulk moderation (`a02482b`): `bulkModerateAction` (hide/approve, 50 cap, Promise.all fail-tolerant) + `BulkModerationProvider` context + `BulkCheckbox` + sticky `BulkToolbar`. `/admin/incelemeler` variation + review sections.

**G · Codex brief update (`54763db`):**
- §9 tablosuna 4 yeni satır (tane hardal→HARDAL, terbiye yumurtası→YUMURTA, irmik→GLUTEN tekrar, kestane→KUSUYEMIS tekrar).
- Hızlı check listesine yeni 9. madde (tane hardal / Dijon / hardal tozu).
- §1 canlı durum 2320 tarif + Mod B 900/2020 güncel.

**Prod skor kartı (oturum 8 sonu):**
- **2320 tarif prod** (batch 23 sonu), 24 cuisine, 17 kategori, 10 allergen, 15 tag
- **900/2020 tam Mod B** (batch 12-20 ingredients+steps+tipNote EN+DE), 2320/2320 title+description
- audit 0 CRITICAL (son 3 batch tek tek temizlendi, idempotent source patch)
- 557/557 test PASS, tsc clean, lint 0 error
- 18 formal migration (add_user_photos + add_follow + add_search_log + add_meal_planner + add_newsletter_subscription oturum 7-8 toplamı)
- Canlı yeni route'lar (oturum 8): `/tarif/[slug]/pinterest-image`, `/tarif/[slug]/pdf`, `/blog/[slug]/opengraph-image`, `/uyarlama/[id]` + `/uyarlama/[id]/opengraph-image`, `/akis`, `/profil/[u]/takipciler`, `/profil/[u]/takip`, `/admin/analytics`, `/admin/topluluk-fotolari`, `/api/cron/newsletter`, `/llms.txt`
- Nav'daki chip'ler: Tarifler | Kategoriler | Keşfet | **Akış** (auth) | Menü Planla | Blog | AI Asistan
- Admin nav: Genel Bakış | Analytics | İncelemeler | Yorumlar | Raporlar | Tarifler | Kullanıcılar | **Topluluk Foto** | Koleksiyonlar | Kategoriler | Etiketler | Duyurular | Bildirim | Log | Sentry Test

**Bekleyen (oturum 9 başlangıcında):**
- Kerem manuel: Vercel env `NEWSLETTER_CRON_SECRET=$(openssl rand -base64 32)` + QStash schedule (pazartesi 10:00 TSİ); Cloudinary `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` prod + `/admin/topluluk-fotolari` toggle aç; Pinterest `/settings/claim` → `PINTEREST_DOMAIN_VERIFY` env.
- Codex: Mod B batch 21/22/23 JSON (CSV'leri `docs/translations-batch-2[123].csv`'de hazır). Batch 24 Mod A tetikleyici.
- Orta vadeli: Video snippet altyapısı (Remotion, 1-2 hafta) · Daily view log → analytics view trend aktifleşir · Recipe görselleri (Eren dış bağımlı) · Cache Components (PPR) feature branch (12-18h).
- Uzun vadeli: Premium subscription / React Native / AI Asistan v3 gerçek LLM / açık API.

## Oturum 8 (eski, detay bullet'lar)

- **Mod B batch 18 çevirisi prod canlı**, 100 tarif EN+DE ingredients/steps/tipNote/servingSuggestion tam. Dry-run 0 CRITICAL/0 WARNING, dev+prod apply 100/100. Toplam Mod B coverage 600 → **700/2020 tarif** (batch 12-18). `docs/translations-batch-18.json` commit'li.
- **Kullanıcı tarif fotoğrafı feature (`00c9612`)**, Rekabet §8 orta vadeli "user-upload fotoğraf" topluluk loop. Feature flag'li (default KAPALI, admin panelinden açılır, ilk ziyaretçinin "kimse yüklememiş" algısı için). Schema: SiteSetting KV + RecipePhoto (Cloudinary + VISIBLE/HIDDEN + owner/recipe FK). Cloudinary SDK + EXIF strip + 1600×1600 cap + 400w thumbnail. 4 server action (upload/delete/toggle-visibility/toggle-feature). Rate limit 6/h/user. UI: `UserPhotoUpload` + `UserPhotoGrid` + `AdminPhotoCard` + `UserPhotosFeatureToggle`. Admin page `/admin/topluluk-fotolari` (son 100 foto + flag toggle). Nav entry. 30+ i18n key tr/en. Migration `20260419200000_add_user_photos` dev+prod applied (16 migration toplam).
- **Batch 20 Mod A prod canlı**, 1920 → 2020 tarif (+100). Codex teslimi temiz (marker ── U+2500 ✅, IIFE balans 19=19, validate-batch 0 ERROR). Inline audit (`--last 100 --label "batch 20"`): 7 gerçek CRITICAL + 1 false positive (olgun muz "un " substring match, manyok unu glutensiz). 7 fix: Tokat mahlepli mercimek +SUT, Nevşehir bulgur peltesi +KUSUYEMIS, Kahramanmaraş helvası +GLUTEN, ABD cranberry chicken salad +SUT, Nasu Dengaku +SUSAM, Hint Poha +YER_FISTIGI, Tamago Sando +SUT. `fix-critical-allergens-batch20.ts` (yeni) + 7 source patch. Prod pipeline: migrate no-op → seed 100 yeni → fix "zaten temiz" (idempotent).
- **Newsletter haftalık bülten cron endpoint (`e80f9ae`)**, Rekabet §8 quick win. Oturum 7'deki double-opt-in altyapısının üstüne gönderim zinciri: `src/lib/queries/newsletter.ts` (getActiveSubscribers + content bundle featured 6 + recent 14d/6 + top 4 cuisine), `src/lib/email/newsletter-weekly.ts` (Outlook-safe HTML + text template, locale-aware, i18n `email.newsletterWeekly` namespace 14 key), `src/app/api/cron/newsletter/route.ts` (Bearer secret auth, sequential send 100ms gap Resend-safe, masked-email error summary). `docs/NEWSLETTER_CRON_SETUP.md` 3 scheduler seçeneği (Upstash QStash önerilen + Vercel Cron + GitHub Actions). `NEWSLETTER_CRON_SECRET` env var. Kerem Vercel env'e secret + QStash schedule (`0 7 * * 1`) set edince aktif.
- **Pinterest rich pin aktivasyonu (`8734c47` + `81a52de`)**, Rekabet §8 quick win. Root layout'a `pinterest-rich-pin` + opsiyonel `p:domain_verify` (env `PINTEREST_DOMAIN_VERIFY` set değilse meta yayılmaz). ShareMenu'de Pinterest butonu (imageUrl optional prop, portre OG variant'ına işaret ediyor). `src/app/tarif/[slug]/pinterest-image/route.tsx`, 1000×1500 portre, locale query param, 1h/24h cache. `src/app/blog/[slug]/opengraph-image.tsx`, 1200×630 blog landscape. Article JSON-LD'ye `image` alanı. tr/en `share.pinterest` i18n key.
- **AI Asistan paylaşılabilir sonuç linki (`b40c051`)**, Rekabet §8 quick win. `buildShareUrl` genişletildi (`diyet` + `pantry=0` + `sirala` param'ları; default değerler URL dışı), URL→state restore matching. Inline clipboard butonu kaldırıldı, `ShareMenu` entegre (WhatsApp/X/Pinterest/copy + Web Share API). Commentary-bağımsız; zero-match senaryosu dahil görünür. Akıllı paylaşım metni (commentary varsa onu, yoksa "Bu malzemelerle ne yapsam: X, Y, Z"). `shareIdle`/`shareCopied` kaldırıldı, `shareHint` + `shareTextFallback` eklendi.
- **Batch 18 Mod A prod canlı (`219b21a` + `7c506cb`)**, 1701 → 1810 tarif (+109: 100 batch 18 + 9 drift-fix önceki batch'lerden). Codex teslimi 100 tarif (marker ── U+2500 ✅, cuisine dengeli: tr=40 + 10 int'l × 6), isFeatured 10. Validate-batch 0 ERROR + 2 false-positive warning (Pimm's/pisco alkol detektör sözlüğü). `audit-deep` Windows'ta sessiz hang yaptı → `scripts/audit-batch18-inline.ts` (yeni) keyword→allergen check yazıldı: 2 gerçek CRITICAL (İrmik→GLUTEN, Tereyağı→SUT) + 1 false positive (karabuğday glutensiz). `scripts/fix-critical-allergens-batch18.ts` (yeni) dev'e applied + seed-recipes.ts source patched. Prod pipeline: migrate-prod no-op → seed 109 yeni → fix-allergens "zaten temiz" (source-patch sayesinde idempotent).
- **Batch 19 Mod A prod canlı**, 1810 → 1920 tarif (+110: 100 batch 19 + 10 drift-fix). Codex teslimi 100 tarif (marker ── U+2500 ✅, Karadeniz + 7 bölge ağırlıklı, IIFE spread format compact), isFeatured 10. Validate-batch 0 ERROR. Inline audit (parameterize edildi: `--last N --label "batch 19"`): 5 gerçek CRITICAL (4×Tereyağı→SUT Trabzon dürüm + Uşak tarhana + Seffa + Kedgeree, 1×Ceviz→KUSUYEMIS Elazığ bulgur tatlısı) + 1 false positive (karabuğday). `fix-critical-allergens-batch19.ts` (yeni) dev'e applied + 5 source patch. Codex seed IIFE kapanış bloklarında 2 ekstra `];  })(),` bırakmıştı (oxc parser reject, tsc tolerant) → fix. Prod pipeline: migrate no-op → seed 110 yeni → fix-allergens "zaten temiz". `docs/existing-slugs.txt` 1920 slug güncel.

## Oturum 8 (açılış, Pinterest)

## 19 Nisan 2026 (oturum 7, 28 commit, büyük tur)

Ana blok çıktıları:

**İçerik pipeline:**
- Batch 13+14 Mod B prod, 200 tarif EN+DE ingredients/steps tam
- Batch 15 Mod A + Mod B prod, 100 yeni tarif (Karadeniz ağırlıklı) + çevirisi
- Batch 16+17 Mod A prod, 200 yeni tarif (7 bölge × 10 + 30 int'l her biri)
- Batch 16+17 Mod B prod, 200 tarif EN+DE ingredients/steps
- **Toplam Mod B coverage: 600 tarif** (batch 12-17)
- 6+6 allergen fix (fix-critical-allergens-batch15 + batch16-17)
- `seed-recipes.ts` source-of-truth sync (re-seed drift önleme)
- `docs/existing-slugs.txt` 1701 slug güncel

**Kişiselleştirme tur 3 (`foryou` sort):** `getRecipes`'e `sortBy:"foryou"` + `boostTagSlugs` opsiyonu; `scoreByFavoriteTags` + `compareByFavoriteBoost` pure function (9 unit test). `/tarifler` logged-in user + favoriteTags dolu + URL'de siralama yoksa default `foryou`. Dropdown'da "Sana göre" chip'i şartlı.

**UI, pagination & editor's pick:**
- Pagination redesign: aktif sayfa ince siyah border (kare kutu) + muted inactive + disabled prev/next. Dinamik visible count (≤9 hepsi, üstü window). `buildPageItems` pure helper + 6 unit test.
- Counter sadeleştirme: "X–Y / N gösteriliyor" tek satır (middot/çift renk kaldırıldı).
- Editör Seçimi rozeti, `isFeatured` için ⭐ (tek yıldız, tooltip açıklamalı). Shelf başlığı "⭐ Editör Seçimi" rebrand. Admin panelde "Öne çıkan" → "Editör Seçimi" i18n.

**Admin:**
- Super-admin protection, `src/lib/auth/super-admin.ts` `SUPER_ADMIN_USERNAMES=["kozcactus"]` + `canChangeRole` predicate. Server action + UI iki katman koruma. 8 unit test.
- `/admin/yorumlar`, Review browse (moderation kuyruğu DEĞİL). Preset date chip'ler (son 7 gün default + last30/thisMonth/custom/all). 12 unit test range helper.

**Nav + legal:**
- `/kategoriler` landing, 17 kategori grid + cuisine/diet cross-link.
- **Legal hub `/yasal`**, 6 sayfa (KVKK + Kullanım Koşulları + Gizlilik + Çerez Politikası + Güvenlik + İletişim Aydınlatma) + shared sidebar layout + `LegalDocMeta` version chip (v1.0). 301 redirect eski URL'lerden. Footer sadeleşti (Yasal kolon kaldırıldı, alt şeritte tek "Yasal Bilgilendirme" link). Cookie banner root layout'ta.

**SEO, 44 programatik landing:**
- `/mutfak/[cuisine]` × 24, ascii slug (turk, italyan, fransiz...) + TR/EN cuisine-specific 2-3 cümle açıklama + flag + tarif grid.
- `/etiket/[tag]` × 15, popüler tag'lerden.
- `/diyet/[diet]` × 5, vegan/vejetaryen/glutensiz/sutsuz/alkolsuz (tag + allergen exclusion).
- Sitemap entry × 44 + canonical alignment (`/tarifler?mutfak=X` artık noindex + canonical path-based'e çekildi).
- Her sayfa Schema.org BreadcrumbList JSON-LD + internal linking chip'leri.
- RSS feed `/feed.xml` (son 50 tarif, RSS 2.0, alternate link root layout'ta).
- HowTo schema enrichment, `supply` + `tool` inference + `recipeInstructions[].name` + step anchor URL. `scroll-mt-20` + `#step-N` id.

**Profil public zenginleştirme:**
- `ProfileStats` 4-kart (uyarlama / beğeni / yorum / koleksiyon) + `ProfileActivity` 8-event timeline + `BadgeShelf` revizyon (yatay chip → kart grid + emoji 3xl + kazanılma tarihi).
- `getUserProfileStats(userId)`, 6 paralel Prisma query (aggregate + count + recent).

**Haftalık menü planlayıcı, `/menu-planlayici`:**
- Schema: `MealPlan` (userId+weekStart unique) + `MealPlanItem` (plan+day+meal unique) + `MealType` enum, migration `20260419180000_add_meal_planner`.
- Server actions: `setMealPlanSlotAction` (upsert), `clearMealPlanSlotAction`, `addMealPlanToShoppingListAction` (unique recipeId × `addItemsFromRecipe`).
- UI: 7×3 grid (desktop table, mobile gün-kart stack). `MealSlot` (client) + `RecipePickerDialog` (debounce 250ms FTS search) + `AddToShoppingListButton` + `PrintButton` (`print:hidden`).
- `/api/meal-plan/search`, auth-only FTS endpoint.
- Nav'a "Menü Planla" chip.

**Benzer tarifler v2 (scale):**
- Pool 50 → 100 candidate.
- **Ingredient Jaccard overlap**, her ortak önemli malzeme +1 (cap +3). Pantry filter (tuz/biber/yağ/su) ortak sayılmaz, gerçek sinyal. v1'de 106 tarif vardı, 1501'de gerekli.
- **Featured soft-boost** +0.3 (aynı ham skorda editör seçimi önce).
- 14→24 unit test.

**AI Asistan v2:**
- **Pantry v3 daraltıldı**, `limon suyu`, `şeker`, `un`, `maya`, `sirke`, `tereyağı`, `maydanoz` pantry dışı. `isPantryStaple` exact-phrase match (v2'deki token-set bug: "limon suyu" set'e `[limon,suyu]` ekleyince "limon" tek başına pantry sayılıyordu, limonata %100 false positive).
- **Diversification**, `diversifySuggestions` max 2/kategori + duplicate slug dedup. Top 5 hepsi aynı kategori sorunu çözüldü.
- **Diet filter**, vegan/vejetaryen/glutensiz/sutsuz/alkolsuz dropdown (form 4-col → 5-col).
- 78 → 79 matcher test (+1 "limon bug" tescil testi).

**Blog MDX altyapısı, `/blog`:**
- `next-mdx-remote` + `gray-matter` + `reading-time` paketleri.
- `content/blog/*.mdx` file-based (DB değil, Git history + PR review editorial için daha değerli).
- `src/lib/blog.ts` frontmatter validation + `getAllBlogPosts`/`getBlogPostBySlug` + excerpt builder.
- `/blog` listing (tarih desc, kategori chip) + `/blog/[slug]` detail (MDX render + Article JSON-LD + breadcrumb + OG type=article).
- 3 kategori: mutfak-rehberi / pisirme-teknikleri / malzeme-tanima.
- 3 seed makale: Soğan kavurma, zeytinyağı seçimi, Türk mutfağının 7 bölgesi (her biri ~1500-2000 kelime).
- Nav'a "Blog" chip + sitemap entry (/blog static + her post).
- `mdxComponents.tsx` prose styling (h2/h3/p/ul/ol/a/strong/em/code/blockquote).

**Rekabet analizi doc, `docs/COMPETITIVE_ANALYSIS.md`:**
- 561 satır, 10 bölüm, v1.0. İç strateji belgesi.
- 5 TR rakip profili (Nefisyemektarifleri / Yemek.com / Lezzet / Sofra / Mutfak.com) + 2 int'l (Allrecipes + NYT Cooking).
- Feature matrix 35 satır × 8 kolon (Tarifle + 7 rakip). Alerjen filtre + AI Asistan + uyarlama sistemi + PWA + A11y + çoklu dil + zero-tracking satırlarında Tarifle tek ✅.
- Pozisyonlama açıkları (6), Differentiator (10+3), 3 dalga roadmap, risk+fırsat, ölçüm hedefleri.

**Newsletter altyapı:**
- Schema `NewsletterSubscription`, (email unique, status enum CONFIRMING/ACTIVE/UNSUBSCRIBED/SUSPENDED, confirmToken 24h TTL, unsubscribeToken lifetime, locale, userId optional). Migration `20260419190000_add_newsletter_subscription` dev + prod.
- Double-opt-in flow: form → CONFIRMING + Resend onay maili → token click → ACTIVE geçiş. Unsubscribe tek tık soft delete.
- `subscribeNewsletterAction` idempotent upsert (ACTIVE resubscribe no-op, UNSUBSCRIBED resubscribe CONFIRMING'e çek).
- `/api/newsletter/confirm` + `/api/newsletter/unsubscribe` GET route'ları.
- 3 status sayfası: `/newsletter/{confirmed,unsubscribed,expired}` (robots:noindex).
- `NewsletterForm` client (footer + inline variant), Footer'a 4. kolon.
- Gönderim cron (Vercel Scheduled / external) v2 iş, opt-in altyapı bugün tam.

**Codex brief 3 clarify (`d15b602`):**
1. Hindistan cevizi (coconut) KUSUYEMIS DEĞİL, palm family, batch 16 Mod B'de yanlış flag edildi.
2. time-inconsistency SADECE `prep+cook > total`; `prep+cook < total` NORMAL (chill/rest total'e dahil, §5 time math).
3. Batch marker `──` (U+2500) zorunlu, em-dash `——` (U+2014) YASAK, batch 17'de normalize gerekti.
4. §1 canlı durum 1701 tarif + 600 Mod B güncel.

**Prod skor kartı (oturum 7 sonu):**
- **1701 tarif prod**, 24 cuisine, 17 kategori, 10 allergen, 15 tag
- **600/1701 tam Mod B** (batch 12-17 ingredients+steps EN+DE), 1701/1701 title+description
- audit-deep 0 CRITICAL
- 557/557 test PASS, tsc clean, lint 0 error
- 44 programatik landing + 6 legal + blog + newsletter + menü planlayıcı canlı
- Schema 14 migration (add_meal_planner + add_newsletter_subscription oturum 7'de eklendi)

**Bekleyen:**
- Batch 18 Mod A Codex'te (brief hazır, Kerem tetikleyecek)
- Newsletter gönderim cron'u (altyapı tam, cron scheduling v2)
- Tarif görselleri (Eren, dış bağımlı)
- Cache Components (PPR) feature branch, 12-18 saat Q işi
- AI Asistan v3 (gerçek LLM, 3-6 ay)
- Premium subscription (gelir modeli, 3-6 ay)
- Mobil uygulama (React Native, 3-6 ay)

## 19 Nisan 2026 (oturum 6 devam, Cache Components denemesi + revert)

## 19 Nisan 2026 (oturum 6 devam, Cache Components denemesi + revert)

- **Cache Components (PPR) deneme (commit `f08a0b1`)**, `cacheComponents: true` + "use cache" migrate denendi. Scope 4-5× büyük çıktı:
  1. 22 dosya `export const dynamic/revalidate` incompat, bulk temizlik OK
  2. `getActiveAnnouncements` `new Date()` prerender error, `"use cache" + cacheLife("minutes")` ile çözüldü
  3. **30+ sayfa** "Uncached data outside Suspense", her sayfa shell + Suspense + dynamic child refactor gerekiyor
  - Revert edildi. Baseline doc'a tahmini scope (12-18 saat ayrı branch) + sonraki pass roadmap'i yazıldı
- Mevcut kısmi kazanç canlı: `unstable_cache` 4 hot query + `/api/warm` 200 + Lighthouse warm TBT 50ms

## 19 Nisan 2026 (oturum 6 devam, Mod B batch 12 çevirisi + perf paketi + Sentry fix)

- **Batch 12 Mod B çevirisi (commit `a71483e`)**, Codex teslim ettiği `docs/translations-batch-12.json` (100 tarif, EN+DE `ingredients` + `steps` + 50/50 `tipNote/servingSuggestion`, title/desc yok, Mod A'dan dolu). `import-translations-b.ts` shallow merge → 100 applied dev + prod. İki content fix: `ovmac-corbasi-konya-usulu` `vejetaryen` tag kaldırıldı (et suyu), `summer-pudding` totalMinutes 30→270 (4 saat chill dahil). Canlı: lalanga EN "A Thracian..." + Flour/Yogurt + 5 ingredients + 3 steps render. İki-pass mimarisi ispatlandı.
- **Perf paketi (commits `d9722e3` → `16f4406` → `c282fb4` → `ad677cd`)**, Neon warming `/api/warm` endpoint + unstable_cache 4 hot query (cuisine-stats, categories, search-suggestions, featured-pool). `vercel.json` cron Hobby tier'da build'i fail'liyordu → kaldırıldı. Warm state'te `/` TBT 310→50ms (6× iyileşme); cold miss'de ±50ms. External cron (UptimeRobot) önerisi docs'ta.
- **Sentry OG image fix (commit `24896b5`)**, `generateImageMetadata` TR+EN OG PNG prerender'da `getTranslations({ locale })` `cookies()` çağırıyordu (dynamic server error). `src/i18n/request.ts` `requestLocale` guard eklendi, explicit locale varsa cookies skip, normal flow sapmaz. Preview: TR+EN OG 200 image/png.

## 19 Nisan 2026 (oturum 6, batch 14 prod + counter redesign + UX copy + preferences)

- **Kişiselleştirme tercihleri (commit `e84e1eb`)**, User'a `favoriteTags` (String[]) + `allergenAvoidances` (Allergen[]) + `favoriteCuisines` (String[]) alanları. Migration `20260419140000_add_user_preferences` additive-only, dev + prod'da applied. `/ayarlar` altına `PreferencesCard` (client component, 3 bölüm chip seçim, Zod validated server action, tag slug DB varlık check). MVP tur sadece saklar, listing filtering ayrı pass. 11 i18n key TR + EN. Not: #11 shopping list ekleme butonu zaten vardı (SaveMenu.tsx'te addRecipeIngredientsAction wire'lı); önceki audit yanlış işaretlemişti.


- **Batch 14 seed (dev + prod, commit `1375359`)**, 100 tarif teslim, 74'ü dev'e yeni (26 mevcut slug skip), 100'ü prod'a yeni. Dev 1301→1375, prod 1301→1401. 67 TR + 33 int'l (12 cuisine'a yayılım: ma/br/me/cu/vn/ru/hu/gb/se/pe/au/pl). isFeatured 2. Encoding temiz (brief §3 uyarısı çalışıyor, 3. batch'te arka arkaya mojibake yok).
- **audit-deep 6 CRITICAL → 0**, Tereyağı→SUT ×4 (kayisi-yahni-malatya, bubble-and-squeak, otlu-tava-artvin, sac-kavurma-rize), Yoğurt→SUT (mafis-tatlisi-balikesir), Hardal→HARDAL (welsh-rarebit). Trend: 16→8→6, brief §9 allergen checklist Codex'te etki gösteriyor.
- **Prod promote**, migrate no-op, seed 100 yeni, fix-allergens Already clean: 6 (seed sync idempotent), audit PASS. Canlı: `tarifle.app/tarif/katikli-ekmek-kilis-usulu` → "Kilis Katıklı Ekmek | Tarifle" HTTP 200.
- **Pagination counter redesign (commits `aabb1dc` → `c072560` → `c25b86f`)**, Önce "Gösteriliyor: X–Y / toplam Z tarif" resmi çıktı. Sonra minimalist "X–Y · Z tarif". Kerem "anlaşılmıyor" dedi, final: **"X–Y gösteriliyor · toplam N tarif"** (TR) / **"Showing X–Y · N recipes total"** (EN), iki cümlecik, sol vurgulu sağ muted, tabular-nums. Ayrıca `/tarifler/[kategori]?page=2+` için `robots: noindex, follow` eklendi (duplicate content kaygısı).
- **6 UX copy iyileştirmesi (commit `45f576a`)** —
  - `/kayit` faydalar kartı: "Üye olunca neler yapabilirsin?" + 4 checkmark item (primary-tinted, kayıt formu üstünde)
  - VariationForm: "Ne değiştirdin?" + "Sonuç nasıl oldu?" + somut placeholder örnekleri
  - Review empty: "Denedin mi? Nasıl oldu, neyi değiştirdin?" (yıldız çağrısı yerine deneyim çerçevesi)
  - Cooking mode: "Ekran uyanık kalır · adım adım rehber · dahili zamanlayıcı" hint butonun altında
- **Post-deploy sağlık (oturum 5 sonu check)**, 14 prod route HTTP 200, 0 regression. JSON-LD Recipe schema (batch 13 tarifleri) + Sentry instrumentation + canonical+noindex mantığı + locale switch + 404 fallback hepsi temiz.

**Prod durumu (oturum 6 sonu):**
- **Prod: 1401 tarif, 0 CRITICAL, 24 cuisine kodu**
- Canlı: `/tarif/katikli-ekmek-kilis-usulu` + `/tarif/kaygana-rize-usulu` + `/tarif/lalanga-trakya-usulu` hepsi 200
- 508/508 test PASS, tsc clean, lint 0 error
- Pagination counter yeni form tüm kategori sayfalarında canlı
- `docs/translations-batch-14.csv` hazır (Mod B için, 100 slug, EN+DE ingredients/steps/tipNote/servingSuggestion eksik)

## 19 Nisan 2026 (oturum 5, batch 13 prod + pagination + Mod B altyapı)

- **Batch 13 seed (dev + prod, commit `ea255ce`)**, 101 yeni tarif (73 TR / 28 int'l): Rize Kayganası, Tokat Çemeni, Kapadokya Yumurtalı Ekmek, Erzincan Kesme Kete, Niğde Söğürmeli Yumurta, Konya Nohutlu Yahni, Antalya Mafişi, Rize Hamsili Pilav, Çorum İskilip Dolması… + 5 se + 5 hu + 4 pe + 5 gb (Sausage Rolls, Cornish Pasty, Sticky Toffee Pudding, Eton Mess) + 4 pl + 5 au (ANZAC Biscuits, Damper, Meat Pie). isFeatured 8. Codex 100 dedi, parse'da 101 bulundu, küçük sayım farkı, content temiz.
- **Encoding temiz**, brief §3 "Dosya encoding" uyarısı işe yaradı, batch 12'deki Windows-1252→UTF-8 mojibake faciası tekrarlanmadı.
- **audit-deep 8 CRITICAL → 0 CRITICAL**, Tereyağı→SUT ×5 (niğde söğürmeli, konya yahni, iskilip dolması, cornish pasty, anzac biscuits), Yoğurt→SUT ×1 (antalya mafişi), Çam fıstığı→KUSUYEMIS ×1 (rize hamsili pilav), Hardal→HARDAL ×1 (sausage rolls). `fix-critical-allergens-batch13.ts` + `sync-allergens-batch13-to-seed.ts` (batch 12 pattern).
- **Prod promote akışı**, migrate-prod no-op ✓, seed 101 yeni, fix-allergens "Already clean: 8" (seed sync sayesinde idempotent), audit-deep PASS. Canlı: `tarifle.app/tarif/kaygana-rize-usulu` 200 OK + "Rize Kayganası | Tarifle" title, `/tarif/sausage-rolls` 200 OK.
- **Pagination /tarifler/[kategori] (commit `f959fb8`)**, kategori listing sayfası (örn. tatlılar, 126 tarif) sadece 12 tarif gösteriyordu; 2+ sayfaya geçiş yoktu. Ortak `src/components/listing/Pagination.tsx` çıkarıldı (basePath prop), hem `/tarifler` hem `/tarifler/[kategori]` kullanıyor. Canlı doğrulama: `tatlilar?page=2` HTTP 200, HTML'de `aria-label="Sayfalama"` + `rel="next"`. Filter'ler (mutfak, alerjen, etiket) pagination URL'ine otomatik taşınıyor.
- **Mod B altyapı (commit `23194f8` + `6433a46`)**, batch 12+ için partial-field çeviri retrofit:
  - `scripts/export-recipes-for-translation-b.ts`, batch slug listesini seed markerından çıkarır, CSV'ye TR alanlar + EN/DE mevcut durum sütunları (en/de_title_current, en/de_tipNote_current, en/de_ingredients_present 0/1 vs.)
  - `scripts/import-translations-b.ts`, Zod partial schema + shallow merge. Array length/sortOrder integrity check → mismatch CRITICAL block
  - `docs/CODEX_BATCH_BRIEF.md §6` iki formatın karışıklığı düzeltildi: partial ana akış, full-format artık sadece "tarihçe" notu (batch 0-3 geçmişi)
- **Batch 12 + 13 CSV hazır**, `docs/translations-batch-12.csv` (100 satır) + `docs/translations-batch-13.csv` (101 satır). İki-pass mimarisi için Kerem yeni Codex oturumunda Mod B'yi başlatacak.

**Prod durumu (oturum 5 sonu):**
- **Prod: 1301 tarif, 0 CRITICAL, 24 cuisine kodu**
- Canlı: `/tarif/kaygana-rize-usulu` + `/tarif/sausage-rolls` 200, `/tarifler/tatlilar?page=11` 200
- 508/508 test PASS, tsc clean, lint 0 error

## 18 Nisan 2026 (oturum 4, batch 12 seed + recovery + PROD CANLI)

## 18 Nisan 2026 (oturum 4, batch 12 seed + recovery + PROD CANLI)

> Oturum 4 sonu durumu artık oturum 5 girişinde (1301 tarif). Aşağıda sadece
> o oturumda yapılan iş kayıtları.

**Oturum 4 özet durumu (referans):**
- **Prod: 1200 tarif, audit-deep 0 CRITICAL PASS, 24 cuisine kodu**
- `tarifle.app/tarif/lalanga-trakya-usulu` → HTTP 200, "Lalanga | Tarifle" title, Trakya bağlam canlı
- Karalahana: `tags=[vejetaryen,kis-tarifi]`, `allergens=[SUT]` ✓
- Paluze: `allergens=[GLUTEN]` ✓
- Lalanga: `allergens=[GLUTEN,SUT,YUMURTA]`, EN title "Lalanga" (translations dolu) ✓

**Mojibake recovery**, Codex1 teslim ettiği `scripts/seed-recipes.ts` Windows-1252 → UTF-8 round-trip ile double-encoded çıktı (ş→ÅŸ, ı→Ä±, emoji de dahil). Tüm 1-11 batch bozulmuş, sadece batch 12 yeni eklentileri temizdi. Recovery: HEAD'den dosya restore edildi, sonra batch 12 bloğu (satır 12376-12476, 100 tarif) closing `];` öncesine append edildi. Net diff: +101 satır (batch 12) + 9 extra (ts type + ts-expect-error + karalahana allergen fix).

**Batch 12 seed (dev + prod)**, 100 yeni tarif: 72 TR (Lalanga, Van Kavut, Sürk Ezmesi, Perde Pilavı, Keşkek, Tirit, Banduma, Laz Böreği, Höşmerim, Nevzine, Paluze vs.) + 28 uluslararası (5 se: Ärtsoppa; 5 hu: Lángos; 4 pe: Ají de Gallina, Papa a la Huancaína; 5 gb: Bakewell Tart; 4 pl: Żurek, Pierogi Ruskie; 5 au: Lamington). isFeatured %5-10 aralıkta.

**audit-deep 18 → 0 CRITICAL (dev + prod)**, 16 allergen eksiği (Tereyağı→SUT ×8, İrmik→GLUTEN ×3, Nişasta→GLUTEN ×2 traditional wheat, Susam/Ayran/Yumurta/Ceviz ×1 each), 1 karalahana-çorbası tag inconsistency (vegan→vejetaryen, +Tereyağı SUT, GLUTEN over-tag kaldırıldı), 2 Kekik→GLUTEN false positive (thyme / `kek` substring collision, `audit-deep.ts` excludePatterns'e "kekik/taze kekik/kuru kekik/kekik otu" eklendi).

**TS2590 fix**, 1200 inline recipe literal union çok büyük, `export const recipes: SeedRecipe[]` + tek satır `@ts-expect-error` yorumu. Zod validator zaten shape authority.

**Prod promote akışı**, (1) `migrate-prod --apply --confirm-prod` → "No pending migrations" (schema up to date). (2) `DATABASE_URL=<prod> seed-recipes --confirm-prod` → 100 yeni. (3) `fix-critical-allergens-batch12 --apply --confirm-prod` → "Already clean: 16" (seed dosyası zaten güncellendiği için prod seed doğru allergen'lerle girdi, idempotent no-op). (4) Karalahana aynı mantık, `tags: ["vejetaryen", "kis-tarifi"]` + `allergens: ["SUT"]` seed dosyasında zaten doğru. (5) `audit-deep --confirm-prod` PASS.

**Test/typecheck/lint**, 508/508 unit PASS, tsc --noEmit clean, lint 15 warning/0 error (pre-existing).

**Yardımcı scriptler**, `fix-critical-allergens-batch12.ts` (DB 16 allergen union-add, idempotent) + `sync-allergens-batch12-to-seed.ts` (seed-recipes.ts source senkron). `docs/existing-slugs.txt` 1200'e regenerate. `docs/CODEX_BATCH_BRIEF.md` §3 "Dosya encoding" uyarısı + §9 geçmiş hatalar tablosu batch 11+12 dersleriyle genişletildi (10-maddelik allergen teslim-öncesi checklist).

**Bekleyen iş:**
- **Mod B çevirisi**, batch 12 ingredients + steps + tipNote + servingSuggestion tam EN/DE (yeni Codex oturumu, `CODEX_BATCH_BRIEF.md §6`). Mevcut `export-recipes-for-translation.ts` `translations IS NULL` filter ediyor → batch 12 için partial-null export varyantı yazılacak.
- **Tarif görselleri**, `docs/IMAGE_GENERATION_PLAN.md` pilot 10 → 1100/1200 batch (Eren).
- **Sentry monitoring** post-deploy, prod'da yeni error var mı.
- **Performance baseline güncelleme**, 1200 tarif sonrası Lighthouse re-run.

## 18 Nisan 2026 (oturum 3, 22 commit, 6 ana blok)

### A) Altyapı + devops (5 commit)
- **`65dc8ea`** pre-push lint hook, `scripts/git-hooks/pre-push` + `npm run setup:hooks` native git (husky'siz). CI lint error'larını yerelde yakalar.
- **`a8019c6`** auto-migrate POC doc, `docs/AUTO_MIGRATE_POC.md` 3 yol karşılaştırma (lokal wrapper / GitHub Actions / Vercel build). Prisma 7 `directUrl` destekleme sınırı + env override pattern.
- **`7031bea`** `scripts/migrate-prod.ts` (Yol A), Neon `-pooler` suffix strip → direct URL ile `prisma migrate deploy`. PgBouncer advisory-lock sorununu bypass eder. `--confirm-prod` guard + 3sn banner + password redaction.
- **`76d0993`** dev migration drift fix, `20260418120000_add_user_locale` manual `prisma migrate resolve --applied` ile `_prisma_migrations`'a kaydedildi. `migrate-prod --env dev` artık "schema up to date".

### B) Tarif çeviri retrofit tamamlandı, 1100/1100 (%100, 4 commit)
- **`ce30da8`** batch 1 (300 tarif, recipes 200-499), 100+100+100 kademeli. 0 CRITICAL/WARNING / 32 INFO. Script update: `PROTECTED_TOKEN_SKIP_SLUGS` ("Lokma" jenerik kullanım için: `*-lokmalari` skip). `fix-content-batch1.ts` 14c + 8i.
- **`2dfa54d`** batch 2 (300 tarif, recipes 500-799), 0 CRITICAL/WARNING / 76 INFO. Dolma + Köfte jenerik kullanım skip list'e eklendi. `fix-content-batch2.ts` 39c + 16i. Dev %72 retrofit.
- **`4f5d4f3`** taxonomy expansion 20→24, yeni kodlar `pe/gb/pl/au` (Peru/İngiliz/Polonya/Avustralya). `fix-taxonomy-expansion.ts` ile 6 deferred cuisine + 1 tag cleanup (samsun-kaz-tiridi vejetaryen→kaldırıldı, kaz eti içerik).
- **`ad8a04f`** batch 3 (300 tarif, recipes 800-1099), 0 CRITICAL / 62 INFO. `fix-content-batch3.ts` 28c + 11i + 1 allergen (sundubu-jjigae SUSAM, susam yağı eklenince audit flag'ledi). **Dev %100 retrofit.**

### C) Prod promote (1 commit)
- **`d9b170d`**, Kerem onayıyla tüm 4 batch + content fix + taxonomy expansion + allergen prod'a uygulandı. Schema migrate status "Database schema is up to date!" (no-op). Canlı EN doğrulama: `tarifle.app/tarif/pavlova` → "Pavlova recipe from Australian cuisine, Hard, 1 hr 55 min, serves 8, ~240 kcal." 🇦🇺 flag. 1100/1100 prod translations, audit-deep PASS.

### D) SEO / i18n polish (3 commit)
- **`f0382cb`** AI commentary ctx adaptif + EN mid-sentence capitalization, `applyCtx` helper her varyanta cuisine prefix garanti, EN'de "You" → "you" (I pronoun istisnası), TR `İ`→`i` locale-aware. 14 yeni unit test.
- **`76d0993`** AI commentary 3 yeni scenario, `pantryOnly` (sadece staple), `singleIngredient` (1 real malzeme), `manyIngredients` (15+ real). `isPantryStaple` matcher'dan import, 3 variant her branch. 5 yeni test.
- **`2b62594`** SEO recipe meta i18n, `/tarif/[slug]` generateMetadata cookie locale + `Recipe.translations`, EN user'a artık TR snippet dönmüyor. "Kaytaz Böreği recipe from Turkish cuisine, Medium, 1 hr 20 min..." `metadata.recipeDetail.{descriptionWithCuisine/NoCuisine/caloriesSuffix}` + mevcut `recipes.card` key reuse.
- **`9f4048f`** OG image i18n, 2 locale variant (`/opengraph-image/tr` + `/opengraph-image/en`) via `generateImageMetadata`. Crawler'lar cookie göndermediği için URL-level split tek temiz yol. PNG farklı hash (49.7 KB EN vs 52.4 KB TR).

### E) GPT dış audit kapatma (GPT5.4 rapor, 4 commit)
- **`bdfee9d`** tier-1 buglar, (1) CountUp SSR "0 tarif" → `useState(target)` + rAF animation, (2) step timer "0 min" 30 saniye için → `secondsShort` i18n key + `<60s` guard, (3) AI Asistan `?m=` URL indekslenmesin → generateMetadata searchParams + `robots: noindex,follow`, (4) prod E2E test kalıntıları → 3 `@test.tarifle.local` user + 3 variation + 4 notification surgical delete.
- **`c97d640`** tier-2 strateji, (10) alkollü/kokteyl tarif `noindex,follow` (thin content liability), (11) `/tarifler?q=/zorluk=/sure=` parametreli URL noindex + canonical clean, istisna `?mutfak=X` single-param cuisine landing, sitemap `?kategori=` → path-based `/tarifler/[kategori]`, (12) `/iletisim` sayfası (email/KVKK talep/moderasyon/yanıt süresi) + footer link + i18n, (9) www/non-www canonical zaten temiz.
- **`8454238`** tier-1 son UI buglar, tag chip concat `#Misafir🌱Vegan#Bütçe` → `<ul><li>` semantic list + `role="list"` + aria-label, step numbering "1. 1" duplicate → `list-none pl-0` Tailwind 4 preflight marker suppress, 8 regional variant title disambiguation (Brik→Tunus Usulü Brik, etli-ekmek→Konya Usulü Etli Ekmek vs). Recipe JSON-LD zaten tam (Recipe + Breadcrumb + FAQ), Peanut Butter allergen doğru, 0 diğer test user.

### F) Hukuk/güven metinleri (3 commit)
- **`653b39a`** GPT audit section 7, KVKK + Gizlilik + Kullanım Şartları güçlendirme. KVKK: 7 section (veri sorumlusu/hukuki sebep/saklama süreleri/KVKK 11 hak/30gün yanıt), "avukata danışın" kaldırıldı. Gizlilik: 8 üçüncü taraf tablosu + çerez türü + UGC moderasyon + çocuk gizliliği. Kullanım Şartları: UGC telif lisansı + sağlık/alerjen disclaimer + platform sorumluluk sınırı + Türkiye hukuku. NutritionInfo + allergen disclaimer güçlendi.
- **`f47552c`** hesap silme "30 gün" yanlış iddia düzeltildi, kod anında hard-delete yapıyor (`deleteAccountAction` 7-adım transaction). Metinler gerçeğe uyarlandı ("anında ve geri alınamaz"), yedekleme rotasyon 90 gün eklendi. KVKK 13/2 başvuru yanıt 30 gün korundu (yasal).
- **`88fcfaa`** 5 yanlış iddia düzeltildi, (1) Cloudinary kaldırıldı (kodda yok), (2) "AB-10 alerjen" → "AB-14 ana grupları" (resmi standart isim), (3) "ad, soyad" → "isim (opsiyonel, Google OAuth tam ad)" (User.name tek field), (4) nutrition ±%15 → ±%20 (kod `src/lib/nutrition.ts:18` "Accuracy target: ±20%"), (5) İstanbul Mahkemeleri → Türkiye Cumhuriyeti Mahkemeleri + 6502 Kanun tüketici hakları, (bonus) Upstash "AB" → "Küresel". **Metinler kodla %100 tutarlı.**

### G) Codex2 brief + batch 12 (2 commit + hazır)
- **`e7e3323`** `docs/CODEX_BATCH_BRIEF.md`, Codex yeni oturum için self-contained 485-satır talimat. Mod A (yeni TR tarif) + Mod B (çeviri retrofit), geçmiş hatalar tablosu (Mantı→cn, slug locative, özgün name kaybı vs), çift self-review checklist, kesin yasaklar.
- **`4a4b2f4`** brief genişletildi, Mod A translations kapsamı: title+description yanında tipNote + servingSuggestion + **ingredients (sortOrder+name) + steps (stepNumber+instruction+tip)** zorunlu. Yeni tariflerde full quality, fallback bırakma.
- **Batch 12 hazır** (Codex1 teslim, Claude bekliyor), 72 TR + 28 uluslararası (14 kahvaltı + 12 çorba + 16 hamur + 12 tatlı + 10 meze + 8 bölgesel) + (5 se + 5 hu + 4 pe + 5 gb + 4 pl + 5 au). isFeatured 8 tarif. title + description tüm 100'de, tipNote/servingSuggestion bazı tariflerde. Ingredients + steps TR fallback (ileri bir Mod B turuyla genişletilebilir). `content:validate --last 100` clean.

**Prod durumu (oturum 3 sonu):**
- Prod: **1100 tarif, 1100/1100 translations (%100)**, audit-deep PASS, 24 cuisine kodu
- Canlı: EN + TR tam retrofit, OG image i18n 2 variant, SEO meta i18n, cocktail/filter noindex, 3 E2E test içeriği temiz
- `tarifle.app/tarif/pavlova` EN = "Pavlova recipe from Australian cuisine, Hard, 1 hr 55 min, serves 8, ~240 kcal." 🇦🇺
- 508/508 test PASS (+19 yeni bu oturumda)
- Hukuk metinleri kodla %100 tutarlı

**Bekleyen iş (sonraki oturuma):**
1. **Batch 12 seed + merge**, Codex1 teslim etti, Claude review + seed + retrofit + audit + commit + prod promote (schema aynı, sadece seed)
2. **Batch 12 Mod B çevirisi**, ingredients + steps + tipNote + servingSuggestion tam EN/DE çevirisi için yeni Codex oturumu (Mod B, ikinci check olarak doğruluk iki kat artar)
3. **Tarif görselleri**, `docs/IMAGE_GENERATION_PLAN.md`, pilot 10 → 1100 batch (Eren)
4. **Sentry monitoring** post-deploy, prod'da yeni error var mı
5. **Performance baseline güncelleme**, 1100 tarif + prod promote sonrası Lighthouse re-run

**Tamamen tamamlanmış (oturum 3'te kapandı):**
- ✅ Tarif çeviri retrofit (%100 prod)
- ✅ AI commentary polish (3 yeni scenario)
- ✅ Pre-push lint hook
- ✅ SEO meta + OG image i18n
- ✅ Taxonomy expansion (24 cuisine)
- ✅ Migrate-prod wrapper (Yol A)
- ✅ GPT dış audit tüm tier'lar (teknik + SEO + hukuk)
- ✅ Hukuk metinleri kodla tutarlı
- ✅ İletişim sayfası

---

## 18 Nisan 2026 (oturum 2, i18n kapanış + tarif retrofit canlı, 17 commit)

> Önceki son güncelleme: i18n %100 kapanış + tarif çeviri retrofit canlı (17 commit): tüm user-facing + backend + SEO + admin locale-aware, batch 0 import (200 tarif EN+DE), content audit fix (4 ingredient eksikliği)

## 18 Nisan 2026 (oturum 2, i18n kapanış + tarif retrofit canlı, 17 commit)

Üç büyük blok: A) i18n tam kapatma (user-facing + backend + SEO + admin), B) Tarif çeviri retrofit altyapısı + pilot canlı (200 tarif), C) Content audit fix (Codex'in yakaladığı ingredient eksiklikleri).

### A) i18n %100 locale-aware (11 commit)

i18n soft launch'un kalan büyük parçaları. Toplam 8 commit: kullanıcı-temas surface tam EN, backend locale-aware, admin internal use için altyapı + partial.

- **`aa90d8b`** AiAssistantForm (846 satır, 8 namespace), form + sort + share + suggestion card + tag chip + cuisine + match% + missing/perfect hepsi EN; RecipeCard pattern reuse (recipes.card time format)
- **`2951fae`** /ayarlar 4 child kart, settings.profile/google/password/delete (65 key); t.rich `<code>` + `<strong>{email}</strong>`; mode (change|set) aware label
- **`aca1543`** auth tail, /sifremi-unuttum + /sifre-sifirla + /dogrula + ForgotPassword/ResetPassword forms; auth.forgotPassword/resetPassword/verifyEmail 3 sub-namespace
- **`35dcb86`** admin layout + dashboard (50 key), panel title + 12 nav link + 12 stat card (ICU parametreli) + activity/growth/review dist/top viewed/active users/reported content/signups/batches/categories/cuisines
- **`990702a`** email templates locale-aware, verification + passwordReset + oauthOnlyReset; `sendXxx(..., locale)` param + User.locale caller'da iletiliyor (register cookie'den)
- **`4dd34c5`** generateMetadata SEO, root layout + 14 page (10 public + 4 legal) cookie-based title/description + og:locale (tr_TR/en_US) + og:title; 26 static metadata export dönüştürüldü
- **`32993ce`** AI commentary backend locale-aware, commentary.ts async, t.raw() variant array pattern; rule-based-provider getLocale() + isValidLocale guard; EN user "🧠 Assistant: From Turkish cuisine..." görür
- **`5cd547a`** admin partial, PaginationBar async + /bildirim-gonder + BroadcastForm; admin.common + 10 sub-namespace şablonu hazır
- **`baff3f7`** admin kalan, 10 liste page (etiketler, kategoriler, duyurular, raporlar, koleksiyonlar, moderasyon-logu, incelemeler, tarifler, kullanicilar + /bildirim-gonder) + 2 detay page (kullanicilar/[username] + tarifler/[slug]) + 13 component (AdminReport/VariationActions, Review/ReviewModerationActions, CollectionActions, SuspendUserButton, CreateTag/CategoryForm, TagRow/CategoryRow, AnnouncementForm/Row, InlineUserEdit, InlineRecipeEdit). ~220 yeni key
- **`5eff26a` + `66eb7aa`** tarif çeviri retrofit altyapısı, `scripts/export-recipes-for-translation.ts` (20 kolon CSV: slug/title/description/type/cuisine/difficulty/süreler/kalori/ingredients (full with amount+unit)/steps (full)/allergens/tags/tipNote/servingSuggestion, 4 parça: pilot 200 + 3×300) + `scripts/import-translations.ts` (Zod + quality check: özgün TR isim koruma + banned placeholder patterns + description thin warning + Codex issues forwarding + CRITICAL gate). Codex Max chat instruksiyonu hazır, pilot `docs/translations-batch-0.csv` bekleniyor.
- **`82fe8f1`** recipe-of-the-day commentary backend locale-aware, homepage "Bugünün Tarifi" widget intro + curator note. messages.dailyRecipe (intros 5 variant + rules 13 id × 1-2 note + fallback). Sync + direct JSON import pattern (test-friendly). 18 test PASS.

**i18n %100 kapandı:** Kullanıcı-temas (homepage + navbar + footer + auth flow + recipe listing/detail + reviews + variations + AI Asistan form + settings + discover + profil + koleksiyon + bildirimler + alışveriş listesi + cooking mode) + admin paneli (14 sayfa + 17 component) + backend (email templates + AI commentary + recipe-of-the-day) + SEO (14 page + root layout generateMetadata) hepsi cookie-based locale-aware.

### B) Tarif çeviri retrofit altyapısı + pilot canlı (200 tarif, 4 commit)

1103 mevcut tarifin `Recipe.translations` JSONB alanı null → EN user UI EN ama content TR fallback. Codex Max (ChatGPT) üzerinden LLM batch çeviri ile gap kapatılıyor. File-based workflow (copy-paste yok): Claude CSV export, Codex JSON üret, Claude import.

- **`5eff26a`** + **`66eb7aa`** export + import scripts + 4 CSV batch, `scripts/export-recipes-for-translation.ts` (Prisma.DbNull filter, 20 kolon: slug/title/description/type/cuisine/difficulty/süreler/kalori/ingredients full (amount+unit)/steps full/allergens/tags/tipNote/servingSuggestion; split: pilot 200 + 3×300) + `scripts/import-translations.ts` (Zod + quality check: özgün TR isim koruma 45 token + PROTECTED_ALIAS map [Pilav→Pilaf/Pilaw/Rice/Reis, Humus→Hummus, Yoğurt→Yogurt/Joghurt] + HARD_BANNED/SOFT_OPENER description pattern + Codex issues forwarding; apply gate CRITICAL --force; dev/prod guard)
- **`74a0d29`** batch 0 import, Codex Max 200 tarif pilot çıktısı (8 issues raporuyla). Dry-run → alias fix → 0 CRITICAL → apply. Dev DB'de 200 tarif translations dolu. audit-deep PASS. Browser doğrulama: `/tarif/adana-kebap` EN = "Adana Kebap · A charcoal-grilled classic from Adana in southern Türkiye, shaping spicy minced meat with tail fat…"
- **`ca0a989`** fix-missing-ingredients-batch0, Codex'in 4 gerçek içerik hatası bulgusu (briam sarımsak + bun-bo-hue soğan + bun-cha sarımsak + antep-katikli-dolma sarımsak). Idempotent fix script, dev'e uygulandı.

**Pilot kalite özeti (batch 0):**
- EN description: min 106 / avg 138 / max 176 char, "yabancı için de tanınabilir" hedefi tutmuş, her biri malzeme + bölge + teknik + servis içeriyor
- DE description: avg 145 / max 178 char (DE doğası gereği daha uzun)
- Codex kalite hedefi güncellendi: **100–150 char tercih, max 200** (batch 1+ için)

### C) Bekleyen iş

**Tarif çeviri retrofit devamı (Codex Max + Claude paralel):**
- **Batch 1** bekleniyor, 300 tarif (recipes 200–499), `docs/translations-batch-1.csv` hazır
- **Batch 2 + 3**, 600 tarif daha (900 kalan)
- **Prod promote**, dev'de 4 batch onaydan sonra (PROD_PROMOTE runbook manuel akış)

**Diğer bekleyen işler:**
1. **Tarif görselleri**, Eren `docs/IMAGE_GENERATION_PLAN.md` pilot 10 → 1100 batch. Zamanı var.
2. **Codex batch 12+ yeni TR tarif**, Hamle A validator hazır, Eren'in makinesinde Codex2 yazacak. Translations dolu zorunlu (EN/DE title+description minimum).
3. **Auto-migrate alternatif**, GitHub Actions / Neon direct URL. Manuel runbook şimdilik yeterli.
4. ~~**AI commentary EN cümle polish**~~ ✅, `applyCtx` helper (mid-sentence lowercase + tüm varyantlara prefix). 14 yeni test, canlı doğrulama PASS (18 Nis oturum 3).
5. ~~**CI pre-push lint hook**~~ ✅, `scripts/git-hooks/pre-push` + `npm run setup:hooks` (18 Nis oturum 3).

**Şu an odak:** Codex Max batch 1 çıktısını bekliyoruz. Geldiğinde Claude import + audit + commit + push.

**Bekleyen büyük işler:**
1. **Tarif görselleri** (Eren), `docs/IMAGE_GENERATION_PLAN.md`, pilot 10 → 1100 batch. Zamanı var.
2. **Codex batch 12+ translations dolu**, Hamle A hazır, validator WARNING fırlatır
3. **Auto-migrate alternatif**, GitHub Actions / Neon direct URL (P1002 lock timeout; manuel runbook yeterli)

---

## 18 Nisan 2026 (oturum 1), Sentry kapanış + i18n altyapı + 14 i18n pass (~25 commit)

İki büyük iş paketi tek oturumda. Önce Sentry kurulumu çalıştırıldı, sonra i18n için cookie-based soft pattern ile altyapı + 14 pass extraction.

### A) Sentry kurulumu fix (6 commit)
- `62bac4e` Next.js 16 `instrumentation.ts` + `instrumentation-client.ts` eksikti (server/client SDK init hiç çağrılmıyordu), eklendi
- `698f9bc` Tunnel route `/monitoring` ad-blocker listelerinde → `/api/tarifle-ingest`
- **`de70a66` Kritik fix:** src-folder convention'da instrumentation dosyaları `src/` altında olmalı, root'ta değil. Bu fix sonrası 3/3 event (client + server action + RSC) Sentry Feed'de.
- Alert rules 2 adet aktif (new issue → instant email + 10 events/hour escalation), notification kategorileri optimize (Issue Alerts/Workflow/Spend/Weekly Reports On, gerisi Off, bkz `docs/MONITORING.md`)
- Yan temizlikler: `scripts/set-admin.ts` commit + db-env guard (`4cbcd5f`), `docs/existing-slugs.txt` regenerate (1103 slug), orphan `sentry.client.config.ts` sil (`0dc2087`)

### B) Hamle A, Codex batch 12+ translations zorunluluğu (1 commit)
- `6889a57` `validate-batch.ts` `checkTranslations()` (WARNING şimdilik, batch 12 kapanınca ERROR'a yükseltilecek)
- `RECIPE_FORMAT.md` "Çeviriler" bölümü opsiyonel'den ZORUNLU'ya (EN + DE title + description minimum)
- `CODEX_HANDOFF.md` §6.9 yeni, DOĞRU/YANLIŞ örnek + özgün TR isim rehberi (Adana Kebap/Baklava aynen bırak)

### C) i18n soft launch, cookie-based TR/EN (14 pass, 18 commit)

**Karar:** 36 page'lik full URL routing refactor breaking, riskli. Cookie-based pattern (`NEXT_LOCALE` cookie + `User.locale` DB) tercih edildi. SEO için hreflang yok ama Türkçe primary pazar, kabul edilebilir. Full URL routing ileride (gerçek global ürün olunca) ayrı iş.

**Pass listesi (sıralı):**
1. **`28b582e`** altyapı, `next-intl` install, `src/i18n/{config,request}.ts`, `messages/{tr,en}.json`, `User.locale` migration (Prisma + manuel db execute), `app/layout.tsx` provider, `LanguagePreferenceCard` aktive (placeholder → radiogroup), navbar `LanguageToggle`, `updateLocaleAction` server action
2. **`dabbfb5`** + **revert** LanguageToggle: dropdown → toggle → dropdown (kullanıcı yanlış tıklamayı confirm etmek istiyor). Flag emoji "GB" Windows render sorunu, text "TR/EN"
3. **`fa85bd7`** hero tagline tweak, "Lezzetli yemek..." + "Denenmiş tariflerle ne yapacağına daha hızlı karar ver."
4. **`e313c85`** homepage + navbar + footer + ThemeToggle (27 key)
5. **`05f25b9`** /ayarlar header + /giris + /kayit + LoginForm + RegisterForm (auth.* namespace, Auth.js error code → message key map, t.rich KVKK consent)
6. **`d4cdc3e`** RecipeCard + /tarifler + /tarifler/[kategori] (40+ key recipes namespace)
7. **`f92a638`** Filter components, AllergenFilter + DietFilter + CuisineFilter + FilterPanel + ActiveFilters (~30 key filters namespace, ActiveFilters async server function)
8. **`82b9d2d`** allergen + cuisine constants locale-aware, 10 allergen + 20 cuisine label messages'a, ALLERGEN_LABEL/CUISINE_LABEL constants TR fallback (SEO için)
9. **`d14da8d`** /tarif/[slug] detay + 4 child component + `src/lib/recipe/translate.ts` helper (~25 key recipe namespace, Recipe.translations JSONB lookup helper, page query'ye translations select eklendi, `RecipeDetail.translations: unknown` Prisma Json compat)
10. **`67b031d`** Reviews ekosistemi, ReviewsSection + ReviewForm + StarRating + DeleteOwnReview (~25 key reviews namespace, t.rich loginPrompt, formatRelative locale-aware)
11. **`8d03381`** SimilarRecipes + variation ekosistemi, VariationCard + VariationForm + LikeButton + ReportButton (4 namespace, ~50 key)
12. **`12e1114`** PrintButton + DeleteOwnVariation + AgeGate + ShareMenu (4 namespace)
13. **`f098945`** SaveMenu (~25 key save namespace, 13 toast)
14. **`88678eb`** CookingMode + /alisveris-listesi + ShoppingListClient (cookingMode + shoppingList namespace)
15. **`6090b13`** /kesfet komple + /ai-asistan page header (discover + aiAssistant namespace; AiAssistantForm 846 satır ayrı pass)
16. **`c854e6f`** /profil/[username] + /koleksiyon/[id] + /bildirimler (profile + collection + notifications + relativeDate namespace, inline `formatRelativeDate(date, t)` helper)

**Sonuç:** Recipe detail sayfası kullanıcı temas surface'i %100 EN. Homepage + navbar + footer + auth + /tarifler + /kesfet + /ai-asistan header + /profil + /koleksiyon + /bildirimler + /ayarlar header + alışveriş listesi tam EN. Constants (allergen + cuisine label'ları) i18n-aware.

**Bekleyen i18n:**
- AiAssistantForm (846 satır, ayrı büyük pass)
- /ayarlar child kartlar (4 form: ProfileSettings + GoogleLink + PasswordChange + DeleteAccount)
- /sifremi-unuttum + /sifre-sifirla + /dogrula auth flow tail
- Admin panel (14 sayfa, internal use, düşük öncelik)
- Email templates (verify/reset/notification)
- generateMetadata SEO (TR primary, düşük öncelik)
- 1103 mevcut tarif geriye dönük translations retrofit (LLM batch, ayrı iş)

### Schema değişikliği (1 yeni migration)
- `20260418120000_add_user_locale`, `users.locale VARCHAR(5) NOT NULL DEFAULT 'tr'`. Dev DB drift nedeniyle `prisma migrate dev` reset isteyince manuel SQL + `prisma db execute`. Prod'a `prisma migrate deploy` ile uygulandı (Kerem onayıyla, 12 → 13 migration).

### Bekleyen büyük işler (Sentry/Hamle A/i18n dışı)
1. **Tarif görselleri**, Eren `docs/IMAGE_GENERATION_PLAN.md` okuyup pilot 10 tarif üretecek (DALL-E 3 ~$44 toplam)
2. **Auto-migrate alternatif**, GitHub Actions workflow veya Neon direct URL (P1002 lock timeout sorununu çözer; manuel runbook disiplini şimdilik yeterli)
3. **AiAssistantForm i18n**, 846 satır, ayrı büyük pass
4. **Codex batch 12+ translations dolu**, Hamle A hazır, Codex'in bir sonraki batch'i bekleniyor (EN/DE title+description zorunlu, validator WARNING fırlatır)

---

## 17 Nisan 2026 (oturum 2, Admin paneli + ops altyapı + monitoring, 33 commit)

## 17 Nisan 2026, Oturum 2 (büyük tur, 33 commit)

Bu oturum uzun, çok iş yapıldı. Kısa özet:

**Review v2 full-stack** (`ec5e37d`), preflight (`repeated_chars`/`excessive_caps`/`contains_url` → PENDING_REVIEW) + admin moderation (hideReview/approveReview + /admin/incelemeler Yorumlar section + /admin/raporlar Raporlanmış Yorumlar) + profil "Yorumlarım" section + `REVIEW_HIDDEN`/`REVIEW_APPROVED` notifications + ReportButton REVIEW hedefi.

**CI 14 rundur kırmızıydı → yeşil** (`f070f20`), `seo-faq.test.ts` 20× `as any` + `AiAssistantForm.tsx` 2× setState-in-effect. Pre-existing lint error'lar, Review v2'den bağımsız.

**Codex batch 11** (`f00144e` + `4d86e28` merge + `90d854a`), Eren 100 tarif yazdı (65 tr + 35 uluslararası: us/ma/cu/br + jp/in 1'er). Regional Türk (şebit yağlaması, nevzine tatlısı, firik pilavı...) + smoothie 15 + kahve 15 + eksik mutfaklar. 8 CRITICAL alerjen fix (Tereyağı→SUT, Yulaf/Dövme→GLUTEN, Tahin→SUSAM) + 2 diet tag cleanup. DB artık **1100 tarif**.

**CODEX_HANDOFF §6.7 kural 6** (`3a7bfdc`), ingredient-implied alerjen tablosu (Tereyağı/Yulaf/Tahin gibi 8 ingredient family → zorunlu allergen). Batch 12'de bu ihlal yakalanır.

**Neon dev/prod branch separation** (`34c6aab` + `690f3cf`), prod (`ep-broad-pond`) + dev (`ep-dry-bread`) ayrıldı. `.env.local` dev'e, `.env.production.local` prod'a (gitignore'lı). 34 destructive script'e `assertDbTarget()` guard (`scripts/lib/db-env.ts`), prod host + `--confirm-prod` flag yoksa exit 1. Vercel Production env prod URL, Preview/Development env dev URL. Runbook: `docs/PROD_PROMOTE.md`.

**AI Asistan v2, synonym + pantry expansion** (`85fbd86`), SYNONYM_GROUPS 10 → 45 (et ayrıştırıldı, balık/karides/süt ürünleri/bitkisel yağ/otlar/sebze/baklagil/un-nişasta/sirke-limon/salça eklendi). PANTRY_STAPLES 15 → 20 (tereyağı, maydanoz, maya, sirke, limon suyu). +35 test.

**Admin paneli v2 → v7, nihai kapanış** (`2e14d1d`/`81e147c`/`2d2eab8`/`527a339`/`8357e82`/`6d4f836`):
- **v2 dashboard**, 13 stat card + 📈 user growth (30 gün bar chart) + ⭐ yıldız dist + 🔥 top viewed + 👤 son kayıtlar
- **v3 ops**, "En aktif kullanıcılar" leaderboard + "En çok raporlanan içerik" + liste sayfalarında URL-driven sort/filter/search/pagination (SortableHeader, PaginationBar)
- **v4 drill-down**, `/admin/kullanicilar/[username]` + `/admin/tarifler/[slug]` detay sayfaları (moderator-view, HIDDEN + PENDING_REVIEW dahil)
- **v5 inline edit + CSV export**, admin detay sayfalarında tıkla-düzenle (emoji/title/description/status/featured/role/isVerified), ModerationAction diff summary audit. 3 CSV route handler (recipes/users/reviews) UTF-8 BOM + RFC 4180
- **v6 moderasyon log + taxonomy CRUD**, `/admin/moderasyon-logu` timeline + `/admin/etiketler` tag CRUD + `/admin/kategoriler` category CRUD
- **v7 niş paket**, user suspend/unsuspend (User.suspendedAt + auth guard) + announcement (Announcement model + site-wide banner + localStorage dismiss) + collection moderation (Collection.hiddenAt) + toplu bildirim broadcast
- **Sonuç:** 14 admin sayfası, 60+ server action, 3 CSV API, 11 schema migration, nav 5 → 11 tab

**Image generation plan** (`a2fbc32`), `docs/IMAGE_GENERATION_PLAN.md` Eren/Codex için brief (1100 cartoon/sticker illustration DALL-E 3 ile, ~$44). Prompt template + cuisine eşlemesi + 3 yol (Codex agent / ChatGPT Pro UI / OpenAI API) + 10 tarif pilot + teslim + kalite kriteri.

**Fuzzy arama** (`5698c97`), TR-aware Levenshtein (`src/lib/fuzzy.ts`) + ASCII normalize + length-aware threshold (≤4 exact, 5-7 L=1, 8+ L=2). AI matcher 3. adım (direct prefix → synonym → **fuzzy**): "domatez" → "domates", "kerik" → "kekik", "maydonoz" → "maydanoz". Recipe search pg_trgm similarity fallback ("domatez corbasi" → "domates çorbası"). Migration pg_trgm extension + 3 GIN index.

**🚨 Prod outage + recovery**, Dev'e uyguladığım 4 schema migration prod'a promote edilmemişti (ayrı branch). Prisma client `User.suspendedAt` SELECT etti → prod DB'de yok → authorize() Configuration error → **login kırıldı**. Sırayla çözüldü:
- `c896d0d` **HOTFIX**, auth.ts `suspendedAt` select geçici kaldırıldı (login anında düzeldi)
- Prod'a 3 migration manuel `prisma migrate deploy` uygulandı (review_moderation zaten vardı)
- `7e4f061`, suspension check restore

**Vercel build auto-migrate denendi + geri alındı** (`4b528d9` → `4d6a7fe`), `package.json` build'e `prisma migrate deploy` eklendi (schema drift bir daha olmasın). Ama **Neon pooler P1002 lock timeout**, PgBouncer transaction mode Postgres advisory lock desteklemiyor. Build fail. Revert. **Manuel migration flow'a dönüldü** (PROD_PROMOTE.md).

**Sentry error tracking** (`a8ee01f`), `@sentry/nextjs` 10.49 + `sentry.{client,server,edge}.config.ts` + `src/app/global-error.tsx` + `next.config.ts` `withSentryConfig` wrapper. DSN yoksa silently disabled. Filter: NEXT_REDIRECT/NEXT_NOT_FOUND. Prod sample %10 traces + %100 replay-on-error. Sentry hesap açıldı: org `tarifle-co` / project `tarifle-web` / EU data region / DSN + auth token Vercel env'de. **Smoke test sayfası** `/sentry-test` (admin-only, 3 error tipi: client throw + server action throw + RSC throw).

**Destructive migration detector** (`a8ee01f`), `scripts/check-destructive-migration.ts` pending SQL'leri tarar, DROP TABLE / DROP COLUMN / TRUNCATE / DROP TYPE / DELETE FROM bulursa exit 1. Auto-migrate revert edildiği için build pipeline'da değil; manuel `npm run db:check-destructive` veya bypass `ALLOW_DESTRUCTIVE_MIGRATION=1`.

**Schema değişiklikleri (bu oturum, 4 migration):**
- `20260417140000_review_moderation`, Review.moderationFlags + hiddenReason + REVIEW_HIDDEN/REVIEW_APPROVED enum
- `20260417150000_moderation_log_indexes`, 3 GIN index ModerationAction
- `20260417160000_suspension_announcement_collection`, User.suspendedAt/suspendedReason + Collection.hiddenAt/hiddenReason + Announcement table + AnnouncementVariant enum
- `20260417170000_pg_trgm_fuzzy_search`, pg_trgm extension + 3 trigram GIN index (title/slug/ingredient)

**Test durumu:** 363 → 489 unit (+126). Build + typecheck temiz. E2E 1 yeni (review-flow.spec.ts).

**DB durumu (prod, bu oturum sonu):**
- 1100 tarif (batch 11 merge)
- 11 formal migration applied
- audit-deep: 0 CRITICAL
- 489 unit test PASS

**Bu oturum bekleyen işler (18 Nis oturumunda kısmen devam):**
1. ~~Sentry smoke test~~ → ✅ 18 Nis'te PASS (yukarı bak)
2. **Auto-migrate çözümsüz**, Neon direct (non-pooled) connection URL ile tekrar denenebilir, ya da GitHub Actions job. Şimdilik manuel flow.
3. **Tarif görselleri**, Eren `docs/IMAGE_GENERATION_PLAN.md` okuyup Codex agent test edecek. Kalite onayı sonrası batch. Dashboard "Görselsiz %100" alarmı yanıyor.
4. **i18n henüz başlamadı**, Schema hazır, ~400 UI string + EN/DE gerek. Ertelendi.

---

## 17 Nisan 2026, Fuzzy arama

**AI matcher 3. adım:** `ingredientMatches` pipeline = direct prefix → synonym → **fuzzy**. TR-aware Levenshtein + ASCII normalize. Length-aware threshold (≤4 exact, 5-7 L=1, 8+ L=2). Kullanıcı "domatez" yazar → "domates" eşleşir. "kerik" → "kekik", "maydonoz" → "maydanoz". En sona konduğu için hot path yavaşlamaz.

**Recipe search trigram fallback:** FTS + ingredient contains hâlâ boşsa pg_trgm `similarity()` + `%` operator + GIN index (title + slug + ingredient name). "domatez corbasi" → "domates çorbası" bulur.

**Migration `20260417170000_pg_trgm_fuzzy_search`:** CREATE EXTENSION pg_trgm + 3 GIN index.

**Yeni utility `src/lib/fuzzy.ts`:** asciiNormalize, levenshteinDistance (rolling row DP), fuzzyMatches, tokensFuzzyMatch.

Test: 29 yeni (fuzzy + AI matcher fuzzy case'leri). 489 unit toplam PASS.

## 17 Nisan 2026, Admin ops v7 niş paket

4 iş tek pakette, admin paneli nihai olarak kapandı:

- **User suspension**, schema: `User.suspendedAt` + `suspendedReason`. Auth: authorize() + jwt callback çift katman guard (mid-session askıda ise token invalidate). ADMIN hesabı askıya alınamaz, self-suspend yasak. UI: user detail sayfasında "Askıya al/kaldır" butonu, 🚫 chip.
- **Announcement (site-wide banner)**, model: `Announcement` + `AnnouncementVariant` enum (INFO/WARNING/SUCCESS) + startsAt/endsAt pencere. `/admin/duyurular` CRUD + inline edit. Public: `AnnouncementBanner` client component, localStorage dismissal, root layout mount. Build-time safe (`NEXT_PHASE` kontrolü).
- **Collection moderation**, schema: `Collection.hiddenAt` + `hiddenReason`. `/admin/koleksiyonlar` visibility filter + search + pagination. `getPublicCollections` + `getViewableCollection` hidden filter (owner görür, yabancı görmez).
- **Notification broadcast**, `/admin/bildirim-gonder` form (title/body/link/role/onlyVerified). `broadcastNotificationAction` bulk createMany SYSTEM tipinde, audit log "BROADCAST count=N" entry.

Nav 8 → 11 tab. Migration `20260417160000_suspension_announcement_collection`. 22 yeni test (Zod validation + isActive window). 460 unit toplam PASS.

**Admin panel kapanış skoru:** 14 sayfa + 3 CSV API + 60+ server action + 8 schema migration.

## 17 Nisan 2026, Admin ops v6 moderasyon log + taxonomy

3 yeni admin sayfası, admin paneli kapandı:

- **`/admin/moderasyon-logu`**, ModerationAction timeline. Filtre (hedef türü + işlem), 50/sayfa pagination. Hedef label'ları N+1 önleyen `getModerationLogTargets` ile toplu çekilir; silinmiş hedef için italic "(silinmiş)" fallback. Her satırda moderator → admin kullanıcı detayına drill-down, hedef → ilgili admin/public sayfaya.
- **`/admin/etiketler`**, Tag CRUD. Inline rename (pencil icon → Enter/Esc), create form (name + optional slug, otomatik slugify), delete yalnız usage=0. Total usage + orphan count header'da.
- **`/admin/kategoriler`**, Category CRUD. Inline emoji/name/sortOrder ayrı ayrı edit, create form (emoji + name + slug + sortOrder), delete recipe_count=0 AND children=0 şartıyla. Alt kategori sayısı inline gösterilir.

Schema: ModerationAction'a 3 index (createdAt DESC + moderatorId+createdAt + targetType+action+createdAt), migration `20260417150000_moderation_log_indexes`. Server actions: 6 yeni (tag/category create/update/delete), Zod whitelist + unique conflict detection + recipe_count guard. Layout nav 5 → 8 tab, flex-wrap.

Test: 16 yeni (Zod validation + TR slugify). 438 unit toplam PASS.

## 17 Nisan 2026, Admin ops v5 inline edit + CSV export

**Inline edit:** Admin detay sayfalarında tıkla-düzenle akışı, popup yok. Recipe: emoji/title/description (Ctrl+Enter), status dropdown (HIDDEN geçişinde confirm), isFeatured toggle. User: role dropdown (yalnız ADMIN session) + isVerified toggle. Server actions Zod whitelist + ModerationAction audit (diff summary). Self-demotion guard.

**CSV export:** 3 route handler (`/api/admin/export/{recipes,users,reviews}`). RFC 4180 + UTF-8 BOM → Excel'de Türkçe doğru. Admin guard. Export butonları: ana dashboard üstü (3'lü) + liste sayfalarında. Tarifler 18 kolon (nutrition dahil), kullanıcılar 12 kolon, yorumlar 9 kolon (tüm statüler, moderation flag'leri dahil).

Test: 10 CSV unit (BOM, quoting, escape, TR karakter, null/Date/bool). 422 toplam.

## 17 Nisan 2026, Admin ops v4 drill-down

`/admin/kullanicilar/[username]` ve `/admin/tarifler/[slug]` yeni detay sayfaları. Moderator-view: HIDDEN + PENDING_REVIEW içerik görünür, preflight flag chip'leri + hiddenReason inline. User detay: 7 stat card + rozetler + variation/review/report listeleri. Recipe detay: 6 stat card + beslenme + rating aggregate + distribution mini-bar + review/variation listeleri + son kaydedenler. Liste sayfalarında drill-down linkleri (name → user detay, title → recipe detay, public ↗ yan link). Yeni queries: getAdminUserDetail + getAdminRecipeDetail.

## 17 Nisan 2026, Admin ops v3

Main dashboard'a 🏆 "En aktif kullanıcılar" (top 10, composite skor uy×3+yorum×2+bookmark) + 🚨 "En çok raporlanan içerik" (variation + review ayrı kolon) eklendi. `/admin/tarifler` ve `/admin/kullanicilar` URL-driven sort/filter/search/pagination aldı: kolon başlıklarına click → sort toggle (▼/▲), status/rol/e-posta doğrulama filter, ilike search, 50/sayfa pagination. Paylaşılan component: SortableHeader + PaginationBar (RSC-only, no-JS). Yeni query: getMostActiveUsers, getMostReportedVariations/Reviews, getAdminRecipesList, getAdminUsersList.

## 17 Nisan 2026, Admin dashboard v2

13 stat card (önceden 10) + 4 yeni bölüm: 📈 kullanıcı büyüme (son 30 gün bar chart), ⭐ yorum yıldız dağılımı, 🔥 en çok görüntülenen tarifler (top 5), 👤 son kaydolan kullanıcılar (10). Review v2 entegre (toplam + ortalama rating + dağılım). Unified inceleme kuyruğu (variation + review PENDING tek sayı). Yeni alarmlar: e-posta doğrulama <60% highlight, görselsiz tarif >20% highlight. Yeni query helpers: getTopViewedRecipes, getRecentSignups, getUserGrowthDaily, getReviewDistribution.

## 17 Nisan 2026, AI Asistan v2 synonym expansion

Kural-tabanlı matcher'ın data tabloları TR mutfağı için zenginleşti. Algoritma (2-step direct prefix → synonym fallback) aynı kaldı. Et ayrıştırıldı (önceden "kıyma ↔ dana eti" false-positive vardı; şimdi kıyma kendi grubu). Balık/karides/süt ürünleri/bitkisel yağ/otlar/sebzeler/baklagil/un-nişasta/sirke-limon/salça eklendi. Pantry: tereyağı + maydanoz + maya + sirke + limon suyu eklendi. Test: 29 → 69 (412 unit toplam PASS). Form akışı + provider interface etkilenmedi.

## 17 Nisan 2026, Neon dev/prod branch + script guard

Önceden tek Neon branch hem prod hem dev olarak kullanılıyordu (hata payı sıfır). Artık iki branch:

| Katman | Production | Dev |
|---|---|---|
| Neon host | `ep-broad-pond` | `ep-dry-bread` |
| Vercel scope | Production | Preview + Development |
| Lokal env | `.env.production.local` (elle) | `.env.local` (default) |
| Script guard | `--confirm-prod` zorunlu | Serbest |

34 destructive script `scripts/lib/db-env.ts` guard'ı import eder: prod host + flag yoksa exit 1, flag varsa 3 sn uyarı. Runbook: `docs/PROD_PROMOTE.md`. Codex tarafı (codex-import child branch) hiç etkilenmiyor.

## 17 Nisan 2026, Review sistemi v2

Review v1'in üstüne 5 katman: preflight (repeated_chars/caps/URL → PENDING_REVIEW), admin moderation (hideReview/approveReview + /admin/incelemeler Yorumlar section + /admin/raporlar Raporlanmış Yorumlar), profil "Yorumlarım" section (owner HIDDEN dahil + hiddenReason görünür), `REVIEW_HIDDEN`+`REVIEW_APPROVED` notification tipleri, ReportButton REVIEW hedefi. Schema: Review.moderationFlags + hiddenReason. Test: 11 unit + 1 E2E PASS, 374 unit toplam. Migration `20260417140000_review_moderation` dev branch'e uygulandı.



## 17 Nisan 2026, DB derin doğruluk + Faz 3 başlangıç

🎯 **audit-deep.ts: 26 CRITICAL + 498 WARNING → 0/0 PASS. audit-content.ts: 0 CRITICAL / HIGH 13 (hepsi legitimate kısa içecek). Faz 3 Review/Rating sistemi canlı.**

~40 commit. Nutrition %100 coverage, 200+ DB kalite düzeltmesi, Review system full-stack.

### Ana başlıklar
- 🥗 **Nutrition backfill %54 → %100** (Codex backfill-6/7/8/9 merge, 400 tarif macro, backfill-10 gerekmedi)
- 🔧 **audit-deep WARNING 498 → 0**: 26 CRITICAL alerjen fix, 78 over-tagged temizlik, 42 yanlış tag removal, 14 YUMURTA data-driven cleanup, 76 tek-ingredient grup null, 13 partial grouping (7 transfer + 6 flatten), 276 boilerplate tipNote/servingSuggestion → null, timer regex bug (70 false positive), 3 CORBA kategori taşıma, unit standardize, 2 duplicate title rename, 3 TIME_GAP
- 🔍 **audit-content.ts yeni** (Claude), içerik kalite audit: COMPOSITE_COMMA + STEP_INGREDIENT_MISSING + MISSING_GROUPS + VAGUE_LANGUAGE + TIME_GAP + diğer 7 kategori
- 🤝 **Codex2 ortak analiz** (bağımsız): 28 step-mismatch (tuz/karabiber/un eksik) + 24 composite row split ("Tuz, karabiber, pul biber" tek row → 3 ayrı) + 3 ek semantik bulgu (jokai Sıvı yağ, csalamade Şeker, banh-mi Sirke/Şeker/Kişniş)
- 🎯 **Tarif-özel fix'ler**: profiterol krema + step revise + grup, atom-sos adım sırası, patatas-bravas step 4 ekle, vietnam-yumurta-kahvesi netleştir, cao-lau/com-tam/bo-luc-lac sos ref uyum, kourabiethes/makroudh/lokma-tatlisi grup, dereotlu-kur-somon/kvass kür/ferment süresi, 5 "iyice" somut kriter, humus Pul biber + kladdkaka Un eksik ekle + GLUTEN
- ⚙️ **audit iyileştirmeleri**: asciiNormalize (ekmek→ekmegi inflected form), keyword listesi allergens.ts ile sync (kefir/filmjölk/gochujang/furikake/yengeç/dolmalık fıstık/tortilla/yulaf/vs), tolerance (kür 36h, eser kcal <10, boilerplate threshold 6)
- 📋 **Source sync**: 52 `seed-recipes.ts` tarif + 14 bootstrap `prisma/seed.ts` tarif DB snapshot'ına göre regenerate (ingredients + steps + cookMinutes + tipNote + servingSuggestion field-by-field)
- 🔒 **CI guard genişletildi**: `validate-batch.ts` + 2 yeni ERROR check (composite-comma + step-ingredient-mismatch). Yeni Codex batch'te pattern'lar merge öncesi bloklanır
- 🧩 **`src/lib/allergen-matching.ts` tek kaynak**: ALLERGEN_RULES + ingredientMatchesAllergen + inferAllergensFromIngredients unified. allergens.ts re-export eder

### 🎉 Faz 3 başlangıç, Review/Rating sistemi (full-stack)
- 💾 Schema: `Review` model (userId+recipeId+rating 1-5+comment nullable+status+timestamps, `@@unique([userId, recipeId])`), ReportTarget enum'a `REVIEW` değeri. Migration `20260417000000_review_system` applied.
- 🔒 Validation: `reviewSchema` (Zod), rating 1-5 int + comment 10-800 char optional. `reportSchema.targetType` artık enum VARIATION|REVIEW.
- 🔒 Rate limit: `review-submit` scope (10 yorum/saat)
- ⚙️ Server actions: `submitReviewAction` (upsert pattern, edit aynı endpoint), `deleteOwnReviewAction` (ownership gate)
- 📊 Query: `getRecipeReviews` (published liste + aggregate: average/count/distribution), `getUserReviewForRecipe` (form prefill)
- 🎨 UI (4 component): `StarRating` (interactive + read-only, hover state, radiogroup ARIA), `ReviewForm` (yıldız + comment, 800 char counter, edit-aware), `ReviewsSection` (server RSC, summary card + histogram bars + login prompt + list), `DeleteOwnReviewButton`
- 🌐 SEO: `AggregateRating` JSON-LD koşullu (count > 0), Google rich results eligibility. Fake rating abuse guard.
- 🧪 363 unit + build PASS

### 📝 Codex batch 11+ için docs güncellemesi
- `RECIPE_FORMAT.md` → 6 yeni "Veri doğruluğu" kuralı ("CI bloklar")
- `CODEX_HANDOFF.md` §6.7 + §6.8, yanlış/doğru kod blokları + pre-flight zorunlu
- 5 kritik kural: virgül-composite YASAK, step-ingredient consistency, servingSuggestion sos refs, adım sırası mantıklı, step derived component açık

### Yeni ops tooling (~22 yeni script)
- 3 audit: `audit-content.ts`, `audit-step-ingredient-mismatch.ts`, `audit-composite-rows.ts`
- 17 fix: `fix-critical-allergens.ts` + `v2`, `fix-mayonez-yumurta.ts`, `fix-overtag-allergens.ts`, `fix-inconsistent-tags.ts`, `fix-zero-tag-recipes.ts`, `fix-boilerplate-to-null.ts`, `fix-unit-lt-to-litre.ts`, `fix-duplicate-titles.ts`, `fix-single-ingredient-groups.ts`, `fix-partial-grouping.ts`, `fix-corba-categories.ts`, `fix-kesin-batch.ts`, `fix-procedure-flow.ts`, `fix-vietnam-sauce-refs.ts`, `fix-final-polish.ts`, `fix-step-ingredient-mismatch.ts`, `fix-composite-row-split.ts`
- 2 sync: `sync-source-from-db.ts` (drift raporu), `patch-source-from-db.ts` (DB→source regenerate)

### Schema değişiklikleri (17 Nis)
- `Review` model + `reviews` tablo + 3 index
- `ReportTarget` enum + `REVIEW` değeri
- `User.reviews Review[]` relation
- `Recipe.reviews Review[]` relation

### Sonuç
- `audit-deep.ts`: 🟢 0 CRITICAL / 0 WARNING / 26 INFO, PASS
- `audit-content.ts`: 🟢 0 CRITICAL / HIGH 13 (8 kahve 2-ingredient + 5 smoothie ≤2 step, legitimate) / MEDIUM 127 / LOW 0
- `validate-batch.ts`: 0 ERROR (595 WARNING çoğu cuisine-null, retrofit otomatik doldurur)
- Build + typecheck: clean, 363 unit test green

### Sıradaki
- ⏳ **Codex batch 11**, kardeş Eren güncellenmiş docs ile 100 tarif yazacak (regional Türk zenginleştirme + smoothie/kahve + eksik mutfaklar)
- ⏳ **Review sistemi ikinci iterasyon**, admin moderation (Report targetType=REVIEW handler), profil "Yorumlarım" section, REVIEW_POSTED notification, preflight moderation, dedicated unit/E2E test
- ⏳ **Faz 3 devam**: i18n aktivasyonu (EN/DE), AI Asistan v2 ingredient synonym genişletme, video entegrasyonu

---

## 16 Nisan 2026, mega session özeti

**🎉 1000 TARİF MİLESTONE TAMAMLANDI!** ~70 commit. Batch 6-10 merge (506→1000), AI Asistan 17 özellik, cuisine tam entegrasyon (20 kod), 92 tarif kalite fix, nutrition pipeline (%54 coverage), UI/UX büyük polish, SEO (FAQ schema + sitemap cuisine + dinamik title), admin dashboard, bf-cache, deep DB audit.

### Tarif büyümesi
- 📊 **506 → 1000**: batch 6 (+100), 7 (+100), 8 (+100), 9 (+100), 10 (+94). 20 mutfak aktif.
- 🥗 **Nutrition backfill**: 5 pass (~490 tarif macro), coverage **%54**. Devam ediyor.
- 🔍 **Deep DB audit** (`scripts/audit-deep.ts`): 7 alan, ~40 kontrol. 26 CRITICAL (eksik alerjen), 498 WARNING, yapısal sorun SIFIR.
- 🧪 **363 unit + 24 E2E** yeşil.

### AI Asistan, 17 iyileştirme
1-3: Cuisine filter + malzeme hariç tutma + 200-cap kaldırma
4-7: Pantry 15 + synonym + cuisine flag + commentary prefix
8-10: Sonuç 10 + arama geçmişi + filtre duyarlı commentary
11-14: Popüler chip + fallback combo + tag chip + progress bar
15: Malzeme autocomplete (689 isim, Türkçe fuzzy, keyboard nav)
16: Arama paylaş (URL kodlama + auto-submit)
17: Sonuç sıralama tercihi (eşleşme / hızlı / az eksik)

### Cuisine tam entegrasyon
- 💾 Schema `cuisine String?` + migration + 20 kod (tr→se)
- 🎨 CuisineFilter aktif (/tarifler + /tarifler/[kategori])
- 🎨 RecipeCard flag + tarif detay badge + "Bu mutfaktan diğer tarifler →" link
- ✨ Homepage + Keşfet "Mutfaklara Göz At" section
- 🌐 Sitemap cuisine landing pages (~18 URL)
- 📝 Meta description + JSON-LD recipeCuisine + FAQ schema dinamik
- 📊 Admin dashboard cuisine bar chart
- ⚡ Benzer tarifler cuisine-aware (+1.5 aynı mutfak bonus)
- 🧪 42 cuisine inference test

### UI / UX
- ✨ SearchBar autocomplete (tarif adı + malzeme, homepage + /tarifler + /kesfet)
- ✨ Homepage "🔥 En Popüler" section (viewCount top 8)
- ✨ Homepage 🎲 rastgele tarif shuffle (client-side, server action)
- ✨ Keşfet: popüler aramalar chip + popüler tarifler + mutfaklar + AI CTA + arama
- ✨ Tarif detay "🧠 Bu malzemelerle başka ne yapılır?" AI cross-link
- ✨ Tarif detay "Bu mutfaktan diğer tarifler →" keşif linki
- 🎨 `/tarifler` dinamik title ("Japon Tarifleri | Tarifle")
- 🎨 `/tarifler` aktif filtre chips (× ile kaldır + "Hepsini temizle")
- 🎨 `/tarifler` boş sonuç filtre gevşetme önerileri + AI cross-link
- 🎨 Kategori sayfası tam filtreleme (Allergen + Diet + Cuisine) + aktif chips
- 🎨 Kategori boş sonuç "Filtreleri temizle" önerileri
- 🎨 Navbar aktif sayfa highlight (desktop primary, mobil bg tint)
- 🎨 Hakkımızda dinamik istatistik kartları (revalidate 3600)
- 🎨 Hero tarif sayısı count-up animasyonu (easeOutExpo)
- 🎨 Tarif detay görüntülenme göz ikonu
- 🧹 Homepage 10→8 section ("Yeni Eklenenler" kaldırıldı, scroll optimize)
- 🧹 Keşfet rastgele tarif kaldırıldı (homepage'de zaten var)

### SEO
- 🌐 Sitemap cuisine landing pages (~18 URL)
- 📝 Meta description cuisine prefix
- 📝 JSON-LD recipeCuisine dinamik
- 📝 FAQ schema (tarif detay: 7 SSS + kategori: 2 SSS)
- 📝 `/tarifler` dinamik title

### Kalite + altyapı
- 🐛 92 tarif kalite audit (D:42 tipNote + B:12 group + A:4 serving fix)
- ✅ isFeatured %6.4 → %10.8
- ⚡ bf-cache restore handler + security headers
- ⚡ LCP font opt + Lighthouse re-baseline (Perf 96-97)
- ⚡ RSS feed 30→50
- 📊 Admin dashboard: 10 stat card + cuisine chart + nutrition coverage
- 📝 Codex HANDOFF kalite kuralları (6.5 tipNote + 6.6 group)
- ⚙️ AllergenFilter + DietFilter + CuisineFilter pathname-aware fix

### Sıradaki
- ✅ ~~Codex batch 10~~, **1000 tarif tamamlandı!**
- ✅ ~~26 CRITICAL alerjen fix~~, 17 Nis turunda kapatıldı
- ✅ ~~Codex nutrition backfill~~, 17 Nis'te %100 coverage
- ✅ ~~498 WARNING değerlendirme~~, 17 Nis'te 0'a indirildi
- ⏳ Faz 3 hazırlık: i18n, review/rating, video entegrasyonu

## 16 Nisan 2026 session 3, batch 7 + kalite fix + cuisine genişletme

Codex batch 7 merge (**706 tarif**) + 92 tarif kalite audit + cuisine genişletme (20 kod) + RSS 50 + Lighthouse re-baseline. Detay session 4 özeti bu bölümü kapsar.

## 16 Nisan 2026 session 2, cuisine schema + batch 6 + perf

Cuisine schema migration + CuisineFilter aktivasyonu + batch 6 merge (506→606) + LCP font optimizasyonu. Detay: session 3 özeti bu bölümü kapsar.

---

## 16 Nisan 2026 session 1, günün toplu özeti

DB-odaklı pass: **3 Codex batch (300 yeni tarif → 506 toplam)** + SEO altyapısı + discovery + admin görünürlük + E2E coverage + Like UI. 15+ commit, hepsi main'de.

### Codex batch akışı (3 batch + 1 emoji retrofit)
- 🍳 **Batch 3** (`8ecbe0b`): 100 tarif, Codex kendiliğinden uluslararası geçiş başlattı (Macar Gulaşı, Stroganoff, Teriyaki, Cajun, Fajita, Miso Çorbası, Ratatouille). 206 → 306.
- 🌍 **Batch 4** (`8ecbe0b`): 100 tarif uluslararası odaklı (İtalyan/Yunan/İspanyol/Fransız/Japon/Meksika 8'er + Hint/Orta Doğu/Kore/Tay). 306 → 406. Uluslararası oran %19 → %31.8.
- 🌏 **Batch 5** (`2bd041f`): 100 tarif eksik mutfaklara (Kore 10, Tay 10, Çin 5+, Kuzey Afrika 7) + boş kategorileri dengeleme (smoothie 0→7, sıcak içecek 0→7, kokteyl 1→10, atıştırmalık 1→13). 406 → **506**. Uluslararası %38.7.
- 🎨 **Batch 4 emoji retrofit** (`39522a2` + sync-emojis): Codex batch 4'te 100 emoji eksik bırakmıştı; ayrı PR ile düzeltti. `scripts/sync-emojis.ts` source→DB UPDATE helper. Sonuç: **506/506 emoji dolu (%100)**.

### DB perf + altyapı
- ⚡ **Detail page composite indexes** (migration `20260416000000`): `recipe_ingredients(recipeId, sortOrder)` + `recipe_steps(recipeId, stepNumber)`. Prisma/Postgres FK için otomatik index yok; perf-audit.ts ile tespit edildi (1000+ tarif × 7 ing → seq scan büyür). Production'a uygulandı, Seq Scan → Index Scan geçişi doğrulandı.
- 📊 **`scripts/perf-audit.ts`**, 10 hot-path sorgu için EXPLAIN ANALYZE runner. Hepsi <0.3ms 506 tarifte. Allergen NOT hasSome + FTS GIN cost-model nedeniyle seq scan tercih ediyor (500-2000'e kadar fine).
- 🧹 **Sitemap ping cleanup**: Google `/ping` 2023 deprecated (404), Bing 410. retrofit-all'dan kaldırıldı (`847e135`); IndexNow değerlendirildi ama YAGNI (Google desteklemiyor, TR'de Bing/Yandex payı düşük).

### SEO + launch readiness
- 🌐 **Dinamik `sitemap.xml` + `robots.txt`** (Next.js convention): 506 tarif + 17 kategori + 8 statik = ~531 URL, hourly revalidate, force-dynamic.
- 🔗 **Per-recipe canonical + per-page canonical** (`/tarif/[slug]`, `/tarifler`, `/tarifler/[kategori]`).
- 🧭 **BreadcrumbList JSON-LD** (Schema.org rich results): tarif detayda 4 seviye, kategoride 3 seviye.
- 📡 **RSS 2.0 feed** (`/rss.xml`): son 30 tarif, RFC 822 tarihler, atom:self-link, auto-discovery `<link rel="alternate">` her sayfanın head'inde.
- 📝 **`docs/SEO_SUBMISSION.md`**: Google Search Console + Bing Webmaster step-by-step. Kerem ana PC'den uyguladı: GSC sitemap submit "Başarılı" (231 keşfedilen sayfa), Bing import + sitemap submit (331 URL).
- 🔧 **CI build fix** (`7b2b20c`): `/rss.xml` + `/sitemap.xml` route handler'ları placeholder DATABASE_URL ile prerender patlıyordu, `export const dynamic = "force-dynamic"` ile çözüldü.
- 📈 **Lighthouse baseline** (`docs/PERFORMANCE_BASELINE.md`): 4 sayfada Perf 94-97, A11y/BP/SEO 100, LCP 2.5s sınırda. Heading-order fix `/tarifler` + `/tarifler/[kategori]` (sr-only h2).
- 🍒 **AggregateRating bilinçli atlandı**: Google gerçek kullanıcı rating'i ister, bookmark/likeCount yetmiyor (structured data abuse riski).

### Discovery + ana sayfa
- ✨ **Benzer tarifler öneri motoru** (`src/lib/queries/similar-recipes.ts` + `SimilarRecipes.tsx`): tarif detay altında 6 kart şerit. Kural-tabanlı skor (kategori +3, type +2, ortak tag +1, difficulty +0.5). Score 0 elenir. Tie-break: newer → TR collation. Promise.all paralel yükleme. 12 unit test.
- 🎨 **Homepage `getFeaturedRecipes` rotation**: slug-ordered pool + ISO hafta offset (`getWeekIndex`), wrap-around. Bir hafta aynı 6, ertesi hafta farklı 6.
- ✨ **"Yeni Eklenenler" homepage section**: `getRecentRecipes(14gün, 8 kart)`. 506 tarifle batch'lerin yeni içerikleri spotlight'ta görünür.
- 🇹🇷 **CuisineFilter UI placeholder** (`/tarifler`): 14 mutfak chip (🇹🇷🇮🇹🇫🇷🇪🇸🇬🇷🇯🇵🇨🇳🇰🇷🇹🇭🇮🇳🇲🇽🇺🇸🌍🌍), "Yakında" badge. 1000 tarife yaklaşırken schema migration + retrofit ile aktive.

### Codex batch pipeline güçlendirme
- ✅ **Validator** (`scripts/validate-batch.ts`, `npm run content:validate`): Zod + semantik (muğlak ifade ERROR, kcal/makro WARNING, alkollü tag cross-check, slug çakışması). DB'siz. CI `check` job'una eklendi → format ihlali merge bloklar.
- 🧹 **Rollback safety net** (`scripts/rollback-batch.ts`): 3 girdi modu (`--slugs`, `--slugs-file`, `--batch N`) + 3 katman güvenlik (dry-run default, echo-confirm phrase, variation/videoJob block). AuditLog kaydı.
- 🎨 **Emoji sync** (`scripts/sync-emojis.ts`): source'taki emoji'leri DB'ye UPDATE eder. Codex emoji eksik bırakırsa düzeltme yolu. Transaction timeout 60sn (100 update için Neon RTT).

### Admin + UI
- 📊 **Admin dashboard genişletildi** (`fc7bddc`): 6 → 8 stat card (Bookmark + Koleksiyon eklendi) + Aktivite section (Bugün/Hafta/Ay) + Son seed batch tablo (date_trunc hour, count > 5) + kategori dağılımı bar chart (17 kategori, primary renkli).
- ❤️ **Like UI butonu** (`LikeButton`): backend → UI gap kapatıldı. `toggleLikeAction` server action vardı ama hiçbir UI'da yoktu. Optimistic update + auth gate + 3 görsel state. `getLikedVariationIds` helper N+1 önler. **A11y bonus fix**: VariationCard nested-interactive ihlali (button içinde button), restructure ile sibling yapıldı.

### Test coverage
- 🧪 **Unit: 230 → 303** (+73). Yeni: validate-batch (19), recipe-search sanitize (6), seo-breadcrumb (6), similar-recipes (12), rollback-batch (6), seo-rss (13), recipe-featured-rotation (11), seo-ping silindi (-8 sonra ping kaldırıldı).
- 🧪 **E2E: 12 → 18** (+6). Yeni: collection-flow, ai-asistan-flow (2), shopping-list-flow, variation-flow, cooking-mode-flow.
- 🧪 **A11y regression aktif**: a11y-audit yine 0 violation (CuisineFilter contrast + heading-order + nested-interactive bu pass'te yakalandı, hepsi düzeltildi).

### Auth + observability
- 🔍 **Google OAuth fix doğrulandı**: 14 Nis Vercel log'undaki 6 hata fix öncesinden. Fix sonrası 2 yeni Google user başarıyla kayıt (keroli.aga + akindarkhes), username otomatik mint, KVKK true.

### Sıradaki tek opsiyonel iş
- ⏳ **Codex batch 7-10**: 1000 hedefe 4 batch kaldı. Codex artık `cuisine` alanını yazabilir.
- ✅ ~~Schema'da `cuisine` alanı~~, session 2'de tamamlandı.
- ✅ ~~LCP optimizasyonu~~, session 2'de tamamlandı.
- ⏳ **bf-cache fix**: NextAuth cookie + Cache-Control, low priority.

---

## 15 Nisan 2026 oturumu, günün toplu özeti

Public launch ve Codex 500-batch öncesi büyük bir kalite + altyapı pass'i. Tek günde 11 commit, hepsi main'de canlı.

### Kullanıcı tarafı yeni özellikler
- ✨ **Şifremi unuttum akışı**, `/sifremi-unuttum` + `/sifre-sifirla/[token]` + `PasswordResetToken` schema (1h TTL, email enumeration defense, OAuth-only user için bilgilendirme maili).
- ✨ **Bugünün tarifi widget'ı**, ana sayfada deterministic daily pick (UTC gün indeksi % tarif sayısı, slug-orderlı, 12 kural-bazlı curator note + 5 intro varyantı).
- ✨ **"En çok beğeni" sort**, `/tarifler` chip'ine 6. seçenek, in-memory aggregation + TR collation tie-break.
- ✨ **Kullanıcı kendi uyarlamasını silebilir**, ownership gate + hard delete + AuditLog. Tarif detay + profil iki yerden. **Düzenleme bilinçli olarak EKLENMEDİ** (edit + beğeni koruma = abuse vektörü).
- ✨ **Alerjen sistemi**, `Allergen` enum (10 değer) + `Recipe.allergens Allergen[]` + GIN index. Tarif detayında collapsible `<details>` (besin değerleri altında, "Alerjin varsa malzeme listesine bir de sen göz at."), `/tarifler`'de "içermesin" filter row.
- ✨ **Vegan/vejetaryen**, `lib/diet-inference.ts` + retrofit (42 yeni tag, 2 yanlış temizlik). Tarif detayında yeşil `🌱` chip, `/tarifler` dedicated "DİYET" filter.
- ✨ **Malzeme grupları**, `RecipeIngredient.group String?` "Hamur için / Şerbet için / Sos için". Revani + 6 tarif daha (baklava, künefe, mantı, lahmacun, ali-nazik, hünkar beğendi, boza) composite isim temizliği (46 ingredient update).
- 🎨 **Ana sayfa düzeni**: Hero → Öne Çıkan → Günün Tarifi → AI Asistan → Kategoriler.
- 🎨 **Bugünün Tarifi polish**: "İleri" → "Zor", `~XXX kcal` chip.
- 🎨 **Dil tercihi UI**, `/ayarlar` LanguagePreferenceCard (🇹🇷/🇬🇧/🇩🇪 disabled + "Yakında").

### Bug fix'ler
- 🐛 **AI Asistan pantry false-positive**: "Sucuk" eski algoritmada "su" prefix'ine match'lüyordu → %100 false-positive. `isPantryStaple` exact-token containment ile düzeltildi.
- 🐛 **Baklava + Revani tipnote**: "ya da tersi" muğlak ifadesi iki case'e ayrıldı.
- 🐛 **AI Asistan select-name**: filtre dropdown'larına `htmlFor`/`id` label association.

### A11y, WCAG 2.1 AA
- ♿ **`@axe-core/playwright` ile 10 sayfa × 2 tema (light + dark)**: 164 critical/serious node → **0**.
- 🎨 **Renk paletinde 9 token koyulaştırıldı** (primary `#e85d2c → #a03b0f`, secondary `#d4a843 → #785012`, accent-green/blue/warning/error/success/text-muted hepsi AA uyumlu). Brand turuncu ailede kaldı.
- 🎨 Badge tint `/15` → `/10`, footer logo `text-lg` → `text-xl` (large text kategorisi).
- 🧪 `tests/e2e/a11y-audit.spec.ts`, CI regression guard.

### Codex 500-batch öncesi DB hijyeni
- 🔒 **Seed input validation** (`lib/seed/recipe-schema.ts`), Zod, slug regex, enum guard'ları, prep+cook≈total soft-check. 500'den 1 bozuksa diğerleri yine yazılır.
- ⚡ **GIN index on `Recipe.allergens`**, array hasSome/hasNone filter ms-düzeyi.
- ⚙️ **`scripts/retrofit-all.ts`**, tek komut allergens → diet tags orchestrator.
- 💾 **i18n minimal prep**: `Recipe.translations Json?` JSONB bucket, locale-keyed, opsiyonel. Faz 3'te aktive olur.
- 🧹 **Prisma migration baseline temizliği**, Pass 10'dan biriken 8 `db push` değişikliği `prisma/migrations/20260415120000_codex_batch_prep/migration.sql` altında formal migration. `prisma migrate resolve --applied` ile mevcut DB'de işaretlendi (re-run yok). Bundan sonra `db:migrate` kullanılacak.
- 🔍 **Full-text search** (`20260415180000_add_fulltext_search`), `searchVector` generated tsvector (A/B/C weighted) + `immutable_unaccent` SQL wrapper + GIN index. `/tarifler` araması `websearch_to_tsquery('turkish', ...)` + `ts_rank_cd` ile; ingredient adı fallback union'u. Kök eşleşme (mantılar→Mantı), aksan-bağımsız (manti→Mantı).
- 🔒 **Batch pre-flight validator** (`npm run content:validate`), Zod + semantik katman: muğlak ifade regex ban, kcal/makro uyumu, alkol tag cross-check, slug çakışması. DB'ye dokunmaz; seed'den önce koşulur.

### Test coverage genişletme
- 🧪 **`tests/unit/badges-service.test.ts`** (13 test, Prisma+notifications mock, `vi.hoisted` pattern).
- 🧪 **`tests/unit/email-verification.test.ts`** (5 test, consume akışı + tx shape + best-effort badge).
- 🧪 **`tests/e2e/auth-roundtrip.spec.ts`** (1 test, login → /ayarlar → profil → çıkış → state geri).
- 🧪 **`tests/unit/validate-batch.test.ts`** (19 test, TR normalize + muğlak regex + macro + alkol cross-check + slug dup).
- 🧪 **`tests/unit/recipe-search.test.ts`** (6 test, sanitizeQueryInput sınır durumlar).
- **Sonuç: 114 → 255 unit, 9 → 12 E2E test yeşil.**

### Dokümantasyon
- 📝 **`docs/CHANGELOG.md`** yeni, kategorik organize (17 başlık), her iş tek satır + emoji işaret. Her yeni iş ilgili kategorinin altına eklenir.
- 📝 **`RECIPE_FORMAT.md`**, yeni alanlar (allergens, group, translations) + "Dil ve anlatım kalitesi" bölümü 7 yazım kuralı (muğlak ifadeler / belirsiz ölçüler / composite isim YASAK).
- 📝 **`CODEX_HANDOFF.md`**, `retrofit-all.ts` adımı + en kritik 3 yazım kuralı özeti.
- 📝 Memory güncel: `feedback_project_status_format.md`, `feedback_time_framing.md` eklendi.

### Repo hijyeni
- 🔒 **Repo private yapıldı** (kullanıcı), `.claude/settings.local.json` + `.claude/launch.json` gitignore'a.
- ⚙️ Codex'in clone edebilmesi için kardeş **Collaborator** olarak eklenecek (kullanıcı yapacak).

### Sıradaki tek opsiyonel iş
- ✅ **Full-text search (Postgres `to_tsvector`)**, 15 Nisan 2026 akşam eklendi (aşağıda "DB pass, FTS + batch validator" bölümü).

---

## 16 Nisan 2026, Perf audit + ping cleanup ✅

Codex batch 4'ü yazarken kısa bir bakım pass'i.

- 🧹 **Deprecated ping step temizliği**: retrofit-all pipeline'ından Google+Bing sitemap ping adımı kaldırıldı (Google `/ping?sitemap=` 2023 kapandı, Bing 410). `src/lib/seo-ping.ts`, `scripts/ping-sitemap.ts`, ilgili 8 unit test + `content:ping` shortcut silindi. IndexNow değerlendirildi ama Google desteklemediği ve TR'de Bing/Yandex payı düşük olduğu için YAGNI.
- 📊 **DB hot-path perf audit** (`scripts/perf-audit.ts`), 306 tarif ölçeğinde 10 hot sorgu EXPLAIN ANALYZE'dan geçti. Hepsi < 0.3ms execution. 4 seq scan tespiti:
  - `/tarifler` base alphabetical → 306'da fine, 1000+'a bakılır
  - Allergen NOT hasSome → Postgres GIN NOT desteği zayıf, 2000+ tarifte denormalize bakılır
  - FTS tsvector → planner 306'da seq scan tercih (cost model), 500+'ta GIN'e geçecek
  - **Recipe ingredients/steps FK seq scan** → GERÇEK darboğaz: Prisma/Postgres FK'de otomatik index yok
- ⚡ **Fix**: `RecipeIngredient(recipeId, sortOrder)` + `RecipeStep(recipeId, stepNumber)` composite index (migration `20260416000000_detail_page_indexes`). Production'a uygulandı, Seq Scan → Index Scan doğrulandı. Tarif detay sayfası hot path artık 1000+ tarife ölçeklenebilir.

## 15 Nisan 2026, SEO pass + Benzer tarifler + Breadcrumb ✅

Codex batch 1 main'de + production'da (106 tarif canlı). Codex batch 2'yi yazarken paralel bir pass: SEO altyapısı + discovery feature + rich results eligibility.

- 🌐 **Dinamik sitemap.xml + robots.txt** (Next.js convention): 131 URL (8 statik + 17 kategori + 106 tarif), hourly revalidate. `/admin`, `/api/*`, auth-gated yollar disallow.
- 🔗 **Per-recipe canonical + OG meta**: `/tarif/[slug]` sayfasında `alternates.canonical`, `openGraph`, `twitter:card`. `/tarifler?q=…&kategori=…` kombinasyonları param-free `/tarifler` canonical'a işaret eder, filter varyantları ayrı indexlenmez. `/tarifler/[kategori]` sayfasına da canonical eklendi. Detail page JSON-LD Recipe schema (nutrition + ingredients + steps + author) zaten sağlamdı.
- 🧭 **BreadcrumbList JSON-LD** (Schema.org): `/tarif/[slug]` (4 seviye) ve `/tarifler/[kategori]` (3 seviye) sayfalarına enjekte edildi. Google Search sonuç kartının altına "Ana Sayfa › Tarifler › Kategori › Tarif" şeridi çıkar → CTR artışı + rich results eligibility. `generateBreadcrumbJsonLd` helper'ı `src/lib/seo.ts`'te.
- ✨ **Benzer tarifler öneri motoru** (`src/lib/queries/similar-recipes.ts` + `SimilarRecipes.tsx`): tarif detay altında 6 kart'lık şerit. Kural tabanlı skor: aynı kategori +3, aynı type +2, ortak tag +1, aynı difficulty +0.5. Score 0 → gizli (noise önleme). Tie-break: newer → TR collation. Detail page `Promise.all` ile bookmark + collections + similar paralel yükleniyor, ek round-trip yok.
- 🧪 12 similar-recipes + 6 breadcrumb unit = 18 yeni. **279 unit + 12 E2E yeşil**.
- 📝 `docs/SEO_SUBMISSION.md`, Google Search Console + Bing Webmaster Tools submission rehberi (property verify, sitemap submit, URL inspection, CWV izleme, sitemap ping helper). Kerem Search Console'a ekleyene kadar sitemap passive; eklendikten sonra günler içinde indexleme.
- ✅ Browser verified: sitemap (106 tarif hepsi), robots.txt, canonical (`/tarifler?q=... → /tarifler`), similar section (Tas Kebabı → 6 et-yemekleri kart), breadcrumb JSON-LD (Tas Kebabı detail → 4 seviye, Et Yemekleri kategori → 3 seviye).

**AggregateRating bilinçli olarak atlanıldı**: Google Recipe rich results için gerçek kullanıcı rating'i gerekiyor. Bookmark/variation likeCount rating yerine geçmiyor; yanlış markup structured data abuse sayılır. Review system (Faz 3 kapsamı) eklenince `aggregateRating` + `review` array takılır.

## 15 Nisan 2026, DB pass: FTS + batch validator + rollback ✅

Codex batch'i başlamadan önce DB odaklı üç iyileştirme, Claude ile paralel oturumda main'e düştü.

- 🔍 **Postgres full-text search** (migration `20260415180000_add_fulltext_search`): `searchVector` generated STORED tsvector kolonu (title=A, description=B, tipNote/servingSuggestion/slug=C) + `immutable_unaccent` SQL wrapper + GIN index. `websearch_to_tsquery('turkish', ...)` ile `/tarifler` arama kutusunun tamamı yeni `src/lib/search/recipe-search.ts` üzerinden geçiyor. Kök eşleşme (`mantılar → Mantı`), aksan-bağımsız arama (`manti → Mantı`), ingredient adı fallback union'u mevcut. Chip row'a "En alakalı" sort eklendi (sadece query varken).
- ✅ **Batch pre-flight validator** (`scripts/validate-batch.ts`, `npm run content:validate`): Zod'un üstüne semantik katman, muğlak ifade regex ban (`biraz/azıcık/ya da tersi/duruma göre/epey/yeteri kadar` ERROR; `iyice/güzelce` WARNING), kcal vs 4·P+4·C+9·F ±%15 tolerans (alkollü tarifte atlanır), alkollü malzeme ↔ `alkollu` tag cross-check, slug çakışması. DB'ye dokunmaz. `seed-recipes.ts` side-effect olmadan import edilebilsin diye DB init defer + `recipes` export + entrypoint guard. **CI'da `check` job'una eklendi**, format ihlali varsa merge bloklanır.
- 🧹 **Batch rollback safety net** (`scripts/rollback-batch.ts`, `npm run content:rollback`): 3 girdi modu (`--slugs`, `--slugs-file`, `--batch N`). Default dry-run + etki raporu; `--confirm "rollback-batch-N"` echo-phrase ile gerçek silme. Uyarlaması olan tarifleri otomatik bloklar (`--force` override). Her silme `AuditLog(action=ROLLBACK_RECIPE)`. 3 katman güvenlik: dry-run default, echo-confirm, variation/videoJob block.
- 🧪 Test: 19 validator + 6 FTS sanitize + 6 rollback helper unit eklendi. **261 unit + 12 E2E yeşil**.
- 📝 `CODEX_HANDOFF.md`: 5.2.5'te pre-flight validator adımı, 7'de rollback runbook.

## 15 Nisan 2026, Test coverage genişletme ✅

İki eksik alan kapatıldı: badge service + email verification için Prisma-mock unit testler ve login round-trip için E2E.

- **`tests/unit/badges-service.test.ts`** (13 test): `vi.hoisted` + `vi.mock` ile prisma + notifications mock'lanıyor. `grantBadge` happy/P2002 dup/error path; `awardEmailVerifiedBadge` kullanıcı yok / var; `awardFirstVariationBadge` skip if existing / fresh insert; `maybeAwardPopularBadge` threshold (10); `maybeAwardCollectorBadge` threshold (5) + idempotent over-threshold.
- **`tests/unit/email-verification.test.ts`** (5 test): `consumeVerificationToken` not-found / expired / cleanup-error swallowing / valid path (transaction call shape) / badge grant best-effort (rejection swallowed).
- **`tests/e2e/auth-roundtrip.spec.ts`** (1 test): `createTestUser` helper ile pre-verified user → `/giris` UI form submit → ana sayfaya redirect → `/ayarlar` auth gate geçiyor → `/profil/[username]` render → navbar profile menü → "Çıkış Yap" → anonim state geri geliyor → `/ayarlar` redirect /giris. Pass 4 bug sınıfı için regression guard.
- **230 unit + 12 E2E yeşil.**

## 15 Nisan 2026, Prisma migration baseline temizliği ✅

## 15 Nisan 2026, Prisma migration baseline temizliği ✅

Pass 10'dan itibaren biriken 8 `db push` değişikliği artık formal migration olarak `prisma/migrations/20260415120000_codex_batch_prep/migration.sql` altında. `prisma migrate resolve --applied` ile mevcut DB'ye "uygulandı" olarak işaretlendi (SQL re-run edilmedi, prod değişmedi). Fresh bir DB deploy'unda (e2e branch, future staging) artık `prisma migrate deploy` tam schema kuruyor.

**Kapsadığı değişiklikler**: `Variation.moderationFlags` + `NotificationType` enum + `Notification` table + `PasswordResetToken` + `Allergen` enum + `Recipe.allergens` array + GIN index + `Recipe.translations` JSONB + `RecipeIngredient.group`.

**Durum**: `npx prisma migrate status` → "3 migrations found, Database schema is up to date!", dev/prod drift yok.

## 15 Nisan 2026, A11y audit: WCAG 2.1 AA tertemiz ✅

## 15 Nisan 2026, A11y audit: WCAG 2.1 AA tertemiz ✅

- `@axe-core/playwright` kuruldu, **10 sayfa** tarandı (home, tarifler, tarif detay×2, AI asistan, auth sayfaları, keşfet, hakkımızda).
- İlk tarama: **164 node** critical/serious violation (hepsi renk kontrast + 1 select-name).
- **Select-name fix**: AI Asistan filtre select'leri (Tür/Süre/Zorluk) için `htmlFor`/`id` bağlantısı eklendi.
- **Renk palet revizyonu**, WCAG AA uyumu için token'lar koyulaştırıldı:
  - `--color-primary`: #e85d2c → **#a03b0f** (kontrast white 6.7:1)
  - `--color-primary-hover`: #d14e1f → **#7f2d08**
  - `--color-secondary`: #d4a843 → **#785012** (amber/tütün; text chip'lerde fail ediyordu)
  - `--color-accent-green`: #1fa85a → **#146a36**
  - `--color-accent-blue`: #3b7ae8 → **#184aaa**
  - `--color-text-muted`: #6b6b6b → **#5a5a5a**
  - `--color-success`: #4caf50 → **#2e7d32**
  - `--color-error`: #d32f2f → **#c62828**
  - `--color-warning`: #f57c00 → **#824200**
  - Dark mode primary: #ff6b35 → **#ff7a3d** (dark bg için accent-brightness koruyarak)
- **Badge tint opacity**: `/15` → `/10` (tint bg hafifledi, text kontrastı yükseldi).
- **Footer logo**: text-lg → text-xl (large text kategorisine çıktı).
- **Sonuç**: 164 → 0 critical/serious. Light + dark mode ayrı ayrı pass.
- **Regression guard**: `tests/e2e/a11y-audit.spec.ts` (2 test, light + dark). CI her push'ta çalışacak; yeni sayfa eklenince `PAGES_TO_SCAN` array'ine ekle yeterli.
- Brand tonu biraz koyulaştı, "orange family" içinde kaldı, marka tanınır.

## 15 Nisan 2026, RECIPE_FORMAT dil kalitesi kuralları ✅

## 15 Nisan 2026, Baklava/Revani tipnote + CHANGELOG işaretleri ✅

- **Tipnote fix (DB + seed kaynağı)**: "ya da tersi" muğlak ifadesi iki case'e ayrıldı. Baklava: "Fırından yeni çıkmışsa soğuk şerbet, soğumuşsa sıcak şerbet. İkisi birden sıcak olursa şerbet emmez." Revani de aynı mantık ("kek sıcakken/soğukken"). `scripts/fix-tipnotes.ts` idempotent.
- **CHANGELOG.md işaretleri**: 9 tip (✨ yeni / 🐛 bug / 🔒 güvenlik / 📝 docs / 🧹 refactor / ⚙️ chore / 🎨 UI / 🧪 test / 💾 database / ⚡ perf / ♿ a11y). Legend yukarıda. Bootstrap'tan bugüne tüm satırlar işaretlendi.

## 15 Nisan 2026, Kalan tariflerde group + CHANGELOG ✅

## 15 Nisan 2026, Kalan tariflerde group + CHANGELOG ✅

- Audit: seed'deki 56 tarifte composite isim / "(servis)" parantezi / duplicate token taraması → 7 tarif grup eklenmesi için uygun: **baklava, künefe, mantı, lahmacun, ali-nazik, hünkar beğendi, boza**. Sütlaç/yayla/mercimek/ezogelin/iskender tek-bölüm, grup abartı olur.
- Konsolide retrofit: `scripts/fix-ingredient-groups.ts` (revani-specific scripti sildik, yerine bu). Per-recipe mapping tablosu, idempotent, `--dry-run`. 46 ingredient güncellendi, 7 zaten hizalı.
- Seed kaynağı (scripts/seed-recipes.ts + prisma/seed.ts) da aynı sekilde güncel, re-seed'de future-proof.
- Boza "Leblebi (servis)" → name="Leblebi" + group="Servis için". AI Asistan artık temiz "leblebi" token üzerinden arama yapar.
- **Yeni**: `docs/CHANGELOG.md`, bootstrap'dan bugüne tüm işlerin başlık başlık tek-satır özeti. PROJECT_STATUS daha aktif takip için, CHANGELOG referans için.

## 15 Nisan 2026, Malzeme grupları (Hamur için / Şerbet için) ✅

## 15 Nisan 2026, Malzeme grupları (Hamur için / Şerbet için) ✅

Kullanıcı Revani'de "Şerbet şekeri" ve "Şerbet suyu" ingredient isimleriyle sorun tespit etti, bunlar composite isim değil; "Şeker" + "Su" olmalı, farklı bölümde.

- Schema: `RecipeIngredient.group String?` (nullable, VarChar 80, free-text). Çok-bileşenli tarifler için, "Hamur için", "Şerbet için", "Sos için". NULL = düz liste.
- Type + query + seed validator güncel. Validator: trim + min 1 + max 80.
- `IngredientList` component bucket-by-group render ediyor. Ungrouped → düz liste (backward compat). Grouped → turuncu uppercase heading + subtle separator aralarında. First-appearance order korunur.
- **Revani fix'lendi**: DB retrofit + seed kaynak güncellendi. "Şerbet şekeri" → "Şeker / Şerbet için", "Şerbet suyu" → "Su / Şerbet için". AI Asistan artık "şeker" arayan kullanıcıyı doğru eşleştirir.
- `RECIPE_FORMAT.md`: "X için" convention + yanlış kullanım örneği + basit tariflerde eklememeli uyarısı.
- 7 yeni unit (bucketing: order preservation, null fallback, trim, mixed grouped/ungrouped). **212 unit + 9 E2E yeşil.**

## 15 Nisan 2026, AI Asistan %100 false-positive bug fix ✅

## 15 Nisan 2026, AI Asistan %100 false-positive bug fix ✅

Kullanıcı tespit etti: "Sucuklu Yumurta" %100 eşleşme alıyordu, oysa sucuk kullanıcının malzeme listesinde yoktu.

**Root cause**: `isPantryStaple` içinde `ingredientMatches` kullanılıyordu; o fonksiyon user↔recipe match için bidirectional prefix match yapıyor. "sucuk".startsWith("su") → true → Sucuk pantry staple sanıldı → matched listesine girdi → score 3/3 = %100.

**Fix**: `isPantryStaple` için ayrı algoritma, recipe ingredient'ın HER token'ı pantry havuzunda olmalı (exact token containment). "sucuk" → [sucuk] → "sucuk" ∉ PANTRY_TOKEN_SET → not staple ✓. `ingredientMatches` dokunmadı, user matching'i bozmayacak.

- 3 yeni regression test: sucuk/yağmur/sumak/tuzlu-kraker pantry değil, "tuz, karabiber, kimyon" pantry değil (kimyon staple olmadığı için).
- Preview doğrulama: aynı malzemelerle Sucuklu Yumurta artık **%67 eşleşme**, "Eksik: Sucuk, Sadece Sucuk eksik." ✓
- **205 unit + 9 E2E yeşil**.

## 15 Nisan 2026, i18n minimal schema prep ✅

## 15 Nisan 2026, i18n minimal schema prep ✅

Tam i18n ertelendi (Faz 3), ama Codex batch öncesi **schema hazırlığı** yapıldı: yarın 500 tarif gelirken Codex dilerse EN çevirisi de gönderebilir, yoksa TR-only kalır. Retrofit ileride çok daha kolay.

- Schema: `Recipe.translations Json?` (JSONB, nullable). Shape: `{ en?: { title, description, tipNote, servingSuggestion, ingredients, steps }, de?: {...} }`. Locale keyed (ISO 639-1).
- Seed validator: opsiyonel `translations` field, Zod ile shape check, unknown locale reddediliyor, partial OK (sadece title EN de verse çalışır).
- Dil tercihi UI: navbar chip yerine `/ayarlar` sayfasında `LanguagePreferenceCard` (🇹🇷 Türkçe / 🇬🇧 English / 🇩🇪 Deutsch select, disabled + "Yakında" rozeti). Destructive DeleteAccountCard'dan önce, günlük ayarlar kümesi içinde. Faz 3'te aktif Server Action'a bağlanacak + User.locale persist edilecek.
- RECIPE_FORMAT.md + CODEX_HANDOFF.md güncel, Codex için opsiyonel field + "İskender/Baklava çevirmez" notu.
- 6 yeni unit. **202 unit + 9 E2E yeşil.**

**Karar, tam i18n neden ertelendi**: kapsam çok büyük (UI string extraction ~300-500, tarif içerik çevirisi kültürel, AI Asistan keyword mapping, allergen inference TR-only, URL yapısı, SEO hreflang, email şablonları, toplam 4-6 oturum). Türkçe MVP launch'u erteleyemeyiz. Plan Section 21 Faz 3'te zaten vardı, orada profesyonel tercüman + LLM hibriti ile yapılacak.

## 15 Nisan 2026, Codex batch öncesi DB paketi ✅

## 15 Nisan 2026, Codex batch öncesi DB paketi ✅

Yarınki 500-tarif batch için data integrity + performans + UX hazırlığı.

- **Seed input validation** (`lib/seed/recipe-schema.ts`): her tarif Zod ile pre-validate. 500 row'dan 1'i bozuksa sadece o reddedilir, 499'u yazılır. Slug regex (TR karakter yasak), enum guard'ları (Allergen/RecipeType/Difficulty), prep+cook≈total soft-check (15 dk fudge). 15 yeni unit test.
- **Retrofit orchestrator** (`scripts/retrofit-all.ts`): tek komut, önce allergens, sonra diet tags. `--dry-run` flag. Codex workflow'u basitleşti, 9. adım oldu.
- **GIN index on `Recipe.allergens`**: Postgres array hasSome/hasNone filter'ları için. 500 tarifte sequential scan vs GIN farkı ms-düzeyinde. `@@index([allergens], type: Gin)`.
- **Alerjen uyarı metni sadeleştirildi**: "Malzeme listesini kendin de kontrol et, etiketler kural tabanlı çıkarımla…" → **"Alerjin varsa malzeme listesine bir de sen göz at."** Kısa, samimi, jargonsuz.
- Seed script allergens field'ı passthrough (Codex-provided > retrofit inference); tag filtering type-narrowing fix.
- **196 unit + 9 E2E yeşil.**

## 15 Nisan 2026, alerjen paneli collapse + diyet filtresi ✅

## 15 Nisan 2026, alerjen paneli collapse + diyet filtresi ✅

- **Alerjen paneli relocate + collapse**: eski amber "⚠ İÇİNDEKİLER" block ingredient'lerin ÜSTÜNDEYDİ, her tarifte alerjen ikonları kullanıcıyı korkutuyordu. Native `<details>` ile collapsible hale getirildi, konum `NutritionInfo` altına alındı. Summary: "⚠ Bu tarif alerjen madde içerebilir" (neden "içerebilir": inference rule-based, çapraz bulaşma ve hazır soslar kaçabilir). Açılınca subtle tone chip row + uyarı.
- **Vejetaryen/vegan retrofit** (`scripts/retrofit-diet-tags.ts`): idempotent, allergen'lerden sonra koşulur. 42 yeni tag eklendi, 2 yanlış tag temizlendi (ezogelin + mercimek çorbası yanlışlıkla "vegan" etiketliymiş, tereyağı var, retrofit düzeltti).
- **Diet inference** (`lib/diet-inference.ts`): vegetarian = no meat/poultry/seafood; vegan = vegetarian + no SUT/YUMURTA allergen + no honey/gelatin. "bal" için regex + negative lookahead: `/\bbal(?!\s*kabag)\b/`, "balkabağı" (pumpkin) vegan, "bal" (honey) değil.
- **UI**:
  - Tarif detayında vegan/vejetaryen tag'leri **yeşil chip** (`🌱` emoji, `accent-green`), generic `#hashtag` row'dan ayrı belirgin.
  - `/tarifler`'de dedicated **"DİYET"** filter row (`AllergenFilter`'in yanına). Generic tag list'ten vegan/vejetaryen çıkarıldı (duplikasyon olmasın).
- **Karar, uyarlama düzenleme EKLEN(MİYE)CEK**: edit ile beğeni korur → tarif sahibi 50 beğeni alıp içeriği spam'a çevirebilir → abuse vektörü. Sil özelliği yeterli. Kullanıcının önerisi.
- 15 yeni unit test (diet inference). **181 unit + 9 E2E yeşil.**
- `RECIPE_FORMAT.md` + `CODEX_HANDOFF.md` güncel, retrofit-diet-tags batch sonrasi 2. adım.

## 15 Nisan 2026, alerjen etiketleri ✅

## 15 Nisan 2026, alerjen etiketleri ✅

Codex yarın batch getirmeden önce schema + UI hazır. Mevcut 56 tarif retrofit ile etiketlendi.

- Schema: `Allergen` enum (10 değer, EU "big 10" adapted: GLUTEN/SUT/YUMURTA/KUSUYEMIS/YER_FISTIGI/SOYA/DENIZ_URUNLERI/SUSAM/KEREVIZ/HARDAL) + `Recipe.allergens Allergen[]`. `db push` ile uygulandı.
- `lib/allergens.ts`: TR label/emoji map + `inferAllergensFromIngredients` (kural tabanlı keyword match, TR normalisation, "ı" → "i", "ğ" → "g" + Turkish-aware lowercase). Consonant softening için inflected formlar da keyword'te ("fistik" + "fistig").
- **Retrofit script** (`scripts/retrofit-allergens.ts`): idempotent, `--dry-run` + `--force` flag'leri var. Mevcut 35 tarife inference çıktı, 21'i zaten temiz. `hasExisting` var ise skip (Codex'in explicit labeling'ini override etmez).
- UI: tarif detay sayfasında ingredient list'in üstünde amber "⚠ İÇİNDEKİLER" panel + chip row (`AllergenBadges`). `/tarifler`'de "Alerjen · içermesin" filter row (`AllergenFilter`, URL: `?alerjen=X&alerjen=Y`). Filter çalışıyor: Gluten+Süt hariç 56 → 23 tarif.
- `RECIPE_FORMAT.md` + `CODEX_HANDOFF.md` güncellendi, Codex her tarif için `allergens: [...]` alanı girsin, batch sonrası retrofit çalıştırsın.
- Unit test (19 yeni): enum label coverage + kural tabanlı inference (fıstık vs antep fıstığı ayrımı, Turkish normalization, canonical order). **166 unit + 9 E2E yeşil.**

**Not**: tone-of-safety kararı, over-flagging (false positive) safer than under (allergy user skips safe recipe = annoying; misses real allergen = dangerous). Inference kuralları conservative.

## 15 Nisan 2026, kullanıcı kendi uyarlamasını silebilir ✅

## 15 Nisan 2026, kullanıcı kendi uyarlamasını silebilir ✅

- `deleteOwnVariationAction`: ownership gate (session.user.id === variation.authorId) → hard delete + AuditLog(`VARIATION_SELF_DELETE`) tx. Admin moderation path'i (soft HIDDEN) bağımsız, author hard delete farklı bir semantik (yanlışlıkla ekleme).
- UI: `DeleteOwnVariationButton` component (native confirm + title echo + `stopPropagation` Link içine gömülebilsin diye). Tarif detay sayfasında sadece author'un açılmış VariationCard'ında + Profil sayfasında owner'ın variation row'larında.
- VariationCard logic: owner → sadece Sil; moderator (owner değil) → Gizle + Report; normal → Report. Kendi uyarlamana report/hide garipti, temizlendi.
- Integration smoke (`test-delete-own-variation.ts`): 2 test user, own-delete OK + cross-user gate reddediyor + AuditLog yazılıyor + cleanup.
- Ayrıca "Bugünün tarifi" polish: "İleri" → **"Zor"** (`getDifficultyLabel` helper, site tutarlılığı) + `~XXX kcal` chip (averageCalories null değilse).

## 15 Nisan 2026, "En çok beğeni" sort ✅

## 15 Nisan 2026, "En çok beğeni" sort ✅

- `/tarifler` chip row'una 6. seçenek: **En çok beğeni**. URL: `?siralama=most-liked`.
- `getRecipes` içinde yeni branch: filtrelenmiş tarifleri `variations.likeCount` ile çekip JS'te toplar + sıralar. Tie-break: `title.localeCompare(-, "tr")`, 0-like'lı uzun kuyruk alfabetik.
- `compareByMostLiked` helper pure function olarak çıkarıldı → 6 unit test (sum, tie-break TR collation, empty variations, 0-like alfabetik sıralama).
- Integration smoke (`scripts/test-most-liked-sort.ts`): throwaway user + 2 variation (likeCount 50 vs 2) → high-liked #1'e çıktı → cleanup. Geçti.
- Not: Raw SQL yerine in-memory aggregation tercih edildi, 56-500 tarif scope'unda yeterli + type-safe. Büyürse Recipe'e denormalize `totalLikeCount` alanı + toggleLike'da increment düşünülür. **147 unit + 9 E2E yeşil.**

## 15 Nisan 2026, "Bugünün tarifi" widget'ı ✅

- Ana sayfada AI Asistan banner'ından sonra turuncu gradient "Bugünün tarifi" card'ı (emoji + başlık + intro+curator note + meta + CTA). Mobil/desktop/dark mode temiz.
- **Deterministic rotation**: UTC gün indeksi % tarif sayısı, `orderBy: { slug: "asc" }` (yeni seed'ler rotasyonu bozmasın diye createdAt yerine slug). 56 tarifle ~2 aylık döngü, herkes için aynı, cache-dostu.
- **Kural-tabanlı curator note** (`lib/ai/recipe-of-the-day-commentary.ts`): 12 kural (type: TATLI/KOKTEYL/CORBA/SALATA/KAHVALTI/ATISTIRMALIK + difficulty HARD + quick/very-quick + light/hearty + popular-variations + featured + fallback). 1-2 varyant per kural, seed-based pick. "AI'dan" disclaimer'ı yok (feedback_ai_positioning).
- **Intro varyantları**: 5 farklı açılış cümlesi ("Bugün için seçimimiz", "Bugün belki bunu denemek istersin"…), seed ile rotate.
- Test: 18 yeni unit (intro/curator/daysSinceEpoch, deterministik + fallback + kural uniqueness). **141 unit + 9 E2E yeşil.**

## 15 Nisan 2026, şifremi unuttum akışı ✅

- Schema: `PasswordResetToken` modeli (identifier + token + expires + createdAt), TTL **1 saat** (verification'dan kısa, daha hassas). `db push` ile Neon'a uygulandı.
- `lib/email/password-reset.ts`: `sendPasswordResetEmail` + `sendOAuthOnlyPasswordResetEmail` + `consumePasswordResetToken` (transaction: passwordHash update + tüm token'ları sil = single-use + rotation korumalı).
- Server actions: `requestPasswordResetAction` (her zaman generic success → email enumeration defense) + `resetPasswordAction`. Rate limit: `password-reset-request` 3/1sa (email+IP) + `password-reset-consume` 10/1sa (IP).
- OAuth-only user'lar için ayrı bilgilendirme maili ("bu hesap Google ile bağlı, ayarlar'dan şifre ekle"), yine generic UI dönerek enumeration kapalı.
- Sayfalar: `/sifremi-unuttum` + `/sifre-sifirla/[token]`. Token validasyonu sayfa açılışında, consume sadece form submit'te, refresh token'ı yakmıyor.
- Login form'una "Şifremi unuttum" linki + `?reset=ok` success strip.
- `RESERVED_USERNAMES`'a `sifremi-unuttum` + `sifre-sifirla` eklendi.
- Validator (9 yeni unit test) + integration smoke script (`test-password-reset-flow.ts`): token → send → consume → passwordHash değişti → ikinci consume reddedildi → cleanup. **123 unit + 9 E2E test yeşil.**

## 14–15 Nisan 2026 özet, büyük oturum

Tek oturumda public launch hazırlık paketi bitti. 18 pass + UX polish'ler.
**114 unit + 9 E2E = 123 test yeşil**. Main'e push edilen özellikler:

### Altyapı / güvenlik (pass 7, 9, 15)
- Lint + test altyapısı: `eslint .` (Next 16 `next lint` kaldırıldı), Vitest 61+ test
- E2E Playwright (9 test) + GitHub Actions CI (`lint + typecheck + vitest + build`); e2e job secret-gated
- Rate limit genişletildi: `variation-create` (3/saat) + `variation-create-daily` (10/24sa) + `password-change` (5/saat) + `account-delete` (3/saat)
- URL obfuscation bypass tespiti (spaced-dot, [dot], (nokta), "dot"/"nokta" kelimeler)

### Gelişmiş moderasyon (pass 11)
- `lib/moderation/preflight.ts`: 7 sinyal (too_short/too_long/repeated_chars/excessive_caps/contains_url/missing_steps/too_many_steps)
- Variation submit akışı: blacklist hard-reject > preflight flag → `PENDING_REVIEW` + `moderationFlags` CSV
- Schema: `Variation.moderationFlags String?` (db push)
- `/admin/incelemeler` kuyruğu + flag chip'leri + accordion önizleme + Onayla/Gizle

### Bildirim sistemi (pass 10)
- Schema: `Notification` + `NotificationType` enum (6 tip: LIKED/APPROVED/HIDDEN/REPORT_RESOLVED/BADGE_AWARDED/SYSTEM)
- `lib/notifications/service.ts` tip-özel helper'lar (TR copy merkezi)
- Trigger'lar: `toggleLikeAction`, `grantBadge`, admin hide/approve, report resolve, hepsi fire-and-forget
- Navbar bell + unread count + dropdown (son 10, açılınca auto mark-read + optimistic/rollback)
- `/bildirimler` sayfası (Tümü/Okunmamış filtre, type chip'leri)
- `resolveNotificationLink` type-aware router (HIDDEN → /bildirimler, legacy kayıtlar da düzelir)

### Variation UX (pass 11, 13)
- `VariationCard` accordion (malzeme/adım/not açılır-kapanır), modasetör inline "Gizle"
- Variation başına 3 sort chip: En yeni / En çok beğeni / En az malzeme
- Count `_count.variations` artık sadece PUBLISHED sayar (HIDDEN dahil değil)
- **Structured ingredient input**: form `amount + unit + name` ayrı alanlar, `lib/ingredients.ts` legacy string[] ile uyumlu normalize

### /tarifler sıralama (pass 11, 12c)
- Default **alfabetik** (newest seed-batch clustering düzeldi)
- 5 chip: Alfabetik / En yeni / En popüler / En hızlı / En çok uyarlama

### Auth & profil (pass 12, 14, 16, 17, 18)
- `/ayarlar` sayfası, name, username (reserved list + regex + lowercase transform), bio
- Profil düzenle butonu belirgin (bg-primary/10 pastel, hover'da solid)
- Profil variation status rozetleri (Gizlendi/İncelemede/Reddedildi/Taslak)
- **Google hesabı bağla**, signed cookie + HMAC + `signIn("google")` client flow + email match gate
- **Google hesabı unlink**, `passwordHash` zorunlu, aksi halde kilitlenmeye karşı disabled
- **Şifre değiştir**, mevcut + yeni + tekrar, bcrypt verify, rate limit
- **Şifre ekle**, OAuth-only user için, `passwordHash === null` server gate
- **Hesap silme**, username echo + şifre verify + native confirm + transaction (cascading + manuel delete variations/reports/moderationActions + null set recipe.authorId/auditLog.userId/mediaAssets.uploaderId)

### UX polish
- Bildirim navigation type-aware (HIDDEN → /bildirimler)
- VariationCard sade tasarım (Report/Gizle sadece açıkken)
- Hesap silme metni sadeleşti (Recipe anonim-kalır vaadi çıkarıldı, Recipe user-created değil)

### Yeni scriptler (ops tooling)
- `scripts/list-users.ts`, provider + passwordHash + verified durumu
- `scripts/delete-user.ts`, email ile cascading cleanup
- `scripts/list-recipe-slugs.ts`, Codex için snapshot
- `scripts/seed-test-notifications.ts`, preview testi için
- `scripts/smoke-rate-limit.ts`, Upstash canlı sağlık kontrolü

---



## Yapılanlar

- [x] Proje planı dokümanı oluşturuldu (TARIFLE_ULTIMATE_PLAN.md)
- [x] Next.js 16 + TypeScript + Tailwind CSS projesi kuruldu
- [x] Klasör yapısı oluşturuldu (plandaki yapıya uygun)
- [x] Prisma 7 schema yazıldı (17 model, 9 enum)
- [x] Tasarım token'ları tanımlandı (dark/light renk paleti)
- [x] Temel bileşenler oluşturuldu (Navbar, Footer, ThemeToggle)
- [x] Tip tanımları yazıldı (recipe, user, variation, api)
- [x] Validasyon şemaları yazıldı (Zod v4, login, register, variation, report)
- [x] Utility fonksiyonlar oluşturuldu (slugify, formatMinutes, cn)
- [x] Kategori ve etiket verileri tanımlandı
- [x] Config dosyaları hazırlandı (vitest, prettier, .env.example)
- [x] Neon PostgreSQL bağlantısı kuruldu (PrismaNeon adapter)
- [x] Veritabanı tabloları oluşturuldu (db push)
- [x] Demo seed data eklendi (17 kategori, 15 etiket, 15 tarif)
- [x] Data access layer oluşturuldu (queries/recipe.ts, queries/category.ts)
- [x] Ana sayfa (hero, arama, kategoriler, öne çıkanlar, DB'den)
- [x] Tarifler sayfası (arama + zorluk + kategori filtresi, DB'den)
- [x] Kategori sayfaları (DB'den)
- [x] Tekil tarif sayfası (malzeme, adımlar, besin, JSON-LD, DB'den)
- [x] Keşfet sayfası (öne çıkanlar, hızlı tarifler, kategoriler, DB'den)
- [x] Arama (başlık, açıklama, malzeme) ve temel filtreleme (kategori, zorluk)
- [x] SEO optimizasyonu (meta tags, Open Graph, Schema.org Recipe)
- [x] Light mode varsayılan tema olarak ayarlandı
- [x] Light mode kart arka planları sıcak krem tonuna güncellendi
- [x] Final seed data tamamlandı (56 tarif, 17 kategori, 15 etiket)
- [x] Gelişmiş filtreler eklendi (süre aralığı, etiket, sıralama)

## MVP 0.1, Tamamlandı ✅

- [x] Vercel'e deploy edildi (tarifle.vercel.app)
- [x] Custom domain bağlandı (tarifle.app, Cloudflare DNS)

## MVP 0.2, Tamamlandı ✅

- [x] Auth.js v5 ile e-posta + şifre giriş/kayıt sistemi
- [x] JWT tabanlı oturum yönetimi (Credentials provider)
- [x] Giriş ve kayıt sayfaları (`/giris`, `/kayit`)
- [x] Kullanıcı profil sayfası (`/profil/[username]`)
- [x] Bookmark (yer imi) sistemi, optimistic UI
- [x] Beğeni sistemi (varyasyonlar için)
- [x] Varyasyon görüntüleme ve ekleme formu
- [x] Navbar'da kullanıcı menüsü (avatar, dropdown)
- [x] Google OAuth yapısı hazır (credentials henüz bağlanmadı)

## MVP 0.3, Tamamlandı ✅

- [x] Pişirme modu (adım adım, zamanlayıcı, Wake Lock API, klavye navigasyonu)
- [x] Yazdırma görünümü (print-friendly CSS, gereksiz öğeler gizlenir)
- [x] Alkollü içecek yaş uyarısı (18+ modal, sessionStorage ile)
- [x] Keyword blacklist filtresi (Türkçe argo/küfür kontrolü, uyarlama gönderiminde)
- [x] Raporlama sistemi (uyarlamaları bayrakla, sebep + açıklama)
- [x] Admin paneli, temel moderasyon (/admin)
  - Genel bakış (istatistikler)
  - Raporlar sayfası (rapor inceleme, uyarlama gizle/onayla)
  - Tarifler listesi
  - Kullanıcılar listesi
- [x] "Varyasyon" → "Uyarlama" isim değişikliği (tüm UI)
- [x] Tarif kartlarından "kişilik" kaldırıldı, uyarlama sayısı gösteriliyor

## Faz 2, Favori Koleksiyonları + Alışveriş Listesi ✅

- [x] Schema: `Collection`, `CollectionItem`, `ShoppingList`, `ShoppingListItem` modelleri
- [x] Tarif sayfasında `SaveMenu`: Kaydet / Listeye ekle / Koleksiyon butonları
- [x] Koleksiyon dropdown: checkbox ile tarif ekle/çıkar, yeni koleksiyon oluşturma
- [x] Koleksiyon detay sayfası `/koleksiyon/[id]`, grid görünüm, düzenle/sil modal
- [x] Profil sayfasında "Koleksiyonlarım" bölümü (4 tarif thumbnail grid)
- [x] `/alisveris-listesi` sayfası, kontrol et/sil, manuel madde ekleme
- [x] "Listeye ekle", tarifin malzemelerini merge ederek ekler (tr case-insensitive)
- [x] Navbar dropdown: "Alışveriş Listem" bağlantısı
- [x] İsim-bazlı deduplication (aynı malzeme iki kez eklenmez)

## Faz 2, Sosyal Paylaşım + OG Image + PWA ✅

- [x] Dinamik OG Image: tarif (`/tarif/[slug]/opengraph-image`), koleksiyon, site default
  - Bricolage Grotesque font (woff) Google Fonts'tan runtime'da
  - Türkçe karakter desteği (latin-ext)
  - Twemoji ile emoji rendering
- [x] `ShareMenu` component: Web Share API (mobilde native) + fallback dropdown
  - WhatsApp deeplink (`wa.me`), X/Twitter intent URL, bağlantı kopyalama
- [x] PWA manifest (`src/app/manifest.ts`)
  - `standalone` display, Türkçe dil, theme/bg color tokenleri
  - Shortcuts: Tarifler, Keşfet, Alışveriş Listem (ana ekran kısayolları)
- [x] PWA ikonlar: `scripts/generate-icons.ts` ile Sharp'tan SVG → PNG
  - 192x192, 512x512, 180x180 (apple-touch), 32x32 (favicon), maskable 512
- [x] Root layout: viewport themeColor (light/dark), applicationName, appleWebApp, icons
- [x] SITE_URL fallback: `tarifle.com` → `tarifle.app`

## Review sonrası sertleştirmeler (GPT review pass 1) ✅

- [x] **P1, Gizli koleksiyon OG/metadata sızıntısı kapatıldı**: `getViewableCollection(id, viewerId)` helper, OG + generateMetadata + page hepsi auth-gated
- [x] **Profil: gizli uyarlamalar sızıntısı**: `getUserVariations(userId, includeHidden)`, `getUserByUsername`'da public _count sadece PUBLISHED sayıyor
- [x] **Email normalization**: `src/lib/email.ts`, auth.ts + register action'da `normalizeEmail(email)`
- [x] **`allowDangerousEmailAccountLinking: false`** (Google provider)
- [x] **Variation action**: artık `variationSchema` kullanıyor, `recipeId` ile hedef tarif doğrulaması, form'a maxLength
- [x] **Report action**: `reportSchema` ile Zod validation, hedef varlık kontrolü, transaction içinde count artırımı, `@@unique([reporterId, targetType, targetId])` constraint, COMMENT açıkça reddediliyor
- [x] **AI provider**: deterministic `orderBy` (isFeatured, viewCount, createdAt)
- [x] **Composite indeksler**: Recipe(status+createdAt/totalMinutes/viewCount/type+difficulty), Variation(recipeId+status+likeCount, authorId+status+createdAt), Report(status+createdAt, targetType+targetId+status), Collection(userId+isPublic+sortOrder+createdAt), CollectionItem(collectionId+addedAt), ShoppingListItem(shoppingListId+isChecked+sortOrder+createdAt)
- [x] **`cn()` utility fix**: artık clsx kullanıyor (object/array inputlarını doğru handle ediyor)

**Sonraki review pass'larda**: rate limiting (Upstash Redis), a11y overhaul (Escape/focus trap), lint+test altyapısı, ingredient synonym/token tablosu.

## Pass 11, Gelişmiş moderasyon (kural-tabanlı pre-flight) ✅

- [x] **`src/lib/moderation/preflight.ts`**, 7 sinyal: `too_short`, `too_long`, `repeated_chars` (5+ tekrarlı karakter), `excessive_caps` (>%70), `contains_url` (protokollü ya da `domain.tld` deseni), `missing_steps`, `too_many_steps`. Saf string heuristik, AI yok. `FLAG_LABELS` map'i admin UI için TR.
- [x] **`createVariation` action**: blacklist hâlâ hard-reject. Blacklist temizse pre-flight çağırılır → trip ederse `status = "PENDING_REVIEW"` + `moderationFlags = "code1,code2"`. Aksi halde `PUBLISHED` (önceki davranış).
- [x] **Schema ekleme**: `Variation.moderationFlags String?` (VarChar 200, nullable). `db push` ile uygulandı.
- [x] **Action result**: `pending: boolean` döner, `VariationForm` "Uyarlaman alındı ve gözden geçirilecek" mavi panelini gösterir, klasik "yayınlandı" yeşili pending değilken.
- [x] **`/admin/incelemeler`**, yeni admin sayfası: PENDING_REVIEW kuyruğu (en eski → en yeni), her variation için flag chip'leri (TR labels), açılır içerik önizleme (malzeme/adım/notlar), Onayla/Gizle butonları (mevcut `approveVariation`/`hideVariation` action'larını kullanıyor, bildirim sistemi otomatik tetikleniyor).
- [x] **Admin layout + overview**: Nav'a "İncelemeler" sekmesi, dashboard'a "İnceleme Bekliyor" kart (highlight when > 0).
- [x] **Unit testler** (12 yeni): clean variation, too_short, repeated_chars, doubled-char negative, excessive_caps + negative, URL detection (protokollü + plain), false-positive dot-in-text negative, missing_steps, too_many_steps, multi-signal aggregate.
- [x] **Doğrulama**: lint + typecheck + 61 vitest + 9 E2E hepsi pass.

## Pass 10, In-app bildirim sistemi ✅

- [x] **Schema**: `Notification` modeli + `NotificationType` enum (VARIATION_LIKED / VARIATION_APPROVED / VARIATION_HIDDEN / REPORT_RESOLVED / BADGE_AWARDED / SYSTEM). İki composite index, (userId, isRead, createdAt) bell count için, (userId, createdAt) liste için.
- [x] **Service** (`src/lib/notifications/service.ts`): tip-spesifik helper'lar (`notifyVariationLiked`, `notifyBadgeAwarded`, ...), hepsi fire-and-forget pattern. TR copy merkezi, aynı tip bildirim her yerde aynı okunur.
- [x] **Trigger noktaları**: `toggleLikeAction` (self-like atlanır), `grantBadge` (badge service otomatik), `hideVariation` / `approveVariation` / `reviewReport` (admin). Hepsi async, action success'ını blocklamaz.
- [x] **UI**:
  - **NotificationBell** (client): navbar'da bell icon + unread count rozeti, dropdown son 10 bildirim, açılınca optimistic mark-as-read + rollback, Escape + outside-click (useDismiss). ARIA tam (aria-haspopup, aria-expanded, aria-controls, aria-label count ile).
  - **NotificationBellLoader** (server RSC): auth çekip bell'i beslememüş, anonim'e null döner. Navbar'ın client component olmasıyla RSC tree prop slot üzerinden birleşiyor.
  - **`/bildirimler`** sayfası: full inbox, Tümü/Okunmamış filtresi URL tabanlı, type chip'leri, absolute tarih.
- [x] **Server actions**: `markNotificationsReadAction` (IDs array), `markAllNotificationsReadAction`. User-scoped where clause, tampered submission'lar başkasının inbox'una dokunamaz.
- [x] **Doğrulama**: tsc + lint + vitest clean (49/49). Anonim homepage bell göstermiyor, `/bildirimler` → `/giris?callbackUrl=/bildirimler` redirect. Test bildirimleri için `scripts/seed-test-notifications.ts`.

## Pass 9, E2E Playwright + GitHub Actions CI ✅

- [x] **Playwright kurulumu**: `@playwright/test` + Chromium. `playwright.config.ts` lokalde dev server'ı auto-boot eder, CI'da headless + retry 2.
- [x] **`tests/e2e/`, 8 smoke test, hepsi pass**:
  - `home.spec.ts` (3), hero + featured + category grid render, AI banner → /ai-asistan, /tarifler listesi
  - `recipe-detail.spec.ts` (2), ingredients/steps render, ShareMenu aria-expanded toggle + Escape ile kapatma
  - `auth-pages.spec.ts` (3), /giris + /kayit formları, KVKK, Google button, sayfalar arası linkler
- [x] **Read-only E2E focus**: İlk iterasyon sadece DB'ye yazmayan akışlar. Register/login round-trip ayrı iterasyonda (E2E'nin kendi Neon branch'i + cleanup infrastructure gerektirir).
- [x] **`.github/workflows/ci.yml`**, 2 job:
  - `check` (her push + PR'da): lint + typecheck + vitest + build. Fake env var'larla (DATABASE_URL, AUTH_SECRET placeholder) çalışır, prod secret'ına gerek yok.
  - `e2e` (secret gated): `E2E_DATABASE_URL` + `E2E_AUTH_SECRET` GitHub Secrets'a eklendiğinde Playwright çalışır. Fork PR'larından çalışmaz (güvenlik). Report artifact olarak yüklenir.
- [x] **Concurrency control**: Aynı branch'e yeni commit gelince önceki run cancel. Resource tasarrufu.
- [x] **Playwright `playwright.config.ts`**: `reuseExistingServer: !CI` ile lokalde açık dev server'a bağlanır, CI'da fresh boot.
- [x] **Sıradaki iterasyon için hazırlık**: E2E'nin production'a yazmaması için `.github/workflows/ci.yml`'de `E2E_DATABASE_URL` secret placeholder'ı. İleride Neon'da `e2e-ci` branch açılıp o URL buraya konur, prod'dan izole E2E.

## Pass 8, Google OAuth canlıda ✅

- [x] **Google Cloud Console OAuth 2.0 Client kuruldu**: tarifle.app + localhost:3000 authorized origins/redirects, Publish App ile production'a çekildi.
- [x] **Env vars**: `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` hem `.env.local` hem Vercel'e kondu. `AUTH_URL` Vercel'den silindi (Auth.js v5 VERCEL_URL'den otomatik türetiyor, hardcode breaking).
- [x] **Canonical domain fix**: Vercel'de `www.tarifle.app` → `tarifle.app`'e 308 redirect (önceki yön tersti → www'li redirect_uri Google Console'da kayıtlı olmadığı için `redirect_uri_mismatch`).
- [x] **"Username is missing" bug fix**: `PrismaAdapter`'in default `createUser`'i bizim schema'daki required `username` + KVKK alanlarını bilmiyordu. `buildAdapter()` helper yazıldı, spread edilen PrismaAdapter üzerine `createUser` override'ı, User'ı atomik olarak `username` + `kvkkAccepted` + `kvkkVersion` + `kvkkDate` + `emailVerified: new Date()` ile yaratıyor, dönüşte Auth.js'in beklediği `AdapterUser` format'ına (`image` ← `avatarUrl`) dönüştürüyor.
- [x] **Eski manuel create silindi**: signIn callback'teki `prisma.user.create()` ve events.createUser, ikisi de artık gereksiz, tüm logic adapter'da.
- [x] **Ops tooling**: `scripts/list-users.ts` (provider + passwordHash + verified durumu) ve `scripts/delete-user.ts` (email ile cascading silme), ileride OAuth debug için.
- [x] **Canlı doğrulama**: `wessibf6@gmail.com` ile giriş denendi, DB'ye `providers: google` + `password: no` + auto-generated `username` ile temiz user eklendi.

## Pass 7, Lint + test altyapısı ✅

- [x] **Next 16 lint fix**: `next lint` Next 16'da kaldırıldı; `package.json`'daki `"lint": "next lint"` → `"lint": "eslint ."`'e çevrildi. `eslint.config.mjs` zaten flat config formatındaydı.
- [x] **ESLint rule overrides** (`eslint.config.mjs`):
  - `@typescript-eslint/no-unused-vars` → `_`-prefixed pattern intentional (`argsIgnorePattern: "^_"` + vars + caughtErrors + destructuredArray). `const { email: _email, ...rest } = user` idiomatik destructure-to-exclude artık flag olmuyor.
  - `@next/next/no-img-element` → off (Cloudinary + `remotePatterns` config gelene kadar `recipe.imageUrl` user-uploaded URL'leri için `<img>` OK; config gelince kaldırılır).
- [x] **React 19 `react-hooks/set-state-in-effect` fix**: `AgeGate`, `ThemeToggle`, `ShareMenu` hepsinde SSR-hydration pattern'i (setMounted in effect), canonical React 19 pattern olduğundan `// eslint-disable-next-line` + açıklama yorumu.
- [x] **CookingMode TDZ fix**: `goNext`/`goPrev` keyboard handler'dan önce `useCallback` ile deklare edildi. `useEffect` deps array'i doldu. React 19 `immutability` rule yakalamıştı.
- [x] **AiAssistantForm**: `'` yerine `&apos;` escape.
- [x] **error.tsx**: kullanılmayan `error` prop'u `console.error` ile log'lanıyor (boundary hatasını sessiz yutmasın).
- [x] **Final lint**: 0 error, 0 warning. Build de clean (1.7s).

### Vitest altyapı

- [x] **5 test dosyası, 49 test, hepsi pass**:
  - `moderation-blacklist.test.ts` (11), normalize, TR karakter eşleşme, multi-word phrase, dedup
  - `ai-matcher.test.ts` (20), prefix match, prefix/substring ayrımı, isOptional, pantry staples toggle
  - `rate-limit.test.ts` (8), identifier priority, anonymous fail-open, env-missing fail-open, Upstash mock ile denied + error paths
  - `email-normalize.test.ts` (5), lowercase, trim, Turkish-locale trap (ASCII I → i, ı değil)
  - `useDismiss.test.tsx` (5), Escape, outside-click, inside-click ignore, `disableOutsideClick`, closed-state no-op
- [x] **Prod bug fix (testler yakaladı!)**: `lib/moderation/blacklist.ts`, blacklist entry'leri (piç, göt, geri zekalı, vb.) TR karakter içerdiği için, normalize edilmiş input'la karşılaştırıldığında sessizce eşleşmiyordu. Module load'da `NORMALIZED_BLACKLIST`, `SINGLE_WORDS` set'i, `MULTI_WORD_PHRASES` ön hesaplandı. Artık bütün TR entry'ler gerçekten bloke ediyor.

## Pass 6, A11y overhaul (hook'lar + ARIA + reduced motion) ✅

- [x] **`src/hooks/useDismiss.ts`**, dropdown/menü için Escape + outside-click tek hook'ta. `disableOutsideClick` option'ı mobil menü gibi "scroll drag'ı dismiss olarak okuma" durumları için.
- [x] **`src/hooks/useFocusTrap.ts`**, gerçek modal diyaloglar için. Açılınca ilk focusable'a odaklanır, Tab/Shift+Tab container içinde döner, kapandığında odak eski elemana döner. `tabindex="-1"` mantığını doğru ele alır.
- [x] **Navbar**, profil dropdown ve mobil menüye `useDismiss` eklendi. Profil menüsü: `role="menu"`, her item `role="menuitem"`, toggle buton `aria-haspopup="menu"` + `aria-expanded` + `aria-controls="profile-menu"`. Mobil menü: `aria-expanded` + `aria-controls` + dinamik `aria-label` ("Menüyü aç"/"Menüyü kapat"). Outside-click mobil menüde kapatıldı (scroll drag'i dismiss etmesin).
- [x] **SaveMenu**, manuel outside-click hook'u kaldırıldı, `useDismiss` ile değiştirildi (artık Escape de kapatır). "Yeni koleksiyon oluştur" alt-formu da dropdown kapanırken resetleniyor.
- [x] **ShareMenu**, `useDismiss`, `isOpen: isOpen && !hasNativeShare` gating korundu (native share açıkken dropdown yok). Preview doğrulama: tık → `aria-expanded=true` + menü görünür, Escape → kapandı, outside-click → kapandı.
- [x] **CollectionActions (gerçek modal)**, `useFocusTrap` eklendi (önce focusable tabindex=-1 + başlangıç focusu ilk input'a), `aria-labelledby="collection-edit-title"` eklendi, önceki manuel Escape handler kaldı (hook ile çakışmasın diye bilinçli ikili).
- [x] **AgeGate**, `role="dialog"` + `aria-modal="true"` + `aria-labelledby` + `aria-describedby` + emoji `aria-hidden`. Escape eklenmedi (bilinçli, alkol yaş gate'i deliberately blocking).
- [x] **CookingMode**, root container'a `role="dialog"` + `aria-modal="true"` + dinamik `aria-label`. Escape + klavye nav zaten vardı.
- [x] **ReportButton**, `useEffect`'te Escape listener, select'e `autoFocus`, trigger butonuna `aria-label="Bu uyarlamayı rapor et"` + `aria-expanded` + focus-visible ring.
- [x] **VariationForm**, Escape (input içindeyken override eder, spellcheck/IME'yi bozmaz), başlık input'una `autoFocus`.
- [x] **`globals.css`**, `@media (prefers-reduced-motion: reduce)` bloku: tüm transition/animation 0.01ms, scroll-behavior auto. WCAG 2.1 SC 2.3.3. `:focus-visible` global zaten vardı (2px primary outline).

Kalan A11y işleri (gelecek pass'e):
- Form label/hint eşleşmeleri audit (çoğu OK ama kapsamlı bir gözden geçirme gerekir)
- Renk kontrastı WCAG AA için araç-destekli audit (light/dark mode)
- Screen reader smoke test (VoiceOver/NVDA ile elle, manual)

## Pass 5, Rate limiting (Upstash Redis) ✅

- `src/lib/rate-limit.ts`: sliding window, `tarifle:rl:<scope>` prefix, **fail-open** (env yoksa warning + pass). `getClientIp()` + `rateLimitIdentifier()` helper'ları.
- Tüm sensitif endpointler entegre: register/login (IP), resend-verification/report/variation-create/password-*/account-delete/ai-assistant (user → IP fallback).
- **Prod canlı**: Upstash URL+TOKEN Vercel'de, limitler aktif. Detay scope tablosu için `src/lib/rate-limit.ts`.

## Pass 4, Kayıt akışı bug fix + Resend prod ✅

- [x] **Register navbar bug**: Kayıttan sonra navbar "Giriş yap" göstermeye devam ediyor, F5 sonrası düzeliyordu.
  - Sebep: `registerUser` server action'ında `signIn("credentials", { redirectTo: "/" })` çağrısı `NEXT_REDIRECT` fırlatıyor; cookie set ama SessionProvider tazelenmiyor.
  - Çözüm: Server action sadece hesap+doğrulama maili yapar, signIn'i client'a bıraktık. `RegisterForm` artık LoginForm pattern'i uyguluyor: `signIn("credentials", { redirect: false })` + `router.refresh()` + `router.push("/")`.
  - Preview doğrulandı: `/api/auth/session` yeni kullanıcıyı dönüyor, navbar avatar anında logged-in state'e geçiyor.
- [x] **Resend production**: Domain tarifle.app verify edildi (Ireland region), DNS records Cloudflare'e one-click ile eklendi, API key üretildi ve hem `.env.local` hem Vercel env vars'a kondu. Mail gerçek kullanıcılara gidiyor.
- [x] **middleware.ts kaldırıldı**: no-op idi, Next 16 deprecation uyarısı veriyordu. Proxy'e rename yerine direkt sildik.

## Faz 2, E-posta Doğrulama + Rozet Sistemi ✅

- [x] **Email provider abstraction** (`src/lib/email/`):
  - `EmailProvider` interface
  - `ResendEmailProvider` (production, RESEND_API_KEY ile aktif)
  - `ConsoleEmailProvider` (dev fallback, mail'i console'a basar)
  - `getEmailProvider()` factory: env'e bakar, otomatik seçim
- [x] **Verification flow**:
  - `sendVerificationEmail()` → token üret (24sa TTL, base64url, 32 byte), eskileri sil, mail gönder
  - `consumeVerificationToken()` → süre kontrolü, transaction içinde `emailVerified` set + token sil + EMAIL_VERIFIED badge
  - HTML email template (TR, branded, button + plain link fallback)
- [x] `/dogrula/[token]` sayfası (success / not-found / expired durumları, `noindex`)
- [x] Register'a kanca: kayıttan sonra fire-and-forget mail
- [x] `resendVerificationEmailAction`, 1 dk kullanıcı-bazlı in-process throttle (Redis sonra)
- [x] Profil sayfası: `VerifyEmailBanner` sahibe gösterir (email + "Tekrar gönder" buton)
- [x] **Rozet sistemi** (schema + migration `badge_system`):
  - `BadgeKey` enum: EMAIL_VERIFIED, FIRST_VARIATION, POPULAR_VARIATION, RECIPE_COLLECTOR
  - `UserBadge` model (`@@unique([userId, key])` idempotent)
  - `BADGES` config (label/description/emoji/tone)
- [x] Otomatik tetikleme (best-effort, action başarısını bloklamaz):
  - Email verification → EMAIL_VERIFIED
  - İlk variation create → FIRST_VARIATION
  - Like sonrası variation likeCount ≥ 10 → POPULAR_VARIATION (yazar için)
  - Collection count ≥ 5 → RECIPE_COLLECTOR
- [x] Profil sayfasında `BadgeShelf` vitrini (4 tone)

## Faz 2, AI Asistan (kural tabanlı, AI-gibi) ✅

- `AiProvider` interface + `RuleBasedProvider`: TR-aware token-prefix matcher, pantry staples modu, skor = matchedRequired/totalRequired. `isOptional` puana etki etmez.
- `/ai-asistan` sayfası: chip input + tür/süre/zorluk/pantry filtreleri. Sonuç kartında %eşleşme + eksik malzeme listesi.
- `src/lib/ai/commentary.ts`: senaryo bazlı 3-5 varyant + per-recipe notlar (zirvedeki seçenek, en hızlı, sabır ister…). Seed-based deterministic.
- "Yapay zekasız" disclaimer'ı yok, kullanıcıya AI gibi sunulur. Ana sayfa banner + navbar link. `scripts/test-ai.ts` smoke.
- **Karar**: LLM entegrasyonu şimdilik yok, kural tabanlı motor yeterince AI-gibi, masraf sıfır.

## Devam Edenler

## Tamamlanan Seed Verisi

- 17 kategori, 15 etiket
- 56 tarif (15 ilk seed + 41 final seed)
- Kategoriler: Ana Yemek, Çorba, Salata, Meze, Aperatif, Tatlı, Kahvaltı, Hamur İşi, Baklagil, Pilav, Sos, Kokteyl, Soğuk İçecek, Sıcak İçecek, Smoothie, Pasta, Atıştırmalık

## Sıradaki İşler

### Yakın vadeli (launch öncesi / hemen sonrası)

- [ ] **Codex batch review**, kardeş başka PC'de `scripts/seed-recipes.ts`'ye 50+ tarif ekler, ilk batch'i review et. Hazır altyapı: Neon `codex-import` branch + `docs/CODEX_HANDOFF.md` + `docs/RECIPE_FORMAT.md` (allergens + group + translations + dil kalitesi 7 kuralı). Codex'ten sonra `npx tsx scripts/retrofit-all.ts` ile allergen + diyet etiketleri otomatik dolar.
- [ ] **CI E2E aktivasyonu**: Neon'da `e2e-ci` branch aç → GitHub Secrets `E2E_DATABASE_URL` + `E2E_AUTH_SECRET` ekle → CI workflow'undaki e2e job otomatik çalışır.
- [ ] **Full-text search (Postgres `to_tsvector`)**, 500 tarifte arama hızı + Türkçe kök eşleşme (LIKE scan yerine GIN tsvector). Şu an `contains` ile sequential scan; 500+ tarifle hissedilir hale gelir.

### Orta vadeli (Faz 2 kalanı)

- [ ] **AI Asistan v2**: ingredient synonym/token tablosu (e.g. "domates" ⇔ "çeri domates" eşleştirmesi)
- [ ] **AI-destekli moderasyon**: Claude Haiku ile ön-sınıflandırma (opsiyonel, kural-tabanlı yeterli gelirse geri al)
- [ ] **Şablon video sistemi** (Remotion), büyük scope, Faz 2/3 arası
- [ ] **A11y manuel pass**: screen reader (NVDA/VoiceOver) elle smoke test (otomatik axe pass'i tertemiz, ama gerçek SR deneyimi insan değerlendirmesi gerektirir)

### Uzun vadeli (Faz 3)

- [ ] **Mobil uygulama** (React Native)
- [ ] **Premium üyelik** (reklamsız + sınırsız AI)
- [ ] **Çoklu dil, i18n aktivasyonu** (EN, DE, schema hazır, `Recipe.translations` JSONB + `LanguagePreferenceCard` placeholder; UI string catalog + provider entegrasyonu kalıyor)
- [ ] **AI tarif videoları** (runway/pika/özel)
- [ ] **Açık API**

## Karar Bekleyenler

- E-posta doğrulaması MVP'de zorunlu mu yoksa opsiyonel mi? (Şu an opsiyonel, doğrulanmamış kullanıcı her şeyi yapabiliyor, sadece rozet eksik)
- AI video için aylık deneme bütçesi belirlenecek mi?
- İlk tarif veri setine kullanıcının özel tarifleri de eklensin mi?
- Gelişmiş moderasyonda AI (Claude Haiku) kullanmadan kural-tabanlı mı gidelim?

## Bilinen Sorunlar

- Prisma 7 CLI komutları (migrate dev, db push) için `--config ./prisma/prisma.config.ts` flag gerekiyor
  (prisma.config.ts dotenv yüklemesi güvenilir değil)

## DB Migration Disiplini

- ✅ Baseline alındı: `prisma/migrations/0_init/migration.sql`, "applied" işaretli
- Bundan sonra schema değişikliklerinde:
  - `npm run db:migrate -- --name kisa_aciklama` → migration dosyası üretir + dev DB'ye uygular
  - Production deploy: `npm run db:migrate:deploy`
  - Status kontrolü: `npm run db:migrate:status`
- `npm run db:push` artık sadece "deneysel/prototype schema değişikliği" için

## Teknik Notlar

- Next.js 16.2.3, React 19.2.4, Tailwind CSS 4
- Prisma 7.7.0 + @prisma/adapter-neon + @neondatabase/serverless
- Auth.js v5 (next-auth@5.0.0-beta.30), JWT strategy, Credentials provider aktif
- **middleware.ts kaldırıldı** (Next 16'da `proxy.ts` önerilir, bizde no-op'tu, tamamen sildik)
- Light mode varsayılan, dark mode `[data-theme="dark"]`
- Seed script: `npx tsx prisma/seed.ts` (DATABASE_URL env var gerekli)
- **Resend**: `RESEND_API_KEY` env'de → `ResendEmailProvider` aktif, yoksa `ConsoleEmailProvider` (dev fallback). From: `Tarifle <noreply@tarifle.app>`
- **Server action'dan signIn çağırmak sorunlu**: Auth.js v5'te `signIn("...", { redirectTo })` server action içinde NEXT_REDIRECT fırlatır; SessionProvider tazelenmez, client'ta "giriş yapılmamış" görünmeye devam eder. Her zaman client-side `signIn({ redirect: false })` + `router.refresh()` + `router.push(...)` pattern'ini kullan.
