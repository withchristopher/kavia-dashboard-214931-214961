import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef6ff',
          100: '#d9ecff',
          200: '#b8dcff',
          300: '#89c6ff',
          400: '#57a9ff',
          500: '#2f8aff',
          600: '#176bff',
          700: '#0e56f0',
          800: '#0e46c5',
          900: '#123c9b',
          950: '#0c275f'
        }
      }
    }
  },
  plugins: []
};

export default config;
