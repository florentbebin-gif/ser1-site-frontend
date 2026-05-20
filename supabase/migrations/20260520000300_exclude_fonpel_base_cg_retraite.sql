-- Migration corrective : FONPEL est un régime élus locaux hors périmètre PER PACTE.
-- Elle nettoie les environnements ayant appliqué une première version de l'import
-- 20260520000200 qui contenait FONPEL. Sur une base fraîche corrigée, elle est no-op.

DELETE FROM public.base_cg_retraite_documents
WHERE contract_id = 'fonpel-per-points-2014-fonpel-cg'
   OR storage_path LIKE 'fonpel/%'
   OR id = 'fonpel-per-points-2014-fonpel-cg-notice_information-2015-2e5a333a';

UPDATE public.base_cg_retraite_overrides
SET
  contract_data = '{"id":"fonpel-per-points-2014-fonpel-cg"}'::jsonb,
  is_deleted = true,
  updated_at = now()
WHERE contract_id = 'fonpel-per-points-2014-fonpel-cg';
