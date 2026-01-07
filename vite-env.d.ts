/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly OPENAI_API_KEY?: string;
  readonly VITE_OPENAI_API_KEY?: string;
  readonly EMAILJS_SERVICE_ID?: string;
  readonly EMAILJS_TEMPLATE_ID?: string;
  readonly EMAILJS_PUBLIC_KEY?: string;
  readonly DEV: boolean;
  readonly MODE: string;
  readonly PROD: boolean;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

