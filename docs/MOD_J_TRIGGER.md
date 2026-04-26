# Mod J Pair-Level Duplicate Final Audit (Codex tetik şablonu)

> Bu, Mod I cluster-based pipeline (5/5 KAPANIŞ, 107 sil) sonrasında
> kalan **92 pair-level** kesin/şüpheli duplike çiftini Codex'in tek tek
> "duplike vs legit varyant" karar vermesi için tetik. Mod I cluster
> bazlı çalıştı, bu nedenle cluster dışına düşen pair'leri kaçırdı.
> find-duplicates-claude.ts threshold (titleJacc≥0.6, ingJacc≥0.6,
> stepDiff≤2, calDiff≤30%) ile bulundu.

## Yeni chat başlangıç mesajı (Codex'e ilk mesaj)

> **Dikkat: Sadece ilk satırdaki Batch numarasını değiştir** (`Mod J Batch
> 1` veya `Mod J Batch 2`). Diğer satırlar aynı kalmalı. Tutarsızlık
> tespit edersen dur, kullanıcıya sor.

---

```
Mod J Batch 1.

Tarifle, Türkçe tarif platformu. Mod I cluster-based duplicate pipeline
(5/5 KAPANIŞ, 107 sil + 11 canonical rename) sonrasında kalan
**pair-level** duplike adaylarının nihai auditi.

**Senin görevin:** Sana verilecek pair listesi (`docs/duplicate-
suggestions.md`'den çıkarılmış 92 pair) için her bir pair'i
inceleyip "DUPLICATE", "VARIANT", veya "UNCERTAIN" olarak sınıflandır.

**JSON çıktı formatı (`docs/mod-j-batch-N.json`):**

[
  {
    "pair": ["slug-keep", "slug-sil-veya-uncertain"],
    "classification": "DUPLICATE" | "VARIANT" | "UNCERTAIN",
    "winner": "slug-keep",
    "loser": "slug-sil",
    "reason": "Kısa Türkçe gerekçe (50-150 karakter): aynı tarifin
               yazım/coğrafi prefix farkı mı, yoksa gerçek bölgesel/
               teknik varyant mı? Ingredient + step + kalori farkları
               özet."
  }
]

**Sınıflandırma kuralları:**

- **DUPLICATE**: Aynı tarif, sadece slug/title yazım farkı veya küçük
  coğrafi prefix. Ingredient set %85+ örtüşüyor + step sayısı ±1 +
  kalori farkı %15 altında + gerçek teknik fark yok.
  Örnek: `pastirmali-yumurta` vs `kayseri-pastirmali-yumurta` (Kayseri
  prefix, içerik aynı).
  Aksiyon: `winner` (zengin/canonical olanı koru), `loser` (sade/dup
  olanı sil).

- **VARIANT**: Gerçek bölgesel/teknik varyant. Ana ingredient farkı
  (etli vs sebze, sakızlı vs bademli), kalori %20+ fark, veya farklı
  bir pişirme tekniği (fırın vs tava, çiğ vs haşlanmış).
  Örnek: `kunefe` vs `peynirli-kunefe-hatay-usulu` (Hatay spesifik
  peynir mix).
  Aksiyon: korunur, `winner/loser` boş bırak.

- **UNCERTAIN**: Net karar verilemiyor (içerik çok yakın ama bölgesel
  isim sembolik olabilir, kullanıcı manuel review gerekli).
  Örnek: `corum-iskilip-dolmasi` vs `corum-iskilip-dolmasi-lenger`
  (lenger = servis kabı, ama belki ayrı yöntem).
  Aksiyon: `winner/loser` boş bırak, kullanıcıya delege.

**Veri kaynağı:**

`docs/duplicate-suggestions.md`'i tamamen oku. Her `══ ` ile başlayan
blok bir pair. KEEP slug + SIL slug + cuisine/type + metric'ler verili.
Sen DB'ye doğrudan erişemezsin; sadece bu dosyadaki bilgilere göre
karar ver. Eğer ek malzeme detayı gerekirse "UNCERTAIN" işaretle.

**Batch boyutu:** Tek pass'te ~30-40 pair işle (Batch 1: ilk 30, Batch
2: sonraki 30, Batch 3: kalan ~32). 3 batch'te tüm 92 pair.

**Kalite kontrol:**

- Her pair için `classification + reason` zorunlu.
- DUPLICATE için `winner + loser` zorunlu (boşsa hata).
- VARIANT/UNCERTAIN için `winner/loser` boş.
- Reason 50-150 karakter (kısa, jargon yasak liste'ye uy).
- "Mod J Batch N hazır" + özet:
  - Toplam pair: X
  - DUPLICATE: Y
  - VARIANT: Z
  - UNCERTAIN: W
  - Net sil önerisi: Y

Hazır mısın? Onay verirsen Batch 1'i (ilk 30 pair) işlemeye başla.
```

---

## Pipeline (Codex teslim sonrası, Claude tarafı)

1. **Claude verify** (`scripts/verify-mod-j-pairs.ts` yaz):
   - DUPLICATE pair'lar: DB'den canonical+sil tarif çek, ingJacc + calDiff
     metric doğrula
   - VARIANT pair'ları skip
   - UNCERTAIN pair'ları kullanıcıya net özet

2. **Kullanıcı onay**:
   - DUPLICATE doğrulanmış X slug sil
   - UNCERTAIN'leri tek tek gözden geçir

3. **Apply pipeline** (Mod I ile aynı):
   - rollback-batch.ts dev → smart-source-clean → smoke test → prod
   - AuditLog action=ROLLBACK_RECIPE
   - PROJECT_STATUS + CHANGELOG kısa update

## Tahmini etki

- Toplam 92 pair
- Tahmini DUPLICATE: 30-40
- Tahmini VARIANT: 50-60
- Tahmini UNCERTAIN: 5-10
- Net sil: ~30-40 tarif. Prod 3572 → ~3530-3540.

## Mod J kapanış kriterleri

- 3 Codex batch tamamlanmış
- DUPLICATE'leri Claude verify + apply
- UNCERTAIN'leri kullanıcı manuel sort etmiş
- find-duplicates-claude.ts yeniden koşulduğunda strict pair < 20
  (kalanlar gerçek varyant, false positive bırakma payı)

---

## Notlar

- Brief disiplin: em-dash yasak, 14 jargon yasak liste, tipNote/sug
  format kuralları (CODEX_BATCH_BRIEF.md §3-§5).
- Mod J yalnızca pair-level audit, yeni tarif yazılmaz.
- Mod I-Genişletilmiş = bu Mod J. İsim ayrımı sadece naming sade.
