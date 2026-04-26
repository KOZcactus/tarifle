# Mod I Batch 1 verify raporu

Kaynak: `docs\mod-i-batch-1.json`
Cluster sayisi: 16
Toplam duplicate slug onerisi: 28

## Ozet

- STRICT (otomatik onay onerisi): **1**
- LOOSE (manuel review onerisi): **9**
- WEAK (varyant olabilir, atlamak guvenli): **18**
- MISSING (DB'de yok): **0**
- User content blokeli: **0**

---

### [au/CORBA] Canonical: `balkabakli-hindistancevizli-corba-avustralya-usulu`

**Confidence (json):** medium
**Reason:** Başlık aynı tarifin yazım farkı gibi duruyor; balkabağı, Hindistan cevizi sütü, zencefil ve blender adımları örtüşüyor, canonical tarif soğanla daha zengin.

**Canonical row:** Balkabaklı Hindistancevizli Çorba [balkabakli-hindistancevizli-corba-avustralya-usulu] (5i/5s, 30dk, 168kcal, 0🔖+0📁)

#### dup: `bal-kabakli-hindistancevizli-corba-avustralya-usulu`
- **⚠️ LOOSE**
- DB row: Bal Kabaklı Hindistancevizli Çorba [bal-kabakli-hindistancevizli-corba-avustralya-usulu] (4i/5s, 30dk, 172kcal, 0🔖+0📁)
- titleJacc=0.33 ingJacc=0.50 stepDiff=0 durationDiff=0% calDiff=2%
- shared title tokens: hindistancevizli

---

### [au/KAHVALTI] Canonical: `avokadolu-misir-mucveri-avustralya-usulu`

**Confidence (json):** medium
**Reason:** Mısır, yumurta, un ve avokado tabanı aynı; pişirme akışı iki yüzlü mücver ve avokadolu servis olarak örtüşüyor, stack farkı servis formu gibi.

**Canonical row:** Avokadolu Mısır Mücveri [avokadolu-misir-mucveri-avustralya-usulu] (5i/5s, 22dk, 254kcal, 0🔖+0📁)

#### dup: `avokadolu-misir-mucver-stack-avustralya-usulu`
- **⚠️ LOOSE**
- DB row: Avokadolu Mısır Mücver Stack [avokadolu-misir-mucver-stack-avustralya-usulu] (4i/5s, 22dk, 252kcal, 0🔖+0📁)
- titleJacc=0.40 ingJacc=0.80 stepDiff=0 durationDiff=0% calDiff=1%
- shared title tokens: avokadolu, misir

---

### [au/KAHVALTI] Canonical: `damper`

**Confidence (json):** high
**Reason:** Un, süt, kabartma tozu ve tuzla yapılan aynı Avustralya damper ekmeği; hamuru yuvarlama, üstünü çizme ve 200°C fırında pişirme adımları aynı.

**Canonical row:** Damper [damper] (5i/6s, 40dk, 168kcal, 0🔖+0📁)

#### dup: `damper-ekmegi-avustralya-usulu`
- **✅ STRICT**
- DB row: Damper Ekmeği [damper-ekmegi-avustralya-usulu] (4i/5s, 34dk, 206kcal, 0🔖+0📁)
- titleJacc=1.00 ingJacc=0.80 stepDiff=1 durationDiff=15% calDiff=18%
- shared title tokens: damper

---

### [au/TATLI] Canonical: `lamington`

**Confidence (json):** medium
**Reason:** Featured canonical Lamington ile aynı sünger kek, kakaolu veya çikolatalı kaplama ve Hindistan cevizi bulama akışı var; şehir adı gerçek tarif farkı göstermiyor.

**Canonical row:** ⭐ Lamington [lamington] (6i/6s, 50dk, 214kcal, 0🔖+0📁)

#### dup: `melbourne-lamington-kareleri`
- **⚠️ LOOSE**
- DB row: Melbourne Lamington [melbourne-lamington-kareleri] (8i/6s, 115dk, 260kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.56 stepDiff=0 durationDiff=57% calDiff=18%
- shared title tokens: lamington

#### dup: `sidney-lamington`
- **⛔ WEAK**
- DB row: Sidney Lamington [sidney-lamington] (7i/5s, 55dk, 280kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.44 stepDiff=1 durationDiff=9% calDiff=24%
- shared title tokens: lamington

#### dup: `sydney-lamington-kareleri`
- **⛔ WEAK**
- DB row: Sydney Lamington Kareleri [sydney-lamington-kareleri] (7i/5s, 55dk, 280kcal, 0🔖+0📁)
- titleJacc=0.33 ingJacc=0.44 stepDiff=1 durationDiff=9% calDiff=24%
- shared title tokens: lamington

---

### [br/APERATIF] Canonical: `sao-paulo-pao-de-queijo`

**Confidence (json):** medium
**Reason:** İki tarif de manyok veya tapioka nişastası, süt, yumurta ve peynirle aynı fırın peynir topu akışını kullanıyor; canonical daha fazla ingredient ve step içeriyor.

**Canonical row:** Sao Paulo Pao De Queijo [sao-paulo-pao-de-queijo] (6i/7s, 50dk, 210kcal, 0🔖+0📁)

#### dup: `pao-de-queijo`
- **⛔ WEAK**
- DB row: Pao de Queijo [pao-de-queijo] (5i/6s, 45dk, 280kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.22 stepDiff=1 durationDiff=10% calDiff=25%
- shared title tokens: queijo

---

### [br/YEMEK] Canonical: `feijoada`

**Confidence (json):** medium
**Reason:** Featured canonical ile aynı siyah fasulye, et, sosis, soğan, sarımsak ve defne tabanı var; Rio adlandırması tarifin ana yapısını değiştirmiyor.

**Canonical row:** ⭐ Feijoada [feijoada] (5i/5s, 190dk, 590kcal, 0🔖+0📁)

#### dup: `rio-feijoada`
- **⚠️ LOOSE**
- DB row: Rio Feijoada [rio-feijoada] (7i/5s, 230dk, 620kcal, 0🔖+0📁)
- titleJacc=1.00 ingJacc=0.57 stepDiff=0 durationDiff=17% calDiff=5%
- shared title tokens: feijoada

#### dup: `rio-feijoada-fasulye`
- **⚠️ LOOSE**
- DB row: Rio Siyah Fasulyeli Feijoada [rio-feijoada-fasulye] (7i/5s, 175dk, 620kcal, 0🔖+0📁)
- titleJacc=0.33 ingJacc=0.57 stepDiff=0 durationDiff=8% calDiff=5%
- shared title tokens: feijoada

---

### [br/YEMEK] Canonical: `rio-moqueca-balik`

**Confidence (json):** medium
**Reason:** Beyaz balık, biber, domates, Hindistan cevizi sütü, lime ve kişnişli aynı moqueca akışı; Rio versiyonu ingredient ve step olarak daha açıklayıcı.

**Canonical row:** Rio Moqueca Balık [rio-moqueca-balik] (8i/7s, 45dk, 380kcal, 0🔖+0📁)

#### dup: `moqueca`
- **⛔ WEAK**
- DB row: Moqueca [moqueca] (6i/5s, 50dk, 390kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.27 stepDiff=2 durationDiff=10% calDiff=3%
- shared title tokens: moqueca

#### dup: `moqueca-de-peixe`
- **⚠️ LOOSE**
- DB row: Moqueca de Peixe [moqueca-de-peixe] (9i/5s, 45dk, 312kcal, 0🔖+0📁)
- titleJacc=0.33 ingJacc=0.70 stepDiff=2 durationDiff=0% calDiff=18%
- shared title tokens: moqueca

---

### [cn/KAHVALTI] Canonical: `tea-eggs-cin-atistirmalik-usulu`

**Confidence (json):** high
**Reason:** Tekil ve çoğul başlık dışında aynı çay yumurtası; yumurta, siyah çay, soya sosu ve yıldız anason tabanı ile haşlama ve kabuk çatlatma akışı aynı.

**Canonical row:** Tea Eggs [tea-eggs-cin-atistirmalik-usulu] (5i/6s, 60dk, 82kcal, 0🔖+0📁)

#### dup: `tea-egg`
- **⛔ WEAK**
- DB row: Tea Egg [tea-egg] (4i/6s, 70dk, 80kcal, 0🔖+0📁)
- titleJacc=0.00 ingJacc=0.80 stepDiff=0 durationDiff=14% calDiff=2%
- shared title tokens: (yok)

---

### [cn/YEMEK] Canonical: `beijing-kung-pao-chicken`

**Confidence (json):** medium
**Reason:** Featured canonical ile aynı tavuk, soya sosu, sirke, kuru biber ve fıstık veya kaju wok yemeği; Beijing ve Pekin adları aynı şehir yazımı, farklar ölçü ve kuruyemiş düzeyinde.

**Canonical row:** ⭐ Beijing Kung Pao Chicken [beijing-kung-pao-chicken] (11i/7s, 27dk, 600kcal, 0🔖+0📁)

#### dup: `kung-pao-tavuk`
- **⛔ WEAK**
- DB row: Kung Pao Tavuk [kung-pao-tavuk] (5i/7s, 35dk, 430kcal, 0🔖+0📁)
- titleJacc=0.25 ingJacc=0.45 stepDiff=0 durationDiff=23% calDiff=28%
- shared title tokens: kung

#### dup: `sichuan-kung-pao-tavuk`
- **⛔ WEAK**
- DB row: Sichuan Kung Pao Tavuk [sichuan-kung-pao-tavuk] (8i/6s, 25dk, 420kcal, 0🔖+0📁)
- titleJacc=0.20 ingJacc=0.73 stepDiff=1 durationDiff=7% calDiff=30%
- shared title tokens: kung

#### dup: `pekin-kung-pao-tavuk`
- **⛔ WEAK**
- DB row: Pekin Kung Pao Tavuk [pekin-kung-pao-tavuk] (7i/5s, 30dk, 430kcal, 0🔖+0📁)
- titleJacc=0.20 ingJacc=0.38 stepDiff=2 durationDiff=10% calDiff=28%
- shared title tokens: kung

#### dup: `pekin-kung-pao-chicken`
- **⛔ WEAK**
- DB row: Pekin Kung Pao Chicken [pekin-kung-pao-chicken] (8i/5s, 32dk, 480kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.46 stepDiff=2 durationDiff=16% calDiff=20%
- shared title tokens: kung, chicken

---

### [cu/ATISTIRMALIK] Canonical: `maduros`

**Confidence (json):** medium
**Reason:** Olgun plantain veya muz dilimlerini yağda karamelleştirerek hazırlayan aynı Küba atıştırmalığı; canonical daha açıklayıcı step ve tuz dengesi içeriyor.

**Canonical row:** Maduros [maduros] (3i/5s, 20dk, 180kcal, 0🔖+0📁)

#### dup: `platanos-maduros-fritos`
- **⛔ WEAK**
- DB row: Platanos Maduros Fritos [platanos-maduros-fritos] (2i/4s, 15dk, 188kcal, 0🔖+0📁)
- titleJacc=0.33 ingJacc=0.25 stepDiff=1 durationDiff=25% calDiff=4%
- shared title tokens: maduros

---

### [cu/CORBA] Canonical: `sopa-de-frijoles-negros-kuba-usulu`

**Confidence (json):** medium
**Reason:** Üç tarif de siyah fasulye, soğan, su veya sebze suyu ile pişip bir kısmı ezilerek koyulaştırılan aynı çorba; canonical biber ve kimyonla daha zengin.

**Canonical row:** Sopa de Frijoles Negros [sopa-de-frijoles-negros-kuba-usulu] (5i/6s, 40dk, 212kcal, 0🔖+0📁)

#### dup: `black-bean-soup`
- **⛔ WEAK**
- DB row: Black Bean Soup [black-bean-soup] (4i/5s, 55dk, 230kcal, 0🔖+0📁)
- titleJacc=0.00 ingJacc=0.29 stepDiff=1 durationDiff=27% calDiff=8%
- shared title tokens: (yok)

#### dup: `siyah-fasulye-corbasi-kuba-usulu`
- **⛔ WEAK**
- DB row: Siyah Fasulye Çorbası [siyah-fasulye-corbasi-kuba-usulu] (4i/6s, 34dk, 188kcal, 0🔖+0📁)
- titleJacc=0.00 ingJacc=0.80 stepDiff=0 durationDiff=15% calDiff=11%
- shared title tokens: (yok)

---

### [cu/YEMEK] Canonical: `cuban-picadillo`

**Confidence (json):** medium
**Reason:** Featured canonical ile aynı dana kıyma, domates, zeytin ve kuru üzüm temeli var; Havana versiyonundaki patates ve kapari zenginleştirme gibi, ayrı ana tarif değil.

**Canonical row:** ⭐ Cuban Picadillo [cuban-picadillo] (5i/6s, 40dk, 390kcal, 0🔖+0📁)

#### dup: `picadillo-cubano`
- **⚠️ LOOSE**
- DB row: Picadillo Cubano [picadillo-cubano] (5i/5s, 50dk, 390kcal, 0🔖+0📁)
- titleJacc=0.33 ingJacc=1.00 stepDiff=1 durationDiff=20% calDiff=0%
- shared title tokens: picadillo

#### dup: `havana-picadillo-cubano`
- **⚠️ LOOSE**
- DB row: Havana Picadillo [havana-picadillo-cubano] (10i/7s, 50dk, 520kcal, 0🔖+0📁)
- titleJacc=0.33 ingJacc=0.50 stepDiff=1 durationDiff=20% calDiff=25%
- shared title tokens: picadillo

---

### [cu/YEMEK] Canonical: `ropa-vieja-pirinc-bowl-kuba-usulu`

**Confidence (json):** medium
**Reason:** Featured canonical dahil tüm tarifler didiklenmiş dana etini biberli domates sosunda pişiriyor; pilav veya tabak ifadesi servis katmanı olarak görünüyor.

**Canonical row:** ⭐ Ropa Vieja Pirinç Bowl [ropa-vieja-pirinc-bowl-kuba-usulu] (4i/6s, 34dk, 318kcal, 0🔖+0📁)

#### dup: `ropa-vieja`
- **⛔ WEAK**
- DB row: Ropa Vieja [ropa-vieja] (4i/6s, 145dk, 360kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.14 stepDiff=0 durationDiff=77% calDiff=12%
- shared title tokens: ropa, vieja

#### dup: `havana-ropa-vieja-tabagi`
- **⛔ WEAK**
- DB row: Havana Ropa Vieja Tabağı [havana-ropa-vieja-tabagi] (7i/5s, 155dk, 520kcal, 0🔖+0📁)
- titleJacc=0.40 ingJacc=0.10 stepDiff=1 durationDiff=78% calDiff=39%
- shared title tokens: ropa, vieja

#### dup: `havana-ropa-vieja-dana`
- **⛔ WEAK**
- DB row: Havana Ropa Vieja [havana-ropa-vieja-dana] (9i/6s, 180dk, 480kcal, 0🔖+0📁)
- titleJacc=0.40 ingJacc=0.08 stepDiff=0 durationDiff=81% calDiff=34%
- shared title tokens: ropa, vieja

#### dup: `havana-pilavli-ropa-vieja`
- **⛔ WEAK**
- DB row: Havana Pilavlı Ropa Vieja [havana-pilavli-ropa-vieja] (8i/5s, 140dk, 540kcal, 0🔖+0📁)
- titleJacc=0.33 ingJacc=0.09 stepDiff=1 durationDiff=76% calDiff=41%
- shared title tokens: ropa, vieja

---

### [cu/YEMEK] Canonical: `siyah-fasulyeli-pirinc-tava-kuba-usulu`

**Confidence (json):** medium
**Reason:** Pirinç, siyah fasulye, soğan, su ve dinlendirme adımları aynı; bowl ve tava farkı servis dili gibi, canonical yeşil biber ve kavurma adımıyla daha belirgin.

**Canonical row:** Siyah Fasulyeli Pirinç Tava [siyah-fasulyeli-pirinc-tava-kuba-usulu] (5i/5s, 30dk, 248kcal, 0🔖+0📁)

#### dup: `siyah-fasulyeli-pilav-bowl-kuba-usulu`
- **⚠️ LOOSE**
- DB row: Siyah Fasulyeli Pilav Bowl [siyah-fasulyeli-pilav-bowl-kuba-usulu] (5i/5s, 30dk, 226kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.67 stepDiff=0 durationDiff=0% calDiff=9%
- shared title tokens: siyah, fasulyeli

---

### [cu/YEMEK] Canonical: `vaca-frita-cubana`

**Confidence (json):** medium
**Reason:** İki tarif de haşlanmış veya didiklenmiş dana eti, lime, sarımsak ve soğanla tavada çıtırlaştırılan aynı Küba yemeği; canonical ingredient listesi daha zengin.

**Canonical row:** Vaca Frita Cubana [vaca-frita-cubana] (6i/6s, 35dk, 296kcal, 0🔖+0📁)

#### dup: `vaca-frita`
- **⛔ WEAK**
- DB row: Vaca Frita [vaca-frita] (4i/6s, 125dk, 410kcal, 0🔖+0📁)
- titleJacc=0.67 ingJacc=0.43 stepDiff=0 durationDiff=72% calDiff=28%
- shared title tokens: vaca, frita

---

### [cu/TATLI] Canonical: `flan-de-coco-cubano`

**Confidence (json):** medium
**Reason:** İki tarif de Hindistan cevizi sütü, yumurta ve karamel tabanlı aynı benmari flan akışını kullanıyor; canonical soğutma ve ters çevirme adımlarıyla daha ayrıntılı.

**Canonical row:** Flan de Coco Cubano [flan-de-coco-cubano] (4i/7s, 60dk, 254kcal, 0🔖+0📁)

#### dup: `flan-de-coco-kuba-usulu`
- **⛔ WEAK**
- DB row: Flan de Coco [flan-de-coco-kuba-usulu] (4i/6s, 50dk, 224kcal, 0🔖+0📁)
- titleJacc=0.67 ingJacc=0.33 stepDiff=1 durationDiff=17% calDiff=12%
- shared title tokens: flan, coco

---

## Onay icin tavsiye

**Otomatik onay (STRICT, user content yok):**
- `damper-ekmegi-avustralya-usulu` (canonical: `damper`)

**Manuel review gerekli (LOOSE veya user content):**
- `bal-kabakli-hindistancevizli-corba-avustralya-usulu` (metric loose)
- `avokadolu-misir-mucver-stack-avustralya-usulu` (metric loose)
- `melbourne-lamington-kareleri` (metric loose)
- `rio-feijoada` (metric loose)
- `rio-feijoada-fasulye` (metric loose)
- `moqueca-de-peixe` (metric loose)
- `picadillo-cubano` (metric loose)
- `havana-picadillo-cubano` (metric loose)
- `siyah-fasulyeli-pilav-bowl-kuba-usulu` (metric loose)

**Atlanmasi onerilen (WEAK, muhtemel varyant):**
- `sidney-lamington`
- `sydney-lamington-kareleri`
- `pao-de-queijo`
- `moqueca`
- `tea-egg`
- `kung-pao-tavuk`
- `sichuan-kung-pao-tavuk`
- `pekin-kung-pao-tavuk`
- `pekin-kung-pao-chicken`
- `platanos-maduros-fritos`
- `black-bean-soup`
- `siyah-fasulye-corbasi-kuba-usulu`
- `ropa-vieja`
- `havana-ropa-vieja-tabagi`
- `havana-ropa-vieja-dana`
- `havana-pilavli-ropa-vieja`
- `vaca-frita`
- `flan-de-coco-kuba-usulu`
