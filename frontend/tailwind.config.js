/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        abyss: "#071726",
        deep: "#0b2a43",
        mid: "#124a6b",
        cyan: "#5eead4",
        cyan2: "#22d3ee",
        coral: "#ff5d5d",
        safe: "#34d399",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
