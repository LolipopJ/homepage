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
  globalIgnores([
    "**/node_modules/",
    "**/.cache/",
    "**/public/",
    "static/**/*.html",
  ]),
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  tailwind.configs["flat/recommended"],
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "tailwindcss/no-custom-classname": "off",
    },
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
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
  },
  {
    files: ["blog/**/*.mdx"],
    extends: [mdx.flat, mdx.flatCodeBlocks],
    languageOptions: {
      globals: {
        ...globals.browser,
        Card: "readonly",
        Link: "readonly",
        HintText: "readonly",
        GameCard: "readonly",
        GamePlatformCard: "readonly",
        Grid: "readonly",
        ProjectCard: "readonly",
        __PATH_PREFIX__: true,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  prettierRecommended,
]);
