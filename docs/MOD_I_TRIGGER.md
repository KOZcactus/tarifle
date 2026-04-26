# Mod I, Duplicate Audit (Codex tetik şablonu)

Tarifle prod'da 3679 yayında tarif var (oturum 22, 26 Nis 2026 sonu).
Kullanıcı tespitiyle ANZAC Biscuit/Biscuits/Bisküvisi gibi 3-5 farklı
slug ile aynı tarifin tekrar etmiş olduğu doğrulandı; manuel 8 sil
yapıldı. Sistematik tüm prod'u taramak için bu Mod I.

## Yeni chat akışı (Kerem)

1. **Yeni chat aç ChatGPT Max**
2. **Bölüm A, başlangıç mesajı** (ilk mesaj):
   ```
   Selam. Tarifle (tarifle.app) projesinde bu oturumda sen
   çalışıyorsun. Mod I, duplicate audit görevin. Brief
   docs/CODEX_BATCH_BRIEF.md §19 ZORUNLU oku. Mod A/B/C/D/E/F/FA/G/H
   geçmiş referans, bu oturumda sadece Mod I.

   Doğruluk > kapsam > hız. Şüphedeysen LEGIT-VARIANT işaretle, sil
   listesine atma. Em-dash karakteri (U+2014) yasak.

   Aynı klasörü Claude ile paylaşıyorsun (lokal disk), yazdığın
   değişiklikler doğrudan disk'e yansımalı.

   Oku, "Anladım" de, sonra batch numarasını vereceğim.
   ```
3. Codex "Anladım" der.
4. **Bölüm B, tetik mesajı** (her batch için, sadece N değiştir):

   ```
   Mod I. Batch N.
   (Bu mesajda "N" geçen TÜM yerlerde, başlıktaki batch numarasını
   kullan. Tutarsızlık olursa dur, sor.)

   Brief docs/CODEX_BATCH_BRIEF.md §19 ZORUNLU oku.
   Input: docs/all-recipe-titles.md (3679 tarif, cuisine + type
   bazında alfabetik gruplanmış, 235 grup). Bu batch için aşağıdaki
   harf aralığındaki cuisine gruplarını tara:

   Batch 1: a-c (au, br, cn, cu)
   Batch 2: d-i (de, en, es, et, fr, gr, hu, id, in, ir, it)
   Batch 3: j-n (jp, kr, ma, me, mx, ng)
   Batch 4: p-r (pe, pk, pl, ru)
   Batch 5: s-z (se, th, tr, us, vn)

   Output: docs/mod-i-batch-N.json (sema aşağıda).

   ⚠️ KRITIK NOKTALAR:
   - SADECE aynı cuisine + aynı type içinde duplicate tara (au/TATLI,
     tr/CORBA gibi).
   - "Duplicate" tanım: aynı tarif farklı slug + farklı title yazımı
     ile tekrar eklenmiş. Örnek: "ANZAC Biscuit" + "ANZAC Biscuits"
     + "ANZAC Bisküvisi" 3 ayrı slug, ingredient + step birebir aynı.
   - "LEGIT-VARIANT" tanım: aynı yöre/ana malzeme ama gerçek farklı
     varyant. Örnek: "Tavuklu Bulgur Pilavı" vs "Etli Bulgur Pilavı"
     ana malzeme farklı = ayrı tarif. "Anticuchos" (geleneksel dana
     yürek) vs "Anticuchos de Pollo" (tavuk) = farklı protein, ayrı
     tarif. Sil listesine ATMA.
   - Confidence:
     - high: title yazımı dışında ingredient + step + cuisine + type
       hepsi aynı = kesin duplicate
     - medium: %70+ uyum, küçük ingredient farkı (ör. süt 200ml vs
       süt 250ml gibi tolerans içi)
     - low: title yakın ama ingredient ana farkı var = LEGIT-VARIANT
       işaretle, sil listesine atma
   - Canonical seçim: featured (⭐) varsa ilki, yoksa en zengin
     (en çok ingredient + step) önce.
   - Web kaynak teyit GEREKMİYOR (sadece input listesi içi tarama).
   - Ana yemek isimleri (Mantı, Köfte, Karnıyarık) tek başına
     duplicate değil, yöre/içerik farkı olabilir. Title + slug
     birlikte değerlendir.

   Self-check (teslim öncesi 5 madde):
   1. Her cluster'da en az 2 slug var, hepsi aynı cuisine + type
   2. canonical slug bir tane (en güçlü), duplicateSlugs en az 1
   3. confidence "high" veya "medium" olmayan kayıt yok (low ise
      LEGIT-VARIANT comment ile işaretle, ayrı çıktı)
   4. Em-dash 0
   5. JSON valid (sema aşağıda)

   Output sema:
   ```json
   [
     {
       "cuisine": "au",
       "type": "TATLI",
       "canonicalSlug": "anzac-biscuits",
       "canonicalTitle": "ANZAC Bisküvisi",
       "duplicateSlugs": [
         "anzac-biscuit-avustralya-usulu",
         "anzac-biskuvisi-avustralya-usulu"
       ],
       "duplicateTitles": [
         "ANZAC Biscuit",
         "ANZAC Bisküvisi"
       ],
       "confidence": "high",
       "reason": "Yulaf + un + Hindistan cevizi + tereyağı + bal/şurup birebir, step sırası aynı."
     }
   ]
   ```

   Ek dosya (varsa):
   docs/mod-i-batch-N-legit.json (LEGIT-VARIANT'lar, sil değil
   bilgi):
   ```json
   [
     {
       "cuisine": "pe",
       "type": "YEMEK",
       "slugs": ["anticuchos-peru-usulu", "anticuchos-de-pollo-peru-usulu"],
       "reason": "Anticuchos (dana yürek geleneksel) vs Pollo (tavuk
                  varyantı), farklı ana protein, ayrı tarif."
     }
   ]
   ```

   Bitince "Mod I Batch N hazır" + özet:
   - Toplam cluster: X
   - High confidence: Y (kesin duplicate)
   - Medium confidence: Z (yakın, son kontrol)
   - LEGIT-VARIANT: W
   - Toplam silinmesi önerilen slug: V
   ```

## Apply pipeline (Claude)

1. Codex teslim sonrası deep verify:
   ```bash
   npx tsx scripts/verify-mod-i.ts --batch N
   ```
   Her duplicate cluster için DB'den ingredient + step çek, Codex'in
   high/medium claim'ini doğrula. Tutmaz → reject + Codex'e geri.

2. Onaylı cluster listesi → kullanıcıya net özet:
   - "X duplicate cluster, Y silinecek slug, canonical Z"
   - Kullanıcı approve eder

3. Sil:
   ```bash
   # Silinecek slug'ları toparla
   jq -r '.[].duplicateSlugs[]' docs/mod-i-batch-N.json > docs/mod-i-batch-N-rollback.txt
   npx tsx scripts/rollback-batch.ts --slugs-file docs/mod-i-batch-N-rollback.txt --confirm "rollback-batch-manual"
   # Prod aynı --confirm-prod ile
   ```

4. Source clean:
   ```bash
   node scripts/smart-source-clean.mjs docs/mod-i-batch-N-rollback.txt
   ```

5. Title update (canonical'lar için Kerem'in tercih ettiği TR
   isimleri):
   - Manuel SQL veya Prisma update

6. Recompute pipeline (silinen tarif sayısı için):
   - compute-recipe-nutrition --apply
   - compute-diet-scores --apply
   - prod aynı --confirm-prod

7. Commit + push.

## Beklenen sonuç

- 5 batch toplam → ~30-50 high confidence duplicate cluster
  bulunması beklenir (oturum 21'de 78 silindi, 22'de 8 daha; geri
  kalan ~30-50 muhtemelen var)
- Prod 3679 → ~3620-3650 net (50-60 sil)
- Mod I pipeline 1-2 oturumda kapanır
