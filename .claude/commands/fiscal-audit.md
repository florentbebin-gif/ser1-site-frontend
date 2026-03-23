Audit fiscal value alignment across the codebase.

## Steps

1. **CI guardrail** — Run `npm run check:fiscal-hardcode` and report results.

2. **Deep search** — Search for common hardcoded fiscal values that might bypass the CI check:
   - `rg "17\.2|17,2" src/ --glob "!__tests__" --glob "!settingsDefaults.ts" -n`
   - `rg "100000|100_000" src/ --glob "!__tests__" --glob "!settingsDefaults.ts" -n`
   - `rg "15932|15_932" src/ --glob "!__tests__" --glob "!settingsDefaults.ts" -n`
   - `rg "12\.8|12,8" src/ --glob "!__tests__" --glob "!settingsDefaults.ts" -n`

3. **Hook wiring** — Verify all simulators use `useFiscalContext`:
   - `src/features/ir/components/IrSimulatorContainer.jsx`
   - `src/features/succession/SuccessionSimulator.tsx`
   - `src/features/placement/components/usePlacementSimulatorController.js`
   - `src/pages/StrategyPage.jsx`

4. **Single source** — Verify `src/constants/settingsDefaults.ts` is the only file defining fiscal default values.

5. **Golden tests** — Run `npm test -- golden` to verify reference calculations.

6. **Report** — List all findings with file paths and line numbers as proof. Flag any violation.
