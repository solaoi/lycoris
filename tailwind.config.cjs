/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html", "./src/**/*.tsx",
  ],
  theme: {
    extend: {
      animation: {
      shine: "shine 3s infinite",
      "fade-in": "fade-in 0.1s ease-in both",
    },
    keyframes: {
      shine: {
        "100%": { left: "125%" },
      },
      "fade-in": {
        "0%": { opacity: "0" },
        to: { opacity: "1" },
      },
    },
  },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["cupcake"],
  },
}
