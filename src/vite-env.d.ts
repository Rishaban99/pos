/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_INITIAL_SUPER_ADMIN_USERNAME?: string;
  readonly VITE_INITIAL_SUPER_ADMIN_PASSWORD?: string;
  readonly VITE_INITIAL_SUPER_ADMIN_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
