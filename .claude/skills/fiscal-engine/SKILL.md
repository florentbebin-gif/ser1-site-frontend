---
name: fiscal-engine
description: 'Appliquer automatiquement les règles SER1 de moteur fiscal et hooks fiscaux quand une tâche touche src/engine/, IR, succession, PS, PFU, settingsDefaults, useFiscalContext ou des valeurs fiscales révisables. Empêcher les hardcodes et préserver la chaîne Supabase → fiscalSettingsCache → useFiscalContext → settingsDefaults.'
user-invocable: false
paths:
  - 'src/engine/**'
  - 'src/features/**/use*.ts'
  - 'src/constants/settingsDefaults.ts'
---

# Fiscal Engine Rules

## Forbidden patterns

- No hardcoded fiscal values: `17.2` (PS rate), `100000` (abattement), `15932` (abattement frere/soeur), `12.8` (PFU IR), `30` (PFU total). CI enforces this via `npm run check:fiscal-hardcode`.
- No direct Supabase reads: no `import { createClient }` or `supabase.from(...)` in engine files.
- No React in engine: no hooks, no JSX, no state.

## Required patterns

- Use `src/constants/settingsDefaults.ts` for fallback values (single source of truth).
- Use `src/hooks/useFiscalContext.ts` in React code (strict or stale mode).
- Use `src/utils/cache/fiscalSettingsCache.ts` in non-React code.
- Engine functions must be pure: input → output, no side effects.

## Key files

- `src/constants/settingsDefaults.ts` — all fiscal defaults
- `src/utils/cache/fiscalSettingsCache.ts` — cache singleton (stale-while-revalidate)
- `src/hooks/useFiscalContext.ts` — unified fiscal hook
- `scripts/check-no-hardcoded-fiscal-values.mjs` — CI guardrail

## Testing

- Des golden tests existent pour IR et succession (valeurs de référence dans les skills). Toute modification de logique fiscale doit les laisser passer.
- Run `npm run check:fiscal-hardcode` after any change to verify.
- Tout nouveau fichier `src/engine/**/*.ts` doit être accompagné d'un test unitaire dans `__tests__/*.test.ts` (au moins 3 cas : nominal, bord, erreur).
