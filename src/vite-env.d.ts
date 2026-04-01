/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_CM_PREFIX?: string;
  readonly VITE_CM_PREFIX?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
