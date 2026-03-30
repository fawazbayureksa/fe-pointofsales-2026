const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

/**
 * Resolve a product image path returned by the API into a full URL.
 *
 * Handles three cases:
 *  1. Already a full URL  →  returned as-is
 *  2. Root-relative path  →  base origin prepended  (e.g. /storage/... → http://host/storage/...)
 *  3. Relative path       →  base origin prepended  (e.g. storage/...  → http://host/storage/...)
 *
 * @param {string|null} path
 * @returns {string|null}
 */
export function resolveImageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  // Strip the "/api" suffix to get the storage origin
  const origin = API_URL.replace(/\/api\/?$/, '');

  // Already includes /storage prefix
  if (path.startsWith('/storage/') || path.startsWith('storage/')) {
    const separator = path.startsWith('/') ? '' : '/';
    return `${origin}${separator}${path}`;
  }

  // Bare path like "products/abc.jpg" → prepend /storage/
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin}/storage${cleanPath}`;
}
