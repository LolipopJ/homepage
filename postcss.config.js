module.exports = {
  plugins: {
    "postcss-import": {},
    [require.resolve("./plugins/postcss-theme-scope.cjs")]: {},
    "tailwindcss/nesting": "postcss-nesting",
    tailwindcss: {},
    autoprefixer: {},
  },
};
