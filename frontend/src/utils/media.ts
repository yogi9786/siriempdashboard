/**
 * Safely resolves relative and absolute media URLs for image previews and displays.
 */
export const getMediaUrl = (url?: string | null): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  // Normalize legacy or corrupted media paths: e.g. /api/media/xxx -> /uploads/xxx
  let cleanUrl = trimmed;
  if (cleanUrl.startsWith('/api/media/')) {
    cleanUrl = cleanUrl.replace(/^\/api\/media\//, '/uploads/');
  } else if (cleanUrl.startsWith('api/media/')) {
    cleanUrl = cleanUrl.replace(/^api\/media\//, '/uploads/');
  }

  let baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!baseUrl) {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      // In dev and prod, root-relative paths /uploads/... and /media/... are proxied/routed cleanly on same origin
      baseUrl = (hostname === 'localhost' || hostname === '127.0.0.1') ? '' : (window.location.origin || '');
    } else {
      baseUrl = '';
    }
  }
  const cleanBase = baseUrl ? baseUrl.replace(/\/+$/, '') : '';
  const cleanPath = cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
  return `${cleanBase}${cleanPath}`;
};

/**
 * Safely downloads a file in the browser, fetching as blob to bypass cross-origin download restrictions
 * and preserving proper file extensions (.pdf, .png, .jpg) for native OS viewing.
 */
export const triggerFileDownload = async (url: string, suggestedFilename?: string): Promise<void> => {
  if (!url) return;
  const fullUrl = getMediaUrl(url);

  // Extract file extension from URL
  const rawPath = url.split('?')[0].split('#')[0];
  const dotParts = rawPath.split('.');
  const ext = dotParts.length > 1 ? dotParts.pop()?.toLowerCase() : null;

  let finalFilename = suggestedFilename?.trim() || rawPath.split('/').pop() || 'document.pdf';
  if (ext && !finalFilename.toLowerCase().endsWith(`.${ext}`)) {
    finalFilename = `${finalFilename}.${ext}`;
  }

  try {
    const response = await fetch(fullUrl, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status}`);
    }
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
  } catch (err) {
    console.warn('Direct blob download failed, falling back to direct anchor download:', err);
    const fallbackLink = document.createElement('a');
    fallbackLink.href = fullUrl;
    fallbackLink.download = finalFilename;
    fallbackLink.target = '_blank';
    fallbackLink.rel = 'noopener noreferrer';
    document.body.appendChild(fallbackLink);
    fallbackLink.click();
    document.body.removeChild(fallbackLink);
  }
};
