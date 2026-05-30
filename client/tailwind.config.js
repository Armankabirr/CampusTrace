/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
      },
      boxShadow: {
        soft: '0 10px 30px rgba(15, 23, 42, 0.12)',
      },
      backgroundImage: {
        glow: 'radial-gradient(circle at 20% 20%, rgba(249,115,22,0.25), transparent 35%), radial-gradient(circle at 80% 35%, rgba(234,88,12,0.2), transparent 30%)',
      },
    },
  },
  plugins: [],
}
