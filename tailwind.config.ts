import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#050b14",
          900: "#08111f",
          800: "#0d1b2d",
        },
        aqua: {
          400: "#4de7d8",
          500: "#18c8bc",
        },
        signal: {
          400: "#ffb36b",
          500: "#ff7a45",
        },
      },
      boxShadow: {
        glow: "0 0 40px rgba(77, 231, 216, 0.18)",
        card: "0 18px 60px rgba(0, 0, 0, 0.28)",
      },
      backgroundImage: {
        "route-grid":
          "linear-gradient(rgba(77,231,216,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(77,231,216,0.08) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
} satisfies Config;
