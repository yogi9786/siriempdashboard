/**
 * Safely resolves relative and absolute media URLs for image previews and displays.
 */
export const getMediaUrl = (url?: string | null): string => {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url;
  }

  let baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (baseUrl === undefined || baseUrl === null) {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      baseUrl = (hostname === 'localhost' || hostname === '127.0.0.1') ? 'http://127.0.0.1:8000' : '';
    } else {
      baseUrl = '';
    }
  }
  const cleanBase = baseUrl ? baseUrl.replace(/\/+$/, '') : '';
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${cleanBase}${cleanPath}`;
};
