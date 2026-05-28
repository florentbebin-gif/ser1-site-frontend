-- Les fonctions Base CG ci-dessous sont internes aux triggers SQL.
-- Elles doivent rester SECURITY DEFINER pour maintenir row_hash/catalog_meta,
-- mais ne doivent pas être appelables via /rest/v1/rpc par anon/authenticated.

REVOKE EXECUTE ON FUNCTION public.set_base_cg_retraite_contract_row_hash()
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.refresh_base_cg_retraite_catalog_meta()
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.refresh_base_cg_retraite_catalog_meta_trigger()
  FROM PUBLIC, anon, authenticated;
