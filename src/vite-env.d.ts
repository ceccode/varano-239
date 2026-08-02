/// <reference types="vite/client" />

// Typed build-time configuration, so reading it is not an `any` access.
interface ImportMetaEnv {
  readonly VITE_BASE_PATH?: string;
  readonly VITE_GOATCOUNTER_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
