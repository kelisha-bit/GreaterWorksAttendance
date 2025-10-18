/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        church: {
          gold: '#D4AF37',
          darkGold: '#B8941F',
          lightGold: '#F5E6C8',
        }
      }
    },
  },
  plugins: [],
}
