# Documentation SER1 — Index

> Point d'entrée unique. Voir aussi [ROADMAP_SAAS_V1.md](ROADMAP_SAAS_V1.md) (produit/tech).

## Produit & Roadmap

| Document | Description |
|----------|-------------|
| [ROADMAP_SAAS_V1.md](ROADMAP_SAAS_V1.md) | Roadmap SaaS complète (phases 0-4, gouvernance, architecture) |
| [fiscality-product-catalog.md](fiscality-product-catalog.md) | Catalogue produits fiscaux |
| [CHANGELOG.md](CHANGELOG.md) | Journal des releases |

## Design System & Thème

| Document | Description |
|----------|-------------|
| [design/color-governance.md](design/color-governance.md) | Tokens C1-C10, exceptions, contraste — **obligatoire** avant modif couleur |
| [design/ui-governance.md](design/ui-governance.md) | Standards Layout, Inputs, Typo, Composants |
| [design/base-contrat-spec.md](design/base-contrat-spec.md) | Spec UI base contrat / référentiel produits |
| [theme/architecture.md](theme/architecture.md) | ThemeProvider, hiérarchie couleurs |
| [theme/cabinet-themes.md](theme/cabinet-themes.md) | Thèmes cabinet, cache, invalidation |
| [theme/troubleshooting.md](theme/troubleshooting.md) | Debug thème |

## Sécurité

| Document | Description |
|----------|-------------|
| [technical/security-user-metadata-guidelines.md](technical/security-user-metadata-guidelines.md) | app_metadata vs user_metadata — **obligatoire** |
| [technical/observability-conventions.md](technical/observability-conventions.md) | Logs techniques, zéro PII, debug flags |

## API & Admin

| Document | Description |
|----------|-------------|
| [technical/api/admin-function.md](technical/api/admin-function.md) | Référence Edge Function admin |
| [technical/admin/cors-setup.md](technical/admin/cors-setup.md) | Configuration CORS admin |
| [technical/admin/edge-functions-testing.md](technical/admin/edge-functions-testing.md) | Test Edge Functions |

## Runbook & Diagnostics

| Document | Description |
|----------|-------------|
| [runbook/debug.md](runbook/debug.md) | Flags DEBUG, politique console |
| [technical/diagnostics/edge-functions-diagnostics.md](technical/diagnostics/edge-functions-diagnostics.md) | Debug Edge Functions Supabase |

## Reporting & JSON snapshots

| Document | Description |
|----------|-------------|
| [ROADMAP_SAAS_V1.md](ROADMAP_SAAS_V1.md) | État d'avancement des snapshots `.ser1`, quality gates et plan de reprise |
| [README.md](../README.md) | Références opérationnelles (exports, commandes, troubleshooting) |

## Modules métier

| Document | Description |
|----------|-------------|
| [features/ir.md](features/ir.md) | Module IR : architecture feature/engine, flow, gouvernance et tests |
| [features/placement.md](features/placement.md) | Module Placement : architecture, flow, gouvernance et tests |

## Sources de vérité (résumé)

- **Roadmap produit/tech** : `docs/ROADMAP_SAAS_V1.md`
- **Gouvernance UI/Couleurs** : `docs/design/ui-governance.md`, `docs/design/color-governance.md`
- **Module IR** : `docs/features/ir.md`
- **Module Placement** : `docs/features/placement.md`
- **JSON local (.ser1) / reporting** : `src/reporting/json-io/` (code) + sections roadmap correspondantes
- **Exports PPTX/Excel** : `src/pptx/` et `src/utils/xlsxBuilder.ts` (code) + ADR/roadmap

## Architecture Decision Records

| Document | Description |
|----------|-------------|
| [adr/ADR-001-pptx-template-strategy.md](adr/ADR-001-pptx-template-strategy.md) | Stratégie PPTX : template codé vs natif |

## Migrations (source de vérité)

Source unique : **`supabase/migrations/`**. Voir aussi [database/README.md](../database/README.md) pour le setup initial.
