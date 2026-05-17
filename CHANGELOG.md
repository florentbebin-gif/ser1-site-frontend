# Changelog

## [1.1.0](https://github.com/florentbebin-gif/ser1-site-frontend/compare/v1.0.0...v1.1.0) (2026-05-14)

### Features

- **settings:** appliquer le mode effectif aux simulateurs ([1199f23](https://github.com/florentbebin-gif/ser1-site-frontend/commit/1199f239ad2ef552cbce81def9b46f8db9ec719f))

### Bug Fixes

- **credit:** respecter l’override local du mode expert ([bd9f4e9](https://github.com/florentbebin-gif/ser1-site-frontend/commit/bd9f4e9e34ab879c499d20af7fb2bf1da12c00bf))

## 1.0.0 (2026-05-14)

Version initiale stabilisée de SER1.

### Points principaux

- Stabilisation des simulateurs IR, Succession, Placement, Crédit, PER, Stratégie et Trésorerie société.
- Centralisation de la chaîne fiscale autour des settings Supabase, caches applicatifs et valeurs par défaut contrôlées.
- Mise en place du référentiel Base-Contrat avec libellés fiscaux dynamiques et statut de revue administrable.
- Renforcement Supabase : RLS, fonctions admin, migrations de sécurité, checks Deno et garde-fous schéma.
- Structuration des exports PPTX/XLSX et des snapshots métier pour les livrables patrimoniaux.
- Ajout des fondations DevX et production : CI étendue, observabilité opt-in, Storybook, Lighthouse CI, coverage et Release Please.
- Nettoyage du legacy runtime et réduction du code mort avant la poursuite de la roadmap SER1.
