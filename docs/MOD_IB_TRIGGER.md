# Mod IB Final Duplicate Pass (Codex tetik şablonu)

> Mod IA pair-level audit'in (89 pair, 27 DUPLICATE + 43 VARIANT + 19
> UNCERTAIN) follow-up. Mod IA'da Codex DB'ye doğrudan erişemediği için
> 19 UNCERTAIN'a karar veremedi. Mod IB'de iki ek scope:
>
> 1. **UNCERTAIN refinement**: 19 UNCERTAIN + 1 butter-chicken (featured
>    blocked) için Claude DB'den **detaylı ingredient + step + nutrition**
>    cıkardı (`docs/mod-ib-input.json`). Codex bu kez içerik detayıyla
>    karar verir.
> 2. **Cross-language pass**: titleJacc<0.3 ama ingJacc>=0.75 + calDiff
>    <=15% pair'leri (örn. "Tea Egg" vs "Tea Eggs Çin" tipi). Toplam 70
>    pair `docs/cross-language-pairs.md`'de.
>
> Mod IB sonrası duplike işi pratik olarak kapanır.

## Yeni chat başlangıç mesajı (Codex'e ilk mesaj)

> **Dikkat: Sadece ilk satırdaki Batch numarasını değiştir** (Mod IB
> Batch 1, 2). Diğer satırlar aynı kalmalı. Tutarsızlık tespit edersen
> dur.

---

```
Mod IB Batch 1.

Tarifle, Türkçe tarif platformu. Mod I + Mod IA duplike pipeline
sonrası 2 final pass:

**Batch 1 scope: UNCERTAIN refinement** (20 pair, içerik detaylı).

Veri kaynağı: `docs/mod-ib-input.json` (Claude DB'den çıkardı, her
pair için tam ingredient listesi + step ilk 120 char + nutrition +
description + tipNote + servingSuggestion + isFeatured + duration).

**Senin görevin:** Her pair için içerik detayını incele, kararını ver.

**JSON çıktı formatı (`docs/mod-ib-batch-1.json`):**

[
  {
    "pair": ["slug-a", "slug-b"],
    "classification": "DUPLICATE" | "VARIANT" | "ATLA",
    "winner": "slug-keep",  // sadece DUPLICATE için
    "loser": "slug-sil",    // sadece DUPLICATE için
    "swap_canonical": false, // sadece butter-chicken pattern: true ise
                             // canonical-loser ters cevrilmeli (loser
                             // featured/global slug ise)
    "reason": "Türkçe gerekçe (50-150 char): hangi spesifik içerik farkı
               (ingredient ekstra, baharat profili, pişirme tekniği,
               servis formu) duplike/varyant kararını veriyor."
  }
]

**Sınıflandırma kuralları:**

- **DUPLICATE**: İki tarif aynı iç içerik (ingredient set %80+, ana
  baharat profili aynı, pişirme tekniği aynı). Sadece title/slug yazım,
  coğrafi prefix, kelime sırası, veya ufak ölçü farkı. Aksiyon: winner
  + loser belirle.

- **VARIANT**: Gerçek bölgesel/teknik fark var. Ana ingredient farklı
  (örn. dut pekmez vs üzüm pekmez), ana teknik farklı (lenger 220dk
  vs tava 105dk), kalori >%20 fark, veya ana protein farklı. Aksiyon:
  korunur.

- **ATLA**: Belirsiz, ama içerik detayı bile yetersizse karar verme;
  güvenli atla.

**butter-chicken cluster özel:**
Mod IA'da butter-chicken (featured + global slug) sil olarak
işaretlenmişti, blocked. İçerik detayını gözden geçir:
- Eğer "delhi-butter-chicken" daha zengin (10i vs 5i) ama "butter-
  chicken" featured global slug ise: classification = DUPLICATE +
  swap_canonical = true (kullanıcı tersine çevirmeyi tercih edebilir,
  yani delhi içeriğini global slug'a kopyala, delhi sil).
- Eğer içerik aynıysa swap_canonical = false (Mod IA önerisini onayla).

**Kalite kontrol:**
- Her pair için classification + reason zorunlu.
- DUPLICATE için winner + loser zorunlu.
- swap_canonical default false (sadece butter-chicken için true olabilir).
- Reason 50-150 karakter, jargon yasak liste'ye uy.
- "Mod IB Batch 1 hazır" + özet:
  - Toplam: 20 pair
  - DUPLICATE: X (swap_canonical: Y)
  - VARIANT: Z
  - ATLA: W

Hazır mısın?
```

---

## Batch 2 (cross-language pass)

```
Mod IB Batch 2.

**Batch 2 scope: Cross-language audit** (70 pair, başlığı farklı
dilde olan eşler).

Veri kaynağı: `docs/cross-language-pairs.md` (titleJacc<0.3,
ingJacc>=0.75, calDiff<=15%, durDiff<=30%). Her `══` ile başlayan
blok bir pair: KEEP slug + SIL slug + cuisine/type + metric'ler.

**Aynı sınıflandırma + JSON formatı (Batch 1 ile aynı).**

Tipik pattern beklenen:
- "Tea Egg" vs "Tea Eggs Cin Atistirmalik Usulu" (DUPLICATE: tekil
  vs çoğul + Türkçe usul)
- "Black Bean Soup" vs "Siyah Fasulye Corbasi" (DUPLICATE: çapraz dil)
- "Salmorejo" vs "Sevilla Salmorejo Yumurtali" (VARIANT: yumurta
  garnish ekstra)
- "Shoyu Ramen" vs "Tokyo Shoyu Ramen" (VARIANT: Tokyo bölge spesifik
  bouillon olabilir)

70 pair tek pass'te işle, JSON çıktı `docs/mod-ib-batch-2.json`.
"Mod IB Batch 2 hazır" + özet.
```

---

## Pipeline (Codex teslim sonrası, Claude tarafı)

1. **Claude verify** (`scripts/verify-mod-ib-pairs.ts`):
   - Mod IA verify pipeline'la aynı: DUPLICATE pair'lar için DB metric
     doğrulama, user content (variations/cooked/featured) check.
   - swap_canonical=true durumlar için ekstra: hem "loser → winner
     içeriği taşı" hem de "loser sil" (atomic transaction).

2. **Kullanıcı onay**:
   - Net DUPLICATE clean: otomatik sil
   - swap_canonical: özel onay (butter-chicken gibi featured fix)
   - VARIANT/ATLA: skip

3. **Apply pipeline** (Mod I/IA ile aynı):
   - rollback-batch.ts dev → smart-source-clean → smoke → prod
   - swap_canonical için manuel slug + content update script (yeni)
   - AuditLog kayıtlı

## Tahmini etki

- **Batch 1** (UNCERTAIN refinement, 20 pair): ~5-8 yeni DUPLICATE,
  ~12-15 VARIANT/ATLA. + butter-chicken swap kararı.
- **Batch 2** (cross-language, 70 pair): ~25-35 DUPLICATE, ~35-45
  VARIANT.

Toplam Mod IB: **~30-40 ek sil**, prod 3546 → ~3510. Mod I + IA + IB
toplam: 3679 → ~3510 (-170 net duplike sil + 11 canonical rename
+ varsa butter-chicken swap).

## Mod IB kapanış kriterleri

- 2 batch tamamlandı
- Claude verify + apply
- find-duplicates-claude.ts + find-cross-language-pairs.ts yeniden
  koşulduğunda toplam strict pair < 15
- "Duplike pratik olarak kapandı" raporu kullanıcıya teslim

---

## Notlar

- Brief disiplin: em-dash yasak, jargon yasak liste, tipNote/sug
  kuralları (CODEX_BATCH_BRIEF §3-§5).
- Mod IB sadece duplike pair audit, yeni tarif yazılmaz.
- swap_canonical pattern Mod IA'dan farklı yeni özellik (butter-chicken
  gibi featured + global slug korunması için).
