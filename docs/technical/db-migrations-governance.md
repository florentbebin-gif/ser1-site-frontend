# Gouvernance migrations DB (P0-07)

## Objectif

Unifier la source de vérité des migrations SQL pour éviter les divergences entre scripts historiques et schéma appliqué.

## Source canonique

- **Canon unique**: `supabase/migrations/`
- Toute nouvelle évolution DB (schema, RLS, fonctions SQL) doit être ajoutée via un fichier horodaté dans ce répertoire.

## Statut de l'historique legacy

Les scripts `database/setup/*` (historique) sont archivés en lecture seule dans l'archive unique:

- `docs/ARCHIVE.md#legacy-sql-setup`

Ces fichiers ne doivent plus être exécutés comme source active de migration.

## Workflow local (safe)

```bash
supabase start
supabase db reset
supabase migration list
```

Puis vérifier:

1. l'app démarre (`npm run dev`)
2. les pages critiques s'ouvrent
3. `npm run check` passe

## Local dev must pass (bloquant)

Toute évolution migrations est considérée incomplète tant que ce parcours ne passe pas localement:

```bash
supabase stop --no-backup
supabase start
supabase db reset
supabase migration list
```

## Incident connu: storage.prefixes

- Symptôme observé: `supabase start` échouait sur `relation "storage.prefixes" does not exist`.
- Cause: migration snapshot `20260210214352_remote_commit.sql` contenait des `drop trigger ... on storage.prefixes` non guardés.
- Correctif appliqué: guard `to_regclass(...)` autour des statements `storage.objects` / `storage.prefixes`.
- Rationale sécurité: le correctif est idempotent et n'altère pas la prod existante; il évite seulement un échec local quand l'objet n'existe pas.

## Règles de contribution

1. Ne pas ajouter de nouveaux SQL dans `database/setup/`.
2. Créer une migration par changement atomique dans `supabase/migrations/`.
3. Documenter le rollback dans le SQL si risque moyen/haut.
4. Éviter toute action destructive sur l'environnement prod sans procédure validée.

## Contrôles recommandés

- `supabase migration list`
- revue diff SQL en PR
- vérification policies live (`pg_policies`) en lecture seule sur env cible
