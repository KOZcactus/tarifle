# Mod K verify raporu

Okunan dosya: 1 batch
Toplam entry: 50

## Ozet (verdict)

- PASS: **26** (52.0%)
- CORRECTION: 20 (40.0%)
- MAJOR_ISSUE: 4 (8.0%)

## Confidence

- high: 39, medium: 11, low: 0

## Format integrity

- Apply'a hazir (clean format): **50**
- BLOCKED (format issue): 0

## MAJOR_ISSUE (manuel review zorunlu)

### `amasra-peynirli-misir-tavasi`

**Reason**: Amasra kaynaklarında salata, balık ve Bartın yöresel yemekleri öne çıkıyor; bu adla yöresel yemek doğrulanamadı.

**Issues**:
- description: Amasra yöresel iddiası güvenilir Bartın ve Amasra yemek listelerinde desteklenmedi
- identity: tarif daha çok peynirli mısır unu kuymağına benziyor, Amasra'ya özgü adlandırma manuel incelenmeli

**Corrections** (sample):
- description: "Peynirli mısır unu tavası, mısır unu, süt, tereyağı ve peyniri tavada koyulaştırarak sıcak servis edilen pratik bir kahv..."

### `amasya-keskek`

**Reason**: Resmi coğrafi işaret kaynağı mevcut tariften ciddi ayrılıyor; bu kayıt uygulama öncesi manuel incelenmeli.

**Issues**:
- description: tescilli Amasya keşkeği tavukla dövülen bir yemek değil; koyun eti, kemik iliği, kuyruk yağı, nohut ve buğdayla uzun pişirilir
- time: step 1 bir gece buğday bekletiyor ama totalMinutes 140 bunu kapsamıyor
- method: resmi kaynak Amasya keşkeğinde bileşenlerin dövülmediğini, bütün halde kaldığını belirtiyor

**Corrections** (sample):
- description: "Amasya keşkeği, buğdayı koyun eti, kemik iliği, kuyruk yağı ve nohutla uzun sürede pişiren tescilli yöresel yemektir...."
- ingredients_add: 5
- ingredients_remove: Tavuk but

### `ananasli-rom-highball-tayland-usulu`

**Reason**: Highball formatı kaynaklarda genel kokteyl tekniği olarak geçiyor; Tayland usulü iddiası doğrulanamadı.

**Issues**:
- cuisine: ananaslı rom highball için Tayland mutfağı iddiası güvenilir kaynaklarla desteklenmedi
- identity: tarif highball kokteyl formatına uyuyor ama ülke iddiası manuel incelenmeli

**Corrections** (sample):
- description: "Ananaslı rom highball, romu ananas suyu, soda ve bol buzla uzatarak hazırlanan ferah, tropik karakterli bir kokteyldir...."

### `antep-katikli-dolma`

**Reason**: Tarif tekniği katıklı dolmaya uyuyor ama Antep yöre iddiası kaynaklarla doğrulanmadı; manuel review gerekir.

**Issues**:
- description: katıklı dolma kaynaklarda Bitlis ve çevre illerle ilişkilendiriliyor, Antep iddiası güvenilir kaynakla desteklenmedi
- ingredient: step 2 soğan ve salça kullanıyor ama ingredient listesinde yok

**Corrections** (sample):
- description: "Katıklı dolma, kabakları bulgurlu kıymalı içle doldurup sarımsaklı yoğurt ve yağlı sosla servis edilen dolmadır...."
- ingredients_add: 2

## CORRECTION sample (ilk 10)

| Slug | Conf | Issues count | Corrections fields |
|---|---|---:|---|
| `aji-de-gallina` | high | 2 | ingredients_add, allergens_add |
| `aji-panca-soslu-tavuklu-pirinc-peru-usulu` | high | 2 | ingredients_add, prepMinutes, cookMinutes, totalMinutes |
| `aji-panca-tavuk-tava-peru-usulu` | high | 1 | ingredients_add |
| `aji-verde-tavuk-patates-kasesi-peru-usulu` | high | 1 | ingredients_add |
| `ajili-tavuk-anticucho-bowl-peru-usulu` | high | 2 | ingredients_add, ingredients_amount_change, tags_remove |
| `aloo-gobi` | high | 1 | ingredients_add |
| `amasya-bakla-dolmasi-yarmali` | high | 1 | prepMinutes, cookMinutes, totalMinutes |
| `amasya-coregi` | high | 1 | ingredients_add |
| `americano` | high | 1 | cuisine |
| `anali-kizli-corbasi` | high | 2 | ingredients_add, allergens_add |
