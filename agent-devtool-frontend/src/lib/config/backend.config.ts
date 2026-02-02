/**
 * Backend Configuration
 */

export interface BackendConfig {
  apiBaseUrl: string;
  enableDebug: boolean;
  defaultProtocol: 'rest' | 'a2a';
  useProxy: boolean;
}

export const getBackendConfig = (): BackendConfig => ({
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5016',
  enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  defaultProtocol: (import.meta.env.VITE_DEFAULT_PROTOCOL || 'rest') as 'rest' | 'a2a',
  useProxy: import.meta.env.VITE_USE_PROXY === 'true',
});
