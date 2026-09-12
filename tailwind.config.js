/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      fontSize: { base: '1.0625rem' }, // ~17px body para readable
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        brand: '#6d28d9',
        'brand-deep': '#4c1d95',
        paid: '#16a34a',     // berde — bayad na / verified
        pending: '#d9a406',  // amber — naghihintay
        overdue: '#dc2626',  // pula — overdue / locked
      },
    },
  },
  plugins: [],
};
