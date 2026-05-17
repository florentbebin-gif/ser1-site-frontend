import type { BaseCgRetraiteContract, BaseCgRetraiteDocument } from '@/data/basecg';
import { supabase } from '@/supabaseClient';
import { DOCUMENTS_TABLE } from './baseCgRetraiteRepository.constants';

export interface BaseCgRetraiteDocumentRow {
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

function normalizeBaseCgRetraiteDocument(row: BaseCgRetraiteDocumentRow): BaseCgRetraiteDocument {
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

function baseCgRetraiteDocumentToRow(
  contractId: string,
  document: BaseCgRetraiteDocument,
): BaseCgRetraiteDocumentRow {
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

export function groupBaseCgRetraiteDocuments(
  rows: BaseCgRetraiteDocumentRow[],
): Map<string, BaseCgRetraiteDocument[]> {
  const grouped = new Map<string, BaseCgRetraiteDocument[]>();
  for (const row of rows) {
    const list = grouped.get(row.contract_id) ?? [];
    list.push(normalizeBaseCgRetraiteDocument(row));
    grouped.set(row.contract_id, list);
  }
  return grouped;
}

export async function syncBaseCgRetraiteDocuments(contract: BaseCgRetraiteContract): Promise<void> {
  const documents = contract.documents ?? [];
  // Diff-based sync : on UPSERT d'abord puis on supprime les ids absents du nouveau set.
  // Évite l'état intermédiaire "documents supprimés mais pas re-uploadés" en cas d'erreur réseau.
  const existingResult = await supabase
    .from(DOCUMENTS_TABLE)
    .select('id')
    .eq('contract_id', contract.id);
  if (existingResult.error) {
    throw new Error(
      `[baseCgRetraiteRepository] read documents error: ${existingResult.error.message}`,
    );
  }
  const existingIds = new Set((existingResult.data ?? []).map((row) => row.id as string));
  const nextIds = new Set(documents.map((document) => document.id));
  const toDelete = Array.from(existingIds).filter((id) => !nextIds.has(id));

  if (documents.length > 0) {
    const { error } = await supabase.from(DOCUMENTS_TABLE).upsert(
      documents.map((document) => baseCgRetraiteDocumentToRow(contract.id, document)),
      { onConflict: 'id' },
    );
    if (error)
      throw new Error(`[baseCgRetraiteRepository] upsert documents error: ${error.message}`);
  }

  if (toDelete.length > 0) {
    const { error } = await supabase.from(DOCUMENTS_TABLE).delete().in('id', toDelete);
    if (error)
      throw new Error(`[baseCgRetraiteRepository] delete documents error: ${error.message}`);
  }
}
