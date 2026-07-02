/**
 * tailwind.config.js
 * -------------------
 * Extends Tailwind with the app's design tokens (see design plan):
 *   paper / ink / rule / accent / sage / brass colors,
 *   Fraunces (display), Inter (body), IBM Plex Mono (utility).
 *
 * Drop this at the project root. If you're using Vite + Tailwind v3,
 * this is the standard config shape; for Tailwind v4 move the `extend`
 * block into an @theme block in your CSS file instead.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F6F1E7",
        ink: "#2B2622",
        rule: "#C9BCA3",
        accent: "#B5482F",
        sage: "#5C7A5E",
        brass: "#9C7A3C",
        // Added for the format-builder's 4th capture group ("meaning of
        // example") — a muted ledger-ink teal that reads as clearly
        // distinct from accent/sage/brass on the same paper tone.
        teal: "#3E6B77",
      },
      fontFamily: {
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      keyframes: {
        "flip-in": {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(180deg)" },
        },
      },
    },
  },
  plugins: [],
};
