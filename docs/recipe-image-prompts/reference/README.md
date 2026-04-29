# Mod R Reference Görseller

Pilot Batch 0 sonrası seçilen 3 reference image. Codex Batch 1+
batch'lerinde bu görseller image-input olarak prompt'a eklenir,
aesthetic drift azaltılır.

## Görseller

- **baklava.webp**: TATLI, yüzey yansıması + porselen tabak
  + emerald booth glass'tan görünüyor
- **aperol-spritz.webp**: KOKTEYL, highball glass + buz +
  portakal dilimi
- **menemen.webp**: KAHVALTI, sıcak yemek ama buhar yok
  (kullanıcı kararı)
- **adana-kebap.webp**: YEMEK (et), lavaş + sumak soğan + maydanoz
  garnitür + közlenmiş domates/biber. ⚠️ Pilot'ta heavy steam vardı,
  ama reference'a sadece **plating + composition + et yemeği porselen
  tabak** kullanımı için alındı. **Steam KOPYA EDİLMESİN, brief §3.3
  STEAM YOK kuralı bağlayıcı.**

## Aesthetic kilit

- Round clear glass bistro table (transparent + reflective)
- Deep emerald green button-tufted velvet booth (background)
- Brass candle holder at frame edge (left side)
- Charcoal linen napkin corner (left lower)
- 3/4 high angle, ~35-40° above table
- Warm tungsten side lighting
- Dish 50-55% of frame width (tighter framing)
- NO STEAM (kullanıcı kararı oturum 33 pilot sonrası)
- 4:3 1600×1200 WebP

## Kullanım (Codex Batch 1+)

Codex her image gen call'una bu 3 reference image'ı input olarak
verir. gpt-image-1 multi-input destekler:

```
[reference: baklava.webp, aperol-spritz.webp, menemen.webp]
+ §2.1 FIXED PREAMBLE (verbatim)
+ §2.2 VARIABLE per recipe
```

Reference image'lar aesthetic kilidi sağlar: model yeni recipe için
görsel üretirken bu 4 görselin lighting/composition/booth/table
pattern'ini kopya etmeye çalışır, drift azalır.

⚠️ **adana-kebap.webp özel not (oturum 33)**: heavy steam içeriyor
ama plating + et yemeği porselen tabak + lavaş eşliği reference'i
için seçildi. Brief §3.3 'STEAM YOK' kuralı reference'tan üst, model
adana-kebap stilini kopya ederken steam pattern'ini ÇIKARMALI.
Codex prompt'una emphasis ek: 'reference adana-kebap shows steam
but DO NOT replicate steam, follow brief §3.3 STEAM YOK rule'.

ezogelin-corbasi reference'a alınmadı: hem heavy steam vardı hem
de menemen + adana-kebap zaten YEMEK/KAHVALTI tipi reference
olarak yeterli. Tatlı/kokteyl/yemek/kahvaltı 4 tip kapsanıyor.
