import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalıdır"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "İsim en az 2 karakter olmalıdır").max(100),
    username: z
      .string()
      .min(3, "Kullanıcı adı en az 3 karakter olmalıdır")
      .max(50)
      .regex(/^[a-zA-Z0-9_]+$/, "Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir"),
    email: z.string().email("Geçerli bir e-posta adresi girin"),
    password: z.string().min(8, "Şifre en az 8 karakter olmalıdır"),
    confirmPassword: z.string(),
    kvkkAccepted: z.literal(true, {
      error: "KVKK metnini kabul etmelisiniz",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

/**
 * Server-side schema for the user-facing variation form. Matches the actual
 * form shape: line-separated strings for ingredients/steps, with per-line and
 * total-count caps to keep the JSON payload bounded.
 */
export const variationSchema = z.object({
  recipeId: z.string().min(1),
  miniTitle: z.string().min(3, "Başlık en az 3 karakter olmalıdır").max(200),
  description: z.string().max(300).optional(),
  ingredients: z
    .array(z.string().min(1).max(200))
    .min(1, "En az bir malzeme ekleyin")
    .max(40, "En fazla 40 malzeme ekleyebilirsin."),
  steps: z
    .array(z.string().min(1).max(500))
    .min(1, "En az bir adım ekleyin")
    .max(30, "En fazla 30 adım ekleyebilirsin."),
  notes: z.string().max(500).optional(),
});

// COMMENT enum value exists in Prisma schema for forward-compat but the model
// doesn't ship yet. Validator only accepts VARIATION until Comment lands.
export const reportSchema = z.object({
  targetType: z.literal("VARIATION"),
  targetId: z.string(),
  reason: z.enum(["SPAM", "PROFANITY", "MISLEADING", "HARMFUL", "OTHER"]),
  description: z.string().max(500).optional(),
});

/**
 * URL segments the username must not clash with — otherwise /profil/<foo>
 * would shadow /profil/me, /ayarlar would be unreachable, etc. Keep in sync
 * with actual route directories under src/app/.
 */
export const RESERVED_USERNAMES: readonly string[] = [
  "admin",
  "administrator",
  "moderator",
  "mod",
  "api",
  "auth",
  "tarifle",
  "tarif",
  "tarifler",
  "bildirimler",
  "ayarlar",
  "giris",
  "kayit",
  "dogrula",
  "profil",
  "kesfet",
  "kategori",
  "kategoriler",
  "ai-asistan",
  "koleksiyon",
  "alisveris-listesi",
  "hakkimizda",
  "kvkk",
  "gizlilik",
  "kullanim-sartlari",
  "me",
  "self",
  "user",
  "users",
  "test",
  "system",
  "support",
  "help",
  "_next",
  "public",
] as const;

const reservedSet = new Set(RESERVED_USERNAMES);

export const profileUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "İsim en az 2 karakter olmalıdır")
    .max(100, "İsim en fazla 100 karakter olabilir"),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Kullanıcı adı en az 3 karakter olmalıdır")
    .max(30, "Kullanıcı adı en fazla 30 karakter olabilir")
    // Lowercase ASCII + digit + underscore + hyphen. No diacritics; these
    // appear in the URL path and must round-trip through basic routers,
    // OGs, and share URLs cleanly.
    .regex(
      /^[a-z][a-z0-9_-]*$/,
      "Kullanıcı adı harfle başlamalı; sadece küçük harf, rakam, _ veya - içerebilir",
    )
    .refine((v) => !reservedSet.has(v), {
      message: "Bu kullanıcı adı sistem için ayrılmış, farklı bir tane seç",
    }),
  bio: z.preprocess(
    // Treat blank submissions as "not set" so the DB stores null instead
    // of an empty string. Also protects against callers sending undefined.
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z
      .string()
      .trim()
      .max(300, "Bio en fazla 300 karakter olabilir")
      .optional(),
  ),
});

export const collectionSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter olmalıdır").max(100),
  description: z.string().max(500).optional(),
  emoji: z.string().max(10).optional(),
  isPublic: z.boolean().optional(),
});

export const shoppingListItemSchema = z.object({
  name: z.string().min(1, "Malzeme adı boş olamaz").max(200),
  amount: z.string().max(50).optional(),
  unit: z.string().max(50).optional(),
});

export const aiSuggestSchema = z.object({
  ingredients: z
    .array(z.string().min(1).max(80))
    .min(1, "En az bir malzeme gir.")
    .max(20, "En fazla 20 malzeme girebilirsin."),
  type: z
    .enum([
      "YEMEK",
      "TATLI",
      "ICECEK",
      "KOKTEYL",
      "APERATIF",
      "SALATA",
      "CORBA",
      "KAHVALTI",
      "ATISTIRMALIK",
      "SOS",
    ])
    .optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  maxMinutes: z.number().int().positive().max(480).optional(),
  assumePantryStaples: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type VariationInput = z.infer<typeof variationSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type CollectionInput = z.infer<typeof collectionSchema>;
export type ShoppingListItemInput = z.infer<typeof shoppingListItemSchema>;
export type AiSuggestInput = z.infer<typeof aiSuggestSchema>;
