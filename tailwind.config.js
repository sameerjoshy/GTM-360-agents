/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:    { DEFAULT: '#0A192F', 2: '#0f2444', 3: '#162d54' },
        indigo:  { DEFAULT: '#4F46E5', light: '#6366f1', pale: '#EEF2FF' },
        slate:   { surface: '#F8FAFC' },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'panel': '0 8px 40px -8px rgb(0 0 0 / 0.18)',
      }
    },
  },
  plugins: [],
}
