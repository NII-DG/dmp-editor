/// <reference types="vite/client" />
declare const __APP_VERSION__: string
declare const DMP_EDITOR_BASE: string

interface ImportMetaEnv {
  readonly VITE_USE_GRDM_DEV_ENV?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
