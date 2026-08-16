/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_VALIDATION_API_BASE_URL?: string;
  readonly PUBLIC_TEMPLATES_API_BASE_URL?: string;
  readonly PUBLIC_PRIMARY_AI_ENDPOINT?: string;
  readonly PUBLIC_FALLBACK_AI_ENDPOINT?: string;
  readonly PUBLIC_OPENROUTER_MODEL?: string;
  readonly PUBLIC_OPENROUTER_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
