# Gouvernance migrations DB (P0-07)

## Objectif

Unifier la source de vérité des migrations SQL pour éviter les divergences entre scripts historiques et schéma appliqué.

## Source canonique

- **Canon unique**: `supabase/migrations/`
- Toute nouvelle évolution DB (schema, RLS, fonctions SQL) doit être ajoutée via un fichier horodaté dans ce répertoire.

## Statut de l'historique legacy

Les scripts `database/setup/*` sont archivés en lecture seule dans:

- `docs/_legacy/database/setup/admin_setup.sql`
- `docs/_legacy/database/setup/supabase-setup.sql`

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

## Règles de contribution

1. Ne pas ajouter de nouveaux SQL dans `database/setup/`.
2. Créer une migration par changement atomique dans `supabase/migrations/`.
3. Documenter le rollback dans le SQL si risque moyen/haut.
4. Éviter toute action destructive sur l'environnement prod sans procédure validée.

## Contrôles recommandés

- `supabase migration list`
- revue diff SQL en PR
- vérification policies live (`pg_policies`) en lecture seule sur env cible
