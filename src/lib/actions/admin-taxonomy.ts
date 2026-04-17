"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";

async function requireAdmin(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Giriş yapmalısınız.");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    throw new Error("Yetkiniz yok.");
  }
  return session.user.id;
}

// ─── Tag CRUD ─────────────────────────────────────────────

const tagNameSchema = z
  .string()
  .trim()
  .min(2, "Etiket adı en az 2 karakter olmalı.")
  .max(50, "Etiket adı en fazla 50 karakter olabilir.");

const createTagSchema = z.object({
  name: tagNameSchema,
  /** Opsiyonel — verilmezse name'den türetilir. */
  slug: z.string().trim().min(2).max(50).optional(),
});

type ActionResult = { success: boolean; error?: string };

export async function createTagAction(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = createTagSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Geçersiz." };
  }
  const name = parsed.data.name;
  const slug = parsed.data.slug ? slugify(parsed.data.slug) : slugify(name);

  // Uniqueness on both name and slug — prisma @@unique çiftli değil,
  // iki ayrı unique field. Conflict'i elle kontrol ederek user-friendly
  // hata dönüyoruz (P2002'den parse etmek daha kırılgan).
  const existing = await prisma.tag.findFirst({
    where: { OR: [{ name }, { slug }] },
    select: { id: true, name: true, slug: true },
  });
  if (existing) {
    const which = existing.name === name ? "Ad" : "Slug";
    return { success: false, error: `${which} zaten kullanılıyor: ${existing.slug}` };
  }

  await prisma.tag.create({ data: { name, slug } });
  revalidatePath("/admin/etiketler");
  return { success: true };
}

const renameTagSchema = z.object({
  tagId: z.string().min(1),
  name: tagNameSchema,
});

/**
 * Tag name rename. Slug değişmez — URL'ler sabit kalır, filtrelerdeki
 * link/chip pattern'leri bozulmaz. Slug değiştirmek istersen yeni tag
 * oluştur + eskiyi sil akışı kullan.
 */
export async function renameTagAction(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = renameTagSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Geçersiz." };
  }
  const { tagId, name } = parsed.data;

  const conflict = await prisma.tag.findFirst({
    where: { name, NOT: { id: tagId } },
    select: { id: true },
  });
  if (conflict) {
    return { success: false, error: `Bu isim başka bir etikette kullanılıyor.` };
  }

  try {
    await prisma.tag.update({ where: { id: tagId }, data: { name } });
  } catch {
    return { success: false, error: "Etiket bulunamadı." };
  }
  revalidatePath("/admin/etiketler");
  return { success: true };
}

const deleteTagSchema = z.object({ tagId: z.string().min(1) });

/**
 * Tag sil. RecipeTag join'deki ilişkiler CASCADE olarak silinir (schema'da
 * explicit onDelete yok, Prisma default — ama burada güvenlik için
 * kullanım sayısı 0 değilse elle bloklanıyor. Moderatör force=true
 * göndermeden CASCADE etkisi tetiklenmez.)
 */
export async function deleteTagAction(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = deleteTagSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Geçersiz." };
  }

  const tag = await prisma.tag.findUnique({
    where: { id: parsed.data.tagId },
    select: {
      name: true,
      slug: true,
      _count: { select: { recipeTags: true } },
    },
  });
  if (!tag) return { success: false, error: "Etiket bulunamadı." };
  if (tag._count.recipeTags > 0) {
    return {
      success: false,
      error: `Bu etiket ${tag._count.recipeTags} tarifte kullanılıyor. Önce tariflerden kaldır.`,
    };
  }

  await prisma.tag.delete({ where: { id: parsed.data.tagId } });
  revalidatePath("/admin/etiketler");
  return { success: true };
}

// ─── Category CRUD ────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(100).optional(),
  emoji: z.string().trim().max(10).optional(),
  description: z.string().trim().max(500).optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export async function createCategoryAction(
  input: unknown,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Geçersiz." };
  }
  const { name, emoji, description, sortOrder } = parsed.data;
  const slug = parsed.data.slug ? slugify(parsed.data.slug) : slugify(name);

  const existing = await prisma.category.findFirst({
    where: { OR: [{ name }, { slug }] },
    select: { slug: true, name: true },
  });
  if (existing) {
    const which = existing.name === name ? "Ad" : "Slug";
    return { success: false, error: `${which} zaten var: ${existing.slug}` };
  }

  await prisma.category.create({
    data: {
      name,
      slug,
      emoji: emoji || null,
      description: description || null,
      sortOrder: sortOrder ?? 0,
    },
  });
  revalidatePath("/admin/kategoriler");
  revalidatePath("/tarifler");
  return { success: true };
}

const updateCategorySchema = z.object({
  categoryId: z.string().min(1),
  patch: z
    .object({
      name: z.string().trim().min(2).max(100).optional(),
      emoji: z.string().trim().max(10).optional().nullable(),
      description: z.string().trim().max(500).optional().nullable(),
      sortOrder: z.number().int().min(0).max(999).optional(),
    })
    .refine((v) => Object.keys(v).length > 0),
});

export async function updateCategoryAction(
  input: unknown,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Geçersiz." };
  }
  const { categoryId, patch } = parsed.data;

  if (patch.name) {
    const conflict = await prisma.category.findFirst({
      where: { name: patch.name, NOT: { id: categoryId } },
      select: { id: true },
    });
    if (conflict) {
      return { success: false, error: "Bu isim başka bir kategoride kullanılıyor." };
    }
  }

  try {
    const current = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { slug: true },
    });
    if (!current) return { success: false, error: "Kategori bulunamadı." };
    await prisma.category.update({ where: { id: categoryId }, data: patch });
    revalidatePath("/admin/kategoriler");
    revalidatePath(`/tarifler/${current.slug}`);
  } catch {
    return { success: false, error: "Güncellenemedi." };
  }
  return { success: true };
}

const deleteCategorySchema = z.object({ categoryId: z.string().min(1) });

export async function deleteCategoryAction(
  input: unknown,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = deleteCategorySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Geçersiz." };

  const cat = await prisma.category.findUnique({
    where: { id: parsed.data.categoryId },
    select: {
      name: true,
      slug: true,
      _count: { select: { recipes: true, children: true } },
    },
  });
  if (!cat) return { success: false, error: "Kategori bulunamadı." };
  if (cat._count.recipes > 0) {
    return {
      success: false,
      error: `Bu kategoride ${cat._count.recipes} tarif var. Tarifleri taşımadan silinemez.`,
    };
  }
  if (cat._count.children > 0) {
    return {
      success: false,
      error: `Bu kategoride ${cat._count.children} alt kategori var.`,
    };
  }

  await prisma.category.delete({ where: { id: parsed.data.categoryId } });
  revalidatePath("/admin/kategoriler");
  return { success: true };
}
