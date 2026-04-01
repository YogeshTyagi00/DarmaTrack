const API_BASE = import.meta.env.VITE_API_URL ?? ''

// In dev, VITE_API_URL is empty so calls go to /api (proxied by Vite)
// In production, VITE_API_URL is the full backend URL e.g. https://backend.onrender.com
export function apiUrl(path: string): string {
  if (API_BASE) {
    // Production: call backend directly
    return `${API_BASE}${path}`
  }
  // Dev: use Vite proxy
  return `/api${path}`
}
