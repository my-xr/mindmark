/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_TIMEOUT_MS?: string;
  readonly VITE_AI_CONNECTION_TEST_TIMEOUT_MS?: string;
  readonly VITE_AI_GENERATION_TIMEOUT_MS?: string;
  readonly VITE_API_PROXY_TARGET?: string;
  readonly VITE_AUTH_USER_ID?: string;
  readonly VITE_AUTH_ROLES?: string;
  readonly VITE_AUTH_STUDENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
