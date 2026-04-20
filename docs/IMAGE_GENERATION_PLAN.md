# Tarifle, Tarif Görseli Üretim Planı

> Bu doküman **Eren/Codex** tarafından okunacak. Tek başına yeterli, başka bir Tarifle dokümanına bakmadan işe başlayabilmelisin.

---

## 1. Bağlam

**Tarifle** (tarifle.app), Türkçe tarif platformu, 1100 tarif canlıda. Şu an her tarifin yanında sadece emoji var (🍲 🥟 🍜 ...), gerçek görsel yok. Dashboard'da "Görselsiz tarif %100" alarmı yanıyor.

Amaç: 1100 tarifin her birine **kendine özgü bir cartoon/sticker tarzı illustration** üretmek. Gerçek fotoğraf değil. Yemek fotoğrafçılığı AI'nın zayıf alanı (uncanny valley); cartoon/flat vector AI'nın güçlü olduğu alan ve Tarifle'nin emoji-heavy modern markasıyla çok daha uyumlu.

**Referans stil fikri:** Notion cover illustrations + Duolingo food stickers + Apple Memoji karışımı. Sıcak pastel, yumuşak gölge, hafif isometric, merkezi kompozisyon.

---

## 2. Hedef, somut çıktı

| İstenen | Sayı | Format |
|---|---|---|
| Cartoon illustration | 1100 (her tarif için 1) | PNG, 1024×1024, şeffaf veya off-white background |
| Naming | Tarif slug'ına eşit | `adana-kebap.png`, `sebit-yaglamasi.png` |
| Dosya boyutu | < 500 KB (ideal) | Cloudinary auto-optimize ikinci katman |

Hedef kalite: Tarif kartı ızgarasına dizildiğinde hepsi **aynı görsel dili** konuşsun (tutarlı style, tutarlı renk paleti). Bir tarif "gerçekçi foto", diğeri "cartoon", başkası "minimal vektör" olmasın, hepsi tek karakter.

---

## 3. Prompt template (ÇOK ÖNEMLİ, birebir kullan)

Tüm 1100 tarif için aynı iskelet. Sadece `{TITLE}` ve `{CUISINE}` yerine koyduğun kısım değişir. Başka kelime ekleme/çıkarma.

```
Flat vector illustration of {TITLE}, a {CUISINE} cuisine dish, top-down view,
warm pastel color palette (soft oranges, creams, muted greens and browns),
subtle soft shadow underneath, minimal details, sticker-style with rounded
edges, centered composition on an off-white background (#f8f6f2),
friendly and appetizing mood, clean and modern, no text anywhere in the
image, no human figures, no hands, no utensils outside the plate or bowl.
```

### Cuisine eşlemesi

Tarif dosyasında `cuisine` alanı 2-harfli kod olarak var. Prompt'ta aşağıdaki tam adla kullan:

| Kod | Prompt için | Kod | Prompt için |
|---|---|---|---|
| tr | Turkish | jp | Japanese |
| it | Italian | cn | Chinese |
| fr | French | kr | Korean |
| es | Spanish | th | Thai |
| gr | Greek | in | Indian |
| mx | Mexican | us | American |
| me | Middle Eastern | ma | North African |
| vn | Vietnamese | br | Brazilian |
| cu | Cuban | ru | Russian |
| hu | Hungarian | se | Scandinavian |

### Örnek

Tarif: "Adana Kebap", cuisine "tr" → prompt:
```
Flat vector illustration of Adana Kebap, a Turkish cuisine dish, top-down view,
warm pastel color palette (soft oranges, creams, muted greens and browns),
subtle soft shadow underneath, minimal details, sticker-style with rounded
edges, centered composition on an off-white background (#f8f6f2),
friendly and appetizing mood, clean and modern, no text anywhere in the
image, no human figures, no hands, no utensils outside the plate or bowl.
```

---

## 4. Nasıl çalıştıracaksın, 3 seçenek, sırasıyla dene

### Seçenek A, Codex cloud agent (öncelikli test)

**Önce bunu dene**: Codex agent'a (ChatGPT Pro içinde) şunu söyle:

> "DALL-E 3 kullanarak aşağıdaki prompt ile bir cartoon illustration üret ve PNG olarak kaydet:
> [prompt yapıştır]"

- Çalışıyorsa → 1100 tarif için batch otomasyonu yapabilirsin (CSV oku, loop, kaydet)
- Çalışmıyorsa ("Codex'in image generation yetkisi yok" veya benzeri) → Seçenek B'ye geç

### Seçenek B, ChatGPT Pro web UI (manuel)

- chatgpt.com aç, DALL-E 3 aktif
- Tek tek prompt at, görsel üretildikten sonra indir
- Dosya adı = tarif slug'ı (örn. `sebit-yaglamasi.png`)
- Pro plan rate limit: DALL-E 3 ~40 görsel/3 saat gibi gözüküyor (değişebilir). Günde ~200-300 ulaşılabilir → 1100 tarif ~4-5 gün.

### Seçenek C, OpenAI API (hızlı, ~$44 ekstra)

Kerem ayrı bir API key açacak (platform.openai.com). Script:

```ts
// Örnek, Tarifle repo'sunda scripts/generate-recipe-images.ts olarak yazılacak
import OpenAI from "openai";
import { PrismaClient } from "@prisma/client";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const prisma = new PrismaClient();

const recipes = await prisma.recipe.findMany({
  where: { status: "PUBLISHED", imageUrl: null },
  select: { id: true, slug: true, title: true, cuisine: true },
});

for (const r of recipes) {
  const prompt = buildPrompt(r.title, r.cuisine);
  const res = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    size: "1024x1024",
    quality: "standard",
    style: "vivid", // alternatif: "natural"
  });
  const url = res.data[0].url;
  // → indir, Cloudinary'e yükle, DB'ye yaz
  // Rate limit: 1 req/sn yeter
  await sleep(1000);
}
```

- Maliyet: $0.04 × 1100 = **~$44**
- Süre: ~2-3 saat tek seferde batch
- Resume mümkün: `imageUrl = null` filter zaten devam ettiği yerden alır

---

## 5. Pilot önce, 10 tarif

**Full batch'e geçmeden önce 10 tarif ile test et.** Aşağıdaki listeyi kullan:

1. `adana-kebap` (tr, et yemeği, karma örnek)
2. `mercimek-corbasi` (tr, çorba, sıvı örnek)
3. `mantarli-risotto` (it, makarna-pilav, creamy)
4. `sushi-tabagi` (jp, deniz ürünleri, çiğ)
5. `tavuk-pad-thai` (th, makarna, renkli)
6. `kasarli-tost` (tr, kahvaltı, hamur işi)
7. `chia-puding` (us, tatlı, soğuk)
8. `tacos-al-pastor` (mx, et, street food)
9. `elmali-kefir-smoothie` (tr, içecek, bardak)
10. `sebit-yaglamasi` (tr, hamur işi, regional)

Bu 10 tarif **her türlü kategoride** iyi temsil. Hepsini generate et, Kerem'e gönder, kalite onayı al. Onay yoksa prompt'u tune et, tekrar dene.

---

## 6. Tarif listesi nereden alacaksın

Tarifle repo'sunda `docs/existing-slugs.txt` dosyası tüm 1100 slug'ı içerir (newline-separated). Ayrıca title/cuisine eşlemesi için Kerem şu CSV'yi sana iletecek:

```csv
slug,title,cuisine
adana-kebap,Adana Kebap,tr
mercimek-corbasi,Mercimek Çorbası,tr
...
```

Bu CSV'yi CSV dosyasından oku, her satır için prompt generate et.

**Kerem notu:** Bu CSV'yi oluşturmak için `npx tsx scripts/export-recipes-for-image-gen.ts` yazılmış olacak (Kerem Tarifle tarafında hazır eder). Slug + title + cuisine içeren CSV çıktısı verir.

---

## 7. Çıktı nasıl teslim edilecek

### Dosya organizasyonu

Ürettiğin PNG'leri **tek bir zip** içinde topla:
```
tarifle-images-batch-{n}.zip
  ├── adana-kebap.png
  ├── mercimek-corbasi.png
  ├── ...
```

### Teslim yolu (sıralı fallback)

1. **Cloudinary upload**, Kerem sana Cloudinary API key verirse, her PNG'yi `recipes/{slug}` public ID'siyle yükle. Script:
   ```ts
   cloudinary.uploader.upload(localPath, {
     public_id: `recipes/${slug}`,
     folder: "tarifle",
     overwrite: false,
   });
   ```
2. **Zip ile teslim**, Cloudinary erişimin yoksa zip'i Kerem'e gönder, o Cloudinary/Vercel Blob'a upload eder ve `imageUrl` field'ını doldurur.

### Metadata log

Her oturumun sonunda şu bilgileri bir `generation-log.json` olarak teslim et:

```json
[
  {
    "slug": "adana-kebap",
    "generatedAt": "2026-04-17T14:30:00Z",
    "model": "dall-e-3-standard",
    "prompt": "Flat vector illustration of Adana Kebap, ...",
    "size": "1024x1024",
    "approved": true
  },
  ...
]
```

Bu log ileride "hangi tarifin görseli yenilensin" kararı almamızı sağlar.

---

## 8. Kalite kriterleri, kabul / ret

### Kabul (approve et)

- ✅ Flat vector / cartoon style, illustrated look (gerçekçi foto DEĞİL)
- ✅ Yemek tanınabilir (Adana Kebap gerçekten köfte gibi görünüyor, random pilav değil)
- ✅ Renk paleti sıcak-pastel, tutarlı diğer batch ile
- ✅ Merkezi kompozisyon, ortalanmış
- ✅ Arka plan off-white (#f8f6f2) veya şeffaf
- ✅ Text yok, insan figürü yok

### Ret (yeniden generate et)

- ❌ Gerçekçi fotoğraf stilinde (uncanny valley)
- ❌ Metin var ("Adana Kebap" yazan etiket)
- ❌ İnsan eli, ağız, yüz var
- ❌ Yemek birkaç tabak/kase arasında dağılmış (tek merkezi yemek olmalı)
- ❌ Arka plan karmaşık (restoran, sokak vb.)
- ❌ Aşırı saturated veya çok karanlık renk

### Edge case'ler

- **Sos tarifleri** (soslar-dippler kategorisi): Küçük kase içinde sos, yanında bir kaşık veya ekmek OK.
- **İçecekler** (kahve, smoothie, kokteyl): Bardak görünsün, içinde sıvı + üstte garnish (nane yaprağı, köpük, vs.).
- **Çorbalar**: Derin kase, üstte garnish (kişniş, kırmızı biber, tereyağı parçası).
- **Hamur işleri** (börek, pide): Kesit ya da üstten, katları görünür.
- **Tatlılar**: Tabakta veya kesik dilim, yanında çatal gerekmez.

---

## 9. Rate limit & pacing (ChatGPT Pro UI için)

Pro planı DALL-E 3 kullanımı "fair use" ile sınırlı, tam sayı açıklanmıyor. Pratik gözlem:

- Saatlik ~40-60 görsel sürdürülebilir
- Günlük ~200-300 sonra yavaşlama/bloklama görülür
- Session'ı saat başına dağıt, 15 dakika "soğuma" molaları

Eğer limit'e çarparsan bir sonraki güne bırak. 5 günlük iş olarak planla.

---

## 10. Karar ağacı, Eren'in ilk adımı

```
1. Codex agent'a sor: "DALL-E 3 ile bir cartoon görsel üretip PNG olarak kaydedebiliyor musun?"
   ├── Evet → Seçenek A: Codex agent batch (pilot 10 tarif → Kerem onayı → 1100 batch)
   └── Hayır → 2. adıma geç

2. ChatGPT Pro web UI manuel test et (3 tarif):
   ├── 3 görsel kabul edilebilir çıktı verdi → Seçenek B: manuel devam, 4-5 gün
   └── Kalite sürekli sorunlu → 3. adıma geç

3. Kerem'le konuş: Seçenek C'ye (OpenAI API + $44) onay iste.
```

---

## 11. Pilot sonrası iletişim

10 tarifin ilk partisi tamamlandığında zip'i Kerem'e gönder + aşağıdaki soruları yanıtla:

1. Hangi seçeneği kullandın (A/B/C)?
2. Kaç denemede kabul edilebilir görsel çıktı? (Ör. 10 tarif → 12 deneme, yani 2 tekrar)
3. Prompt'ta değiştirmek istediğin bir şey var mı? (pastel palet güçlendirilsin mi, vs.)
4. Rate limit sorunu yaşadın mı?
5. Full batch'e geçmeye hazır mısın? Kaç günde biter tahmin?

---

## 12. Teknik notlar (Kerem tarafı)

Bu bölüm Eren için değil, gelecekte Kerem dönüp bakacağı için not:

- `Recipe.imageUrl` Prisma field'ı VARCHAR null, zaten hazır
- Admin detay sayfasında `updateRecipeAction` → `imageUrl` whitelist patch var
- Fallback chain: `recipe.imageUrl` → `category.imageUrl` (ileride) → gradient placeholder
- Cloudinary `recipes/{slug}` public ID convention
- Prisma query: `where: { status: "PUBLISHED", imageUrl: null }` ile eksikleri listele
- Batch script her tarif için `updatedAt` güncelleyecek → sitemap/RSS tetiklenir
- SEO: `<img alt="{title}">` otomatik, Next.js Image optimization Cloudinary loader ile

---

## 13. Hatırlatmalar

- **Prod DB'ye yazma**, sadece `imageUrl` güncellenir, başka field'a dokunma
- **Overwrite yapma**, eğer bir tarifin `imageUrl` zaten doluysa atla (Kerem manuel özel görsel koymuş olabilir)
- **Style consistency**, 1100 içinde **hiçbir görsel fotoğraf gibi gerçekçi olmasın**. Kararsız kalırsan daha illustrative tarafa çek.
- **Cuisine doğruluğu**, "Pad Thai" için Thai prompt kullan, Turkish değil. Görselin yemek kültürüyle uyumlu olması markaya katkı.
- **Emoji ile ilişki**, recipe card'da emoji görsel'in ÜZERİNDE küçük chip olarak kalacak, onun yeri illustration'un içinde olmasın.

Başarılar. Sorular için Kerem'e yaz.
