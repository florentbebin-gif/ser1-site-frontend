import { BASECG_CATALOG, BASECG_VERSION } from '@/data/basecg';
import type { BaseCgRetraiteContract } from '@/data/basecg';
import type { BaseCgRetraiteDocument } from '@/data/basecg';
import { supabase } from '@/supabaseClient';

const STORAGE_KEY = 'ser1:basecg-retraite:v1';
const OVERRIDES_TABLE = 'base_cg_retraite_overrides';
const DOCUMENTS_TABLE = 'base_cg_retraite_documents';
const DOCUMENTS_BUCKET = 'base-cg-retraite-cg';
// 5 minutes : confort de copie-colle, reste sécurisé (bucket privé, URL non re-distribuable).
const SIGNED_URL_TTL_SECONDS = 300;
const OVERRIDES_SELECT = 'contract_id, contract_data, is_deleted, updated_at';
const DOCUMENTS_SELECT = [
  'id',
  'contract_id',
  'label',
  'document_type',
  'status',
  'source_url',
  'version_label',
  'storage_path',
  'file_name',
  'mime',
  'bytes',
  'uploaded_at',
].join(', ');

interface BaseCgRetraiteOverlay {
  version: string;
  updatedAt: string;
  upserts: Record<string, BaseCgRetraiteContract>;
  deletedIds: string[];
}

interface BaseCgRetraiteOverrideRow {
  contract_id: string;
  contract_data: Partial<BaseCgRetraiteContract>;
  is_deleted: boolean | null;
  updated_at?: string | null;
}

interface BaseCgRetraiteDocumentRow {
  id: string;
  contract_id: string;
  label: string;
  document_type: BaseCgRetraiteDocument['type'];
  status: BaseCgRetraiteDocument['status'];
  source_url?: string | null;
  version_label?: string | null;
  storage_path?: string | null;
  file_name?: string | null;
  mime?: string | null;
  bytes?: number | null;
  uploaded_at?: string | null;
}

function emptyOverlay(): BaseCgRetraiteOverlay {
  return {
    version: BASECG_VERSION,
    updatedAt: new Date(0).toISOString(),
    upserts: {},
    deletedIds: [],
  };
}

function readOverlay(): BaseCgRetraiteOverlay {
  if (typeof localStorage === 'undefined') return emptyOverlay();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyOverlay();
    const parsed = JSON.parse(raw) as Partial<BaseCgRetraiteOverlay>;
    return {
      version: parsed.version ?? BASECG_VERSION,
      updatedAt: parsed.updatedAt ?? new Date(0).toISOString(),
      upserts: parsed.upserts ?? {},
      deletedIds: parsed.deletedIds ?? [],
    };
  } catch {
    return emptyOverlay();
  }
}

function writeOverlay(overlay: BaseCgRetraiteOverlay): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...overlay,
    updatedAt: new Date().toISOString(),
  }));
}

function mergeOverlay(overlay: BaseCgRetraiteOverlay): BaseCgRetraiteContract[] {
  const deletedIds = new Set(overlay.deletedIds);
  const base = BASECG_CATALOG
    .filter((contract) => !deletedIds.has(contract.id))
    .map((contract) => overlay.upserts[contract.id] ?? contract);
  const baseIds = new Set(BASECG_CATALOG.map((contract) => contract.id));
  const created = Object.values(overlay.upserts)
    .filter((contract) => !baseIds.has(contract.id) && !deletedIds.has(contract.id));

  return [...base, ...created].sort((left, right) => (
    `${left.compagnie} ${left.nomContrat}`.localeCompare(`${right.compagnie} ${right.nomContrat}`, 'fr-FR')
  ));
}

function isMissingSupabaseTableError(error: { message?: string; code?: string } | null | undefined): boolean {
  if (!error) return false;
  const message = error.message ?? '';
  return error.code === '42P01'
    || message.includes('does not exist')
    || message.includes('Could not find the table')
    || message.includes('schema cache');
}

function withoutDocuments(contract: BaseCgRetraiteContract): Omit<BaseCgRetraiteContract, 'documents'> {
  const { documents: _documents, ...rest } = contract;
  return rest;
}

function normalizeDocument(row: BaseCgRetraiteDocumentRow): BaseCgRetraiteDocument {
  return {
    id: row.id,
    label: row.label,
    type: row.document_type,
    status: row.status,
    sourceUrl: row.source_url ?? undefined,
    versionLabel: row.version_label ?? null,
    storagePath: row.storage_path ?? null,
    fileName: row.file_name ?? null,
    mime: row.mime ?? null,
    bytes: row.bytes ?? null,
    uploadedAt: row.uploaded_at ?? undefined,
  };
}

function documentToRow(contractId: string, document: BaseCgRetraiteDocument): BaseCgRetraiteDocumentRow {
  return {
    id: document.id,
    contract_id: contractId,
    label: document.label,
    document_type: document.type,
    status: document.status,
    source_url: document.sourceUrl ?? null,
    version_label: document.versionLabel ?? null,
    storage_path: document.storagePath ?? null,
    file_name: document.fileName ?? null,
    mime: document.mime ?? null,
    bytes: document.bytes ?? null,
    uploaded_at: document.uploadedAt ?? null,
  };
}

function mergeContractData(
  base: BaseCgRetraiteContract | undefined,
  row: BaseCgRetraiteOverrideRow,
): BaseCgRetraiteContract | null {
  const data = row.contract_data ?? {};
  if (!base && (!data.id || !data.compagnie || !data.nomContrat || !data.typeContrat)) return null;

  const merged = {
    ...(base ?? {}),
    ...data,
    id: data.id ?? row.contract_id,
    phaseEpargne: {
      ...(base?.phaseEpargne ?? {}),
      ...(data.phaseEpargne ?? {}),
    },
    phaseLiquidation: {
      ...(base?.phaseLiquidation ?? {}),
      ...(data.phaseLiquidation ?? {}),
    },
  } as BaseCgRetraiteContract;

  return merged;
}

function groupDocuments(rows: BaseCgRetraiteDocumentRow[]): Map<string, BaseCgRetraiteDocument[]> {
  const grouped = new Map<string, BaseCgRetraiteDocument[]>();
  for (const row of rows) {
    const list = grouped.get(row.contract_id) ?? [];
    list.push(normalizeDocument(row));
    grouped.set(row.contract_id, list);
  }
  return grouped;
}

function mergeSupabaseRows(
  overrideRows: BaseCgRetraiteOverrideRow[],
  documentRows: BaseCgRetraiteDocumentRow[],
): BaseCgRetraiteContract[] {
  const overrides = new Map(overrideRows.map((row) => [row.contract_id, row]));
  const documentsByContract = groupDocuments(documentRows);
  const baseIds = new Set(BASECG_CATALOG.map((contract) => contract.id));
  const merged: BaseCgRetraiteContract[] = [];

  for (const baseContract of BASECG_CATALOG) {
    const override = overrides.get(baseContract.id);
    if (override?.is_deleted) continue;
    const contract = override ? mergeContractData(baseContract, override) : baseContract;
    if (!contract) continue;
    merged.push({
      ...contract,
      documents: documentsByContract.get(contract.id) ?? contract.documents ?? [],
    });
  }

  for (const override of overrideRows) {
    if (baseIds.has(override.contract_id) || override.is_deleted) continue;
    const contract = mergeContractData(undefined, override);
    if (!contract) continue;
    merged.push({
      ...contract,
      documents: documentsByContract.get(contract.id) ?? contract.documents ?? [],
    });
  }

  return merged.sort((left, right) => (
    `${left.compagnie} ${left.nomContrat}`.localeCompare(`${right.compagnie} ${right.nomContrat}`, 'fr-FR')
  ));
}

async function fetchSupabaseCatalog(): Promise<BaseCgRetraiteContract[] | null> {
  const [overridesResult, documentsResult] = await Promise.all([
    supabase
      .from(OVERRIDES_TABLE)
      .select(OVERRIDES_SELECT)
      .order('contract_id', { ascending: true }),
    supabase
      .from(DOCUMENTS_TABLE)
      .select(DOCUMENTS_SELECT)
      .order('contract_id', { ascending: true }),
  ]);

  if (isMissingSupabaseTableError(overridesResult.error) || isMissingSupabaseTableError(documentsResult.error)) {
    return null;
  }
  if (overridesResult.error || documentsResult.error) {
    return null;
  }

  return mergeSupabaseRows(
    (overridesResult.data ?? []) as unknown as BaseCgRetraiteOverrideRow[],
    (documentsResult.data ?? []) as unknown as BaseCgRetraiteDocumentRow[],
  );
}

async function syncDocuments(contract: BaseCgRetraiteContract): Promise<void> {
  const documents = contract.documents ?? [];
  // Diff-based sync : on UPSERT d'abord puis on supprime les ids absents du nouveau set.
  // Évite l'état intermédiaire "documents supprimés mais pas re-uploadés" en cas d'erreur réseau.
  const existingResult = await supabase
    .from(DOCUMENTS_TABLE)
    .select('id')
    .eq('contract_id', contract.id);
  if (existingResult.error) {
    throw new Error(`[baseCgRetraiteRepository] read documents error: ${existingResult.error.message}`);
  }
  const existingIds = new Set((existingResult.data ?? []).map((row) => row.id as string));
  const nextIds = new Set(documents.map((document) => document.id));
  const toDelete = Array.from(existingIds).filter((id) => !nextIds.has(id));

  if (documents.length > 0) {
    const { error } = await supabase
      .from(DOCUMENTS_TABLE)
      .upsert(documents.map((document) => documentToRow(contract.id, document)), { onConflict: 'id' });
    if (error) throw new Error(`[baseCgRetraiteRepository] upsert documents error: ${error.message}`);
  }

  if (toDelete.length > 0) {
    const { error } = await supabase
      .from(DOCUMENTS_TABLE)
      .delete()
      .in('id', toDelete);
    if (error) throw new Error(`[baseCgRetraiteRepository] delete documents error: ${error.message}`);
  }
}

export async function getBaseCgRetraiteCatalog(): Promise<BaseCgRetraiteContract[]> {
  const supabaseCatalog = await fetchSupabaseCatalog();
  return supabaseCatalog ?? mergeOverlay(readOverlay());
}

export async function getBaseCgRetraiteOverlay(): Promise<BaseCgRetraiteOverlay> {
  return readOverlay();
}

export async function upsertBaseCgRetraiteContract(contract: BaseCgRetraiteContract): Promise<void> {
  const payload = {
    contract_id: contract.id,
    contract_data: withoutDocuments(contract),
    is_deleted: false,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from(OVERRIDES_TABLE)
    .upsert(payload, { onConflict: 'contract_id' });

  if (!isMissingSupabaseTableError(error)) {
    if (error) throw new Error(`[baseCgRetraiteRepository] upsert error: ${error.message}`);
    await syncDocuments(contract);
    return;
  }

  const overlay = readOverlay();
  const deletedIds = overlay.deletedIds.filter((id) => id !== contract.id);
  writeOverlay({
    ...overlay,
    deletedIds,
    upserts: {
      ...overlay.upserts,
      [contract.id]: contract,
    },
  });
}

export interface BulkSyncResult {
  upserted: number;
  skipped: number;
  errors: Array<{ id: string; message: string }>;
}

/**
 * Pousse tous les contrats du catalogue généré (BASECG_CATALOG) en upsert dans Supabase
 * via la table base_cg_retraite_overrides. Utilisé pour synchroniser une base vierge
 * sans avoir à éditer chaque contrat un par un. Réservé admin via RLS.
 * Les documents existants en Supabase ne sont pas touchés.
 */
export async function bulkUpsertBaseCgRetraiteCatalog(): Promise<BulkSyncResult> {
  const result: BulkSyncResult = { upserted: 0, skipped: 0, errors: [] };
  const nowIso = new Date().toISOString();
  const BATCH_SIZE = 50;

  for (let index = 0; index < BASECG_CATALOG.length; index += BATCH_SIZE) {
    const slice = BASECG_CATALOG.slice(index, index + BATCH_SIZE);
    const rows = slice.map((contract) => ({
      contract_id: contract.id,
      contract_data: withoutDocuments(contract),
      is_deleted: false,
      updated_at: nowIso,
    }));

    const { error } = await supabase
      .from(OVERRIDES_TABLE)
      .upsert(rows, { onConflict: 'contract_id' });

    if (error) {
      if (isMissingSupabaseTableError(error)) {
        result.errors.push({ id: 'supabase', message: 'Table base_cg_retraite_overrides absente. Appliquer la migration Supabase.' });
        return result;
      }
      for (const contract of slice) {
        result.errors.push({ id: contract.id, message: error.message });
      }
      result.skipped += slice.length;
    } else {
      result.upserted += slice.length;
    }
  }

  return result;
}

export async function deleteBaseCgRetraiteContract(id: string): Promise<void> {
  const { error } = await supabase
    .from(OVERRIDES_TABLE)
    .upsert({
      contract_id: id,
      contract_data: { id },
      is_deleted: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'contract_id' });

  if (!isMissingSupabaseTableError(error)) {
    if (error) throw new Error(`[baseCgRetraiteRepository] delete error: ${error.message}`);
    return;
  }

  const overlay = readOverlay();
  const upserts = { ...overlay.upserts };
  delete upserts[id];
  writeOverlay({
    ...overlay,
    upserts,
    deletedIds: Array.from(new Set([...overlay.deletedIds, id])),
  });
}

export async function createBaseCgRetraiteDocumentDownloadUrl(
  document: BaseCgRetraiteDocument,
): Promise<string | null> {
  if (document.sourceUrl) return document.sourceUrl;
  if (!document.storagePath) return null;

  const { data, error } = await supabase
    .storage
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
    .replace(/[̀-ͯ]/g, '')
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

  const { error } = await supabase
    .storage
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
