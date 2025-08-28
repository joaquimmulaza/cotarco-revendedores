/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#f22f1d',
        secondary: '#737272',
        black: '#000000',
        white: '#333',
      },
    },
  },
  plugins: [],
}
