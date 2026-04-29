/**
 * @tarifle/api-client
 *
 * Tarifle backend API wrapper, web + mobile shared.
 *
 * Phase 0 minimum skeleton. Phase 1'de gerçek endpoint'ler
 * doldurulur:
 * - listRecipes(filter)
 * - getRecipe(slug)
 * - searchRecipes(query)
 * - bookmark(slug) / unbookmark(slug)
 * - reviewRecipe(slug, payload)
 * - me() current user
 * - vs.
 *
 * Auth: caller tarafından `setAuthToken(jwt)` çağrılır, sonraki
 * tüm istekler Authorization: Bearer header'ı ile gider.
 */

import type { RecipeListItem, RecipeDetail, AuthResponse } from "@tarifle/shared";

let baseUrl = "https://tarifle.app";
let authToken: string | null = null;

export function configureApiClient(opts: { baseUrl: string; token?: string | null }): void {
  baseUrl = opts.baseUrl;
  if (opts.token !== undefined) authToken = opts.token;
}

export function setAuthToken(token: string | null): void {
  authToken = token;
}

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  headers?: Record<string, string>;
}

async function apiFetch<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers ?? {}),
  };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  const res = await fetch(`${baseUrl}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "unknown" }));
    throw new ApiError(res.status, err);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`API error ${status}: ${JSON.stringify(body)}`);
    this.name = "ApiError";
  }
}

// Recipe endpoints (skeleton, Phase 1'de doldurulur)
export const recipes = {
  list: (filter?: { cuisine?: string; type?: string; limit?: number }): Promise<RecipeListItem[]> =>
    apiFetch(`/api/recipes${filter ? `?${new URLSearchParams(filter as Record<string, string>)}` : ""}`),

  get: (slug: string): Promise<RecipeDetail> =>
    apiFetch(`/api/recipes/${slug}`),

  search: (query: string): Promise<RecipeListItem[]> =>
    apiFetch(`/api/search?q=${encodeURIComponent(query)}`),
};

// Auth endpoints (Phase 0 spec docs/MOBILE_AUTH_API_SPEC.md)
export const auth = {
  login: (email: string, password: string): Promise<AuthResponse> =>
    apiFetch("/api/auth/mobile-login", { method: "POST", body: { email, password } }),

  register: (payload: {
    email: string;
    password: string;
    name: string;
    locale: "tr" | "en";
  }): Promise<AuthResponse> =>
    apiFetch("/api/auth/mobile-register", { method: "POST", body: payload }),

  refresh: (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> =>
    apiFetch("/api/auth/mobile-refresh", { method: "POST", body: { refreshToken } }),

  logout: (refreshToken: string): Promise<void> =>
    apiFetch("/api/auth/mobile-logout", { method: "POST", body: { refreshToken } }),

  me: (): Promise<AuthResponse["user"]> =>
    apiFetch("/api/auth/me"),
};
