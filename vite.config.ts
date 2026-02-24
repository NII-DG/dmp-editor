import react from "@vitejs/plugin-react-swc"
import path from "path"
import type { Plugin } from "vite"
import { defineConfig } from "vitest/config"

/**
 * Temporary workaround: stub Node.js built-in modules when imported by
 * `@hirakinii-packages/kaken-api-client-typescript`.
 *
 * The package's `cache.js` and `client.js` use `node:fs/promises`, `node:os`,
 * `node:path`, and `node:crypto` which are not available in browser environments.
 * These stubs make the build succeed while keeping runtime behavior correct,
 * because `useCache: false` prevents the cache from being used at all.
 *
 * TODO: Remove this plugin once the kaken-api-client package provides a
 * browser-compatible build (e.g. via `package.json` `browser` field).
 */
function kakenNodeStubsPlugin(): Plugin {
  const KAKEN_PKG = "@hirakinii-packages/kaken-api-client-typescript"

  const STUBS: Record<string, string> = {
    "node:os": "export const tmpdir = () => '/tmp'",
    "node:path": "export const join = (...parts) => parts.filter(Boolean).join('/')",
    "node:crypto": "export const createHash = () => ({ update: () => ({ digest: () => '' }) })",
    "node:fs/promises": [
      "const notSupported = () => Promise.reject(new Error('fs not available in browser'))",
      "export const readFile = notSupported",
      "export const writeFile = () => Promise.resolve()",
      "export const mkdir = () => Promise.resolve()",
      "export const readdir = () => Promise.resolve([])",
      "export const unlink = () => Promise.resolve()",
    ].join("\n"),
  }

  return {
    name: "kaken-node-stubs",
    enforce: "pre",
    resolveId(id, importer) {
      if (!importer?.includes(KAKEN_PKG)) return
      if (id in STUBS) return `\0kaken-stub:${id}`
    },
    load(id) {
      if (!id.startsWith("\0kaken-stub:")) return
      const nodeModule = id.slice("\0kaken-stub:".length)
      return STUBS[nodeModule]
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), kakenNodeStubsPlugin()],
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
    VITE_USE_GRDM_DEV_ENV: JSON.stringify(process.env.VITE_USE_GRDM_DEV_ENV || "false"),
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
