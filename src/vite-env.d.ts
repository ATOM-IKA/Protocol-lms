/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POCKETBASE_URL?: string
  readonly VITE_DIRECTUS_URL?: string
  readonly VITE_DIRECTUS_STATIC_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}