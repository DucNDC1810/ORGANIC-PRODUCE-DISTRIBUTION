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
          DEFAULT: '#14b8a6',
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          dark: '#0d9488',
        },
        foreground: '#1e293b',
        background: '#ffffff',
        'muted-foreground': '#64748b',
        border: '#e2e8f0',
        secondary: '#f0fdfa',
      },
    },
  },
  plugins: [],
}
