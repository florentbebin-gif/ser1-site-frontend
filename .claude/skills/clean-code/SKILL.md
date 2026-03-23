---
description: Post-implementation clean code review — auto-triggered after implementing a feature, fixing a bug, or refactoring code. Verify file sizes, structure, and quality standards.
---

# Clean Code Review

After making changes, run this skill to verify code quality.

## Process

### 1. File size check
For each modified/created file, count lines and apply thresholds:
- **Under 400 lines**: good, no action needed.
- **400–500 lines**: warning — note it but continue.
- **Over 500 lines**: flag as tech debt. Check if the file mixes multiple responsibilities:
  - UI orchestration / state / effects
  - Business logic / data transforms
  - Persistence / network / I/O
  - Large inline JSX / modals
  If yes, propose an extraction plan with specific function/component boundaries.
- **Over 800 lines**: split is mandatory before completing the task.

### 2. Convention checks
- No new `console.log/info/debug` statements (only `console.error/warn` for real errors).
- All `TODO`/`FIXME` comments have issue IDs: `TODO(#123): description`.
- New files are `.ts/.tsx` (not `.js/.jsx`).
- Imports use `@/` for cross-module references.
- No cross-feature CSS imports.

### 3. Validation
Run `npm run check` to confirm no regressions.

### 4. Report
Output a summary: files checked, warnings found, fixes applied.
