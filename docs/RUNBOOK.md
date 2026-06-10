# RUNBOOK (dev / ops)

## But

Donner une procédure **actionnable** pour exécuter, diagnostiquer et opérer le repo (local dev, Supabase, Edge Functions, troubleshooting).

## Audience

Dev qui doit dépanner vite, ou exécuter un parcours local/CI.

## Ce que ce doc couvre / ne couvre pas

- ✅ Couvre : commandes, symptômes→cause→fix, flags debug, Edge Functions, migrations.
- ❌ Ne couvre pas : les conventions UI/couleurs (voir `docs/GOUVERNANCE.md`) ni les contrats d’exports PPTX/Excel (voir `docs/GOUVERNANCE_EXPORTS.md`).

## Sommaire

- [Checks du repo](#checks-du-repo)
- [Dev local (frontend)](#dev-local-frontend)
- [Env vars](#env-vars)
- [Debug flags & console policy](#debug-flags--console-policy)
- [Observabilité production](#observabilité-production)
- [CI, coverage et performance](#ci-coverage-et-performance)
- [Previews Vercel](#previews-vercel)
- [Supabase local + migrations](#supabase-local--migrations)
- [Gouvernance admin — admin_accounts](#gouvernance-admin--admin_accounts)
- [Edge Function admin](#edge-function-admin)
- [Troubleshooting rapide](#troubleshooting-rapide)
- [Catalogue : principes](#catalogue--principes)

Note securite : `admin_accounts` et `admin_action_audit` doivent rester `service_role only` avec des policies explicites `TO service_role`. Si Security Advisor remonte `RLS enabled no policy`, verifier que la migration de hardening est bien deployee.

---

## Checks du repo

- Check complet :
  - `npm run check` lance les familles `check:static`, `check:architecture`, `check:fiscal`, `check:supabase`, `check:exports`, `check:baselines`, `check:types`, `check:tests` et `check:build`.
  - Ancienne correspondance : format/lint/CSS/theme/couleurs/no-js/no-console/no-office/routes/naming/unused → `check:static`; dependency-cruiser/circular/orphans/imports profonds → `check:architecture`; hardcodes fiscaux/raw fiscal → `check:fiscal`; Base-CG/RLS settings/Storage/migrations → `check:supabase`; parité exports/images PPTX → `check:exports`; fichiers longs → `check:baselines`; TypeScript/tests/build → `check:types`/`check:tests`/`check:build`.

En CI, c'est le gate principal.
Le workflow `CI` expose quatre jobs requis :

- `checks` : guard env, `check:pre-merge`, familles statiques/architecture/fiscal/Supabase/exports/baselines/types, `lint:repo`, `typecheck:tests`, `typecheck:node`.
- `tests` : `npm run check:tests`.
- `build` : `npm run check:build`.
- `deno-admin` : sentinelle toujours visible ; exécute `npm run test:deno` seulement si le périmètre Supabase functions/migrations, package ou workflow admin change.

Le workflow `E2E Tests` exécute `e2e-functional` sur les PR et la merge queue. Le workflow `E2E Visual` expose `e2e-visual`, toujours vert hors périmètre UI/visuel et exécuté dans le conteneur Playwright quand une PR touche `src/`, `public/`, `tests/e2e/`, `playwright.config.ts`, `package*.json` ou les workflows E2E.
`audit:prod` est déplacé hors chemin chaud PR et tourne dans `Quality reports` (manuel/cron/main). `coverage`, `build:storybook` et `lhci` restent des contrôles de reporting, avec LHCI non bloquant.

Checks requis GitHub attendus : `CI / checks`, `CI / tests`, `CI / build`, `CI / deno-admin`, `E2E Tests / e2e-functional`, `E2E Visual / e2e-visual`.

Lors d'un renommage de checks requis, éviter le blocage `expected — never reported` :

1. Pousser la branche pour faire apparaître les nouveaux checks.
2. Retirer les anciens checks requis de la branch protection et ajouter les nouveaux.
3. Relancer la PR avec un re-run ou un commit vide.
4. Merger seulement après statuts verts sur les nouveaux noms.

Scripts ponctuels documentés :

- `npm run audit:base-contrat-dmtg` : audit manuel ciblé Base-Contrat/DMTG, hors CI.
- `npm run check:settings-references` : garde local du chaînage Settings ↔ références juridiques, branché dans `check:static`. Le registre est exhaustif ; le rapport liste les pages représentées, le nombre de bindings déclarés par page et `coverage.byPage[*].declared/expected`. `coverage.mode` doit rester `exhaustive` et `coverage.isExhaustive = true`.
- `npm run check:memento-coverage` : garde Vitest du mémento patrimonial & social, branchée dans `check:static`. Le check réexécute la taxonomie, la couverture simulateurs, les invariants ownerPagePath ↔ `SETTINGS_ROUTES`, registres settings/références/simulateurs, lifecycles non couverts et route société canonique `/settings/comptables-societes`. En cas d'échec, corriger `src/domain/settings-memento/`, `src/routes/settingsRoutes.ts` ou le registre source concerné ; ne pas ajouter de script `.mjs` parallèle ni de valeur fiscale/sociale dans le mémento.
- `npm run audit:settings-references -- --stale` : audit manuel de fraîcheur du chaînage Settings. Pour la liveness URL, `404`/`410` signifie URL morte et bloque l'audit ; `401`/`403`/`429` signifie URL non vérifiable automatiquement et reste un avertissement. Les timeouts, erreurs DNS et `5xx` sont inconclusifs, pas des preuves d'URL morte.
- `npm run audit:settings-references -- --stale --with-db` : même audit avec lecture Supabase des sources prévoyance si une URL Supabase et une clé de lecture autorisée sont disponibles, ou avec `SUPABASE_ANON_KEY` + `E2E_EMAIL`/`E2E_PASSWORD` pour une lecture authentifiée.
- `npm run audit:css-usage` et `npm run audit:unicode` : diagnostics manuels de nettoyage, hors CI.
- `npm run snapshot:sim` : capture visuelle locale, hors CI tant que le résultat n'est pas exploité comme gate.
- `npm run report:large-files` : rapport manuel des fichiers `src` à 400+ lignes avec décision, catégorie et plafond de baseline.
- `npm run check:large-files-baseline` : gate bloquant. Il refuse tout fichier `src/**/*.ts(x)` au-delà de 500 lignes sans entrée structurée dans `scripts/baselines/large-files.json`, toute entrée sans justification, toute entrée devenue inutile et toute croissance au-delà du `maxLines` figé.

- Garde d'architecture uniquement :
  - `npm run check:arch` (dependency-cruiser, bloquant sur violation de frontière)

Règles enforced :

- `engine/` et `domain/` : zéro React, zéro imports features/pages
- `features/` : pas d'import de pages
- `pages/` : imports features via `index.ts` uniquement
- Cross-feature : internals d'une feature ne sont pas importables depuis une autre feature

### Sous-step : `check:fiscal-hardcode`

Commande : `npm run check:fiscal-hardcode` (ou inclus dans `npm run check`).

**Ce que ça vérifie** : absence de valeurs fiscales révisables en dur dans `src/engine/`, `src/domain/base-contrat/rules/`, `src/domain/settings-registry/`, `src/domain/settings-memento/`, `src/features/`, `src/hooks/` et `src/pages/settings/` (hors tests). La liste exacte surveillée vit dans `FORBIDDEN_VALUES` dans `scripts/check-no-hardcoded-fiscal-values.mjs` et couvre notamment :

| Exemple          | Label                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------- |
| `17,2` / `0.172` | Taux PS patrimoine                                                                      |
| `12,8` / `0.128` | Taux IR PFU                                                                             |
| `PFU 30 %`       | Libellé PFU figé                                                                        |
| `100000`         | Abattement enfant DMTG (ligne directe)                                                  |
| `15932`          | Abattement frère/sœur DMTG                                                              |
| PASS historiques | valeurs annuelles PASS à maintenir uniquement dans les settings et fallbacks documentés |

**Seul fichier autorisé** à contenir ces valeurs : `src/constants/settingsDefaults.ts`.

**Cas `settings-memento`** : le mémento peut citer Laplace, l'Excel charges sociales ou le PDF
retraite comme sources de couverture, mais ces documents restent des checklists candidates. Pour
passer une entrée à `couvert`, rattacher au moins un `refId` ou un claim `settings-references` à une
source officielle adaptée : CGI, BOFiP, Code civil, Code de commerce, Code de la sécurité sociale
(CSS), BOSS, URSSAF, Service-public, Assurance retraite, AGIRC-ARRCO, CNAVPL, MSA, caisses
professionnelles, Legifrance ou source institutionnelle pertinente. Sans source officielle qualifiée,
utiliser `a_verifier` ou `blocked_missing_official_source`.

**Si la garde échoue** (violation détectée) : déplacer la valeur en dur vers `settingsDefaults.ts` et la consommer via `DEFAULT_TAX_SETTINGS` ou `useFiscalContext`.

**Si une valeur légale change au PLF** (ex: abattement 100 000 € → 120 000 €) :

1. Mettre à jour la valeur dans `settingsDefaults.ts` (défaut code) ET dans Supabase via la page settings concernée (`/settings/impots`, `/settings/comptables-societes`, `/settings/prelevements` ou `/settings/dmtg-succession`).
2. Si le pattern `FORBIDDEN_VALUES` dans `check-no-hardcoded-fiscal-values.mjs` référence l'ancienne valeur, mettre à jour le pattern pour correspondre à la nouvelle valeur légale.

### Sous-step : `check:raw-fiscal-usage`

Commande : `npm run check:raw-fiscal-usage` (ou inclus dans `npm run check`).

**Ce que ça vérifie** : les clés `fiscalContext._raw_tax`, `fiscalContext._raw_ps` et `fiscalContext._raw_fiscality` ne sont consommées que dans `useFiscalContext`, les adaptateurs fiscaux nommés, le fingerprint fiscal et les tests.

**Si la garde échoue** : déplacer l'accès brut dans un adaptateur dédié, exposer une donnée nommée au composant/hook consommateur, puis ajouter le fichier à l'allowlist stricte seulement si ce rôle d'adaptateur est explicite.

---

## Scripts versionnés

Ces scripts sont conservés dans le repo car ils servent au gate CI, à l'outillage opérateur ou aux contrôles ponctuels. Ne pas les supprimer sans preuve d'inutilité.

- `scripts/check-no-hardcoded-fiscal-values.mjs` : garde fiscal-hardcode incluse dans `npm run check`.
- `scripts/check-raw-fiscal-usage.mjs` : garde d'accès aux paramètres fiscaux bruts incluse dans `npm run check`.
- `scripts/check-no-hardcoded-css-theme-colors.mjs` : garde couleurs thème incluse dans `npm run check`.
- `scripts/check-theme-sync.mjs` : vérifie l'alignement des tokens thème.
- `scripts/check-css-structure.mjs` : vérifie les contrats d'import CSS.
- `scripts/check-ui-asset-budget.mjs` : budget bloquant des assets `public/ui/**`, inclus dans `npm run check`.
- `scripts/check-no-js.mjs` : bloque les fichiers `.js/.jsx` runtime sous `src/` et `api/`.
- `scripts/scaffold-sim.mjs` : génère le squelette d'un simulateur actif avec route,
  registre, contrat UX et page `SimPageShell`.
- `scripts/pre-merge-check.ps1` : gate local PowerShell avant merge.
- `scripts/scan-unicode.mjs` : contrôle ponctuel des caractères invisibles ou bidi dans `src`, `tests` et `supabase`.
- `scripts/audit-css-usage.mjs` : audit ponctuel de l'usage CSS.
- `tools/scripts/*.ps1` et `tools/scripts/*.mjs` : outillage opérateur/admin/icônes et audits ponctuels.

---

## Dev local (frontend)

- `npm install`
- `npm run dev`

---

## Env vars

Le repo n’utilise pas `.env` :

- Copier `.env.example` → `.env.local` (local uniquement, gitignored)
- Ne jamais committer de secrets.

Variables attendues :

```powershell
VITE_SUPABASE_URL=<supabase_project_url>
VITE_SUPABASE_ANON_KEY=<anon_key>

# Optionnel (Playwright E2E)
E2E_EMAIL=<email>
E2E_PASSWORD=<password>
E2E_AUTH_REQUIRED=true

# Optionnel (observabilité production)
VITE_SENTRY_DSN=<dsn_sentry_frontend>
VITE_SENTRY_TRACES_SAMPLE_RATE=0
VITE_WEB_VITALS=false
```

---

## Debug flags & console policy

### Console

- Autorisé en prod : `console.error`, `console.warn` pour erreurs réelles et observabilité serveur sans contenu sensible.
- Interdit en prod : `console.log/debug/info/trace` dans `src/` et `api/` (bloqué par `check:no-console`).

### Activer des logs

- Via `.env.local` (recommandé) :
  - `VITE_DEBUG_AUTH=1`
  - `VITE_DEBUG_PPTX=1`
  - `VITE_DEBUG_COMPTES=1`

- Via `localStorage` (runtime) :
  - `SER1_DEBUG_AUTH=1`
  - `SER1_DEBUG_PPTX=1`
  - `SER1_DEBUG_COMPTES=1`
  - `SER1_DEBUG_ADMIN=1`
  - `SER1_DEBUG_ADMIN_FETCH=1`

Référence code : `src/utils/debugFlags.ts`.

---

## Observabilité production

L'observabilité frontend est opt-in :

- sans `VITE_SENTRY_DSN`, aucun événement externe n'est envoyé ;
- avec `VITE_SENTRY_DSN`, les erreurs React, les erreurs critiques de bootstrap et les Web Vitals peuvent être envoyés à Sentry ;
- `sendDefaultPii` reste désactivé et le logger redige les clés sensibles (`email`, `nom`, `montant`, `rfr`, `token`, etc.).

Fichiers :

- `src/observability/sentry.ts` : initialisation Sentry, redaction, capture.
- `src/observability/logger.ts` : logger applicatif minimal (`info`, `warn`, `error`).
- `src/observability/webVitals.ts` : métriques CLS, INP, LCP, FCP et TTFB.
- `src/components/AppErrorBoundary.tsx` : capture des erreurs React.

Test manuel en preview :

1. Définir `VITE_SENTRY_DSN` sur l'environnement cible.
2. Déclencher une erreur contrôlée sans donnée client.
3. Vérifier l'événement dans Sentry : pas d'email, pas de nom, pas de montant, pas de contenu métier.

---

## CI, coverage et performance

Commandes locales utiles :

```powershell
npm run check
npm run check:pre-merge
npm run test:deno
npm run lint:repo
npm run typecheck:tests
npm run typecheck:node
npm run test:e2e:functional
npm run test:e2e:visual
npm run coverage
npm run build:storybook
npm run lhci
npm run audit:prod
```

Statut des gates :

- Bloquants PR : `CI / checks`, `CI / tests`, `CI / build`, `CI / deno-admin`, `E2E Tests / e2e-functional`, `E2E Visual / e2e-visual`.
- Bloquants locaux avant push : `npm run check` et les E2E ciblés si la surface touchée le justifie.
- Planifiés/manuels : `audit:prod`, `coverage`, `build:storybook`, `lhci`, rapports bundle.

E2E Playwright :

- La CI exécute `npm run test:e2e:functional` sur Ubuntu hors conteneur avec cache navigateurs Playwright.
- La CI exécute `npm run test:e2e:visual` dans `mcr.microsoft.com/playwright:v1.60.0-jammy` seulement pour les changements UI/visuels, sur `push:main`, cron et manuel.
- Les snapshots visuels versionnés sont valables pour ce conteneur CI ; c'est la source de vérité. Un run local Windows peut produire des diffs visuels non pertinents.
- Pour régénérer les snapshots, utiliser le même conteneur que la CI :

  ```powershell
  $repo = (Get-Location).Path
  docker run --rm `
    -v "${repo}:/work" `
    -w /work `
    -e CI=true `
    -e VITE_E2E=true `
    -e HUSKY=0 `
    mcr.microsoft.com/playwright:v1.60.0-jammy `
    bash -lc "npm install -g n >/dev/null && n 22.22.1 >/dev/null && hash -r && npm install -g npm@11.12.0 >/dev/null && npm ci && npm run test:e2e:visual -- --update-snapshots"
  ```

- Les specs authentifiées consomment `E2E_EMAIL` et `E2E_PASSWORD` uniquement si `E2E_AUTH_REQUIRED=true` est défini en variable GitHub. Sans cet opt-in explicite, les specs concernées sont skippées ; le gate couvre alors le socle non authentifié et visuel. Aucun nouveau `.skip` inconditionnel ne doit être ajouté.
- Si `E2E_AUTH_REQUIRED=true`, les secrets doivent pointer vers un vrai compte Supabase valide. Des secrets présents mais invalides ne doivent pas être utilisés comme gate par défaut.
- Toute nouvelle route privée doit être couverte par `scripts/e2e-auth-pages-smoke.mjs`.
  Les routes `/sim/*` viennent du registre `src/routes/simRouteContracts.ts` et les sous-pages
  settings viennent de `SETTINGS_ROUTES` ; ne pas dupliquer ces listes dans le smoke.
  `npm run check:e2e-auth-pages-coverage` compare `APP_ROUTES`, `SETTINGS_ROUTES`, le registre
  simulateur et le smoke dérivé.
- Chaque simulateur actif doit déclarer un `pageTestId` dans le registre ; le smoke vérifie
  que la page rend un `SimPageShell` visible avec ce test id.
- Ce smoke ne remplace pas les specs métier : un nouveau simulateur actif doit ajouter ou mettre
  à jour une spec Playwright authentifiée dans `tests/e2e/`, sauf placeholder explicitement assumé.

Scaffold simulateur :

```powershell
npm run scaffold:sim -- --id nouveau-sim --label "Nouveau simulateur"
npm run check
npm run test:e2e:auth-pages
```

Le scaffold produit une page réelle `SimPageShell` avec état vide, ajoute la route au registre et
met à jour le contrat UX. Il reste obligatoire d'ajouter le scénario métier Playwright du simulateur.

Coverage :

- Vitest couvre prioritairement `src/engine/**` via `vitest.config.ts`.
- La CI tente un upload Codecov avec `CODECOV_TOKEN` si configuré ; l'échec d'upload ne bloque pas la PR.

Lighthouse CI :

- Config : `lighthouserc.cjs`.
- Profils : `LHCI_PROFILE=smoke` pour un contrôle léger, `LHCI_PROFILE=full` pour le cron ou le manuel.
- Routes full : `/login`, `/sim/ir`, `/sim/placement`, `/sim/per`, `/sim/per/transfert`, `/sim/tresorerie-societe`, `/sim/prevoyance`, `/sim/credit`, `/sim/succession`.
- `/settings/*` est exclu tant que la surface utile dépend d'un état auth/admin non initialisé par LHCI.
- Les assertions restent en warning : Lighthouse est informatif et ne bloque pas une PR.

Storybook :

- Config : `.storybook/`.
- Démarrage local : `npm run storybook`.
- Build CI : `npm run build:storybook`.

Typedoc :

- Config : `typedoc.json`.
- Génération locale : `npm run docs:engine`.
- La sortie `docs/api/` est ignorée par Git ; publier seulement si un besoin produit ou docs permanent est décidé.

---

## Previews Vercel

Si le projet est relié à Vercel via GitHub, chaque PR doit produire une preview Vercel.

Les previews utilisent l'`installCommand` de `vercel.json` (`npx npm@11.12.0 ci`) pour l'installation applicative. Vercel peut ensuite empaqueter les fonctions API avec son npm interne 10.9.7+ ; la plage `engines.npm` l'autorise, tandis que dev/CI restent calés sur npm 11.12.0.

Si le connecteur Vercel de Codex répond `token_expired`, reconnecter l'app Vercel depuis Codex. En attendant, inspecter les logs avec la CLI :

```powershell
npx vercel inspect <deployment-id> --logs
```

Checklist de review preview :

1. Ouvrir l'URL de preview attachée à la PR.
2. Vérifier `/login`, `/`, puis les routes simulateurs touchées.
3. Comparer avec les smoke tests Playwright (`npm run test:e2e:smoke`) si une route critique bouge.
4. Vérifier l'onglet Network si une erreur Supabase ou `/api/admin` apparaît.

La preview ne remplace pas `npm run check` ni les tests E2E ; elle sert à valider le rendu réel et les variables d'environnement de déploiement.

---

## Supabase local + migrations

Source de vérité migrations : `supabase/migrations/`.

Projet : **SER1-Simulator** — réf configurée localement via Supabase CLI — Région : West EU (Paris).

Parcours safe (si Supabase CLI configurée) :

> ⚠️ **Danger zone**: `supabase db reset` est destructif (purge totale) et interdit sans demande explicite.  
> Préférer `supabase start` + migrations ciblées si l'objectif ne nécessite pas un reset complet.

```powershell
supabase start
supabase db reset
supabase migration list
```

Synchroniser le schéma distant (si besoin) :

```powershell
supabase db remote commit --linked
```

### Base CG retraite — push distant encadré

La Base CG retraite canonique touche `base_cg_retraite_contracts`, `base_cg_retraite_catalog_meta` et `base_cg_retraite_documents`. Elle ne supprime pas `base_cg_retraite_overrides` dans la même vague : l'ancienne table reste disponible pour rollback tant que la parité distante n'a pas été contrôlée. La PR ne modifie pas Storage ; si une migration ultérieure touche `storage.buckets` ou les objets du bucket privé, faire un inventaire/backup Storage séparé avant le push.

Avant tout `db push --linked`, produire des dumps locaux non versionnés dans `.tmp/` et vérifier le plan :

```powershell
New-Item -ItemType Directory -Force .tmp | Out-Null
npx supabase db dump --linked --schema public --data-only --use-copy --file .tmp/base-cg-before-push-data.sql
npx supabase db push --dry-run --linked
```

Après validation locale et dry-run, pousser puis contrôler les counts et les hashes. La ligne `base_cg_retraite_catalog_meta` est aussi recalculée par triggers SQL après les modifications admin de contrats/documents :

```powershell
npx supabase db push --linked
npx supabase db query --linked "select catalog_key, schema_version, contract_count, document_count, points_contract_count, canonical_hash from public.base_cg_retraite_catalog_meta where catalog_key = 'base-cg-retraite';"
npx supabase db query --linked "select count(*) as active_contracts from public.base_cg_retraite_contracts where is_deleted is false;"
npx supabase db query --linked "select count(*) as documents_without_contract from public.base_cg_retraite_documents d left join public.base_cg_retraite_contracts c on c.contract_id = d.contract_id where c.contract_id is null;"
```

Rollback de cette PR : revert code, l'ancienne table `base_cg_retraite_overrides` est encore présente. La suppression éventuelle de cette table doit faire l'objet d'une migration ultérieure après contrôle distant des counts/hash/orphelins, avec migration inverse locale ou restauration depuis les dumps `.tmp/`.

---

## Gouvernance admin — `admin_accounts`

### Contexte

La table `admin_accounts` est la liste exhaustive des comptes autorisés à utiliser la fonction admin. Elle s'ajoute au check `app_metadata.role='admin'` dans Supabase Auth : les deux doivent être vrais pour qu'un compte soit accepté.

> **Règle** : un compte admin doit être présent dans Supabase Auth avec `app_metadata.role='admin'` et dans `public.admin_accounts`.

### Bootstrap owner

Après validation du compte owner dans Supabase Auth, insérer son UUID dans `admin_accounts` :

```sql
INSERT INTO public.admin_accounts (user_id, account_kind, notes)
VALUES ('<owner_user_id>', 'owner', 'Compte owner initial');
```

Vérifier :

```sql
SELECT * FROM public.admin_accounts;
-- Doit retourner exactement 1 ligne owner active
```

### Ajouter un dev_admin

```sql
INSERT INTO public.admin_accounts (user_id, account_kind, notes, created_by)
VALUES ('<uuid>', 'dev_admin', 'Dev X', '<owner_user_id>');
```

### Désactiver un compte

```sql
UPDATE public.admin_accounts SET status = 'disabled', updated_at = now() WHERE user_id = '<uuid>';
```

### Ajouter ou réactiver un compte E2E admin temporaire

Le compte E2E authentifié doit rester borné : rôle admin côté Auth pour couvrir les pages
protégées, présence explicite dans `admin_accounts`, et expiration obligatoire. La convention
SER1 est d'utiliser `e2e@test.local` quand le compte existe déjà dans Supabase Auth.

```sql
begin;

update auth.users
set raw_app_meta_data = jsonb_set(
  coalesce(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"',
  true
)
where email = 'e2e@test.local';

update public.profiles
set role = 'admin'
where email = 'e2e@test.local';

insert into public.admin_accounts (user_id, account_kind, status, expires_at, notes)
select id, 'e2e', 'active', now() + interval '180 days', 'Compte E2E authentifié local/CI'
from auth.users
where email = 'e2e@test.local'
on conflict (user_id) do update
set
  account_kind = excluded.account_kind,
  status = 'active',
  expires_at = excluded.expires_at,
  notes = excluded.notes,
  updated_at = now();

commit;
```

Vérifier :

```sql
select
  u.id,
  u.email,
  coalesce(u.raw_app_meta_data->>'role', 'user') as app_role,
  p.role as profile_role,
  a.account_kind,
  a.status,
  a.expires_at
from auth.users u
left join public.profiles p on p.id = u.id
left join public.admin_accounts a on a.user_id = u.id
where u.email = 'e2e@test.local';
```

### Cycle de vie des comptes E2E

- Toujours définir `expires_at` (jamais null pour `account_kind='e2e'`)
- Nettoyer périodiquement :
  ```sql
  DELETE FROM public.admin_accounts WHERE account_kind='e2e' AND expires_at < now();
  ```
- Vérifier les comptes expirés non purgés :
  ```sql
  SELECT user_id, account_kind, expires_at FROM public.admin_accounts
  WHERE expires_at IS NOT NULL AND expires_at < now();
  ```

### Compte E2E local et CI

Pour les vérifications UI manuelles, assistées par LLM et Playwright authentifié, utiliser le
compte Supabase dédié `e2e@test.local`.

- Le compte doit être `admin` dans `app_metadata.role` et dans `public.profiles.role`.
- Il doit être présent dans `public.admin_accounts` avec `account_kind='e2e'`, `status='active'` et un `expires_at` non null.
- Les accès opérationnels de ce compte (URL locale, email, mot de passe) sont stockés uniquement dans `.env.local`, fichier local ignoré par Git (`.gitignore`).
- Variables locales recommandées :
  ```dotenv
  SER1_LLM_TEST_URL=http://127.0.0.1:5174/sim/per/transfert
  SER1_LLM_TEST_EMAIL=e2e@test.local
  SER1_LLM_TEST_PASSWORD=<mot-de-passe-local>
  ```
- Pour lancer les specs Playwright authentifiées en local, synchroniser les variables `E2E_*` depuis ce bloc :
  ```powershell
  $envPath = '.env.local'; $lines = Get-Content $envPath; $vars = @{}; $lines | ForEach-Object { if ($_ -match '^\s*([^#][^=]+?)=(.*)$') { $vars[$matches[1].Trim()] = $matches[2] } }; $pairs = @{ E2E_EMAIL = $vars['SER1_LLM_TEST_EMAIL']; E2E_PASSWORD = $vars['SER1_LLM_TEST_PASSWORD']; E2E_AUTH_REQUIRED = 'true' }; foreach ($key in $pairs.Keys) { if ([string]::IsNullOrWhiteSpace($pairs[$key])) { throw "$key source manquante dans $envPath" }; Set-Item -Path "Env:$key" -Value $pairs[$key]; $line = "$key=$($pairs[$key])"; if ($lines -match "^\s*$([regex]::Escape($key))=") { $lines = $lines -replace "^\s*$([regex]::Escape($key))=.*$", $line } else { $lines += $line } }; Set-Content -Path $envPath -Value $lines -Encoding utf8
  ```
- Pour vérifier toutes les pages publiques, privées et settings avec ce compte admin :
  ```powershell
  npm run test:e2e:auth-pages
  ```
  Ce script charge `.env.local`, refuse les mots de passe placeholder, démarre Vite en dev pour
  conserver le proxy `/api/admin`, se connecte avec `E2E_EMAIL` / `E2E_PASSWORD`, puis visite les
  routes applicatives et toutes les sous-pages `/settings/*`.
- Pour changer le mot de passe d'un compte E2E sans email de récupération, utiliser l'API Admin
  Supabase côté machine locale avec une clé `service_role` ou `sb_secret_*`, jamais depuis le
  navigateur :
  ```powershell
  $env:SER1_SUPABASE_ADMIN_KEY = "<service-role-ou-sb-secret-key>"; $env:NEW_E2E_PASSWORD = "<nouveau-mot-de-passe>"; node -e "const { createClient } = require('@supabase/supabase-js'); const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL; const key = process.env.SER1_SUPABASE_ADMIN_KEY; const password = process.env.NEW_E2E_PASSWORD; if (!url || !key || !password) throw new Error('SUPABASE_URL/VITE_SUPABASE_URL, SER1_SUPABASE_ADMIN_KEY et NEW_E2E_PASSWORD requis'); const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }); supabase.auth.admin.updateUserById('b382d252-9de6-4721-9462-968ba48b7911', { password }).then(({ error }) => { if (error) throw error; console.log('Mot de passe E2E mis à jour'); }).catch((error) => { console.error(error.message); process.exit(1); });"
  ```
  Après rotation, mettre à jour `SER1_LLM_TEST_PASSWORD` dans `.env.local`, puis relancer
  `npm run test:e2e:auth-pages`.
- Procédure agent : ouvrir `/login`, se connecter avec `SER1_LLM_TEST_EMAIL` / `SER1_LLM_TEST_PASSWORD`, puis rouvrir `SER1_LLM_TEST_URL` après la redirection d'accueil.
- Ne jamais copier le mot de passe dans une documentation versionnée, une PR, un ticket ou un log.

### Récupération lock-out admin

La garde `admin_accounts` est active côté Edge Function. En cas de lock-out :

1. Se connecter au projet Supabase avec un rôle service.
2. Vérifier qu'au moins un compte owner actif existe :
   ```sql
   SELECT user_id, account_kind, status
   FROM public.admin_accounts
   WHERE status = 'active'
   ORDER BY account_kind;
   ```
3. Réactiver ou insérer un compte owner légitime via SQL, puis tester `/settings/comptes`.
4. Invalider le cache fiscal uniquement si la correction touche aussi une table settings.

### Consulter l'audit admin

Requêtes utiles sur `admin_action_audit` :

```sql
-- 10 dernières mutations
SELECT created_at, action, target_type, target_id, account_kind, status
FROM public.admin_action_audit
ORDER BY created_at DESC
LIMIT 10;

-- Mutations par admin
SELECT admin_user_id, account_kind, action, count(*)
FROM public.admin_action_audit
GROUP BY admin_user_id, account_kind, action
ORDER BY count(*) DESC;

-- Corrélation par request_id
SELECT * FROM public.admin_action_audit WHERE request_id = '<rid>';
```

Note : la table est accessible service_role uniquement (RLS activee, policies explicites `TO service_role`). Consulter via Dashboard Supabase > SQL Editor ou psql avec la connexion service_role.

---

## Edge Function admin

### Déployer

Déploiement recommandé : GitHub Actions → `Deploy Supabase Functions` → `Run workflow` → `admin`.

Secrets GitHub Actions requis :

- `SUPABASE_ACCESS_TOKEN` : token Supabase dédié au déploiement.
- `SUPABASE_PROJECT_REF` : référence projet Supabase (`xnpbxrqkzgimiugqtago` pour SER1-Simulator).

Le workflow exécute `npm run test:deno`, vérifie la présence des secrets, vérifie qu'au moins un compte `app_metadata.role='admin'` est actif dans `public.admin_accounts`, liste les fonctions déployées, déploie `admin`, puis reliste les fonctions. Après toute PR qui modifie `supabase/functions/admin/**`, lancer ce workflow depuis `main`.

Commande de secours locale :

```powershell
npx supabase functions deploy admin --project-ref xnpbxrqkzgimiugqtago
```

### Tester

- Public : `ping_public`
- Auth/admin : via Dashboard Functions ou `supabase functions invoke admin`.

Exemples :

```powershell
# Public (pas de token)
supabase functions invoke admin --data '{"action":"ping_public"}'

# Admin (token requis)
supabase functions invoke admin `
  --data '{"action":"list_users"}' `
  --headers '{"Authorization":"Bearer <JWT_ADMIN>"}'
```

Contrat API : `supabase/functions/admin/index.ts`.

Périmètre Deno : la fonction admin porte son propre `deno.json` et son propre `deno.lock` dans `supabase/functions/admin/`. Les tests se lancent via `npm run test:deno`, depuis ce dossier, avec lock gelé.

Notes CORS : en prod, l'app passe par un proxy Vercel (`api/admin.ts`).

---

## Identité fiscale — warning mismatch au chargement d'un .ser1

### Comportement attendu

Au chargement d'un fichier `.ser1` sauvegardé avec le schéma v4, l'app compare le fingerprint fiscal stocké dans le fichier avec les paramètres fiscaux courants (Supabase). Si les paramètres ont changé entre la sauvegarde et le chargement, une notification apparaît :

> "Attention : les paramètres fiscaux ont été mis à jour depuis la sauvegarde. Les résultats peuvent changer."

### Causes possibles

- Un admin a modifié les barèmes IR, PS ou les règles par enveloppe entre la sauvegarde du dossier et son rechargement.
- Le dossier a été créé sur un environnement (ex: prod) et rechargé sur un autre (staging avec paramètres différents).
- Le dossier est antérieur au schéma v4 (snapshot v1/v2/v3) : pas de fingerprint → pas de warning même si les paramètres diffèrent.

### Que faire

1. **Warning seul (notification)** → les résultats affichés sont calculés avec les paramètres fiscaux courants (post-update). Recalculer et re-sauvegarder le dossier pour remettre en cohérence l'identité fiscale stockée.
2. **Vérifier les paramètres courants** : `/settings/impots`, `/settings/comptables-societes`, `/settings/prelevements` et `/settings/dmtg-succession`.
3. **Si recalcul impossible** (dossier archivé) : noter la date de sauvegarde et les paramètres fiscaux en vigueur à cette date pour toute comparaison.

### Debug

```text
# Vérifier le schéma du snapshot stocké dans un .ser1 (JSON)
# Les fichiers .ser1 sont du JSON : ouvrir avec un éditeur et chercher "fiscalIdentity"
# Exemple de structure v4 attendue :
# { "schemaVersion": 4, "fiscalIdentity": { "tax": { "hash": "...", "updatedAt": "..." }, ... } }
```

---

## Troubleshooting rapide

### CORS / /functions/v1/admin

Symptôme : erreur CORS ou requêtes invisibles côté logs Supabase.

- Vérifier `VITE_SUPABASE_URL` / token.
- Tester `ping_public` depuis navigateur.
- Vérifier preflight `OPTIONS` (Network tab).

### Thème ne s’applique pas / cache stale

- Vider les caches `ser1_theme_cache_*` / `ser1_cabinet_*` dans localStorage.
- Vérifier `theme_mode/preset_id/my_palette` en DB (`ui_settings`).

### RLS / rôle admin

- Vérifier que l’autorisation utilise `app_metadata.role`.
- Interdit : checks `user_metadata`.

### Cache schéma PostgREST (RPC 404 / PGRST202)

Après création d’une RPC, elle peut ne pas être visible immédiatement :

```sql
-- Forcer le reload du schéma
NOTIFY pgrst, ‘reload schema’;
```

Ou redémarrer le projet via Dashboard > Settings > General > Restart project.

### Bucket "logos" not found

Si le bucket n’existe pas après migration :

1. Vérifier que la migration de création du bucket a bien été exécutée.
2. Vérifier dans Dashboard > Storage que le bucket existe.
3. Vérifier les policies RLS dans Dashboard > Storage > Policies.

### Fonction `is_admin()` non trouvée

```sql
SELECT proname FROM pg_proc WHERE proname = ‘is_admin’;
```

La fonction est créée lors des migrations d’initialisation. Si absente, rejouer les migrations depuis le début.

Check rapide (régression sécurité) :

```powershell
rg "user_metadata.*role" supabase/functions --type ts
rg "user_metadata" supabase/migrations --type sql
```

---

## Mise à jour annuelle des règles fiscales

Procédure à suivre chaque année (PLF, BOFiP, BOSS…). Aucune compétence technique requise — chaque étape est indépendante.

### Étape 1 — Mettre à jour les paramètres Impôts

1. Aller sur `/settings/impots`.
2. Vérifier et corriger : barème IR, PFU part IR, CEHR/CDHR, IFI.
3. Enregistrer.

### Étape 1 bis — Mettre à jour les paramètres Comptables & sociétés

1. Aller sur `/settings/comptables-societes`.
2. Vérifier et corriger : taux IS, seuil du taux réduit, régime mère-fille, déductibilité CCA/dividendes.
3. Enregistrer.

### Étape 2 — Mettre à jour les Prélèvements sociaux

1. Aller sur `/settings/prelevements`.
2. Vérifier et corriger : taux PS patrimoine (cas général et régime d'exception), tranches retraite et historique PASS (`pass_history`).
3. Enregistrer.

### Étape 3 — Mettre à jour les DMTG / succession

1. Aller sur `/settings/dmtg-succession`.
2. Vérifier et corriger : barèmes DMTG, abattements, donations et paramètres AV décès.
3. Enregistrer.

### Étape 4 — Vérifier les produits "À vérifier"

1. Aller sur `/settings/base-contrat`.
2. (Admin) Rechercher un produit et ajuster son état **Clôturé / Ouvert** si nécessaire.
   - Une clôture s'accompagne d'une **date** (et d'une note optionnelle).

### Étape 5 — Attester les références Settings

1. Comparer chaque valeur officielle 2027 avec la valeur administrée dans la page Settings cible.
2. Mettre à jour le binding correspondant dans `src/domain/settings-references/chain.json` :
   `refIds` si la source canonique existe, `relevanceNote`, `verifiedAt`, `volatility` et `target`.
3. Si aucune source stable ne fonde le claim, laisser `refIds: []` et renseigner `noRefReason`.
   En prévoyance, une absence de source doit nommer le régime concerné (`code`, `label` ou `caisse`)
   et la catégorie concernée ; une URL racine de caisse ne suffit pas.
4. Lancer :

```powershell
npm run check:settings-references
npm run audit:settings-references -- --stale
```

5. Si la revue touche `/settings/prevoyance-regimes`, exporter d'abord l'état live en `.cache/`,
   ajouter une migration idempotente, puis relancer avec les variables Supabase disponibles :

```powershell
npm run audit:settings-references -- --stale --with-db
```

`check:settings-references` est branché dans `check:static`. Les 6 surfaces
`/settings/impots`, `/settings/comptables-societes`, `/settings/prelevements`, `/settings/base-contrat`,
`/settings/dmtg-succession` et `/settings/prevoyance-regimes` doivent rester à
`coverage.byPage[*].expectedDefined = true`, `complete = true`, `coverage.isExhaustive = true` et
zéro dette muette. Dans le scénario 2027, `npm run audit:settings-references -- --stale --with-db`
sert à lister les claims périmés ou à vérifier. Pour les références `annual`, le blocage démarre au
1er février de l'année suivant `verifiedAt` : une attestation 2026 devient donc bloquante le
2027-02-01. Une liveness `blocked` impose une vérification manuelle Légifrance/BOFiP, mais ne prouve
pas que l'URL est morte.

Les migrations prévoyance `20260606000200_prevoyance_sources_lot5.sql`,
`20260606000300_prevoyance_sources_lot5_url_correction.sql` puis
`20260606000400_prevoyance_sources_lot5_dead_url_correction.sql` qualifient les sources par régime
et par catégorie dans `sources.references`. La migration
`20260606000500_prevoyance_sources_verified_confidence.sql` marque ces pages officielles comme
vérifiées (`confiance: "haute"`), car elles sont la meilleure référence disponible. Les migrations
correctives remplacent les URLs racines, trop génériques ou mortes par des pages de
garanties/cotisations ; l'audit DB doit refuser toute régression.

---

## Base-Contrat — Clôturer / rouvrir un produit

La page `/settings/base-contrat` affiche un **catalogue hardcodé** et permet uniquement (admin) de :

- **Clôturer / rouvrir** un produit avec une date
- Ajouter une **note admin** optionnelle

### Stockage

Les changements sont stockés dans la table Supabase `base_contrat_overrides` (clé = `product_id`).

### RLS — politique de lecture (décision)

- **SELECT** : réservé aux admins (`USING public.is_admin()`).
- **INSERT / UPDATE / DELETE** : admin uniquement (inchangé).

Justification : `note_admin` et `closed_date` sont des données internes admin. Les CGP non-admin n'affichent pas ces overrides dans l'UI.
Policy active : `overrides_select_admin` (migration `20260226000100_rls_overrides_admin_only.sql`).

---

## Base-Contrat — Process Dev (Ajout / Modification)

Le référentiel est 100% hardcodé dans `src/domain/base-contrat/`. Toute modification du catalogue ou des règles passe par une PR.

### Règle d'or (UX Premium)

Toujours utiliser des **libellés métier clairs**. Aucun jargon technique ni ID ne doit être visible par l'utilisateur final.

### 1. Ajouter un produit

1. Ouvrir `src/domain/base-contrat/catalog.ts`.
2. Ajouter une entrée dans le tableau `CATALOG` dans la bonne `GrandeFamille`.
3. Renseigner `id`, `label` (métier), `grandeFamille`, `catalogKind`, `ppEligible`, `pmEligible`.
4. Si le produit partage les mêmes règles qu'un autre (ex: crypto = autres), l'assimiler sans créer de sous-catégorie fiscale inutile.
5. Lancer `npm run check`.

### 2. Ajouter/modifier une règle fiscale (3 colonnes)

Le **référentiel lisible** des règles fiscales est dans `src/domain/base-contrat/rules/`.  
Le **moteur de calcul** (simulateurs) reste dans `src/engine/`.

#### Modifier une règle existante

1. Identifier le produit et la phase impactée : **Constitution**, **Sortie/Rachat**, ou **Décès/Transmission**.
2. Ouvrir le fichier de bibliothèque correspondant dans `src/domain/base-contrat/rules/library/` :
   - `assurance-epargne.ts` — Assurance-vie, Contrat de capitalisation
   - `epargne-bancaire.ts` — Livrets, CTO, PEA, PEA-PME, PEL, CEL, CAT
   - `retraite.ts` — PER (assurantiel/bancaire), PEE, PERCOL, Article 83/39…
   - `immobilier.ts` — Résidence principale, locatif nu/meublé, SCPI, groupements
   - `prevoyance.ts` — Prévoyance décès, ITT/invalidité, dépendance, emprunteur, homme-clé
   - `valeurs-mobilieres.ts` — Actions, fonds (FCPR/FCPI/FIP), PE, créances, usufruit
   - `fiscaux-immobilier.ts` — Pinel, Malraux, Monuments historiques, Denormandie…
   - `autres.ts` — Tontine, Crypto-actifs, Métaux précieux
3. Modifier le tableau `bullets` (texte métier, jamais de jargon technique ni d'ID).
4. Lancer `npm run check`.

#### Ajouter des règles

1. Créer ou ouvrir le fichier de bibliothèque de la famille dans `src/domain/base-contrat/rules/library/` ou créer une entrée dans le `switch` du fichier concerné.
2. Ajouter une `ProductRules` avec title + bullets métier.
3. Lancer `npm run check` — le test de coverage se met à jour automatiquement.

#### Standard de qualité des règles (confidence policy)

Chaque `RuleBlock` doit obligatoirement avoir un champ `confidence` : `'elevee'`, `'moyenne'`, ou `'faible'`.

| Confidence | Signification                                   | Obligations                                                         |
| ---------- | ----------------------------------------------- | ------------------------------------------------------------------- |
| `elevee`   | Règle fiable, sourcée, stable                   | Aucune obligation supplémentaire                                    |
| `moyenne`  | Règle correcte mais dépend de paramètres client | Au moins 1 bullet « À confirmer selon … » + `dependencies` non vide |
| `faible`   | Règle incertaine ou en attente de validation    | Idem `moyenne` + `sources` obligatoire                              |

**Champs optionnels** :

- `sources` : max 2 entrées `{ label, url }` pointant vers BOFiP, Légifrance ou doctrine fiable (URLs `https://`).
- `dependencies` : max 6 courtes phrases décrivant les paramètres dont dépend la règle.

**Règles d'écriture** :

- Ne jamais affirmer sans source officielle. Si la source manque → `confidence: 'moyenne'` minimum.
- Préférer les sources officielles : BOFiP > Légifrance > doctrine professionnelle.
- Les `tags` sont techniques (moteur futur) et jamais affichés en UI.
- Les `confidence`, `sources`, `dependencies` sont visibles uniquement en UI admin.
- Les tests (`rules.test.ts`) vérifient automatiquement le respect de cette policy.

### 3. Ajouter/mettre à jour les tests (Golden Tests)

1. Ouvrir `src/engine/__tests__/goldenCases.test.ts` (ou le fichier de test lié au domaine).
2. Ajouter un cas de test documenté avec des entrées déterministes et les sorties attendues calculées manuellement.
3. Lancer `npm test` et `npm run check` pour garantir l'absence de régression.

---

## Repo hygiene — Delete unused

**Règle** : Si ça ne sert plus = on supprime.

### Ce qu'on considère "sert"

- runtime (`src/**` import/usage)
- build/CI (scripts, `.github`, `package.json`)
- tests/fixtures
- documentation référentielle

### Process

1. **Preuve** : prouver 0 usage (`rg`, chaîne d'import, route ou script appelant)
2. **PR** : petite PR ciblée
3. **Validation** : `npm run check` passe
4. **Merge** → sinon **revert**

### Interdits

- Pas de dossiers `archive/`, `backup/`, `old/`, `__spike__`, `_raw` "pour plus tard"
- Pas de "parking" durable (même dans `tools/`) sans preuve d'utilité

---

## Vérifications (commandes)

Commandes utiles pour vérifier l'hygiène du code et l'organisation (conformité SaaS).

```powershell
# 1. Lister les routes déclarées (source unique attendue)
rg -n "path:" src/routes/appRoutes.ts
# Résultat attendu : liste des routes (APP_ROUTES)

# 1b. Vérifier l'absence de redirects runtime
rg -n "kind: 'redirect'" src/routes/appRoutes.ts
# Résultat attendu : aucune sortie

# 1c. Vérifier que App.tsx consomme APP_ROUTES (pas de duplication)
rg -n "APP_ROUTES\\.map" src/App.tsx

# 2. Détecter les imports cross features → pages (doit être vide à terme)
rg -n "from.*@/pages/" src/features/ -l
# Résultat attendu : (aucune sortie)

# 3. Vérifier la présence d'icônes inline dans App.tsx (doit être vide à terme)
rg -n "const Icon" src/App.tsx
# Résultat attendu post-T3 : (aucune sortie)

# 4. Lister les dossiers spike/raw dans src/ (interdits en prod)
Get-ChildItem -Path src -Directory -Recurse -Force |
  Where-Object { $_.Name -in @('__spike__', '_raw') } |
  Select-Object -ExpandProperty FullName
# Résultat attendu : (aucune sortie)

# 5. Vérifier l'utilisation centralisée des routes settings
rg -n "SETTINGS_ROUTES|settingsRoutes" src/routes/settingsRoutes.ts src/pages/SettingsShell.tsx
# Résultat attendu : matches dans les deux fichiers (source unique utilisée)
```

### Rollback

- `git revert <sha>` annule la PR en 1 commande

---

Voir aussi :

- `docs/ARCHITECTURE.md` (cartographie)
- `docs/GOUVERNANCE.md` (règles UI/couleurs/thème)
- `docs/GOUVERNANCE_EXPORTS.md` (règles PPTX/Excel)
