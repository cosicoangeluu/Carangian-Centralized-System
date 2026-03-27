/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          yellow: '#fbbf00',
          blue: '#00a8cc',
          orange: '#ff6b00',
        },
        bg: {
          primary: '#f8fafc',
          secondary: '#ffffff',
          tertiary: '#f1f5f9',
        },
        border: {
          light: '#e2e8f0',
          medium: '#cbd5e1',
        },
        text: {
          primary: '#1e293b',
          secondary: '#475569',
          muted: '#94a3b8',
        }
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 6px rgba(0, 0, 0, 0.07)',
        'large': '0 10px 25px rgba(0, 0, 0, 0.1)',
        'neon-blue': '0 4px 15px rgba(0, 168, 204, 0.25)',
        'neon-yellow': '0 4px 15px rgba(251, 191, 0, 0.25)',
        'neon-orange': '0 4px 15px rgba(255, 107, 0, 0.25)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'accent-gradient': 'linear-gradient(135deg, #fbbf00 0%, #ff6b00 50%, #00a8cc 100%)',
        'blue-orange': 'linear-gradient(135deg, #00a8cc 0%, #ff6b00 100%)',
      },
    },
  },
  plugins: [],
}
