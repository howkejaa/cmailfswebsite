/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ledger: {
          canvas: '#F3F5F8',
          surface: '#FFFFFF',
          subtle: '#F8FAFC',
          border: '#DCE2EC'
        },
        ink: {
          primary: '#0B1220',
          secondary: '#475569',
          muted: '#64748B'
        },
        cobalt: {
          DEFAULT: '#1D4ED8',
          hover: '#1E40AF',
          soft: '#EFF6FF'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    }
  },
  plugins: []
};
