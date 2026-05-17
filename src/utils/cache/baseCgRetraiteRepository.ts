import type { BaseCgRetraiteContract } from '@/data/basecg';
import {
  bulkUpsertBaseCgRetraiteCatalog,
  deleteBaseCgRetraiteSupabaseContract,
  fetchBaseCgRetraiteSupabaseCatalog,
  upsertBaseCgRetraiteSupabaseContract,
  type BulkSyncResult,
} from './baseCgRetraiteCatalogRepository';
import {
  mergeBaseCgRetraiteOverlay,
  readBaseCgRetraiteOverlay,
  writeBaseCgRetraiteOverlay,
  type BaseCgRetraiteOverlay,
} from './baseCgRetraiteOverlayRepository';
import {
  buildBaseCgRetraiteStoragePath,
  createBaseCgRetraiteDocumentDownloadUrl,
  uploadBaseCgRetraitePdf,
  type BaseCgRetraitePdfUploadInput,
  type BaseCgRetraitePdfUploadResult,
} from './baseCgRetraiteStorageRepository';

export type {
  BaseCgRetraiteOverlay,
  BaseCgRetraitePdfUploadInput,
  BaseCgRetraitePdfUploadResult,
  BulkSyncResult,
};

export {
  buildBaseCgRetraiteStoragePath,
  bulkUpsertBaseCgRetraiteCatalog,
  createBaseCgRetraiteDocumentDownloadUrl,
  uploadBaseCgRetraitePdf,
};

export async function getBaseCgRetraiteCatalog(): Promise<BaseCgRetraiteContract[]> {
  const supabaseCatalog = await fetchBaseCgRetraiteSupabaseCatalog();
  return supabaseCatalog ?? mergeBaseCgRetraiteOverlay(readBaseCgRetraiteOverlay());
}

export async function getBaseCgRetraiteOverlay(): Promise<BaseCgRetraiteOverlay> {
  return readBaseCgRetraiteOverlay();
}

export async function upsertBaseCgRetraiteContract(
  contract: BaseCgRetraiteContract,
): Promise<void> {
  const savedInSupabase = await upsertBaseCgRetraiteSupabaseContract(contract);
  if (savedInSupabase) return;

  const overlay = readBaseCgRetraiteOverlay();
  const deletedIds = overlay.deletedIds.filter((id) => id !== contract.id);
  writeBaseCgRetraiteOverlay({
    ...overlay,
    deletedIds,
    upserts: {
      ...overlay.upserts,
      [contract.id]: contract,
    },
  });
}

export async function deleteBaseCgRetraiteContract(id: string): Promise<void> {
  const deletedInSupabase = await deleteBaseCgRetraiteSupabaseContract(id);
  if (deletedInSupabase) return;

  const overlay = readBaseCgRetraiteOverlay();
  const upserts = { ...overlay.upserts };
  delete upserts[id];
  writeBaseCgRetraiteOverlay({
    ...overlay,
    upserts,
    deletedIds: Array.from(new Set([...overlay.deletedIds, id])),
  });
}
