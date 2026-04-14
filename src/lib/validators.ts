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

export const reportSchema = z.object({
  targetType: z.enum(["VARIATION", "COMMENT"]),
  targetId: z.string(),
  reason: z.enum(["SPAM", "PROFANITY", "MISLEADING", "HARMFUL", "OTHER"]),
  description: z.string().max(500).optional(),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(300).optional(),
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
