# Codex yeni chat başlangıç + tetik mesajları

Bu dosya, ChatGPT Max'ta her yeni Codex oturumunda Kerem'in kopyala
yapıştır kullanacağı **standart başlangıç mesajı** + **3 aktif mod
için detaylı tetik şablonlarını** içerir. Oturum bazlı güncellenir.

---

## 1. Yeni chat başlangıç mesajı (her chat'in ilk mesajı)

```
Selam. Tarifle (tarifle.app) projesinde bu oturumda sen
çalışıyorsun. GitHub repo'da docs/CODEX_BATCH_BRIEF.md senin
için yazıldı: proje tanıtımı, aktif modlar (Mod A yeni TR
tarif §5, Mod G boilerplate revize §17, Mod H ingredient
enrichment §18), dosya kuralları, kalite çıtası, çift
self-review, geçmiş hatalar ve yasaklar hepsi orada. Mod
B/C/D/E/F/FA KAPANDI (referans için brief'te detay korundu).

Oku, "Anladım" de, sonra hangi modu + batch numarasını
vereceğim, sen default akışla direkt başlayacaksın.

Doğruluk > hız > kapsam. Şüphedeysen sor, sahte yazma.
Em-dash karakteri (U+2014) yasak (AGENTS.md), yerine virgül,
noktalı virgül, nokta, parantez, iki nokta.

Aynı klasörü Claude ile paylaşıyorsun (lokal disk),
yazdığın değişiklikler doğrudan disk'e yansımalı. "1 file
changed" preview kalmasın, gerçek dosya update olmalı.
Tamamlama sonrası git status'te değişiklik görünmeli.
```

---

## 2. Mod A tetik şablonu (yeni TR + uluslararası tarif)

```
Mod A. Batch {BATCH_ID}.
Brief §5 Mod A default'u uygula (50 tarif). Önemli güncellemeler
(oturum 17 + 21 dersleri, docs/CODEX_BATCH_BRIEF.md oku):
- Dağılım ~25 TR + ~25 uluslararası. Kesin matematiksel denge YOK.
- TR bölge dengesi KALDIRILDI. 7 bölgeden eşit tarif matematik
  yapmıyorsun. Bölge karıştır ama "her bölgeden 3-4 tarif"
  eşitliğine zaman kaybetme.
- Uluslararası tarifler BİLİNEN/POPÜLER öncelikli: nasi goreng,
  bratwurst, ratatouille, butter chicken, katsu gibi mainstream
  tarifler. Ülkenin taşra mutfağı keşfi değil.
- ⚠️ Tarif doğruluğu için WEB KAYNAK KONTROLÜ ZORUNLU. Özellikle
  uluslararası + az bilinen TR yöresel için BBC Food / Serious
  Eats / Bon Appétit / yemek.com / nefisyemektarifleri / resmi
  kültür sitelerinden temel reçete doğrula. "Hayal edilen
  ingredient listesi" yasak.
- ⚠️ MİNİMUM STEP SAYISI:
    | Type | Minimum | İdeal |
    |---|---|---|
    | ICECEK | 3 | 3-4 |
    | KOKTEYL | 4 | 4-5 |
    | APERATIF | 4 | 4-6 |
    | YEMEK / CORBA / SALATA / TATLI / KAHVALTI | 5 | 5-7 |
  3-step bir YEMEK/TATLI/KAHVALTI tarifi REJECT edilir.
- ⚠️ §5.0 Kural 6 (step ↔ ingredient eşleşme):
  Step'te "un" / "pul biber" geçen her tarifte ingredient
  list'inde o malzeme BULUNMALI. Simile YASAK ("un gibi" YOK,
  "ince taneli kıvam" YAZ).
- ⚠️ §5.0 Kural 7 (alkol tag + şarap sirkesi):
  ALCOHOL_WORDS varsa "alkollu" tag ZORUNLU. "şarap sirkesi" →
  "üzüm sirkesi" yaz (false-positive alkol).
- ⚠️ §5.0 Kural 16 (DUPLICATE TITLE-CHECK, oturum 21):
  Yeni tarif önerirken sadece slug değil TITLE benzeri de
  kontrol et. Yuvalama, Gazpacho, Mantı, Köfte gibi yemek adları
  zaten mevcutsa yeni eklemeyin. docs/existing-slugs.txt + son
  400 satır seed-recipes.ts kontrol.

⚠️ APPEND NOKTASI: seed-recipes.ts ~16000 satır. Son 100-150
satıra bak, önceki batch'in IIFE kapanışı + `];`. Append yeri:
      })(),
    ];
`];` yerinde kalır, üstüne yeni IIFE:
      })(),
      // ── BATCH {BATCH_ID} ── (tarih: YYYY-MM-DD, 50 tarif, Codex)
      ...(() => {
        const t = (enTitle: string, enDescription: string,
                   deTitle: string, deDescription: string) => ({...});
        const ing = (specs: string[]) => ...;
        const st = (specs: string[]) => ...;
        const r = (o: ...) => ({...});
        return [
          r({ ... }), // tarif 1
          ...
          r({ ... }), // tarif 50
        ];
      })(),
    ];

⚠️ HELPER TİPLERİ ZORUNLU. d / default-helper YASAK. 11 alan
PER-RECIPE: emoji, prepMinutes, cookMinutes, totalMinutes,
servingCount, averageCalories, protein, carbs, fat, tags,
EN+DE description.

⚠️ Cuisine 30 kod: tr/it/fr/es/gr/jp/cn/kr/th/in/mx/us/me/ma/
vn/br/cu/ru/hu/se/pe/gb/pl/au/de/ir/pk/id/et/ng.

⚠️ Tag 15 enum: pratik, 30-dakika-alti, dusuk-kalorili,
yuksek-protein, firinda, tek-tencere, misafir-sofrasi,
cocuk-dostu, butce-dostu, vegan, vejetaryen, alkollu,
alkolsuz, kis-tarifi, yaz-tarifi.

⚠️ Allergen disiplini brief §5.4'te detayda.

Self-check (v2 teslim öncesi ZORUNLU, 16 madde):
1. Slug unique 50/50
2. EN/DE description unique 50/50
3. Emoji unique ≥8
4. averageCalories unique ≥10
5. totalMinutes range tutarlı (Hard ≥60, Easy ≤30)
6. ⭐ YEMEK/CORBA/SALATA/TATLI/KAHVALTI step ≥5,
   ICECEK ≥3, KOKTEYL+APERATIF ≥4 her tarif ayrı
7. d helper: 0
8. Template grep (brings regional / nutzt konkrete): 0
9. Em-dash / en-dash: 0
10. UTF-8 no-BOM + LF
11. `npx tsx scripts/check-allergen-source.ts` → ✅ TEMIZ
12. Her tarif için web kaynak teyidi
13. ⭐ Step ↔ ingredient eşleşme + simile yasak
14. ⭐ "şarap sirkesi" YASAK + alkol tag eklendi
15. ⭐ Duplicate title-check (Yuvalama, Gazpacho, Mantı,
    Köfte gibi ana yemek adları kontrol)
16. ⭐ existing-slugs.txt + son 400 satır slug tekrarı yok

Bitince "Batch {BATCH_ID} hazır" + özet: TR/int'l, kategori
dağılım, isFeatured, emoji unique, kalori range, **min step
PASS**, allergen PASS, **Kural 6 + 7 + 16 PASS**.
```

---

## 3. Mod G tetik şablonu (boilerplate revize)

**Önkoşul:** Claude `npx tsx scripts/prepare-mod-g-input.ts --batch N
--size 100` koşmuş olmalı, `docs/mod-g-batch-N-input.json` üretilmiş
olmalı (her slug için mevcut tipNote/sug + ingredient + step özeti).

```
Mod G. Batch {BATCH_ID}.
Brief docs/CODEX_BATCH_BRIEF.md §17 ZORUNLU oku
(özellikle §17.3 8 kalite kuralı + §17.5 7 self-check).
Input: docs/mod-g-batch-{BATCH_ID}-input.json (Claude
zenginleştirdi: 100 slug + her tarifin mevcut tipNote/
servingSuggestion + ingredient (12 örnek) + step (8 örnek)).
Output: docs/mod-g-batch-{BATCH_ID}.json (sema §17.2'de).

⚠️ KRITIK NOKTALAR:
- Tarif-özgü ref ZORUNLU: cümle slug/title anahtar kelimesi
  veya tarifin gerçek ingredient/step'inden bir referans içermeli
- Kelime sayı: tipNote 8-25, servingSuggestion 8-30
- WEB TEYIT (tipNote için) ZORUNLU: Serious Eats / Cook's
  Illustrated / yemek.com / nefisyemektarifleri / kültür
  sitesi. Sözde-bilim YASAK ("yoğurdu ters çevir, kremalı
  olur" gibi anlamsız ipucu).
- Anlaşılır dil (Türk teyze testi): jargon listesi YASAK:
  emülsiyon, denatüre, polifenol, viskozite, Maillard,
  karamelizasyon, uçucu yağ, antioksidan, hidrasyon,
  kapsaisin, flavonoid → KULLANMA. Günlük TR mutfak konuşması.
- Boilerplate engelleyici (oturum 21 sebep): aynı cümle 5+
  tarif YASAK. Slug bazlı unique cümle.
- Yan-malzeme uydurma YASAK: cümlede geçen ingredient input
  JSON'daki gerçek listede olmalı. "yanına nar dilimi" deme
  eğer tarif nar içermiyorsa.
- Pişirme yöntemi teyit: input'taki step listesinden teyit
  et. Fırın tarifi ise "ocakta pişirin" YASAK.
- Bölgesel referans uyumlu: input title'da "Konya" geçiyorsa
  cümle "Mardin" referansı YASAK.
- tipNote vs servingSuggestion ayrımı:
  - tipNote = pişirme sırasında bilim/teknik ipucu
  - servingSuggestion = tabağa ne ekleyip nasıl servis
- Em-dash karakteri (U+2014) YASAK
- null değerine izin ver: bir alanı revize etmeyeceksen null
  bırak (sadece tipNote veya sadece sug revize)

Self-check 7 madde §17.5 hepsi PASS olduktan sonra "Mod G
Batch {BATCH_ID} hazır" + özet:
- N tipNote revize / N servingSuggestion revize
- ortalama tipNote kelime / ortalama sug kelime
- dup count (5+ tarifte aynı cümle = 0 olmalı)
- jargon kontrol PASS
- web teyit PASS (tipNote için her örnek)
```

---

## 4. Mod H tetik şablonu (ingredient enrichment)

**Önkoşul:** Claude `npx tsx scripts/prepare-mod-h-input.ts --batch N
--size 50` koşmuş olmalı, `docs/mod-h-batch-N-input.json` üretilmiş
olmalı (her ingredient için sample tarif + tarif tipi dağılımı +
NutritionData eşleşmesi).

```
Mod H. Batch {BATCH_ID}.
Brief docs/CODEX_BATCH_BRIEF.md §18 ZORUNLU oku
(özellikle §18.3 7 kalite kuralı + §18.5 8 self-check).
Input: docs/mod-h-batch-{BATCH_ID}-input.json (Claude
zenginleştirdi: 50 ingredient + sample tarif slug + tarif
tipi dağılımı + frequency + NutritionData eşleşmesi).
Output: docs/mod-h-batch-{BATCH_ID}.json (sema §18.2'de).

⚠️ KRITIK NOKTALAR:
- whyUsed: 8-40 kelime, 1-2 cümle. EN AZ BİR tarif tipi
  referansı ZORUNLU (input'taki typeDistribution'a bak,
  hangi tip yaygınsa cümle ona uysun: "Pilav, dolma ve
  tatlılarda...")
- substitutes: 2-4 alternatif (Min 2, max 4). Her biri 1-8
  kelime. GERÇEKTEN İŞE YARAYAN eşdeğer (oran/yöntem benzer):
  - tahini → fındık ezmesi ✅ (yağlı ezme)
  - tahini → bal YASAK (yağlı vs sıvı, tarif bozulur)
  - en yakın → en uzak sıralama
- Anlaşılır dil (apply-mod-h.ts otomatik kontrol):
  yasak jargon: emülsiyon, denatüre, karamelizasyon,
  polifenol, viskozite, uçucu yağ, Maillard, denitrifikasyon,
  hidrasyon, antioksidan, kapsaisin, flavonoid → ERROR
- WEB TEYIT ZORUNLU: "neden bu malzeme" gerekçesi Serious
  Eats / Cook's Illustrated / BBC Food / yemek.com /
  Wikipedia food article'dan teyit. Sözde-bilim YASAK.
- Tarif-bağlamı zorunlu: whyUsed cümlesi sample tarif
  slug'larından teyit edilmiş olmalı. Genel kimya
  açıklaması YASAK ("Şeker karbonhidrat içerir, enerji
  kaynağıdır" YOK).
- Boilerplate engelleyici: aynı whyUsed cümlesi iki
  ingredient'ta YASAK. Aynı substitutes array YASAK.
- YASAK kalıplar: "Mutlaka kullan", "Olmazsa olmaz",
  "Sağlık için harika", "Çok kolay".
- Em-dash karakteri (U+2014) YASAK.
- notes: opsiyonel, null bırakılabilir. 8-40 kelime
  oran/sıcaklık uyarısı.

Self-check 8 madde §18.5 hepsi PASS olduktan sonra "Mod H
Batch {BATCH_ID} hazır" + özet:
- 50 ingredient hepsi entry yazıldı
- ortalama whyUsed kelime / ortalama notes kelime
- ortalama substitute count (2-4 aralığı)
- jargon kontrol PASS (tüm whyUsed + notes)
- web teyit PASS (sample 5 ingredient için kaynak ver)
- substitute makullük spot check (5 ingredient için
  alternatifin oran/yöntem benzerliği)
```

---

## Kullanım akışı (Kerem)

1. **Yeni chat aç** ChatGPT Max'ta
2. **Bölüm 1'i kopyala-yapıştır** (başlangıç mesajı)
3. Codex "Anladım" der
4. **İlgili mod tetik şablonunu yapıştır** (Bölüm 2 / 3 / 4)
5. `{BATCH_ID}` placeholder'ları doldur (örn. `39b`, `1`, `2`)
6. Mod G/H için Claude'a önce "input prep koş" de, dosya
   üretilince Codex tetiği gönder
7. Codex teslim edince Claude apply pipeline koşar

---

## Mod durum özeti (oturum 22 başı)

| Mod | Durum | Brief | Son batch |
|---|---|---|---|
| Mod A | Aktif | §5 | 39a prod canlı (1bb258e) |
| Mod B | KAPANDI | §6+§13 | 3471/3471 tam (oturum 19) |
| Mod C | Single pass | §12 | seo-copy-v1.json (oturum 12) |
| Mod D | KAPANDI | §13 | Batch 22 prod (oturum 13) |
| Mod E | KAPANDI | §14 | B29 (oturum 15, 2900 tarif) |
| Mod F | KAPANDI | §15 | 27/27 prod (oturum 21) |
| Mod FA | KAPANDI | §16 | 4/4 prod (oturum 20) |
| Mod G | Batch 1 bekler | §17 | input hazır, tetik bekliyor |
| Mod H | Batch 1 bekler | §18 | input hazır, tetik bekliyor |
