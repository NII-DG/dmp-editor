import react from "@vitejs/plugin-react-swc"
import path from "path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || "0.0.0"),
    DMP_EDITOR_BASE: JSON.stringify(process.env.DMP_EDITOR_BASE || "/"),
    KAKEN_APP_ID: JSON.stringify(process.env.KAKEN_APP_ID ?? ""),
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: path.resolve(__dirname, "test/setupTests.ts"),
    include: [
      "./test/**/*.{test,spec}.{ts,tsx,js,jsx}",
    ],
  },
})
