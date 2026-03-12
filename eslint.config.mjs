import eslint from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import * as mdx from "eslint-plugin-mdx";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import reactHooks from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tailwind from "eslint-plugin-tailwindcss";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  eslint.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  tailwind.configs["flat/recommended"],
  mdx.flat,
  mdx.flatCodeBlocks,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        __PATH_PREFIX__: true,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "tailwindcss/no-custom-classname": 0,
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  prettierRecommended,
  globalIgnores([
    "**/node_modules/",
    "**/.cache/",
    "**/public/",
    "static/**/*.html",
  ]),
]);
