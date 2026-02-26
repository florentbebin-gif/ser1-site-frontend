# ROADMAP (source de vérité)

## But
Donner la trajectoire produit vers un **SaaS SER1** (phases, priorités, Definition of Done) sans historique de PR/commits.

## Audience
Dev/Tech lead + PM/owner du produit.

## Ce que ce doc couvre / ne couvre pas
- ✅ Couvre : phases P0→P3, objectifs, DoD, "what's next", références code.
- ❌ Ne couvre pas : preuves d'exécution, changelog, détails d'implémentation (voir `docs/ARCHITECTURE.md` / `docs/RUNBOOK.md`).

## Sommaire
- [Vision produit](#vision-produit)
- [Definition of Done (SaaS-ready)](#definition-of-done-saas-ready)
- [Phases](#phases)
  - [P0 — Foundations](#p0--foundations)
  - [P1 — MVP simulateurs + JSON](#p1--mvp-simulateurs--json)
    - [P1-01 — Organisation de src/ & identifiabilité des pages](#p1-01--organisation-de-src--identifiabilite-des-pages)
    - [P1-04 — Base-Contrat V3 : Expérience Admin Premium](#p1-04--base-contrat-v3--expérience-admin-premium--source-de-vérité-universelle)
    - [P1-05 — Catalogue Patrimonial & Règles Exhaustives](#p1-05--catalogue-patrimonial--règles-exhaustives-base-parfaite)
  - [P2 — Analyse patrimoniale + nouveaux simulateurs](#p2--analyse-patrimoniale--nouveaux-simulateurs)
  - [P3 — Stratégie automatique + société fine](#p3--stratégie-automatique--société-fine)
- [Références code](#références-code)

---

## Vision produit
SER1 vise un outil **plus simple qu'un progiciel patrimonial** mais **très précis** sur les calculs et **premium** sur les exports (PPTX/Excel), destiné aux CGP/cabinets.

Cibles produit stables (à respecter) :
- **Multi-tenant "cabinets"** : branding (logo + palette) isolé par cabinet.
- **Règles fiscales + catalogue produits = GLOBAUX** (administrés par le **super-admin SaaS**).
- **Zéro stockage dossier client côté serveur** : saisie en session + export, sauvegarde locale `.ser1`.
- **Exports premium** : PPTX (PptxGenJS + design system) + Excel (OOXML natif).
- **Sécurité** : RLS stricte, rôle admin via `app_metadata`, pas de self-signup.

---

## Definition of Done (SaaS-ready)
Une phase/livrable est considérée "DONE" quand :
1. **Sécurité**
   - RLS activé + policies cohérentes (utiliser `public.is_admin()` ; jamais `user_metadata`).
   - Self-signup désactivé, onboarding via invitation/admin.
2. **Qualité**
   - `npm run check` passe.
   - Tests critiques présents (moteur fiscal, exports, settings).
3. **Theming/branding**
   - Thème V5 déterministe (modes `cabinet|preset|my`) et anti-flash OK.
   - PPTX/Excel cohérents avec la palette (pas de hardcodes hors exceptions).
4. **Opérabilité**
   - Runbook (debug, edge functions, migrations) à jour.

---

## Phases

### P0 — Foundations
Objectif : rendre le socle SaaS **sûr** (auth, RLS, conventions, gates).

Livrables typiques :
- Auth : **invitation admin**, pas de self-signup.
- RLS multi-tenant : isolation minimale par cabinet (au moins `profiles`).
- Sessions TTL + policy de téléchargement (exports session-only).
- Gouvernance couleurs/UI + anti-regressions (lint, conventions).
- Gate publication des règles/settings admin (tests requint publication).

> Liens : voir aussi [Références code](#références-code) pour Routing, Auth, Thème V5.

---

### P1 — MVP simulateurs + JSON
Objectif : simulateurs robustes + sauvegarde locale versionnée.

#### P1-01 — Organisation de src/ & identifiabilité des pages ✅

Objectif : rendre le front **lisible, modulaire et SaaS-maintainable**.

**Livré :**
- **Routing centralisé** : `src/routes/appRoutes.ts` (APP_ROUTES) — source unique, metadata déclarative (`contextLabel`, `topbar`).
- **AppLayout extrait** : `src/components/layout/AppLayout.jsx` — topbar data-driven via `routeMeta`, plus de flags hardcodés.
- **Icônes extraites** : `src/icons/ui/*.tsx` (6 composants), seul consommateur = AppLayout.
- **App.jsx minimal** : ~250 lignes, session + routing + bootstrap. Aucun markup topbar, aucune icône inline, aucun flag route hardcodé.
- **Features→Pages = 0** : `rg "from.*@/pages/" src/features/` → vide.
- **Credit migré** : `src/features/credit/` (ex `pages/credit/`).
- **Settings normalisé** : `src/pages/settings/` (ex `pages/Sous-Settings/`).
- **Spikes/raw supprimés** : `__spike__` et `_raw` n'existent plus dans `src/`.

**Placement legacy/ éliminé** : les 8 fichiers de `src/features/placement/legacy/` ont été promus dans `utils/`, `components/`, `export/` au sein de la feature. `rg "legacy/" src/features/placement/` → vide. Debt A = **résolu**.

**Dette résiduelle** :

| Dette | Type | Où | Règle | Exit criteria | Vérification |
|-------|------|-----|-------|---------------|--------------|
| ~~A~~ | ~~compat~~ | ~~`src/features/placement/legacy/`~~ | — | — | ✅ Résolu — fichiers promus, dossier supprimé |
| D | compat | `src/engine/*.ts` | Ne pas ajouter de nouveaux `@deprecated` | Migration vers nouveaux APIs | `rg "@deprecated" src/engine` (maintenir ou réduire) |

**Règles "ne pas aggraver la dette" :**
- Tout nouveau code va dans `features/*`, `components/`, `hooks/`, etc.

---

#### P1-04 — Base-Contrat V3 : Expérience Admin Premium & Source de Vérité Universelle ✅

**Livré (PR1–PR8)** :
- PR1–PR3 : Catalogue hardcodé, UI read-only, nettoyage legacy.
- PR4 : Alignement documentation.
- PR5 : 71 produits, 3 colonnes, quality system (`confidence`/`sources`/`dependencies`). 520 tests.
- PR6a/6b : Sources officielles + garde-fou CI. Audit & normalisation 20 blocs à risque.
- PR7 : PP/PM split catalogue (produits mixtes dédoublés).
- PR8 : Wiring simulateurs (`useFiscalProfile`) + golden tests.

---

#### P1-05 — Catalogue Patrimonial & Règles Exhaustives (Base Parfaite) ✅

**Livré** :
- 71 produits avec règles fiscales 3 colonnes.
- GFA/GFV et GFF : règles distinctes (`art. 793 bis` vs `art. 793 CGI`, régimes différents).
- PPV (`ppv_prime_partage_valeur`), Intéressement, Participation : catalogue PM complet.
- RLS `base_contrat_overrides` : lecture restreinte aux admins (voir RUNBOOK).
- Tests E2E obsolètes supprimés (`configure-rules.spec.ts`).

##### Manques hors catalogue (à prévoir dans l'analyse patrimoniale globale)
- Démembrement de propriété (Nue-propriété / Usufruit transversal).
- Régimes matrimoniaux (Communauté vs Séparation).
- Gestion fine des SCI et Holding (à l'IS).

---

## 🚧 Item transversal — 📌 Taux vivants / `reference_rates` (simulateurs)

**Pourquoi** : les simulateurs (IR, placement, prévoyance, crédit) nécessitent des taux et performances à jour (PASS, barèmes IR, taux PS, plafonds réglementaires). Coder ces valeurs en dur dans les rules statiques crée une dette croissante : chaque exercice nécessite un patch manuel, et les oublis produisent des résultats silencieusement faux.

**Principe** : **séparer les rules statiques (règles de droit) des taux vivants (valeurs révisables annuellement)**.
- Les `rules/library/*.ts` ne doivent **jamais** contenir de valeur numériquement révisable (PASS, seuils micro-BIC, taux PS, forfait social…) sans "À confirmer".
- Les taux vivants sont stockés dans une table Supabase dédiée `reference_rates` (ou équivalent) avec date de mise à jour et source.

**Architecture cible** :
- [ ] Table `reference_rates` : `{ key, value, label, source_url, last_updated_at, valid_from, valid_until }`.
- [ ] Edge Function `rates-refresh` (cron daily ou hebdomadaire) : fetch depuis les sources officielles (URSSAF, legifrance, service-public) + upsert avec horodatage.
- [ ] Alerte automatique si `last_updated_at` > 90 jours ou si le fetch échoue (webhook ou notification admin).
- [ ] Affichage `last_updated_at` dans l'UI simulateur (transparence).
- [ ] Les `rules/library/*.ts` référencent uniquement la *clé* du taux (ex: `PASS_N`, `TAUX_PS`, `SEUIL_MICRO_BIC`) — jamais la valeur brute.

**DoD** :
- `rg "35 194\|77 700\|23 000\|8,3 %\|17,2 %" src/domain/base-contrat/rules/library/` → vide (valeurs migrées ou prudent).
- Table `reference_rates` créée avec migration SQL + RLS (lecture authentifiée, écriture admin).
- Edge function `rates-refresh` déployée + test smoke.
- Alerte sur stale data documentée dans `docs/RUNBOOK.md`.

> ⚠️ **Règle immédiate** : d'ici la migration, tout nouveau taux révisable ajouté dans les rules **doit** être accompagné de "À confirmer" et d'une source officielle. Le garde-fou `rules.test.ts` l'impose.

---

### P2 — Analyse patrimoniale + nouveaux simulateurs
Objectif : enrichir l'analyse (audit) et ajouter des simulateurs utiles.

Candidats :
- Rapport PPTX audit complet (civil, actifs, passifs, fiscalité).
- Simulateur épargne comparaison.
- Simulateur prévoyance.
- Observabilité serveur technique (zéro PII, zéro métriques métier).
- MFA (TOTP) pour comptes sensibles.

---

### P3 — Stratégie automatique + société fine
Objectif : recommandations auto + modèle société/holding plus fin.

Candidats :
- Scénario auto (baseline vs recommandation).
- Société fine : organigramme, flux, consolidation.
- Export PPTX stratégie complète.

---

## Références code
Entrées clés :
- Routing : `src/routes/appRoutes.ts` (APP_ROUTES + `getRouteMetadata()`) + rendu dans `src/App.jsx`
- Layout : `src/components/layout/AppLayout.jsx` (topbar data-driven via `routeMeta`)
- Auth : `src/auth/AuthProvider.tsx`
- Thème V5 : `src/settings/ThemeProvider.tsx`, `src/settings/presets.ts`
- Tokens couleurs : `src/settings/theme.ts`, `src/styles.css`
- Engine : `src/engine/`
- Features : `src/features/`
- Exports : `src/pptx/`, `src/utils/xlsxBuilder.ts`, `src/utils/exportFingerprint.ts`
- Supabase Edge Function : `supabase/functions/admin/index.ts`
- Migrations : `supabase/migrations/`
- **Base-Contrat (référentiel contrats)** :
  - Catalogue hardcodé : `src/domain/base-contrat/catalog.ts`
  - Overrides (clôture / note) : `src/domain/base-contrat/overrides.ts`
  - Cache overrides (Supabase) : `src/utils/baseContratOverridesCache.ts`
  - UI (read-only) : `src/pages/settings/BaseContrat.tsx`
  - Labels FR (UI) : `src/constants/baseContratLabels.ts`
  - Règles fiscales : `src/domain/base-contrat/rules/` (8 library files, types, index)

Voir aussi :
- `docs/GOUVERNANCE.md` (règles UI/couleurs/thème)
- `docs/ARCHITECTURE.md` (carto + "où changer quoi")
- `docs/RUNBOOK.md` (diagnostics + opérations)
