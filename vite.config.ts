import path from "node:path";
import react from "@vitejs/plugin-react-swc";
import { componentTagger } from "lovable-tagger";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Use the repo subpath only when explicitly building for GitHub Pages
  // (the deploy workflow sets DEPLOY_TARGET=gh-pages). Local dev, `npm run
  // build` previews, and the Lovable preview all serve from the root.
  const base = process.env.DEPLOY_TARGET === "gh-pages" ? "/note8/" : "/";

  return {
    base,
    server: {
      host: "::",
      port: 8080,
      hmr: {},
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(
      Boolean,
    ),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime"],
    },
  };
});
