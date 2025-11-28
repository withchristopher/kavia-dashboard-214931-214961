/**
 * PUBLIC_INTERFACE
 * getApiBaseUrl
 * Returns the API base URL from the public environment variable.
 * This value must be configured in .env.local as NEXT_PUBLIC_API_BASE_URL.
 */
export function getApiBaseUrl(): string {
  // Read from public env var; Next.js exposes NEXT_PUBLIC_ vars to the browser.
  const url = (process as any)?.env?.NEXT_PUBLIC_API_BASE_URL ?? '';
  // Normalize to remove trailing slashes for consistent path joins.
  return (url || '').replace(/\/*$/, '');
}
