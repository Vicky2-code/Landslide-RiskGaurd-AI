/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#16302b', 2: '#1c3a33' },
        teal: { DEFAULT: '#0d9488', dark: '#0b7a70' },
        amber: { DEFAULT: '#d97706' },
        bg: '#f4f7f6',
        card: '#ffffff',
        border: '#dbe5e2',
        text: { DEFAULT: '#16302b', mute: '#5b6f6a', soft: '#8a9a96' },
        risk: {
          low: '#22c55e',
          moderate: '#eab308',
          high: '#f97316',
          'very-high': '#dc2626',
          'low-bg': '#dcfce7',
          'moderate-bg': '#fef9c3',
          'high-bg': '#ffedd5',
          'very-high-bg': '#fee2e2',
        },
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Lora', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
