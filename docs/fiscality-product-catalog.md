# Référentiel Produits Fiscalité — Product Catalog

## Vue d'ensemble

Le **Product Catalog** (`/settings/base-contrat`) est l'interface d'administration du référentiel des produits d'investissement et de leurs règles fiscales. Il stocke ses données dans la table Supabase `fiscality_settings` (colonne `data`, format V2).

## Architecture

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
└── rulesetsByKey{}         ← règles par produit
    └── [productKey]
        ├── effectiveDate   ← date d'entrée en vigueur
        ├── rules{}         ← arbre de règles (taux, abattements, seuils…)
        │   └── …           ← structure libre, rendu récursivement
        └── sources[]       ← références officielles
            ├── label
            ├── url
            └── note
```

## Fichiers clés

| Fichier | Rôle |
|---|---|
| `src/constants/settingsDefaults.ts` | Source unique des valeurs par défaut (tax/ps/fiscality) |
| `src/types/fiscalitySettings.ts` | Types TypeScript (Product, Ruleset, FiscalitySettingsV2…) |
| `src/utils/fiscalitySettingsMigrator.ts` | Migration V1→V2, DEFAULT_PRODUCTS, normalisation |
| `src/pages/Sous-Settings/ProductCatalog.tsx` | UI principale du catalogue (CRUD + accordion + save) |
| `src/pages/Sous-Settings/SettingsFiscalites.jsx` | UI legacy V1 (assuranceVie / perIndividuel) |
| `src/utils/fiscalSettingsCache.js` | Cache singleton + invalidation (re-exporte les defaults) |

## Labels et clés techniques

Les clés JSON ne sont **jamais renommées** dans les données. L'affichage utilise :

1. **`FIELD_LABELS`** — mapping explicite clé→libellé français (ex: `psRatePercent` → "Taux prélèvements sociaux (%)")
2. **`humanizeKey()`** — fallback pour les clés non mappées : convertit camelCase/snake_case en mots français lisibles via le dictionnaire `HUMANIZE_FR`
3. **Sub-text `(key)`** — la clé technique est toujours visible en gris à côté du libellé pour la traçabilité

## Références croisées (`$ref`)

Les taux PFU et PS dans les rulesets V2 utilisent la notation `$ref:tax_settings.pfu` / `$ref:ps_settings.patrimony` pour éviter la duplication. Ces valeurs sont affichées en lecture seule avec un tooltip explicatif.

**Règle absolue** : PFU/PS ne sont jamais dupliqués inline dans fiscality V2 — toujours via `$ref`.

## CRUD Admin

| Action | Modale | Effet |
|---|---|---|
| Ajouter un produit | Clé + libellé + holders + nature | Crée product + ruleset vide |
| Modifier le produit | Libellé + holders + nature | Met à jour les métadonnées |
| Nouvelle version | Date d'entrée en vigueur | Copie les règles, met à jour la date |
| Clôturer | Confirmation | `isActive=false`, `closedDate=today` |
| Enregistrer | Bouton chip global | Upsert `fiscality_settings` id=1 |

## RLS (Row-Level Security)

Les trois tables de paramètres utilisent le même mécanisme :

| Table | Lecture | Écriture |
|---|---|---|
| `tax_settings` | `auth.role() = 'authenticated'` | `public.is_admin()` |
| `ps_settings` | `auth.role() = 'authenticated'` | `public.is_admin()` |
| `fiscality_settings` | `auth.role() = 'authenticated'` | `public.is_admin()` |

`is_admin()` vérifie `app_metadata.role = 'admin'` dans le JWT (pas `user_metadata`, pas la table `profiles`).

## Centralisation des defaults

Tous les defaults sont dans `src/constants/settingsDefaults.ts` :

- `DEFAULT_TAX_SETTINGS` — barème IR, PFU, CEHR, CDHR, IS, DMTG
- `DEFAULT_PS_SETTINGS` — PS patrimoine, PS retraites, seuils RFR
- `DEFAULT_FISCALITY_SETTINGS` — assuranceVie (V1), perIndividuel (V1)

Les consommateurs importent depuis ce fichier unique. Le cache (`fiscalSettingsCache.js`) et l'engine (`irEngine.js`) re-exportent pour compatibilité.
