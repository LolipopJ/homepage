module.exports = {
  root: true,
  globals: {
    __PATH_PREFIX__: true,
  },
  settings: {
    react: {
      version: "detect", // detect react version
    },
  },
  env: {
    node: true,
    browser: true,
    es2022: true,
  },
  parser: "@typescript-eslint/parser",
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "react-app",
    "plugin:tailwindcss/recommended",
    "plugin:prettier/recommended",
  ],
  plugins: ["@typescript-eslint", "simple-import-sort"],
  rules: {
    "tailwindcss/no-custom-classname": 0,
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
  },
};
