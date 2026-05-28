import type { BaseCgRetraiteContract } from '@/data/base-cg-retraite';
import { supabase } from '@/supabaseClient';
import {
  CONTRACTS_SELECT,
  CONTRACTS_TABLE,
  DOCUMENTS_SELECT,
  DOCUMENTS_TABLE,
  isMissingSupabaseTableError,
} from './baseCgRetraiteRepository.constants';
import {
  groupBaseCgRetraiteDocuments,
  syncBaseCgRetraiteDocuments,
  type BaseCgRetraiteDocumentRow,
} from './baseCgRetraiteDocumentsRepository';

interface BaseCgRetraiteContractRow {
  contract_id: string;
  source_id: string;
  company: string;
  contract_name: string;
  contract_type: BaseCgRetraiteContract['typeContrat'];
  per_compartment?: BaseCgRetraiteContract['perCompartment'];
  contract_data: BaseCgRetraiteContract;
  row_hash: string;
  is_deleted: boolean;
  updated_at?: string | null;
}

export class BaseCgRetraiteCatalogUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BaseCgRetraiteCatalogUnavailableError';
  }
}

function withoutDocuments(
  contract: BaseCgRetraiteContract,
): Omit<BaseCgRetraiteContract, 'documents'> {
  const { documents: _documents, ...rest } = contract;
  return rest;
}

function contractToRow(contract: BaseCgRetraiteContract) {
  return {
    contract_id: contract.id,
    source_id: contract.sourceId,
    company: contract.compagnie,
    contract_name: contract.nomContrat,
    contract_type: contract.typeContrat,
    per_compartment: contract.perCompartment ?? null,
    contract_data: withoutDocuments(contract),
    is_deleted: false,
    updated_at: new Date().toISOString(),
  };
}

function mergeSupabaseRows(
  contractRows: BaseCgRetraiteContractRow[],
  documentRows: BaseCgRetraiteDocumentRow[],
): BaseCgRetraiteContract[] {
  const documentsByContract = groupBaseCgRetraiteDocuments(documentRows);

  return contractRows
    .filter((row) => !row.is_deleted)
    .map((row) => {
      const data = row.contract_data ?? ({} as BaseCgRetraiteContract);
      return {
        ...data,
        id: row.contract_id,
        sourceId: row.source_id,
        compagnie: row.company,
        nomContrat: row.contract_name,
        typeContrat: row.contract_type,
        perCompartment: row.per_compartment ?? data.perCompartment ?? null,
        documents: documentsByContract.get(row.contract_id) ?? data.documents ?? [],
      } satisfies BaseCgRetraiteContract;
    })
    .sort((left, right) =>
      `${left.compagnie} ${left.nomContrat}`.localeCompare(
        `${right.compagnie} ${right.nomContrat}`,
        'fr-FR',
      ),
    );
}

export async function fetchBaseCgRetraiteSupabaseCatalog(): Promise<BaseCgRetraiteContract[]> {
  const [contractsResult, documentsResult] = await Promise.all([
    supabase
      .from(CONTRACTS_TABLE)
      .select(CONTRACTS_SELECT)
      .eq('is_deleted', false)
      .order('contract_id', { ascending: true }),
    supabase
      .from(DOCUMENTS_TABLE)
      .select(DOCUMENTS_SELECT)
      .order('contract_id', { ascending: true }),
  ]);

  if (
    isMissingSupabaseTableError(contractsResult.error) ||
    isMissingSupabaseTableError(documentsResult.error)
  ) {
    throw new BaseCgRetraiteCatalogUnavailableError(
      'Catalogue Base CG retraite indisponible : migration Supabase canonique absente.',
    );
  }
  if (contractsResult.error || documentsResult.error) {
    throw new BaseCgRetraiteCatalogUnavailableError(
      `Catalogue Base CG retraite indisponible : ${
        contractsResult.error?.message ?? documentsResult.error?.message ?? 'erreur Supabase'
      }`,
    );
  }

  return mergeSupabaseRows(
    (contractsResult.data ?? []) as unknown as BaseCgRetraiteContractRow[],
    (documentsResult.data ?? []) as unknown as BaseCgRetraiteDocumentRow[],
  );
}

export async function upsertBaseCgRetraiteSupabaseContract(
  contract: BaseCgRetraiteContract,
): Promise<boolean> {
  const payload = contractToRow(contract);

  const { error } = await supabase
    .from(CONTRACTS_TABLE)
    .upsert(payload, { onConflict: 'contract_id' });

  if (isMissingSupabaseTableError(error)) return false;
  if (error) throw new Error(`[baseCgRetraiteRepository] upsert error: ${error.message}`);
  await syncBaseCgRetraiteDocuments(contract);
  return true;
}

export async function deleteBaseCgRetraiteSupabaseContract(id: string): Promise<boolean> {
  const { error } = await supabase
    .from(CONTRACTS_TABLE)
    .update({
      is_deleted: true,
      updated_at: new Date().toISOString(),
    })
    .eq('contract_id', id);

  if (isMissingSupabaseTableError(error)) return false;
  if (error) throw new Error(`[baseCgRetraiteRepository] delete error: ${error.message}`);
  return true;
}
