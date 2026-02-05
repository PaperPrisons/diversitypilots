/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./components/**/*.html",
    "./scripts/**/*.js"
  ],
  safelist: [
    'bg-black',
    'bg-customRed',
    'bg-logoRed',
    'hover:bg-black'
  ],
  theme: {
    extend: {
      colors: {
        dpiRed: '#8C1D40',
        customRed: '#9E1B32',
        logoRed: '#a32e3d'
      }
    },
  },
  plugins: [],
}