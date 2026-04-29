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
görsel üretirken bu 3 görselin lighting/composition/booth/table
pattern'ini kopya etmeye çalışır, drift azalır.

Pilot Batch 0'ın diğer 2 görseli (adana-kebap, ezogelin-corbasi)
reference'a alınmadı çünkü her ikisinde de heavy steam vardı,
kullanıcı steam YOK kararı verdi (oturum 33). Bu 3 reference
steam-free.
