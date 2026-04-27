# Test Report: Oturum 26 Kategori 2 (Returning User Flow)

Tarih: 2026-04-27 (oturum 26)
Test kapsamı: Aktif kullanıcı (5+ cooked + 3 favori + 1 koleksiyon + 5 dolap item) için günlük tarif akışları
Süre: ~45 dk
Yöntem: Browser preview MCP desktop (1440x900) + mock returning user (oturum26-returning@tarifle.local) seed data + login + akış simülasyonu

## Özet (üst seviye)

| Test | Sonuç |
|---|---|
| Login (K1 P1 fix sonrası) | ✅ /giris email + password → anasayfa redirect |
| Anasayfa returning user perspektifi | ✅ Son pişirdiklerin shelf + Bu hafta + Editör + AI/Menü banner zengin |
| AI Asistan dolap import | ✅ 5/5 ingredient (Tavuk/Soğan/Domates/Yumurta/Tereyağı) tek tık import |
| AI Asistan tarif önerisi (submit) | ⚠️ Dev mode yavaş (Düşünüyor... 30s+, prod'da rate-limit + 3500 filter beklenir) |
| Menü Planlayıcı 7×3 grid | ✅ Pazartesi-Pazar × Kahvaltı/Öğle/Akşam + tarih + AI ile Doldur + Yazdır + Alışveriş listesi |
| Tarif detay returning user | ✅ Pişirdim ✓ (cooked entry doğru), 1 kişi pişirdi badge, Pişirme Modu, 5★ rating, Yorum textarea, Variation Paylaş, PDF Yazdır, ShareMenu |
| SaveMenu state | ⚠️ Button label "Kaydet" statik, dropdown'da "Kaydedildi" - visual feedback iyileştirme önerisi |
| /akis sayfası | ✅ Empty state CTA "Tarifleri keşfet" (mock user kimseyi takip etmiyor) |
| Profil sayfası başka user | ✅ Follow button "Takip et" enabled |
| Theme/locale persistence (K1'den) | ✅ K1'de doğrulandı |

## Bulgular

### P0 - Launch blocker
**Yok.**

### P1 - Yüksek değer
**Yok yeni P1.** K1'in 4 P1 fix paketi (commit `8584665`) zaten ship'lendi.

### P2 - Monitoring / iyileştirme

**1. AI Asistan submit response süresi (dev mode)**
- Lokasyon: `/ai-asistan` form submit
- Dev mode'da "Düşünüyor..." state 30s+ sürdü, browser eval timeout
- Olası sebep: Rule-based engine 3500+ tarif üzerinde filter + scoring; dev mode hot reload + Prisma adapter overhead
- Production'da Vercel function cold start + cache hit ile çok daha hızlı olmalı
- Önerilen takip: Production'da gerçek user'la AI Asistan response timing ölçülmeli (Vercel Analytics edge timing); dev mode için ENV `AI_ASSISTANT_LIMIT=100` gibi bir cap ile dev iteration hızlanabilir
- Acil değil, prod-only verification gerek

**2. SaveMenu button label statik (Kaydet ↔ Kaydedildi visual feedback)**
- Lokasyon: `src/components/recipe/SaveMenu.tsx`
- Mevcut: Button text her zaman "Kaydet", dropdown açıldığında "Kaydedildi" görünür
- Sorun: Bookmark state visual feedback yok (kullanıcı dropdown açmadan favori durumunu göremez)
- Önerilen: Bookmark varsa button label "Kaydedildi ✓" + filled icon, yoksa "Kaydet" + outline icon
- Etki: 1-bakışta favori state görünür, hover/click gereksiz
- Scope: 15 dk küçük UX polish

### P3 - Düşük öncelik (K1'den tekrarlayan)

**3. Profil sayfası 0-stat görünüyor (başka user)**
- Lokasyon: `/profil/[username]` (kendi olmayan profil)
- Bulgu: `/profil/previewadm019208` "0 uyarlama / 0 takipçi / 0 takip / Chef Puanı: 0" görünüyor
- Karşılaştırma: K1 raporundaki P3 #9 (kendi profilde OK) ile aynı pattern, ama BAŞKA user profilinde sosyal proof zayıf
- Karşı argüman: Test environment, gerçek prod user'lar 0 değil
- Önerilen takip: launch sonrası kullanıcı sayısı artınca otomatik düzeltir; ya da `session.user.id !== profileUser.id ise count > 0 ise göster` pattern
- Karşılaştırılabilir: oturum 25'te ReviewsSection + SuggestedCooksSection eşik altı saklama yapıldı, profil scope'una uzatılabilir

## PASS bulguları (iyi UX)

**1. Anasayfa returning user için zengin içerik**
- "👨‍🍳 Son pişirdiklerin" personal shelf (5 cooked entry'den 5 tarif görünür)
- "👨‍🍳 Bu hafta en çok pişirilenler" community shelf
- "⭐ Editör Seçimi" curated shelf
- "Kurban Bayramı yaklaşıyor" SeasonalBanner
- "🥨 İkindi atıştırmalığı" TimeAwareBanner (saat bazlı)
- "🔥 En Popüler" hot recipes
- AI Asistan + Menü Planlayıcı banner CTA'lar
- "👨‍🍳 Önerilen Aşçılar" (oturum 25 sosyal proof)
- "Mutfaklara Göz At" (36 cuisine card)
- "Kategoriler" (17 kategori)
- "Hemen Başla" anonim CTA gizli (login user için doğru)

**2. AI Asistan dolap import 1-tık**
- "🎒 Dolabımı getir" button click → 5 pantry item (Tavuk/Soğan/Domates/Yumurta/Tereyağı) chip olarak eklendi
- Form state hydrate çalışıyor

**3. Menü Planlayıcı UX zengin**
- 7×3 = 21 slot (Pazartesi-Pazar × Kahvaltı/Öğle/Akşam)
- Otomatik "Bu hafta: 27 Nisan – 3 Mayıs 2026" tarih
- 3 toolbar CTA: "✨ AI ile Doldur" + "🖨️ Yazdır" + "🛒 Alışveriş listesine ekle"
- Empty state her slot'ta "+ Tarif ekle" picker

**4. Tarif detay returning user için tüm feature'lar**
- "👨‍🍳 Pişirdim ✓" toggle (cooked state doğru render)
- "1 kişi pişirdi" sosyal proof badge
- "Pişirme Modunu Başlat" CTA (TTS + step nav)
- 5 yıldız rating button + Yorum textarea ("Tarifte neyi sevdin, neyi değiştirirdin?")
- Variation Paylaş button (login user için aktif)
- "Yazdır" PDF export button
- "Paylaş" ShareMenu

**5. Empty states açıklayıcı**
- /akis: "Henüz içerik yok - Kimseyi takip etmiyorsun ya da takip ettiklerin son 30 günde uyarlama paylaşmamış." + "Tarifleri keşfet" CTA
- ReviewsSection (Adana Kebap'ta hala 0 yorum): "İlk yorumu sen bırak" sıcak CTA (oturum 25 P3 fix, hatırlatıcı)

**6. SaveMenu dropdown rich actions**
- Click sonrası: "Kaydedildi" + "Listeye ekle" + "Koleksiyon" + "Paylaş"
- Tek button çoklu aksiyon (UI compactness)

## Test edilemediler (sınırlamalar)

- **AI Asistan tarif önerisi sonucu**: dev mode timeout, prod-only test gerek
- **Pişirme Modu TTS Web Speech API**: browser preview emulator gerçek TTS engine yok, real Chrome/Safari test gerek
- **PDF export gerçek render**: print dialog dev preview emulate yok
- **Variation submit**: form validation + image upload Cloudinary entegrasyonu gerçek test gerek
- **Follow click + akış update**: real-time test (mock user için empty state confirmed)
- **Yorum submit + moderation**: dev mode rate limit + content policy test ayrı kategori
- **Kategori 8 cross-browser**: iOS Safari TTS, Firefox audio, Edge gerçek cihaz

## Test ortamı

- Browser preview MCP (Chrome DevTools)
- Viewport: 1440×900 desktop
- Mock user: `oturum26-returning@tarifle.local` (USER role, emailVerified=now, bio + avatarUrl set)
- Seed data: 5 RecipeCooked (son 30 gün), 3 Bookmark (popular slug), 1 Collection ("Hafta Sonu Denemeleri", 2 item), 5 UserPantryItem
- Cleanup: User --delete (cascade tüm related kayıtlar silindi)

## Sonraki adım

K2 bulguları küçük (0 P1, 2 P2, 1 P3 tekrar). K1'in 4 P1 fix paketi prod'da tüm anonim user akışları zaten iyileştirdi.

Tavsiye:
1. **K7 (Bug Hunt + Edge + Security, P1, ~1 saat)** - boundary, concurrent ops, CSP/HSTS, rate limit, data integrity
2. **K6 (A11y Deep Audit, P1, ~45 dk)** - keyboard navigation, screen reader, color contrast, touch target (K3'te bulunan breadcrumb 18px height) detaylı işle
3. **SaveMenu visual feedback fix (P2 #2)** - 15 dk standalone fix, returning user UX iyileştirme
