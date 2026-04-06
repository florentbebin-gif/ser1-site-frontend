---
description: Rules for React component files — enforces size limits, naming, and architecture boundaries
globs:
  - src/features/**/*.tsx
  - src/pages/**/*.tsx
  - src/components/**/*.tsx
  - src/engine/**/*.ts
---

# Component Structure Rules

## File size
- Under 400 lines: good.
- 400–500 lines: approaching limit, flag as warning.
- Over 500 lines: flag as tech debt, suggest split if multiple responsibilities.
- Over 800 lines: must split at next opportunity.

## Naming and exports
- File name: `PascalCase.tsx` for components.
- Main component: `export default function ComponentName`.
- Sub-components and helpers: named exports.
- New files must be `.tsx` (not `.jsx`). Enforced by `npm run check:no-js`.

## Architecture boundaries
- No fiscal calculations in React components — calculations belong in `src/engine/`.
- No direct Supabase calls from feature components — use hooks or `adminClient`.
- CSS: no cross-feature imports. Shared styles go to `src/styles/`.
- Imports: `@/` for cross-module, relative for local.

## TypeScript
- Import types from source modules, not Providers.
- Avoid `any` — use proper typing or `unknown` with narrowing.
