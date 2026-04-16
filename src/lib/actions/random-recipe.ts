"use server";

import { getRandomRecipe } from "@/lib/queries/random-recipe";

export async function getRandomRecipeAction() {
  return getRandomRecipe();
}
