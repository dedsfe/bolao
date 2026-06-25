import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/sportmonks": {
        target: "https://api.sportmonks.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/sportmonks/, ""),
      },
      "/espn": {
        target: "https://site.api.espn.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/espn/, ""),
      },
    },
  },
});
