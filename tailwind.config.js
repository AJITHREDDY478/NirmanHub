/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        brand: {
          navy:    '#0B1F35',
          dark:    '#0F2740',
          medium:  '#183A5A',
          light:   '#1D4267',
          cyan:    '#29C4FF',
          'cyan-light': '#67E1FF',
          blue:    '#0A78D1',
          steel:   '#C7D8EA',
        }
      },
      animation: {
        'slide-down': 'slideDown 0.6s ease-out forwards',
        'fade-up': 'fadeUp 0.8s ease-out forwards',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.5s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'badge-pulse': 'badge-pulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'scan-line': 'scanLine 3s ease-in-out infinite',
      },
      keyframes: {
        slideDown: {
          from: { transform: 'translateY(-100%)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' }
        },
        fadeUp: {
          from: { transform: 'translateY(30px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' }
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        scaleIn: {
          from: { transform: 'scale(0.9)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' }
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(41, 196, 255, 0.3)' },
          '50%':       { boxShadow: '0 0 40px rgba(41, 196, 255, 0.65)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        'badge-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        scanLine: {
          '0%, 100%': { opacity: '0', transform: 'translateY(-100%)' },
          '50%': { opacity: '0.15', transform: 'translateY(100%)' }
        }
      }
    },
  },
  plugins: [],
}
