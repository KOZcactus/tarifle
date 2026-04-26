# Mod K verify raporu

Okunan dosya: 1 batch
Toplam entry: 50

## Ozet (verdict)

- PASS: **31** (62.0%)
- CORRECTION: 15 (30.0%)
- MAJOR_ISSUE: 4 (8.0%)

## Confidence

- high: 32, medium: 18, low: 0

## Format integrity

- Apply'a hazir (clean format): **50**
- BLOCKED (format issue): 0

## MAJOR_ISSUE (manuel review zorunlu)

### `borulceli-kabak-mucveri-mugla-usulu`

**Reason**: Mücver yumurta ile bağlanmış; bu hem ingredient hem alerjen listesinde eksik, ayrıca vegan etiketini açık biçimde yanlış yapıyor.

**Issues**:
- tags: vegan etiketi var ama step 3 yumurta kullanıyor
- ingredients: yumurta step'te geçiyor ama ingredient listesinde yok
- allergen: yumurta kullanıldığı halde YUMURTA alerjeni yok

**Corrections** (sample):
- ingredients_add: 1

### `bossam`

**Reason**: Bossam kimliği haşlanmış domuz eti ve sarma servisidir; dana uyarlaması olabilir ama mevcut liste ve adımlar birbiriyle çelişiyor.

**Issues**:
- ingredients: klasik Kore bossam domuz etiyle yapılır; mevcut listede yalnız dana döş var
- ingredients: step'lerde zencefil, kimchi ve sos geçiyor ama listede yok
- steps: step 1 'domuz veya dana' diyor, ingredient listesiyle çelişiyor

**Corrections** (sample):
- ingredients_add: 4
- ingredients_remove: Dana döş

### `brik`

**Reason**: Tarif içeriği Tunus brik ile uyumlu, fakat mutfak kodu Çin görünüyor; bu köken bilgisi kullanıcıyı yanıltır.

**Issues**:
- cuisine: input cuisine 'cn' görünüyor ama brik Tunus mutfağına aittir

**Corrections** (sample):
- description: "Brik, Tunus sokaklarında ince hamurun içinde yumurta ve ton balığıyla kızaran çıtır üçgendir...."

### `buenos-aires-kabakli-provoleta`

**Reason**: Provoleta Arjantin ızgara peyniridir; içerik makul olsa da mutfak kodunun Meksika görünmesi köken bilgisini bozar.

**Issues**:
- cuisine: input cuisine 'mx' görünüyor ama provoleta Arjantin mutfağına aittir

**Corrections** (sample):
- description: "Arjantin usulü kabaklı provoleta, eriyen peyniri kabak, kekik ve domatesle sıcak paylaşım tabağına dönüştürür...."

## CORRECTION sample (ilk 10)

| Slug | Conf | Issues count | Corrections fields |
|---|---|---:|---|
| `bolu-mengen-pilavi` | high | 1 | ingredients_add |
| `bolu-mengen-pilavi-etli` | high | 1 | totalMinutes |
| `borulce-ezmesi-aydin-usulu` | medium | 1 | totalMinutes |
| `borulceli-koruklu-fennel-salata-urla-usulu` | medium | 2 | steps_replace |
| `boulevardier` | high | 1 | steps_replace |
| `bourbon-cherry-smash-amerikan-usulu` | medium | 2 | ingredients_add, steps_replace |
| `bourbon-elma-smash-amerikan-usulu` | medium | 2 | ingredients_add, steps_replace |
| `boza` | high | 1 | totalMinutes |
| `bozali-irmik-kup-istanbul-usulu` | high | 2 | totalMinutes, tags_remove |
| `briam` | high | 1 | ingredients_add |
