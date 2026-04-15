# Tarifle — Arama motorlarına kayıt rehberi

Sitemap + robots + canonical altyapısı yazıldı (main'de). Bu altyapının
değer üretmesi için siteyi Google/Bing'in webmaster araçlarına kaydetmek
gerekiyor. Aksi halde Google siteyi 2-6 hafta içinde organic olarak
bulur; submit ettiğimizde günler içinde indexlemeye başlar.

> Bu rehim sana (Kerem'e) yöneliktir. Adımları senin ana makinandan
> yapman gerekiyor — ben scriptleri koşsam da Google Search Console
> UI'ına benim bağlantım yok.

---

## 1. Google Search Console (öncelik 1 — mutlaka yap)

### 1.1. Property ekle

1. https://search.google.com/search-console → Google hesabın (kozcan0007@gmail.com
   veya admin hesabın) ile giriş
2. Sol üst property seçici → **+ Add property**
3. **Domain** (önerilen) veya **URL prefix**:
   - **Domain** (`tarifle.app`): DNS TXT kaydı gerektirir — tüm
     subdomain'leri ve protokolleri kapsar. En temiz seçenek.
   - **URL prefix** (`https://tarifle.app/`): HTML file / meta tag /
     Google Analytics / Google Tag Manager ile doğrulanır. Hızlı
     kurulum.

### 1.2. Domain verification (önerilen)

1. `tarifle.app` yazıp Continue
2. Google bir TXT kaydı gösterir:
   `google-site-verification=<random-string>`
3. **Cloudflare dashboard** → tarifle.app → DNS → Add record:
   - Type: `TXT`
   - Name: `@` (root domain)
   - Content: `google-site-verification=<random-string>`
   - TTL: Auto
   - Proxy: DNS only (gri bulut)
4. Save → Search Console'da **Verify** bas → genelde <1 dakika

Alternatif (URL prefix): Google bir HTML dosyası verir
(`google<hash>.html`). Bunu `public/` klasörüne koy, push et, Verify.
Daha az temiz çünkü dosya public'te gözükür.

### 1.3. Sitemap submit

Property doğrulandıktan sonra:

1. Sol menü → **Sitemaps**
2. "Add a new sitemap" kutusuna: `sitemap.xml`
3. Submit

Google sitemap'i parse eder (~dakikalar). **Success** durumunda 131
URL tarlanmış olur. Sonraki 24-72 saat içinde ilk tarif'ler indexe
girmeye başlar.

### 1.4. URL inspection — hızlı indexleme

İlk 10-20 önemli tarif için:

1. Üst arama kutusuna tarif URL'i yapıştır: `https://tarifle.app/tarif/adana-kebap`
2. "Request Indexing" → Google bu URL'i kuyruğa alır (~1-3 gün)

Bunu tüm 106 tarif için yapmana gerek yok, sitemap zaten hepsini
Google'a sunuyor. Sadece **en önemli 10-20 tarif** için manual
request indexing hızlandırıcı — homepage + top 10 tarif yeterli.

### 1.5. Performans izleme

İlk hafta boyunca günde 1-2 kez:

- **Performance** → hangi sorgularla tarife'ye geldiler?
- **Coverage** → hangi URL'ler indexe girdi, hangileri "Discovered
  but not indexed" durumunda?
- **Experience** → Core Web Vitals (LCP, FID, CLS) yeşil mi?

İlk hafta boyunca indexe giren URL sayısı artacak. 3-4 hafta içinde
tüm 106 tarifin indexlenmesi normal.

### 1.6. Enhancements sekmesi

Sitemap parse edildikten sonra Google bir süre sonra **Enhancements**
altında şunları gösterir:

- **Recipe** — Schema.org Recipe markup'umuz tespit edilmiş tariflerin
  sayısı. Hedef: 106/106.
- **Breadcrumb** — BreadcrumbList markup'u tespit edilen tariflerin
  sayısı. (Bu pass'te ekledik → hedef 106/106.)

Hata gösterirse (örn. "missing required field `image`"), ilgili
tarifin `imageUrl` alanı boştur. Çözüm: görsel ekle veya fallback
`opengraph-image.tsx` otomatik oluşturuyor.

---

## 2. Bing Webmaster Tools (öncelik 2 — 10 dakikalık iş)

Bing organic payı küçük ama edge cost'u sıfır — submit et, bitir.

### 2.1. Kayıt

1. https://www.bing.com/webmasters → Sign in (Microsoft hesabı)
2. **+ Add a site** → `https://tarifle.app`

### 2.2. Import from Google Search Console (önerilen)

"Import sites from Google Search Console" seçeneği var. Google'da
verify ettiysen Bing otomatik ekler, sitemap'i de import eder.
Tek tıkla yapılmış iş.

### 2.3. Manual alternatif

- Domain verification aynı TXT kaydı mantığı ile (ayrı key)
- Sitemap submit: `https://tarifle.app/sitemap.xml`

---

## 3. Yandex Webmaster (öncelik 3 — opsiyonel)

Türkiye'de Yandex payı %3-5. Türkçe içerik için küçük ek ziyaret
getirebilir. Bing ile aynı UX:

- https://webmaster.yandex.com → TR hesabı ile giriş
- Site ekle, verify, sitemap submit

---

## 4. Site submission sonrası checklist

### Hafta 1
- [ ] Google Search Console'da sitemap "Success" durumunda
- [ ] İlk 5-10 URL "Submitted and indexed" durumuna geçti
- [ ] `site:tarifle.app` Google araması en az 10 sonuç gösteriyor
- [ ] Bing Webmaster sitemap import başarılı

### Hafta 2-4
- [ ] Tüm 106 tarif indexlendi (Coverage → Valid)
- [ ] Performance sekmesinde ilk organic traffic görünüyor
- [ ] Recipe enhancement'ta 106/106 (Schema.org tespit edildi)
- [ ] Breadcrumb enhancement'ta 106/106

### Codex batch'leri geldikçe
- Her yeni batch seed edildikten sonra sitemap otomatik güncelleniyor
  (`revalidate = 3600`, yani en fazla 1 saat gecikme).
- Google Search Console **re-fetch** yapıp yeni URL'leri bulacaktır.
  Aciliyet varsa URL inspection ile tek tek request edebilirsin.

---

## 5. Kritik engeller — kontrol et

### robots.txt yanlışlıkla engelliyor olabilir mi?

```bash
curl -s https://tarifle.app/robots.txt
```

İlk satır `User-Agent: *` + `Allow: /` olmalı. `Disallow: /` olsaydı
tüm indexleme kapanırdı — `/admin`, `/api/*` vb. özel disallow'lar var,
bunlar doğru.

### meta robots noindex kaza'sı var mı?

```bash
curl -s https://tarifle.app/tarif/adana-kebap | grep -i "robots"
```

`noindex` görmemelisin. `index, follow` görürsen güzel (layout.tsx'de
explicit set etmiştim).

### Sitemap URL'leri canlı mı?

```bash
curl -s -o /dev/null -w "%{http_code}" https://tarifle.app/tarif/adana-kebap
```

200 dönmeli. 404 dönen varsa sitemap'te yanlış slug var — seed'i
kontrol et.

---

## 6. Performans ve Core Web Vitals

Search Console → **Experience** sekmesi CWV metriklerini gösterir.
Hedefler:

| Metrik | Hedef | Şu an (tahmin) |
|---|---|---|
| LCP | <2.5s | ✓ Next.js SSR + OG image |
| FID/INP | <200ms | ✓ Minimal client JS |
| CLS | <0.1 | ✓ `width`/`height` set'li RecipeCard |

Gerçek rakamlar Search Console 28 günlük gerçek kullanıcı verisiyle
gösterilecek. İlk hafta "Not enough data".

Lighthouse lokal testi:

```bash
npx lighthouse https://tarifle.app/tarif/adana-kebap --view
```

Performance / SEO / Accessibility / Best Practices — hepsi 90+ olmalı.

---

## 7. Sitemap ping (manuel hızlandırma)

Yeni batch seed sonrası Google'a "sitemap değişti" ping'i atmak için:

```bash
curl "https://www.google.com/ping?sitemap=https://tarifle.app/sitemap.xml"
curl "https://www.bing.com/ping?sitemap=https://tarifle.app/sitemap.xml"
```

Shortcut: her batch merge + seed sonrası bu iki satırı koşmak 10
saniye, indexlemeyi hızlandırır.

---

## Kısa özet (TL;DR)

1. Google Search Console → `tarifle.app` domain property ekle
2. Cloudflare'e TXT kaydı ekle, verify
3. Sitemap `sitemap.xml` submit
4. İlk 10 tarif için URL Inspection → Request Indexing
5. Bing Webmaster'a import from GSC
6. 1-4 hafta arasında Google indexlemeyi tamamlar
