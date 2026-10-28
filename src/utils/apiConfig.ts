/**
 * DeepFocus OS — API Endpoint Resolver
 * Provides reliable absolute endpoint resolution across Web & Desktop Electron environments.
 */

export const API_BASE_URL = 'https://phat-trien-ban-than.vercel.app';

export function getApiEndpoint(path: string): string {
  if (typeof window !== 'undefined' && (window.location.protocol === 'file:' || !window.location.origin || window.location.origin === 'null')) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${cleanPath}`;
  }
  return path;
}
