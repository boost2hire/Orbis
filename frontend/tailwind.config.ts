import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },

    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "sans-serif",
        ],
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

        // Mirror theme colors
        mirror: {
          glow: "hsl(var(--mirror-glow))",
          glass: "hsl(var(--mirror-glass))",
          reflection: "hsl(var(--mirror-reflection))",
          subtle: "hsl(var(--mirror-subtle))",
        },
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },

      // --------------------------
      // ⭐ Mic + UI animations
      // --------------------------
      keyframes: {
        // Accordion
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },

        // ⭐ Mic popup animation (Google Assistant style)
        "mic-pop": {
          "0%": {
            transform: "translateY(20px) scale(0.6)",
            opacity: "0",
          },
          "60%": {
            transform: "translateY(-3px) scale(1.18)",
            opacity: "1",
          },
          "100%": {
            transform: "translateY(0) scale(1)",
            opacity: "1",
          },
        },

        // ⭐ Mic glow pulse (soft breathing glow)
        "mic-pulse-glow": {
          "0%": {
            boxShadow: "0 0 0 0 rgba(59,130,246,0.45)",
          },
          "100%": {
            boxShadow: "0 0 22px 12px rgba(59,130,246,0)",
          },
        },
      },

      animation: {
        // Accordion animations
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",

        // ⭐ Mic animations
        "mic-pop": "mic-pop 0.38s ease-out",
        "mic-pulse-glow": "mic-pulse-glow 1.8s ease-in-out infinite",
      },
    },
  },

  plugins: [animate],
};

export default config;
