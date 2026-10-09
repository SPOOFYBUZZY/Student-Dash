/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"]
      },
      colors: {
        ink: "#111b32",
        brand: "#4465e8",
        canvas: "#f5f7fb",
        teal: "#139b83"
      },
      boxShadow: {
        soft: "0 2px 12px rgba(19, 35, 68, .045)"
      }
    }
  },
  plugins: []
};
