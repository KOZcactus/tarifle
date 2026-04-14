import { describe, expect, it } from "vitest";
import { passwordChangeSchema } from "@/lib/validators";

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
