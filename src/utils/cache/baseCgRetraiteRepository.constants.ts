export const CONTRACTS_TABLE = 'base_cg_retraite_contracts';
export const DOCUMENTS_TABLE = 'base_cg_retraite_documents';
export const DOCUMENTS_BUCKET = 'base-cg-retraite-cg';
// 5 minutes : confort de copie-colle, reste sécurisé (bucket privé, URL non re-distribuable).
export const SIGNED_URL_TTL_SECONDS = 300;
export const CONTRACTS_SELECT = [
  'contract_id',
  'source_id',
  'company',
  'contract_name',
  'contract_type',
  'per_compartment',
  'contract_data',
  'row_hash',
  'is_deleted',
  'updated_at',
].join(', ');
export const DOCUMENTS_SELECT = [
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

export function isMissingSupabaseTableError(
  error: { message?: string; code?: string } | null | undefined,
): boolean {
  if (!error) return false;
  const message = error.message ?? '';
  return (
    error.code === '42P01' ||
    message.includes('does not exist') ||
    message.includes('Could not find the table') ||
    message.includes('schema cache')
  );
}
