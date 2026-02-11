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
        bg: '#0B1120',
        surface: '#131B2E',
        accent: '#F5B74D',
        positive: '#34D399',
        negative: '#F87171',
        textPrimary: '#F1F5F9',
        textSecondary: '#94A3B8',
      },
    },
  },
  plugins: [],
}