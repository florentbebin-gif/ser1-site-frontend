import type { BaseCgRetraiteContract } from '@/data/base-cg-retraite';
import {
  deleteBaseCgRetraiteSupabaseContract,
  fetchBaseCgRetraiteSupabaseCatalog,
  upsertBaseCgRetraiteSupabaseContract,
  BaseCgRetraiteCatalogUnavailableError,
} from './baseCgRetraiteCatalogRepository';
import {
  buildBaseCgRetraiteStoragePath,
  createBaseCgRetraiteDocumentDownloadUrl,
  uploadBaseCgRetraitePdf,
  type BaseCgRetraitePdfUploadInput,
  type BaseCgRetraitePdfUploadResult,
} from './baseCgRetraiteStorageRepository';

export type { BaseCgRetraitePdfUploadInput, BaseCgRetraitePdfUploadResult };

export {
  BaseCgRetraiteCatalogUnavailableError,
  buildBaseCgRetraiteStoragePath,
  createBaseCgRetraiteDocumentDownloadUrl,
  uploadBaseCgRetraitePdf,
};

export async function getBaseCgRetraiteCatalog(): Promise<BaseCgRetraiteContract[]> {
  return fetchBaseCgRetraiteSupabaseCatalog();
}

export async function upsertBaseCgRetraiteContract(
  contract: BaseCgRetraiteContract,
): Promise<void> {
  const savedInSupabase = await upsertBaseCgRetraiteSupabaseContract(contract);
  if (savedInSupabase) return;
  throw new BaseCgRetraiteCatalogUnavailableError(
    'Sauvegarde impossible : table Supabase Base CG retraite absente.',
  );
}

export async function deleteBaseCgRetraiteContract(id: string): Promise<void> {
  const deletedInSupabase = await deleteBaseCgRetraiteSupabaseContract(id);
  if (deletedInSupabase) return;
  throw new BaseCgRetraiteCatalogUnavailableError(
    'Suppression impossible : table Supabase Base CG retraite absente.',
  );
}
