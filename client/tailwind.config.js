/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        risk: {
          high: "#DC2626",    // crimson/red
          medium: "#D97706",  // amber/orange
          low: "#0D9488",     // teal/emerald
          unknown: "#6B7280", // gray
        },
        // Used by landing page & CardSwap — neutral slate tones
        surface: {
          DEFAULT: "#0f172a", // slate-900
          card:    "#1e293b", // slate-800
          border:  "#334155", // slate-700
        },
        accent: {
          teal:      "#0d9488",
          tealLight: "#99f6e4",
        },
      },
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease both",
      },
    },
  },
  plugins: [],
};
