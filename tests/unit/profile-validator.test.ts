import { describe, expect, it } from "vitest";
import { profileUpdateSchema, RESERVED_USERNAMES } from "@/lib/validators";

const valid = {
  name: "Kerem Özcan",
  username: "kerem_ozcan",
  bio: "Evde yemek pişirmeyi seven biri.",
};

describe("profileUpdateSchema", () => {
  it("accepts a clean profile update", () => {
    const parsed = profileUpdateSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("rejects too-short username", () => {
    const parsed = profileUpdateSchema.safeParse({ ...valid, username: "ab" });
    expect(parsed.success).toBe(false);
  });

  it("rejects too-long username", () => {
    const parsed = profileUpdateSchema.safeParse({
      ...valid,
      username: "a".repeat(31),
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects usernames starting with a digit or symbol", () => {
    expect(
      profileUpdateSchema.safeParse({ ...valid, username: "1kerem" }).success,
    ).toBe(false);
    expect(
      profileUpdateSchema.safeParse({ ...valid, username: "_kerem" }).success,
    ).toBe(false);
    expect(
      profileUpdateSchema.safeParse({ ...valid, username: "-kerem" }).success,
    ).toBe(false);
  });

  it("rejects usernames with diacritics", () => {
    // Non-ASCII letters can't roundtrip through URL paths and share URLs
    // cleanly, so the regex blocks them outright, even after the lowercase
    // transform.
    expect(
      profileUpdateSchema.safeParse({ ...valid, username: "özcan" }).success,
    ).toBe(false);
    expect(
      profileUpdateSchema.safeParse({ ...valid, username: "çetin" }).success,
    ).toBe(false);
  });

  it("normalises uppercase username input to lowercase (intentional)", () => {
    // The schema's `.toLowerCase()` transform is there on purpose: lets the
    // UI accept "Kerem_Ozcan" in the input and save a canonical "kerem_ozcan".
    const parsed = profileUpdateSchema.safeParse({
      ...valid,
      username: "KEREM_OZCAN",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.username).toBe("kerem_ozcan");
    }
  });

  it("rejects reserved usernames", () => {
    for (const reserved of ["admin", "api", "ayarlar", "me"]) {
      const parsed = profileUpdateSchema.safeParse({
        ...valid,
        username: reserved,
      });
      expect(parsed.success, `expected ${reserved} to be rejected`).toBe(false);
    }
  });

  it("accepts valid usernames with digits, underscores, and hyphens", () => {
    for (const ok of ["user_01", "kerem-ozcan", "abc123"]) {
      expect(
        profileUpdateSchema.safeParse({ ...valid, username: ok }).success,
        `expected ${ok} to pass`,
      ).toBe(true);
    }
  });

  it("rejects names shorter than 2 characters", () => {
    expect(
      profileUpdateSchema.safeParse({ ...valid, name: "K" }).success,
    ).toBe(false);
  });

  it("rejects bios longer than 300 characters", () => {
    expect(
      profileUpdateSchema.safeParse({
        ...valid,
        bio: "x".repeat(301),
      }).success,
    ).toBe(false);
  });

  it("treats empty-string bio as undefined (optional)", () => {
    const parsed = profileUpdateSchema.safeParse({ ...valid, bio: "" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.bio).toBeUndefined();
    }
  });

  it("exports a reserved list that covers every admin route segment we ship", () => {
    // Tripwire, if we add a /profil/<slug>-shadow route we should also add
    // it to RESERVED_USERNAMES so users can't grab it.
    expect(RESERVED_USERNAMES).toContain("admin");
    expect(RESERVED_USERNAMES).toContain("ayarlar");
    expect(RESERVED_USERNAMES).toContain("bildirimler");
    expect(RESERVED_USERNAMES).toContain("profil");
  });
});
