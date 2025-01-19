module.exports = {
  globals: {
    __PATH_PREFIX__: true,
  },
  extends: [
    "react-app",
    "plugin:tailwindcss/recommended",
    "plugin:prettier/recommended",
  ],
  plugins: ["simple-import-sort"],
  rules: {
    "tailwindcss/no-custom-classname": 0,
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
  },
};
