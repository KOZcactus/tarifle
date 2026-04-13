import type { Role } from "@prisma/client";

export interface UserProfile {
  id: string;
  name: string | null;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  role: Role;
  isVerified: boolean;
  createdAt: string;
  _count: {
    variations: number;
    bookmarks: number;
  };
}

export interface SessionUser {
  id: string;
  name: string | null;
  username: string;
  email: string;
  avatarUrl: string | null;
  role: Role;
}
