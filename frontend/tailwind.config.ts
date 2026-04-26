import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        vault: {
          bg:     "#0B0E11",
          bg2:    "#1E2026",
          bg3:    "#2B3139",
          yellow: "#F0B90B",
          green:  "#0ECB81",
          red:    "#F6465D",
          text:   "#EAECEF",
          text2:  "#848E9C",
          text3:  "#474D57",
        },
      },
      fontFamily: {
        sora: ["var(--font-sora)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
