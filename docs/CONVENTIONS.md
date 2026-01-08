# Conventions d'organisation du projet SER1

Ce document décrit les conventions d'organisation des fichiers et dossiers dans le projet SER1, afin de maintenir une structure claire et cohérente.

## Structure des dossiers

### `/docs`

Contient toute la documentation du projet, organisée en sous-dossiers :

- **`/docs/guides`** : Documentation technique, guides d'installation, procédures opérationnelles.
  - Exemples : `README-SUPABASE.md`, `test_edge_function.md`, etc.

- **`/docs/diagnostics`** : Rapports de diagnostic, analyses de bugs, notes techniques.
  - Exemples : `THEME_FIX_REPORT.md`, `UX_RECOMMENDATIONS.md`, etc.

### `/supabase/sql`

Scripts SQL organisés par fonction :

- **`/supabase/sql/schema`** : Création de tables et structures de base.
  - Exemples : `admin_setup.sql`, `create-ui-settings.sql`, etc.

- **`/supabase/sql/rls`** : Politiques de sécurité Row Level Security.
  - Exemples : `check-ui-settings-rls.sql`, `fix_issue_reports_rls.sql`, etc.

- **`/supabase/sql/fixes`** : Scripts correctifs pour la base de données.
  - Exemples : `fix-profiles.sql`, `fix-ui-settings-duplicates.sql`, etc.

### `/assets/docs`

Ressources non-code utilisées dans la documentation :

- **`/assets/docs/screens`** : Captures d'écran.
- **`/assets/docs/branding`** : Logos et éléments de marque.
- **`/assets/docs/data`** : Fichiers de données d'exemple ou de référence.

### `/Corbeille`

**Dossier de quarantaine temporaire** pour les éléments à ne pas versionner mais conservés temporairement :

- Contient des artefacts de build (`dist/`) et autres fichiers générés qu'on souhaite conserver temporairement avant validation.
- **Non versionné** (inclus dans `.gitignore`).
- À vider après validation que les éléments ne sont pas nécessaires.

## Bonnes pratiques

1. **Racine du projet** : Garder uniquement les fichiers essentiels (config, README principal).
2. **Documentation** : Toujours placer les nouveaux documents dans `/docs/guides` ou `/docs/diagnostics`.
3. **Scripts SQL** : Classer par fonction (schema/rls/fixes) dans `/supabase/sql/`.
4. **Artefacts de build** : Ne jamais commiter `dist/`, `node_modules/` ou autres dossiers générés.

## Remarque sur `dist/`

Le dossier `dist/` est un artefact de build généré par Vite et ne doit jamais être versionné. Il est recréable à tout moment via `npm run build`.
