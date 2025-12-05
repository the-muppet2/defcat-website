/** biome-ignore-all lint/complexity/useArrowFunction: <explanation> */
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.tsx',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // =============================================
      // All values reference CSS variables from globals.css
      // Edit values there, not here
      // =============================================
      backgroundColor: {
        tinted: 'var(--bg-tinted)',
        'card-tinted': 'var(--card-tinted-bg)',
        'accent-tinted': 'var(--accent-tinted)',
        'mana-subtle': 'var(--mana-tint-subtle)',
        'mana-light': 'var(--mana-tint-light)',
        'mana-medium': 'var(--mana-tint-medium)',
        'mana-strong': 'var(--mana-tint-strong)',
        'mana-intense': 'var(--mana-tint-intense)',
      },
      borderColor: {
        tinted: 'var(--border-tinted)',
        'tinted-subtle': 'var(--border-tinted-subtle)',
        'tinted-strong': 'var(--border-tinted-strong)',
      },
      textColor: {
        tinted: 'var(--text-tinted)',
        'tinted-dim': 'var(--text-tinted-dim)',
      },
      boxShadow: {
        tinted: 'var(--shadow-tinted)',
        'tinted-sm': 'var(--shadow-tinted-sm)',
        'tinted-md': 'var(--shadow-tinted-md)',
        'tinted-lg': 'var(--shadow-tinted-lg)',
        'tinted-xl': 'var(--shadow-tinted-xl)',
        'glow-sm': 'var(--glow-sm)',
        glow: 'var(--glow)',
        'glow-lg': 'var(--glow-lg)',
      },
      backgroundImage: {
        'gradient-tinted': 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
        'gradient-tinted-radial': 'radial-gradient(circle at center, var(--mana-tint-medium), transparent 70%)',
        'gradient-tinted-subtle': 'linear-gradient(135deg, var(--mana-tint-subtle), transparent)',
      },
      keyframes: {
        meteor: {
          '0%': { transform: 'rotate(var(--angle)) translateX(0)', opacity: '1' },
          '70%': { opacity: '1' },
          '100%': { transform: 'rotate(var(--angle)) translateX(-500px)', opacity: '0' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%) translateY(-100%)' },
          '100%': { transform: 'translateX(100%) translateY(100%)' },
        },
        'pulse-tinted': {
          '0%, 100%': { boxShadow: '0 0 0 0 var(--mana-tint-strong)' },
          '50%': { boxShadow: '0 0 0 12px transparent' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: 'var(--glow-sm)' },
          '50%': { boxShadow: 'var(--glow)' },
        },
      },
      animation: {
        shimmer: 'shimmer 3s infinite',
        'pulse-tinted': 'pulse-tinted 2s infinite',
        float: 'float 4s ease-in-out infinite',
        glow: 'glow 2s ease-in-out infinite',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        mana: 'var(--mana-color)',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
      },
      ringColor: {
        mana: 'var(--mana-color)',
        tinted: 'var(--focus-ring)',
      },
      ringOffsetColor: {
        mana: 'var(--mana-color)',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '120': '30rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
    function ({ addUtilities }: any) {
      const newUtilities = {
        // =============================================
        // GLASS EFFECTS
        // =============================================
        '.glass-tinted': {
          background: 'linear-gradient(135deg, var(--mana-tint-subtle), var(--mana-tint-subtle))',
          backdropFilter: 'blur(var(--glass-blur)) saturate(1.2)',
          WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(1.2)',
          border: '1px solid var(--border-tinted)',
          boxShadow: 'var(--shadow-tinted)',
        },
        '.glass-tinted-subtle': {
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid var(--border-tinted-subtle)',
        },
        '.glass-tinted-strong': {
          background: 'linear-gradient(135deg, var(--mana-tint-light), var(--mana-tint-subtle))',
          backdropFilter: 'blur(20px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
          border: '1px solid var(--border-tinted-strong)',
          boxShadow: 'var(--shadow-tinted-lg)',
        },
        '.glass-light': {
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(var(--glass-blur)) saturate(1.2)',
          WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(1.2)',
          border: '1px solid var(--border-tinted)',
          boxShadow: 'var(--shadow-tinted)',
        },

        // =============================================
        // WHITE MANA CONTRAST FIX
        // =============================================
        '[data-mana="white"] .btn-tinted-primary': {
          color: '#1a1a1a !important',
        },
        '[data-mana="white"] .badge-tinted-primary': {
          color: '#1a1a1a !important',
        },
      }
      addUtilities(newUtilities)
    },
  ],
}

export default config