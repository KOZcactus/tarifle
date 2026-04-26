# Mod I Batch 3 verify raporu

Kaynak: `docs\mod-i-batch-3.json`
Cluster sayisi: 27
Toplam duplicate slug onerisi: 38

## Ozet

- STRICT (otomatik onay onerisi): **4**
- LOOSE (manuel review onerisi): **16**
- WEAK (varyant olabilir, atlamak guvenli): **18**
- MISSING (DB'de yok): **0**
- User content blokeli: **0**

---

### [jp/CORBA] Canonical: `shoyu-ramen`

**Confidence (json):** medium
**Reason:** Ikisi de soya soslu tavuk suyu tabaninda ramen eristesi, yumurta ve taze soganla kurulan ayni shoyu ramen; Tokyo kaydi chashu, nori ve kombu ile daha zenginlestirilmis.

**Canonical row:** ⭐ Shoyu Ramen [shoyu-ramen] (5i/6s, 125dk, 520kcal, 0🔖+0📁)

#### dup: `tokyo-shoyu-ramen`
- **⛔ WEAK**
- DB row: Tokyo Shoyu Ramen [tokyo-shoyu-ramen] (10i/7s, 290dk, 590kcal, 0🔖+0📁)
- titleJacc=0.67 ingJacc=0.36 stepDiff=1 durationDiff=57% calDiff=12%
- shared title tokens: shoyu, ramen

---

### [jp/ICECEK] Canonical: `kavrulmus-hojicha-latte`

**Confidence (json):** high
**Reason:** Hojicha tozu, sicak su, sut ve bal ayni; iki tarifte de hojicha sicak suyla cirpilip isitilmis sutle birlestiriliyor.

**Canonical row:** ⭐ Kavrulmuş Hojicha Latte [kavrulmus-hojicha-latte] (4i/3s, 10dk, 95kcal, 0🔖+0📁)

#### dup: `hojicha-latte`
- **✅ STRICT**
- DB row: Hojicha Latte [hojicha-latte] (4i/3s, 10dk, 130kcal, 0🔖+0📁)
- titleJacc=0.67 ingJacc=0.60 stepDiff=0 durationDiff=0% calDiff=27%
- shared title tokens: hojicha, latte

---

### [jp/YEMEK] Canonical: `kyoto-oyakodon`

**Confidence (json):** medium
**Reason:** Tavuk, yumurta, pirinc, sogan ve soya soslu kisa pisirme akisi ayni; Kyoto kaydi dashi ve mirinle daha tam olculendirilmis.

**Canonical row:** Kyoto Oyakodon [kyoto-oyakodon] (7i/6s, 25dk, 520kcal, 0🔖+0📁)

#### dup: `oyakodon`
- **⚠️ LOOSE**
- DB row: Oyakodon [oyakodon] (5i/6s, 30dk, 430kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.71 stepDiff=0 durationDiff=17% calDiff=17%
- shared title tokens: oyakodon

---

### [jp/YEMEK] Canonical: `kyoto-katsu-curry`

**Confidence (json):** medium
**Reason:** Hepsi tavuk gogsu, panko, yumurta, un, pirinc ve Japon kori sosuyla ayni tavuk katsu curry tabagi; fark roux, patates veya sosun elde kurulmasi gibi kucuk ayrintilarda.

**Canonical row:** Kyoto Katsu Curry [kyoto-katsu-curry] (11i/7s, 70dk, 720kcal, 0🔖+0📁)

#### dup: `tokyo-chicken-katsu-curry`
- **⚠️ LOOSE**
- DB row: Tokyo Chicken Katsu Curry [tokyo-chicken-katsu-curry] (8i/5s, 60dk, 690kcal, 0🔖+0📁)
- titleJacc=0.40 ingJacc=0.58 stepDiff=2 durationDiff=14% calDiff=4%
- shared title tokens: katsu, curry

#### dup: `tokyo-katsu-curry-pilav`
- **⛔ WEAK**
- DB row: Tokyo Katsu Curry [tokyo-katsu-curry-pilav] (9i/7s, 75dk, 690kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.43 stepDiff=0 durationDiff=7% calDiff=4%
- shared title tokens: katsu, curry

#### dup: `tokyo-tavuk-katsu-kare`
- **⛔ WEAK**
- DB row: Tokyo Tavuk Katsu Kare [tokyo-tavuk-katsu-kare] (8i/6s, 65dk, 680kcal, 0🔖+0📁)
- titleJacc=0.17 ingJacc=0.36 stepDiff=1 durationDiff=7% calDiff=6%
- shared title tokens: katsu

---

### [kr/APERATIF] Canonical: `busan-haemul-pajeon`

**Confidence (json):** high
**Reason:** Un, yumurta, taze sogan, karides veya kalamar ve soya soslu servis ayni deniz urunlu pajeon; Busan kaydi ayni tarifi daha acik adlandiriyor.

**Canonical row:** Busan Haemul Pajeon [busan-haemul-pajeon] (7i/6s, 29dk, 340kcal, 0🔖+0📁)

#### dup: `busan-deniz-urunlu-pajeon`
- **⚠️ LOOSE**
- DB row: Busan Deniz Ürünlü Pajeon [busan-deniz-urunlu-pajeon] (7i/5s, 32dk, 340kcal, 0🔖+0📁)
- titleJacc=0.40 ingJacc=0.75 stepDiff=1 durationDiff=9% calDiff=0%
- shared title tokens: busan, pajeon

#### dup: `haemul-pajeon`
- **✅ STRICT**
- DB row: Haemul Pajeon [haemul-pajeon] (5i/4s, 35dk, 290kcal, 0🔖+0📁)
- titleJacc=0.67 ingJacc=0.71 stepDiff=2 durationDiff=17% calDiff=15%
- shared title tokens: haemul, pajeon

---

### [kr/CORBA] Canonical: `busan-kimchi-jjigae`

**Confidence (json):** medium
**Reason:** Olgun kimchi, kimchi suyu, domuz eti, tofu, gochugaru ve susam yagi ayni kimchi jjigae akisini veriyor; Busan kaydi hamsi suyu ve gochujangla daha genis.

**Canonical row:** Busan Kimchi Jjigae [busan-kimchi-jjigae] (10i/7s, 50dk, 390kcal, 0🔖+0📁)

#### dup: `seul-kimchi-jjigae-domuzlu`
- **⛔ WEAK**
- DB row: Seul Kimchi Jjigae [seul-kimchi-jjigae-domuzlu] (8i/6s, 45dk, 360kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.38 stepDiff=1 durationDiff=10% calDiff=8%
- shared title tokens: kimchi, jjigae

---

### [kr/YEMEK] Canonical: `bibimbap`

**Confidence (json):** medium
**Reason:** Pirinç, dana eti, yumurta, ispanak, havuc, susam yagi ve gochujangla ayni bibimbap kasesi; Seul adi tarif kimligini degistirmiyor.

**Canonical row:** ⭐ Bibimbap [bibimbap] (7i/6s, 60dk, 520kcal, 0🔖+0📁)

#### dup: `seul-bibimbap`
- **⚠️ LOOSE**
- DB row: Seul Bibimbap [seul-bibimbap] (9i/5s, 52dk, 560kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.60 stepDiff=1 durationDiff=13% calDiff=7%
- shared title tokens: bibimbap

---

### [kr/YEMEK] Canonical: `seoul-bulgogi`

**Confidence (json):** medium
**Reason:** Dana antrikot veya ince dana eti, armut, soya sosu, sarimsak ve susam yagiyla marine edilip hizli pisirilen ayni bulgogi; marul kase veya wrap farki servis formatina iniyor.

**Canonical row:** Seul Bulgogi [seoul-bulgogi] (9i/7s, 95dk, 460kcal, 0🔖+0📁)

#### dup: `bulgogi`
- **⚠️ LOOSE**
- DB row: Bulgogi [bulgogi] (5i/6s, 47dk, 430kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.63 stepDiff=1 durationDiff=51% calDiff=7%
- shared title tokens: bulgogi

#### dup: `kore-armutlu-bulgogi-marul-kasesi`
- **⛔ WEAK**
- DB row: Kore Armutlu Bulgogi Marul Kasesi [kore-armutlu-bulgogi-marul-kasesi] (7i/5s, 36dk, 430kcal, 0🔖+0📁)
- titleJacc=0.20 ingJacc=0.27 stepDiff=2 durationDiff=62% calDiff=7%
- shared title tokens: bulgogi

#### dup: `seul-bulgogi-marul-sarma`
- **✅ STRICT**
- DB row: Seul Bulgogi Marul Sarma [seul-bulgogi-marul-sarma] (8i/7s, 95dk, 460kcal, 0🔖+0📁)
- titleJacc=0.67 ingJacc=0.60 stepDiff=0 durationDiff=0% calDiff=0%
- shared title tokens: seul, bulgogi

#### dup: `seoul-bulgogi-marul-wrap`
- **⚠️ LOOSE**
- DB row: Seul Bulgogi Marul Wrap [seoul-bulgogi-marul-wrap] (7i/5s, 90dk, 430kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.56 stepDiff=2 durationDiff=5% calDiff=7%
- shared title tokens: seul, bulgogi

---

### [kr/YEMEK] Canonical: `seoul-japchae`

**Confidence (json):** medium
**Reason:** Tatli patates eristesi, ispanak, havuc, mantar, soya sosu ve susam yagi ayni japchae temelini veriyor; Seul kaydi dana ve yumurtayla daha zengin.

**Canonical row:** Seul Japchae [seoul-japchae] (9i/7s, 50dk, 505kcal, 0🔖+0📁)

#### dup: `japchae`
- **⚠️ LOOSE**
- DB row: Japchae [japchae] (6i/7s, 45dk, 350kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.75 stepDiff=0 durationDiff=10% calDiff=31%
- shared title tokens: japchae

---

### [kr/YEMEK] Canonical: `seul-kimchili-pirinc-tavasi`

**Confidence (json):** high
**Reason:** Pismis pirinc, kimchi, yumurta, susam yagi ve taze soganla ayni kimchi kizarmis pilav; Seul kaydi kimchi suyu, gochujang ve noriyle daha tam.

**Canonical row:** Seul Kimchi Bokkeumbap [seul-kimchili-pirinc-tavasi] (8i/6s, 22dk, 480kcal, 0🔖+0📁)

#### dup: `kimchi-bokkeumbap`
- **⚠️ LOOSE**
- DB row: Kimchi Bokkeumbap [kimchi-bokkeumbap] (5i/7s, 20dk, 430kcal, 0🔖+0📁)
- titleJacc=0.67 ingJacc=0.50 stepDiff=1 durationDiff=9% calDiff=10%
- shared title tokens: kimchi, bokkeumbap

#### dup: `seul-kimchi-fried-rice`
- **⚠️ LOOSE**
- DB row: Seul Kimchi Fried Rice [seul-kimchi-fried-rice] (7i/5s, 22dk, 430kcal, 0🔖+0📁)
- titleJacc=0.40 ingJacc=0.75 stepDiff=1 durationDiff=0% calDiff=10%
- shared title tokens: seul, kimchi

---

### [ma/CORBA] Canonical: `bissara`

**Confidence (json):** high
**Reason:** Kuru bakla, sarimsak, kimyon ve zeytinyagiyla haslanip blenderdan gecirilen ayni Fas bakla corbasi; fark sadece Bessara ve Bissara yazimi.

**Canonical row:** ⭐ Bissara [bissara] (4i/5s, 45dk, 215kcal, 0🔖+0📁)

#### dup: `bessara-fas-usulu`
- **⛔ WEAK**
- DB row: Bessara [bessara-fas-usulu] (5i/5s, 45dk, 188kcal, 0🔖+0📁)
- titleJacc=0.00 ingJacc=0.80 stepDiff=0 durationDiff=0% calDiff=13%
- shared title tokens: (yok)

#### dup: `bessara-kis-corbasi-fas-usulu`
- **⛔ WEAK**
- DB row: Bessara Kış Çorbası [bessara-kis-corbasi-fas-usulu] (5i/5s, 40dk, 198kcal, 0🔖+0📁)
- titleJacc=0.00 ingJacc=0.80 stepDiff=0 durationDiff=11% calDiff=8%
- shared title tokens: (yok)

---

### [ma/CORBA] Canonical: `harira-kuzey-afrika-usulu`

**Confidence (json):** medium
**Reason:** Nohut, domates, kimyon veya mercimek ve unla baglanan ayni harira corbasi ailesi; nohutlu kayitlar ana tarifi daha dar adla tekrarliyor.

**Canonical row:** ⭐ Harira [harira-kuzey-afrika-usulu] (5i/6s, 44dk, 238kcal, 0🔖+0📁)

#### dup: `nohutlu-harira-kase-fas-usulu`
- **⚠️ LOOSE**
- DB row: Nohutlu Harira Kase [nohutlu-harira-kase-fas-usulu] (4i/5s, 34dk, 178kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.50 stepDiff=1 durationDiff=23% calDiff=25%
- shared title tokens: harira

#### dup: `nohutlu-harira-corbasi-fas-usulu`
- **⚠️ LOOSE**
- DB row: ⭐ Nohutlu Harira Çorbası [nohutlu-harira-corbasi-fas-usulu] (5i/5s, 36dk, 186kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.67 stepDiff=1 durationDiff=18% calDiff=22%
- shared title tokens: harira

---

### [ma/CORBA] Canonical: `casablanca-harira`

**Confidence (json):** medium
**Reason:** Dana eti, nohut, yesil mercimek, domates, kereviz, sogan, un ve kisnisle ayni etli harira akisi var; sehir adi disinda tarif cekirdegi ayni.

**Canonical row:** Kazablanka Harira [casablanca-harira] (10i/7s, 115dk, 360kcal, 0🔖+0📁)

#### dup: `marakes-harira-corbasi`
- **⚠️ LOOSE**
- DB row: Marakeş Harira Çorbası [marakes-harira-corbasi] (9i/6s, 115dk, 330kcal, 0🔖+0📁)
- titleJacc=0.33 ingJacc=0.58 stepDiff=1 durationDiff=0% calDiff=8%
- shared title tokens: harira

---

### [ma/KAHVALTI] Canonical: `baghrir`

**Confidence (json):** high
**Reason:** Irmik, un, maya, su ve balla hazirlanan tek yuz pisirilmis ayni Fas pankeki; fark yalniz Baghrir ve Beghrir yazimi.

**Canonical row:** Baghrir [baghrir] (5i/5s, 35dk, 210kcal, 0🔖+0📁)

#### dup: `beghrir`
- **⛔ WEAK**
- DB row: Beghrir [beghrir] (5i/5s, 40dk, 184kcal, 0🔖+0📁)
- titleJacc=0.00 ingJacc=0.67 stepDiff=0 durationDiff=13% calDiff=12%
- shared title tokens: (yok)

---

### [ma/KAHVALTI] Canonical: `shakshuka-yumurta`

**Confidence (json):** medium
**Reason:** Yumurta, domates, kirmizi biber, kimyon ve ekmekle ayni shakshuka kahvalti tabagi; featured kayit sogan ve sarimsakla daha tamamlanmis.

**Canonical row:** ⭐ Shakshuka Yumurta [shakshuka-yumurta] (7i/5s, 30dk, 260kcal, 0🔖+0📁)

#### dup: `magrip-saksukasi`
- **⛔ WEAK**
- DB row: Mağrip Şakşukası [magrip-saksukasi] (5i/6s, 30dk, 180kcal, 0🔖+0📁)
- titleJacc=0.00 ingJacc=0.50 stepDiff=1 durationDiff=0% calDiff=31%
- shared title tokens: (yok)

---

### [ma/SALATA] Canonical: `mechouia-salatasi`

**Confidence (json):** high
**Reason:** Kozlenmis biber, domates, sarimsak ve zeytinyagiyla yapilan ayni mechouia salatasi; ikinci kayit ayni adin Ingilizce/Tunusca yazimini kullaniyor.

**Canonical row:** Mechouia Salatası [mechouia-salatasi] (7i/6s, 35dk, 92kcal, 0🔖+0📁)

#### dup: `slata-mechouia`
- **⛔ WEAK**
- DB row: Tunisian Slata Mechouia [slata-mechouia] (4i/6s, 40dk, 120kcal, 0🔖+0📁)
- titleJacc=0.33 ingJacc=0.38 stepDiff=0 durationDiff=13% calDiff=23%
- shared title tokens: mechouia

---

### [ma/YEMEK] Canonical: `kazablanka-limonlu-tavuk-tajin`

**Confidence (json):** medium
**Reason:** Tavuk but, koruk limonu veya limon, yesil zeytin, sogan ve zencefilli yavas pisirme ayni limonlu tavuk tajinini veriyor; canonical daha zengin ve olculu.

**Canonical row:** Kazablanka Limonlu Tavuk Tajin [kazablanka-limonlu-tavuk-tajin] (8i/6s, 80dk, 520kcal, 0🔖+0📁)

#### dup: `kazablanka-limonlu-tavuk-tagine`
- **✅ STRICT**
- DB row: Kazablanka Limonlu Tavuk Tagine [kazablanka-limonlu-tavuk-tagine] (7i/5s, 75dk, 430kcal, 0🔖+0📁)
- titleJacc=0.60 ingJacc=0.63 stepDiff=1 durationDiff=6% calDiff=17%
- shared title tokens: kazablanka, limonlu, tavuk

#### dup: `limonlu-zeytinli-tavuk-tajin-fas-usulu`
- **⛔ WEAK**
- DB row: Limonlu Zeytinli Tavuk Tajin [limonlu-zeytinli-tavuk-tajin-fas-usulu] (4i/6s, 36dk, 308kcal, 0🔖+0📁)
- titleJacc=0.60 ingJacc=0.22 stepDiff=0 durationDiff=55% calDiff=41%
- shared title tokens: limonlu, tavuk, tajin

---

### [me/CORBA] Canonical: `firikli-ot-corbasi-lubnan-usulu`

**Confidence (json):** high
**Reason:** Firik, otlar, limon suyu ve sebze suyuyla ayni corba; biri Turkce, biri Ingilizce adla ayni tarifi tekrarliyor.

**Canonical row:** Firikli Ot Çorbası [firikli-ot-corbasi-lubnan-usulu] (5i/5s, 38dk, 188kcal, 0🔖+0📁)

#### dup: `freekeh-herb-soup-orta-dogu-usulu`
- **⛔ WEAK**
- DB row: Freekeh Herb Soup [freekeh-herb-soup-orta-dogu-usulu] (5i/5s, 38dk, 182kcal, 0🔖+0📁)
- titleJacc=0.00 ingJacc=0.11 stepDiff=0 durationDiff=0% calDiff=3%
- shared title tokens: (yok)

---

### [me/KAHVALTI] Canonical: `kahire-ful-medames`

**Confidence (json):** medium
**Reason:** Haslanmis bakla, kimyon, limon suyu ve zeytinyagiyla ayni ful medames tabani; Kahire kaydi tahin, sarimsak, yumurta ve pideyle daha zengin.

**Canonical row:** Kahire Ful Medames [kahire-ful-medames] (8i/6s, 30dk, 330kcal, 0🔖+0📁)

#### dup: `ful-medames`
- **⚠️ LOOSE**
- DB row: Ful Medames [ful-medames] (4i/5s, 45dk, 300kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.50 stepDiff=1 durationDiff=33% calDiff=9%
- shared title tokens: medames

---

### [me/TATLI] Canonical: `hurmali-tahinli-kup-levant-usulu`

**Confidence (json):** medium
**Reason:** Hurma, tahin, labne veya labneh ve soguk kup sunumu ayni tatli cekirdegini kuruyor; canonical biskuvi kirintisi ve balla daha tamamlanmis.

**Canonical row:** Hurmalı Tahinli Kup [hurmali-tahinli-kup-levant-usulu] (5i/5s, 22dk, 268kcal, 0🔖+0📁)

#### dup: `hurmali-tahin-kup-orta-dogu-usulu`
- **⛔ WEAK**
- DB row: Hurmalı Tahin Kup [hurmali-tahin-kup-orta-dogu-usulu] (4i/5s, 10dk, 244kcal, 0🔖+0📁)
- titleJacc=0.33 ingJacc=0.29 stepDiff=0 durationDiff=55% calDiff=9%
- shared title tokens: hurmali

---

### [me/YEMEK] Canonical: `cairo-koshari-kasesi`

**Confidence (json):** medium
**Reason:** Pirinc, makarna, yesil mercimek, domates sosu ve sarimsakla ayni koshari katlari var; Kahire kaydi nohut, sogan ve sirkeyle daha ayrintili.

**Canonical row:** Kahire Koshari Kasesi [cairo-koshari-kasesi] (7i/6s, 70dk, 560kcal, 0🔖+0📁)

#### dup: `koshari`
- **⚠️ LOOSE**
- DB row: Koshari [koshari] (5i/6s, 70dk, 430kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.50 stepDiff=0 durationDiff=0% calDiff=23%
- shared title tokens: koshari

---

### [mx/ATISTIRMALIK] Canonical: `esquites-con-queso`

**Confidence (json):** medium
**Reason:** Mısır, tereyagi, lime suyu ve baharatla bardakta servis edilen ayni esquites tarifi; canonical peynir ve mayonezle daha tamamlanmis.

**Canonical row:** Esquites con Queso [esquites-con-queso] (5i/4s, 22dk, 232kcal, 0🔖+0📁)

#### dup: `esquites-meksika-usulu`
- **⛔ WEAK**
- DB row: Esquites [esquites-meksika-usulu] (5i/4s, 18dk, 162kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.43 stepDiff=0 durationDiff=18% calDiff=30%
- shared title tokens: esquites

#### dup: `baharatli-misir-bardak`
- **⛔ WEAK**
- DB row: Baharatlı Mısır Bardak [baharatli-misir-bardak] (4i/4s, 18dk, 160kcal, 0🔖+0📁)
- titleJacc=0.00 ingJacc=0.50 stepDiff=0 durationDiff=18% calDiff=31%
- shared title tokens: (yok)

---

### [mx/SOS] Canonical: `oaxaca-guacamole-klasik`

**Confidence (json):** high
**Reason:** Avokado, lime suyu, domates, kirmizi sogan, jalapeno, kisnis ve tuz ayni guacamole sosunu olusturuyor; Oaxaca kaydi ayni tarifi daha ayrintili adimlarla veriyor.

**Canonical row:** Oaxaca Klasik Guacamole [oaxaca-guacamole-klasik] (7i/5s, 12dk, 160kcal, 0🔖+0📁)

#### dup: `guacamole`
- **⚠️ LOOSE**
- DB row: Guacamole [guacamole] (7i/4s, 10dk, 190kcal, 0🔖+0📁)
- titleJacc=0.50 ingJacc=0.75 stepDiff=1 durationDiff=17% calDiff=16%
- shared title tokens: guacamole

---

### [mx/YEMEK] Canonical: `meksiko-tacos-al-pastor`

**Confidence (json):** high
**Reason:** Domuz omuz eti, misir tortilla, ananas, achiote, sirke, sogan ve kisnisle ayni al pastor taco; iki kayitta da Mexico City adlandirmasi ayni isi gosteriyor.

**Canonical row:** Meksiko Tacos Al Pastor [meksiko-tacos-al-pastor] (9i/7s, 175dk, 430kcal, 0🔖+0📁)

#### dup: `mexico-city-tacos-al-pastor`
- **⚠️ LOOSE**
- DB row: Mexico City Tacos Al Pastor [mexico-city-tacos-al-pastor] (8i/7s, 175dk, 390kcal, 0🔖+0📁)
- titleJacc=0.40 ingJacc=0.70 stepDiff=0 durationDiff=0% calDiff=9%
- shared title tokens: tacos, pastor

---

### [mx/YEMEK] Canonical: `mole-poblano`

**Confidence (json):** medium
**Reason:** Tavuk but, kuru biber, susam, yer fistigi, cikolata ve tavuk suyuyla ayni mole poblano; Puebla kaydi ayni klasigi daha uzun olculendiriyor.

**Canonical row:** ⭐ Mole Poblano [mole-poblano] (6i/7s, 105dk, 460kcal, 0🔖+0📁)

#### dup: `puebla-mole-poblano`
- **⛔ WEAK**
- DB row: Puebla Mole Poblano [puebla-mole-poblano] (10i/7s, 125dk, 560kcal, 0🔖+0📁)
- titleJacc=0.67 ingJacc=0.36 stepDiff=0 durationDiff=16% calDiff=18%
- shared title tokens: mole, poblano

---

### [mx/YEMEK] Canonical: `meksika-tavuk-enchiladas`

**Confidence (json):** medium
**Reason:** Mısır tortilla, haslanmis tavuk, kirmizi biber sosu, peynir ve firin akisi ayni kirmizi tavuk enchilada; canonical domates puresi ve kimyonla daha acik.

**Canonical row:** Meksika Tavuk Enchiladas [meksika-tavuk-enchiladas] (7i/5s, 55dk, 560kcal, 0🔖+0📁)

#### dup: `enchiladas-rojas`
- **⛔ WEAK**
- DB row: Enchiladas Rojas [enchiladas-rojas] (5i/6s, 60dk, 480kcal, 0🔖+0📁)
- titleJacc=0.25 ingJacc=0.50 stepDiff=1 durationDiff=8% calDiff=14%
- shared title tokens: enchiladas

---

### [ng/YEMEK] Canonical: `lagos-jollof-rice-firin`

**Confidence (json):** medium
**Reason:** Pirinc, domates, kapya biber, sogan, kekik ve defneyle ayni sade Lagos jollof rice; party kaydi ayni pilavi dumanli taban vurgusuyla tekrarliyor.

**Canonical row:** Lagos Jollof Rice [lagos-jollof-rice-firin] (9i/6s, 68dk, 360kcal, 0🔖+0📁)

#### dup: `lagos-party-jollof-rice`
- **⛔ WEAK**
- DB row: Lagos Party Jollof Rice [lagos-party-jollof-rice] (8i/5s, 75dk, 470kcal, 0🔖+0📁)
- titleJacc=0.75 ingJacc=0.33 stepDiff=1 durationDiff=9% calDiff=23%
- shared title tokens: lagos, jollof, rice

---

## Onay icin tavsiye

**Otomatik onay (STRICT, user content yok):**
- `hojicha-latte` (canonical: `kavrulmus-hojicha-latte`)
- `haemul-pajeon` (canonical: `busan-haemul-pajeon`)
- `seul-bulgogi-marul-sarma` (canonical: `seoul-bulgogi`)
- `kazablanka-limonlu-tavuk-tagine` (canonical: `kazablanka-limonlu-tavuk-tajin`)

**Manuel review gerekli (LOOSE veya user content):**
- `oyakodon` (metric loose)
- `tokyo-chicken-katsu-curry` (metric loose)
- `busan-deniz-urunlu-pajeon` (metric loose)
- `seul-bibimbap` (metric loose)
- `bulgogi` (metric loose)
- `seoul-bulgogi-marul-wrap` (metric loose)
- `japchae` (metric loose)
- `kimchi-bokkeumbap` (metric loose)
- `seul-kimchi-fried-rice` (metric loose)
- `nohutlu-harira-kase-fas-usulu` (metric loose)
- `nohutlu-harira-corbasi-fas-usulu` (metric loose)
- `marakes-harira-corbasi` (metric loose)
- `ful-medames` (metric loose)
- `koshari` (metric loose)
- `guacamole` (metric loose)
- `mexico-city-tacos-al-pastor` (metric loose)

**Atlanmasi onerilen (WEAK, muhtemel varyant):**
- `tokyo-shoyu-ramen`
- `tokyo-katsu-curry-pilav`
- `tokyo-tavuk-katsu-kare`
- `seul-kimchi-jjigae-domuzlu`
- `kore-armutlu-bulgogi-marul-kasesi`
- `bessara-fas-usulu`
- `bessara-kis-corbasi-fas-usulu`
- `beghrir`
- `magrip-saksukasi`
- `slata-mechouia`
- `limonlu-zeytinli-tavuk-tajin-fas-usulu`
- `freekeh-herb-soup-orta-dogu-usulu`
- `hurmali-tahin-kup-orta-dogu-usulu`
- `esquites-meksika-usulu`
- `baharatli-misir-bardak`
- `puebla-mole-poblano`
- `enchiladas-rojas`
- `lagos-party-jollof-rice`
