const defaultTheme = require("tailwindcss/defaultTheme");

const cream = {
  50: "#fffaf2",
  100: "#fff7ec",
  200: "#f7e6d6",
  300: "#e8cfbd"
};

const rose = {
  50: "#fff0f2",
  100: "#fde2e7",
  300: "#e99bab",
  500: "#c95469",
  700: "#913044",
  900: "#4d1726"
};

const royal = {
  purple: "#513062",
  maroon: "#6f1f32",
  gold: "#b98a5a",
  sage: "#768a68",
  ink: "#27141b"
};

module.exports = {
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        cream,
        rose,
        royal
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans]
      },
      boxShadow: {
        aura: "0 24px 80px rgba(79, 35, 43, 0.18)",
        glass: "0 18px 48px rgba(79, 35, 43, 0.12)"
      },
      borderRadius: {
        luxury: "1.5rem"
      },
      backgroundImage: {
        "jaipur-paper":
          "linear-gradient(135deg, rgba(255,250,242,.96), rgba(247,230,214,.92)), radial-gradient(circle at top left, rgba(201,84,105,.16), transparent 30%)",
        "rose-gold": "linear-gradient(135deg, #c95469, #df7c71 52%, #b98a5a)",
        "royal-night": "linear-gradient(135deg, #513062, #6f1f32)"
      },
      keyframes: {
        "slow-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" }
        }
      },
      animation: {
        "slow-float": "slow-float 8s ease-in-out infinite"
      }
    }
  }
};
