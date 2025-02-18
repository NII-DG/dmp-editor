import react from "@vitejs/plugin-react-swc"
import path from "path"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  root: "./src",
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
  },
})
