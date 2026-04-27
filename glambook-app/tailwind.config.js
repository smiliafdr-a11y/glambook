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
          50:  '#fdf2ee',
          100: '#fbe4d9',
          200: '#f7c9b3',
          300: '#f1a47e',
          400: '#e97547',
          500: '#D85A30',
          600: '#c04f28',
          700: '#a03f21',
          800: '#82331e',
          900: '#6b2c1c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
