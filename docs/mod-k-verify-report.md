# Mod K verify raporu

Okunan dosya: 1 batch
Toplam entry: 50

## Ozet (verdict)

- PASS: **23** (46.0%)
- CORRECTION: 25 (50.0%)
- MAJOR_ISSUE: 2 (4.0%)

## Confidence

- high: 38, medium: 12, low: 0

## Format integrity

- Apply'a hazir (clean format): **50**
- BLOCKED (format issue): 0

## MAJOR_ISSUE (manuel review zorunlu)

### `banh-cuon`

**Reason**: Tarifin içeriği Vietnam banh cuon; Türk cuisine kodu kullanıcıyı yanıltır, ayrıca harçtaki soğan listede eksik.

**Issues**:
- cuisine: Banh cuon Vietnam yemeği olduğu halde cuisine tr yazılmış
- ingredient: step 3 soğan diyor ama ingredient listesinde soğan yok

**Corrections** (sample):
- ingredients_add: 1

### `banh-flan-vietnam`

**Reason**: Yumurta, süt, şeker ve karamel doğru; ancak Vietnam flanı için Türk cuisine kodu ciddi sınıflandırma hatasıdır.

**Issues**:
- cuisine: Banh flan Vietnam tatlısı olduğu halde cuisine tr yazılmış

**Corrections** (sample):

## CORRECTION sample (ilk 10)

| Slug | Conf | Issues count | Corrections fields |
|---|---|---:|---|
| `baharatli-yumurta-ekmegi-hindistan-usulu` | high | 3 | steps_replace |
| `bakewell-tart-ingiliz-usulu` | high | 2 | ingredients_add |
| `bal-kabakli-eriste-tava-malatya-usulu` | medium | 2 | steps_replace |
| `bal-katli-medovik-kup-rus-usulu` | high | 2 | totalMinutes, tags_remove, steps_replace |
| `bal-kremali-elma-kup-ingiltere-usulu` | high | 3 | totalMinutes, tags_remove, steps_replace |
| `balikli-dereotu-pilaki-canakkale-usulu` | high | 3 | ingredients_add, totalMinutes |
| `balila` | high | 2 | ingredients_add |
| `balkabakli-damper-toast-avustralya-usulu` | medium | 2 | steps_replace |
| `balli-armutlu-yulaf-lapasi-ingiltere-usulu` | high | 1 | steps_replace |
| `balli-cevizli-sutlac-kup-macar-usulu` | medium | 1 | totalMinutes |
