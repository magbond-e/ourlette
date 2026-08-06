import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sombre: {
          DEFAULT: "#2B1215",
          light: "#3F1B1E",
        },
        fonce: {
          DEFAULT: "#5F1C25",
          hover: "#4A151C",
        },
        accent: {
          DEFAULT: "#AC0C21",
          hover: "#8E091A",
          light: "#D42A40",
        },
        clair: {
          DEFAULT: "#F9E7E9",
          soft: "#FFF3F4",
        },
        blanc: "#FFFFFF",
        sable: {
          DEFAULT: "#E5C0C4",
          dark: "#CFA0A5",
          light: "#F5DDE0",
        },
        vertbouton: {
          DEFAULT: "#2D6A4F",
          dark: "#1B4332",
          light: "#40916C",
        },
        gold: {
          DEFAULT: "#D4AF37",
          light: "#E5C869",
          dark: "#B38F22",
        },
      },
      fontFamily: {
        display: ["Violense", "var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "Satoshi", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      borderRadius: {
        atelier: "12px",
      },
      boxShadow: {
        couture: "0 4px 20px -2px rgba(43, 18, 21, 0.08)",
        card: "0 2px 10px rgba(95, 28, 37, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
