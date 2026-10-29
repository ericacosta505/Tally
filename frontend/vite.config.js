import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  envPrefix: ["VITE_", "REACT_APP_"],
  build: { outDir: "build" },
  server: { proxy: { "/api": "http://localhost:5000" } },
  test: { environment: "jsdom", globals: true, setupFiles: ["./src/setupTests.js"] },
});
