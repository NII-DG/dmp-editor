import react from "@vitejs/plugin-react-swc"
import path from "path"
import { defineConfig } from "vitest/config"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  root: "./src",
  envDir: "../",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "../dist",
  },
  server: {
    host: process.env.DMP_EDITOR_HOST || "0.0.0.0",
    port: parseInt(process.env.DMP_EDITOR_PORT || "3000"),
  },
  preview: {
    host: process.env.DMP_EDITOR_HOST || "0.0.0.0",
    port: parseInt(process.env.DMP_EDITOR_PORT || "3000"),
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || "0.0.0"),
    DMP_EDITOR_BASE: JSON.stringify(process.env.DMP_EDITOR_BASE || "/"),
    VITE_USE_GRDM_DEV_ENV: JSON.stringify(process.env.VITE_USE_GRDM_DEV_ENV || "false")
  },
  base: process.env.DMP_EDITOR_BASE || "/",
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: path.resolve(__dirname, "test/setupTests.ts"),
    include: [
      "./test/**/*.{test,spec}.{ts,tsx,js,jsx}",
    ],
  },
})
