import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Treat `_`-prefixed vars/args as intentionally unused. Common pattern:
      // `const { email: _email, ...rest } = user` to strip a field from an
      // object. Without this override the destructure-to-exclude idiom trips
      // the default no-unused-vars warning.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      // TODO: switch to `next/image` once we wire Cloudinary + `remotePatterns`.
      // Every current `<img>` renders a user-uploaded `recipe.imageUrl` whose
      // host isn't known up front, so Next's loader refuses until configured.
      // Disabling the rule here keeps CI green; revisit when image storage
      // lands.
      "@next/next/no-img-element": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
