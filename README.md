# SER1

Application web pour CGP : audit patrimonial, strategie guidee, simulateurs (IR / Placement / Credit), exports PPTX/Excel.

Stack : React 18 + Vite 5 + TypeScript + Supabase (Auth/DB/Storage/Edge Functions).

## Documentation
Sources de verite (uniquement) :
- `docs/ROADMAP.md`
- `docs/METIER.md`
- `docs/GOUVERNANCE.md` — contrat UI web, baseline `/sim/*`, theming
- `docs/GOUVERNANCE_EXPORTS.md` — contrat PPTX / Excel
- `docs/ARCHITECTURE.md`
- `docs/RUNBOOK.md`
- `.github/CONTRIBUTING.md` — conventions code, workflow git, PR checklist

Guidance agent / repo automation :
- `AGENTS.md` — regles comportementales agent (source unique, lu par tous les outils)
- `CLAUDE.md` — workflows automatiques Claude Code (reference AGENTS.md, pas de duplication)
- `.claude/rules/` — regles path-scoped (fiscal-engine, component-structure, supabase-patterns)
- `.claude/commands/` — commandes reutilisables (check, pr, fiscal-audit)
- `.claude/skills/` — skills specialises (clean-code, fix-errors)

## Quickstart

Prerequis :
- Node.js 22.x (voir `package.json > engines`)
- (Optionnel) Docker Desktop pour Supabase en local

```bash
npm install
npm run dev
```

## Variables d'environnement

Copier `.env.example` -> `.env.local` (local uniquement, gitignored).

Minimum requis :
```bash
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
```

E2E (optionnel) :
```bash
E2E_EMAIL=<email>
E2E_PASSWORD=<password>
```

## Scripts

```bash
npm run dev         # Vite dev server
npm run build       # build production
npm run preview     # preview production build

npm run lint
npm run typecheck
npm test
npm run check       # lint + typecheck + test + build
```

Optionnels :
```bash
npm run test:e2e
npm run test:e2e:ui
npm run lint:css
npm run check:css-structure
npm run check:circular
npm run check:unused  # depcheck avec ignore explicite de supabase et dependency-cruiser
```

## Repere "ou changer quoi" (code)

- Routing : `src/routes/appRoutes.ts` (APP_ROUTES) + `src/routes/settingsRoutes.ts` (settings) + rendu dans `src/App.tsx`
- Auth : `src/auth/`
- Theme : `src/settings/ThemeProvider.tsx`, `src/settings/presets.ts`
- Styles globaux : `src/styles/index.css`, `src/styles/app/`, `src/styles/premium-shared.css`
- Styles `/sim/*` : `src/styles/sim/` + `src/features/*/styles/`
- Styles settings : `src/pages/settings/styles/`
- Styles audit : `src/features/audit/styles/`
- Engine (metier pur) : `src/engine/`
- Features (UI) : `src/features/`
- Exports : `src/pptx/`, `src/utils/export/xlsxBuilder.ts`, `src/utils/export/exportFingerprint.ts`
- Edge Function admin : `supabase/functions/admin/index.ts`
- Migrations : `supabase/migrations/`
- **Referentiel contrats (Base-Contrat)** : source de verite du catalogue produits et des regles fiscales par phase (Constitution / Sortie / Deces), consommee par les calculateurs Placement, IR, et futurs (Succession, Epargne salariale, Prevoyance). Voir `docs/ROADMAP.md` sections P1-04 (Base-Contrat V3) et P1-05 (Catalogue Patrimonial V3).

## Contribution

Voir `.github/CONTRIBUTING.md`.
