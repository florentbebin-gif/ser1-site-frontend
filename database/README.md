# Database Scripts

Organisation des scripts SQL pour Supabase.

## Structure

```
database/
├── setup/       # Configuration initiale (à exécuter UNE SEULE FOIS)
├── migrations/  # Scripts reproductibles (source de vérité DB)
└── fixes/       # Scripts one-shot (corrections ponctuelles)
```

## Ordre d'exécution recommandé

### 1. Setup initial (nouveau projet)

```sql
-- Exécuter dans Supabase SQL Editor
-- 1. Schema de base
database/setup/supabase-setup.sql
```

### 2. Migrations (dans l'ordre)

| # | Fichier | Description |
|---|---------|-------------|
| 1 | `create-cabinets-themes-logos.sql` | Tables cabinets, themes, logos + fonction `is_admin()` |
| 2 | `create-logos-bucket.sql` | Bucket Storage `logos` + policies RLS |
| 3 | `create-ui-settings.sql` | Table ui_settings |
| 4 | `create_issue_reports_table.sql` | Table signalements |
| 5 | `add-rpc-get-my-cabinet-logo.sql` | RPC SECURITY DEFINER pour logos |
| 6 | `add-rpc-get-my-cabinet-theme.sql` | RPC SECURITY DEFINER pour thèmes |
| 7 | `add-user-mode.sql` | Mode utilisateur |
| 8 | `fix-storage-rls-policies.sql` | Correction policies Storage |
| 9 | `rename-ser1-classique-to-theme-original.sql` | Renommage thème |

### 3. Fixes (si nécessaire)

Scripts one-shot pour corriger des problèmes spécifiques :

| Fichier | Quand l'utiliser |
|---------|------------------|
| `fix-profiles.sql` | Réparation table profiles |
| `fix-ui-settings-duplicates.sql` | Doublons ui_settings (v1) |
| `fix-ui-settings-duplicates-v2.sql` | Doublons ui_settings (v2) |
| `fix_issue_reports_table.sql` | Réparation issue_reports |
| `check-ui-settings-rls.sql` | Diagnostic RLS ui_settings |

## ⚠️ Pièges connus

### Cache schema PostgREST (RPC 404 / PGRST202)

Après création d'une RPC, elle peut ne pas être visible immédiatement :

```sql
-- Forcer le reload du schema
NOTIFY pgrst, 'reload schema';
```

Ou redémarrer le projet Supabase via Dashboard > Settings > General > Restart project.

### Bucket "logos" not found

Si le bucket n'existe pas après migration :
1. Vérifier que `create-logos-bucket.sql` a été exécuté
2. Vérifier dans Dashboard > Storage que le bucket existe
3. Vérifier les policies RLS dans Dashboard > Storage > Policies

### Fonction `is_admin()` non trouvée

La fonction est créée dans `create-cabinets-themes-logos.sql`. Vérifier :
```sql
SELECT proname FROM pg_proc WHERE proname = 'is_admin';
```
