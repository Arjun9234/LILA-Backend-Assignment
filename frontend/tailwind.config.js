/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#6366f1",
        secondary: "#8b5cf6",
        success: "#10b981",
        danger: "#ef4444",
        warning: "#f59e0b",
        dark: {
          900: "#0a0a0f",
          800: "#12121a",
          700: "#1a1a25",
          600: "#252532",
          500: "#32324a",
        },
        neon: {
          blue: "#00d4ff",
          purple: "#a855f7",
          pink: "#ec4899",
          green: "#22c55e",
          red: "#ef4444",
          yellow: "#eab308",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2s ease-in-out infinite alternate",
        float: "float 3s ease-in-out infinite",
        "slide-up": "slideUp 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "spin-slow": "spin 3s linear infinite",
        "bounce-subtle": "bounceSubtle 2s infinite",
      },
      keyframes: {
        glow: {
          "0%": {
            boxShadow:
              "0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor",
          },
          "100%": {
            boxShadow:
              "0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        bounceSubtle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
      boxShadow: {
        "neon-blue": "0 0 10px #00d4ff, 0 0 20px #00d4ff, 0 0 30px #00d4ff",
        "neon-purple": "0 0 10px #a855f7, 0 0 20px #a855f7, 0 0 30px #a855f7",
        "neon-pink": "0 0 10px #ec4899, 0 0 20px #ec4899, 0 0 30px #ec4899",
        "neon-green": "0 0 10px #22c55e, 0 0 20px #22c55e, 0 0 30px #22c55e",
        "neon-red": "0 0 10px #ef4444, 0 0 20px #ef4444, 0 0 30px #ef4444",
        game: "0 0 40px rgba(139, 92, 246, 0.3)",
      },
    },
  },
  plugins: [],
};
