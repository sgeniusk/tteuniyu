import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    screens: {
      sm: '360px',
      md: '768px',
      lg: '1024px',
      xl: '1440px',
      '2xl': '1920px',
    },
    extend: {
      colors: {
        // Neutral (dark mode default per PRD v1.6 §12.1)
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          400: '#94A3B8',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#0A0E1A',
        },
        // Coverage Distribution (v1.6 brand-critical, same in both modes)
        coverage: {
          progressive: '#14B8A6', // teal-500
          mixed: '#94A3B8', // slate-400
          conservative: '#D97706', // amber-600
          foreign: '#8B5CF6', // violet-500
        },
        // State
        emerald: { 500: '#10B981' },
        amber: { 500: '#F59E0B', 600: '#D97706' },
        rose: { 500: '#F43F5E' },
        sky: { 500: '#0EA5E9' },
        teal: { 500: '#14B8A6' },
        violet: { 500: '#8B5CF6' },
      },
      fontFamily: {
        pretendard: ['Pretendard Variable', 'system-ui', 'sans-serif'],
        inter: ['Inter Variable', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        'display-xl': ['56px', { lineHeight: '1.2', fontWeight: '700' }],
        'display-lg': ['40px', { lineHeight: '1.2', fontWeight: '700' }],
        'display-md': ['32px', { lineHeight: '1.25', fontWeight: '700' }],
        'heading-lg': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'heading-md': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '1.4', fontWeight: '400' }],
        'mono-md': ['14px', { lineHeight: '1.4', fontWeight: '400' }],
        'mono-lg': ['18px', { lineHeight: '1.3', fontWeight: '700' }],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.3)',
        md: '0 4px 6px rgba(0,0,0,0.4)',
        lg: '0 10px 15px rgba(0,0,0,0.5)',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '400ms',
        deliberate: '600ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
        decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
        accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
      },
    },
  },
  plugins: [],
}

export default config
