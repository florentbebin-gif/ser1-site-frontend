# SER1

Application web pour CGP : audit patrimonial, strategie guidee, simulateurs (IR / Placement / Credit), exports PPTX/Excel.

Stack : React 18 + Vite 5 + TypeScript + Supabase (Auth/DB/Storage/Edge Functions).

## Documentation
Sources de verite (uniquement) :
- `docs/ROADMAP.md`
- `docs/METIER.md`
- `docs/GOUVERNANCE.md`
- `docs/ARCHITECTURE.md`
- `docs/RUNBOOK.md`

Guidance agent / repo automation :
- `AGENTS.md`
- `.windsurf/rules/ser1-core-rules.md`

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
npm run check:circular
npm run check:unused  # depcheck avec ignore explicite de la CLI supabase
```

## Repere "ou changer quoi" (code)

- Routing : `src/routes/appRoutes.ts` (APP_ROUTES) + `src/routes/settingsRoutes.ts` (settings) + rendu dans `src/App.tsx`
- Auth : `src/auth/`
- Theme : `src/settings/ThemeProvider.tsx`, `src/settings/presets.ts`
- Engine (metier pur) : `src/engine/`
- Features (UI) : `src/features/`
- Exports : `src/pptx/`, `src/utils/export/xlsxBuilder.ts`, `src/utils/export/exportFingerprint.ts`
- Edge Function admin : `supabase/functions/admin/index.ts`
- Migrations : `supabase/migrations/`
- **Referentiel contrats (Base-Contrat)** : source de verite du catalogue produits et des regles fiscales par phase (Constitution / Sortie / Deces), consommee par les calculateurs Placement, IR, et futurs (Succession, Epargne salariale, Prevoyance). Voir `docs/ROADMAP.md` sections P1-04 (Base-Contrat V3) et P1-05 (Catalogue Patrimonial V3).

## Contribution

Voir `.github/CONTRIBUTING.md`.
