# Mod K verify raporu

Okunan dosya: 1 batch
Toplam entry: 50

## Ozet (verdict)

- PASS: **13** (26.0%)
- CORRECTION: 35 (70.0%)
- MAJOR_ISSUE: 2 (4.0%)

## Confidence

- high: 43, medium: 6, low: 1

## Format integrity

- Apply'a hazir (clean format): **50**
- BLOCKED (format issue): 0

## MAJOR_ISSUE (manuel review zorunlu)

### `sikhye`

**Reason**: Malzemeler doğru yöne bakıyor ama süre yapısı sikhye kimliğini bozacak kadar kısa; manuel review önerilir.

**Issues**:
- Sikhye için pirincin malt suyunda ılık ortamda birkaç saat enzimlenmesi gerekir; mevcut 20 dakika gerçekçi değil.
- totalMinutes 45 dakika, klasik sikhye akışındaki uzun beklemeyi karşılamıyor.

**Corrections** (sample):
- steps_replace: 5

### `simsir-coregi-kirsehir-usulu`

**Reason**: Kırşehir hamur işleri doğrulanıyor fakat şimşir çöreği adı bulunamadı; identity için manuel karar gerekir.

**Issues**:
- Kırşehir için resmi listelerde tandır çöreği geçiyor, şimşir çöreği adı güvenilir kaynakla doğrulanamadı.
- Steps template ve slug kalıntısı taşıyor.

**Corrections** (sample):
- description: "Kırşehir çöreği, mayalı hamurun süt, tereyağı ve yumurtayla yoğrulup fırında yumuşak ve tok dokulu pişirildiği bir kahva..."
- steps_replace: 5

## CORRECTION sample (ilk 10)

| Slug | Conf | Issues count | Corrections fields |
|---|---|---:|---|
| `sesame-balls` | high | 1 | tipNote |
| `sesame-noodles-cin-soguk-usulu` | high | 3 | ingredients_add, servingSuggestion |
| `seul-bibimbap-kasesi` | high | 1 | ingredients_add |
| `seul-gochujangli-tofu-tost` | medium | 1 | steps_replace |
| `seul-susamli-patates-jeon` | high | 1 | ingredients_add |
| `sevilla-bademli-soguk-ajo-blanco` | high | 1 | ingredients_add |
| `sevilla-nohutlu-ispanak-tavasi` | high | 2 | ingredients_add |
| `sevketibostan-yemegi` | high | 2 | ingredients_add, tipNote, servingSuggestion |
| `sevketibostanli-bulgur-pilavi-ayvalik-usulu` | medium | 2 | ingredients_add, servingSuggestion |
| `sevketibostanli-tavuk-sote-aydin-usulu` | medium | 2 | ingredients_add |
