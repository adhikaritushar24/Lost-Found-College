/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          700: "#1e3a8a",
          800: "#1e2f5f",
          900: "#152447",
        },
      },
    },
  },
  plugins: [],
};
