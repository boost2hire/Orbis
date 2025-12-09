import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,

    // ⭐ FIX: Proxy API requests to Flask backend
    proxy: {
      "/voice": {
        target: "http://127.0.0.1:5001",
        changeOrigin: true,
        secure: false,
      }
    }
  },

  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
}));
