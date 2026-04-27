# Mod K verify raporu

Okunan dosya: 1 batch
Toplam entry: 50

## Ozet (verdict)

- PASS: **18** (36.0%)
- CORRECTION: 30 (60.0%)
- MAJOR_ISSUE: 2 (4.0%)

## Confidence

- high: 28, medium: 20, low: 2

## Format integrity

- Apply'a hazir (clean format): **50**
- BLOCKED (format issue): 0

## MAJOR_ISSUE (manuel review zorunlu)

### `menekse-serbeti-erzurum-usulu`

**Reason**: Menekşe şerbeti doğrulanıyor ama Erzurum bağı kaynaklanmadı; köken iddiası kaldırılıp eksik şeker ve bekleme süresi düzeltilmeli.

**Issues**:
- Erzurum usulü iddiası için güvenilir kaynak bulunamadı; kaynaklar menekşe şerbeti veya Osmanlı menekşe şurubu anlatıyor.
- Step 1 şekerden bahsediyor ama ingredient listesinde şeker yok.
- Step 2 on dakika dinlendirme içeriyor, totalMinutes 8 dakika.

**Corrections** (sample):
- description: "Menekşe şerbeti, menekşe şurubu ve limonu suyla açarak hafif çiçeksi, ferah ve serin bir içecek ortaya çıkarır...."
- ingredients_add: 1

### `mesir-baharatli-tavuk-manisa-usulu`

**Reason**: Manisa mesir geleneği doğrulanıyor ama tavuk yemeği yöresel klasik değil; ad, description, eksik baharat ve süre düzeltilmeli.

**Issues**:
- Kaynaklar Manisa mesir macununu doğruluyor, ancak 'Manisa mesir baharatlı tavuk' adıyla yerleşik bir yöresel yemek doğrulanmadı.
- Step 1 mesir baharatı diyor ama ingredient listesinde mesir baharatı yok.
- Step 2 otuz dakika marine ve step 6 altı dakika dinlendirme içeriyor, totalMinutes bu beklemeleri göstermiyor.

**Corrections** (sample):
- description: "Mesir baharatı esintili fırın tavuk, tavuk parçalarını yoğurt ve aromatik baharatlarla marine ederek kokulu ve sulu bir ..."
- ingredients_add: 1

## CORRECTION sample (ilk 10)

| Slug | Conf | Issues count | Corrections fields |
|---|---|---:|---|
| `mazurek-polonya-usulu` | high | 1 | totalMinutes |
| `mechoui` | high | 1 | totalMinutes |
| `mechouia-salatasi` | high | 3 | cuisine, cookMinutes, totalMinutes, steps_replace |
| `medianoche` | medium | 1 | ingredients_remove, ingredients_add, steps_replace |
| `medianoche-sandwich` | high | 2 | ingredients_add, totalMinutes |
| `medovik-kup-rus-usulu` | high | 2 | totalMinutes, tags_remove |
| `medovik-rus-usulu` | high | 1 | totalMinutes |
| `meggyes-makos-retes-macar-usulu` | medium | 1 | totalMinutes |
| `meggyes-retes` | medium | 1 | totalMinutes |
| `meggyleves-soguk-macar-usulu` | high | 1 | totalMinutes, tags_remove |
