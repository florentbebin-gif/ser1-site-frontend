/**
 * Public Asset Resolution for PPTX Generation
 * 
 * Frontend-only utilities to fetch assets from /public folder
 * and convert them to data URIs for PptxGenJS.
 */

/**
 * Resolve a public asset path to a full URL
 * Works in both dev (Vite) and production builds
 * 
 * @param assetPath - Path relative to /public (e.g., "/pptx/chapters/ch-01.png")
 * @returns Full URL usable by fetch
 */
export function resolvePublicAsset(assetPath: string): string {
  // Ensure path starts with /
  const normalizedPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  
  // In Vite, public assets are served from root
  // In production, they're also at root after build
  return normalizedPath;
}

/**
 * Fetch an asset and convert to data URI
 * 
 * @param url - URL to fetch (can be relative or absolute)
 * @returns Promise resolving to data URI string
 * @throws Error if fetch fails
 */
export async function fetchAsDataUri(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch asset: ${url} (${response.status} ${response.statusText})`);
    }
    
    const blob = await response.blob();
    
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert blob to data URI'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`fetchAsDataUri failed for ${url}: ${message}`);
  }
}

/**
 * Fetch a chapter image as data URI
 * 
 * @param chapterIndex - Chapter number (1-9)
 * @returns Promise resolving to data URI
 */
export async function fetchChapterImageDataUri(chapterIndex: number): Promise<string> {
  if (chapterIndex < 1 || chapterIndex > 9) {
    throw new Error(`Invalid chapter index: ${chapterIndex}. Must be 1-9.`);
  }
  
  const fileName = `ch-${chapterIndex.toString().padStart(2, '0')}.png`;
  const assetPath = resolvePublicAsset(`/pptx/chapters/${fileName}`);
  
  return fetchAsDataUri(assetPath);
}

/**
 * Fetch an SVG asset and return its content
 * 
 * @param url - URL to fetch
 * @returns Promise resolving to SVG string
 */
export async function fetchSvgContent(url: string): Promise<string> {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch SVG: ${url} (${response.status})`);
  }
  
  return response.text();
}

export default {
  resolvePublicAsset,
  fetchAsDataUri,
  fetchChapterImageDataUri,
  fetchSvgContent,
};
