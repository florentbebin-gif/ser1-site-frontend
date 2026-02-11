# Base Contrat V3 — Spécification technique

## 1. Objectif

Page `/settings/base-contrat` = **référentiel administrable** des produits d'investissement (AV, CTO, PEA, PER individuel assurance) avec règles fiscales versionnées par phase (constitution, sortie, décès).

## 2. Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Supabase                                                │
│  base_contrat_settings (id=1, data jsonb)                │
│  RLS: SELECT authenticated / WRITE is_admin()            │
└──────────────┬───────────────────────────────────────────┘
               │
   ┌───────────▼───────────────────┐
   │  baseContratSettingsCache.ts  │  TTL 24h, localStorage
   │  event: ser1:base-contrat-    │
   │         updated               │
   └───────────┬───────────────────┘
               │
   ┌───────────▼───────────────────┐
   │  useBaseContratSettings.ts    │  Hook React (load/save)
   └───────────┬───────────────────┘
               │
   ┌───────────▼───────────────────┐
   │  BaseContrat.tsx              │  Page UI (accordéon,
   │  baseContratLabels.ts (FR)    │  3 colonnes, modals)
   │  baseContratTemplates.ts      │
   └───────────────────────────────┘
               │
   ┌───────────▼───────────────────┐
   │  baseContratAdapter.ts        │  extractFromBaseContrat()
   │  (feature flag OFF par défaut)│  → mêmes 16 params que
   │                               │    extractFiscalParams()
   └───────────────────────────────┘
```

## 3. Schéma JSON (`data` column)

```jsonc
{
  "schemaVersion": 1,
  "products": [
    {
      "id": "assuranceVie",          // slug unique (camelCase)
      "label": "Assurance-vie",
      "family": "Assurance",         // Assurance | Bancaire | Titres | ...
      "envelopeType": "assurance-vie",
      "holders": "PP",               // PP | PM | PP+PM
      "open2026": true,
      "sortOrder": 1,
      "isActive": true,
      "closedDate": null,
      "templateKey": "assurance-vie", // null si créé vide
      "confidenceLevel": "confirmed", // confirmed | provisional | toVerify
      "todoToConfirm": [],
      "references": [{ "label": "BOFiP", "url": null, "note": null }],
      "rulesets": [
        {
          "effectiveDate": "2025-01-01",  // ISO date
          "phases": {
            "constitution": { "applicable": true, "blocks": [...] },
            "sortie":       { "applicable": true, "blocks": [...] },
            "deces":        { "applicable": true, "blocks": [...] }
          },
          "sources": [...]
        }
      ]
    }
  ]
}
```

### Versioning

- `rulesets[]` trié par `effectiveDate` **DESC**
- `rulesets[0]` = version **active** (éditable par l'admin)
- Versions archivées = lecture seule
- "Nouvelle version" = copie profonde de `rulesets[0]` avec nouvelle `effectiveDate`, insérée en position 0

### Blocs et champs

Chaque phase contient un tableau de `blocks`. Chaque bloc contient un `payload` de `FieldDef` :

| Type | Valeur | Éditable |
|------|--------|----------|
| `number` | Nombre (ex: `152500`) | Oui |
| `boolean` | `true`/`false` | Oui |
| `enum` | String parmi `options` | Oui |
| `ref` | `$ref:table.path` | Non (résolu à la lecture) |
| `brackets` | `[{ upTo, ratePercent }]` | Oui (cellules individuelles) |
| `string` | Texte libre | Oui |
| `date` | ISO date | Oui |

## 4. Convention `$ref`

Format : `$ref:tax_settings.pfu.current.rateIR`

- Préfixe : `$ref:`
- Table : `tax_settings` ou `ps_settings` (snake_case, nom exact de la table Supabase)
- Chemin : camelCase, séparé par des points

Les refs sont **read-only** dans l'UI (fond grisé + tooltip). Le resolver lit la valeur depuis les settings chargés côté client.

## 5. Templates

Fichier : `src/constants/baseContratTemplates.ts`

| Template key | Source de vérité |
|-------------|-----------------|
| `assurance-vie` | Fixtures `fiscalitySettingsV1.json` + `settingsDefaults.ts` |
| `cto` | `fiscalitySettingsMigrator.ts` `buildCtoRules()` |
| `pea` | `fiscalitySettingsMigrator.ts` `buildPeaRules()` |
| `per-individuel-assurance` | `settingsDefaults.ts` + fixtures |

**Divergence résolue** : AV décès tranche 2 = **31.25 %** (fixture golden snapshot), et non 35 % (settingsDefaults).

## 6. Adapter et feature flag

### `extractFromBaseContrat(baseContrat, taxSettings, psSettings)`

Produit les mêmes 16 paramètres que `extractFiscalParams()` :

```
pfuIR, pfuPS, pfuTotal, psPatrimoine,
avAbattement8ansSingle, avAbattement8ansCouple,
avSeuilPrimes150k, avTauxSousSeuil8ans, avTauxSurSeuil8ans,
av990IAbattement, av990ITranche1Taux, av990ITranche1Plafond, av990ITranche2Taux,
av757BAbattement, peaAncienneteMin, dividendesAbattementPercent
```

### Feature flag

```env
VITE_USE_BASE_CONTRAT_FOR_PLACEMENT=false
```

- `false` (défaut) : `usePlacementSettings` utilise `extractFiscalParams()` — zéro changement de comportement
- `true` : charge `base_contrat_settings` et utilise `extractFromBaseContrat()`

### Tests

- `extractFromBaseContrat.test.ts` : golden snapshot identique à `extractFiscalParams.test.ts`
- 3 tests : fixture-aligned, empty settings, ref resolution

## 7. Event d'invalidation

```
window.dispatchEvent(new CustomEvent('ser1:base-contrat-updated'))
```

Émis après chaque `saveBaseContratSettings()`. Écouté par :
- `useBaseContratSettings` (reload)
- `usePlacementSettings` (quand feature flag ON)

## 8. Migration SQL

```
supabase/migrations/20260211001000_create_base_contrat_settings.sql
```

- Table `base_contrat_settings` (id=1 CHECK, data jsonb)
- RLS : SELECT authenticated, ALL is_admin()
- Trigger `set_updated_at`
- Seed : `{"schemaVersion": 1, "products": []}`

## 9. Sécurité

- Admin uniquement pour écriture (RLS `public.is_admin()`)
- Frontend : `useUserRole()` lit `app_metadata.role` uniquement (COMMIT 1 de cette branche)
- `user_metadata` n'est **jamais** utilisé pour l'autorisation
