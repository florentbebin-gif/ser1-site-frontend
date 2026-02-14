/**
 * createTrackedObjectURL
 *
 * Centralizes blob URL creation for export flows and registers each URL
 * through the injected tracker (from App/useExportGuard).
 */

type TrackBlobUrlHandler = (_url: string) => void;

let trackBlobUrlHandler: TrackBlobUrlHandler | null = null;
const trackedUrls = new Set<string>();

export function setTrackBlobUrlHandler(handler: TrackBlobUrlHandler | null): void {
  trackBlobUrlHandler = handler;
}

export function registerTrackedObjectURL(url: string): void {
  trackedUrls.add(url);
}

export function revokeAllTrackedObjectURLs(): void {
  if (typeof URL === 'undefined' || typeof URL.revokeObjectURL !== 'function') {
    trackedUrls.clear();
    return;
  }

  trackedUrls.forEach((url) => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  });

  trackedUrls.clear();
}

export function createTrackedObjectURL(blob: Blob): string {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    throw new Error('createTrackedObjectURL: URL.createObjectURL is not available in this environment.');
  }

  const url = URL.createObjectURL(blob);
  registerTrackedObjectURL(url);

  if (trackBlobUrlHandler) {
    try {
      trackBlobUrlHandler(url);
    } catch {
      // keep export functional even if tracker fails
    }
  }

  return url;
}
