# Mobile Auth API Specification

> Mobile app (Expo, Phase 0+) için JWT tabanlı auth endpoint'leri.
> Web Auth.js v5 cookie session ile aynı `User` tablosuna yazar,
> sadece transport JWT. Single source of truth: backend Next.js
> `/api/auth/mobile-*` rotaları, Phase 0'da implement edilir.

**Status**: Spec only (oturum 33). Implementasyon yok. Mobile development
başlamadan önce backend tarafında 1-2 günlük iş.

---

## 1. Mimari

```
Mobile (Expo)
   │
   │ POST /api/auth/mobile-login { email, password }
   │ ←  200 { accessToken, refreshToken, user }
   │
   │ GET /api/recipes (Authorization: Bearer <accessToken>)
   │ ←  200 [...]
   │
   │ POST /api/auth/mobile-refresh { refreshToken }
   │ ←  200 { accessToken, refreshToken } (rotated)
   │
   ▼
Backend (Next.js /api)
   │
   ▼
DB (Neon)
   ├── User (mevcut, ortak)
   ├── Account (mevcut Auth.js, OAuth provider link)
   └── RefreshToken (YENİ tablo, mobile-specific)
```

**Web** Auth.js v5 cookie session devam eder, dokunulmaz. Mobile JWT
sadece `User` row paylaşır + ekstra `RefreshToken` tablosuna yazar.

---

## 2. Token Stratejisi

### 2.1. Access Token

- **Format**: JWT (HS256, secret = `process.env.AUTH_SECRET`)
- **Süre**: 1 saat
- **Payload**:
  ```json
  {
    "sub": "user-cuid",
    "email": "ahmet@gmail.com",
    "role": "USER" | "ADMIN" | "EDITOR",
    "iat": 1730000000,
    "exp": 1730003600
  }
  ```
- **Storage**: Mobile `expo-secure-store` (Keychain iOS / Keystore Android)
- **Header**: `Authorization: Bearer <access_token>`
- **Server-side validation**: Her korumalı route'da JWT verify, `sub` ile
  `User.findUnique` çek, `req.user` set et

### 2.2. Refresh Token

- **Format**: Opaque random string (`crypto.randomBytes(64).toString("hex")`),
  JWT DEĞİL
- **Süre**: 30 gün
- **Storage**:
  - DB: `RefreshToken` tablosu (`token`, `userId`, `expiresAt`,
    `createdAt`, `revokedAt`, `userAgent`, `ip`)
  - Mobile: `expo-secure-store`
- **Rotation**: Refresh kullanıldığında eski revoke + yeni issue (single use)
- **Revoke**: Logout veya security incident

### 2.3. Yeni Prisma model (PHASE 0'da migrate)

```prisma
model RefreshToken {
  id         String   @id @default(cuid())
  token      String   @unique  // hashed (sha256), raw token mobile'da
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  revokedAt  DateTime?
  userAgent  String?  @db.Text
  ip         String?

  @@index([userId])
  @@index([expiresAt])
}
```

---

## 3. Endpoint'ler

### 3.1. POST /api/auth/mobile-register

Email + password ile yeni kullanıcı.

**Request**:
```json
{
  "email": "ahmet@gmail.com",
  "password": "Ahm3t!2026",
  "name": "Ahmet Yılmaz",
  "locale": "tr" | "en"
}
```

**Validation**:
- Email RFC 5322 + unique
- Password min 8 char, en az 1 büyük harf + 1 rakam (web ile aynı)
- Name 2-50 char
- Locale `tr` veya `en`

**Response 200**:
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "abc123...",
  "user": {
    "id": "cuid",
    "email": "ahmet@gmail.com",
    "name": "Ahmet Yılmaz",
    "username": "ahmetyilmaz123",
    "role": "USER",
    "emailVerified": null,
    "image": null,
    "locale": "tr"
  }
}
```

**Response 409** (email var):
```json
{ "error": "email_exists", "message": "Bu e-posta zaten kayıtlı." }
```

**Response 400** (validation):
```json
{ "error": "invalid_input", "fields": { "password": "Min 8 karakter" } }
```

**Side effects**:
- `User.create` (web ile aynı tablo)
- `RefreshToken.create`
- Email doğrulama maili gönder (mevcut Resend altyapısı)
- Welcome email (mevcut)

### 3.2. POST /api/auth/mobile-login

Email + password.

**Request**:
```json
{ "email": "ahmet@gmail.com", "password": "Ahm3t!2026" }
```

**Response 200**: §3.1 ile aynı format.

**Response 401**:
```json
{ "error": "invalid_credentials" }
```

**Response 429** (rate limit):
```json
{ "error": "too_many_attempts", "retryAfter": 60 }
```

**Side effects**:
- bcrypt compare password
- `RefreshToken.create`
- `User.lastLoginAt` update

### 3.3. POST /api/auth/mobile-google

Google Sign-In ID token.

**Request**:
```json
{
  "idToken": "google-id-token-...",
  "locale": "tr"
}
```

**Backend flow**:
1. Verify ID token via Google's tokeninfo endpoint or `google-auth-library`
2. Extract `email`, `name`, `picture`, `sub` (Google user ID)
3. Find or create `User` (ortak Auth.js User table)
4. Find or create `Account` (provider="google", providerAccountId=sub)
5. Issue access + refresh tokens

**Response**: §3.1 ile aynı.

**Apple Sign-In benzer** (`/api/auth/mobile-apple`), `idToken` + Apple
public key verification.

### 3.4. POST /api/auth/mobile-refresh

**Request**:
```json
{ "refreshToken": "abc123..." }
```

**Response 200**:
```json
{
  "accessToken": "eyJ... (yeni)",
  "refreshToken": "xyz789... (rotated, eski revoke)"
}
```

**Response 401**:
```json
{ "error": "invalid_refresh_token" | "expired" | "revoked" }
```

**Side effects**:
- Eski `RefreshToken.revokedAt = now()`
- Yeni `RefreshToken.create`

### 3.5. POST /api/auth/mobile-logout

**Request** (Authorization: Bearer + body):
```json
{ "refreshToken": "abc123..." }
```

**Response 204** (No Content).

**Side effects**:
- `RefreshToken.revokedAt = now()` (token'ı invalidate)
- Access token client tarafında silinir (server stateless, expiry'a kadar geçerli ama mobile kullanmaz)

### 3.6. POST /api/auth/mobile-forgot-password

**Request**:
```json
{ "email": "ahmet@gmail.com" }
```

**Response 200** (her zaman, enumeration önleme):
```json
{ "ok": true }
```

**Side effects**:
- User varsa: reset token üret (`PasswordReset` tablosu, web ile aynı,
  mevcut), 1 saat geçerli
- Email gönder (web template ile aynı)

### 3.7. POST /api/auth/mobile-reset-password

**Request**:
```json
{ "token": "reset-token", "password": "Yeni!sif123" }
```

**Response 200**:
```json
{ "ok": true }
```

**Side effects**:
- Password hash update
- Tüm `RefreshToken` revoke (security)
- Yeni session login için kullanıcı tekrar `mobile-login`

### 3.8. POST /api/auth/mobile-verify-email

**Request**:
```json
{ "token": "verify-token" }
```

**Response 200**: User'ı `emailVerified = now()` set et.

(Web ile aynı flow, mobile sadece deep link → app içi handler)

### 3.9. GET /api/auth/me

Korumalı, current user bilgisi.

**Headers**: `Authorization: Bearer <access_token>`

**Response 200**:
```json
{
  "id": "cuid",
  "email": "ahmet@gmail.com",
  "name": "Ahmet Yılmaz",
  "username": "ahmetyilmaz123",
  "role": "USER",
  "image": "https://lh3.googleusercontent.com/...",
  "emailVerified": "2026-04-29T10:00:00Z",
  "locale": "tr",
  "preferences": { ... },
  "stats": { "bookmarks": 12, "reviews": 3, "cooked": 8 }
}
```

---

## 4. Middleware (jwt-auth.ts)

Mevcut Next.js middleware'in yanına ekle:

```ts
// src/lib/jwt-auth.ts
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

export interface MobileJwtPayload {
  sub: string;
  email: string;
  role: "USER" | "ADMIN" | "EDITOR";
  iat: number;
  exp: number;
}

export function verifyMobileJwt(req: NextRequest): MobileJwtPayload | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.AUTH_SECRET!) as MobileJwtPayload;
    return payload;
  } catch {
    return null;
  }
}

export async function requireMobileUser(req: NextRequest) {
  const payload = verifyMobileJwt(req);
  if (!payload) {
    return { error: "unauthorized", status: 401 };
  }
  // Optionally fetch user from DB for fresh role/permissions
  return { user: payload };
}
```

Korumalı route'larda:

```ts
export async function GET(req: NextRequest) {
  const auth = await requireMobileUser(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  // auth.user.sub kullan
  ...
}
```

---

## 5. Error Format (tüm endpoint'ler)

```json
{
  "error": "machine_readable_code",
  "message": "İnsan okur açıklama (TR localized)",
  "fields": { "fieldName": "specific issue" }  // opsiyonel
}
```

**Error code listesi**:
- `email_exists` (409)
- `invalid_credentials` (401)
- `invalid_input` (400)
- `unauthorized` (401)
- `forbidden` (403)
- `too_many_attempts` (429)
- `not_found` (404)
- `expired` (401)
- `revoked` (401)
- `server_error` (500)

---

## 6. Rate Limit

Upstash Redis ile (mevcut altyapı):

| Endpoint | Limit |
|---|---|
| `/api/auth/mobile-login` | 5 dakikada 10 deneme / IP + email |
| `/api/auth/mobile-register` | Saatte 3 / IP |
| `/api/auth/mobile-forgot-password` | Saatte 3 / IP + email |
| `/api/auth/mobile-refresh` | Dakikada 30 / userId |
| `/api/auth/me` | Dakikada 60 / userId |

---

## 7. Security Notları

- Password: bcrypt cost 12 (web ile aynı)
- Refresh token raw mobile'da, hash (sha256) DB'de stored
- JWT secret rotation: 90 günde bir, eski secret 7 gün overlap
- HTTPS zorunlu (Vercel default)
- CORS: mobile origin yok (native app), API tüm origin'lerden erişilebilir
  ama JWT verify guard
- CSRF: mobile native'de cookie yok, CSRF irrelevant
- Token leak senaryosu: refresh token DB lookup ile revoke edilebilir

---

## 8. Test Endpoints (development)

`/api/auth/mobile-debug-token` (dev only, NODE_ENV !== "production"):
- Body: `{ email }` → access + refresh token döndür (login bypass)
- Sentry'e fail event

---

## 9. Implementation Sırası (Phase 0 backend)

1. **Hafta 1**:
   - Prisma `RefreshToken` model + migration
   - `src/lib/jwt-auth.ts` middleware
   - `/api/auth/mobile-register` + `/api/auth/mobile-login`
   - Test: Postman/Thunder Client ile manual test
2. **Hafta 1.5**:
   - `/api/auth/mobile-refresh` + `/api/auth/mobile-logout`
   - `/api/auth/mobile-google` + `/api/auth/mobile-apple` (token verify)
   - `/api/auth/mobile-forgot-password` + `/api/auth/mobile-reset-password`
   - `/api/auth/me`
3. **Hafta 2**:
   - Mevcut korumalı route'lara JWT support ek (cookie OR Bearer
     hybrid auth helper)
   - Rate limit Upstash entegrasyon
   - E2E test (vitest + supertest)

**Total**: 1.5-2 hafta backend, mobile development başlamadan önce.

---

## 10. Mobile Tarafında Karşılığı (referans)

```ts
// apps/mobile/src/lib/auth.ts
import * as SecureStore from "expo-secure-store";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE; // https://tarifle.app

async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/mobile-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw await res.json();
  const { accessToken, refreshToken, user } = await res.json();
  await SecureStore.setItemAsync("accessToken", accessToken);
  await SecureStore.setItemAsync("refreshToken", refreshToken);
  return user;
}

async function authedFetch(path: string, init?: RequestInit) {
  let accessToken = await SecureStore.getItemAsync("accessToken");
  let res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (res.status === 401) {
    // Try refresh
    accessToken = await refreshAccessToken();
    if (accessToken) {
      res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: { ...init?.headers, Authorization: `Bearer ${accessToken}` },
      });
    }
  }
  return res;
}
```
