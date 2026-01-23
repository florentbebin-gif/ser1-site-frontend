/**
 * Logo upload utilities for admin cabinet management
 * - SHA256 hash calculation
 * - Deduplication via check_logo_exists
 * - Storage upload + DB record creation
 */

import { supabase } from '../supabaseClient';
import { invokeAdmin } from '../services/apiAdmin';

/**
 * Calculate SHA256 hash of an ArrayBuffer
 * @param {ArrayBuffer} buffer
 * @returns {Promise<string>} hex hash
 */
export async function sha256(buffer) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Upload logo with deduplication
 * @param {File} file - Image file to upload
 * @param {string} cabinetId - Cabinet ID for storage path
 * @returns {Promise<{logo_id: string, reused: boolean, error?: string}>}
 */
export async function uploadLogoWithDedup(file, cabinetId) {
  try {
    // 1. Read file and calculate SHA256
    const arrayBuffer = await file.arrayBuffer();
    const hash = await sha256(arrayBuffer);
    
    // 2. Check if logo already exists
    const { data: checkData, error: checkError } = await invokeAdmin('check_logo_exists', { sha256: hash });
    
    if (checkError) {
      return { logo_id: null, reused: false, error: checkError.message };
    }
    
    if (checkData?.exists && checkData?.logo?.id) {
      // Logo already exists, reuse it
      return { logo_id: checkData.logo.id, reused: true };
    }
    
    // 3. Upload to Storage
    const timestamp = Date.now();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const storagePath = `${cabinetId}/${timestamp}-${hash.substring(0, 8)}.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false
      });
    
    if (uploadError) {
      return { logo_id: null, reused: false, error: `Upload failed: ${uploadError.message}` };
    }
    
    // 4. Get image dimensions
    const img = await loadImageDimensions(file);
    
    // 5. Create logo record in DB
    const { data: createData, error: createError } = await invokeAdmin('create_logo', {
      sha256: hash,
      storage_path: storagePath,
      mime: file.type,
      width: img.width,
      height: img.height,
      bytes: file.size
    });
    
    if (createError) {
      return { logo_id: null, reused: false, error: `DB record failed: ${createError.message}` };
    }
    
    return { logo_id: createData?.logo?.id, reused: false };
    
  } catch (err) {
    return { logo_id: null, reused: false, error: err.message };
  }
}

/**
 * Load image dimensions from File
 * @param {File} file
 * @returns {Promise<{width: number, height: number}>}
 */
function loadImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Get public URL for a logo from storage
 * @param {string} storagePath
 * @returns {string}
 */
export function getLogoPublicUrl(storagePath) {
  if (!storagePath) return null;
  const { data } = supabase.storage.from('logos').getPublicUrl(storagePath);
  return data?.publicUrl || null;
}
