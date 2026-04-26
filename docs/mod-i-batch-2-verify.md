# Mod I Batch 2 verify raporu

Kaynak: `docs\mod-i-batch-2.json`
Cluster sayisi: 53
Toplam duplicate slug onerisi: 76

## Ozet

- STRICT (otomatik onay onerisi): **15**
- LOOSE (manuel review onerisi): **21**
- WEAK (varyant olabilir, atlamak guvenli): **40**
- MISSING (DB'de yok): **0**
- User content blokeli: **0**

---

### [de/APERATIF] Canonical: `berlin-currywurst`

**Confidence (json):** medium
**Reason:** Bratwurst, domatesli köri sosu ve patates servis kurgusu aynı; canonical sosu passata, et suyu, hardal ve ketçapla daha ayrıntılı kuruyor.

**Canonical row:** Berlin Currywurst [berlin-currywurst] (9i/7s, 35dk, 430kcal, 0🔖+0📁)

#### dup: `berlin-currywurst-tabagi`
- **⛔ WEAK**
- DB row: Berlin Currywurst Tabağı [berlin-currywurst-tabagi] (7i/5s, 28dk, 540kcal, 0🔖+0📁)
- titleJacc=1.00 ingJacc=0.14 stepDiff=2 durationDiff=20% calDiff=20%
- shared title tokens: berlin, currywurst

---

### [de/YEMEK] Canonical: `munih-bratwurst-lahana-tabagi`

**Confidence (json):** medium
**Reason:** Bratwurst, lahana turşusu, soğan, patates ve tavada kızartma akışı aynı; fark bira veya sebze suyu gibi küçük sıvı seçimine iniyor.

**Canonical row:** Münih Bratwurst Lahana Tabağı [munih-bratwurst-lahana-tabagi] (7i/6s, 35dk, 610kcal, 0🔖+0📁)

#### dup: `munih-bratwurst-lahana`
- **⚠️ LOOSE**
- DB row: Münih Lahanalı Bratwurst [munih-bratwurst-lahana] (8i/5s, 35dk, 580kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.50 stepDiff=1 durationDiff=0% calDiff=5%
- shared title tokens: munih, bratwurst

---

### [de/YEMEK] Canonical: `munich-schnitzel-patates-salatali`

**Confidence (json):** high
**Reason:** İki tarif de dana kontrfileyi un, yumurta ve galeta veya ekmek kırıntısıyla kaplayıp kızartıyor; patates salatası ve limon servisi de aynı.

**Canonical row:** Münih Schnitzel [munich-schnitzel-patates-salatali] (8i/7s, 40dk, 610kcal, 0🔖+0📁)

#### dup: `munih-patatesli-schnitzel-tabagi`
- **⚠️ LOOSE**
- DB row: Münih Patatesli Schnitzel Tabağı [munih-patatesli-schnitzel-tabagi] (6i/5s, 42dk, 610kcal, 0🔖+0📁)
- titleJacc=0.67 ingJacc=0.56 stepDiff=2 durationDiff=5% calDiff=0%
- shared title tokens: munih, schnitzel

---

### [es/APERATIF] Canonical: `madrid-patatas-bravas`

**Confidence (json):** medium
**Reason:** Patatesleri kızartıp acılı domatesli brava sosuyla servis eden aynı tapas; canonical soğan, sarımsak, paprika ve salçayla en zengin sosu veriyor.

**Canonical row:** Madrid Patatas Bravas [madrid-patatas-bravas] (8i/6s, 60dk, 210kcal, 0🔖+0📁)

#### dup: `patatas-bravas`
- **⛔ WEAK**
- DB row: Patatas Bravas [patatas-bravas] (5i/4s, 40dk, 280kcal, 0🔖+0📁)
- titleJacc=0.67 ingJacc=0.44 stepDiff=2 durationDiff=33% calDiff=25%
- shared title tokens: patatas, bravas

#### dup: `barselona-patatas-bravas`
- **⛔ WEAK**
- DB row: Barselona Patatas Bravas [barselona-patatas-bravas] (7i/5s, 46dk, 360kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.50 stepDiff=1 durationDiff=23% calDiff=42%
- shared title tokens: patatas, bravas

---

### [es/APERATIF] Canonical: `madrid-gambas-al-ajillo`

**Confidence (json):** high
**Reason:** Karides, bol zeytinyağı, sarımsak, acı biber ve maydanozla aynı tapas tavası; biri İspanyol adını, diğeri Türkçe açıklamasını kullanıyor.

**Canonical row:** Madrid Gambas al Ajillo [madrid-gambas-al-ajillo] (7i/5s, 16dk, 260kcal, 0🔖+0📁)

#### dup: `madrid-sarimsakli-karides-tavasi`
- **⛔ WEAK**
- DB row: Madrid Sarımsaklı Karides Tavası [madrid-sarimsakli-karides-tavasi] (7i/5s, 16dk, 260kcal, 0🔖+0📁)
- titleJacc=0.17 ingJacc=0.40 stepDiff=0 durationDiff=0% calDiff=0%
- shared title tokens: madrid

---

### [es/CORBA] Canonical: `sevilla-gazpacho`

**Confidence (json):** medium
**Reason:** Domates, salatalık, biber, ekmek, sarımsak, sirke ve zeytinyağıyla blenderda soğuk çorba akışı aynı; Sevilla kaydı en zengin ölçülü versiyon.

**Canonical row:** Sevilla Gazpacho [sevilla-gazpacho] (8i/6s, 140dk, 135kcal, 0🔖+0📁)

#### dup: `gazpacho`
- **⛔ WEAK**
- DB row: Gazpacho [gazpacho] (6i/6s, 15dk, 80kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.75 stepDiff=0 durationDiff=89% calDiff=41%
- shared title tokens: gazpacho

#### dup: `andaluz-gazpacho`
- **⛔ WEAK**
- DB row: Andaluz Gazpacho [andaluz-gazpacho] (8i/6s, 145dk, 140kcal, 0🔖+0📁)
- titleJacc=0.33 ingJacc=0.45 stepDiff=0 durationDiff=3% calDiff=4%
- shared title tokens: gazpacho

#### dup: `seville-gazpacho-andaluz`
- **⚠️ LOOSE**
- DB row: Sevilla Gazpacho Andaluz [seville-gazpacho-andaluz] (7i/5s, 140dk, 150kcal, 0🔖+0📁)
- titleJacc=0.67 ingJacc=0.50 stepDiff=1 durationDiff=0% calDiff=10%
- shared title tokens: sevilla, gazpacho

---

### [es/CORBA] Canonical: `sevilla-bademli-soguk-ajo-blanco`

**Confidence (json):** medium
**Reason:** Badem, bayat ekmek, sarımsak, zeytinyağı ve soğuk servis aynı ajo blanco temeli; canonical üzüm ve sirkeyle daha tamamlanmış.

**Canonical row:** Sevilla Bademli Soğuk Ajo Blanco [sevilla-bademli-soguk-ajo-blanco] (6i/5s, 15dk, 260kcal, 0🔖+0📁)

#### dup: `ajo-blanco-corbasi-ispanyol-usulu`
- **⛔ WEAK**
- DB row: Ajo Blanco Çorbası [ajo-blanco-corbasi-ispanyol-usulu] (5i/5s, 12dk, 182kcal, 0🔖+0📁)
- titleJacc=0.25 ingJacc=0.38 stepDiff=0 durationDiff=20% calDiff=30%
- shared title tokens: blanco

---

### [es/CORBA] Canonical: `sevilla-salmorejo-yumurtali`

**Confidence (json):** medium
**Reason:** Domates, ekmek, zeytinyağı ve soğuk blender çorbası aynı; canonical yumurta, jambon ve sirkeyle daha zengin servis veriyor.

**Canonical row:** Sevilla Salmorejo [sevilla-salmorejo-yumurtali] (8i/6s, 88dk, 240kcal, 0🔖+0📁)

#### dup: `salmorejo-ispanya-usulu`
- **⛔ WEAK**
- DB row: Salmorejo [salmorejo-ispanya-usulu] (5i/6s, 12dk, 146kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.44 stepDiff=0 durationDiff=86% calDiff=39%
- shared title tokens: salmorejo

---

### [es/KAHVALTI] Canonical: `tortilla-espanola`

**Confidence (json):** high
**Reason:** Patates, yumurta, soğan ve zeytinyağıyla tavada çevrilen aynı İspanyol omleti; Madrid adı içerik veya yöntem farkı yaratmıyor.

**Canonical row:** Tortilla Espanola [tortilla-espanola] (5i/7s, 40dk, 290kcal, 0🔖+0📁)

#### dup: `madrid-tortilla-espanola`
- **⛔ WEAK**
- DB row: Madrid Tortilla Española [madrid-tortilla-espanola] (6i/5s, 43dk, 390kcal, 0🔖+0📁)
- titleJacc=0.25 ingJacc=0.83 stepDiff=2 durationDiff=7% calDiff=26%
- shared title tokens: tortilla

---

### [es/TATLI] Canonical: `crema-catalana`

**Confidence (json):** medium
**Reason:** Süt, yumurta sarısı, şeker, nişasta ve üstten karamelize edilen krem akışı aynı; kavanoz ve kup farkı servis formatı gibi duruyor.

**Canonical row:** ⭐ Crema Catalana [crema-catalana] (5i/6s, 35dk, 230kcal, 0🔖+0📁)

#### dup: `barselona-crema-catalana`
- **⛔ WEAK**
- DB row: Barselona Crema Catalana [barselona-crema-catalana] (8i/7s, 285dk, 360kcal, 0🔖+0📁)
- titleJacc=0.67 ingJacc=0.44 stepDiff=1 durationDiff=88% calDiff=36%
- shared title tokens: crema, catalana

#### dup: `crema-catalana-kavanozu-ispanyol-usulu`
- **⚠️ LOOSE**
- DB row: Crema Catalana Kavanozu [crema-catalana-kavanozu-ispanyol-usulu] (4i/6s, 22dk, 224kcal, 0🔖+0📁)
- titleJacc=0.67 ingJacc=0.50 stepDiff=0 durationDiff=37% calDiff=3%
- shared title tokens: crema, catalana

#### dup: `limonlu-katalan-krem-kup-ispanya-usulu`
- **⛔ WEAK**
- DB row: Limonlu Katalan Krem Kup [limonlu-katalan-krem-kup-ispanya-usulu] (5i/6s, 20dk, 198kcal, 0🔖+0📁)
- titleJacc=0.00 ingJacc=0.43 stepDiff=0 durationDiff=43% calDiff=14%
- shared title tokens: (yok)

---

### [es/YEMEK] Canonical: `sevilla-nohutlu-ispanak-tavasi`

**Confidence (json):** high
**Reason:** Haşlanmış nohut, ıspanak, sarımsak, paprika ve zeytinyağıyla aynı tavada pişirme akışı var; canonical füme paprika ve limonla daha açıklayıcı.

**Canonical row:** Sevilla Nohutlu Ispanak Tavası [sevilla-nohutlu-ispanak-tavasi] (5i/5s, 28dk, 298kcal, 0🔖+0📁)

#### dup: `ispanakli-nohut-tava-ispanya-usulu`
- **⛔ WEAK**
- DB row: Ispanaklı Nohut Tava [ispanakli-nohut-tava-ispanya-usulu] (5i/5s, 28dk, 212kcal, 0🔖+0📁)
- titleJacc=0.00 ingJacc=0.67 stepDiff=0 durationDiff=0% calDiff=29%
- shared title tokens: (yok)

---

### [es/YEMEK] Canonical: `valensiya-deniz-urunlu-paella`

**Confidence (json):** medium
**Reason:** Paella pirinci, karides, midye, safran ve balık suyu tabanı aynı; canonical kalamar ve domatesle daha zengin deniz ürünü paellası.

**Canonical row:** Valensiya Deniz Ürünlü Paella [valensiya-deniz-urunlu-paella] (8i/5s, 60dk, 520kcal, 0🔖+0📁)

#### dup: `deniz-mahsullu-paella`
- **⚠️ LOOSE**
- DB row: ⭐ Deniz Mahsullü Paella [deniz-mahsullu-paella] (6i/7s, 70dk, 560kcal, 0🔖+0📁)
- titleJacc=0.40 ingJacc=0.56 stepDiff=2 durationDiff=14% calDiff=7%
- shared title tokens: deniz, paella

---

### [es/YEMEK] Canonical: `valensiya-paella-mixta`

**Confidence (json):** high
**Reason:** Valencia ve Valensiya aynı yer adının iki yazımı; tavuk, deniz ürünü, pirinç, safran ve bezelye ile aynı paella mixta akışı var.

**Canonical row:** ⭐ Valensiya Paella Mixta [valensiya-paella-mixta] (10i/7s, 85dk, 650kcal, 0🔖+0📁)

#### dup: `valencia-paella-mixta`
- **⚠️ LOOSE**
- DB row: Valencia Paella Mixta [valencia-paella-mixta] (10i/7s, 75dk, 560kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.64 stepDiff=0 durationDiff=12% calDiff=14%
- shared title tokens: paella, mixta

---

### [es/YEMEK] Canonical: `valencia-paella-valenciana-tavuklu`

**Confidence (json):** medium
**Reason:** Tavuk, paella pirinci, safran, tavuk suyu ve karıştırmadan pişirme akışı aynı; Valenciana kaydı yeşil fasulye ile daha geleneksel ve ayrıntılı.

**Canonical row:** Valencia Paella Valenciana [valencia-paella-valenciana-tavuklu] (8i/6s, 70dk, 540kcal, 0🔖+0📁)

#### dup: `valencia-tavuklu-paella`
- **⛔ WEAK**
- DB row: Valencia Tavuklu Paella [valencia-tavuklu-paella] (7i/5s, 58dk, 510kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.44 stepDiff=1 durationDiff=17% calDiff=6%
- shared title tokens: valencia, paella

---

### [et/YEMEK] Canonical: `addis-ababa-misir-wat`

**Confidence (json):** high
**Reason:** Wat ve Wot aynı yemeğin yazım farkı; kırmızı mercimek, soğan, sarımsak, berbere ve salça ile aynı koyu mercimek yahnisini kuruyor.

**Canonical row:** Addis Ababa Misir Wat [addis-ababa-misir-wat] (8i/6s, 60dk, 260kcal, 0🔖+0📁)

#### dup: `addis-ababa-misir-wot`
- **✅ STRICT**
- DB row: Addis Ababa Misir Wot [addis-ababa-misir-wot] (8i/5s, 47dk, 330kcal, 0🔖+0📁)
- titleJacc=1.00 ingJacc=0.60 stepDiff=1 durationDiff=22% calDiff=21%
- shared title tokens: addis, ababa, misir

---

### [fr/CORBA] Canonical: `bouillabaisse`

**Confidence (json):** medium
**Reason:** Featured canonical ile aynı beyaz balık, karides, balık suyu, rezene, domates, safran ve ekmek servisi var; Marsilya kaydı daha zengin deniz ürünü ekliyor.

**Canonical row:** ⭐ Bouillabaisse [bouillabaisse] (7i/5s, 75dk, 260kcal, 0🔖+0📁)

#### dup: `marsilya-bouillabaisse-safranli`
- **⛔ WEAK**
- DB row: Marsilya Bouillabaisse [marsilya-bouillabaisse-safranli] (11i/7s, 105dk, 520kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.38 stepDiff=2 durationDiff=29% calDiff=50%
- shared title tokens: bouillabaisse

---

### [fr/CORBA] Canonical: `paris-sogan-corbasi`

**Confidence (json):** medium
**Reason:** Soğanı tereyağıyla uzun kavurma, unla bağlama, et suyu ve peynirli ekmek servisi aynı; Paris kaydı Gruyere ve şarapla daha zengin.

**Canonical row:** Paris Soğan Çorbası [paris-sogan-corbasi] (8i/7s, 75dk, 460kcal, 0🔖+0📁)

#### dup: `sogan-corbasi`
- **⛔ WEAK**
- DB row: Soğan Çorbası [sogan-corbasi] (8i/6s, 60dk, 260kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.45 stepDiff=1 durationDiff=20% calDiff=43%
- shared title tokens: sogan

---

### [fr/SALATA] Canonical: `nice-salade-nicoise`

**Confidence (json):** medium
**Reason:** Ton balığı, yumurta, yeşil fasulye, domates veya patates, zeytin ve hardallı sos kurgusu aynı; Nice kaydı en zengin ingredient ve step içeriyor.

**Canonical row:** Nice Salade Niçoise [nice-salade-nicoise] (9i/7s, 43dk, 390kcal, 0🔖+0📁)

#### dup: `nicoise-salatasi`
- **⛔ WEAK**
- DB row: Niçoise Salatası [nicoise-salatasi] (6i/6s, 45dk, 310kcal, 0🔖+0📁)
- titleJacc=0.33 ingJacc=0.25 stepDiff=1 durationDiff=4% calDiff=21%
- shared title tokens: nicoise

#### dup: `salade-nicoise-fransiz-bistro-usulu`
- **⛔ WEAK**
- DB row: ⭐ Salade Niçoise [salade-nicoise-fransiz-bistro-usulu] (5i/5s, 26dk, 254kcal, 0🔖+0📁)
- titleJacc=0.67 ingJacc=0.27 stepDiff=2 durationDiff=40% calDiff=35%
- shared title tokens: salade, nicoise

---

### [fr/SALATA] Canonical: `lyon-salata-lyonnaise`

**Confidence (json):** medium
**Reason:** Frisee veya yeşillik, pastırma, poşe yumurta, kruton ve hardallı sos aynı salata yapısını veriyor; Lyon kaydı daha ayrıntılı.

**Canonical row:** Lyon Salata Lyonnaise [lyon-salata-lyonnaise] (8i/6s, 32dk, 330kcal, 0🔖+0📁)

#### dup: `salade-lyonnaise`
- **⛔ WEAK**
- DB row: Salade Lyonnaise [salade-lyonnaise] (4i/5s, 30dk, 280kcal, 0🔖+0📁)
- titleJacc=0.33 ingJacc=0.20 stepDiff=1 durationDiff=6% calDiff=15%
- shared title tokens: lyonnaise

---

### [fr/YEMEK] Canonical: `coq-au-vin`

**Confidence (json):** medium
**Reason:** Featured canonical ile aynı tavuk, kırmızı şarap, mantar, arpacık soğan, un ve uzun pişirme akışı var; Burgonya adı gerçek içerik farkı oluşturmuyor.

**Canonical row:** ⭐ Coq au Vin [coq-au-vin] (6i/7s, 120dk, 420kcal, 0🔖+0📁)

#### dup: `burgonya-coq-au-vin`
- **⛔ WEAK**
- DB row: Burgonya Coq au Vin [burgonya-coq-au-vin] (8i/5s, 125dk, 610kcal, 0🔖+0📁)
- titleJacc=0.00 ingJacc=0.86 stepDiff=2 durationDiff=4% calDiff=31%
- shared title tokens: (yok)

---

### [fr/YEMEK] Canonical: `quiche-lorraine`

**Confidence (json):** medium
**Reason:** Tart hamuru, yumurta, krema, pastırma veya bacon ve fırında set olan dolgu aynı; peynir ve süt farkları küçük zenginleştirme düzeyinde.

**Canonical row:** Quiche Lorraine [quiche-lorraine] (5i/7s, 70dk, 460kcal, 0🔖+0📁)

#### dup: `lorraine-kis-tart`
- **⛔ WEAK**
- DB row: Lorraine Kiş Tart [lorraine-kis-tart] (7i/7s, 90dk, 510kcal, 0🔖+0📁)
- titleJacc=0.33 ingJacc=0.33 stepDiff=0 durationDiff=22% calDiff=10%
- shared title tokens: lorraine

#### dup: `lyon-quiche-lorraine`
- **⛔ WEAK**
- DB row: Lyon Quiche Lorraine [lyon-quiche-lorraine] (7i/5s, 70dk, 580kcal, 0🔖+0📁)
- titleJacc=0.67 ingJacc=0.33 stepDiff=2 durationDiff=0% calDiff=21%
- shared title tokens: quiche, lorraine

---

### [fr/YEMEK] Canonical: `gratin-dauphinois`

**Confidence (json):** medium
**Reason:** İnce patates, krema, süt, sarımsak, muskat ve fırında katmanlı pişirme aynı; Patates Graten kaydı kaşar ekliyor ama ana tarif aynı.

**Canonical row:** Gratin Dauphinois [gratin-dauphinois] (5i/6s, 80dk, 340kcal, 0🔖+0📁)

#### dup: `patates-graten`
- **⛔ WEAK**
- DB row: Patates Graten [patates-graten] (6i/6s, 70dk, 320kcal, 0🔖+0📁)
- titleJacc=0.00 ingJacc=0.83 stepDiff=0 durationDiff=13% calDiff=6%
- shared title tokens: (yok)

---

### [fr/YEMEK] Canonical: `paris-ratatouille-tenceresi`

**Confidence (json):** medium
**Reason:** Patlıcan, kabak, biber, domates, soğan, sarımsak ve zeytinyağıyla aynı ratatouille sebze yemeği; fırın, güveç veya tencere ifadeleri yöntem varyasyonu gibi duruyor.

**Canonical row:** ⭐ Paris Ratatouille Tenceresi [paris-ratatouille-tenceresi] (8i/6s, 65dk, 250kcal, 0🔖+0📁)

#### dup: `ratatouille`
- **⚠️ LOOSE**
- DB row: Ratatouille [ratatouille] (6i/6s, 75dk, 170kcal, 0🔖+0📁)
- titleJacc=0.33 ingJacc=0.56 stepDiff=0 durationDiff=13% calDiff=32%
- shared title tokens: ratatouille

#### dup: `nice-firin-ratatouille`
- **⛔ WEAK**
- DB row: Nice Fırın Ratatouille [nice-firin-ratatouille] (8i/5s, 67dk, 240kcal, 0🔖+0📁)
- titleJacc=0.20 ingJacc=0.60 stepDiff=1 durationDiff=3% calDiff=4%
- shared title tokens: ratatouille

#### dup: `paris-ratatouille-guvec`
- **✅ STRICT**
- DB row: Paris Ratatouille Güveç [paris-ratatouille-guvec] (8i/5s, 70dk, 190kcal, 0🔖+0📁)
- titleJacc=0.67 ingJacc=0.78 stepDiff=1 durationDiff=7% calDiff=24%
- shared title tokens: paris, ratatouille

#### dup: `provence-ratatouille-tenceresi`
- **⚠️ LOOSE**
- DB row: Provence Ratatouille Tenceresi [provence-ratatouille-tenceresi] (8i/6s, 70dk, 210kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.78 stepDiff=0 durationDiff=7% calDiff=16%
- shared title tokens: ratatouille, tenceresi

---

### [gr/CORBA] Canonical: `fasolada-yunan-usulu`

**Confidence (json):** high
**Reason:** Beyaz fasulye, havuç, domates, zeytinyağı ve bir kısmını ezerek koyulaştırma akışı aynı; başlıkta çorba eklenmesi ayrı tarif oluşturmuyor.

**Canonical row:** Fasolada [fasolada-yunan-usulu] (5i/6s, 47dk, 216kcal, 0🔖+0📁)

#### dup: `fasolada-corbasi-yunan-usulu`
- **✅ STRICT**
- DB row: Fasolada Çorbası [fasolada-corbasi-yunan-usulu] (5i/5s, 36dk, 184kcal, 0🔖+0📁)
- titleJacc=1.00 ingJacc=0.67 stepDiff=1 durationDiff=23% calDiff=15%
- shared title tokens: fasolada

---

### [gr/YEMEK] Canonical: `moussaka`

**Confidence (json):** medium
**Reason:** Featured canonical dahil tüm kayıtlar patlıcan, kıyma, domatesli sos ve beşamel katmanlarını fırında pişiriyor; patates veya kase farkı servis ve zenginleştirme düzeyinde.

**Canonical row:** ⭐ Moussaka [moussaka] (6i/7s, 100dk, 480kcal, 0🔖+0📁)

#### dup: `atina-moussaka`
- **⚠️ LOOSE**
- DB row: Atina Fırın Moussaka [atina-moussaka] (8i/6s, 110dk, 640kcal, 0🔖+0📁)
- titleJacc=0.33 ingJacc=0.56 stepDiff=1 durationDiff=9% calDiff=25%
- shared title tokens: moussaka

#### dup: `atina-musakka-patlicanli`
- **⛔ WEAK**
- DB row: Atina Musakka [atina-musakka-patlicanli] (11i/7s, 140dk, 540kcal, 0🔖+0📁)
- titleJacc=0.00 ingJacc=0.42 stepDiff=0 durationDiff=29% calDiff=11%
- shared title tokens: (yok)

#### dup: `atina-musakka-firini`
- **⛔ WEAK**
- DB row: Atina Musakka Fırını [atina-musakka-firini] (9i/6s, 135dk, 610kcal, 0🔖+0📁)
- titleJacc=0.00 ingJacc=0.50 stepDiff=1 durationDiff=26% calDiff=21%
- shared title tokens: (yok)

#### dup: `atina-musakka-kasesi`
- **⛔ WEAK**
- DB row: Atina Musakka Kasesi [atina-musakka-kasesi] (7i/5s, 90dk, 540kcal, 0🔖+0📁)
- titleJacc=0.00 ingJacc=0.63 stepDiff=2 durationDiff=10% calDiff=11%
- shared title tokens: (yok)

#### dup: `selanik-firin-musakka`
- **⛔ WEAK**
- DB row: ⭐ Selanik Fırın Musakka [selanik-firin-musakka] (8i/5s, 115dk, 540kcal, 0🔖+0📁)
- titleJacc=0.00 ingJacc=0.56 stepDiff=2 durationDiff=13% calDiff=11%
- shared title tokens: (yok)

---

### [gr/YEMEK] Canonical: `spanakopita`

**Confidence (json):** medium
**Reason:** Featured canonical ile aynı yufka veya filo, ıspanak, feta veya beyaz peynir, yumurta ve zeytinyağlı fırın böreği; şehir adı ana tarif farkı yaratmıyor.

**Canonical row:** ⭐ Spanakopita [spanakopita] (5i/5s, 70dk, 310kcal, 0🔖+0📁)

#### dup: `atina-spanakopita`
- **⚠️ LOOSE**
- DB row: Atina Spanakopita [atina-spanakopita] (7i/7s, 80dk, 340kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.71 stepDiff=2 durationDiff=13% calDiff=9%
- shared title tokens: spanakopita

#### dup: `thessaloniki-spanakopita`
- **⛔ WEAK**
- DB row: Selanik Spanakopita [thessaloniki-spanakopita] (8i/7s, 75dk, 330kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.44 stepDiff=2 durationDiff=7% calDiff=6%
- shared title tokens: spanakopita

---

### [hu/CORBA] Canonical: `gulas-corbasi-macar-usulu`

**Confidence (json):** medium
**Reason:** Featured canonical ile aynı dana eti, patates, soğan, paprika ve sulu çorba pişirme yapısı var; Budapeşte kayıtları daha uzun ve zengin ölçülü.

**Canonical row:** ⭐ Gulaş Çorbası [gulas-corbasi-macar-usulu] (5i/6s, 44dk, 284kcal, 0🔖+0📁)

#### dup: `budapeste-gulyas-corbasi`
- **⛔ WEAK**
- DB row: Budapeşte Gulyas Çorbası [budapeste-gulyas-corbasi] (7i/5s, 95dk, 390kcal, 0🔖+0📁)
- titleJacc=0.00 ingJacc=0.20 stepDiff=1 durationDiff=54% calDiff=27%
- shared title tokens: (yok)

#### dup: `budapeste-paprikali-gulyas-corbasi`
- **⛔ WEAK**
- DB row: Budapeşte Gulyás Çorbası [budapeste-paprikali-gulyas-corbasi] (8i/6s, 110dk, 420kcal, 0🔖+0📁)
- titleJacc=0.00 ingJacc=0.18 stepDiff=0 durationDiff=60% calDiff=32%
- shared title tokens: (yok)

---

### [hu/TATLI] Canonical: `dobos-torta`

**Confidence (json):** high
**Reason:** Başlık dili dışında aynı Dobos pastası; yumurta, un, şeker, tereyağı, bitter çikolata, katlı pandispanya ve karamelli üst akışı birebir örtüşüyor.

**Canonical row:** ⭐ Dobos Torta [dobos-torta] (5i/6s, 70dk, 334kcal, 0🔖+0📁)

#### dup: `dobos-torte`
- **⚠️ LOOSE**
- DB row: Dobos Torte [dobos-torte] (5i/6s, 105dk, 450kcal, 0🔖+0📁)
- titleJacc=0.33 ingJacc=0.67 stepDiff=0 durationDiff=33% calDiff=26%
- shared title tokens: dobos

---

### [hu/YEMEK] Canonical: `chicken-paprikash`

**Confidence (json):** medium
**Reason:** Tavuk, soğan, tatlı paprika ve ekşi krema ile aynı paprikash ana yemeği; nokedli yan servis olarak eklenmiş, ana tarif değişmiyor.

**Canonical row:** Chicken Paprikash [chicken-paprikash] (4i/6s, 65dk, 410kcal, 0🔖+0📁)

#### dup: `paprikas-csirke-macar-usulu`
- **⛔ WEAK**
- DB row: Paprikás Csirke [paprikas-csirke-macar-usulu] (5i/6s, 44dk, 286kcal, 0🔖+0📁)
- titleJacc=0.00 ingJacc=0.29 stepDiff=0 durationDiff=32% calDiff=30%
- shared title tokens: (yok)

#### dup: `budapeste-tavuk-paprikash`
- **⛔ WEAK**
- DB row: Budapeşte Tavuk Paprikash [budapeste-tavuk-paprikash] (9i/6s, 70dk, 480kcal, 0🔖+0📁)
- titleJacc=0.25 ingJacc=0.50 stepDiff=0 durationDiff=7% calDiff=15%
- shared title tokens: paprikash

#### dup: `budapeste-tavuk-paprikas-nokedli`
- **⛔ WEAK**
- DB row: Budapeşte Tavuk Paprikaş Nokedli [budapeste-tavuk-paprikas-nokedli] (7i/5s, 70dk, 560kcal, 0🔖+0📁)
- titleJacc=0.00 ingJacc=0.57 stepDiff=1 durationDiff=7% calDiff=27%
- shared title tokens: (yok)

---

### [hu/YEMEK] Canonical: `budapest-gulas-yahnisi`

**Confidence (json):** medium
**Reason:** Dana eti, soğan, patates, paprika, domates ve uzun pişirme akışı aynı gulaş yahnisi; Budapeşte kaydı biber ve domatesle daha zengin.

**Canonical row:** Budapeşte Gulaş Yahnisi [budapest-gulas-yahnisi] (7i/5s, 140dk, 520kcal, 0🔖+0📁)

#### dup: `macar-gulasi`
- **⛔ WEAK**
- DB row: Macar Gulaşı [macar-gulasi] (7i/6s, 115dk, 390kcal, 0🔖+0📁)
- titleJacc=0.00 ingJacc=0.75 stepDiff=1 durationDiff=18% calDiff=25%
- shared title tokens: (yok)

---

### [hu/YEMEK] Canonical: `turos-csusza-macar-usulu`

**Confidence (json):** medium
**Reason:** Erişte, lor peyniri, ekşi krema veya yoğurt ve tereyağıyla aynı Macar erişte tabağı; tava ve fırın adları pratik servis farkı gibi.

**Canonical row:** Túrós Csusza [turos-csusza-macar-usulu] (4i/6s, 25dk, 336kcal, 0🔖+0📁)

#### dup: `turos-csusza-tava-macar-usulu`
- **✅ STRICT**
- DB row: Túrós Csusza Tava [turos-csusza-tava-macar-usulu] (4i/6s, 22dk, 294kcal, 0🔖+0📁)
- titleJacc=1.00 ingJacc=0.60 stepDiff=0 durationDiff=12% calDiff=13%
- shared title tokens: csusza

#### dup: `firin-turos-csusza`
- **⚠️ LOOSE**
- DB row: Fırın Túrós Csusza [firin-turos-csusza] (4i/5s, 30dk, 420kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=1.00 stepDiff=1 durationDiff=17% calDiff=20%
- shared title tokens: csusza

---

### [id/CORBA] Canonical: `jakarta-soto-ayam-tavuklu`

**Confidence (json):** medium
**Reason:** Tavuk but, pirinç noodle, yumurta, zerdeçal, limon otu, sarımsak, zencefil ve lime ile aynı tavuk soto çorbası; canonical daha fazla aromatik içeriyor.

**Canonical row:** Jakarta Soto Ayam [jakarta-soto-ayam-tavuklu] (11i/7s, 70dk, 360kcal, 0🔖+0📁)

#### dup: `surabaya-tavuk-soto`
- **⛔ WEAK**
- DB row: Surabaya Tavuk Soto [surabaya-tavuk-soto] (8i/5s, 80dk, 420kcal, 0🔖+0📁)
- titleJacc=0.20 ingJacc=0.80 stepDiff=2 durationDiff=13% calDiff=14%
- shared title tokens: soto

---

### [id/YEMEK] Canonical: `jakarta-nasi-goreng-ayamli`

**Confidence (json):** high
**Reason:** İki featured tarif de soğuk pirinç, tavuk, yumurta, kecap manis, soya sosu, arpacık soğan ve biberle aynı tavuklu nasi goreng.

**Canonical row:** ⭐ Jakarta Nasi Goreng Ayam [jakarta-nasi-goreng-ayamli] (9i/6s, 30dk, 445kcal, 0🔖+0📁)

#### dup: `jakarta-nasi-goreng-ayam`
- **✅ STRICT**
- DB row: ⭐ Jakarta Tavuklu Nasi Goreng [jakarta-nasi-goreng-ayam] (8i/5s, 33dk, 520kcal, 0🔖+0📁)
- titleJacc=0.60 ingJacc=0.70 stepDiff=1 durationDiff=9% calDiff=14%
- shared title tokens: jakarta, nasi, goreng

---

### [id/YEMEK] Canonical: `cakarta-yumurtali-nasi-goreng`

**Confidence (json):** high
**Reason:** Cakarta ve Jakarta aynı şehir adının iki yazımı; soğuk pirinç, yumurta, kecap manis, soya sosu, sarımsak ve arpacık soğan tabanı aynı.

**Canonical row:** ⭐ Cakarta Yumurtalı Nasi Goreng [cakarta-yumurtali-nasi-goreng] (7i/5s, 24dk, 640kcal, 0🔖+0📁)

#### dup: `jakarta-nasi-goreng-telur`
- **⚠️ LOOSE**
- DB row: ⭐ Jakarta Nasi Goreng Telur [jakarta-nasi-goreng-telur] (8i/6s, 24dk, 520kcal, 0🔖+0📁)
- titleJacc=0.33 ingJacc=0.67 stepDiff=1 durationDiff=0% calDiff=19%
- shared title tokens: nasi, goreng

---

### [in/ICECEK] Canonical: `masala-chai`

**Confidence (json):** medium
**Reason:** Featured canonical ile siyah çay, süt, su, kakule ve tarçınlı aynı baharatlı çay; Masala Çayı kaydı zencefil ve şeker ekliyor.

**Canonical row:** ⭐ Masala Chai [masala-chai] (5i/3s, 15dk, 140kcal, 0🔖+0📁)

#### dup: `masala-cayi`
- **⚠️ LOOSE**
- DB row: Masala Çayı [masala-cayi] (7i/3s, 17dk, 120kcal, 0🔖+0📁)
- titleJacc=0.33 ingJacc=0.71 stepDiff=0 durationDiff=12% calDiff=14%
- shared title tokens: masala

---

### [in/ICECEK] Canonical: `mango-lassi`

**Confidence (json):** high
**Reason:** Mango, yoğurt, süt ve kakule ile blenderda çekilen aynı içecek; shake kelimesi ayrı tarif farkı oluşturmuyor.

**Canonical row:** Mango Lassi [mango-lassi] (5i/3s, 6dk, 220kcal, 0🔖+0📁)

#### dup: `mango-lassi-shake`
- **✅ STRICT**
- DB row: Mango Lassi Shake [mango-lassi-shake] (4i/3s, 7dk, 190kcal, 0🔖+0📁)
- titleJacc=1.00 ingJacc=0.80 stepDiff=0 durationDiff=14% calDiff=14%
- shared title tokens: mango, lassi

---

### [in/ICECEK] Canonical: `altin-sut`

**Confidence (json):** medium
**Reason:** İki tarif de süt, zerdeçal, sıcak tencere ısıtması ve bal ile aynı altın süt içeceği; tarçın veya zencefil farkı küçük aroma değişimi.

**Canonical row:** Altın Süt [altin-sut] (4i/3s, 12dk, 120kcal, 0🔖+0📁)

#### dup: `zerdecalli-altin-sut`
- **⚠️ LOOSE**
- DB row: Zerdeçallı Altın Süt [zerdecalli-altin-sut] (4i/3s, 10dk, 114kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.60 stepDiff=0 durationDiff=17% calDiff=5%
- shared title tokens: altin

---

### [in/KAHVALTI] Canonical: `poha`

**Confidence (json):** medium
**Reason:** Poha, soğan, yer fıstığı, zerdeçal ve limonlu aynı kahvaltı tavası; fıstık vurgusu canonical tarifte zaten mevcut.

**Canonical row:** Poha [poha] (5i/5s, 22dk, 241kcal, 0🔖+0📁)

#### dup: `poha-peanut-hint-kahvalti-usulu`
- **⚠️ LOOSE**
- DB row: Poha Fıstıklı Kahvaltı [poha-peanut-hint-kahvalti-usulu] (5i/5s, 18dk, 196kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=1.00 stepDiff=0 durationDiff=18% calDiff=19%
- shared title tokens: poha

---

### [in/TATLI] Canonical: `gajar-halwa-hint-kis-usulu`

**Confidence (json):** medium
**Reason:** Havuç, süt, şeker ve kakuleyle pişen aynı halwa; kup kaydı servis kabı ve kaju farkı dışında ana tarifi değiştirmiyor.

**Canonical row:** Gajar Halwa [gajar-halwa-hint-kis-usulu] (5i/6s, 42dk, 212kcal, 0🔖+0📁)

#### dup: `gajar-halwa-kup-hint-usulu`
- **✅ STRICT**
- DB row: Gajar Halwa Kup [gajar-halwa-kup-hint-usulu] (5i/6s, 32dk, 214kcal, 0🔖+0📁)
- titleJacc=1.00 ingJacc=0.67 stepDiff=0 durationDiff=24% calDiff=1%
- shared title tokens: gajar, halwa

---

### [in/YEMEK] Canonical: `delhi-butter-chicken`

**Confidence (json):** medium
**Reason:** Featured Delhi kaydıyla aynı yoğurt marine tavuk, domates püresi, tereyağı, krema ve garam masala tabanı var; makhani ve tereyağlı adları aynı yemeği işaret ediyor.

**Canonical row:** ⭐ Delhi Butter Chicken [delhi-butter-chicken] (10i/7s, 275dk, 520kcal, 0🔖+0📁)

#### dup: `butter-chicken`
- **✅ STRICT**
- DB row: ⭐ Butter Chicken [butter-chicken] (6i/6s, 70dk, 490kcal, 0🔖+0📁)
- titleJacc=0.67 ingJacc=0.60 stepDiff=1 durationDiff=75% calDiff=6%
- shared title tokens: butter, chicken

#### dup: `delhi-makhani-tavuk-korisi`
- **✅ STRICT**
- DB row: Delhi Butter Chicken Makhani [delhi-makhani-tavuk-korisi] (8i/6s, 70dk, 560kcal, 0🔖+0📁)
- titleJacc=0.75 ingJacc=0.80 stepDiff=1 durationDiff=75% calDiff=7%
- shared title tokens: delhi, butter, chicken

#### dup: `delhi-tereyagli-tavuk-makhani`
- **⛔ WEAK**
- DB row: Delhi Tereyağlı Tavuk [delhi-tereyagli-tavuk-makhani] (9i/6s, 145dk, 520kcal, 0🔖+0📁)
- titleJacc=0.20 ingJacc=0.73 stepDiff=1 durationDiff=47% calDiff=0%
- shared title tokens: delhi

---

### [in/YEMEK] Canonical: `mumbai-palak-paneer`

**Confidence (json):** medium
**Reason:** Ispanak püresi, paneer, soğan, domates ve garam masala ile aynı palak paneer; Mumbai kaydı sarımsak, zencefil, zerdeçal ve krema ile daha ayrıntılı.

**Canonical row:** Mumbai Palak Paneer [mumbai-palak-paneer] (9i/7s, 45dk, 380kcal, 0🔖+0📁)

#### dup: `palak-paneer`
- **⚠️ LOOSE**
- DB row: Palak Paneer [palak-paneer] (5i/6s, 45dk, 310kcal, 0🔖+0📁)
- titleJacc=0.67 ingJacc=0.56 stepDiff=1 durationDiff=0% calDiff=18%
- shared title tokens: palak, paneer

---

### [in/YEMEK] Canonical: `punjab-chana-masala`

**Confidence (json):** medium
**Reason:** Haşlanmış nohut, soğan, domates, zencefil, sarımsak ve garam masala tabanı aynı; Punjab kaydı daha fazla baharat ve step içeriyor.

**Canonical row:** Punjab Chana Masala [punjab-chana-masala] (8i/7s, 50dk, 260kcal, 0🔖+0📁)

#### dup: `chana-masala`
- **⚠️ LOOSE**
- DB row: Chana Masala [chana-masala] (4i/6s, 50dk, 310kcal, 0🔖+0📁)
- titleJacc=0.67 ingJacc=0.50 stepDiff=1 durationDiff=0% calDiff=16%
- shared title tokens: chana, masala

---

### [in/YEMEK] Canonical: `rajma`

**Confidence (json):** high
**Reason:** Haşlanmış barbunya, soğan, domates püresi, garam masala ve zencefil veya sarımsakla aynı rajma masala akışı var.

**Canonical row:** Rajma [rajma] (5i/5s, 50dk, 272kcal, 0🔖+0📁)

#### dup: `rajma-masala-hint-usulu`
- **⚠️ LOOSE**
- DB row: Rajma Masala [rajma-masala-hint-usulu] (5i/5s, 40dk, 248kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.67 stepDiff=0 durationDiff=20% calDiff=9%
- shared title tokens: rajma

---

### [in/YEMEK] Canonical: `mumbai-pav-bhaji-tereyagli`

**Confidence (json):** medium
**Reason:** Patates, karnabahar, bezelye, domates, pav bhaji baharatı, tereyağı ve ekmek servisi aynı; canonical daha zengin ve ölçülü.

**Canonical row:** Mumbai Pav Bhaji [mumbai-pav-bhaji-tereyagli] (9i/6s, 65dk, 480kcal, 0🔖+0📁)

#### dup: `mumbai-sebzeli-pav-bhaji`
- **✅ STRICT**
- DB row: Mumbai Sebzeli Pav Bhaji [mumbai-sebzeli-pav-bhaji] (7i/5s, 56dk, 410kcal, 0🔖+0📁)
- titleJacc=0.67 ingJacc=0.67 stepDiff=1 durationDiff=14% calDiff=15%
- shared title tokens: mumbai, bhaji

---

### [it/ATISTIRMALIK] Canonical: `suppli`

**Confidence (json):** medium
**Reason:** Aynı type içinde soğuk risotto pirinci, mozzarella, yumurta, galeta unu ve kızartma akışı neredeyse aynı; canonical featured ve daha açıklayıcı.

**Canonical row:** ⭐ Suppli [suppli] (5i/5s, 40dk, 290kcal, 0🔖+0📁)

#### dup: `mini-arancini`
- **⛔ WEAK**
- DB row: Mini Arancini [mini-arancini] (4i/5s, 35dk, 230kcal, 0🔖+0📁)
- titleJacc=0.00 ingJacc=0.80 stepDiff=0 durationDiff=13% calDiff=21%
- shared title tokens: (yok)

---

### [it/CORBA] Canonical: `floransa-ribollita-corbasi`

**Confidence (json):** medium
**Reason:** Kara lahana, beyaz fasulye, bayat ekmek, soğan, havuç veya kereviz ve domatesli aynı ribollita çorbası; canonical en zengin kaydı veriyor.

**Canonical row:** Floransa Ribollita Çorbası [floransa-ribollita-corbasi] (10i/7s, 60dk, 300kcal, 0🔖+0📁)

#### dup: `ribollita`
- **⛔ WEAK**
- DB row: Ribollita [ribollita] (5i/6s, 65dk, 240kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.36 stepDiff=1 durationDiff=8% calDiff=20%
- shared title tokens: ribollita

#### dup: `floransa-ribollita-corba`
- **⚠️ LOOSE**
- DB row: Floransa Ribollita Çorba [floransa-ribollita-corba] (7i/5s, 80dk, 310kcal, 0🔖+0📁)
- titleJacc=1.00 ingJacc=0.55 stepDiff=2 durationDiff=25% calDiff=3%
- shared title tokens: floransa, ribollita

---

### [it/TATLI] Canonical: `tiramisu`

**Confidence (json):** medium
**Reason:** Mascarpone kreması, kedidili, kahve ve kakao katmanları aynı; kup kaydı Marsala ve bardak servisiyle format değiştiriyor.

**Canonical row:** Tiramisu [tiramisu] (7i/6s, 45dk, 420kcal, 0🔖+0📁)

#### dup: `venedik-tiramisu-kup`
- **⛔ WEAK**
- DB row: Venedik Tiramisu Kup [venedik-tiramisu-kup] (7i/7s, 270dk, 520kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.40 stepDiff=1 durationDiff=83% calDiff=19%
- shared title tokens: tiramisu

---

### [it/YEMEK] Canonical: `spaghetti-carbonara`

**Confidence (json):** medium
**Reason:** Featured canonical ile spaghetti, yumurta, pecorino veya parmesan, pastırma veya guanciale ve karabiberli aynı carbonara akışı var.

**Canonical row:** ⭐ Spaghetti Carbonara [spaghetti-carbonara] (6i/5s, 25dk, 650kcal, 0🔖+0📁)

#### dup: `rome-carbonara`
- **✅ STRICT**
- DB row: Roma Spaghetti Carbonara [rome-carbonara] (7i/7s, 30dk, 650kcal, 0🔖+0📁)
- titleJacc=0.67 ingJacc=0.63 stepDiff=2 durationDiff=17% calDiff=0%
- shared title tokens: spaghetti, carbonara

---

### [it/YEMEK] Canonical: `napoli-gnocchi-alla-sorrentina`

**Confidence (json):** high
**Reason:** Patates gnocchi, domates püresi, mozzarella, parmesan ve fırında peynir eritme akışı aynı; Napoli adı içerik farkı yaratmıyor.

**Canonical row:** Napoli Gnocchi alla Sorrentina [napoli-gnocchi-alla-sorrentina] (6i/5s, 40dk, 480kcal, 0🔖+0📁)

#### dup: `gnocchi-alla-sorrentina`
- **✅ STRICT**
- DB row: Gnocchi Alla Sorrentina [gnocchi-alla-sorrentina] (5i/6s, 50dk, 420kcal, 0🔖+0📁)
- titleJacc=0.75 ingJacc=0.83 stepDiff=1 durationDiff=20% calDiff=13%
- shared title tokens: gnocchi, alla, sorrentina

---

### [it/YEMEK] Canonical: `sicilya-pasta-alla-norma`

**Confidence (json):** high
**Reason:** Penne, patlıcan, domates püresi, ricotta salata ve fesleğenle aynı Pasta alla Norma; Sicilya kaydı sarımsak ve zeytinyağıyla daha ayrıntılı.

**Canonical row:** Sicilya Pasta Alla Norma [sicilya-pasta-alla-norma] (8i/5s, 46dk, 480kcal, 0🔖+0📁)

#### dup: `pasta-alla-norma`
- **✅ STRICT**
- DB row: Pasta Alla Norma [pasta-alla-norma] (5i/6s, 45dk, 520kcal, 0🔖+0📁)
- titleJacc=0.75 ingJacc=0.63 stepDiff=1 durationDiff=2% calDiff=8%
- shared title tokens: pasta, alla, norma

---

### [it/YEMEK] Canonical: `naples-pasta-puttanesca`

**Confidence (json):** high
**Reason:** Spaghetti, domates püresi, siyah zeytin, kapari, ançuez, sarımsak ve maydanozla aynı puttanesca; biri pasta, biri spaghetti diye adlandırılmış.

**Canonical row:** Napoli Pasta Puttanesca [naples-pasta-puttanesca] (10i/7s, 25dk, 510kcal, 0🔖+0📁)

#### dup: `napoli-spaghetti-puttanesca`
- **⚠️ LOOSE**
- DB row: Napoli Spaghetti Puttanesca [napoli-spaghetti-puttanesca] (9i/6s, 26dk, 520kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.73 stepDiff=1 durationDiff=4% calDiff=2%
- shared title tokens: napoli, puttanesca

---

### [it/YEMEK] Canonical: `naples-pizza-margherita`

**Confidence (json):** medium
**Reason:** Featured canonical ile aynı mayalı hamur, domates, mozzarella, fesleğen ve yüksek ısıda pizza pişirme akışı var; Napoli kaydı daha ayrıntılı.

**Canonical row:** ⭐ Napoli Pizza Margherita [naples-pizza-margherita] (8i/7s, 180dk, 590kcal, 0🔖+0📁)

#### dup: `pizza-margherita`
- **✅ STRICT**
- DB row: Pizza Margherita [pizza-margherita] (8i/6s, 72dk, 620kcal, 0🔖+0📁)
- titleJacc=0.67 ingJacc=1.00 stepDiff=1 durationDiff=60% calDiff=5%
- shared title tokens: pizza, margherita

---

### [it/YEMEK] Canonical: `milan-risotto-alla-milanese`

**Confidence (json):** medium
**Reason:** Arborio pirinci, safran, sıcak su veya et suyu, tereyağı ve parmesanla aynı Milanese risotto akışı var; canonical en ayrıntılı yöntem içeriyor.

**Canonical row:** Milano Risotto alla Milanese [milan-risotto-alla-milanese] (8i/7s, 40dk, 430kcal, 0🔖+0📁)

#### dup: `safranli-risotto`
- **⛔ WEAK**
- DB row: Safranlı Risotto [safranli-risotto] (6i/5s, 40dk, 410kcal, 0🔖+0📁)
- titleJacc=0.20 ingJacc=0.56 stepDiff=2 durationDiff=0% calDiff=5%
- shared title tokens: risotto

#### dup: `milano-risotto-milanese`
- **✅ STRICT**
- DB row: Milano Risotto Milanese [milano-risotto-milanese] (7i/5s, 38dk, 480kcal, 0🔖+0📁)
- titleJacc=0.75 ingJacc=0.67 stepDiff=2 durationDiff=5% calDiff=10%
- shared title tokens: milano, risotto, milanese

---

## Onay icin tavsiye

**Otomatik onay (STRICT, user content yok):**
- `addis-ababa-misir-wot` (canonical: `addis-ababa-misir-wat`)
- `paris-ratatouille-guvec` (canonical: `paris-ratatouille-tenceresi`)
- `fasolada-corbasi-yunan-usulu` (canonical: `fasolada-yunan-usulu`)
- `turos-csusza-tava-macar-usulu` (canonical: `turos-csusza-macar-usulu`)
- `jakarta-nasi-goreng-ayam` (canonical: `jakarta-nasi-goreng-ayamli`)
- `mango-lassi-shake` (canonical: `mango-lassi`)
- `gajar-halwa-kup-hint-usulu` (canonical: `gajar-halwa-hint-kis-usulu`)
- `butter-chicken` (canonical: `delhi-butter-chicken`)
- `delhi-makhani-tavuk-korisi` (canonical: `delhi-butter-chicken`)
- `mumbai-sebzeli-pav-bhaji` (canonical: `mumbai-pav-bhaji-tereyagli`)
- `rome-carbonara` (canonical: `spaghetti-carbonara`)
- `gnocchi-alla-sorrentina` (canonical: `napoli-gnocchi-alla-sorrentina`)
- `pasta-alla-norma` (canonical: `sicilya-pasta-alla-norma`)
- `pizza-margherita` (canonical: `naples-pizza-margherita`)
- `milano-risotto-milanese` (canonical: `milan-risotto-alla-milanese`)

**Manuel review gerekli (LOOSE veya user content):**
- `munih-bratwurst-lahana` (metric loose)
- `munih-patatesli-schnitzel-tabagi` (metric loose)
- `seville-gazpacho-andaluz` (metric loose)
- `crema-catalana-kavanozu-ispanyol-usulu` (metric loose)
- `deniz-mahsullu-paella` (metric loose)
- `valencia-paella-mixta` (metric loose)
- `ratatouille` (metric loose)
- `provence-ratatouille-tenceresi` (metric loose)
- `atina-moussaka` (metric loose)
- `atina-spanakopita` (metric loose)
- `dobos-torte` (metric loose)
- `firin-turos-csusza` (metric loose)
- `jakarta-nasi-goreng-telur` (metric loose)
- `masala-cayi` (metric loose)
- `zerdecalli-altin-sut` (metric loose)
- `poha-peanut-hint-kahvalti-usulu` (metric loose)
- `palak-paneer` (metric loose)
- `chana-masala` (metric loose)
- `rajma-masala-hint-usulu` (metric loose)
- `floransa-ribollita-corba` (metric loose)
- `napoli-spaghetti-puttanesca` (metric loose)

**Atlanmasi onerilen (WEAK, muhtemel varyant):**
- `berlin-currywurst-tabagi`
- `patatas-bravas`
- `barselona-patatas-bravas`
- `madrid-sarimsakli-karides-tavasi`
- `gazpacho`
- `andaluz-gazpacho`
- `ajo-blanco-corbasi-ispanyol-usulu`
- `salmorejo-ispanya-usulu`
- `madrid-tortilla-espanola`
- `barselona-crema-catalana`
- `limonlu-katalan-krem-kup-ispanya-usulu`
- `ispanakli-nohut-tava-ispanya-usulu`
- `valencia-tavuklu-paella`
- `marsilya-bouillabaisse-safranli`
- `sogan-corbasi`
- `nicoise-salatasi`
- `salade-nicoise-fransiz-bistro-usulu`
- `salade-lyonnaise`
- `burgonya-coq-au-vin`
- `lorraine-kis-tart`
- `lyon-quiche-lorraine`
- `patates-graten`
- `nice-firin-ratatouille`
- `atina-musakka-patlicanli`
- `atina-musakka-firini`
- `atina-musakka-kasesi`
- `selanik-firin-musakka`
- `thessaloniki-spanakopita`
- `budapeste-gulyas-corbasi`
- `budapeste-paprikali-gulyas-corbasi`
- `paprikas-csirke-macar-usulu`
- `budapeste-tavuk-paprikash`
- `budapeste-tavuk-paprikas-nokedli`
- `macar-gulasi`
- `surabaya-tavuk-soto`
- `delhi-tereyagli-tavuk-makhani`
- `mini-arancini`
- `ribollita`
- `venedik-tiramisu-kup`
- `safranli-risotto`
