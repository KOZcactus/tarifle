import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z
    .string()
    .min(8, "Şifre en az 8 karakter olmalıdır")
    .max(128, "Şifre en fazla 128 karakter olabilir"),
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
    // K1 P2 #6 (oturum 26): password minLength 8 -> 12. NIST SP 800-63B
    // memorized secret guideline: minimum 8 char + complexity, ama
    // modern best practice 12+ char (entropy ~64 bit @ casual user
    // patterns). Yeni hesaplar icin zorunlu, mevcut user'lar
    // login schema'sinda min(8) kalir (eski hesap kirilmasin).
    password: z
      .string()
      .min(12, "Şifre en az 12 karakter olmalıdır")
      .max(128, "Şifre en fazla 128 karakter olabilir"),
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
 * Structured ingredient shape used by the new variation form. We still accept
 * raw strings (old textarea format) for backward compat, the union below
 * normalises them to `{ amount: "", unit: "", name }` so downstream code
 * doesn't need to branch.
 */
const structuredIngredientSchema = z.object({
  amount: z.string().trim().max(50).default(""),
  unit: z.string().trim().max(50).default(""),
  name: z
    .string()
    .trim()
    .min(1, "Malzeme adı boş olamaz")
    .max(200, "Malzeme adı en fazla 200 karakter olabilir"),
});

const legacyStringIngredientSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .transform((name) => ({ amount: "", unit: "", name }));

const ingredientInputSchema = z.union([
  structuredIngredientSchema,
  legacyStringIngredientSchema,
]);

/**
 * Server-side schema for the user-facing variation form. Matches the actual
 * form shape: structured ingredient objects for the new picker, plain line-
 * separated strings for steps.
 */
export const variationSchema = z.object({
  recipeId: z.string().min(1),
  miniTitle: z.string().min(3, "Başlık en az 3 karakter olmalıdır").max(200),
  description: z.string().max(300).optional(),
  ingredients: z
    .array(ingredientInputSchema)
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
  targetType: z.enum(["VARIATION", "REVIEW"]),
  targetId: z.string(),
  reason: z.enum(["SPAM", "PROFANITY", "MISLEADING", "HARMFUL", "OTHER"]),
  description: z.string().max(500).optional(),
});

/**
 * Review (tarif yorumu + yıldız). Rating 1-5 integer; comment opsiyonel
 * (sadece yıldız de atılabilir). Comment varsa 10-800 karakter, çok
 * kısa yorum signal-less, çok uzun moderation yükü.
 */
export const reviewSchema = z.object({
  recipeId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z
    .string()
    .trim()
    .transform((s) => (s.length === 0 ? undefined : s))
    .pipe(z.string().min(10).max(800).optional())
    .optional(),
});

/**
 * URL segments the username must not clash with, otherwise /profil/<foo>
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
  "sifremi-unuttum",
  "sifre-sifirla",
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
  cuisines: z.array(z.string().min(2).max(5)).max(20).optional(),
  excludeIngredients: z
    .array(z.string().min(1).max(80))
    .max(10, "En fazla 10 hariç tutulan malzeme.")
    .optional(),
  // E: "Beğenmedim, farklı dene" için client-side biriktirilen rejected
  // slug listesi. Provider sonuçlardan bunları çıkarır.
  excludeSlugs: z.array(z.string().min(1).max(200)).max(60).optional(),
  // E: "Beğenmedim, farklı dene" sayaç (client-side UX, provider bilmez
  // ama schema'ya eklemek action logging'de faydalı).
  rejectRound: z.number().int().min(0).max(10).optional(),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut şifreyi gir"),
    newPassword: z
      .string()
      .min(8, "Yeni şifre en az 8 karakter olmalıdır")
      .max(128, "Şifre en fazla 128 karakter olabilir"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Yeni şifreler eşleşmiyor",
    path: ["confirmPassword"],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "Yeni şifre eskisinden farklı olmalı",
    path: ["newPassword"],
  });

/**
 * First-time password set for OAuth-only users. No `currentPassword` because
 * by definition they don't have one, the action layer additionally verifies
 * that `user.passwordHash` is null so a bug here couldn't let someone bypass
 * the normal change flow.
 */
export const passwordSetSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Şifre en az 8 karakter olmalıdır")
      .max(128, "Şifre en fazla 128 karakter olabilir"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

/**
 * "Forgot password", step 1: user submits their email, we send a reset link.
 * We validate shape only; the action layer normalizes and de-duplicates.
 */
export const passwordResetRequestSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
});

/**
 * "Forgot password", step 2: user lands on /sifre-sifirla/[token] and submits
 * a new password. Token itself is validated by the server action against the
 * DB; schema only checks shape + matching confirmation.
 */
export const passwordResetSubmitSchema = z
  .object({
    token: z.string().min(1, "Sıfırlama bağlantısı geçersiz"),
    newPassword: z
      .string()
      .min(8, "Şifre en az 8 karakter olmalıdır")
      .max(128, "Şifre en fazla 128 karakter olabilir"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type PasswordSetInput = z.infer<typeof passwordSetSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetSubmitInput = z.infer<typeof passwordResetSubmitSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type VariationInput = z.infer<typeof variationSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type CollectionInput = z.infer<typeof collectionSchema>;
export type ShoppingListItemInput = z.infer<typeof shoppingListItemSchema>;
export type AiSuggestInput = z.infer<typeof aiSuggestSchema>;

/** AI v4 Weekly Menu Planner input (core algoritma inputu ile uyumlu). */
export const weeklyMenuSchema = z.object({
  ingredients: z
    .array(z.string().min(1).max(80))
    .min(1, "En az bir malzeme gir.")
    .max(30, "En fazla 30 malzeme girebilirsin."),
  assumePantryStaples: z.boolean().optional(),
  cuisines: z.array(z.string().min(2).max(5)).max(20).optional(),
  dietSlug: z.string().min(2).max(40).optional(),
  excludeIngredients: z
    .array(z.string().min(1).max(80))
    .max(10, "En fazla 10 hariç tutulan malzeme.")
    .optional(),
  personCount: z.number().int().min(1).max(12).optional(),
  maxBreakfastMinutes: z.number().int().positive().max(240).optional(),
  maxLunchMinutes: z.number().int().positive().max(240).optional(),
  maxDinnerMinutes: z.number().int().positive().max(240).optional(),
  seed: z.string().max(64).optional(),
  macroPreference: z
    .enum(["none", "high-protein", "low-calorie", "high-fiber"])
    .optional(),
  excludeSlugs: z
    .array(z.string().min(1).max(200))
    .max(300, "Son 300 slug ile sınırlı.")
    .optional(),
  // v4.3+ requireFullyStocked: true ise sadece pantry'nin tam karsiladigi
  // adaylar. pantryStock action tarafindan session.user ile otomatik
  // enjekte edilir, UI'dan gelmez (private data gereksiz hop).
  requireFullyStocked: z.boolean().optional(),
});

export type WeeklyMenuFormInput = z.infer<typeof weeklyMenuSchema>;

/** Schema for applying a generated menu to the user's active meal plan. */
export const applyWeeklyMenuSchema = z.object({
  slots: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER"]),
        recipeId: z.string().min(1),
      }),
    )
    .min(1, "En az bir öğün seçilmeli.")
    .max(21, "Haftalık menüde en fazla 21 slot olur."),
  /** Mevcut meal plan itemlarını silip yeniden yaz (true) vs sadece boş slotlara yaz (false). */
  replace: z.boolean().optional(),
});

export type ApplyWeeklyMenuInput = z.infer<typeof applyWeeklyMenuSchema>;

/** v4.3 Single-slot regenerate: mevcut 20 dolu slot'u koruyup yalnız hedef
 *  hücrenin tarifini başka bir uygun adayla değiştirir. `currentSlots`
 *  picker'a çakışma kontrolü + kategori/mutfak cap'lerini rebuild ettirir. */
export const regenerateMenuSlotSchema = z.object({
  input: weeklyMenuSchema,
  targetDay: z.number().int().min(0).max(6),
  targetMeal: z.enum(["BREAKFAST", "LUNCH", "DINNER"]),
  currentSlots: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER"]),
        slug: z.string().min(1).max(200),
        categoryName: z.string().min(1).max(80),
        cuisine: z.string().min(2).max(5).nullable(),
      }),
    )
    .max(21),
});

export type RegenerateMenuSlotInput = z.infer<typeof regenerateMenuSlotSchema>;
