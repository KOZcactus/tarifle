/**
 * /basin sayfası için indirilebilir press-kit.zip üretir.
 *
 * İçerik:
 *   - logo/ → tüm marka asset'leri (primary, wordmark, mono, icon SVG+PNG,
 *     favicon, og-image, apple-touch-icon)
 *   - README.md → marka rehberi (renk paleti, tipografi, kullanım kuralları)
 *   - FACTSHEET.md → faktoid + iletişim
 *
 * Output: public/press-kit.zip (committed, /basin sayfasından indirilir)
 *
 * Kullanim: npx tsx scripts/build-press-kit.ts
 *
 * Cross-platform: Windows PowerShell Compress-Archive, macOS/Linux `zip`.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, copyFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import * as path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const STAGE = path.join(ROOT, ".press-kit-stage");
const LOGO_DIR = path.join(ROOT, "logo", "tarifle-logo-21");
const OUTPUT = path.join(ROOT, "public", "press-kit.zip");

const LOGO_FILES = [
  "primary.svg",
  "primary.png",
  "wordmark.svg",
  "wordmark.png",
  "icon.svg",
  "icon.png",
  "icon-192.png",
  "icon-512.png",
  "mono-dark.svg",
  "mono-dark.png",
  "mono-light.svg",
  "mono-light.png",
  "favicon.ico",
  "favicon-16.png",
  "favicon-32.png",
  "apple-touch-icon.png",
  "og-image.png",
];

const README = `# Tarifle Basın Kiti

Tarifle (tarifle.app), Türkçe odaklı tarif platformu. Bu paket marka
asset'leri ve faktoid bilgisi içerir. Yazılı izin gerekmez, ticari kullanımda
da serbestsin, sadece logoyu deforme etme + Tarifle adını yanlış yazma.

## Logo Dosyaları

| Dosya | Kullanım |
|---|---|
| primary.svg / .png | Renkli ana logo, beyaz veya açık arka planda |
| wordmark.svg / .png | Yatay sözcük markı, footer/banner için |
| icon.svg / .png | Yalnız simge, dar alan ve sosyal medya |
| mono-dark.svg / .png | Tek renk koyu, açık arka plan üzerine |
| mono-light.svg / .png | Tek renk açık, koyu arka plan üzerine |
| favicon.ico, favicon-16/32.png | Tarayıcı ikonları |
| apple-touch-icon.png | iOS home screen |
| og-image.png | Sosyal paylaşım önizleme (1200x630) |

## Renk Paleti

| Token | Hex | Kullanım |
|---|---|---|
| Brand primary | #a03b0f | Ana vurgu, link, CTA buton |
| Text | #1a1a1a | Gövde metin |
| Background | #f8f6f2 | Genel arka plan |
| Card | #ffffff | Kart yüzeyi |
| Border | #ddd8cf | Kart kenarı, ayırıcı |

## Tipografi

- Heading: serif font (sistem fallback ile)
- Body: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto

## Kullanım Kuralları

- Logoyu deforme etme (gerdirme, çevirme, renk değiştirme yok)
- Marka adını her zaman "Tarifle" olarak yaz, küçük harfle "tarifle" sadece
  URL/handle bağlamında ([tarifle.app](https://tarifle.app), @tarifle vs.)
- Logo etrafında en az logo yüksekliği kadar boşluk bırak
- "Tarif" + "le" ayrılarak yazılmaz, tek kelime

## Yasaklar

- Logo üzerine yazı veya grafik bindirme
- Marka renginin dışında renk varyasyonu (mono varyantlar dışında)
- Yanıltıcı bağlam (Tarifle olarak konuşma, sponsorluk imajı yaratma)

## İletişim

Basın, blogger, yazar talepleri: basin@tarifle.app
Editöryal öneri ve içerik feedback: editor@tarifle.app
`;

const FACTSHEET = `# Tarifle Faktoid

| Alan | Değer |
|---|---|
| Domain | tarifle.app |
| Tarif sayısı | 3700+ |
| Mutfak | 41 ülke/yöre |
| Kategori | 17 |
| Blog yazısı | 61 |
| Diller | TR + EN |
| Allergen kategorisi | 10 |
| Diyet preset | 10 (vegan, keto, akdeniz, dengeli, vd.) |
| Lansman | Yakında, Türkiye odaklı |

## Kısa Pitch

Tarifle, 3700+ Türkçe tarifi allergen filtresi, diyet skorları ve AI
asistan desteğiyle sunan bir mutfak platformu. Türk yöresel mutfağı +
dünya mutfaklarını editöryal kalitede tek çatıda toplar.

## Detay Pitch

Geleneksel tarif siteleri SEO baskısı altında uzun girişlerle dolu, allergen
ve diyet bilgisi yarım veya eksik. Tarifle her tarifi 7 kalite kontrolünden
geçirir (malzeme yapısı, adım net, allergen kapsamı, kültürel tutarlılık,
beslenme veri uyumu, görsel referans, dil tonu). Allergen kapsamı 10 kategori,
diyet skorları USDA verisi tabanlı, AI asistan kullanıcının dolabındaki
malzemeden öneri üretir.

## Story Angles

1. Türkçe tarif platformlarında allergen + diyet eksikliği
2. AI asistanın kullanıcı dolabından tarif önerisi
3. 41 mutfak / 3700+ tarif kapsamı, dijital mutfak arşivi
4. Editöryal kalite sürecinde 7 GATE kontrolü
5. Açık marka prensibi, KVKK uyumu, kullanıcı veri kontrolü

## İletişim

basin@tarifle.app: basın, blogger, yazar
editor@tarifle.app: içerik öneri
iletisim@tarifle.app: genel
`;

function build(): void {
  if (existsSync(STAGE)) rmSync(STAGE, { recursive: true, force: true });
  mkdirSync(STAGE, { recursive: true });
  mkdirSync(path.join(STAGE, "logo"), { recursive: true });

  for (const f of LOGO_FILES) {
    const src = path.join(LOGO_DIR, f);
    if (!existsSync(src)) {
      console.warn(`[uyari] logo/tarifle-logo-21/${f} yok, atlanıyor`);
      continue;
    }
    copyFileSync(src, path.join(STAGE, "logo", f));
  }

  writeFileSync(path.join(STAGE, "README.md"), README, "utf8");
  writeFileSync(path.join(STAGE, "FACTSHEET.md"), FACTSHEET, "utf8");

  if (existsSync(OUTPUT)) rmSync(OUTPUT, { force: true });

  if (process.platform === "win32") {
    execFileSync(
      "powershell",
      [
        "-NoProfile",
        "-Command",
        `Compress-Archive -Path '${STAGE}\\*' -DestinationPath '${OUTPUT}' -Force`,
      ],
      { stdio: "inherit" },
    );
  } else {
    execFileSync("zip", ["-r", OUTPUT, "."], { cwd: STAGE, stdio: "inherit" });
  }

  rmSync(STAGE, { recursive: true, force: true });
  console.log(`\n[ok] press-kit.zip üretildi → public/press-kit.zip`);
}

build();
