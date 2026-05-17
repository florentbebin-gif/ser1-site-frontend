import { BASECG_CATALOG } from '@/data/basecg';
import type { BaseCgRetraiteContract } from '@/data/basecg';
import { supabase } from '@/supabaseClient';
import {
  DOCUMENTS_SELECT,
  DOCUMENTS_TABLE,
  OVERRIDES_SELECT,
  OVERRIDES_TABLE,
  isMissingSupabaseTableError,
} from './baseCgRetraiteRepository.constants';
import {
  groupBaseCgRetraiteDocuments,
  syncBaseCgRetraiteDocuments,
  type BaseCgRetraiteDocumentRow,
} from './baseCgRetraiteDocumentsRepository';

interface BaseCgRetraiteOverrideRow {
  contract_id: string;
  contract_data: Partial<BaseCgRetraiteContract>;
  is_deleted: boolean | null;
  updated_at?: string | null;
}

export interface BulkSyncResult {
  upserted: number;
  skipped: number;
  errors: Array<{ id: string; message: string }>;
}

function withoutDocuments(contract: BaseCgRetraiteContract): Omit<BaseCgRetraiteContract, 'documents'> {
  const { documents: _documents, ...rest } = contract;
  return rest;
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

function mergeSupabaseRows(
  overrideRows: BaseCgRetraiteOverrideRow[],
  documentRows: BaseCgRetraiteDocumentRow[],
): BaseCgRetraiteContract[] {
  const overrides = new Map(overrideRows.map((row) => [row.contract_id, row]));
  const documentsByContract = groupBaseCgRetraiteDocuments(documentRows);
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

export async function fetchBaseCgRetraiteSupabaseCatalog(): Promise<BaseCgRetraiteContract[] | null> {
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

export async function upsertBaseCgRetraiteSupabaseContract(
  contract: BaseCgRetraiteContract,
): Promise<boolean> {
  const payload = {
    contract_id: contract.id,
    contract_data: withoutDocuments(contract),
    is_deleted: false,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from(OVERRIDES_TABLE)
    .upsert(payload, { onConflict: 'contract_id' });

  if (isMissingSupabaseTableError(error)) return false;
  if (error) throw new Error(`[baseCgRetraiteRepository] upsert error: ${error.message}`);
  await syncBaseCgRetraiteDocuments(contract);
  return true;
}

/**
 * Pousse tous les contrats du catalogue statique (BASECG_CATALOG) en upsert dans Supabase
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
        result.errors.push({
          id: 'supabase',
          message: 'Table base_cg_retraite_overrides absente. Appliquer la migration Supabase.',
        });
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

export async function deleteBaseCgRetraiteSupabaseContract(id: string): Promise<boolean> {
  const { error } = await supabase
    .from(OVERRIDES_TABLE)
    .upsert({
      contract_id: id,
      contract_data: { id },
      is_deleted: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'contract_id' });

  if (isMissingSupabaseTableError(error)) return false;
  if (error) throw new Error(`[baseCgRetraiteRepository] delete error: ${error.message}`);
  return true;
}
