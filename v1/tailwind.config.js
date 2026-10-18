/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#030407",
        surface: "#0A0D14",
        "surface-light": "#121622",
        primary: "#FFFFFF",
        secondary: "#8F96A3",
        accent: "#00F5D4",
        "accent-dark": "#00A38D",
        gold: "#F5C84B",
        ember: "#FF6A2B",
      },
      height: {
        screen: ['100vh', '100svh'],
      },
      minHeight: {
        screen: ['100vh', '100svh'],
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
        'fade-in': 'fade-in 0.4s ease-out both',
        'float': 'float 7s ease-in-out infinite',
        'page-in': 'page-in 0.5s ease-out backwards',
        'gold-pulse': 'gold-pulse 3.2s ease-in-out infinite',
        'gold-sweep': 'gold-sweep 3.6s ease-in-out infinite',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'page-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'gold-pulse': {
          '0%, 100%': { boxShadow: '0 0 22px rgba(245,200,75,0.28)' },
          '50%': { boxShadow: '0 0 44px rgba(245,200,75,0.55)' },
        },
        'gold-sweep': {
          '0%': { transform: 'translateX(-120%)' },
          '60%, 100%': { transform: 'translateX(120%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}
