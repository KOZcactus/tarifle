# Tarifle Email Template Rehberi

> Web launch playbook §3 ek (`docs/FUTURE_PLANS.md`). Tüm dış
> iletişim template'leri + email adres planı + setup talimatı.

## 1. Email Adres Planı

Tarifle prod domain: **tarifle.app** (`.com` değil). Cloudflare DNS
kurulu, MX + Email Routing veya Google Workspace ile yönlendirilir.

### Aktif olması gereken 6 adres

| Adres | Amaç | Kim okuyacak | Yanıt SLA |
|---|---|---|---|
| `iletisim@tarifle.app` | Genel sorgu, fallback | Kerem (kendi Gmail forward) | 48 saat |
| `destek@tarifle.app` | Kullanıcı destek (hesap, şifre, bug, KVKK silme talep önce buradan) | Kerem (öncelik) | 24 saat |
| `kvkk@tarifle.app` | KVKK veri sahibi talepleri (data export, silme, düzeltme) | Kerem + Hukuk danışmanı CC | 30 gün (KVKK yasal limit) |
| `basin@tarifle.app` | Basın, blogger, yazar | Kerem | 72 saat |
| `editor@tarifle.app` | Yeni tarif öneri, içerik feedback, partnership | Kerem | 7 gün |
| `noreply@tarifle.app` | Sistem mail FROM (Resend) | Otomatik | n/a |

### Setup yöntemleri (seçenek)

**A. Cloudflare Email Routing (önerilen, ücretsiz)**

Mevcut Cloudflare DNS üzerinden kurulur. Her alias Kerem'in kendi
Gmail hesabına forward edilir. Yanıt verirken Gmail'den "send-as"
ile `iletisim@tarifle.app` gibi tarifle.app adresinden yollanır.

Setup:
1. Cloudflare dashboard → tarifle.app domain → Email Routing
2. "Enable Email Routing" tıkla, MX kayıtları otomatik kurulur
3. 6 routing kuralı ekle, her biri için Kerem'in kişisel adresi
4. Gmail "Settings → Accounts → Send mail as" ile her alias için
   send-as konfigürasyonu (SMTP relay: Cloudflare default veya
   Gmail SMTP)

**B. Google Workspace (premium, $7-12/user/ay)**

Tek user (Kerem), 6 alias gönderme. Daha gelişmiş özellikler (Drive,
Calendar takım için) gerekirse. Şu an tek-kişi takım için overkill.

**C. Resend Inbound (geçiş, ücretsiz)**

Resend zaten outbound için kullanılıyor. Inbound parsing eklenebilir
ama yanıtlama için yine kişisel hesaba forward gerek. Cloudflare Email
Routing daha temiz.

**Karar**: Cloudflare Email Routing, tüm 6 adres + Kerem Gmail'e
forward, Gmail send-as ile yanıt. Lansman öncesi T-7 gün setup.

---

## 2. Email Template'leri

Her template TR + EN paralel. Em-dash (U+2014, U+2013) yasak
(AGENTS.md). HTML versiyonu Resend için inline; manuel yanıtlarda
plain text Gmail compose.

### 2.1. Welcome Email (yeni kayıt)

**Mevcut**: web `src/lib/email/welcome` veya `password-reset` benzeri
helper var, kontrol edip template kullan.

**Subject**: `Tarifle'ye hoş geldin, {name}` / `Welcome to Tarifle, {name}`

**Body TR**:

```
Merhaba {name},

Tarifle'ye hoş geldin. 3700+ Türkçe tarif, allergen filtresi, diyet
önerileri ve AI asistan ile mutfakta seninleyiz.

İlk adımlar:
- Profili tamamla: tarifle.app/ayarlar
- Tarif ara veya AI asistan ile başla: tarifle.app/ai-asistan
- Beğendiğin tarifleri kaydet, koleksiyon yap

Sorun, soru ya da öneri için: destek@tarifle.app

İyi mutfaklar,
Tarifle ekibi

---
Bu mail tarifle.app'e kayıt olduğun için gönderildi. Hesabını silmek
ya da bildirim ayarlarını değiştirmek istersen: tarifle.app/ayarlar
```

**Body EN**:

```
Hi {name},

Welcome to Tarifle. 3700+ Turkish recipes with allergen filtering,
diet scoring, and an AI assistant for everyday cooking.

First steps:
- Complete your profile: tarifle.app/ayarlar
- Search recipes or start with AI assistant: tarifle.app/ai-asistan
- Save recipes you like, build collections

Questions or feedback: destek@tarifle.app

Happy cooking,
The Tarifle team

---
You received this email because you registered on tarifle.app. To
delete your account or update notification settings:
tarifle.app/ayarlar
```

### 2.2. Email Verification

**Subject**: `Email adresini doğrula` / `Verify your email`

**Body TR**:

```
Merhaba,

Tarifle hesabını oluşturdun. Email adresini doğrulamak için aşağıdaki
linke tıkla:

{verifyUrl}

Bu link 24 saat içinde geçerlidir.

Eğer bu kaydı sen yapmadıysan bu maili görmezden gel, hesap
oluşturulmaz.

Tarifle ekibi
```

**Body EN**:

```
Hello,

You created a Tarifle account. To verify your email address, click
the link below:

{verifyUrl}

This link expires in 24 hours.

If you did not create this account, ignore this email; the account
will not be activated.

The Tarifle team
```

### 2.3. Password Reset

**Subject**: `Şifre sıfırlama isteği` / `Password reset request`

**Body TR**:

```
Merhaba {name},

Hesabın için şifre sıfırlama talebi aldık. Yeni şifre belirlemek için:

{resetUrl}

Bu link 1 saat içinde geçerlidir.

Eğer bu talebi sen yapmadıysan bu maili görmezden gel, şifren değişmez.
Şüpheli bir durum varsa: destek@tarifle.app

Tarifle ekibi
```

### 2.4. Account Deletion Confirmation (KVKK)

**Subject**: `Hesabın silindi (KVKK)` / `Your account has been deleted`

**Body TR**:

```
Merhaba {name},

Tarifle hesabın silme talebin doğrultusunda silinmiştir. Aşağıdaki
veriler geri dönülemez şekilde silindi:

- Profil bilgileri (isim, email, avatar)
- Bookmark, koleksiyon, yorumlar
- Pantry içeriği, menü planları, alışveriş listeleri

Yedeği silinmeyen veriler (KVKK 5/2-c kapsamında, yasal yükümlülük):
- Anonim site analytics (kim olduğun bilinmiyor)
- Yıllık fatura/finansal kayıtlar (varsa, 10 yıl, KVKK + VUK)

Veri silmenin tam kapsamı: tarifle.app/yasal/kvkk

Bizi denediğin için teşekkürler. İlerde tekrar kayıt olmak istersen
yeni bir hesapla geri dönebilirsin.

Tarifle ekibi
```

### 2.5. Press Inquiry Response (Blogger / Yazar / Gazeteci)

**Subject**: `Re: {orijinal subject}` veya `Tarifle hakkında bilgi paketi`

**Body TR**:

```
Merhaba {firstName},

Tarifle'ye ilgini ve yazma niyetini için teşekkürler. Senin için
gereken her şey aşağıda:

PİTCH (kullanılabilir alıntı):
"Tarifle, 3700+ Türkçe tarifi modern bir platformda sunan, allergen
filtrelemesi, diyet önerileri ve AI asistanıyla evde mutfak deneyimini
kolaylaştıran bir tarif sitesidir. Çoğu Türkçe tarif sitesi reklam
yoğun ve kaynak göstermez; Tarifle her tarif için kanonik formülü ve
bilim açıklamasını sunar."

Tam basın kit (faktoidler, story angles, marka materyalleri):
tarifle.app/basin

Sıkça sorulanlar:

S: Kaç kullanıcı var?
C: Lansman aşamasındayız, kullanıcı sayısını lansman sonrası 3-6 ay
açıklayacağız.

S: Tarifleri nereden alıyorsunuz?
C: Yöre + uluslararası klasik tariflerden başladık, her tarif için
kanonik formül + kaynak referansı (BBC Food, Bon Appétit, yemek.com,
kültür-bakanlığı yöresel sayfaları gibi). Her tarif manuel doğrulama
geçer.

S: AI asistan gerçek bir LLM mi?
C: Hayır, kural-tabanlı bir öneri motoru. Kullanıcının pantry'sindeki
malzemeleri girer, algoritma 3700 tarif arasından eşleşeni döner.
Sıfır API maliyet, KVKK uyumlu (kullanıcı verisi dış API'ye gitmez).

S: Demo / hesap / ekran görüntüsü?
C: Anında erişim için: tarifle.app (ücretsiz kayıt). Özel demo
hesabı talep edersen ayarlayabiliriz.

Yazını yayınlamadan önce alıntıları doğrulamak veya ek soru sormak
istersen bana doğrudan bu mailden yazabilirsin.

İyi yazılar,
Kerem
Tarifle
basin@tarifle.app
```

**Body EN**:

```
Hi {firstName},

Thank you for your interest and writing intent on Tarifle. Everything
you need is below:

PITCH (usable quote):
"Tarifle is a modern Turkish recipe platform with 3700+ recipes,
allergen filtering, diet scoring, and an AI assistant for everyday
home cooking. Where most Turkish recipe sites are ad-heavy and lack
source attribution, Tarifle delivers canonical formulas with
scientific explanation for every recipe."

Full press kit (factoids, story angles, brand assets):
tarifle.app/basin

Common questions:

Q: How many users?
A: Pre-launch; user count will be disclosed 3-6 months post-launch.

Q: Where do recipes come from?
A: Started from regional + international classics, each with canonical
formula + source attribution (BBC Food, Bon Appétit, yemek.com,
ministry of culture regional pages). Each recipe passes manual
validation.

Q: Is the AI assistant a real LLM?
A: No, rule-based recommendation engine. User inputs pantry items,
algorithm matches against 3700 recipes. Zero API cost, KVKK / GDPR
compliant (user data never leaves our backend).

Q: Demo / account / screenshots?
A: Immediate access at tarifle.app (free signup). For dedicated demo
accounts, let me know.

Feel free to write back if you want to verify quotes or have follow-up
questions before publishing.

Cheers,
Kerem
Tarifle
basin@tarifle.app
```

### 2.6. Blogger Outreach (Personalized)

Tarifle'den çıkış mailı, **{blogger}'ın spesifik yazısına atıfla**.

**Subject**: `{blogName}'da {konu} yazını okudum, Tarifle hakkında konuşalım mı?`

**Body TR (template + personalization)**:

```
Merhaba {firstName},

{blogName}'da {konu} yazını okudum, özellikle {spesifik nokta}
gözlemini değerli buldum. Bu nedenle yazıyorum.

Ben Kerem, Tarifle'nin (tarifle.app) kurucusuyum. Tarifle 3700+ Türkçe
tarif barındıran ve {senin yazınla bağlantılı bir özellik, örn:
allergen filtresi / yöresel mutfak haritası / AI asistan} sunan bir
platform.

Yakında lansmana hazırlanıyoruz, ve {blogName} okuyucu kitlesi ile
örtüşen bir hikaye var:

- {Tarifle özelliği 1}
- {Tarifle özelliği 2}
- {Senin için spesifik açı, örn: "Yöresel mutfak yazılarına genel-
  geçer tariflerden farklı bir yaklaşım"}

İlgilenirsen kısa demo yapabiliriz, ya da basın kit'imiz hazır:
tarifle.app/basin

Hızlı bir yanıt yeterli, "ilgilenmiyorum" ya da "evet bana detay yolla"
hangisi olursa.

Sevgiyle,
Kerem
Tarifle
kerem@tarifle.app
tarifle.app
```

**ÖNEMLI**: outreach mailinde:
1. Blogger'ın yazısına SPESİFİK referans (forwarding sevmez genel)
2. Senden talep eden değil, sunan ton ("yardım edebilir misin?" yerine
   "bu yazına denk gelebilir mi?")
3. Hızlı yanıt opt-out kolaylığı ("ilgilenmiyorum yeterli")
4. Tek mail (3 mailli takip yapma, spam algılanır)

**Body EN (kısaltılmış, yabancı blogger için)**:

```
Hi {firstName},

Read your {topic} piece on {blogName}, especially appreciated your
{specific point}. Reaching out for that reason.

I run Tarifle (tarifle.app), a Turkish recipe platform with 3700+
recipes and {feature aligning with their interest}. We're approaching
launch.

Story angles that might fit {blogName}:
- {angle 1}
- {angle 2}
- {specific to their work}

Press kit ready: tarifle.app/basin

Quick "not interested" or "send me more" reply is enough.

Best,
Kerem
Tarifle
kerem@tarifle.app
```

### 2.7. Genel Destek Yanıt (Bug / Soru / Hesap Sorunu)

**Subject**: `Re: {orijinal} / Tarifle destek`

**Body TR (boş template, doldurulacak)**:

```
Merhaba {name},

Tarifle'ye yazdığın için teşekkürler.

[BURAYA SPESIFIK YANIT]

Eğer ek bilgiye ihtiyacın olursa bu maile yanıt verebilirsin. Hesap
güvenliği konusunda hızlı yanıt için tarifle.app/ayarlar üzerinden
de destek talebi açabilirsin.

İyi günler,
{Kerem / Editör adı}
Tarifle destek
destek@tarifle.app
```

### 2.8. Yeni Tarif Öneri Yanıt (Editor)

**Subject**: `Re: Tarif öneri - {tarif adı}`

**Body TR**:

```
Merhaba {name},

{tarif adı} önerin için teşekkürler. Tarifle'de henüz {var/yok}.

[Eğer ekleyeceksek]:
Önümüzdeki batch'lerde değerlendiriyoruz. Eklendiğinde sana mail atalım
mı? Bilgilendirmek için bir email adresi paylaşmak istersen
destek@tarifle.app'e dön.

[Eğer eklemiyorsak]:
Şu an tarif kütüphanemiz {sebep}. Önerin gelecek genişleme planımıza
not edildi, eklendiğinde {nasıl bilgi vereceksin}.

[Eğer benzer var]:
Şu tariflere bakar mısın, önerinle örtüşebilir:
- tarifle.app/tarif/{slug1}
- tarifle.app/tarif/{slug2}

Eğer farklı bir versiyon istiyorsan, önerin yine değerli; önümüzdeki
batch'lere not edildi.

Sevgiyle,
{editör adı}
Tarifle editör
editor@tarifle.app
```

### 2.9. Newsletter Haftalık Gönderi (Mevcut Cron)

**Mevcut altyapı**: `src/lib/email/newsletter-weekly.ts`. Resend cron
job ile haftalık gönderim. Template'i kontrol et + lansman öncesi
revize gerekebilir.

**Subject**: `Tarifle haftalık - {N tarif}` / `Tarifle weekly - {N recipes}`

**Body**: Mevcut template kullan, lansman öncesi T-7 gün son
inceleme yap.

### 2.10. Hesap Silme Talep (Manuel KVKK Yanıt, gerekirse)

Otomatik akış `/api/user/delete-account` mevcut, ama manuel email
talebi gelirse:

**Subject**: `Re: Hesap silme talebi`

**Body TR**:

```
Merhaba {name},

Hesap silme talebini aldık. Tarifle'de hesap silme iki yolla yapılır:

1. ÖNERİLEN, kendi-yönetimli (anında):
   tarifle.app/ayarlar/hesabi-sil

   Sayfada email adresini doğrula, hesap ve tüm bookmark/koleksiyon/
   yorum verisi anında silinir, KVKK 5/2-c yasal yükümlülük dışında
   tüm veri geri dönülmez. Onay maili otomatik gönderilir.

2. Manuel (KVKK):
   Kimlik doğrulamak için aşağıdaki bilgileri yanıtla:
   - Hesap email adresi
   - Hesap kullanıcı adı (varsa)
   - Kayıt tarihi (yaklaşık)

   Kimlik doğrulama sonrası 7 iş günü içinde silme işlemi yapılır,
   onay maili gönderilir.

KVKK detay: tarifle.app/yasal/kvkk

Anlamadığın bir şey varsa: kvkk@tarifle.app

İyi günler,
{Kerem}
Tarifle KVKK
kvkk@tarifle.app
```

---

## 3. Yanıt SLA + Disiplin

| Mail tipi | SLA | Otomatik mi |
|---|---|---|
| Welcome | Anında (Resend cron) | ✅ Otomatik |
| Email verification | Anında | ✅ Otomatik |
| Password reset | Anında | ✅ Otomatik |
| Newsletter weekly | Haftalık cron | ✅ Otomatik |
| Account deletion confirmation | Anında (kullanıcı self-service) | ✅ Otomatik |
| Genel destek (`destek@`) | 24 saat | Manuel |
| KVKK talep (`kvkk@`) | 7 iş günü maksimum (KVKK 30 gün yasal) | Manuel |
| Basın talep (`basin@`) | 72 saat | Manuel |
| Editor öneri (`editor@`) | 7 gün | Manuel |
| Genel iletişim (`iletisim@`) | 48 saat | Manuel |

## 4. Spam / Güvenlik Notu

- Tarifle'den gelen mail her zaman `@tarifle.app` adresinden gelir
- "Hesabın askıya alındı, tıkla" gibi phishing mailleri Tarifle değil
- DKIM + SPF + DMARC kayıtları Cloudflare DNS'te aktif olmalı
  (Resend onboarding ile zaten kurulmuş, yenileri eklenirken
  doğrula)

## 5. T-7 Gün Setup Checklist

Lansman öncesi 1 hafta:
- [ ] Cloudflare Email Routing aktif, 6 alias forward
- [ ] Gmail send-as her alias için yapılandırıldı
- [ ] DKIM + SPF + DMARC kayıtları doğrulandı
- [ ] Mevcut transactional email template'leri (welcome, verify,
      reset, deletion) son inceleme + revize
- [ ] /iletisim sayfası adres listesi güncel (destek + editor ek)
- [ ] /basin sayfası iletişim bilgisi güncel
- [ ] /yasal/kvkk dokümanında veri sahibi başvuru kanalı kvkk@ ile
      uyumlu
- [ ] Resend dashboard inbox monitoring aktif (delivery rate
      izleme)
- [ ] Test email her aliase, forward + send-as doğrulama

---

**Bu doküman yaşayan referanstır.** Lansman sonrası 30 gün KPI
inceleme ile (`docs/FUTURE_PLANS.md` web launch playbook §5) hangi
template hangi yanıt oranı aldı analiz edilir, revize.
