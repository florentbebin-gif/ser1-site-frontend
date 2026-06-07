# ARCHITECTURE (source de vérité)

## But

Expliquer **comment le repo est organisé** et où modifier quoi (frontend, engine, exports, Supabase, thèmes).

## Audience

Dev qui doit intervenir sur une feature, un export, un thème, ou Supabase.

## Ce que ce doc couvre / ne couvre pas

- ✅ Couvre : carte des dossiers, points d’entrée, flux principaux, conventions clés (SaaS).
- ❌ Ne couvre pas : procédures de debug/opérations (voir `docs/RUNBOOK.md`).

## Sommaire

- [Stack](#stack)
- [Structure du repo](#structure-du-repo)
- [Points d’entrée & flux](#points-dentrée--flux)
- [Supabase: données, RLS, edge functions](#supabase-données-rls-edge-functions)
- [Thème & branding](#thème--branding)
- [Exports (PPTX/Excel)](#exports-pptxexcel)
- [Références](#références)

---

## Stack

- React 19 + React Router 7 + Vite 8 + TypeScript 6 strict
- Node 22.22.1 + npm 11.12.0 (`packageManager` + `engine-strict=true` ; `engines.npm >=10.9.7` pour couvrir l'empaquetage interne Vercel)
- Supabase (Auth/DB/Storage/Edge Functions) : `@supabase/supabase-js` 2.106.x, CLI Supabase 2.100.x
- Edge Function admin : Deno 2 autonome (`deno.json` import map + `deno.lock` gelé)
- ESLint 9 ; ESLint 10 est différé tant que `eslint-plugin-react` et `eslint-plugin-jsx-a11y` ne déclarent pas sa compatibilité.
- Exports : PptxGenJS + JSZip (PPTX), OOXML via JSZip (XLSX)
- Tests : Vitest (+ Playwright E2E), coverage V8 ciblée `src/engine/**`
- Observabilité : Sentry + Web Vitals en opt-in (`VITE_SENTRY_DSN`)
- DevX UI/perf : Storybook, Lighthouse CI et Typedoc engine en gates informatifs

---

## Structure du repo

Repères (domain-first) :

- `src/engine/` : calculs métier purs (zéro React).
  - `src/engine/succession/` : moteur succession et helpers civils. L'entrée publique reste `@/engine/succession`; les helpers civils se consomment via `@/engine/succession/civil`.
- `src/features/` : features UI (state, composants, handlers export).
- `src/domain/simulators/` : registry métier des simulateurs, visibilité Home, chaînages et contrats
  d'alimentation dossier. Ce dossier ne remplace pas `src/routes/simRouteContracts.ts` : il référence
  les routes par `routeId` et ne recopie pas les chemins `/sim/*`.
- `src/domain/settings-registry/` : registry transverse des familles et paramètres fiscaux/métier,
  sans valeurs révisables inventées, avec contrat de consommation par simulateur.
- `src/domain/dossier/` : modèle pur de dossier patrimonial central, version dossier,
  activation de stratégie, références source et view model du rail dossier. Le socle
  `DossierPatrimonial` F1 se persiste dans `public.dossiers_patrimoniaux` via RLS owner/admin.
- `src/pages/` : shells légers (Home, Login, SettingsShell) + `pages/settings/*` (sous-pages settings).
- `src/styles/app/` : chrome applicatif global (topbar, chips, états shell).
- `src/styles/sim/` : baseline CSS partagée des simulateurs `/sim/*`.
- `src/pages/settings/styles/` : domaine CSS partagé/settings.
- `src/settings/` : thème, presets, ThemeProvider.
- `src/pptx/` : pipeline PPTX (design system + slides + export).
- `src/reporting/` : snapshots `.ser1`, migrations de snapshots et contrats de reporting. Ce périmètre dépend des moteurs/domaines purs, jamais des features UI.
- `src/engine/tresorerie/migrations/compatTypes.ts` : types historiques V1→V5, réservés aux migrations et tests moteur.
- `src/engine/tresorerie/migrations/` : adaptateurs purs vers `TresoInputsV6`, dont `migrateUnknownTresorerieInputsToV6(unknown)`.
- `supabase/` : edge functions + migrations.

Conventions clés :

- Nouveau code : TS/TSX.
- Fichiers `500-800` lignes = dette surveillée. Acceptable temporairement si le fichier reste mono-rôle et lisible, avec justification dans `scripts/baselines/large-files.json`.
- Fichiers `>800` lignes = découpage prioritaire sauf fichier généré ou source de données explicitement justifiée dans `scripts/baselines/large-files.json`.
- Garde-fous d'architecture : `npm run check:arch` (dependency-cruiser, config `.dependency-cruiser.cjs`) — bloquant en CI. Règles : engine/domain sans React ni features, features sans pages, reporting sans features, imports cross-features via `index.ts` uniquement.
- Garde imports profonds : `npm run check:deep-imports` bloque tout nouveau `../../../` hors tests dans les imports TS/TSX/JS/JSX et CSS. La baseline hors tests est `0`; utiliser `@/` pour les imports cross-module.
- Garde fichiers orphelins : `npm run check:orphan-source-files` vérifie l'atteignabilité des sources applicatives depuis les entrypoints explicites.
- Garde fichiers longs : `npm run check:large-files-baseline` bloque tout fichier `src/**/*.ts(x)` au-delà de 500 lignes sans entrée structurée dans `scripts/baselines/large-files.json`, toute entrée sans justification, toute entrée devenue inutile et toute croissance au-delà du `maxLines` figé.
- Garde routes/docs : `npm run check:routes-doc-sync` vérifie que les routes déclarées dans `src/routes` apparaissent dans ce document.
- Garde Supabase : `npm run check:supabase-rls`, `npm run check:settings-rls`, `npm run check:storage-policies` et `npm run check:supabase-migrations` vérifient le périmètre RLS/Storage/migrations explicitement classé.
- Garde exports : `npm run check:export-parity` vérifie les métriques partagées UI/export ; `npm run check:pptx-images` vérifie le budget des images de chapitres.
- Familles CI : `npm run check` regroupe `check:static`, `check:architecture`, `check:fiscal`, `check:supabase`, `check:exports`, `check:baselines`, `check:types`, `check:tests` et `check:build`.
- Coverage moteur : `npm run coverage` porte des seuils sur `src/engine/**` uniquement ; l'UI/features suit une trajectoire séparée.
- Nomenclature métier : dans Succession, utiliser les noms explicites comme `AssuranceVie` pour les nouveaux modules métier ; éviter les abréviations ambiguës de type `Av`.

### Registry simulateurs — `src/domain/simulators/`

La registry métier des simulateurs vit dans `src/domain/simulators/`. Elle décrit les objectifs,
entrées, calculs, sorties, champs dossier, références, statuts, visibilité simplifié/expert et
chaînages métier.

Le routage reste séparé :

- `src/routes/simRouteContracts.ts` garde la source des routes `/sim/*`, labels de route et reset keys.
- `src/domain/simulators/registry.ts` référence une route existante par `routeId` uniquement.
- aucune Home, aucun rail et aucun composant React ne doit recréer une liste parallèle de routes,
  statuts, familles ou chaînages.

Les adapters contexte dossier vers inputs simulateur sont volontairement séparés :

- `src/domain/simulators/contextAdapterTypes.ts` porte seulement le contrat commun ;
- les adapters réels vivent ensuite par simulateur ou domaine, par exemple dans `src/features/ir/`,
  afin d'éviter un fichier central qui accumule toute la logique métier.

Les parcours métier exposés par `src/domain/simulators/chainage.ts` doivent référencer des
`SimulatorDefinition.id`. Les seules étapes non simulateur autorisées sont les étapes conceptuelles
typées `strategy` et `audit-objectives`.

### Références juridiques — `src/domain/legal-references/`

Le référentiel juridique vit dans `src/domain/legal-references/`. Il liste les sources officielles
attachées aux simulateurs, aux pages settings et aux produits du catalogue Base-Contrat via les
champs d'usage `relatedSimulatorIds`, `relatedSettings` et `relatedCatalogProducts`.

- `references.json` est la source canonique listable par Node.
- `LegalReferenceId` est un alias métier de `string` ; la validation forte vient de
  `npm run check:legal-references` et des tests registry.
- `legalRefs` dans `SimulatorDefinition` contient uniquement des IDs canoniques pour les entrées
  `legalRefsStatus: 'complete'`.
- Le check local valide les IDs, URLs officielles, domaines autorisés, usages déclarés, cohérence
  des simulateurs rattachés et références sans usage. Pour Légifrance, il impose une forme canonique
  `/codes/article_lc/<LEGIARTI…>` ou `/codes/section_lc/...`, sans segment de version daté
  `/AAAA-MM-JJ` (afin de toujours pointer la version en vigueur). Il ne navigue jamais sur le web :
  la fraîcheur réelle des sources relève du futur `audit:legal-news`.

Ce référentiel documente les sources. Il ne porte pas les taux, seuils et abattements révisables :
ces valeurs restent dans Settings/Supabase et sont consommées par la chaîne fiscale existante.

### Chaînage Settings ↔ références juridiques — `src/domain/settings-references/`

Le chaînage Settings vit dans `src/domain/settings-references/`. `chain.json` est la source
canonique lisible par Node ; il relie chaque claim Settings à une cible contrôlée :

- `settings-default` : chemin de fallback dans `DEFAULT_TAX_SETTINGS`, `DEFAULT_PS_SETTINGS` ou
  `DEFAULT_FISCALITY_SETTINGS` ;
- `pass-history` : millésime `public.pass_history` (`year` ou `latest`) ;
- `base-contrat-rule` : produit, audience, phase et bloc exposé par `/settings/base-contrat` ;
- `prevoyance-db` : table/code/jsonPath des sources JSONB prévoyance.

Chaque binding porte `pagePath`, `sectionKey`, `claimKey`, `target`, `refIds`, `verifiedAt` et
`volatility`. Une référence canonique impose une `relevanceNote`; un binding sans référence impose
un `noRefReason`. Le garde-fou `npm run check:settings-references` valide les IDs, les dates, les
notes non génériques, les `pagePath` déclarés, les chemins Settings/PASS et la complétude attendue
par page. Il est branché dans `check:static` et son rapport doit rester en
`coverage.mode = "exhaustive"` avec `coverage.isExhaustive = true`. `coverage.byPage` expose pour
chaque surface le nombre de bindings déclarés (`declared`) et le nombre de claims attendus
(`expected`). Les 6 surfaces cibles doivent rester complètes sans claim manquant ou surnuméraire :
`/settings/impots`, `/settings/comptables-societes`, `/settings/prelevements`, `/settings/base-contrat`,
`/settings/dmtg-succession`, `/settings/prevoyance-regimes`. La cible Base-Contrat est dynamique :
son attendu est recalculé depuis `CATALOG` + `getRules()`.

L'audit manuel `npm run audit:settings-references -- --stale --with-db` ajoute la fraîcheur, la
liveness URL hors CI et la lecture des sources prévoyance en base. Les références `annual` deviennent
bloquantes au 1er février de l'année suivant leur vérification (`verifiedAt`). Les statuts HTTP
`401`, `403` et `429` sont classés non vérifiables automatiquement, pas morts ; seuls `404` et `410`
rendent l'URL bloquante. Sans variables Supabase, l'audit produit un rapport code-only avec
avertissement.
La prévoyance garde les bindings `prevoyance-db` dans `chain.json`, mais les sources réelles vivent
dans `sources.references` en base, par régime et par catégorie (`arret`, `invalidite`, `deces`,
`cotisations`). Les pages officielles de caisses et organismes institutionnels validées par l'audit
DB sont marquées `confiance: "haute"` faute de source normative plus précise disponible. L'audit DB
refuse une catégorie attendue sans source ou justification spécifique, ainsi que les URLs
racines/génériques de caisse qui ne pointent pas vers une page de garantie ou de cotisation.

### Registry Settings fiscaux/métier — `src/domain/settings-registry/`

Le registry Settings vit dans `src/domain/settings-registry/`. Il documente et valide le contrat
transverse des paramètres fiscaux/métier avant consommation par les simulateurs. Il ne stocke pas de
valeurs fiscales révisables : les valeurs prêtes restent dans la chaîne standard
`Supabase` -> `fiscalSettingsCache.ts` -> `useFiscalContext.ts` -> `settingsDefaults.ts`.

Les familles canoniques sont :

- `impots`
- `comptables-societes`
- `immobilier`
- `transmission`
- `retraite-prevoyance`
- `placements`
- `social-dirigeant`

Chaque entrée déclare au minimum : `family`, `key`, `label`, `description`, `valueType`, `unit`,
`millesime`, source/référence, cible `defaultValue`, cible `currentValue`, validation, page settings
propriétaire, simulateurs consommateurs attendus et statut.

Les statuts ont un sens bloquant :

| Statut    | Sens architecture                                                                                                |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| `ready`   | Paramètre déjà éditable/consommable, avec source complète et claims `settings-references` connus.                |
| `partial` | Paramètre centralisé partiellement consommable, avec certains sous-claims ou références encore à compléter.      |
| `planned` | Besoin inventorié sans valeur. `defaultValue` et `currentValue` doivent rester `null`, et la source à compléter. |

`SimulatorDefinition.settingsKeys` déclare les paramètres réellement consommés par un simulateur.
Toute clé doit exister dans `SETTINGS_REGISTRY`. Les simulateurs `active`, `hub` et `placeholder` ne
peuvent pas déclarer de consommation d'un setting `planned`; les consommateurs futurs restent listés
dans `SETTINGS_REGISTRY.consumerSimulatorIds`.

Garde-fous :

- `npm run check:settings-registry` valide familles, propriétaires, claims settings, consommateurs
  et absence de valeur sur les entrées `planned`.
- `npm run check:fiscal-hardcode` scanne aussi `src/domain/settings-registry/`.
- Un nouveau paramètre fiscal/métier doit mettre à jour ensemble : defaults/cache/hook si une valeur
  existe, `settings-references`, `settings-registry`, tests et page settings propriétaire.

### Règle "god file"

Un fichier long n'est pas automatiquement prioritaire. Un vrai "god file" devient prioritaire s'il mélange au moins 2 responsabilités parmi :

- orchestration UI / state / effects React
- persistence, réseau, ou I/O
- helpers métier ou transformations de données
- modals inline / gros blocs JSX
- contrats publics / compat de migration

Objectif : découper d'abord les fichiers qui mélangent plusieurs responsabilités, pas les fichiers simplement volumineux mais mono-rôle.

### Exceptions documentées

| Classe                     | Décision                 | Notes                                                                                                             |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| CSS feature-scoped         | Exempt par défaut        | A surveiller, mais pas de découpage imposé tant que le fichier reste purement CSS et rattaché à une même surface. |
| Constantes / données pures | Exempt                   | Exemple : tables de référence, defaults, catalogues. Réévaluer si le fichier mélange rendering ou helpers.        |
| Mono-algorithme            | Exempt en zone `500-800` | Exemple : moteur ou calcul dense mais cohérent. Découper seulement si plusieurs sous-domaines émergent.           |
| Scripts outils             | Exempt                   | Ne pas refactorer uniquement pour satisfaire une limite de lignes.                                                |
| Migrations SQL             | Exempt                   | Ne jamais réécrire l'historique pour satisfaire une règle de taille.                                              |

### Conventions historiques — `legacy/`, `__spike__`, `_raw`

Ces noms de dossiers sont des marqueurs historiques de refactor ou de prototypage, pas des patterns actifs du repo.

**Statut au 2026-05-28** :

- Aucun dossier `legacy` n'est autorisé sous `src/`. La compatibilité des anciens formats Trésorerie V1→V5 est isolée dans `src/engine/tresorerie/migrations/compatTypes.ts`, consommée uniquement par les migrations et leurs tests.
- aucun dossier `__spike__` ou `_raw` n'est présent sous `src/`
- les autres mentions résiduelles dans la doc ou l'historique Git doivent être lues comme historiques

**Règles** :

- ne pas réintroduire ces dossiers dans `src/`
- `npm run check:naming-conventions` bloque les nouveaux dossiers `legacy`, `__spike__` ou `_raw` sous `src/`
- toute exception au dossier `legacy` doit être nommée dans `LEGACY_DIRECTORY_EXCEPTIONS`
  (`scripts/check-naming-conventions.mjs`) avec une preuve d'usage associée en PR
- si un spike temporaire est nécessaire, le garder hors runtime prod puis le supprimer ou l'intégrer avant merge
- avant toute suppression ou promotion de code historique, fournir une preuve d'usage (`rg`, chaîne d'import, route ou script)

**Vérification** :

```powershell
Get-ChildItem src -Recurse -Directory |
  Where-Object {
    $_.Name -in @('legacy','__spike__','_raw')
  }
# → doit retourner vide
```

**Dette active liée à cette zone** :

- Aucune dette `@deprecated` active dans `src/engine/` au dernier contrôle (`rg "@deprecated" src/engine` doit retourner vide).

---

## Points d’entrée & flux

### Routing

- `src/routes/appRoutes.ts` (APP_ROUTES) : source de vérité des routes + metadata topbar (`contextLabel`, `topbar`).
- `src/routes/dossierRailRouteContext.ts` : résout la route courante vers le contexte du rail dossier
  en s'appuyant sur `SIM_ROUTE_CONTRACTS`, sans recopier les chemins dans le domaine dossier.
- `src/App.tsx` : rendu JSX des routes via `APP_ROUTES.map()`. Résolution topbar via `getRouteMetadata(pathname)`.
- React Router 7 reste utilisé en mode déclaratif (`BrowserRouter`, `<Routes>`, `<Route>`), avec imports depuis `react-router`.
- `src/components/layout/AppLayout.tsx` : topbar data-driven (reçoit `routeMeta`, plus de flags hardcodés)
  et point d'injection unique du `DossierRail` sur `/audit`, `/strategy` et `/sim/*`.

#### Routes Map (actuel)

Source (preuves) :

- Définitions des routes : `src/routes/appRoutes.ts` (APP_ROUTES)
- Rendu `<Routes>` : `src/App.tsx` (`APP_ROUTES.map(...)`)

| Route                     | Accès        | Composant (runtime)     | Fichier / provenance                                                                                                                                                                                                              |
| ------------------------- | ------------ | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/login`                  | public       | `Login`                 | `src/pages/Login.tsx` (import direct)                                                                                                                                                                                             |
| `/forgot-password`        | public       | `ForgotPassword`        | `src/pages/ForgotPassword.tsx` (import direct)                                                                                                                                                                                    |
| `/set-password`           | public       | `SetPassword`           | `src/pages/SetPassword.tsx` (import direct)                                                                                                                                                                                       |
| `/reset-password`         | public       | `SetPassword`           | `src/pages/SetPassword.tsx` (import direct)                                                                                                                                                                                       |
| `/`                       | privé        | `Home`                  | `src/pages/Home.tsx` via l'API publique `src/features/home`                                                                                                                                                                       |
| `/audit`                  | privé + lazy | `AuditWizard`           | `src/features/audit/AuditWizard.tsx` (exporté via `src/features/audit/index.ts`) — workflow actif hors `/sim/*`, avec draft de session, `ExportMenu` partagé et export PPTX isolé dans `src/features/audit/export/exportAudit.ts` |
| `/strategy`               | privé + lazy | `StrategyPage`          | `src/pages/StrategyPage.tsx` (lazy) — workflow actif dépendant d'un draft d'audit, avec `SimFieldShell` pour la saisie produit et export PPTX isolé dans `src/features/strategy/export/exportStrategy.ts`                         |
| `/sim/placement`          | privé + lazy | `Placement`             | `src/features/placement/PlacementPage.tsx` (exporté via `src/features/placement/index.ts`)                                                                                                                                        |
| `/sim/credit`             | privé + lazy | `Credit`                | `src/features/credit/Credit.tsx` (exporté via `src/features/credit/index.ts`)                                                                                                                                                     |
| `/sim/succession`         | privé + lazy | `SuccessionSimulator`   | `src/features/succession/SuccessionSimulator.tsx` (exporté via `src/features/succession/index.ts`)                                                                                                                                |
| `/sim/per`                | privé + lazy | `PerHome`               | `src/features/per/PerHome.tsx`                                                                                                                                                                                                    |
| `/sim/per/potentiel`      | privé + lazy | `PerPotentielSimulator` | `src/features/per/components/potentiel/PerPotentielSimulator.tsx`                                                                                                                                                                 |
| `/sim/per/transfert`      | privé + lazy | `PerTransfertSimulator` | `src/features/per/transfert/PerTransfertSimulator.tsx` (réexporté par `src/features/per/transfert/index.ts`, puis `src/features/per/index.ts`)                                                                                    |
| `/sim/epargne-salariale`  | privé + lazy | `UpcomingSimulatorPage` | `src/pages/UpcomingSimulatorPage.tsx` (lazy)                                                                                                                                                                                      |
| `/sim/tresorerie-societe` | privé + lazy | `TresorerieSocietePage` | `src/features/tresorerie-societe/TresorerieSocietePage.tsx` (lazy)                                                                                                                                                                |
| `/sim/prevoyance`         | privé + lazy | `PrevoyancePage`        | `src/features/prevoyance/PrevoyancePage.tsx` (V1 UI/UX sans moteur `src/engine`, règles RO lues via Settings/Supabase)                                                                                                            |
| `/sim/ir`                 | privé + lazy | `Ir`                    | `src/features/ir/IrPage.tsx` (exporté via `src/features/ir/index.ts`)                                                                                                                                                             |
| `/settings/*`             | privé + lazy | `SettingsShell`         | `src/pages/SettingsShell.tsx` (lazy)                                                                                                                                                                                              |

Trajectoire PR V2-14 : le scan documentaire IA doit rester rattaché à l'audit, pas aux simulateurs. La route cible sera une surface privée hors `/sim/*`, par exemple `/audit/documents` ou une étape interne de `/audit`, avec accès depuis la Home dans le bloc `PAR OÙ COMMENCER`. Ne pas créer `/sim/ia` ni ajouter le scan dans la grille des simulateurs.

### Rail dossier, versions et dossier patrimonial

`DossierRail` est l'unique rail gauche autorisé pour le parcours global :

- il est branché dans `src/components/layout/AppLayout.tsx`, jamais dans chaque page ;
- il consomme `src/domain/dossier/railViewModel.ts`, `src/domain/simulators/chainage.ts` et
  la registry simulateurs ;
- il utilise `src/routes/dossierRailRouteContext.ts` pour relier la route courante aux contrats
  `SIM_ROUTE_CONTRACTS` sans créer de seconde source de routes ;
- il affiche le rail complet sur desktop pour `/audit` et `/strategy`, le rail compact sur desktop
  pour `/sim/*`, et seulement une pastille courte sur mobile ;
- il ne duplique pas les actions globales de topbar : sauvegarde, chargement, reset, export et mode
  restent dans leurs composants existants.
- `AppLayout` ajoute la carte `Dossier chargé` au-dessus du rail sur `/audit`, `/strategy` et
  `/sim/*`, sans rendre le sélecteur `Mode utilisateur`. Ce dernier reste réservé à la Home ; les
  simulateurs gardent leurs toggles locaux lorsqu'ils existent.

`DossierVersion`, `StrategyActivation` et `SourceRef` existent comme contrats de domaine purs dans
`src/domain/dossier/types.ts`. La version affichée par le rail reste une version de travail.

F1 ajoute le socle `DossierPatrimonial` dans `src/domain/dossier/` : foyer, membres, situation
familiale, régime matrimonial, donations synthétiques, objectifs, contraintes, opérations prévues,
`sourceRefs` minimales et complétude `f1_core`. Cette complétude vérifie seulement le socle central
minimal ; elle ne signifie pas qu'un simulateur Succession, PER, IR, Placement ou Strategy peut
lire le dossier sans adapter dédié.

La persistance durable passe par la table Supabase `public.dossiers_patrimoniaux` avec `user_id`,
`data jsonb`, `source_refs jsonb`, statut, complétude, `created_at` et `updated_at`. Les policies RLS
autorisent le propriétaire ou `public.is_admin()` pour lire et écrire. `/audit` hydrate le brouillon
depuis le dernier dossier central relu via Supabase quand aucun brouillon de session n'est ouvert,
puis sauvegarde le modèle central lors du save global via les adapters Audit <-> dossier central.
La précédence F1 est volontairement local-first : un brouillon local/session en cours garde la
priorité, et le dossier central sert de source amont seulement quand aucun brouillon local actif
n'existe. La résolution avancée de conflits entre brouillon local et dossier central est hors
périmètre F1.
Les modèles F2 evidence enrichie, F3 actif/passif complet, F5 société/bilan et les nouveaux settings
fiscaux restent hors périmètre F1.

Vérification (commandes) :

```powershell
# Liste des routes (paths)
rg -n "path:" src/routes/appRoutes.ts

# Aucun redirect runtime déclaré
rg -n "kind: 'redirect'" src/routes/appRoutes.ts

# Rendu JSX : App.tsx consomme APP_ROUTES
rg -n "APP_ROUTES\\.map" src/App.tsx
```

### Bootstrap auth → thème

- `src/main.tsx` → `AuthProvider` → `ThemeProvider` → `App`.

### Settings (admin)

- Navigation settings : `src/routes/settingsRoutes.ts` (source unique).
- Pages : `src/pages/settings/*`.

---

## Supabase: données, RLS, edge functions

### Règle SaaS

- **Branding = multi-tenant** (cabinets, profiles).
- **Règles fiscales + catalogue produits = GLOBAL** (pas de `cabinet_id`).

### Sécurité / RLS

- Rôle admin via `app_metadata.role`.
- SQL helper : `public.is_admin()`.
- Interdit : policies basées sur `user_metadata`.

Tables repères (haut niveau) :

- `profiles` (multi-tenant) : `cabinet_id`.
- `cabinets` (tenant) : `default_theme_id`, `logo_id`.
- `themes` : presets/système.
- `ui_settings` : préférences user (`theme_mode`, `preset_id`, `my_palette`, `theme_scope`).
- Settings GLOBAUX : `tax_settings`, `ps_settings`, `fiscality_settings`.
- Référentiel contrats (Base-Contrat) : `base_contrat_overrides`.
- Admin (service_role uniquement) : `admin_accounts`, `admin_action_audit`.

### Edge Function `admin`

- Source : `supabase/functions/admin/index.ts`.
- Contrat action : query `?action=...` ou body `{ action: "..." }`.
- Périmètre Deno 2 autonome : `supabase/functions/admin/deno.json` + `supabase/functions/admin/deno.lock`. Le lock racine est interdit ; les imports Deno passent par l'import map (`@std/assert`, `@supabase/supabase-js`) et `npm run test:deno` s'exécute depuis ce dossier avec `--frozen=true`.

### Admin : sécurité multicouche

L'admin est **global** (pas de multi-tenant sur cette surface). Deux prérequis cumulatifs pour accéder à un handler :

1. `app_metadata.role = 'admin'` dans Supabase Auth
2. Ligne active dans `public.admin_accounts` (`status='active'`, pas expiré)

**`is_admin()` vs `is_admin(uid)`** :

- `is_admin()` sans param : lit le JWT courant (`app_metadata`) — safe en RLS, pas de round-trip DB.
- `is_admin(uid)` avec param : lit `profiles.role` (miroir SQL) — utilisé en RLS pour les tables nécessitant une vérification par uuid d'un tiers.

**`AdminPrincipal`** : objet enrichi créé après validation des deux prérequis (`lib/auth.ts`), transporté dans chaque `AdminActionContext`. Contient `userId`, `accountKind` (`owner`/`dev_admin`/`e2e`), `isActive`, `isExpired`, `requestId`.

**Tables admin** (accessibles service_role uniquement, RLS activee avec policies explicites `TO service_role`) :

| Table                | Rôle                                                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `admin_accounts`     | Allowlist des comptes admin (owner, dev_admin, e2e) avec expiration. RLS activee, policy `admin_accounts_service_role_only`. |
| `admin_action_audit` | Journal des mutations admin (request*id, action, cible, statut). RLS activee, policies `admin_action_audit_service_role*\*`. |

**Audit** : chaque mutation admin (create/update/delete cabinet, theme, user, issue) insère une ligne dans `admin_action_audit` via `recordAdminAction()` (`lib/audit.ts`). Fire-and-forget : un échec d'audit ne bloque jamais la réponse principale.

Voir `docs/RUNBOOK.md` § "Gouvernance admin — admin_accounts" pour le cycle de vie opérationnel.

### Migrations

- Source de vérité : `supabase/migrations/`.

### Sécurité & observabilité

> Migré depuis `docs/GOUVERNANCE.md` — ces règles relèvent de l'architecture, pas de l'UI.

#### Autorisation

- Interdit : utiliser `user_metadata` pour des décisions d'autorisation.
- Autorisé : `app_metadata.role` uniquement (frontend + edge + RLS).
- **Source unique** : `app_metadata.role` est la seule source de vérité pour le rôle auth. `user_metadata.role` ne doit jamais être écrit ni lu pour une décision d'autorisation. `profiles.role` est un miroir SQL maintenu par le backend (nécessaire pour `is_admin(uid)` en RLS), pas une source à consommer directement côté frontend.

#### Bypass E2E (`__SER1_E2E`) — limites et conditions d'activation

Le flag `window.__SER1_E2E = true` permet aux tests Playwright de contourner l'auth Supabase (mock d'un rôle admin fictif). Ce mécanisme est **strictement borné** :

- **Inactif en prod par défaut** : le bypass ne s'active que si `import.meta.env.DEV === true` **OU** `import.meta.env.VITE_E2E === 'true'`.
- **`VITE_E2E=true`** doit être explicitement défini dans le workflow CI E2E (`.github/workflows/e2e.yml`). Il n'est jamais présent dans le build prod.
- **Jamais côté backend** : `__SER1_E2E` est purement frontend. Il ne bypass aucune garde Edge Function ni aucune RLS.
- **Usage autorisé** : smoke tests Playwright uniquement (test de rendu, navigation). Interdit pour simuler des droits admin réels ou tester des flows qui font des appels `/api/admin`.

#### Logs

- Zéro PII (email, nom, montants, RFR, patrimoine, etc.).
- Zéro métriques métier (compteurs de simulations, montants calculés, types produits utilisés).
- En prod : `console.log/debug/info/trace` interdits par le gate `check:no-console` dans `src/` et `api/`. Les surfaces serveur conservent `console.warn/error` pour l'observabilité sans contenu sensible.

---

## Thème & branding

- ThemeProvider : `src/settings/ThemeProvider.tsx`.
- Presets : `src/settings/presets.ts`.
- Tokens UI : `src/settings/theme.ts` + `src/styles/index.css`.

Règles fonctionnelles : voir `docs/GOUVERNANCE.md`.

### Standard UI des simulateurs `/sim/*`

Source normative : section **"Norme des pages `/sim/*` (baseline `/sim/credit`)"** dans `docs/GOUVERNANCE.md`.

Implémentation de référence :

- Orchestrateur : `src/features/credit/Credit.tsx`
- Styles de page simulateur : `src/styles/sim/index.css`
- Styles premium partagés : `src/styles/premium-shared.css`
- Styles spécifiques crédit : `src/features/credit/styles/index.css`
- Inputs/select/toggle : `src/features/credit/components/CreditInputs.tsx` + `src/features/credit/styles/fields.css`
- Contrat UX partagé : `src/components/ui/sim/simPageUXContract.ts`
- Hooks de contrat UX par page : `useCreditPageUXContract`, `useIrPageUXContract`,
  `useSuccessionPageUXContract`, `usePrevoyancePageUXContract`,
  `useTresoreriePageUXContract`, `usePlacementPageUXContract`
- Navigation discrète optionnelle : `src/components/ui/sim/SimPageStepper.tsx`
- CTA contextuel vers la synthèse : `src/components/ui/sim/SimViewSynthesisCTA.tsx`
- États vides de synthèse : `src/components/ui/sim/SimEmptyState.tsx` avec `variant="sidebar"`
- Séparateurs simulateurs : `src/styles/sim/dividers.css`
- Pour toute nouvelle page `/sim/*`, appliquer la règle placeholder + unité de `docs/GOUVERNANCE.md` : placeholder numérique sans unité dans le champ, suffixe visuel hors champ, sauf si l'unité est déjà portée par un menu déroulant.
- Les boutons optionnels de filtres/sous-sections doivent démarrer inactifs par défaut, puis activer explicitement les blocs associés.
- `SimPageStepper` reste une primitive optionnelle de démonstration ou de page justifiée ; il n'est pas branché par défaut sur `/sim/*` et ne doit pas contenir `Synthèse` ou `Hypothèses`.
- Les KPI de droite ne sont rendus qu’une fois les prérequis métier satisfaits ; avant cela, la page rend au plus un état d’attente sobre.

### Mode utilisateur `/sim/*` (contrat)

Décision produit : `docs/mode-simplifie-expert.md`.

- Source de vérité globale : `ui_settings.mode` via `useUserMode` (`src/settings/userMode.ts`).
- La page Home est le point de pilotage global (toggle persistant).
- Chaque simulateur doit lire ce mode global au montage, puis peut appliquer un override local non persistant (pattern `/sim/credit`).
- Le toggle local d'un simulateur ne doit pas écrire dans `ui_settings` (sinon il écrase le choix Home pour toute l'app).
- Les boutons locaux additionnels de page (filtres, catégories masquables) ne doivent pas être initialisés comme actifs par défaut sans règle produit documentée.
- Helpers d'affichage : `src/settings/userModeDisplay.tsx` expose `resolveEffectiveUserMode`, `DetailLevel`, `ExpertOnly` et `SimpleOnly`.
- Le mode simplifié masque ou replie de l'UI ; il ne doit jamais changer seul les hypothèses calculatoires envoyées au moteur.
- Un simulateur sans décision produit simplifiée reste explicitement `expertOnly`. `/sim/tresorerie-societe` est `expertOnly` temporaire et volontaire dans cette PR : le mode simplifié n'est pas livré ici, car le parcours société / associé / allocation exige une décision produit dédiée suivie par `PR V2-06`.

### Thème V5 (3 modes)

Source de vérité : DB (`ui_settings`).

- `cabinet` : branding du cabinet
- `preset` : `preset_id`
- `my` : `my_palette`

Invariants (à ne pas casser) :

- Un preset ne modifie jamais `my_palette`.
- `localStorage` sert uniquement d'anti-flash (miroir), pas de source de vérité.

---

## Exports (PPTX/Excel)

### PPTX

- Orchestrateur : `src/pptx/export/exportStudyDeck.ts`.
- Design system : `src/pptx/designSystem/serenity.ts`.
- Slides : `src/pptx/slides/`.
- **Règles de conception et checklist de création** : `docs/GOUVERNANCE_EXPORTS.md`.
- Frontière exports : `src/pptx/**` ne doit jamais importer `src/features/**` ; les types et helpers partagés vivent dans `src/domain/**`, `src/engine/**`, `src/reporting/**` ou dans un module PPTX dédié. Les wrappers runtime restent feature-owned : `src/features/audit/export/exportAudit.ts` adapte `src/pptx/auditPptx.ts` et `src/features/strategy/export/exportStrategy.ts` adapte `src/pptx/strategyPptx.ts`.

Assets statiques (images) :

- Chapitres PPTX : `public/pptx/chapters/ch-01.png` .. `ch-09.png` (bibliothèque).
- Conserver la nomenclature à 2 chiffres et le format PNG.
- Objectif : préserver la qualité de rendu PPTX (ratio/coins/anti-artefacts).
- Sélection par simulateur via `pickChapterImage(simId, ordinal)` dans `serenity.ts`.

Budgets (guideline, non bloquant) :

- Cible : <= 1.2 Mo / image ; alerte : > 1.6 Mo / image
- Cible : <= 9 Mo total ; alerte : > 12 Mo total

Vérification (PowerShell) :

```powershell
Get-ChildItem public\pptx\chapters\ch-*.png -File |
  Sort-Object Length -Descending |
  Select-Object Name,Length

(Get-ChildItem public\pptx\chapters\ch-*.png -File |
  Measure-Object -Property Length -Sum).Sum
```

### Excel

- Builder OOXML : `src/utils/export/xlsxBuilder.ts`.

### Traçabilité exports

- Fingerprint : `src/utils/export/exportFingerprint.ts`.

Objectif : hasher un manifest déterministe (pas le binaire) pour limiter les variations non métier.

---

## Base-Contrat — Référentiel Patrimonial (Pivot Hardcodé)

Source de vérité : `src/domain/base-contrat/` (catalogue + règles).
Overlays admin : table `base_contrat_overrides` (clôture/réouverture + date + note + statut de revue juridique).

UI : `/settings/base-contrat` est une vue read-only à 3 colonnes (Constitution / Sortie-Rachat / Décès-Transmission), avec toggle Particulier/Entreprise.

### Base CG retraite

Source applicative : `public.base_cg_retraite_contracts` + `public.base_cg_retraite_documents`, lus par `src/utils/cache/baseCgRetraiteRepository.ts`. Le catalogue TypeScript statique n'est plus une source runtime.

UI : `/settings/base-contrat-retraite`, déclarée dans `src/routes/settingsRoutes.ts`. La lecture est accessible aux utilisateurs authentifiés ; les actions de création, modification et suppression restent réservées aux admins via l'UI et les protections Supabase/RLS.

Tables Supabase :

- `base_cg_retraite_contracts` : contrats canoniques avec colonnes structurées (`source_id`, `company`, `contract_name`, `contract_type`, `per_compartment`), `contract_data`, `row_hash`, `is_deleted`.
- `base_cg_retraite_catalog_meta` : `schema_version`, counts et `canonical_hash` global recalculés par triggers SQL après backfill, soft-delete et modifications admin contrats/documents.
- `base_cg_retraite_documents` : métadonnées et liens de documents associés aux contrats.

La suppression admin d'un contrat est un soft-delete (`is_deleted = true`) ; les lectures runtime filtrent `is_deleted = false` et les documents sont conservés. L'ancienne table `base_cg_retraite_overrides` n'est plus lue par l'app, mais n'est pas supprimée dans la migration canonique pour garder une fenêtre de validation distante et rollback. Si Supabase est indisponible ou si la migration canonique manque, PER et Settings affichent une erreur explicite au lieu de calculer sur un catalogue vide.

Les fichiers Office de travail restent hors Git ; `npm run check:no-office-artifacts` bloque tout `.xls`, `.xlsx`, `.xlsm`, `.ppt` ou `.pptx` versionné par erreur.

### Gouvernance catalogue — assimilation

- Si les règles fiscales sont identiques : **pas de sous-catégories** (assimilation).
- Exemples : crypto-actifs (BTC/ETH/NFT/...) → 1 produit ; métaux précieux (or/argent/platine/...) → 1 produit.
- Ces produits assimilés sont rangés dans **GrandeFamille = `Autres`**.

### Taxonomie (5 catalogKind)

| catalogKind     | Description                                       | Exemples                                                          |
| --------------- | ------------------------------------------------- | ----------------------------------------------------------------- |
| **wrapper**     | Enveloppes/Supports fiscaux (où l'actif est logé) | Assurance-vie, PEA, CTO, PER, PEE, SCI                            |
| **asset**       | Actifs détenables en direct (quoi)                | Immo locatif, Résidence principale, Titres vifs, SCPI, Liquidités |
| **liability**   | Passif/Dettes (crucial pour actif net)            | Crédit amortissable, Prêt in fine, Lombard                        |
| **tax_overlay** | Surcouches fiscales (applicables sur un asset)    | Pinel, Malraux, Déficit foncier                                   |
| **protection**  | Prévoyance/Assurances (calculables)               | Prévoyance individuelle, Assurance emprunteur                     |

### Blocs de règles par catalogKind

| catalogKind     | Blocs disponibles (exemples)                         |
| --------------- | ---------------------------------------------------- |
| **wrapper**     | DMTG droit commun, PS fonds €, PFU, Art. 990I/757B   |
| **asset**       | PV immobilières, Revenus fonciers, BIC meublé, IFI   |
| **liability**   | Déductibilité IFI, Passif successoral                |
| **tax_overlay** | Réduction IR dispositif, Déficit foncier reportable  |
| **protection**  | Primes déductibles, Rentes invalidité, Capital décès |

### Vérification

```powershell
# Nombre de catalogKind (pivot)
rg "export type CatalogKind" src/domain/base-contrat/types.ts
# → 1

# Catalogue hardcodé (périmètre)
rg "export const CATALOG" src/domain/base-contrat/catalog.ts
# → 1
```

---

## Taux vivants & Settings fiscaux

### Définition

**Taux vivants** = valeurs numériques fiscales **révisables annuellement** (barèmes, taux, abattements, plafonds réglementaires), par opposition aux **règles structurelles** (principes codifiés dans le Code civil, modifiables uniquement par loi ordinaire distincte du PLF).

**Principe cardinal** : les `rules/library/*.ts` ne doivent **jamais** contenir de valeur numériquement révisable sans commentaire `// À confirmer` et référence légale. Les taux vivants doivent vivre dans Supabase, pas dans le code.

---

### Pages settings existantes

| Route                             | Composant                    | Table Supabase                                                                                   | Périmètre                                                                                          |
| --------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `/settings`                       | `Settings`                   | —                                                                                                | Généraux (placeholder)                                                                             |
| `/settings/impots`                | `SettingsImpots`             | `tax_settings`                                                                                   | Barème IR (2 ans), PFU part IR, CEHR/CDHR, IFI                                                     |
| `/settings/comptables-societes`   | `SettingsComptablesSocietes` | `tax_settings`                                                                                   | IS, régime mère-fille, déductibilité CCA/dividendes                                                |
| `/settings/prelevements`          | `SettingsPrelevements`       | `ps_settings`                                                                                    | PS patrimoine (cas général + régime d'exception), cotisations retraite, seuils RFR (CSG/CRDS/CASA) |
| `/settings/base-contrat`          | `BaseContrat`                | `base_contrat_overrides`                                                                         | Référentiel produits (read-only 3 colonnes + toggles admin)                                        |
| `/settings/base-contrat-retraite` | `BaseCgRetraite`             | `base_cg_retraite_contracts`, `base_cg_retraite_documents` (`base_cg_retraite_catalog_meta` ops) | Base CG retraite canonique Supabase + documents admin                                              |
| `/settings/prevoyance-regimes`    | `PrevoyanceRegimes`          | `prevoyance_regime_settings`, `prevoyance_maintien_employeur_settings`                           | Réglages Prévoyance V1                                                                             |
| `/settings/design-system`         | `SettingsDesignSystem`       | —                                                                                                | Audit visuel interne admin                                                                         |
| `/settings/comptes`               | `SettingsComptes`            | `profiles`                                                                                       | Comptes utilisateurs par cabinet (admin only)                                                      |
| `/settings/dmtg-succession`       | `SettingsDmtgSuccession`     | `tax_settings`, `fiscality_settings`                                                             | Éditeur unique DMTG successions + donations + AV décès                                             |

Source unique des routes : `src/routes/settingsRoutes.ts`.
Shell de navigation : `src/pages/SettingsShell.tsx` (rendu dynamique des onglets, filtre `adminOnly`).

---

### Tables Supabase (singletons, `id = 1`)

| Table                           | Périmètre                                                                                                    | RLS lecture | RLS écriture |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------- | ------------ |
| `tax_settings`                  | IR barème (N et N-1), PFU part IR, CEHR/CDHR, IFI, IS, DMTG barèmes+abattements                              | Auth        | Admin        |
| `ps_settings`                   | PS patrimoine (cas général + régime d'exception), cotisations retraite par tranche, seuils RFR (1/2/3 parts) | Auth        | Admin        |
| `fiscality_settings`            | Règles par enveloppe (AV, PER, PEA, CTO, dividendes…) — taux, abattements, seuils                            | Auth        | Admin        |
| `pass_history`                  | Historique PASS annuel administré dans Settings > Prelevements (multi-lignes, clé `year`)                    | Auth        | Admin        |
| `base_contrat_settings`         | Singleton de config catalogue présent dans le schéma, non consommé par le runtime courant                    | Auth        | Admin        |
| `base_contrat_overrides`        | Clôture/réouverture produit + note admin + statut de revue juridique (uuid per product)                      | Admin       | Admin        |
| `base_cg_retraite_contracts`    | Catalogue canonique Base CG retraite, soft-delete, hash par contrat                                          | Auth        | Admin        |
| `base_cg_retraite_catalog_meta` | Version, counts et hash global du catalogue Base CG retraite                                                 | Auth        | Triggers SQL |
| `base_cg_retraite_documents`    | Documents Base CG retraite liés aux contrats canoniques                                                      | Auth        | Admin        |

Schéma complet : `supabase/migrations/20260210214352_remote_commit.sql`.

---

### Flux complet : Supabase → Engine

```
┌──────────────────────────────────────────────────────────┐
│ SUPABASE (3 singletons id=1 + pass_history)              │
│  tax_settings · ps_settings · fiscality_settings         │
│  + pass_history                                          │
└──────────────────────────┬───────────────────────────────┘
          RLS: auth READ / admin WRITE
          Admin save → supabase.upsert({id:1, data})
                     → invalidate(kind) + broadcastInvalidation(kind)
                                              │ CustomEvent
┌──────────────────────────▼───────────────────────────────┐
│ fiscalSettingsCache.ts  (src/utils/cache/)                │
│  · Stale-while-revalidate : retour immédiat cache/défauts│
│  · Fetch Supabase en arrière-plan (non-bloquant)         │
│  · TTL 24 h · localStorage (anti-flash cold start)       │
│  · Timeout Supabase 8 s (fallback défauts si KO)         │
│  · addInvalidationListener() : écoute les invalidations  │
└──────────────────────────┬───────────────────────────────┘
                           │ getFiscalSettings({force})
┌──────────────────────────▼───────────────────────────────┐
│ useFiscalContext.ts  (src/hooks/)                        │
│  · Monte tax, ps, fiscality et PASS                      │
│  · Expose les defaults tant que le cache se réhydrate    │
│  · Relaye les invalidations settings                     │
└──────────────────────────┬───────────────────────────────┘
                           │ fiscalContext
┌──────────────────────────▼───────────────────────────────┐
│ usePlacementSettings.ts  (src/hooks/)                    │
│  · Adapte le contexte fiscal pour Placement              │
│  · Appelle extractFiscalParams(fiscality, ps, tax)       │
│  · Dérive tmiOptions depuis barème IR                    │
│  → fiscalParams (34 valeurs numériques normalisées)      │
└──────────────────────────┬───────────────────────────────┘
                           │ fiscalParams
┌──────────────────────────▼───────────────────────────────┐
│ Engine  (src/engine/)                                    │
│  · Zéro React · Zéro side effects · Déterministe        │
│  · simulateEpargne · calculFiscaliteRetrait              │
│  · calculateSuccession · simulateLiquidation …           │
└──────────────────────────────────────────────────────────┘
```

**extractFiscalParams()** (`src/engine/placement/fiscalParams.ts`) : mappe le JSONB des tables → objet normalisé de valeurs numériques. Le fallback `DEFAULT_FISCAL_PARAMS` (`src/engine/placement/shared.ts`) est lui-même dérivé de `settingsDefaults.ts`, sans valeurs fiscales révisables en dur dans le moteur.

---

### Dossier fiscal unifié — `useFiscalContext`

**Point d'entrée unique** : `src/hooks/useFiscalContext.ts`

Tous les simulateurs consomment les paramètres fiscaux via ce hook. Il expose un `fiscalContext` aux clés stables, indépendamment de la structure Supabase.

#### Deux modes

| Mode                     | Usage                | Comportement                                                                                                                                                                                              |
| ------------------------ | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `strict: true`           | IR, Succession       | Attend Supabase avant de retourner — bloque sur un écran de chargement si Supabase est lent                                                                                                               |
| `strict: false` (défaut) | Placement, Stratégie | Stale-while-revalidate — retourne cache/défauts immédiatement ; le fetch arrière-plan alimente le cache pour les appels suivants, sans garantir un second rendu au cold start hors invalidation explicite |

#### Clés normalisées exposées

```ts
fiscalContext.irScaleCurrent; // barème IR année courante
fiscalContext.irScalePrevious; // barème IR année précédente
fiscalContext.pfuRateIR; // taux IR PFU
fiscalContext.psRateGeneral; // taux PS patrimoine cas général
fiscalContext.psRateException; // taux PS patrimoine régime d'exception
fiscalContext.dmtgScaleLigneDirecte; // barème DMTG ligne directe
fiscalContext.dmtgAbattementEnfant; // abattement ligne directe
fiscalContext.dmtgSettings; // objet DMTG complet { ligneDirecte, frereSoeur, neveuNiece, autre }
fiscalContext.ifi; // paramètres IFI normalisés
fiscalContext.cdhr; // paramètres CDHR normalisés
fiscalContext.passHistoryByYear; // historique PASS runtime (source: public.pass_history)
fiscalContext._raw_tax; // brut tax_settings, réservé aux adaptateurs nommés
fiscalContext._raw_ps; // brut ps_settings, réservé aux adaptateurs nommés
fiscalContext._raw_fiscality; // brut fiscality_settings, réservé aux adaptateurs nommés
```

Les clés `_raw_*` sont une échappatoire d'adaptateur, pas une API feature courante. Elles sont autorisées uniquement dans `src/hooks/useFiscalContext.ts`, les adaptateurs fiscaux nommés, les helpers de fingerprint fiscal et les tests. La garde `npm run check:raw-fiscal-usage` bloque toute consommation dispersée dans les composants, hooks métier ou moteurs.

Adaptateurs connus :

- `src/features/ir/utils/irFiscalSettings.ts`
- `src/features/per/fiscal/perPotentielFiscalAdapter.ts`
- `src/features/tresorerie-societe/hooks/tresorerieFiscalParams.ts`
- `src/hooks/usePlacementSettings.ts`
- `src/features/succession/successionFiscalContext.ts`
- `src/domain/base-contrat/rules/fiscalLabels.ts`

#### Invalidation

L'admin sauvegarde → `invalidate(kind)` + `broadcastInvalidation(kind)` → événement `ser1:fiscal-settings-updated` → tous les `useFiscalContext` actifs se rafraîchissent, y compris les consommateurs non stricts.

#### Adaptateur Placement

Le simulateur Placement suit la chaîne standard : `Supabase` → `fiscalSettingsCache.ts` → `useFiscalContext` → `usePlacementSettings` → `engine/placement`.

`usePlacementSettings` projette le dossier fiscal unifié vers le format attendu par `engine/placement`. Il utilise les tables brutes uniquement pour `extractFiscalParams()`, puis les clés normalisées (`irScaleCurrent`, `dmtgScaleLigneDirecte`, `dmtgAbattementEnfant`) pour les besoins propres à l'interface Placement.

---

#### Adaptateur Base-Contrat

Le référentiel Base-Contrat reste pur côté domaine :

- `src/domain/base-contrat/rules/fiscalLabels.ts` construit des libellés fiscaux à partir d'un contexte fourni.
- `getRules(productId, audience, context?)` rend les placeholders fiscaux avec ces libellés.
- `src/pages/settings/BaseContrat.tsx` est le seul point qui branche `useFiscalContext()` sur ce rendu.

Les fichiers `src/domain/base-contrat/**` ne doivent pas importer React, Supabase ni les hooks applicatifs.

---

### Identité fiscale & snapshot v4 — `FiscalIdentity`

**Objectif** : détecter si les paramètres fiscaux ont changé entre la sauvegarde d'un dossier `.ser1` et son rechargement ultérieur.

**Mécanisme** (PR #162) :

1. Au démarrage de l'app (`App.tsx`), `fingerprintSettingsData()` calcule un hash SHA-256 des 3 singletons fiscaux et de `pass_history`.
2. Ce fingerprint (`FiscalIdentity`) est stocké dans chaque `.ser1` sauvegardé (snapshot schéma v4).
3. Au chargement d'un `.ser1`, le fingerprint sauvegardé est comparé au fingerprint courant.
4. En cas de mismatch → notification "Attention : les paramètres fiscaux ont été mis à jour depuis la sauvegarde."

**Fichiers** :

| Rôle                      | Fichier                                                             |
| ------------------------- | ------------------------------------------------------------------- |
| Calcul du fingerprint     | `src/utils/export/exportFingerprint.ts` (`fingerprintSettingsData`) |
| Adaptateur fingerprint    | `src/utils/fiscalSettingsFingerprints.ts`                           |
| Comparaison au chargement | `src/App.tsx`                                                       |
| Migration snapshot v3→v4  | `src/reporting/snapshot/snapshotMigrations.ts`                      |

---

### Classification : taux vivants vs règles structurelles

#### Taux vivants (Supabase, modifiables admin, susceptibles de changer à chaque PLF)

| Catégorie            | Paramètres                                                                          | Table                          | Référence légale        |
| -------------------- | ----------------------------------------------------------------------------------- | ------------------------------ | ----------------------- |
| **IR**               | Barème 5 tranches (seuils + taux), abattement DOM                                   | `tax_settings`                 | Art. 197 CGI            |
| **PFU**              | Taux IR du PFU. La part PS est dérivée depuis `ps_settings`                         | `tax_settings`                 | Art. 200 A CGI          |
| **CEHR/CDHR**        | Seuils et taux effectif minimal                                                     | `tax_settings`                 | Art. 223 sexies CGI     |
| **IFI**              | Seuil d'entrée, abattement résidence principale et barème                           | `tax_settings`                 | Art. 964 & 977 CGI      |
| **IS**               | Taux réduit, seuil réduit, taux normal, régime mère-fille et déductibilité CCA      | `tax_settings`                 | Art. 209 & 219 CGI      |
| **DMTG successions** | Barèmes par lien de parenté + abattements                                           | `tax_settings`                 | Art. 777 & 779 CGI      |
| **DMTG donations**   | Abattements spécifiques donation (31 865 €, 80 724 €…)                              | _(non implémenté — futur PLF)_ | Art. 779, 790 E/F/G CGI |
| **Assurance-vie**    | Abattements 990 I / 757 B et barème forfaitaire décès                               | `fiscality_settings`           | Art. 990 I & 757 B CGI  |
| **PS patrimoine**    | Taux cas général + taux régime d'exception + CSG déductible                         | `ps_settings`                  | Art. L136-6 CSS         |
| **Seuils RFR**       | Par nombre de parts (CSG taux réduit, CRDS exo)                                     | `ps_settings`                  | Art. L136-8 CSS         |
| **PASS**             | Historique PASS annuel administre dans Settings et charge via `public.pass_history` | `pass_history`                 | Art. D612-5 CSS         |

#### Règles structurelles (logique moteur, Code civil ou loi ordinaire)

| Règle                                                    | Source                                   | Stabilité                        |
| -------------------------------------------------------- | ---------------------------------------- | -------------------------------- |
| Réserve héréditaire (1/2, 2/3, 3/4 selon nbre d'enfants) | Art. 912-913 Code civil                  | Très stable                      |
| Exonération conjoint survivant (succession)              | Art. 796-0 bis CGI (loi TEPA 2007)       | Stable                           |
| Exonération partenaire PACS (succession)                 | Art. 796-0 bis CGI                       | Stable                           |
| Délai de rappel fiscal : 15 ans                          | Art. 784 CGI                             | Stable (était 10 ans avant 2012) |
| Assurance-vie hors succession (primes < 70 ans)          | Art. L132-12 Code assurances + 990 I CGI | Stable (principe)                |
| Représentation successorale (enfant prédécédé)           | Art. 751 Code civil                      | Très stable                      |
| Rapport civil (sans limite de temps)                     | Art. 843 Code civil                      | Stable                           |
| Régimes matrimoniaux (définitions actif successoral)     | Art. 1400, 1536, 1526, 1569 Code civil   | Très stable                      |
| Usufruit légal conjoint survivant                        | Art. 757 Code civil                      | Stable                           |
| Barème nue-propriété / usufruit                          | Art. 669 CGI                             | Modifiable PLF                   |

---

### Périmètre de fiabilité du modèle succession

> Périmètre produit documenté dans [METIER.md](METIER.md), section "Périmètre de fiabilité du modèle matrimonial et successoral".
> Toute PR qui étend les régimes matrimoniaux, la liquidation civile ou les masses patrimoniales doit mettre à jour cette matrice de périmètre en même temps que le code.

---

### Fichiers clés

| Rôle                                        | Fichier                                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Source des routes settings                  | `src/routes/settingsRoutes.ts`                                                              |
| Valeurs par défaut des 3 singletons fiscaux | `src/constants/settingsDefaults.ts`                                                         |
| Référentiel juridique canonique             | `src/domain/legal-references/`                                                              |
| Chaînage références Settings                | `src/domain/settings-references/chain.json`                                                 |
| Shell settings (nav + rendu)                | `src/pages/SettingsShell.tsx`                                                               |
| Pages settings                              | `src/pages/settings/`                                                                       |
| Cache + fetch Supabase                      | `src/utils/cache/fiscalSettingsCache.ts`                                                    |
| **Hook unifié dossier fiscal**              | **`src/hooks/useFiscalContext.ts`**                                                         |
| Hook simulateur placement                   | `src/hooks/usePlacementSettings.ts`                                                         |
| Extraction params normalisés                | `src/engine/placement/fiscalParams.ts`                                                      |
| Params Placement par défaut                 | `src/engine/placement/shared.ts` (`DEFAULT_FISCAL_PARAMS`, dérivé de `settingsDefaults.ts`) |
| Registry Settings fiscaux/métier            | `src/domain/settings-registry/`                                                             |
| Libellés fiscaux Base-Contrat               | `src/domain/base-contrat/rules/fiscalLabels.ts`                                             |
| Profil fiscal par enveloppe                 | `src/domain/base-contrat/rules/fiscalProfile.ts`                                            |
| Migration snapshot (v4 + identity)          | `src/reporting/snapshot/snapshotMigrations.ts`                                              |

---

## Conventions de creation (simulateurs, settings, features)

Cette section fixe comment ajouter une page, une route ou une feature sans creer de nouveau pattern implicite.

### 1) Ajouter un nouveau simulateur /sim/\*

#### Regle

- Toute nouvelle route simulateur vit dans le registre `src/routes/simRouteContracts.ts`, puis
  dans `APP_ROUTES` dans `src/routes/appRoutes.ts`.
- Le chemin canonique est toujours `/sim/<slug>`.
- Les routes courtes historiques (`/<slug>`) ne sont pas déclarées : le seul chemin public d'un simulateur est `/sim/<slug>`.
- Pour créer le squelette d'un simulateur actif, utiliser :
  `npm run scaffold:sim -- --id <slug> --label "<Libellé>"`.

#### Structure cible

- API publique de feature : `src/features/<slug>/index.ts`
- `src/routes/` et les autres features importent uniquement cette API publique, jamais les fichiers internes de la feature.
- Page ou orchestrateur : `src/features/<slug>/<Feature>Page.tsx` ou composant equivalent exporte par `index.ts`.
- Sous-dossiers typiques selon besoin :
  - `components/`
  - `hooks/`
  - `export/`
  - `utils/`
  - `__tests__/`

#### Contrats obligatoires

- Le calcul metier reste dans `src/engine/` si le simulateur introduit une vraie logique de calcul.
- La route doit déclarer un `contextLabel` et une `topbar` cohérents avec le registre simulateur.
- Si le simulateur est actif, déclarer un `resetKey` et un `pageTestId` dans le registre.
- Le contrat statique des routes `/sim/*` est vérifié par `src/routes/__tests__/appRoutes.contract.test.ts` : route `private`, `lazy`, `contextLabel`, bouton Home, `resetKey` pour les simulateurs actifs, exception explicite pour les hubs/placeholders.
- Le smoke authentifié `scripts/e2e-auth-pages-smoke.mjs` dérive ses routes depuis les sources de vérité ; ne pas y recréer de liste `/sim/*`.
  `npm run check:e2e-auth-pages-coverage` bloque toute désynchronisation entre `APP_ROUTES`, `SETTINGS_ROUTES`, le registre simulateur et le smoke.
- Le smoke authentifié vérifie aussi que chaque simulateur actif rend un vrai `SimPageShell`
  visible via le `pageTestId` du registre.
- Un simulateur actif, hors `UpcomingSimulatorPage`, doit avoir un scénario Playwright authentifié
  dans `tests/e2e/` qui couvre au minimum le chargement connecté et une interaction métier utile.
  Le smoke authentifié vérifie la couverture de routes, pas la valeur fonctionnelle du simulateur.
- Le mode global Home (`ui_settings.mode`) doit etre respecte par defaut ; un override local est permis seulement s'il reste non persistant.
- Les paramètres fiscaux passent par `useFiscalContext` pour les nouveaux simulateurs. `usePlacementSettings` est l'adaptateur fiscal du simulateur Placement, au-dessus de `useFiscalContext` et de `extractFiscalParams()`.
- Toute consommation fiscale/métier d'un simulateur doit déclarer sa clé dans `SimulatorDefinition.settingsKeys`; la clé doit exister dans `src/domain/settings-registry/` et ne pas être `planned` pour un simulateur actif, hub ou placeholder.
- Aucun `SimulatorAdapter` runtime commun n'est requis par defaut : le contrat est l'API publique de feature + les garde-fous d'architecture.

#### Si le simulateur n'est pas pret

- Utiliser `UpcomingSimulatorPage` tant que le simulateur n'a pas un contrat UI ou metier stable.
- Ne pas livrer une page `/sim/*` demi-finie avec architecture definitive implicite.

### 2) Ajouter une nouvelle page /settings/\*

#### Regle

- La source unique des sous-pages settings est `src/routes/settingsRoutes.ts`.
- Toute nouvelle page settings doit etre declaree dans `SETTINGS_ROUTES` avec :
  - `key`
  - `label`
  - `path`
  - `urlPath`
  - `component`
  - `adminOnly` si necessaire
- Tout claim affiche par une page ou section settings (valeur fiscale, regle exposee, donnee sensible) doit etre declare
  dans `src/domain/settings-references/chain.json` : soit avec `refIds` + `relevanceNote` +
  `verifiedAt` + `target`, soit avec un `noRefReason` explicite si aucune source officielle ne
  s'applique. Source primaire BOFiP pour les valeurs chiffrees. Voir la procedure annuelle dans
  `docs/RUNBOOK.md`. Garde-fou local : `npm run check:settings-references`.
- Tout paramètre fiscal/métier nouveau doit aussi être déclaré dans `src/domain/settings-registry/`
  avec famille, millésime, propriétaire settings, référence et statut `ready`, `partial` ou `planned`.

#### Emplacement

- Composant de page : `src/pages/settings/<PageName>.tsx`
- Navigation et rendu : `src/pages/SettingsShell.tsx`
- Mapping URL actif : helpers dans `src/routes/settingsRoutes.ts`

#### Contrats obligatoires

- Ne pas creer une navigation settings parallele hors `SettingsShell`.
- Si une page sensible est `adminOnly` en front, verifier aussi l'enforcement backend/RLS.
- Si une route settings remplace une ancienne route, documenter le mapping de migration et vérifier l'absence de redirect runtime non voulu.

### 3) Organiser une feature de simulateur

#### Regle

- Une feature regroupe uniquement ce qui lui appartient vraiment.
- Les composants partages vivent hors feature seulement s'ils sont reemployes par plusieurs domaines.

#### Repartition recommandee

- `src/engine/` : calcul pur, zero React
- `src/features/<slug>/` : UI, state, orchestration, exports lies a la feature
- `src/features/<slug>/index.ts` : API publique de la feature, seule surface importable depuis `src/routes/` ou une autre feature
- `src/reporting/` : contrats de snapshot et migrations ; imports autorisés vers `src/engine/` ou `src/domain/`, pas vers `src/features/`
- `src/components/` : composants transverses reutilises
- `src/styles/` : styles partages, tokens, patterns communs
- `src/pages/` : shells et pages transverses, pas la logique metier d'un simulateur

#### Interdits

- Calcul fiscal dans un composant React
- Import CSS cross-feature depuis une autre feature
- Import `../../../` hors tests : passer par `@/` pour tout cross-module
- Import de `src/features/` depuis `src/reporting/`
- Nouveau dossier `legacy/`, `__spike__` ou `_raw` en prod
- Fichier "god component" si un decoupage simple composant/hook suffit

### 4) Checklist minimale avant merge

- Route ou page ajoutée à la bonne source de vérité (`simRouteContracts`, `APP_ROUTES` ou `SETTINGS_ROUTES`)
- Pour une route `/sim/*`, `npm test -- src/routes` doit valider le contrat `APP_ROUTES`.
- Pour une route privée, `/sim/*` ou `/settings/*`, `npm run check:e2e-auth-pages-coverage`
  doit valider la couverture du smoke authentifié.
- Pour un simulateur actif, une spec Playwright authentifiée existe ou l'exception placeholder
  est documentée dans la PR.
- Les imports publics de features restent vérifiés par `npm run check:arch` (`routes-no-feature-internals`).
- Les imports profonds hors tests restent à zéro via `npm run check:deep-imports`.
- Docs pivots mises a jour si le contrat change
- Test adapte au statut du sujet :
  - simulateur stable : smoke test ou test cible
  - simulateur upcoming : au minimum ouverture de route / rendu attendu
- `npm run report:large-files` liste les fichiers `src` à 400+ lignes avec décision, catégorie et plafond de baseline. Le gate bloquant reste `npm run check:large-files-baseline`, qui empêche les nouveaux gros fichiers et la croissance silencieuse.
- Aucun nouveau pattern structurel implicite non documente

---

## Références

- Gouvernance UI/couleurs/thème : `docs/GOUVERNANCE.md`
- Gouvernance exports PPTX/XLSX : `docs/GOUVERNANCE_EXPORTS.md`
- Runbook debug + edge + migrations : `docs/RUNBOOK.md`
- Trajectoire produit : `docs/ROADMAP.md`
