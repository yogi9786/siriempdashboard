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

/**
 * Safely downloads a file in the browser, fetching as blob to bypass cross-origin download restrictions.
 */
export const triggerFileDownload = async (url: string, suggestedFilename?: string): Promise<void> => {
  if (!url) return;
  const fullUrl = getMediaUrl(url);
  try {
    const response = await fetch(fullUrl, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status}`);
    }
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = suggestedFilename || url.split('/').pop() || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
  } catch (err) {
    console.warn('Direct blob download failed, falling back to window.open:', err);
    window.open(fullUrl, '_blank');
  }
};
