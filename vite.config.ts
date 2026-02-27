import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Disable sourcemaps in production for smaller bundle
    sourcemap: mode === "development" ? true : false,
    // Minification
    minify: "esbuild",
    // Target modern browsers
    target: "es2020",
    // Chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk: React + core deps
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // UI library chunk
          "vendor-ui": ["@radix-ui/react-dialog", "@radix-ui/react-tabs", "@radix-ui/react-tooltip", "@radix-ui/react-scroll-area"],
          // State management
          "vendor-state": ["zustand"],
          // Data files (can be cached independently)
          "data": [
            "./src/data/classes.ts",
            "./src/data/races.ts",
            "./src/data/backgrounds.ts",
            "./src/data/spells.ts",
            "./src/data/items.ts",
            "./src/data/feats.ts",
          ],
        },
      },
    },
    // Increase chunk size warning limit (data files are large)
    chunkSizeWarningLimit: 600,
  },
  // Remove console.debug/warn in production
  esbuild: mode === "production" ? {
    drop: ["debugger"],
    pure: ["console.debug"],
  } : undefined,
}));
