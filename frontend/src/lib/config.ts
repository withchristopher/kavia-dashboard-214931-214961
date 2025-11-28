/**
 * PUBLIC_INTERFACE
 * getApiBaseUrl
 * Returns the API base URL from the public environment variable.
 * This value must be configured in .env.local as NEXT_PUBLIC_API_BASE_URL.
 */
export function getApiBaseUrl(): string {
  if (typeof process === 'undefined') {
    return '';
  }
  const url = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  return url.replace(/\/+$/, '');
}
