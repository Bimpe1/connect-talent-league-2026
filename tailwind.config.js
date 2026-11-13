/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        ct: {
          navy: '#0a2558',
          'navy-dark': '#061739',
          'navy-light': '#163573',
          purple: '#6d28d9',
          'purple-dark': '#4c1d95',
          'purple-light': '#8b5cf6',
          violet: '#7c3aed',
          fuchsia: '#d926a9',
          bg: '#f8fafd'
        },
        brand: {
          50: '#f0f4fe',
          100: '#e0e9fd',
          200: '#c7d6fc',
          300: '#a3bdfa',
          400: '#759bf6',
          500: '#436cf0',
          600: '#2550e5',
          700: '#1d3ed1',
          800: '#163573',
          900: '#0a2558',
          950: '#051433',
        }
      }
    }
  }
}
