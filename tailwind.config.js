/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1', // Indigo moderno
        secondary: '#8b5cf6', // Purple vibrante
        accent: '#ec4899', // Pink neon
        dark: '#0f172a', // Slate escuro
        'vape-blue': '#3b82f6',
        'vape-purple': '#a855f7',
        'vape-pink': '#ec4899',
        'vape-cyan': '#06b6d4',
      },
      backgroundImage: {
        'gradient-vape': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-neon': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      }
    },
  },
  plugins: [],
}
