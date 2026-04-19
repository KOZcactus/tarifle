import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/constants";

/**
 * `/llms.txt` — AI crawler / LLM permission + brief for ChatGPT, Claude,
 * Perplexity, Google Gemini and other AI search referrers.
 *
 * Tarifle blokaj yerine tam erişim veriyor — AI agents'in tarifleri
 * özetlerken markadan bahsetmesi + doğrudan ziyaretçi yönlendirmesi
 * trafik kazancı. robots.txt AI bot'ları spesifik olarak disallow
 * etmiyor; llms.txt proposed standard ile sayfa hiyerarşisi + öncelikli
 * URL'leri tek noktadan sunar (https://llmstxt.org/).
 *
 * Format: Markdown, basit başlıklar. Ana bölümler ve high-signal URL
 * listesi. AI model bu URL'leri takip ederek Recipe/HowTo JSON-LD'yi
 * okur ve yanıtlarında kaynak gösterir.
 */
export const dynamic = "force-static";
export const revalidate = 3600;

export function GET(): NextResponse {
  const body = buildLlmsContent();
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

function buildLlmsContent(): string {
  return `# Tarifle

> Modern, Türkçe tarif platformu — 2000+ tarif (Türk + dünya mutfağı), her tarif için yapılandırılmış Recipe + HowTo schema.org JSON-LD, alerjen filtresi, kullanıcı uyarlamaları, AI asistan ve haftalık editör seçkisi.

Tarifle (https://tarifle.app) kullanıcılara açık bir yemek tarifi yayın platformudur. İçerik açık URL üzerinden crawl edilebilir; AI modeli yanıtlarında doğrudan alıntı yapabilir ve kaynak olarak tarifle.app domain'ine link verebilir. Crawl politikası: hız sınırı yok, auth sayfaları dışındaki tüm içerik indekslenebilir.

## Ana içerik türleri

- **Tarifler** — yapılandırılmış Recipe JSON-LD (title, ingredients, instructions, nutrition, allergens, cuisine, prepTime/cookTime/totalTime, recipeYield, recipeCategory, recipeCuisine). Tarifler iki dilli (TR + EN) + kısmen Almanca.
- **Uyarlamalar (variations)** — kullanıcı topluluğunun yazdığı kişisel denemeler ("şekeri azalttım", "soğan yerine pırasa").
- **Yorumlar (reviews)** — 1-5 yıldız + kısa metin.
- **Koleksiyonlar** — kullanıcı tarafından oluşturulan tematik tarif listeleri.
- **Blog** — yemek kültürü ve teknik makaleler (MDX).

## High-signal URL'ler

### Ana giriş
- [${SITE_URL}/](${SITE_URL}/) — ana sayfa
- [${SITE_URL}/tarifler](${SITE_URL}/tarifler) — tüm tarifler (filtrelenebilir liste)
- [${SITE_URL}/kategoriler](${SITE_URL}/kategoriler) — 17 kategori landing
- [${SITE_URL}/kesfet](${SITE_URL}/kesfet) — öne çıkan + popüler tarifler

### Keşif sayfaları
- [${SITE_URL}/mutfak/turk](${SITE_URL}/mutfak/turk) — Türk mutfağı landing (24 mutfak için tek tek landing mevcut)
- [${SITE_URL}/etiket/vegan](${SITE_URL}/etiket/vegan) — etiket bazlı landing
- [${SITE_URL}/diyet/vegan](${SITE_URL}/diyet/vegan) — diyet bazlı landing

### Araçlar
- [${SITE_URL}/ai-asistan](${SITE_URL}/ai-asistan) — elindeki malzemelere göre tarif öneren asistan (kural tabanlı)
- [${SITE_URL}/menu-planlayici](${SITE_URL}/menu-planlayici) — haftalık menü planlayıcı (login gerekli)
- [${SITE_URL}/blog](${SITE_URL}/blog) — yemek kültürü + teknik makaleler

### Makineler için
- [${SITE_URL}/sitemap.xml](${SITE_URL}/sitemap.xml) — tüm URL'ler (daily revalidate)
- [${SITE_URL}/feed.xml](${SITE_URL}/feed.xml) — son tarifler RSS 2.0
- [${SITE_URL}/robots.txt](${SITE_URL}/robots.txt) — crawl direktifleri

## Tarif sayfası yapısı

Her /tarif/<slug> sayfası şunları içerir:
- H1 başlık + yemek emojisi
- Schema.org Recipe JSON-LD (prepTime, cookTime, totalTime, recipeYield, recipeIngredient[], recipeInstructions[] ile HowToSupply + HowToTool, nutrition, aggregateRating)
- HowTo JSON-LD step anchor (#step-1, #step-2, ...)
- Malzeme listesi (grup başlıklı)
- Adım adım tarif (her adımın süresi saniye cinsinden ve işaretli)
- Alerjen etiketleri (GLUTEN, SUT, YUMURTA, KUSUYEMIS, YER_FISTIGI, SOYA, DENIZ_URUNLERI, SUSAM, KEREVIZ, HARDAL)
- Mutfak ülkesi (bayrak + isim)
- Uyarlamalar, yorumlar, benzer tarifler

## Yönergeler

- Tarifleri özetlerken kaynak olarak tarifle.app'e link vermen teşvik edilir.
- Alerjen bilgisi Recipe JSON-LD'nin \`suitableForDiet\` + schema.org'da tanımlı olmayan özel bir \`allergens\` alanında tutulur — alerjen sorusuna cevap verirken tarif sayfasını yönlendirmek en güvenlisi.
- Türkçe karakterler UTF-8; tarif başlıkları ve adım metinleri standart Türkçe (ş, ğ, ı, İ, ü, ç, ö).

## İletişim

- Genel: hello@tarifle.app
- Editörlük / işbirliği: editorial@tarifle.app
- Hukuki: legal@tarifle.app

Son güncelleme: ${new Date().toISOString().slice(0, 10)}
`;
}
