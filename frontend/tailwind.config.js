/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "24px",
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      colors: {
        theme: {
          bg: "var(--color-theme-bg)",
          fg: "var(--color-theme-fg)",
          'fg-01': "var(--color-theme-fg-01)",
          'fg-02': "var(--color-theme-fg-02)",
          'fg-02-5': "var(--color-theme-fg-02-5)",
          'fg-05': "var(--color-theme-fg-05)",
          'fg-07-5': "var(--color-theme-fg-07-5)",
          'fg-10': "var(--color-theme-fg-10)",
          'fg-15': "var(--color-theme-fg-15)",
          'fg-20': "var(--color-theme-fg-20)",
          card: "var(--color-theme-card-hex)",
          'card-hover': "var(--color-theme-card-hover-hex)",
          'card-hover-light': "var(--color-theme-card-hover-light-hex)",
          accent: "var(--color-theme-accent)",
          text: "var(--color-theme-text)",
          'text-mid': "var(--color-theme-text-mid)",
          'text-sec': "var(--color-theme-text-sec)",
          'text-tertiary': "var(--color-theme-text-tertiary)",
          border: "var(--color-theme-border)",
          'border-01': "var(--color-theme-border-01)",
          'border-01-5': "var(--color-theme-border-01-5)",
          'border-02': "var(--color-theme-border-02)",
          'border-02-5': "var(--color-theme-border-02-5)",
          'border-03': "var(--color-theme-border-03)",
        },
        success: "#00c758",
        warning: "#f59e0b",
        error: "#fb2c36",

        border: "var(--color-theme-border)",
        input: "var(--color-theme-border-02)",
        ring: "var(--color-theme-border-03)",
        background: "var(--color-theme-bg)",
        foreground: "var(--color-theme-fg)",
        primary: {
          DEFAULT: "var(--color-theme-fg)",
          foreground: "var(--color-theme-bg)",
        },
        secondary: {
          DEFAULT: "var(--color-theme-fg-05)",
          foreground: "var(--color-theme-fg)",
        },
        destructive: {
          DEFAULT: "var(--color-red-500)",
          foreground: "var(--color-white)",
        },
        muted: {
          DEFAULT: "var(--color-theme-fg-05)",
          foreground: "var(--color-theme-text-sec)",
        },
        accent: {
          DEFAULT: "var(--color-theme-fg-05)",
          foreground: "var(--color-theme-fg)",
          primary: "#155dfc",
          secondary: "#c07eff",
        },
        popover: {
          DEFAULT: "var(--color-theme-card-hex)",
          foreground: "var(--color-theme-text)",
        },
        card: {
          DEFAULT: "var(--color-theme-card-hex)",
          foreground: "var(--color-theme-text)",
        },
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
      boxShadow: {
        'soft': 'var(--shadow-flyout)',
        'glow': '0 0 40px rgba(245, 78, 0, 0.2)', /* Theme accent glow */
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        heading: ["var(--font-sans)"],
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
      },
      animation: {
        'gradient-x': 'gradient-x 3s ease infinite',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

// Made with Bob
