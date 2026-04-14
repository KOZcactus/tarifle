import { describe, expect, it } from "vitest";
import { normalizeEmail } from "@/lib/email";

describe("normalizeEmail", () => {
  it("lowercases mixed-case addresses", () => {
    expect(normalizeEmail("Info@Example.com")).toBe("info@example.com");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeEmail("  user@tarifle.app  ")).toBe("user@tarifle.app");
    expect(normalizeEmail("\tkerem@gmail.com\n")).toBe("kerem@gmail.com");
  });

  it("preserves ASCII 'I' as lowercase 'i' rather than Turkish 'ı'", () => {
    // A Turkish-locale lowercase would map "I" → "ı", breaking email matches.
    // This regression would be catastrophic — all existing users whose email
    // has an uppercase I would lose access after login normalization changes.
    expect(normalizeEmail("INFO@example.com")).toBe("info@example.com");
    expect(normalizeEmail("Info@example.com")).toBe("info@example.com");
  });

  it("is idempotent", () => {
    const once = normalizeEmail("Foo@Bar.com");
    const twice = normalizeEmail(once);
    expect(once).toBe(twice);
  });

  it("does not modify already-normalised addresses", () => {
    expect(normalizeEmail("user@tarifle.app")).toBe("user@tarifle.app");
  });
});
