/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fffbe6',
          100: '#fff3b3',
          500: '#e6a100', // Amarillo/Naranja frutal
          600: '#cc8800',
          green: '#10b981', // Verde fresco
          dark: '#1e293b'
        }
      }
    },
  },
  plugins: [],
};
