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
          50:  '#fdf0f5',
          100: '#fce0eb',
          200: '#f9c1d7',
          300: '#f593b8',
          400: '#f06499',
          500: '#E91E8C',
          600: '#d4177e',
          700: '#b01268',
          800: '#8e0f54',
          900: '#6b0b3f',
        },
        dark: {
          900: '#0a0a0a',
          800: '#111111',
          700: '#1a1a1a',
          600: '#222222',
        }
      },
    },
  },
  plugins: [],
}
