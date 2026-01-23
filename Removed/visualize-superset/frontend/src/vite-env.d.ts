/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPERSET_URL: string;
  readonly VITE_SPARQL_PROXY_URL: string;
  readonly VITE_SUPERSET_USERNAME: string;
  readonly VITE_SUPERSET_PASSWORD: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
