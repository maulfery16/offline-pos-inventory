import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design system colors based on DPAI tokens
        primary: {
          DEFAULT: '#0f6d5f',
          hover: '#0b564a',
          soft: '#e2f2ee',
        },
        accent: {
          DEFAULT: '#12507f',
          soft: '#e4eefa',
        },
        success: {
          DEFAULT: '#136b3f',
          soft: '#e3f4e9',
        },
        warning: {
          DEFAULT: '#8a5300',
          soft: '#fdf0da',
        },
        danger: {
          DEFAULT: '#a52b22',
          soft: '#fbe8e5',
        },
        info: {
          soft: '#e8eef7',
        },
        gray: {
          50: '#f7f8fa',
          100: '#f2f4f7',
          200: '#e2e6ec',
          300: '#cbd2dc',
          400: '#8a94a3',
          500: '#5a6675',
          600: '#5a6675',
          700: '#182230',
          800: '#101828',
          900: '#182230',
        },
        // Shadcn compatible colors using CSS variables
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '14px',
        pill: '999px',
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
