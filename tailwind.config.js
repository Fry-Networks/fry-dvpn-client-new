/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      animation: {
        spinDelay150: 'spin 1s linear infinite 150ms',
        spinDelay75: 'spin 1s linear infinite 75ms',
        spinDelay500: 'spin 1s linear infinite 500ms'
      },
      colors: {
        primary: '#F5F6F7',
        secondary: '#FF0000',
        'theme-color': '#5D0F28'
      },
      backgroundImage: {
        layout: "url('/src/assets/layout.svg')",
        separator:
          'linear-gradient(90deg, rgba(255, 0, 0, 0.00) 0%, #F00 50%, rgba(255, 0, 0, 0.00) 100%)',
        separatorV:
          'linear-gradient(180deg, rgba(255, 0, 0, 0.00) 0%, #F00 50%, rgba(255, 0, 0, 0.00) 100%)'
      },
      fontFamily: {
        'open-sans': ['Open Sans', 'sans-serif'],
        'futosans-bold': ['FutoSans-Bold', 'sans-serif']
      },
      boxShadow: {
        fields: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)',
        tabs: '0px 2px 14.5px 0px rgba(0, 0, 0, 0.15)',
        cards: '0px 4px 26px rgba(0, 0, 0, 0.08)',
        plan: '0px 42px 34px 0px rgba(255, 0, 0, 0.17)',
        "card-shadow": "4px 4px 12px 0px rgba(2, 64, 47, 0.15)",
      }
    }
  },
  plugins: []
}
