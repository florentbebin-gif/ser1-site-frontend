# Référentiel Produits Fiscalité — Product Catalog

## Vue d'ensemble

Deux versions coexistent temporairement :

| Version | Table | Page | État |
|---------|-------|------|------|
| **V2** | `fiscality_settings` | `legacy/ProductCatalog.tsx` (archivé) | Legacy — conservé pour rollback |
| **V3** | `base_contrat_settings` | `BaseContrat.tsx` | **Actif** — référentiel contrats |

Le **Product Catalog V3** (`/settings/base-contrat`) remplace V2 avec :
- Modèle "phase" (constitution / sortie / décès) au lieu d'arbre libre
- Versioning par `rulesets[]` au lieu de `rulesetsByKey` singleton
- Templates pré-remplissage (AV/CTO/PEA/PER)
- Adaptateur `extractFromBaseContrat()` pour le simulateur Placement
- Feature flag `VITE_USE_BASE_CONTRAT_FOR_PLACEMENT`
- Slug validation et cycle de vie (clôturer / réactiver / supprimer) → voir [`base-contrat-spec.md` §10-11](design/base-contrat-spec.md)

## Architecture V3 (base_contrat_settings)

```
base_contrat_settings.data (V3)
├── schemaVersion: 1
└── products[]
    ├── id, label, family, envelopeType, holders
    ├── rulesets[]                    ← versioning array
    │   ├── effectiveDate (ISO)
    │   ├── phases: { constitution, sortie, deces }
    │   │   └── blocks[]
    │   │       ├── blockId, blockKind, uiTitle, audience
    │   │       └── payload: { fieldKey: FieldDef }
    │   └── sources[]
    └── ...

FieldDef = { type: 'number'|'boolean'|'enum'|'ref'|'brackets', value, unit?, calc?, options? }
```

## Convention `$ref` (repo-wide)

Format : `$ref:tax_settings.pfu.current.rateIR`

- Table : `tax_settings` ou `ps_settings` (snake_case, nom exact table Supabase)
- Chemin : camelCase, points comme séparateurs
- Résolu à la lecture (hydratation) — jamais stocké en dur dans V3

## Fichiers clés V3

| Fichier | Rôle |
|---|---|
| `src/types/baseContratSettings.ts` | Types TypeScript (Phase, Block, FieldDef, VersionedRuleset…) |
| `src/utils/baseContratSettingsCache.ts` | Cache dédié (TTL 24h, localStorage, event d'invalidation) |
| `src/hooks/useBaseContratSettings.ts` | Hook React load/save/invalidate |
| `src/pages/Sous-Settings/BaseContrat.tsx` | UI principale (accordéon 3 colonnes, modals CRUD) |
| `src/constants/baseContratLabels.ts` | Dictionnaire FR (phases, labels, tooltips) |
| `src/constants/baseContratTemplates.ts` | Templates AV/CTO/PEA/PER avec valeurs fixtures |
| `src/utils/baseContratAdapter.ts` | `extractFromBaseContrat()` → 16 params identiques à V1 |
| `src/engine/__tests__/extractFromBaseContrat.test.ts` | Golden snapshot (mêmes valeurs que `extractFiscalParams.test.ts`) |
| `supabase/migrations/20260211001000_create_base_contrat_settings.sql` | Migration SQL (table, RLS, trigger, seed) |

## Migration V2 → V3 (manuelle)

La V2 (`fiscality_settings`) reste en place. Pour migrer un produit V2 vers V3 :
1. Créer le produit dans BaseContrat (V3) avec le template correspondant
2. Recopier manuellement les valeurs non-ref (les `$ref` sont identiques)
3. Clôturer l'ancien produit V2 si besoin

## Feature flag

```env
VITE_USE_BASE_CONTRAT_FOR_PLACEMENT=true  # Défaut : ON (et ON si variable absente)
```

- `true` : `usePlacementSettings` charge `base_contrat_settings` et utilise `extractFromBaseContrat()` (V3)
- `false` : force le legacy `extractFiscalParams()` (fiscality V1) pour debug/rollback

DoD pour activation :
- Golden snapshot tests verts
- Validation manuelle sur staging
- Backup fiscality_settings avant switch

## Architecture V2 (legacy — fiscality_settings)

> **Conservé pour rollback uniquement.** La route `/settings/base-contrat` pointe désormais sur `BaseContrat.tsx`.

```
fiscality_settings.data (V2)
├── products[]              ← catalogue de produits
│   ├── key                 ← slug unique (ex: assuranceVie)
│   ├── label               ← libellé français
│   ├── holders             ← PP | PM | PP+PM
│   ├── nature              ← Assurance | Bancaire | Titres | Immobilier | Défiscalisation | Autres
│   ├── isActive            ← true/false
│   ├── closedDate?         ← date de clôture (si inactif)
│   └── sortOrder           ← ordre d'affichage
│
└── rulesetsByKey{}         ← règles par produit (singleton par clé)
    └── [productKey]
        ├── effectiveDate   ← date d'entrée en vigueur
        ├── rules{}         ← arbre de règles (taux, abattements, seuils…)
        │   └── …           ← structure libre, rendu récursivement
        └── sources[]       ← références officielles
            ├── label
            ├── url
            └── note
```

### Labels et clés techniques V2

Les clés JSON ne sont **jamais renommées** dans les données. L'affichage utilise :

1. **`FIELD_LABELS`** — mapping explicite clé→libellé français
2. **`humanizeKey()`** — fallback camelCase/snake_case → mots français
3. **Sub-text `(key)`** — la clé technique est visible en gris

### CRUD Admin V2

| Action | Modale | Effet |
|---|---|---|
| Ajouter un produit | Clé + libellé + holders + nature | Crée product + ruleset vide |
| Modifier le produit | Libellé + holders + nature | Met à jour les métadonnées |
| Nouvelle version | Date d'entrée en vigueur | Copie les règles, met à jour la date |
| Clôturer | Confirmation | `isActive=false`, `closedDate=today` |
| Enregistrer | Bouton chip global | Upsert `fiscality_settings` id=1 |

## RLS (Row-Level Security)

Les quatre tables de paramètres utilisent le même mécanisme :

| Table | Lecture | Écriture |
|---|---|---|
| `tax_settings` | `auth.role() = 'authenticated'` | `public.is_admin()` |
| `ps_settings` | `auth.role() = 'authenticated'` | `public.is_admin()` |
| `fiscality_settings` | `auth.role() = 'authenticated'` | `public.is_admin()` |
| `base_contrat_settings` | `auth.role() = 'authenticated'` | `public.is_admin()` |

`is_admin()` vérifie `app_metadata.role = 'admin'` dans le JWT (pas `user_metadata`).

## Centralisation des defaults

Tous les defaults sont dans `src/constants/settingsDefaults.ts` :

- `DEFAULT_TAX_SETTINGS` — barème IR, PFU, CEHR, CDHR, IS, DMTG
- `DEFAULT_PS_SETTINGS` — PS patrimoine, PS retraites, seuils RFR
- `DEFAULT_FISCALITY_SETTINGS` — assuranceVie (V1), perIndividuel (V1)

Les consommateurs importent depuis ce fichier unique. Le cache (`fiscalSettingsCache.js`) et l'engine (`irEngine.js`) re-exportent pour compatibilité.
