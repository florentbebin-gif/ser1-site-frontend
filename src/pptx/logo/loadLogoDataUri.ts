/**
 * Logo Loading Utility for PPTX Generation
 * 
 * Fetches user logo from Supabase Storage and converts to data URI
 * for use with PptxGenJS addImage({ data }).
 */

import { fetchAsDataUri } from '../assets/resolvePublicAsset';

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
    return logoUrl;
  }
  
  try {
    const dataUri = await fetchAsDataUri(logoUrl);
    
    // Validate it's an image
    if (!dataUri.startsWith('data:image/')) {
      throw new Error('Fetched resource is not an image');
    }
    
    return dataUri;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(
      `Failed to load logo from Supabase Storage.\n` +
      `URL: ${logoUrl}\n` +
      `Error: ${message}\n` +
      `Please verify the URL is valid and accessible.`
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
    return undefined;
  }
  
  try {
    return await loadLogoDataUri(logoUrl);
  } catch (error) {
    console.warn('[PPTX Logo] Failed to load logo:', error);
    return undefined;
  }
}

export default {
  loadLogoDataUri,
  loadLogoDataUriSafe,
};
