import type { Config } from 'tailwindcss'

// Paleta tirada do guia visual (Instagram) da Érika.
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        creme: '#fbf3ee',
        blush: '#f3e0d6',
        nude: '#e8c9b9',
        terracota: { DEFAULT: '#b06c58', escuro: '#8f5243', claro: '#d9a493' },
        salvia: '#8a8668',
        cacau: '#6b4335',
        tinta: '#5a3a2e',
        marca: {
          50: '#fdf6f3', 100: '#f8e8e1', 200: '#efcfc2', 300: '#e2ad9a', 400: '#cf8b74',
          500: '#b8735f', 600: '#a2604d', 700: '#874e3f', 800: '#6b4335', 900: '#57372c',
        },
      },
      fontFamily: {
        serif: ['var(--fonte-serif)', 'Georgia', 'serif'],
        sans: ['var(--fonte-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
