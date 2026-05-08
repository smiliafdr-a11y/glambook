/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#FAF0F3',
          100: '#F5D9E3',
          200: '#EBCAD4',
          300: '#D9899D',
          400: '#CE6783',
          500: '#C24567',
          600: '#A33856',
          700: '#852C44',
          800: '#6A2236',
          900: '#4F1828',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
