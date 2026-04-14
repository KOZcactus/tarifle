import { describe, expect, it } from "vitest";
import {
  passwordChangeSchema,
  passwordSetSchema,
} from "@/lib/validators";

const valid = {
  currentPassword: "oldPassword1",
  newPassword: "brandNewPass123",
  confirmPassword: "brandNewPass123",
};

describe("passwordChangeSchema", () => {
  it("accepts a clean submission", () => {
    const parsed = passwordChangeSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("rejects empty current password", () => {
    expect(
      passwordChangeSchema.safeParse({ ...valid, currentPassword: "" }).success,
    ).toBe(false);
  });

  it("rejects new password shorter than 8", () => {
    const parsed = passwordChangeSchema.safeParse({
      ...valid,
      newPassword: "short",
      confirmPassword: "short",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toMatch(/8 karakter/);
    }
  });

  it("rejects mismatched confirmation", () => {
    const parsed = passwordChangeSchema.safeParse({
      ...valid,
      confirmPassword: "different-value",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toMatch(/eşleşmiyor/i);
    }
  });

  it("rejects new password identical to current", () => {
    const parsed = passwordChangeSchema.safeParse({
      currentPassword: "same-password-1",
      newPassword: "same-password-1",
      confirmPassword: "same-password-1",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toMatch(/eskisinden farkli|farklı olmalı/i);
    }
  });

  it("accepts a 128-char password", () => {
    const password = "a".repeat(128);
    const parsed = passwordChangeSchema.safeParse({
      currentPassword: "old",
      newPassword: password,
      confirmPassword: password,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a 129-char password", () => {
    const password = "a".repeat(129);
    const parsed = passwordChangeSchema.safeParse({
      currentPassword: "old",
      newPassword: password,
      confirmPassword: password,
    });
    expect(parsed.success).toBe(false);
  });
});

describe("passwordSetSchema", () => {
  const valid = {
    newPassword: "firstPassword1",
    confirmPassword: "firstPassword1",
  };

  it("accepts a clean first-time password", () => {
    expect(passwordSetSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects new password shorter than 8", () => {
    const parsed = passwordSetSchema.safeParse({
      newPassword: "1234567",
      confirmPassword: "1234567",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects mismatched confirmation", () => {
    const parsed = passwordSetSchema.safeParse({
      newPassword: "firstPassword1",
      confirmPassword: "different1",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toMatch(/eşleşmiyor/i);
    }
  });

  it("does NOT require a currentPassword field (OAuth-only)", () => {
    // Distinguishes this schema from passwordChangeSchema — caller only has
    // two fields to fill when adding a password for the first time.
    const parsed = passwordSetSchema.safeParse({
      ...valid,
      // extra `currentPassword` is ignored — Zod strips unknown keys by
      // default, but we assert behaviour explicitly here.
      currentPassword: "anything",
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts a 128-char password", () => {
    const password = "x".repeat(128);
    expect(
      passwordSetSchema.safeParse({
        newPassword: password,
        confirmPassword: password,
      }).success,
    ).toBe(true);
  });
});
