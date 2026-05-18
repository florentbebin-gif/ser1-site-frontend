import type { BaseCgRetraiteDocument } from '@/data/base-cg-retraite';
import { supabase } from '@/supabaseClient';
import { DOCUMENTS_BUCKET, SIGNED_URL_TTL_SECONDS } from './baseCgRetraiteRepository.constants';

export async function createBaseCgRetraiteDocumentDownloadUrl(
  document: BaseCgRetraiteDocument,
): Promise<string | null> {
  if (document.sourceUrl) return document.sourceUrl;
  if (!document.storagePath) return null;

  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(document.storagePath, SIGNED_URL_TTL_SECONDS);

  if (error) throw new Error(`[baseCgRetraiteRepository] signed url error: ${error.message}`);
  return data?.signedUrl ?? null;
}

export interface BaseCgRetraitePdfUploadInput {
  contractId: string;
  versionLabel: string;
  file: File;
}

export interface BaseCgRetraitePdfUploadResult {
  storagePath: string;
  fileName: string;
  bytes: number;
  mime: string;
}

function slugifyForStoragePath(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function buildBaseCgRetraiteStoragePath(
  contract: { id: string; compagnie?: string; nomContrat?: string },
  versionLabel: string,
): string {
  const compagnieSlug = slugifyForStoragePath(contract.compagnie ?? contract.id);
  const contratSlug = slugifyForStoragePath(contract.nomContrat ?? contract.id);
  const versionSlug = slugifyForStoragePath(versionLabel || 'cg');
  return `${compagnieSlug}/${contratSlug}/${versionSlug || 'cg'}.pdf`;
}

export async function uploadBaseCgRetraitePdf(
  input: BaseCgRetraitePdfUploadInput & { storagePath: string },
): Promise<BaseCgRetraitePdfUploadResult> {
  if (input.file.type !== 'application/pdf') {
    throw new Error('Le fichier doit être un PDF (application/pdf).');
  }

  const { error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(input.storagePath, input.file, {
      cacheControl: '3600',
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) throw new Error(`[baseCgRetraiteRepository] upload pdf error: ${error.message}`);

  return {
    storagePath: input.storagePath,
    fileName: input.file.name,
    bytes: input.file.size,
    mime: 'application/pdf',
  };
}
