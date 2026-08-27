// Typed read of platform runtime config. The platform mounts /env-config.js
// into the served root at request time; it populates window._env_ before the
// module bundle evaluates (see index.html's synchronous <script> tag).
type Env = {
  // thunder-auth (platform-resource) -> THUNDER_AUTH_*
  THUNDER_AUTH_CLIENT_ID: string;
  THUNDER_AUTH_ISSUER: string;
  THUNDER_AUTH_JWKS_URL: string;
  THUNDER_AUTH_SCOPES: string;
};

declare global {
  interface Window {
    _env_: Env;
  }
}

if (!window._env_) {
  throw new Error(
    "window._env_ not set — /env-config.js failed to load. " +
      "The platform mounts this file; if you see this locally, host " +
      "/env-config.js from your dev server.",
  );
}

export const env: Env = window._env_;
