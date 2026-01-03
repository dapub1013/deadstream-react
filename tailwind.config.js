/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      spacing: {
        'touch': '60px',
        'touch-lg': '80px',
      },
      fontSize: {
        'touch': '18px',
        'touch-lg': '24px',
      },
    },
  },
  plugins: [],
}