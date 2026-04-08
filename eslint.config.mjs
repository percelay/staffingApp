import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/server/repositories/**/*.{ts,tsx}",
      "src/generated/**",
      "**/*.test.ts",
      "**/*.test.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/db",
              message: "Import Prisma only from src/server/repositories/*.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/server/**/*.{ts,tsx}"],
    ignores: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/types", "@/lib/types/*"],
              message:
                "Server code should depend on shared contracts in src/lib/contracts, not UI-facing types.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/api/**/*.{ts,tsx}"],
    ignores: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/server/repositories", "@/server/repositories/*"],
              message:
                "Route handlers must go through src/server/services, not repositories.",
            },
            {
              group: ["@/server/serializers", "@/server/serializers/*"],
              message:
                "Route handlers should return service output instead of serializing repository records directly.",
            },
          ],
          paths: [
            {
              name: "@/lib/db",
              message: "Route handlers must not access Prisma directly.",
            },
          ],
        },
      ],
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
