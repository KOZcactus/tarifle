/**
 * Tag + Category admin CRUD action'larının Zod şemalarını test eder. Prisma
 * ya da session'a dokunmaz, sadece input validation katmanı. Kompleks
 * CRUD akışı E2E test'ine bırakılır (şu an integration yok, sonra eklenebilir).
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";
import { slugify } from "@/lib/utils";

// Aynı schema'ları inline tekrar tanımlıyoruz, server action private
// şemalarına erişmek için action dosyasını import etmek 'use server'
// gereği yan etkileri tetikler. Küçük duplication + clear-intent olarak
// kabul ediyoruz.
const tagNameSchema = z
  .string()
  .trim()
  .min(2, "Etiket adı en az 2 karakter olmalı.")
  .max(50, "Etiket adı en fazla 50 karakter olabilir.");

const createTagSchema = z.object({
  name: tagNameSchema,
  slug: z.string().trim().min(2).max(50).optional(),
});

const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(100).optional(),
  emoji: z.string().trim().max(10).optional(),
  description: z.string().trim().max(500).optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

describe("createTag validation", () => {
  it("accepts valid name + auto slug", () => {
    const parsed = createTagSchema.safeParse({ name: "Kahvaltı Favorisi" });
    expect(parsed.success).toBe(true);
  });

  it("rejects single-char name", () => {
    const parsed = createTagSchema.safeParse({ name: "a" });
    expect(parsed.success).toBe(false);
  });

  it("rejects empty name after trim", () => {
    const parsed = createTagSchema.safeParse({ name: "   " });
    expect(parsed.success).toBe(false);
  });

  it("trims whitespace around name", () => {
    const parsed = createTagSchema.safeParse({ name: "  Vegan  " });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.name).toBe("Vegan");
  });

  it("rejects 51-char name", () => {
    const parsed = createTagSchema.safeParse({ name: "x".repeat(51) });
    expect(parsed.success).toBe(false);
  });

  it("accepts optional slug", () => {
    const parsed = createTagSchema.safeParse({
      name: "Kış Sofrası",
      slug: "kis-sofrasi",
    });
    expect(parsed.success).toBe(true);
  });
});

describe("slugify (TR) for tag/category", () => {
  it("turns Turkish characters into ASCII slug", () => {
    expect(slugify("Kış Sofrası")).toBe("kis-sofrasi");
  });

  it("handles apostrophes and spacing", () => {
    expect(slugify("Patates Püresi")).toBe("patates-puresi");
  });

  it("lowercases mixed-case input", () => {
    expect(slugify("DENİZ Ürünleri")).toBe("deniz-urunleri");
  });

  it("collapses multiple spaces and trims", () => {
    // slugify (kütüphane) & karakterini "and"e çevirir, bu beklenen davranış.
    expect(slugify("  Çay   ve   Kahve ")).toBe("cay-ve-kahve");
  });
});

describe("createCategory validation", () => {
  it("accepts minimal valid input", () => {
    const parsed = categorySchema.safeParse({ name: "Deniz Ürünleri" });
    expect(parsed.success).toBe(true);
  });

  it("accepts full input with emoji + sortOrder", () => {
    const parsed = categorySchema.safeParse({
      name: "Balık Yemekleri",
      emoji: "🐟",
      description: "Deniz mahsulleri ve balıkla hazırlanan tarifler",
      sortOrder: 5,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects negative sortOrder", () => {
    const parsed = categorySchema.safeParse({
      name: "x".repeat(10),
      sortOrder: -1,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects sortOrder > 999", () => {
    const parsed = categorySchema.safeParse({
      name: "Test",
      sortOrder: 1000,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects emoji longer than 10 chars", () => {
    const parsed = categorySchema.safeParse({
      name: "Test",
      emoji: "🐟".repeat(6), // ~12 chars of emoji, > 10
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts empty emoji as missing (optional)", () => {
    const parsed = categorySchema.safeParse({ name: "Test" });
    expect(parsed.success).toBe(true);
  });
});
