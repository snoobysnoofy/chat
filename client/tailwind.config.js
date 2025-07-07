/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        messenger: {
          blue: '#667eea',
          'blue-dark': '#5a67d8',
          purple: '#764ba2',
          gray: '#2d3748',
          'gray-light': '#4a5568',
          'gray-dark': '#1a202c',
        },
        dark: {
          50: '#f7fafc',
          100: '#edf2f7',
          200: '#e2e8f0',
          300: '#cbd5e0',
          400: '#a0aec0',
          500: '#718096',
          600: '#4a5568',
          700: '#2d3748',
          800: '#1a202c',
          900: '#171923',
        }
      },
      maxHeight: {
        'chat': 'calc(100vh - 8rem)',
      },
      backgroundImage: {
        'gradient-main': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-message': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-chat': 'linear-gradient(180deg, #1a202c 0%, #2d3748 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'message': '0 4px 20px 0 rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}
