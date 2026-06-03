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
        primary: colors.amber, // You can change this to colors.indigo or colors.violet depending on your specific panel branding
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