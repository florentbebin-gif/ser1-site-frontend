# ROADMAP AUDIT REPO SER1 - V3

> Audit factuel du repo SER1.
>
> Date de verification : 2026-03-14
> Scope : repo complet (`src`, `api`, `docs`, `.github`, `supabase`, outillage)
> Sortie attendue : rapport factuel + backlog micro-PRs
> Principe : proof-first, pas de suppression ni de refactor sur simple intuition

---

## 0. Resume executif

- Le repo est globalement sain a auditer : `npm run check` passe, `npm run check:circular` passe, le build passe, et il n'y a pas de `.js/.jsx` dans `src`.
- Le V2 contenait de bonnes intuitions, mais melangeait des faits verifies et des decisions deja prises. Le V3 corrige surtout trois points : la vraie dette prioritaire est `@ts-nocheck`, l'heuristique "fichier < 30 lignes = a fusionner" etait trop agressive, et certaines frontieres d'architecture etaient mal formulees.
- La priorite recommandee n'est pas de lancer tout de suite des refactors larges. Il faut d'abord figer la baseline, traiter la dette de typage, puis seulement automatiser les regles de repo et simplifier la structure.

---

## PHASE 0 - Baseline factuelle

### Baseline repo

| Fait | Preuve | Impact |
|---|---|---|
| `npm run check` passe | lint + no-js + typecheck + tests + build OK le 2026-03-14 | baseline exploitable |
| `npm run check:circular` passe | `madge --circular src/` -> 0 cycle | pas de dette circulaire confirmee |
| `npm run check:unused` remonte `supabase` en devDependency | `depcheck` -> `Unused devDependencies: supabase` | review, pas suppression immediate |
| Fichiers `src/` | 392 fichiers | repo de taille moyenne, audit manuel faisable |
| Extensions `src/` | 224 `.ts`, 117 `.tsx`, 24 `.css`, 14 `.json`, 13 `.svg` | TypeScript majoritaire |
| Fichiers `.js/.jsx` dans `src/` | 0 | la convention est deja appliquee par script CI |
| Warnings ESLint | 0 warning `max-lines`, 0 error | bruit lint elimine sur ce point apres cloture PR-9 |
| `eslint-disable` hors tests | 54 occurrences | dette localisee et quantifiable |
| `console.log/debug/info/trace` hors tests | 52 occurrences dans 17 fichiers | observabilite a normaliser |
| `@deprecated` | 10 occurrences dans 6 fichiers | audit d'usage a faire avant suppression |
| `@ts-nocheck` | 0 fichier | dette de typage fermee apres PR-3 phase 4b |
| TODO/FIXME/HACK hors tests | 1 occurrence | faible dette textuelle explicite |
| `.editorconfig` | absent | gouvernance editeur non automatisee |

### Annexe `depcheck`

Resultat complet observe le 2026-03-12 :

- `Unused devDependencies`
  - `supabase`

Lecture d'audit :

- aucun autre package n'est remonte par `depcheck`
- `supabase` reste en review manuelle, car la CLI est documentee dans le runbook et utilisee dans les workflows operateurs

### Commandes de preuve

```bash
npm run check
npm run check:circular
npm run check:unused
rg --files src | Measure-Object
rg --files src -g *.js -g *.jsx
rg -n "eslint-disable" src --glob '!**/*.test.*'
rg -n "console\.(log|debug|info|trace)" src --glob '!**/*.test.*'
rg -n "^// @ts-nocheck" src
rg -n "TODO|FIXME|HACK" src --glob '!**/*.test.*'
```

### Corrections explicites du V2

- Le V2 indiquait 56 `eslint-disable` hors tests. La mesure repo actuelle donne 54 occurrences hors tests : 52 `no-console`, 1 `ser1-colors/no-hardcoded-colors`, 1 `react-hooks/exhaustive-deps`.
- Le V2 mettait surtout l'accent sur `max-lines`. Le V3 remonte `@ts-nocheck` comme dette transverse plus prioritaire.
- Le V2 utilisait une heuristique trop large sur les petits fichiers. Le V3 distingue entrypoints, type islands, wrappers utiles et vrais candidats a fusion.

---

## PHASE 1 - Reachability et code mort

### Conclusion

- Aucun fichier ne peut etre qualifie "safe to delete" uniquement avec un comptage d'import statique.
- Aucun fichier "orphelin" n'est confirme aujourd'hui avec une preuve suffisante pour suppression immediate.
- Le meilleur candidat a suppression reste `src/utils/irEngine.ts`, car il n'a qu'un consommateur prod et deux tests.

### Preuves principales

| Element | Preuve | Decision |
|---|---|---|
| `src/utils/irEngine.ts` | imports dans `src/features/ir/components/IrSimulatorContainer.tsx`, `src/utils/irEngine.parts.test.ts`, `src/features/ir/utils/incomeFilters.irEngine.test.ts` | candidat review prioritaire |
| `src/features/ir/IrPage.tsx` | route lazy via `src/features/ir/index.ts` puis `src/routes/appRoutes.ts` | garder |
| `src/features/placement/PlacementPage.tsx` | route lazy via `src/features/placement/index.ts` puis `src/routes/appRoutes.ts` | garder |
| `api/admin.js` | reference dans `src/settings/admin/invokeAdmin.ts`, `docs/RUNBOOK.md`, workflow Vercel implicite | garder |
| `supabase` devDependency | utilise dans le runbook et les workflows operateurs | review, pas suppression automatique |

### Points a auditer avec preuve avant action

- Tracer les entrypoints runtime hors `src` :
  - `src/routes/appRoutes.ts`
  - `src/routes/settingsRoutes.ts`
  - `api/admin.js`
  - `supabase/functions/admin/index.ts`
  - `package.json` scripts
  - `.github/workflows/*.yml`
- Pour tout candidat "mort", fournir :
  - chaine d'import complete
  - verification des imports dynamiques
  - verification des usages operationnels et doc

### Livrable attendu

- Une table `KEEP / REVIEW / DELETE` avec preuve associee pour chaque candidat.

---

## PHASE 2 - Typage et discipline JSX/TSX

### Conclusion

- La dette de typage est aujourd'hui la dette transverse la plus importante.
- Le repo n'a plus de `.js/.jsx` dans `src`, et aucun fichier ne contourne encore TypeScript avec `@ts-nocheck`.
- Un durcissement cible des regles `ban-ts-comment` redevient envisageable, mais seulement apres validation des autres dettes transverses.

### Repartition `@ts-nocheck`

| Zone | Volume |
|---|---|
| `src/pages/**` | 0 |
| `src/features/**` | 0 |
| `src/components/**` | 0 |
| `src/App.tsx` | 0 |
| `src/main.tsx` | 0 |

Point d'etape PR-3 :

- phase 1 mergee : `@ts-nocheck` retire de `src/main.tsx`, `src/App.tsx`, `src/components/AppErrorFallback.tsx`, `src/components/layout/AppLayout.tsx`, `src/pages/UpcomingSimulatorPage.tsx`, `src/pages/StrategyPage.tsx`, `src/components/ModeToggle.tsx`, `src/components/settings/SettingsSectionCard.tsx`, `src/components/settings/SettingsYearColumn.tsx`, `src/pages/ForgotPassword.tsx`, `src/pages/Login.tsx`
- phase 2 mergee : `@ts-nocheck` retire de `src/pages/SetPassword.tsx`, `src/components/UserInfoBanner.tsx`, `src/components/TimelineBar.tsx`, `src/components/settings/SettingsFieldRow.tsx`, `src/components/settings/SettingsTable.tsx`, `src/components/settings/PassHistoryAccordion.tsx`, `src/pages/Home.tsx`, `src/pages/SettingsShell.tsx`, `src/pages/settings/components/UserInviteModal.tsx`, `src/pages/settings/components/SettingsReportsModal.tsx`, `src/pages/settings/components/ThemeEditModal.tsx`, `src/pages/settings/components/CabinetEditModal.tsx`, `src/pages/settings/components/SettingsComptesSections.tsx`, `src/components/settings/SignalementsBlock.tsx`
- phase 3 mergee : `@ts-nocheck` retire de `src/pages/settings/Prelevements/SeuilsYearPeriod.tsx`, `src/pages/settings/Prelevements/PrelevementsSeuilsSection.tsx`, `src/pages/settings/Prelevements/PrelevementsRetraitesSection.tsx`, `src/pages/settings/Prelevements/PrelevementsPatrimoineSection.tsx`, `src/pages/settings/DmtgSuccession/ReserveCivilSection.tsx`, `src/pages/settings/DmtgSuccession/RegimesSection.tsx`, `src/pages/settings/DmtgSuccession/AvantagesMatrimoniauxSection.tsx`, `src/pages/settings/DmtgSuccession/LiberalitesSection.tsx`, `src/pages/settings/Impots/ImpotsAbattementDomSection.tsx`, `src/pages/settings/Impots/ImpotsPfuSection.tsx`, `src/pages/settings/Impots/ImpotsCehrSection.tsx`, `src/pages/settings/Impots/ImpotsISSection.tsx`, `src/pages/settings/Impots/ImpotsDmtgSection.tsx`, `src/pages/settings/DmtgSuccession/DonationSection.tsx`, `src/pages/settings/DmtgSuccession/AvDecesSection.tsx`, `src/pages/settings/SettingsImpots.tsx`, `src/pages/settings/SettingsDmtgSuccession.tsx`, `src/pages/settings/SettingsPrelevements.tsx`, `src/pages/settings/SettingsComptes.tsx`, `src/pages/Settings.tsx`, `src/pages/settings/Impots/ImpotsBaremeSection.tsx`
- phase 4a mergee : `@ts-nocheck` retire de `src/features/ir/components/IrDisclaimer.tsx`, `src/features/ir/components/IrDetailsSection.tsx`, `src/features/ir/components/IrSelect.tsx`, `src/features/placement/components/inputs.tsx`, `src/features/placement/components/tables.tsx`, `src/features/placement/components/PlacementToolbar.tsx`, `src/features/placement/components/PlacementLiquidationDetailsTable.tsx`, `src/features/placement/components/PlacementClientProfileSection.tsx`, `src/features/placement/components/PlacementEpargneSection.tsx`, `src/features/placement/components/PlacementTransmissionSection.tsx`, `src/features/placement/components/VersementConfigModal.tsx`
- phase 4b mergee : `@ts-nocheck` retire de `src/features/ir/components/IrSimulatorContainer.tsx`, `src/features/ir/components/IrFormSection.tsx`, `src/features/ir/components/IrSidebarSection.tsx`, `src/features/placement/components/PlacementInputsPanel.tsx`, `src/features/placement/components/PlacementLiquidationSection.tsx`, `src/features/placement/components/PlacementResultsPanel.tsx`, `src/features/placement/components/PlacementSimulatorPage.tsx`
- compteur repo ramene de 64 a 0

### Exemples structurants

- `src/pages/Settings.tsx`
- `src/pages/SettingsShell.tsx`
- `src/features/ir/components/IrSimulatorContainer.tsx`
- `src/features/placement/components/PlacementSimulatorPage.tsx`

### Points de gouvernance a suivre

| Sujet | Preuve | Impact |
|---|---|---|
| `allowJs: true` | `tsconfig.json` | probablement superflu vu `check:no-js`, mais a confirmer avant suppression |
| politique `.js/.jsx` | `check:no-js` dans `package.json`, `allowJs: true` dans `tsconfig.json`, docs alignees en PR-2 | garder la regle d'interdiction dans `src`, requalifier `allowJs` plus tard |
| entrypoints critiques | `src/main.tsx`, `src/App.tsx` types en PR-3 phase 1 | progression confirmee, poursuivre sur les wrappers simples |

### Premier tri initial des 18 fichiers (point de depart)

Ce tri est volontairement indicatif. Il sert a poursuivre la PR-3 sans pretendre que tous les cas sont deja qualifies.

| Famille | Lecture | Exemples |
|---|---|---|
| `migration facile` | composants locaux a surface de props encore contenue | `src/features/ir/components/IrDisclaimer.tsx`, `src/features/ir/components/IrDetailsSection.tsx`, `src/features/ir/components/IrSidebarSection.tsx`, `src/features/ir/components/IrSelect.tsx`, `src/features/placement/components/PlacementToolbar.tsx`, `src/features/placement/components/PlacementLiquidationDetailsTable.tsx` |
| `props/state a typer` | composants encore denses mais avec surface de props plus lisible que les gros orchestrateurs IR/placement | `src/features/placement/components/PlacementClientProfileSection.tsx`, `src/features/placement/components/PlacementEpargneSection.tsx`, `src/features/placement/components/PlacementTransmissionSection.tsx`, `src/features/placement/components/VersementConfigModal.tsx`, `src/features/ir/components/IrDetailsSection.tsx` |
| `legacy complexe` | orchestrateurs et gros composants metier avec surface de props importante | `src/features/ir/components/IrSimulatorContainer.tsx`, `src/features/ir/components/IrFormSection.tsx`, `src/features/placement/components/PlacementSimulatorPage.tsx`, `src/features/placement/components/PlacementInputsPanel.tsx`, `src/features/placement/components/PlacementResultsPanel.tsx` |

### Ordre recommande pour la PR-3

1. phase 1 livree : `src/main.tsx`, `src/App.tsx`
2. `migration facile`
3. `props/state a typer`
4. `legacy complexe`

### Strategie executee

1. phase 4a livree sur les composants feuille / utilitaires `IR` et `placement`
2. phase 4b livree sur les orchestrateurs `IR` et `placement`
3. compteur `@ts-nocheck` ramene a `0` avant tout durcissement de regles TypeScript
   - review `no-restricted-imports`

---

## PHASE 3 - Petits fichiers et frontieres utiles

### Conclusion

- Le seuil brut "< 30 lignes" ne suffit pas.
- Apres exclusion des barrels, icones, tests et `d.ts`, il reste 20 petits modules.
- Parmi eux, plusieurs doivent explicitement rester petits.

### Petits modules a garder

| Fichier | Pourquoi |
|---|---|
| `src/features/ir/IrPage.tsx` | entrypoint de route |
| `src/features/placement/PlacementPage.tsx` | entrypoint de route |
| `src/pages/UpcomingSimulatorPage.tsx` | wrapper de page volontairement fin |
| `src/pages/StrategyPage.tsx` | wrapper de page + garde metier |
| `src/domain/base-contrat/types.ts` | type island utile |
| `src/settings/theme/themeSourceStorage.ts` | seam de persistence theme |
| `src/engine/ir/abattement10.ts` | helper metier isole |
| `src/engine/ir/effectiveParts.ts` | helper metier isole |
| `src/engine/ir/decote.ts` | helper metier isole |
| `src/engine/placement/compare.ts` | helper metier isole |

### Candidats review, pas suppression immediate

| Fichier | Etat actuel | Note |
|---|---|---|
| `src/features/audit/steps/types.ts` | 5 lignes | peut etre inline, faible gain |
| `src/utils/number.ts` | 2 usages prod | review seulement |
| `src/utils/transmissionDisclaimer.ts` | 1 usage prod + 1 test | review seulement |
| `src/constants/colorUsageGuidelines.ts` | 2 usages prod | deplacement possible, fusion non prouvee |
| `src/constants/baseContratLabels.ts` | usage settings `BaseContrat` | review organisation |
| `src/domain/base-contrat/overrides.ts` | types + helper utilises | ne pas fusionner sans preuve |
| `src/components/settings/SettingsYearColumn.tsx` | petit composant UI utile | probablement a garder |
| `src/styles/home.css` | styles partages, pas doublon de contenu avec `src/pages/Home.css` | garder, renommage a discuter |

### Regle d'audit

Un petit fichier n'est "fusionnable" que s'il n'est ni :

- entrypoint
- barrel
- type island
- seam metier utile
- composant isole volontaire
- fichier de style partage

---

## PHASE 4 - Architecture et organisation

### Conclusion

- La structure generale du repo est bonne.
- Les vraies zones de review sont `src/utils/`, `src/constants/`, `src/services/`, `src/reporting/`, et l'organisation `pages/settings`.
- Le V2 formulait mal une frontiere : `pages` importent deja `features`, et c'est normal pour des pages orchestratrices.

### Constats structurants

| Sujet | Preuve | Lecture |
|---|---|---|
| `src/routes/settingsRoutes.ts` porte la navigation settings | lazy imports de pages settings | move aligne avec la frontiere `routes/` |
| `src/settings/userMode.ts` porte le mode global UI | lecture/ecriture de `ui_settings.mode` + hook `useUserMode` | move aligne avec la frontiere `settings/` |
| `src/settings/admin/` regroupe le bridge admin settings | `invokeAdmin` + `logoUpload` consommes par `SettingsComptes` et ses modales | move aligne le code avec le perimetre admin settings |
| `src/reporting/snapshot/` regroupe l'IO `.ser1` | schema + migrations + IO + test associe | move aligne le dossier avec le vocabulaire metier |
| `src/pages/StrategyPage.tsx` importe `../features/strategy` et `../features/audit/storage` | page -> feature existe deja | frontiere volontaire, pas anomalie |
| `src/engine -> src/features/pages` | 0 import detecte | bonne frontiere a automatiser |
| `src/features -> src/pages` | 0 import detecte | bonne frontiere a automatiser |

### Chantiers de review

- `src/utils/`
  - distinguer `cache`, `debug`, `export`, `theme`, `feature-specific`
- `src/constants/`
  - distinguer `routing`, `labels`, `theme guidance`, `defaults`
- `src/pages/settings/`
  - revoir coherence de nommage des sous-dossiers (`Impots`, `Prelevements`, `DmtgSuccession`)

### Regles a automatiser apres audit

- `engine` ne doit jamais importer `features` ni `pages`
- `features` ne doivent pas importer `pages`
- import ordering coherent

---

## PHASE 5 - Lint, CI, hooks et outillage

### Conclusion

- Le lint JS/TS est deja utile mais pas complet.
- La CI est redondante sur les checks.
- Le repo n'automatise presque rien sur CSS et Markdown.
- Il existe deux systemes de hooks Git en parallele.

### Etat actuel

| Sujet | Etat |
|---|---|
| ESLint | 0 warning `max-lines`, 0 error |
| `eslint-disable` hors tests | 54 occurrences |
| Husky | `.husky/pre-commit` avec `lint-staged` |
| hooks custom | `.githooks/pre-push` existe encore |
| CI | `npm run check` + steps individuels lint/typecheck/test/build |
| lint CSS | absent |
| lint docs/Markdown | absent |

### Rappels utiles

- `npm run check` relance deja lint, no-js, typecheck, tests et build.
- `.github/workflows/ci.yml` relance ensuite plusieurs de ces etapes separement.
- Le build actuel montre deja des chunks lourds, mais aucun budget n'est automatise.

### Regles candidates a evaluer

| Regle / outil | Statut recommande |
|---|---|
| `@typescript-eslint/consistent-type-imports` | haute priorite |
| `no-restricted-imports` | haute priorite, mais apres cartographie des frontieres |
| `import/no-duplicates` | moyenne priorite |
| `react/jsx-no-leaked-render` | moyenne priorite |
| `simple-import-sort` | moyenne priorite |
| `stylelint` | oui, priorite moyenne a haute vu 24 CSS et 127 hex colors |
| `markdownlint` | basse priorite, a revoir plus tard si la doc devient un point de friction |

### Dette de logs

- 52 `console.*` hors tests dans 17 fichiers.
- Le sujet est reel, mais un `logger.ts` n'est pas forcement la premiere PR : il faut d'abord trier debug DEV, fingerprints d'export, logs test et logs d'erreur reelle.

---

## PHASE 6 - Theme, CSS et gouvernance UI

### Conclusion

- La duplication theme est reelle et documentee dans trois endroits.
- Le V2 avait raison sur ce point, mais le vrai livrable d'audit doit d'abord cartographier les sources de verite et les exceptions.
- `src/styles/home.css` n'est pas un doublon direct de `src/pages/Home.css`.

### Preuves

| Sujet | Preuve | Impact |
|---|---|---|
| duplication `DEFAULT_COLORS` | `index.html`, `src/main.tsx`, `src/styles/index.css`, `src/settings/theme.ts` | risque de drift |
| alias CSS legacy | `--green`, `--beige`, `--bg`, `--light-green` dans `index.html` et `src/styles/index.css` | dette de compat a clarifier |
| CSS files | 24 fichiers `.css` dans `src` | gouvernance CSS importante |
| hex colors en CSS | 127 occurrences detectees | stylelint / gouvernance couleur a etudier |
| faux positif Home | `src/pages/Home.css` et `src/styles/home.css` servent des roles differents | pas de fusion automatique |

### Cibles d'audit

1. Cartographier la source de verite des tokens C1-C10.
2. Lister les exceptions autorisees aux couleurs hardcodees.
3. Distinguer :
   - fallback bootstrap
   - theme runtime React
   - styles globaux
   - exceptions UX legitimes

---

## PHASE 7 - Docs et fichiers publies sur GitHub

### Conclusion

- Les docs principales sont presentes et relativement riches.
- Les ecarts doc/regle identifies sur `.github/CONTRIBUTING.md` et `docs/ARCHITECTURE.md` ont ete corriges en PR-2.
- Aucun artefact de build ou de test inutile n'est tracke aujourd'hui.

### Verifications notables

| Sujet | Resultat |
|---|---|
| `dist/` tracke | non |
| `playwright-report/` tracke | non |
| `test-results/` tracke | non |
| `.env.local` tracke | non |
| `.env.example` tracke | oui, normal |
| `api/admin.js` tracke | oui, normal |
| `ROADMAP_AUDIT_REPO.md` tracke | oui, temporaire par nature |

### Decalages docs connus

| Fichier | Ecart |
|---|---|
| `.github/CONTRIBUTING.md` | stale sur la politique `.js/.jsx` et un exemple CSS historique -> corrige en PR-2 |
| `docs/ARCHITECTURE.md` | sections historiques `legacy`, `__spike__`, `_raw` trop verbeuses et `base_contrat_settings` mal qualifie -> corrige en PR-2 |
| `ROADMAP_AUDIT_REPO.md` V2 | contenait des metrics et hypotheses stale -> corrige par ce V3 |

### Regle d'audit

Ne marquer un fichier "inutile a publier sur GitHub" que s'il est :

- tracke
- non requis au runtime
- non requis pour l'operateur
- non requis comme evidence ou doc de reference

---

## PHASE 8 - Performance, release, securite

### Conclusion

- Le repo a deja plusieurs signaux utiles pour la performance et la release, mais peu de garde-fous automatises.
- Le build actuel montre des chunks qui meritent une revue budgetaire.
- Les sujets proxy Vercel / Supabase et outillage secret scan doivent rester dans le scope audit.

### Signaux build

Top signaux observes sur le build du 2026-03-12 :

- chunk principal `assets/index-BW_lIAv5.js` : 489.51 kB
- `pptxgen.es-*.js` : 275.23 kB
- chunk `BaseContrat-*.js` : 123.39 kB
- `jszip.min-*.js` : 97.03 kB

### Sujets a auditer

| Sujet | Lecture |
|---|---|
| budgets bundle | absents |
| lazy-loading | present, mais a requalifier par taille de chunk utile |
| proxy Vercel | `api/admin.js` documente et actif |
| RLS / auth | a conserver dans le scope high-risk |
| scan secrets / scripts operateurs | deja presents, a integrer dans la lecture globale du repo |

### Regle de prudence

- `depcheck` ne suffit pas pour supprimer une CLI.
- Toute decision sur `supabase` devDependency doit verifier :
  - scripts npm
  - runbook
  - workflow operateur
  - commandes locales de maintenance

---

## Backlog micro-PRs recommande

| PR | Objet | Effort | Risque |
|---|---|---|---|
| PR-1 | baseline et docs d'audit | faible | faible |
| PR-2 | alignement docs vs regles reelles | faible | faible |
| PR-3 | dette `@ts-nocheck` phases 1-4b | moyen | moyen |
| PR-4 | regles repo et outillage leger | faible a moyen | moyen |
| PR-5 | reachability et code mort (`irEngine`) | faible | faible |
| PR-6 | CI et hooks | faible | faible a moyen |
| PR-7 | theme bootstrap | moyen | moyen |
| PR-8 | CSS governance spike | moyen | moyen |
| PR-9 | gros fichiers cibles | moyen a fort | moyen |
| PR-10 | review structurelle | moyen | moyen |

### PR-1 - Baseline et docs d'audit

Statut le 2026-03-12 : fait

- V3 finalise.
- Chiffres stale du V2 corriges.
- Commandes de preuve ajoutees.

### PR-2 - Alignement docs vs regles reelles

Statut le 2026-03-12 : fait

- `.github/CONTRIBUTING.md` aligne maintenant la politique `.js/.jsx` sur `check:no-js`.
- `.github/CONTRIBUTING.md` reformule la gouvernance CSS pour couvrir les surfaces `pages` et `features` sans exemple stale.
- `docs/ARCHITECTURE.md` requalifie `legacy`, `__spike__`, `_raw` comme conventions historiques et non comme patterns actifs.
- `docs/ARCHITECTURE.md` clarifie que `base_contrat_settings` est present dans le schema mais non consomme par le runtime courant.

### PR-3 - Dette `@ts-nocheck` phases 1-4b

Statut le 2026-03-13 : terminee

- phase 1 mergee sur `src/main.tsx`, `src/App.tsx`, `src/components/AppErrorFallback.tsx`, `src/components/layout/AppLayout.tsx`, `src/pages/UpcomingSimulatorPage.tsx`, `src/pages/StrategyPage.tsx`, `src/components/ModeToggle.tsx`, `src/components/settings/SettingsSectionCard.tsx`, `src/components/settings/SettingsYearColumn.tsx`, `src/pages/ForgotPassword.tsx`, `src/pages/Login.tsx`
- phase 2 mergee sur `src/pages/SetPassword.tsx`, `src/components/UserInfoBanner.tsx`, `src/components/TimelineBar.tsx`, `src/components/settings/SettingsFieldRow.tsx`, `src/components/settings/SettingsTable.tsx`, `src/components/settings/PassHistoryAccordion.tsx`, `src/pages/Home.tsx`, `src/pages/SettingsShell.tsx`, `src/pages/settings/components/UserInviteModal.tsx`, `src/pages/settings/components/SettingsReportsModal.tsx`, `src/pages/settings/components/ThemeEditModal.tsx`, `src/pages/settings/components/CabinetEditModal.tsx`, `src/pages/settings/components/SettingsComptesSections.tsx`, `src/components/settings/SignalementsBlock.tsx`
- phase 3 mergee sur `src/pages/settings/Prelevements/SeuilsYearPeriod.tsx`, `src/pages/settings/Prelevements/PrelevementsSeuilsSection.tsx`, `src/pages/settings/Prelevements/PrelevementsRetraitesSection.tsx`, `src/pages/settings/Prelevements/PrelevementsPatrimoineSection.tsx`, `src/pages/settings/DmtgSuccession/ReserveCivilSection.tsx`, `src/pages/settings/DmtgSuccession/RegimesSection.tsx`, `src/pages/settings/DmtgSuccession/AvantagesMatrimoniauxSection.tsx`, `src/pages/settings/DmtgSuccession/LiberalitesSection.tsx`, `src/pages/settings/Impots/ImpotsAbattementDomSection.tsx`, `src/pages/settings/Impots/ImpotsPfuSection.tsx`, `src/pages/settings/Impots/ImpotsCehrSection.tsx`, `src/pages/settings/Impots/ImpotsISSection.tsx`, `src/pages/settings/Impots/ImpotsDmtgSection.tsx`, `src/pages/settings/DmtgSuccession/DonationSection.tsx`, `src/pages/settings/DmtgSuccession/AvDecesSection.tsx`, `src/pages/settings/SettingsImpots.tsx`, `src/pages/settings/SettingsDmtgSuccession.tsx`, `src/pages/settings/SettingsPrelevements.tsx`, `src/pages/settings/SettingsComptes.tsx`, `src/pages/Settings.tsx`, `src/pages/settings/Impots/ImpotsBaremeSection.tsx`
- phase 4a mergee sur `src/features/ir/components/IrDisclaimer.tsx`, `src/features/ir/components/IrDetailsSection.tsx`, `src/features/ir/components/IrSelect.tsx`, `src/features/placement/components/inputs.tsx`, `src/features/placement/components/tables.tsx`, `src/features/placement/components/PlacementToolbar.tsx`, `src/features/placement/components/PlacementLiquidationDetailsTable.tsx`, `src/features/placement/components/PlacementClientProfileSection.tsx`, `src/features/placement/components/PlacementEpargneSection.tsx`, `src/features/placement/components/PlacementTransmissionSection.tsx`, `src/features/placement/components/VersementConfigModal.tsx`
- phase 4b mergee sur `src/features/ir/components/IrSimulatorContainer.tsx`, `src/features/ir/components/IrFormSection.tsx`, `src/features/ir/components/IrSidebarSection.tsx`, `src/features/placement/components/PlacementInputsPanel.tsx`, `src/features/placement/components/PlacementLiquidationSection.tsx`, `src/features/placement/components/PlacementResultsPanel.tsx`, `src/features/placement/components/PlacementSimulatorPage.tsx`
- compteur repo : `64` -> `0` fichier `@ts-nocheck`
- Objectif de sortie initial largement atteint : passage sous `40` fichiers `@ts-nocheck`.
- Objectif qualitatif atteint : retrait des contournements des entrypoints puis des gros composants orchestrateurs.

### PR-4 - Regles repo et outillage leger

- Ajouter `.editorconfig`.
- Ajouter `consistent-type-imports`.
- Ajouter un premier `no-restricted-imports` sur les frontieres confirmees.

### PR-5 - Reachability code mort

- Repointage de `src/utils/irEngine.ts`.
- Supprimer la facade seulement apres repointage prod + tests.

### PR-6 - CI et hooks

- Supprimer les doublons de `.github/workflows/ci.yml`.
- Unifier `.husky` et `.githooks`.

### PR-7 - Theme bootstrap

- Centraliser les defaults theme.
- Reduire le drift entre `index.html`, `src/main.tsx`, `src/styles/index.css`, `src/settings/theme.ts`.

### PR-8 - CSS governance spike

Statut le 2026-03-14 : terminee

- aliases legacy retires de la gouvernance CSS
- exceptions couleurs formalisees
- garde-fou CI ajoute

### PR-9 - Gros fichiers cibles

Statut le 2026-03-14 : terminee

- fichiers prouves a exempter de `max-lines` : `src/constants/settingsDefaults.ts`, `src/domain/base-contrat/catalog.ts`, `src/domain/base-contrat/rules/library/immobilier.ts`, `src/domain/base-contrat/rules/library/retraite.ts`, `src/domain/base-contrat/rules/library/valeurs-mobilieres.ts`, `src/pptx/designSystem/serenity.ts`
- warnings `max-lines` ramenes de `10` a `0`
- `src/pages/settings/Impots/ImpotsBaremeSection.tsx` sorti du warning via extraction locale `src/pages/settings/Impots/ImpotsBaremeYearColumn.tsx`
- `src/features/credit/hooks/useCreditCalculations.ts` sorti du warning via extraction locale `src/features/credit/utils/creditCalculationHelpers.ts`
- `src/features/succession/successionDevolution.ts` sorti du warning via extraction locale `src/features/succession/successionDevolutionSpouseValuation.ts`
- `src/features/succession/successionChainage.ts` sorti du warning via extraction locale `src/features/succession/successionChainageEstateSplit.ts`
- aucun warning `max-lines` residuel dans `src`

### PR-10 - Review structurelle

Statut le 2026-03-14 : en cours

- `src/routes/settingsRoutes.ts` aligne la navigation settings avec la frontiere `routes/`
- `src/settings/userMode.ts` aligne le mode global UI avec la frontiere `settings/`
- `src/settings/admin/` aligne le bridge admin settings avec son perimetre fonctionnel
- `src/reporting/snapshot/` aligne le dossier snapshots `.ser1` avec le vocabulaire metier
- docs pivots alignees sur ce move : `README.md`, `docs/ARCHITECTURE.md`, `docs/GOUVERNANCE.md`, `docs/RUNBOOK.md`, `docs/ROADMAP.md`
- reliquat structurel principal a qualifier sans move massif : `src/utils/`

---

## Verification minimale pour chaque future PR

```bash
npm run check
npm run check:circular
npm run check:unused
```

Et selon la zone touchee :

- audit des imports : `rg`
- pages et routes : verifier `src/routes/appRoutes.ts` et `src/routes/settingsRoutes.ts`
- docs : verifier coherence `README.md`, `.github/CONTRIBUTING.md`, `docs/*`

---

## Risques et notes de rollback

- Risque de faux positif sur les petits fichiers : ne pas fusionner les entrypoints et seams metiers utiles.
- Risque de faux positif sur `depcheck` : ne jamais supprimer une CLI sans verifier l'usage operateur.
- Risque de sur-refactor : ne pas lancer de grand menage `utils/` ou `settings/` avant d'avoir stabilise les regles repo.
- Rollback attendu : chaque micro-PR doit rester atomique, testable, et reversible par simple revert Git.

---

## Statut de ce fichier

Ce fichier est un livrable d'audit, pas une preuve que les actions ont deja ete executees.

Tant que les micro-PRs ne sont pas mergees :

- les constats restent la source de verite
- le backlog reste un plan d'execution
- toute suppression doit etre revalidee sur l'etat courant du repo
