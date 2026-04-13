import type { ContentStatus } from "@prisma/client";

export interface VariationCard {
  id: string;
  miniTitle: string;
  description: string | null;
  imageUrl: string | null;
  likeCount: number;
  status: ContentStatus;
  createdAt: string;
  author: {
    username: string;
    avatarUrl: string | null;
  };
}

export interface VariationIngredient {
  name: string;
  amount: string;
  unit?: string;
}

export interface VariationStep {
  stepNumber: number;
  instruction: string;
}
