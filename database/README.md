# Database Scripts

Organisation des scripts SQL pour Supabase.

## Accès à la base de données

### Méthodes d'accès
| Méthode | Usage | Commande |
|--------|-------|----------|
| **Dashboard** | Interface web | https://supabase.com/dashboard → Project → SQL Editor |
| **CLI** | Développement local | `supabase db shell --linked` (Docker requis) |
| **Migration** | Synchronisation | `supabase db remote commit --linked` |

### Projet SER1
- **Nom** : SER1-Simulator  
- **Référence** : `xnpbxrqkzgimiugqtago`
- **Région** : West EU (Paris)
- **CLI liée** : `supabase projects list` doit montrer le projet

## Structure

```
supabase/migrations/                 # ⭐ SOURCE DE VÉRITÉ — toutes les migrations
docs/ARCHIVE.md                      # Archive unique (legacy / preuves)
```

## Ordre d'exécution recommandé

### 1. Migrations

> **Source de vérité** : `supabase/migrations/`

| # | Fichier (supabase/migrations/) | Description |
|---|-------------------------------|-------------|
| 1 | `20260210214352_remote_commit.sql` | Snapshot complet du schéma |
| 2 | `20260211000100_harmonize_rls_tax_ps_is_admin.sql` | RLS admin fix |
| 3 | `20260211001000_create_base_contrat_settings.sql` | Table base_contrat |
| 4 | `20260211100100_p0_02_rls_profiles_per_cabinet.sql` | RLS profiles multi-tenant |
| 5 | `20260211100200_p0_01_disable_self_signup.sql` | Self-signup désactivé (reminder) |

> **Note** : L'historique des migrations legacy est disponible via `git log`.

### 2. Archives legacy (lecture seule)

Les anciens scripts de setup ont été archivés dans l'archive unique:

- `docs/ARCHIVE.md#legacy-sql-setup`

Ils ne doivent plus être rejoués comme source active de migration.

## Commandes CLI essentielles

```bash
# Vérifier la connexion au projet
supabase projects list
supabase status

# Synchroniser le schéma distant vers local
supabase db remote commit --linked
supabase migration list

# Développement local (Docker requis)
supabase start
supabase db reset
supabase stop
```

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
