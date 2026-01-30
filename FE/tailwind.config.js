/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#10b981',
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          dark: '#059669',
        },
        foreground: '#1e293b',
        background: '#ffffff',
        'muted-foreground': '#64748b',
        border: '#e2e8f0',
        secondary: '#f0fdfa',
        // Popover/Dropdown colors
        popover: {
          DEFAULT: '#ffffff',
          foreground: '#1e293b',
        },
        card: {
          DEFAULT: '#ffffff',
          foreground: '#1e293b',
        },
      },
    },
  },
  plugins: [],
}
