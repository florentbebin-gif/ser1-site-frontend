/**
 * useExportGuard — Download policy "session active only" (P0-09)
 *
 * MVP client-side :
 * - Expose `canExport` (false si session expirée)
 * - `trackBlobUrl(url)` : enregistre les Blob URLs pour révocation ultérieure
 * - `revokeAllBlobs()` : révoque toutes les Blob URLs enregistrées
 *
 * Usage :
 *   const { canExport, trackBlobUrl } = useExportGuard(sessionExpired);
 *   // Dans le composant export :
 *   <button disabled={!canExport} onClick={handleExport}>Exporter</button>
 */

import { useCallback, useEffect, useRef } from 'react';

export interface ExportGuardState {
  /** false si la session est expirée — désactiver les boutons export */
  canExport: boolean;
  /** Enregistre une Blob URL pour révocation automatique à l'expiration */
  trackBlobUrl: (_url: string) => void;
  /** Révoque manuellement toutes les Blob URLs enregistrées */
  revokeAllBlobs: () => void;
}

export function useExportGuard(sessionExpired: boolean): ExportGuardState {
  const blobUrlsRef = useRef<string[]>([]);

  const trackBlobUrl = useCallback((url: string) => {
    blobUrlsRef.current.push(url);
    // Exposer sur window pour que useSessionTTL puisse les révoquer
    (window as unknown as Record<string, string[]>).__ser1BlobUrls = blobUrlsRef.current;
  }, []);

  const revokeAllBlobs = useCallback(() => {
    blobUrlsRef.current.forEach((blobUrl) => {
      try {
        URL.revokeObjectURL(blobUrl);
      } catch {
        // ignore
      }
    });
    blobUrlsRef.current = [];
    (window as unknown as Record<string, string[]>).__ser1BlobUrls = [];
  }, []);

  // Auto-révoquer quand la session expire
  useEffect(() => {
    if (sessionExpired) {
      revokeAllBlobs();
    }
  }, [sessionExpired, revokeAllBlobs]);

  return {
    canExport: !sessionExpired,
    trackBlobUrl,
    revokeAllBlobs,
  };
}
