/**
 * Design Tokens - TypeScript constants exported from tailwind.config.ts
 * Menyediakan akses programmatic ke design tokens dan CSS variable helpers
 */

// Colors - dari tailwind.config.ts
export const colors = {
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
} as const;

// Spacing - dari tailwind.config.ts
export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
} as const;

// Border Radius - dari tailwind.config.ts
export const borderRadius = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '14px',
  pill: '999px',
} as const;

// CSS Variable Helpers
/**
 * Menghasilkan CSS variable dengan format HSL
 * Contoh: cssVar('primary') => 'hsl(var(--primary))'
 */
export const cssVar = (name: string): string => {
  return `hsl(var(--${name}))`;
};

/**
 * Menghasilkan CSS variable dengan opacity
 * Contoh: cssVarWithOpacity('primary', 0.5) => 'hsl(var(--primary) / 0.5)'
 */
export const cssVarWithOpacity = (name: string, opacity: number): string => {
  return `hsl(var(--${name}) / ${opacity})`;
};

// Touch Target Constants
export const touchTarget = {
  minHeight: '44px',
  minWidth: '44px',
} as const;

// Typography Scale (dapat ditambahkan sesuai kebutuhan)
export const typography = {
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const;

// Z-index layering
export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;
