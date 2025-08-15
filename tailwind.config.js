/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        spotify: {
          green: '#1db954',
          black: '#191414',
          'dark-gray': '#121212',
          gray: '#535353',
          'light-gray': '#b3b3b3',
          white: '#ffffff',
        },
        bingo: {
          gold: '#ffd700',
          red: '#ff4757',
          blue: '#3742fa',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'spotify-gradient': 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)',
        'dark-gradient': 'linear-gradient(135deg, #121212 0%, #191414 100%)',
      },
      animation: {
        'pulse-green': 'pulse-green 2s infinite',
        'bounce-in': 'bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      keyframes: {
        'pulse-green': {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(29, 185, 84, 0.7)',
          },
          '50%': {
            boxShadow: '0 0 0 10px rgba(29, 185, 84, 0)',
          },
        },
        'bounce-in': {
          '0%': {
            transform: 'scale(0.3)',
            opacity: '0',
          },
          '50%': {
            transform: 'scale(1.05)',
          },
          '70%': {
            transform: 'scale(0.9)',
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1',
          },
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}