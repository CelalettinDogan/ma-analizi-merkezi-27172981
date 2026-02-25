import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'micro': ['0.6875rem', { lineHeight: '1rem' }],    // 11px - smallest allowed
        'xs':    ['0.8125rem', { lineHeight: '1.125rem' }], // 13px
        'sm':    ['0.9375rem', { lineHeight: '1.375rem' }], // 15px
        'base':  ['1.0625rem', { lineHeight: '1.5rem' }],   // 17px
        'lg':    ['1.25rem',   { lineHeight: '1.75rem' }],   // 20px
        'xl':    ['1.5rem',    { lineHeight: '2rem' }],      // 24px
        '2xl':   ['1.75rem',   { lineHeight: '2.25rem' }],   // 28px
        '3xl':   ['2rem',      { lineHeight: '2.5rem' }],    // 32px
      },
      spacing: {
        '4.5': '1.125rem',  // 18px
        '13': '3.25rem',    // 52px
        '15': '3.75rem',    // 60px
        '18': '4.5rem',     // 72px
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        win: "hsl(var(--win))",
        loss: "hsl(var(--loss))",
        draw: "hsl(var(--draw))",
        confidence: {
          high: "hsl(var(--confidence-high))",
          medium: "hsl(var(--confidence-medium))",
          low: "hsl(var(--confidence-low))",
        },
      },
      borderRadius: {
        '2xl': '1rem',    // 16px - cards, modals
        'xl': '0.75rem',  // 12px - buttons, inputs (native standard)
        'lg': '0.5rem',   // 8px - badges, small elements
        'md': '0.375rem', // 6px
        'sm': '0.25rem',  // 4px
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 hsl(0 0% 0% / 0.06)',
        'card': '0 2px 8px -2px hsl(0 0% 0% / 0.08)',
        'elevated': '0 4px 16px -4px hsl(0 0% 0% / 0.12)',
        'glow': '0 0 24px -4px hsl(var(--primary) / 0.15)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "slide-in": "slide-in 0.5s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
