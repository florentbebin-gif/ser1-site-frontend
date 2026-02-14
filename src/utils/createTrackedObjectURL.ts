/**
 * createTrackedObjectURL
 *
 * Centralizes blob URL creation for export flows and registers each URL
 * through the injected tracker (from App/useExportGuard).
 */

type TrackBlobUrlHandler = (_url: string) => void;

let trackBlobUrlHandler: TrackBlobUrlHandler | null = null;

export function setTrackBlobUrlHandler(handler: TrackBlobUrlHandler | null): void {
  trackBlobUrlHandler = handler;
}

export function createTrackedObjectURL(blob: Blob): string {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    throw new Error('createTrackedObjectURL: URL.createObjectURL is not available in this environment.');
  }

  const url = URL.createObjectURL(blob);

  if (trackBlobUrlHandler) {
    try {
      trackBlobUrlHandler(url);
    } catch {
      // keep export functional even if tracker fails
    }
  }

  return url;
}
