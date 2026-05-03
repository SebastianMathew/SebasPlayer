import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/SebasPlayer/",
  build: {
    outDir: "docs",
  },
  plugins: [react()],
});
