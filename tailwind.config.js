/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#2f3033',
        primary: '#d62d6c',
        secondary: '#5f2b8d',
      },
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        'safe-top': 'var(--safe-area-top)',
        'safe-bottom': 'var(--safe-area-bottom)',
      },
      minHeight: {
        'touch': '44px',
      },
      maxWidth: {
        'readable': '65ch',
      },
      fontSize: {
        'xs-mobile': ['0.75rem', '1rem'],
        'sm-mobile': ['0.875rem', '1.25rem'],
      },
      width: {
        'screen': '100vw',
      },
      maxWidth: {
        'screen': '100vw',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.tap-highlight-transparent': {
          '-webkit-tap-highlight-color': 'transparent',
        },
        '.touch-callout-none': {
          '-webkit-touch-callout': 'none',
        },
        '.safe-paddings': {
          'padding-left': 'env(safe-area-inset-left)',
          'padding-right': 'env(safe-area-inset-right)',
        },
      };
      addUtilities(newUtilities);
    },
  ],
};