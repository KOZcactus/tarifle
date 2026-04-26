# Mod M (Marine) Tetik Şablonu

> Mod M = mevcut tariflerden marine içerenleri tespit edip **doğru
> marine süresini ve yöntemini** ekler. RecipeTimeline visual'da
> "Bekleme/Marine" segmenti çıkar; kullanıcı "buna 3 saat (veya 1
> gece) lazım" net görür.
>
> **Doğruluk kritik.** Codex her tarif için **en az 2 farklı
> web kaynağından** marine süresini ve yöntemini teyit etmek
> zorunda. Halüsinasyon kabul edilmez; kaynak yoksa atla.

## Yeni chat başlangıç mesajı (Codex'e ilk mesaj)

> **Dikkat: Sadece ilk satırdaki Batch numarasını değiştir** (Mod M
> Batch 1, 2, 3, 4). Diğer satırlar aynı kalmalı.

---

```
Mod M Batch 1.

Tarifle, Türkçe tarif platformu. Mevcut tariflerden marine içerenler
tespit edildi (167 aday, docs/mod-m-candidates.md). Bu batch'te ilk
50'sini incele, doğru marine süresi/yöntemi belirle ve uygula.

**Senin görevin:** Her tarif için web araştırması yap, **en az 2
güvenilir kaynaktan** (food blog, professional cooking site, Wikipedia,
ulusal mutfak sitesi vb.) marine süresini teyit et. Sonra JSON
output ver.

**Veri kaynağı:**
- `docs/mod-m-candidates.md` (167 aday tarif: slug, title, cuisine,
  type, prep/cook/total/wait, marine ile eşleşen field'lar).
- Bu batch'te ilk 50 (sıra: time pattern olanlar + already-wait-time
  olmayanlar üstte)

**Web araştırma kuralları:**

1. **Minimum 2 farklı domain.** Aynı sitenin farklı sayfaları sayılmaz.
   Örn: serious eats + bbc good food ✓; serious eats × 2 ✗.
2. **Güvenilir kaynak öncelikli.**
   - Profesyonel cooking sites: Serious Eats, BBC Good Food, NYT
     Cooking, Food52, Bon Appétit, America's Test Kitchen
   - Ulusal mutfak referansları: TR yemek tariflerinde Yemek.com,
     Nefis Yemek Tarifleri (cross-validate); İtalyan için Giallo Zafferano,
     Hint için Tarla Dalal, Japon için Just One Cookbook
   - Wikipedia (özellikle uluslararası tarifler için temel kaynak)
   - Kitap referansı (Mark Bittman How to Cook, Julia Child, Ottolenghi)
3. **Halüsinasyon yasak.** "Genelde marine süresi 4-6 saattir" gibi
   genel ifade yerine **kaynaktan spesifik süre** alıntıla.
4. **Kaynaklar farklı süre veriyorsa**: ortalama veya en yaygın olanı
   tercih et, JSON'da reason'da belirt ("Source A: 4h, Source B: 8h,
   ortalama 6h alındı").
5. **Tarif marine içermiyorsa veya emin değilsen**: classification
   "SKIP" işaretle, marineMinutes=0.

**JSON çıktı formatı (`docs/mod-m-batch-N.json`):**

[
  {
    "slug": "tavuk-sis",
    "marineMinutes": 240,
    "marineDescription": "Yoğurt + zeytinyağı + baharat marine, en az 4 saat",
    "tipNote_addition": "Marine süresini en az 4 saat tutun; bir gece bekletmek ekstra yumuşatır.",
    "sources": [
      "https://www.example.com/tavuk-sis-tr",
      "https://yemek.com/tarif/tavuk-sis"
    ],
    "confidence": "high",
    "reason": "Source A 3-4h, Source B 4-6h. 4 saat bilinen ortalama."
  },
  {
    "slug": "menemen",
    "classification": "SKIP",
    "reason": "Menemen marine içermez, audit script keyword false positive."
  }
]

**Field açıklamaları:**

- `marineMinutes`: tam marine bekleme süresi dakika cinsinden
  (240 = 4 saat, 1440 = 24 saat = 1 gün, 4320 = 3 gün).
  ÖNEMLİ: prep ve cook'a ek; bu sadece marine süresi.
- `marineDescription`: kısa Türkçe (50-150 char) marine açıklama.
  Örnek: "Yoğurt + zeytinyağı + zerdeçal marine, 4-6 saat".
- `tipNote_addition`: mevcut tipNote'a EKLENECEK marine notu.
  Mevcut tipNote ile birleştirilecek (Claude apply tarafında).
  Önerilen format: "Marine süresini en az X saat tutun; ..."
- `sources`: tam URL listesi, en az 2.
- `confidence`: "high" (2 kaynak net aynı süre), "medium" (kaynaklar
  arası fark var, ortalama alındı), "low" (1 net kaynak + 1 dolaylı,
  yakın takip).
- `reason`: Türkçe kısa gerekçe (50-200 char).

**Batch boyutu:** 50 tarif (Batch 1: ilk 50, Batch 2: sonraki 50,
Batch 3: kalan ~67). 4 batch toplam.

**Kalite kontrol:**
- Her tarif için sources >= 2 zorunlu.
- SKIP'lar için sources gereksiz, reason zorunlu.
- marineMinutes >= 5 ve <= 10080 (7 gün, schema cap).
- Türkçe karakter kullan (em-dash YASAK, AGENTS.md kuralı).
- jargon yasak liste: "scaled", "hyperscale" vb.
- "Mod M Batch N hazır" + özet:
  - Toplam: 50
  - Marine eklendi (high): X
  - Marine eklendi (medium): Y
  - Marine eklendi (low): Z
  - SKIP: W

Hazır mısın? Onay verirsen Batch 1 (ilk 50) için web araştırmasına
başla.
```

---

## Pipeline (Codex teslim sonrası, Claude tarafı)

1. **Claude verify** (`scripts/verify-mod-m-pairs.ts` yaz):
   - Her entry için: marineMinutes makul mu (5 dk - 7 gün)?
   - Sources URL geçerli mi (HEAD check, opsiyonel)?
   - Confidence + reason zorunlu mu?
   - SKIP'lar reason zorunlu mu?
2. **Kullanıcı onay**:
   - High confidence count + örnek
   - Medium/Low spot check
3. **Apply pipeline**:
   - DB update: `recipe.totalMinutes = prepMinutes + cookMinutes + marineMinutes`
   - tipNote merge: mevcut + " " + tipNote_addition (boş geçilebilir)
   - description'a opsiyonel marine notu (varsa marineDescription)
   - Source seed-recipes.ts senkron (totalMinutes + tipNote)
   - AuditLog action="MARINE_APPLY"

## Tahmini etki

- Toplam aday: 167 (15 zaten wait modellenmiş, 152 marine eklenmesi
  potansiyel)
- Codex tahmin sınıflandırma: ~60% high (klasik marine), ~30% medium
  (kaynaklar arası ufak fark), ~10% low/SKIP
- Apply sonrası ~120-150 tarif RecipeTimeline'da 3 segment gösterir
- "Bu tarife 4 saat lazım" tipi UI vurgu çoğalır, kullanıcı marine
  ihtiyacını net görür

## Mod M kapanış kriterleri

- 4 Codex batch tamamlandı
- Claude verify + apply
- find-marine-candidates.ts yeniden koşulduğunda total > prep+cook
  olan tarif sayısı 100+ (eskiden 15)
- RecipeTimeline browser test 3 segment görselli marine'li tariflerde
  doğru render

---

## Notlar

- Brief disiplin: em-dash yasak, jargon yasak liste, tipNote merge
  pattern (mevcut + " " + addition).
- Doğruluk öncelik: Codex 2 kaynak teyit etmeden marine süresi yazmaz.
- "Bilmiyorum / kaynak yetersiz" durumunda SKIP işaretle, sahte veri
  yazma.
