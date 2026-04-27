/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff5f9',
          100: '#ffe8f2',
          200: '#ffd1e8',
          300: '#FFB7D5',
          400: '#ff99c2',
          500: '#FF80B5',
          600: '#e066a0',
          700: '#c0508a',
          800: '#9a3d6e',
          900: '#7a2f57',
        },
      },
    },
  },
  plugins: [],
}
