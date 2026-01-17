/**
 * Logo Loading Utility for PPTX Generation
 * 
 * Fetches user logo from Supabase Storage and converts to data URI
 * for use with PptxGenJS addImage({ data }).
 * 
 * Uses Image element approach to bypass CORS restrictions.
 */

/**
 * Load logo using Image element (bypasses CORS for public images)
 * This approach works better with Supabase Storage public URLs
 */
async function loadLogoViaImage(logoUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Required for canvas export
    
    img.onload = () => {
      try {
        // Create canvas and draw image
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        // Convert to data URI (PNG format for best quality)
        const dataUri = canvas.toDataURL('image/png');
        console.log('[loadLogoViaImage] Successfully converted to dataUri, length:', dataUri.length);
        resolve(dataUri);
      } catch (error) {
        reject(new Error(`Canvas conversion failed: ${error}`));
      }
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load image from URL: ${logoUrl}`));
    };
    
    // Start loading
    img.src = logoUrl;
  });
}

/**
 * Load logo from Supabase Storage URL as data URI
 * 
 * @param logoUrl - Supabase Storage URL (signed or public)
 * @returns Promise resolving to data URI string
 * @throws Error if fetch fails with clear message
 */
export async function loadLogoDataUri(logoUrl: string): Promise<string> {
  if (!logoUrl) {
    throw new Error('Logo URL is required');
  }
  
  // Validate URL format
  if (!logoUrl.startsWith('http://') && !logoUrl.startsWith('https://') && !logoUrl.startsWith('data:')) {
    throw new Error(`Invalid logo URL format: ${logoUrl}. Expected HTTP(S) URL or data URI.`);
  }
  
  // If already a data URI, return as-is
  if (logoUrl.startsWith('data:')) {
    console.log('[loadLogoDataUri] Already a data URI, returning as-is');
    return logoUrl;
  }
  
  console.log('[loadLogoDataUri] Loading logo via Image element:', logoUrl);
  
  try {
    // Use Image element approach (better CORS handling for Supabase Storage)
    const dataUri = await loadLogoViaImage(logoUrl);
    
    // Validate it's an image
    if (!dataUri.startsWith('data:image/')) {
      throw new Error('Converted resource is not an image');
    }
    
    return dataUri;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(
      `Failed to load logo from Supabase Storage.\n` +
      `URL: ${logoUrl}\n` +
      `Error: ${message}\n` +
      `Please verify the URL is valid and the bucket is public.`
    );
  }
}

/**
 * Load logo with fallback (returns undefined if loading fails)
 * 
 * @param logoUrl - Supabase Storage URL (optional)
 * @returns Promise resolving to data URI or undefined
 */
export async function loadLogoDataUriSafe(logoUrl?: string): Promise<string | undefined> {
  if (!logoUrl) {
    console.log('[PPTX Logo] No logo URL provided');
    return undefined;
  }
  
  console.log('[PPTX Logo] Attempting to load logo from:', logoUrl);
  
  try {
    const dataUri = await loadLogoDataUri(logoUrl);
    console.log('[PPTX Logo] Successfully loaded logo, dataUri length:', dataUri.length);
    return dataUri;
  } catch (error) {
    console.error('[PPTX Logo] Failed to load logo:', error);
    return undefined;
  }
}

export default {
  loadLogoDataUri,
  loadLogoDataUriSafe,
};
