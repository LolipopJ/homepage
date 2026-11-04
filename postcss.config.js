module.exports = {
  plugins: {
    // Keep vendor source paths for theme scoping before Tailwind compiles.
    "postcss-import": {
      filter: (id) => id !== "tailwindcss",
      resolve: (id, basedir) => require.resolve(id, { paths: [basedir] }),
    },
    [require.resolve("./plugins/postcss-theme-scope.cjs")]: {},
    "@tailwindcss/postcss": {},
  },
};
