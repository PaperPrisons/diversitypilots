/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./components/**/*.html",
    "./scripts/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        dpiRed: '#8B1538',
      }
    },
  },
  plugins: [],
}