/**
 * Super-admin registry, usernames that sit "above" the regular ADMIN role.
 *
 * Policy (Kerem, 19 Nis 2026):
 *   - Regular ADMINs can promote/demote each other freely.
 *   - A super-admin CANNOT be demoted by a non-super-admin ADMIN. Only a
 *     super-admin can change another super-admin's role.
 *   - Visually, a super-admin is shown as "ADMIN", no special badge in the
 *     UI (explicit request: "başadmin diye belirtmene gerek yok").
 *
 * Implementation choice: hardcoded username allowlist rather than a schema
 * column. Scope is genuinely 1 person right now; if we need to scale this
 * (additional super-admins, per-capability grants) the right next step is a
 * Boolean column on User and a migration. Username-based lookup is fine
 * because usernames are immutable once claimed (the auth layer never lets a
 * user rename to match an existing one). The const is case-sensitive on
 * purpose, Prisma username comparisons are case-sensitive.
 *
 * KEEP THIS FILE SMALL. Add user-facing UX in the call sites, not here.
 */

const SUPER_ADMIN_USERNAMES: readonly string[] = ["kozcactus"];

/**
 * Returns true when the username belongs to a super-admin. Accepts
 * null/undefined for convenience at call sites that don't pre-null-check
 * the user object.
 */
export function isSuperAdminUsername(
  username: string | null | undefined,
): boolean {
  if (!username) return false;
  return SUPER_ADMIN_USERNAMES.includes(username);
}

/**
 * Core authorization predicate for role mutations. Returns true when
 * `actor` is allowed to change `target`'s role.
 *
 * Rules:
 *   1. target is super-admin + actor is NOT super-admin → DENY
 *      (a regular ADMIN cannot touch a super-admin's role)
 *   2. Everything else → ALLOW at this layer (existing self-demote and
 *      "role change requires ADMIN" guards still apply elsewhere)
 *
 * This is deliberately narrow, it only enforces the super-admin
 * protection. It does not re-check the baseline "must be ADMIN" rule,
 * because that guard already lives in `updateUserAction` and gets hit
 * before this predicate.
 */
export function canChangeRole(
  actorUsername: string | null | undefined,
  targetUsername: string | null | undefined,
): boolean {
  const targetIsSuper = isSuperAdminUsername(targetUsername);
  const actorIsSuper = isSuperAdminUsername(actorUsername);
  if (targetIsSuper && !actorIsSuper) return false;
  return true;
}
