/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        batchit: {
          bg: '#09090F',
          secondary: '#11111B',
          card: '#171724',
          cardHover: '#1E1E2F',
          border: '#272738',
          borderLight: '#383852',
          purple: '#8B5CF6',
          purpleLight: '#A78BFA',
          purpleDark: '#7C3AED',
          blue: '#6366F1',
          pink: '#EC4899',
          textPrimary: '#FFFFFF',
          textSecondary: '#A1A1AA',
          textMuted: '#71717A'
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ]
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      }
    }
  },
  plugins: []
};
