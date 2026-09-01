/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Clinical severity — DO NOT rebrand to pink ────────────────────
        risk: {
          high:    "#DC2626",  // crimson/red
          medium:  "#D97706",  // amber/orange
          low:     "#0D9488",  // teal/emerald  ← this is Low tier, not accent
          unknown: "#6B7280",  // gray
        },

        // ── Hospital brand — #f7a3b4 palette ─────────────────────────────
        // brand.DEFAULT : #f7a3b4  — fills, borders, large elements
        // brand.dark    : #9d1c47  — text/icons on light bg (≥4.5:1 on white)
        // brand.mid     : #d4607e  — medium emphasis (icons on white ≥3:1)
        // brand.light   : #fde8ed  — hover fills, subtle tints
        // brand.muted   : #fdf0f3  — very pale wash
        brand: {
          DEFAULT: "#f7a3b4",
          dark:    "#9d1c47",
          mid:     "#d4607e",
          light:   "#fde8ed",
          muted:   "#fdf0f3",
        },

        // ── Landing page surface tones (unchanged) ─────────────────────
        surface: {
          DEFAULT: "#0f172a",
          card:    "#1e293b",
          border:  "#334155",
        },

        // accent.teal kept only for risk.low context; removed generic use
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
        // Hospital loader keyframes
        speeder: {
          "0%":   { transform: "translate(2px,1px) rotate(0deg)" },
          "10%":  { transform: "translate(-1px,-3px) rotate(-1deg)" },
          "20%":  { transform: "translate(-2px,0px) rotate(1deg)" },
          "30%":  { transform: "translate(1px,2px) rotate(0deg)" },
          "40%":  { transform: "translate(1px,-1px) rotate(1deg)" },
          "50%":  { transform: "translate(-1px,3px) rotate(-1deg)" },
          "60%":  { transform: "translate(-1px,1px) rotate(0deg)" },
          "70%":  { transform: "translate(3px,1px) rotate(-1deg)" },
          "80%":  { transform: "translate(-2px,-1px) rotate(1deg)" },
          "90%":  { transform: "translate(2px,1px) rotate(0deg)" },
          "100%": { transform: "translate(1px,-1px) rotate(-1deg)" },
        },
        fazer1: {
          "0%":   { left: "0" },
          "100%": { left: "100%" },
        },
        fazer2: {
          "0%":   { left: "0" },
          "100%": { left: "100%", opacity: "0" },
        },
        fazer3: {
          "0%":   { left: "0" },
          "100%": { left: "100%", opacity: "0" },
        },
        fazer4: {
          "0%":   { left: "0", opacity: "0" },
          "50%":  { opacity: "1" },
          "100%": { left: "100%", opacity: "0" },
        },
        lf: {
          "0%":   { left: "-200%" },
          "100%": { left: "200%", opacity: "0" },
        },
        // Progress bar pulse for loader
        "loader-bar": {
          "0%":   { width: "0%", opacity: "1" },
          "70%":  { width: "85%", opacity: "1" },
          "100%": { width: "95%", opacity: "0.6" },
        },
        // Parallax star layers
        "orbit-slow": {
          "0%":   { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-up":    "fade-up 0.6s ease both",
        speeder:      "speeder 0.4s linear infinite",
        fazer1:       "fazer1 0.9s linear infinite",
        fazer2:       "fazer2 0.9s linear 0.3s infinite",
        fazer3:       "fazer3 0.9s linear 0.6s infinite",
        fazer4:       "fazer4 0.9s linear 0s infinite",
        lf1:          "lf 0.6s linear infinite",
        lf2:          "lf 0.6s linear 0.4s infinite",
        lf3:          "lf 0.6s linear 0.8s infinite",
        "loader-bar": "loader-bar 3s ease-in-out infinite",
        "orbit-slow": "orbit-slow linear infinite",
      },
    },
  },
  plugins: [],
};
