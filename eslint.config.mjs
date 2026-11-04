import css from "@eslint/css";
import eslint from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tailwind from "eslint-plugin-better-tailwindcss";
import * as mdx from "eslint-plugin-mdx";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import reactHooks from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import { tailwind4 } from "tailwind-csstree";
import tseslint from "typescript-eslint";

const scriptFiles = ["**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx,mdx}"];

export default defineConfig([
  globalIgnores([
    "**/node_modules/",
    "**/.cache/",
    "**/public/",
    "static/**/*.html",
  ]),
  tailwind.configs.stylistic,
  {
    rules: {
      "better-tailwindcss/enforce-consistent-line-wrapping": [
        "warn",
        { strictness: "loose" },
      ],
    },
    settings: {
      "better-tailwindcss": {
        entryPoint: "src/styles/global.css",
      },
    },
  },
  {
    files: scriptFiles,
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
    ],
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
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
  {
    files: scriptFiles,
    extends: [prettierRecommended],
  },
  {
    files: ["**/*.css"],
    language: "css/css",
    languageOptions: {
      customSyntax: tailwind4,
      tolerant: true,
    },
    plugins: { css },
  },
]);
