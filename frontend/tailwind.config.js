/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#FBF8F1',
          100: '#F5EEDF',
          200: '#EBDCBF',
          300: '#DEC599',
          400: '#D2B074',
          500: '#C5A869', // Primary brand gold
          600: '#A98948',
          700: '#876B32',
          800: '#695226',
          900: '#4F3D1C',
        },
        charcoal: {
          50: '#F6F6F7',
          100: '#E7E8EA',
          200: '#C5C7CC',
          300: '#9EA2AA',
          400: '#6E737E',
          500: '#484D58',
          600: '#333740',
          700: '#23262D',
          800: '#181A1F',
          900: '#101114',
          950: '#0A0B0D',
        },
        cream: {
          50: '#FAF9F6',
          100: '#F4F2EB',
          200: '#EBE7DC',
          300: '#DDD7C7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Cinzel', 'Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'luxury': '0 4px 20px -2px rgba(18, 19, 22, 0.05), 0 2px 6px -1px rgba(197, 168, 105, 0.08)',
        'gold-glow': '0 0 15px rgba(197, 168, 105, 0.25)',
      },
    },
  },
  plugins: [],
}
