# SER1 — Agent Rules & Project Context

## Project context

SER1 : simulateurs fiscaux pour CGP (IR, Succession, Placement, Crédit, Stratégie).
Stack : React 18 + Vite 5 + TypeScript strict + Supabase (Auth/DB/Edge Functions).
CI gate : `npm run check` — doit passer avant tout commit.

### Chaîne fiscale — ne jamais bypasser

```text
Supabase (tax_settings, ps_settings, fiscality_settings)
  → src/utils/cache/fiscalSettingsCache.ts
    → src/hooks/useFiscalContext.ts
      → src/constants/settingsDefaults.ts (fallbacks)
```

Jamais hardcoder de valeurs fiscales (17.2, 100000, 15932, 12.8, 30).
Jamais lire Supabase directement depuis un composant React.

### Règles techniques (`.claude/rules/`) — auto-chargées

- `base.md` — environnement & langue
- `component-structure.md` — structure composants React

### Règles techniques (`.claude/rules-library/`) — lecture à la demande

- `fiscal-engine.md` — moteur fiscal (interdits + patterns requis) → lire si la tâche touche `src/engine/`, les calculs fiscaux, IR, succession, PS, PFU
- `supabase-patterns.md` — patterns Supabase & auth → lire si la tâche touche Supabase, RLS, migrations, auth, admin

### Pour aller plus loin (lire selon le contexte — voir CLAUDE.md)

- Architecture détaillée : `docs/ARCHITECTURE.md`
- Règles métier fiscales : `docs/METIER.md`
- UI / thème / couleurs : `docs/GOUVERNANCE.md`
- Exports / PPTX / Excel : `docs/GOUVERNANCE_EXPORTS.md`
- Conventions humains / workflow git : `.github/CONTRIBUTING.md`

---

### Skills disponibles — lecture à la demande

Les skills sont dans `.claude/skills-library/`. **Ne lire un skill que si la demande le justifie directement.** Lire le fichier avec l'outil Read, puis appliquer les instructions qu'il contient.

| Skill | Fichier | Lire quand… |
| --- | --- | --- |
| `arch-check` | `.claude/skills-library/arch-check.md` | Avant une PR, après ajout de fichiers dans `src/` |
| `clean-code` | `.claude/skills-library/clean-code.md` | Après implémentation d'une feature, correction de bug ou refactor |
| `fix-errors` | `.claude/skills-library/fix-errors.md` | Quand `npm run check` échoue |
| `succession-review` | `.claude/skills-library/succession-review.md` | Après modification dans `src/features/succession/` ou `src/engine/succession*` |
| `docx` | `.claude/skills-library/docx.md` | Création, lecture ou édition de fichiers `.docx` |
| `pdf` | `.claude/skills-library/pdf.md` | Toute opération sur des fichiers `.pdf` |
| `pptx` | `.claude/skills-library/pptx.md` | Toute opération sur des fichiers `.pptx` |
| `xlsx` | `.claude/skills-library/xlsx.md` | Toute opération sur des fichiers `.xlsx`, `.csv`, `.tsv` |

> Règle : si la demande ne mentionne pas ces cas, ne pas lire ces fichiers.

---

### Agent rules — always-on

Ces règles s'appliquent à tout LLM ou agent travaillant dans ce dépôt.

### 0. Environnement & langue

- **Terminal** : Windows/PowerShell. Pas de commandes macOS/Linux (`open`, `pbcopy`, `which`, chemins `/usr/...`). Utiliser les équivalents PowerShell (`Start-Process`, `Get-Command`, etc.).
- **Langue** : toujours rédiger en français, accents et apostrophes inclus. Corriger les fautes détectées dans les fichiers modifiés.

> Claude Code : ces règles sont aussi dans `.claude/rules/base.md` (auto-chargé).

### 1. Proof first

- Never claim `unused`, `dead code`, `safe to delete`, `not referenced`, `RLS OK`, or `theme OK` without concrete proof.
- Accepted proof: `rg` matches with paths, import-to-usage chain, route/entrypoint trace, policy/function snippet plus validation query.

### 2. No invented paths

- Never invent a file path.
- Locate files via search before proposing a change.
- Prefer `rg` and `rg --files`.

### 3. Minimal diffs

- No refactor for fun.
- Prefer the smallest safe patch that solves the real problem.
- Keep commits and PRs atomic when possible.

### 4. Default UI discipline

- Default to SER1 premium UI consistency when touching UI, even if the request says only `polish`.
- No hardcoded colors except repo-approved exceptions documented in `docs/GOUVERNANCE.md`.
- Reuse shared styles and tokens before creating new CSS.
- Keep icons inline SVG with `stroke="currentColor"` and `fill="none"`.

### 5. Docs discipline

- If behavior, architecture, conventions, or operator workflow change, update the relevant docs in the same patch.
- Read `README.md` first for sources of truth when a change affects structure or conventions.

### 6. Security and Supabase

- Do not rely on frontend gating alone for permissions.
- Treat RLS, role checks, auth flows, and Edge Functions as high-risk areas.
- Follow repo standard: use `app_metadata`, not `user_metadata`, for authorization decisions.

### 7. Recommended search patterns

- Routing and entrypoints: `rg "Routes|createBrowserRouter|path:|navigate\\(|Link to=" src -n`
- Settings and admin flows: `rg "SettingsComptes|UsersAdmin|SettingsImpots|SettingsFiscalites|SettingsPrelevements" src -n`
- Hardcoded colors: `rg "#[0-9A-Fa-f]{3,6}" src -n`
- Supabase policies and RLS: `rg "create policy|alter policy|enable row level security|security definer|search_path|rls" supabase -n`

### 8. Output expectations

- For analysis or review work, include:
  - summary
  - findings with proofs
  - minimal patch plan or patch
  - verification steps
  - risks or rollback notes if relevant
