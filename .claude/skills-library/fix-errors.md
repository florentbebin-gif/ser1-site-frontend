---
description: Systematically fix all errors from npm run check — auto-triggered when npm run check fails. Runs the full CI pipeline and resolves failures in dependency order.
---

# Fix Errors

## Process

### 1. Diagnose
Run `npm run check` and capture full output. Identify which checks fail.

### 2. Fix in dependency order
Resolve errors following this sequence (each step may unblock the next):

1. **lint** (`npm run lint`) — Fix ESLint errors. Use `--fix` for auto-fixable ones first.
2. **fiscal-hardcode** (`npm run check:fiscal-hardcode`) — Replace hardcoded values with references to `src/constants/settingsDefaults.ts`.
3. **css-colors** (`npm run check:css-colors`) — Replace hardcoded colors with CSS variables from theme.
4. **theme-sync** (`npm run check:theme-sync`) — Sync theme tokens.
5. **no-js** (`npm run check:no-js`) — Rename `.js/.jsx` to `.ts/.tsx` and fix resulting type errors.
6. **arch** (`npm run check:arch`) — Fix dependency-cruiser violations (wrong import direction).
7. **circular** (`npm run check:circular`) — Break circular dependencies by extracting shared types or inverting dependencies.
8. **typecheck** (`npm run typecheck`) — Fix TypeScript errors.
9. **test** (`npm test`) — Fix failing tests. Read the test to understand intent before modifying.
10. **build** (`npm run build`) — Fix Vite build errors.

### 3. Verify each step
After fixing a category, re-run that specific check to confirm it passes before moving on.

### 4. Final verification
Run `npm run check` end-to-end. All checks must pass.

### 5. Report
List each error found, what was changed, and confirmation of resolution.
