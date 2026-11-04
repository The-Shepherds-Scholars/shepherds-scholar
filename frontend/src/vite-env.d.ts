/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_FORMSPREE_ID?: string;
  readonly VITE_ANALYTICS?: string; // "on" to count visits while developing
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
