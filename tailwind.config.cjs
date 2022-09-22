/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html", "./src/**/*.tsx",
  ],
  theme: {
    extend: {
      animation: {
      shine: "shine 3s infinite",
    },
    keyframes: {
      shine: {
        "100%": { left: "125%" },
      },
    },
  },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["cupcake"],
  },
}
