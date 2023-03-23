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
      "spin-slow": "spin 3s linear infinite",
      "spread": "spread .25s",
    },
    keyframes: {
      shine: {
        "100%": { left: "125%" },
      },
      "fade-in": {
        "0%": { opacity: "0" },
        to: { opacity: "1" },
      },
      "spread":{
        from :{ transform: "scale(0)" },
        to: { transform: "scale(1)" }
      },
    },
  },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["cupcake"],
  },
}
