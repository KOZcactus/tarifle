import { describe, expect, it } from "vitest";
import {
  canChangeRole,
  isSuperAdminUsername,
} from "@/lib/auth/super-admin";

describe("isSuperAdminUsername", () => {
  it("returns true for the registered super-admin username", () => {
    expect(isSuperAdminUsername("kozcactus")).toBe(true);
  });

  it("returns false for regular usernames", () => {
    expect(isSuperAdminUsername("ahmetahmetyj9gn")).toBe(false);
    expect(isSuperAdminUsername("batubatugdcbt")).toBe(false);
  });

  it("returns false for null/undefined/empty", () => {
    expect(isSuperAdminUsername(null)).toBe(false);
    expect(isSuperAdminUsername(undefined)).toBe(false);
    expect(isSuperAdminUsername("")).toBe(false);
  });

  it("is case-sensitive (matches Prisma username collation)", () => {
    expect(isSuperAdminUsername("Kozcactus")).toBe(false);
    expect(isSuperAdminUsername("KOZCACTUS")).toBe(false);
  });
});

describe("canChangeRole", () => {
  it("super-admin can change another super-admin's role", () => {
    // Defensive, today there's only one super-admin, but the rule still
    // needs to hold if the allowlist grows.
    expect(canChangeRole("kozcactus", "kozcactus")).toBe(true);
  });

  it("super-admin can change a regular admin's role", () => {
    expect(canChangeRole("kozcactus", "ahmetahmetyj9gn")).toBe(true);
  });

  it("regular admin CANNOT change a super-admin's role", () => {
    expect(canChangeRole("ahmetahmetyj9gn", "kozcactus")).toBe(false);
  });

  it("regular admin can change another regular admin's role", () => {
    // Kerem explicitly said regular admins may demote each other.
    expect(canChangeRole("ahmetahmetyj9gn", "batubatugdcbt")).toBe(true);
  });

  it("regular admin can change a regular user's role", () => {
    expect(canChangeRole("ahmetahmetyj9gn", "someuser")).toBe(true);
  });

  it("null/undefined actor is treated as non-super-admin (denies super-admin target)", () => {
    // Belt-and-suspenders: if auth() somehow returns a session with no
    // username, we must not accidentally grant super-admin bypass.
    expect(canChangeRole(null, "kozcactus")).toBe(false);
    expect(canChangeRole(undefined, "kozcactus")).toBe(false);
  });

  it("null/undefined target collapses to regular-user rule (any admin can edit)", () => {
    // Missing target username shouldn't happen in practice, but if it
    // does the protection doesn't trigger, we only shield known
    // super-admin usernames.
    expect(canChangeRole("ahmetahmetyj9gn", null)).toBe(true);
    expect(canChangeRole("ahmetahmetyj9gn", undefined)).toBe(true);
  });
});
