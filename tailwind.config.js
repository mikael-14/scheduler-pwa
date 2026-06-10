/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors'

export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Filament natively switches themes using the 'class' strategy
  theme: {
    extend: {
      colors: {
        // Filament's standard color naming schema
        danger: colors.rose,
        primary: {
          50: 'oklch(0.979 0.021 166.113)',
          100: 'oklch(0.95 0.052 163.051)',
          200: 'oklch(0.905 0.093 164.15)',
          300: 'oklch(0.845 0.143 164.978)',
          400: 'oklch(0.765 0.177 163.223)',
          500: 'oklch(0.696 0.17 162.48)',
          600: 'oklch(0.596 0.145 163.225)',
          700: 'oklch(0.508 0.118 165.612)',
          800: 'oklch(0.432 0.095 166.913)',
          900: 'oklch(0.378 0.077 168.94)',
          950: 'oklch(0.262 0.051 172.552)'
        },
        success: colors.emerald,
        warning: colors.amber,
        gray: colors.slate, // Filament v4/v5 moved from 'gray' to the crisper 'slate'
      },
      fontFamily: {
        // Filament leans into native, highly readable sans-serif system stacks
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
      },
      boxShadow: {
        // Filament's signature card and section borders use an incredibly subtle, sharp double shadow
        'filament': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // Essential for replicating Filament's beautiful form input architectures
  ],
}