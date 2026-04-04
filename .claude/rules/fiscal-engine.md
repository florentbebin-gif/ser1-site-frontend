---
description: Rules for fiscal engine code and fiscal hooks — prevents hardcoded values and enforces the fiscal data flow
globs:
  - src/engine/**
  - src/features/**/use*.ts
  - src/constants/settingsDefaults.ts
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
