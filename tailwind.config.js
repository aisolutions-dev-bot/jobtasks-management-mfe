/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        cream:    '#F4EFE3',
        parchment:'#FFFDF8',
        ink:      '#1A1A1A',
        muted:    '#7A6E54',
        rule:     '#E0D8C5',
        ruleSoft: '#EFE7D5',
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans:  ['"Geist"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
