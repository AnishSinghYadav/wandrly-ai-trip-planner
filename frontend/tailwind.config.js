/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      fontFamily: {
        serif:   ['Cormorant Garamond', 'Georgia', 'serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        gold: {
          50:  '#fdf9ee',
          100: '#f8efc9',
          200: '#f0d98a',
          300: '#e8c55a',
          400: '#d4a843',
          500: '#c09030',
          600: '#a87520',
          700: '#8a5c14',
          800: '#6e460e',
          900: '#4e3008',
        },
        void: {
          950: '#01020a',
          900: '#03050f',
          800: '#05081a',
          700: '#080c22',
          600: '#0c1030',
          500: '#121640',
        },
        rose: {
          luxury: '#c45070',
          soft:   '#e8849a',
        },
      },
      animation: {
        'blob-drift-1':  'blob-drift-1 18s ease-in-out infinite',
        'blob-drift-2':  'blob-drift-2 24s ease-in-out infinite',
        'blob-drift-3':  'blob-drift-3 20s ease-in-out infinite',
        'blob-drift-4':  'blob-drift-4 28s ease-in-out infinite',
        'aurora':        'aurora 12s ease-in-out infinite',
        'gold-shimmer':  'gold-shimmer 3s linear infinite',
        'float-luxury':  'float-luxury 8s ease-in-out infinite',
        'breathe':       'breathe 5s ease-in-out infinite',
        'reveal-up':     'reveal-up 0.8s cubic-bezier(0.16,1,0.3,1) forwards',
        'reveal-fade':   'reveal-fade 1s ease forwards',
        'border-glow':   'border-glow 3s ease-in-out infinite',
        'grain':         'grain 0.8s steps(1) infinite',
        'cursor-glow':   'cursor-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'blob-drift-1': {
          '0%,100%': { transform: 'translate(0,0) scale(1)',    opacity: '0.55' },
          '33%':      { transform: 'translate(80px,-60px) scale(1.2)', opacity: '0.7' },
          '66%':      { transform: 'translate(-50px,70px) scale(0.88)', opacity: '0.45' },
        },
        'blob-drift-2': {
          '0%,100%': { transform: 'translate(0,0) scale(1)',    opacity: '0.45' },
          '40%':      { transform: 'translate(-110px,50px) scale(1.15)', opacity: '0.65' },
          '70%':      { transform: 'translate(70px,-90px) scale(0.9)', opacity: '0.35' },
        },
        'blob-drift-3': {
          '0%,100%': { transform: 'translate(0,0) scale(1)',    opacity: '0.5' },
          '50%':      { transform: 'translate(60px,80px) scale(1.25)', opacity: '0.7' },
        },
        'blob-drift-4': {
          '0%,100%': { transform: 'translate(0,0) scale(1)',    opacity: '0.4' },
          '35%':      { transform: 'translate(-80px,-60px) scale(1.1)', opacity: '0.6' },
          '70%':      { transform: 'translate(90px,40px) scale(0.85)', opacity: '0.3' },
        },
        'aurora': {
          '0%,100%': { backgroundPosition: '0% 50%',   opacity: '0.6' },
          '50%':      { backgroundPosition: '100% 50%', opacity: '0.9' },
        },
        'gold-shimmer': {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'float-luxury': {
          '0%,100%': { transform: 'translateY(0px) rotate(0deg)' },
          '25%':     { transform: 'translateY(-12px) rotate(-1.5deg)' },
          '75%':     { transform: 'translateY(-6px) rotate(1.5deg)' },
        },
        'breathe': {
          '0%,100%': { transform: 'scale(1)',    opacity: '0.7' },
          '50%':     { transform: 'scale(1.06)', opacity: '1' },
        },
        'reveal-up': {
          '0%':   { opacity: '0', transform: 'translateY(40px) skewY(2deg)' },
          '100%': { opacity: '1', transform: 'translateY(0) skewY(0)' },
        },
        'reveal-fade': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'border-glow': {
          '0%,100%': { boxShadow: '0 0 0 1px rgba(196,154,73,0.15), 0 0 20px rgba(196,154,73,0.05)' },
          '50%':     { boxShadow: '0 0 0 1px rgba(196,154,73,0.45), 0 0 40px rgba(196,154,73,0.15)' },
        },
        'grain': {
          '0%,100%': { transform: 'translate(0,0)' },
          '10%': { transform: 'translate(-2%,-3%)' },
          '20%': { transform: 'translate(3%,2%)' },
          '30%': { transform: 'translate(-1%,4%)' },
          '40%': { transform: 'translate(4%,-1%)' },
          '50%': { transform: 'translate(-3%,3%)' },
          '60%': { transform: 'translate(2%,-4%)' },
          '70%': { transform: 'translate(-4%,1%)' },
          '80%': { transform: 'translate(1%,-2%)' },
          '90%': { transform: 'translate(3%,3%)' },
        },
      },
    },
  },
  plugins: [],
}
