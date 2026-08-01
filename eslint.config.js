import eslint from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores([
    "coverage/",
    "dist/",
    "node_modules/",
    "playwright-report/",
    "test-results/",
  ]),
  {
    files: ["**/*.{js,mjs}"],
    extends: [eslint.configs.recommended],
    languageOptions: {
      globals: {
        console: "readonly",
      },
    },
  },
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-confusing-void-expression": "off",
    },
  },
]);
