/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0B',
        surface: '#141416',
        surface2: '#1C1C20',
        line: '#2A2A30',
        fog: '#8A8A82',
        cream: '#F4F4F0',
        yt: { DEFAULT: '#FF0033', deep: '#CC0029' },
        ig: { blue: '#515BD4', purple: '#8134AF', pink: '#DD2A7B', gold: '#FEDA77' },
      },
      fontFamily: {
        display: ['var(--font-syne)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['var(--font-hanken)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-yt': '0 0 0 1px rgba(255,0,51,.25), 0 18px 50px -12px rgba(255,0,51,.45)',
        'glow-ig': '0 0 0 1px rgba(221,42,123,.25), 0 18px 50px -12px rgba(129,52,175,.5)',
        panel: '0 30px 80px -30px rgba(0,0,0,.85)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        spinSlow: { to: { transform: 'rotate(360deg)' } },
        pulseRing: {
          '0%': { transform: 'scale(.75)', opacity: '.7' },
          '100%': { transform: 'scale(1.7)', opacity: '0' },
        },
        bob: {
          '0%,100%': { transform: 'translateY(0)', opacity: '.4' },
          '50%': { transform: 'translateY(-5px)', opacity: '1' },
        },
      },
      animation: {
        fadeUp: 'fadeUp .7s cubic-bezier(.2,.7,.2,1) both',
        floaty: 'floaty 6s ease-in-out infinite',
        shimmer: 'shimmer 2.2s linear infinite',
        'spin-slow': 'spinSlow 3s linear infinite',
        'pulse-ring': 'pulseRing 1.8s ease-out infinite',
        bob: 'bob 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
