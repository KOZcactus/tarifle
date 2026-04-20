import { variationSchema } from "../src/lib/validators";

const ok = variationSchema.safeParse({
  recipeId: "abc123",
  miniTitle: "Firinda versiyonu",
  ingredients: ["2 adet patlican", "1 cay kasigi tuz"],
  steps: ["Patlicanlari kes", "Firina at"],
});
console.log("valid line-based:", ok.success);

const old = variationSchema.safeParse({
  recipeId: "abc",
  miniTitle: "Test",
  ingredients: [{ name: "a", amount: "1", unit: "tk" }],
  steps: [{ stepNumber: 1, instruction: "do thing" }],
});
console.log("valid old structured:", old.success);

const tooMany = variationSchema.safeParse({
  recipeId: "abc",
  miniTitle: "Test",
  ingredients: Array(50).fill("thing"),
  steps: ["step"],
});
console.log(
  "rejects 50 ingredients:",
  !tooMany.success,
  tooMany.success ? "" : ", " + tooMany.error.issues[0].message,
);
