import { describe, expect, it } from "vitest";
import {
  passwordResetRequestSchema,
  passwordResetSubmitSchema,
} from "@/lib/validators";

describe("passwordResetRequestSchema", () => {
  it("accepts a valid email", () => {
    expect(
      passwordResetRequestSchema.safeParse({ email: "ornek@tarifle.app" }).success,
    ).toBe(true);
  });

  it("rejects empty email", () => {
    expect(passwordResetRequestSchema.safeParse({ email: "" }).success).toBe(
      false,
    );
  });

  it("rejects malformed email", () => {
    const parsed = passwordResetRequestSchema.safeParse({ email: "not-an-email" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toMatch(/e-posta/i);
    }
  });
});

describe("passwordResetSubmitSchema", () => {
  const valid = {
    token: "abcdef0123",
    newPassword: "brandNewPass1",
    confirmPassword: "brandNewPass1",
  };

  it("accepts a clean submission", () => {
    expect(passwordResetSubmitSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects missing token", () => {
    const parsed = passwordResetSubmitSchema.safeParse({ ...valid, token: "" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toMatch(/bağlantı|geçersiz/i);
    }
  });

  it("rejects password shorter than 8", () => {
    const parsed = passwordResetSubmitSchema.safeParse({
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
    const parsed = passwordResetSubmitSchema.safeParse({
      ...valid,
      confirmPassword: "different-value",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toMatch(/eşleşmiyor/i);
    }
  });

  it("accepts a 128-char password", () => {
    const password = "a".repeat(128);
    expect(
      passwordResetSubmitSchema.safeParse({
        token: "abc",
        newPassword: password,
        confirmPassword: password,
      }).success,
    ).toBe(true);
  });

  it("rejects a 129-char password", () => {
    const password = "a".repeat(129);
    expect(
      passwordResetSubmitSchema.safeParse({
        token: "abc",
        newPassword: password,
        confirmPassword: password,
      }).success,
    ).toBe(false);
  });
});
