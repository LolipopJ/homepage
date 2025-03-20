/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/layouts/**/*.{js,jsx,ts,tsx}",
    "./src/pages/**/*.{js,jsx,ts,tsx}",
    "./src/templates/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      width: {
        88: "22rem",
      },
      spacing: {
        header: "var(--height-header)",
        footer: "var(--height-footer)",
      },
      colors: {
        primary: "var(--primary)",
        "primary-light": "var(--primary-light)",
        "primary-dark": "var(--primary-dark)",
        foreground: "var(--foreground)",
        "foreground-secondary": "var(--foreground-secondary)",
        "foreground-tertiary": "var(--foreground-tertiary)",
        background: "var(--background)",
        "background-light": "var(--background-light)",
        "background-lighter": "var(--background-lighter)",
        "background-dark": "var(--background-dark)",
        "background-darker": "var(--background-darker)",
      },
    },
  },
  plugins: [],
};
