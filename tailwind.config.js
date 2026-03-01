/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F0EFF2',
        surface: 'rgba(255,255,255,0.6)',
        'surface-light': '#E4E1E8',
        'surface-elevated': 'rgba(255,255,255,0.9)',
        accent: '#7B6FA8',
        'accent-deep': '#5A4D8A',
        positive: '#2A9D8F',
        negative: '#E76F51',
        neutral: '#8B7565',
        'text-primary': '#2D2416',
        'text-secondary': '#6B5A4A',
        'text-muted': '#8B7565',
        'text-subtle': '#5C4A3D',
      },
      fontFamily: {
        display: ['var(--font-outfit)', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
