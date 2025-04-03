/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'container-blue': '#b8d8f8',
        'network-green': '#c4f0c4',
        'host-yellow': '#ffefc0',
      },
    },
  },
  plugins: [],
}