/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_USE_MOCK?: string
  readonly VITE_API_TIMEOUT?: string
  readonly VITE_AUTH_MODE?: string
  readonly VITE_REQUIRE_AUTH?: string
  readonly VITE_HISTORY_MODE?: string
  readonly VITE_API_WITH_CREDENTIALS?: string
  readonly VITE_CSRF_COOKIE?: string
  readonly VITE_CSRF_HEADER?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

export {}

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    guest?: boolean
  }
}
