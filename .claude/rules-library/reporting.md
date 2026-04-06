---
description: Rules for snapshot IO, schema and migrations in src/reporting/
globs:
  - src/reporting/**
---

# Reporting & Snapshot Rules

## Périmètre
- `src/reporting/snapshot/` gère la sérialisation/désérialisation des dossiers `.ser1` (snapshots).
- Le schéma de snapshot est versionné (`snapshotSchema.ts`) et les migrations inter-versions vivent dans `snapshotMigrations.ts`.

## Règles
- Ne jamais modifier le schéma d'un snapshot existant sans créer une migration (fonction `migrateSnapshot` dans `snapshotMigrations.ts`).
- Toute nouvelle version de schéma doit incrémenter le numéro de version et ajouter une migration depuis la version précédente.
- Les tests de migration doivent couvrir le round-trip : ancien format → migration → nouveau format → sérialisation → désérialisation.
- Le fingerprint fiscal (`exportFingerprint.ts`) est embarqué dans chaque snapshot v4+ pour détecter les changements de paramètres entre sauvegarde et rechargement.

## Fichiers clés
- `src/reporting/snapshot/snapshotSchema.ts` — définition du schéma courant
- `src/reporting/snapshot/snapshotMigrations.ts` — migrations inter-versions
- `src/reporting/snapshot/snapshotIO.ts` — lecture/écriture fichiers `.ser1`
- `src/reporting/snapshot/index.ts` — point d'entrée public
- `src/utils/export/exportFingerprint.ts` — fingerprint fiscal (consommé par `App.tsx`)
