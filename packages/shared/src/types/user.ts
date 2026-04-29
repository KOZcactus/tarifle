/**
 * User domain types, web + mobile shared.
 */

export type UserRole = "USER" | "ADMIN" | "EDITOR";

export interface UserPublic {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  image: string | null;
  role: UserRole;
  emailVerified: string | null; // ISO date
  locale: "tr" | "en";
}

export interface UserStats {
  bookmarks: number;
  reviews: number;
  cooked: number;
  collections: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: UserPublic;
  accessToken: string;
  refreshToken: string;
}
