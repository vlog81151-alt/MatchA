const matchaPreset = require("@matcha/config/tailwind-preset");

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [matchaPreset],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}"
  ]
};
