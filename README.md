# SER1

Application web pour CGP : audit patrimonial, stratégie guidée, simulateurs IR, Succession, Placement, Crédit, PER et Trésorerie société, exports PPTX/Excel.

Stack : React 19 + React Router 7 + Vite 8 + TypeScript 6 + Supabase (Auth/DB/Storage/Edge Functions).

## Documentation

Sources de vérité :

- `docs/ROADMAP.md`
- `docs/METIER.md`
- `docs/GOUVERNANCE.md` — contrat UI web, baseline `/sim/*`, theming
- `docs/GOUVERNANCE_EXPORTS.md` — contrat PPTX / Excel
- `docs/ARCHITECTURE.md`
- `docs/RUNBOOK.md`
- `.github/CONTRIBUTING.md` — conventions code, workflow git, PR checklist

Guidance agent / repo automation :

- `AGENTS.md` — règles comportementales agent (source unique, lu par tous les outils)
- `CLAUDE.md` — workflows automatiques Claude Code (référence AGENTS.md, pas de duplication)
- `.claude/rules/` — règles auto-chargées de base
- `.claude/rules-library/` — règles spécialisées à lire selon la tâche (`fiscal-engine`, `reporting`, `supabase-patterns`)
- `.claude/commands/` — commandes réutilisables (check, pr, fiscal-audit)
- `.claude/skills-library/` — skills spécialisés (clean-code, fix-errors, exports)

## Quickstart

Prérequis :

- Node.js 22.22.1 (voir `package.json > engines`)
- npm 11.12.0 (`packageManager` + `engine-strict=true` ; `engines.npm` accepte aussi npm 10.9.7+ pour l'empaquetage interne Vercel)
- (Optionnel) Docker Desktop pour Supabase en local

```powershell
npm install
npm run dev
```

## Versions supportées

- Runtime frontend : React 19, React Router 7 en mode déclaratif, Vite 8.
- Typage et qualité : TypeScript 6, ESLint 9, Stylelint 17.
- Runtime local/CI : Node 22.22.1, npm 11.12.0. Vercel utilise `npx npm@11.12.0 ci` pour l'installation preview, puis peut empaqueter les fonctions avec npm 10.9.7+.
- Supabase : `@supabase/supabase-js` 2.106.x, CLI Supabase 2.100.x, Edge Function admin en Deno 2 autonome.
- ESLint 10 est volontairement différé tant que `eslint-plugin-react` et `eslint-plugin-jsx-a11y` ne déclarent pas sa compatibilité.

## Variables d'environnement

Copier `.env.example` vers `.env.local` (local uniquement, gitignored).

Minimum requis :

```powershell
VITE_SUPABASE_URL=<supabase_project_url>
VITE_SUPABASE_ANON_KEY=<anon_key>
```

E2E (optionnel) :

```powershell
E2E_EMAIL=<email>
E2E_PASSWORD=<password>
```

## Scripts

```powershell
npm run dev         # Vite dev server
npm run build       # build production
npm run preview     # preview production build

npm run lint
npm run typecheck
npm test
npm run check       # lint + typecheck + tests unitaires + build + garde-fous archi/fiscal/CSS/unused
```

Sous-checks isolés :

```powershell
npm run test:e2e
npm run test:e2e:ui
npm run lint:css
npm run check:css-structure
npm run check:circular
npm run check:unused  # depcheck avec ignore explicite de supabase et dependency-cruiser
```

## Repère "où changer quoi" (code)

- Routing : React Router 7 en mode déclaratif, `src/routes/appRoutes.ts` (APP_ROUTES) + `src/routes/settingsRoutes.ts` (settings) + rendu dans `src/App.tsx`
- Auth : `src/auth/`
- Theme : `src/settings/ThemeProvider.tsx`, `src/settings/presets.ts`
- Styles globaux : `src/styles/index.css`, `src/styles/app/`, `src/styles/premium-shared.css`
- Styles `/sim/*` : `src/styles/sim/` + `src/features/*/styles/`
- Styles settings : `src/pages/settings/styles/`
- Styles audit : `src/features/audit/styles/`
- Engine (métier pur) : `src/engine/`
- Features (UI) : `src/features/`
- Exports : `src/pptx/`, `src/utils/export/xlsxBuilder.ts`, `src/utils/export/exportFingerprint.ts`
- Edge Function admin : `supabase/functions/admin/index.ts`
- Migrations : `supabase/migrations/`
- **Référentiel contrats (Base-Contrat)** : catalogue produits et règles fiscales par phase (constitution / sortie / décès). Les libellés fiscaux critiques sont rendus depuis le dossier fiscal via `useFiscalContext()` côté page settings, sans dépendance React/Supabase dans `src/domain/`.

## Contribution

Voir `.github/CONTRIBUTING.md`.
