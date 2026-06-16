/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#07080C',
        panel: '#0D0D14',
        surface: '#12121E',
        elevated: '#18182A',
        accent: {
          DEFAULT: '#7C3AED',
          bright: '#A78BFA',
        },
        txt: {
          primary: '#F1F0FF',
          secondary: '#A0A0B8',
          muted: '#505068',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderColor: {
        subtle: 'rgba(255,255,255,0.05)',
        DEFAULT: 'rgba(255,255,255,0.08)',
        strong: 'rgba(255,255,255,0.12)',
      },
    },
  },
  plugins: [],
}
