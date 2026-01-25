# Preuve de suppression du duplicate supabase/functions/admin/

**Date**: 2026-01-25  
**Commit**: 501b58f  
**Action**: Suppression de `supabase/functions/admin/` (duplicate de `config/supabase/functions/admin/`)

## Fichiers supprimés

```
supabase/functions/admin/
├── .npmrc (224 bytes)
├── cors.ts (1376 bytes)
├── cors_test.ts (1283 bytes)
├── deno.json (23 bytes)
└── index.ts (41622 bytes)
```

## Preuve MD5 - index.ts (fichier principal)

```powershell
# Extraction des versions pré-suppression (commit 501b58f^)
PS> git show 501b58f^:supabase/functions/admin/index.ts > temp_old_index.ts
PS> git show 501b58f^:config/supabase/functions/admin/index.ts > temp_config_index.ts

# Hash MD5
PS> Get-FileHash temp_old_index.ts -Algorithm MD5
Algorithm Hash
--------- ----
MD5       71FB4F6A52E6DDAAB7B113FD3656ABB6

PS> Get-FileHash temp_config_index.ts -Algorithm MD5
Algorithm Hash
--------- ----
MD5       71FB4F6A52E6DDAAB7B113FD3656ABB6

✅ IDENTIQUE (41622 bytes)
```

## Diff byte-à-byte

```powershell
PS> diff temp_old_index.ts temp_config_index.ts
(aucune différence)
```

## Conclusion

Les fichiers `supabase/functions/admin/` étaient des copies strictes de `config/supabase/functions/admin/`.

**Source de vérité établie**: `config/supabase/functions/admin/`  
**Commande de déploiement**: `npx supabase functions deploy admin --workdir config --project-ref PROJECT_REF`

## Références

- Commit de suppression: 501b58f
- README.md (lignes 82-88, 103-107): commande avec `--workdir config` documentée
- database/README.md: pas d'impact (Edge Functions hors scope SQL)
