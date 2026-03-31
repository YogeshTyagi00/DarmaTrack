const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export function resolveImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null
  if (imageUrl.startsWith('http')) return imageUrl
  return `${API_URL}${imageUrl}`
}
