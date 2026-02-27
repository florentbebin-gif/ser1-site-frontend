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
    - [P1-06 — Paramètres DMTG & Succession (Settings page)](#p1-06--paramètres-dmtg--succession-settings-page-)
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

#### P1-06 — Paramètres DMTG & Succession (Settings page) 🆕

**Objectif** : ajouter une page dans les sous-settings (style "Paramètres sociaux" / "Impôts") qui centralise tous les barèmes et abattements DMTG — droits de succession, droits de donation, assurance-vie, régimes matrimoniaux — afin de rendre le simulateur succession 100 % piloté par des taux vivants configurables par l'admin.

**Problème actuel** : les valeurs DMTG sont hardcodées dans `settingsDefaults.ts` et dans le moteur succession. Toute révision PLF nécessite un patch code + redéploiement.

**Cible** : `/settings/dmtg-succession` (nouveau onglet dans `settingsRoutes.js`), table Supabase `dmtg_settings` (singleton id=1).

---

##### Plan de la page — Organisation optimale

La page est divisée en **6 sections** :

---

###### Section 1 — Barèmes DMTG (art. 777 CGI)

Applicable à la fois aux successions et aux donations. Même barème progressif selon le lien de parenté.

| Lien de parenté | Type de barème | Référence |
|----------------|---------------|-----------|
| **Ligne directe** (enfants, parents, petits-enfants…) | 7 tranches progressives 5 %→45 % | Art. 777 I CGI |
| **Époux / PACS (donation)** | Idem ligne directe (exonération en succession) | Art. 777 I CGI |
| **Frères / Sœurs** | 2 tranches : 35 % (≤ 24 430 €) / 45 % (> 24 430 €) | Art. 777 III CGI |
| **Oncles-tantes / Neveux-nièces** (jusqu'au 4e degré) | Taux fixe : 55 % | Art. 777 IV CGI |
| **Non-parents** (au-delà du 4e degré) | Taux fixe : 60 % | Art. 777 IV CGI |

**Barème ligne directe (valeurs 2025)** :

| Tranche (part nette taxable) | Taux |
|---|---|
| ≤ 8 072 € | 5 % |
| 8 072 € → 12 109 € | 10 % |
| 12 109 € → 15 932 € | 15 % |
| 15 932 € → 552 324 € | 20 % |
| 552 324 € → 902 838 € | 30 % |
| 902 838 € → 1 805 677 € | 40 % |
| > 1 805 677 € | 45 % |

> Note : ces seuils ne sont pas indexés à l'inflation — dernière révision 2012. Modifiables par PLF.

**UI** : tableaux éditables (tranche min, taux %) — un tableau par lien de parenté. Mêmes composants que le barème IR.

---

###### Section 2 — Abattements succession (art. 779 CGI)

| Bénéficiaire | Abattement | Référence |
|---|---|---|
| **Conjoint survivant** | Exonération totale | Art. 796-0 bis CGI |
| **Partenaire PACS survivant** | Exonération totale | Art. 796-0 ter CGI |
| **Enfant** (par enfant) | 100 000 € | Art. 779 I CGI |
| **Petit-enfant** (hors représentation) | 1 594 € | Art. 779 II CGI |
| **Arrière-petit-enfant** (hors représentation) | 1 594 € | Art. 779 II CGI |
| **Frère / Sœur** (par personne) | 15 932 € | Art. 779 III CGI |
| **Neveu / Nièce** (par personne) | 7 967 € | Art. 779 IV CGI |
| **Supplément handicap** (cumulable) | + 159 325 € | Art. 779 II CGI |

**Exonération frères/sœurs** (art. 796-0 quater CGI) : exonération totale si célibataire/veuf/divorcé, > 50 ans ou infirme, domicilié avec le défunt pendant 5 ans. Booléen à exposer dans l'UI.

**UI** : champs numériques éditables par ligne de parenté + toggle exonérations totales (conjoint, PACS).

---

###### Section 3 — Abattements donation (art. 779, 790 E/F/G CGI)

Les abattements donation sont **rechargeables tous les 15 ans** (délai de rappel fiscal, art. 784 CGI).

| Donateur → Donataire | Abattement | Référence |
|---|---|---|
| **Parent → Enfant** | 100 000 € | Art. 779 I CGI |
| **Grand-parent → Petit-enfant** | 31 865 € | Art. 779 II CGI |
| **Arrière-grand-parent → Arrière-petit-enfant** | 5 310 € | Art. 779 II CGI |
| **Entre époux** | 80 724 € | Art. 790 E CGI |
| **Entre partenaires PACS** | 80 724 € | Art. 790 F CGI |
| **Frère / Sœur** | 15 932 € | Art. 779 III CGI |
| **Neveu / Nièce** | 7 967 € | Art. 779 IV CGI |
| **Supplément handicap** (cumulable) | + 159 325 € | Art. 779 II CGI |

**Don familial de sommes d'argent** (art. 790 G CGI) :
- Exonération supplémentaire de **31 865 €** (cumulable avec abattement ligne directe)
- Conditions : donateur < 80 ans, donataire majeur, somme d'argent (chèque/virement), en ligne directe ou neveux/nièces (à défaut de descendants)
- Rechargeable tous les 15 ans

**Délai de rappel fiscal** : 15 ans (configurable — était 10 ans avant 2012).

**UI** : champs numériques par lien de parenté + section don familial art. 790 G (montant max, âge max donateur, délai recharge).

---

###### Section 4 — Assurance-vie (art. 990 I et 757 B CGI)

| Régime | Paramètre | Valeur 2025 | Référence |
|---|---|---|---|
| **Art. 990 I** (primes versées avant 70 ans) | Abattement par bénéficiaire | 152 500 € | Art. 990 I al. 1 CGI |
| | Taux prélèvement tranche 1 | 20 % | Art. 990 I CGI |
| | Seuil part taxable tranche 2 | 700 000 € | Art. 990 I CGI |
| | Taux prélèvement tranche 2 | 31,25 % | Art. 990 I CGI |
| **Art. 757 B** (primes versées après 70 ans) | Abattement global (partagé entre bénéficiaires) | 30 500 € | Art. 757 B CGI |
| | Âge de bascule | 70 ans | Art. 757 B CGI |
| **Exonération totale** | Conjoint / PACS bénéficiaire | true | Art. 990 I al. 3 CGI |

Rappel : les produits (intérêts, PV) générés par les primes > 70 ans restent exonérés (seules les primes > 30 500 € réintègrent la succession).

**UI** : 2 sous-sections art. 990 I / art. 757 B, champs numériques éditables.

---

###### Section 5 — Réserve héréditaire & quotité disponible (art. 912-913 Code civil)

| Nombre d'enfants | Réserve héréditaire | Quotité disponible |
|---|---|---|
| 1 enfant | 1/2 | 1/2 |
| 2 enfants | 2/3 | 1/3 |
| 3 enfants et plus | 3/4 | 1/4 |
| Aucun enfant (ascendants) | 1/4 par ligne (max 1/2) | Reste |

**Options conjoint survivant** (art. 757 Code civil) :
- Droit légal en présence d'enfants communs : 1/4 en pleine propriété **ou** totalité en usufruit

**UI** : tableau lecture seule (règle structurelle) + affichage informatif dans le simulateur. Pas de champs éditables (règle Code civil, non modifiable par PLF).

---

###### Section 6 — Régimes matrimoniaux (impact sur l'actif successoral)

Chaque régime définit comment calculer l'**actif net successoral** avant application des droits.

| Régime | Définition de l'actif successoral | Référence |
|---|---|---|
| **Communauté réduite aux acquêts** (droit commun) | Biens propres du défunt + 1/2 des biens communs | Art. 1400 Code civil |
| **Séparation de biens** | Tous les biens personnels du défunt | Art. 1536 Code civil |
| **Communauté universelle** (sans clause) | 1/2 de la masse commune | Art. 1526 Code civil |
| **Communauté universelle** (avec clause d'attribution intégrale) | Rien (ou résidu si clause partielle) | Art. 1526 + 1524 Code civil |
| **Participation aux acquêts** | Biens propres − créance de participation due au survivant | Art. 1569 Code civil |

**PACS** : séparation de biens par défaut (sauf convention), proche du régime de séparation.

**UI** : sélecteur de régime dans le simulateur succession (calcule automatiquement l'actif net). Paramétrage dans settings = liste des régimes disponibles + leurs formules de calcul d'actif.

---

##### Structure de données cible

**Table Supabase** : `dmtg_settings` (singleton id=1, même pattern que `tax_settings`)

```jsonc
{
  // Section 1 — Barèmes
  "baremeLigneDirecte": [
    { "min": 0,       "max": 8072,    "taux": 0.05 },
    { "min": 8072,    "max": 12109,   "taux": 0.10 },
    { "min": 12109,   "max": 15932,   "taux": 0.15 },
    { "min": 15932,   "max": 552324,  "taux": 0.20 },
    { "min": 552324,  "max": 902838,  "taux": 0.30 },
    { "min": 902838,  "max": 1805677, "taux": 0.40 },
    { "min": 1805677, "max": null,    "taux": 0.45 }
  ],
  "baremeFreresSoeurs": [
    { "min": 0,     "max": 24430, "taux": 0.35 },
    { "min": 24430, "max": null,  "taux": 0.45 }
  ],
  "tauxOncleTante":  0.55,
  "tauxNonParents":  0.60,

  // Section 2 — Abattements succession
  "abattements": {
    "enfant":              100000,
    "petitEnfant":           1594,
    "arriereEPetitEnfant":   1594,
    "frereSoeur":           15932,
    "neveuNiece":            7967,
    "handicapSupplement":  159325,
    "conjointExoneration":  true,
    "pacsExoneration":      true,
    "frereSoeurExoConditions": true  // art. 796-0 quater
  },

  // Section 3 — Abattements donation (rechargeables 15 ans)
  "abattementsDonation": {
    "enfant":              100000,
    "petitEnfant":          31865,
    "arriereEPetitEnfant":   5310,
    "epoux":                80724,
    "pacs":                 80724,
    "frereSoeur":           15932,
    "neveuNiece":            7967,
    "handicapSupplement":  159325,
    "delaiRappelFiscalAns":    15,
    "donFamilial790G": {
      "montantExonere":  31865,
      "ageDonateur_max":    80,
      "delaiRechargeAns":   15
    }
  },

  // Section 4 — Assurance-vie
  "assuranceVie": {
    "art990I": {
      "abattementParBeneficiaire": 152500,
      "taux_tranche1":               0.20,
      "seuilTranche2":             700000,
      "taux_tranche2":             0.3125
    },
    "art757B": {
      "abattementGlobal": 30500,
      "ageBasculeAns":       70
    }
  },

  // Sections 5 & 6 — Structurelles (non éditables via settings, embarquées dans moteur)
  // Voir src/engine/succession/
}
```

---

##### Fichiers à créer / modifier

| Action | Fichier |
|--------|---------|
| Nouveau | `src/pages/settings/SettingsDmtg.jsx` |
| Nouveau | `src/pages/settings/SettingsDmtg.css` |
| Nouveau | Sections `src/pages/settings/Dmtg/*.jsx` (6 sections) |
| Modifier | `src/constants/settingsRoutes.js` — ajouter route `dmtg` |
| Modifier | `src/constants/settingsDefaults.ts` — ajouter `DEFAULT_DMTG_SETTINGS` |
| Modifier | `src/utils/fiscalSettingsCache.js` — ajouter fetch `dmtg_settings` |
| Modifier | `src/hooks/usePlacementSettings.js` — exposer dmtgSettings |
| Migration | `supabase/migrations/YYYYMMDD_dmtg_settings.sql` |
| Modifier | Engine succession — lire barèmes depuis settings (vs hardcoded) |

##### DoD

- [ ] Page accessible à `/settings/dmtg-succession` (onglet dans SettingsShell).
- [ ] Table `dmtg_settings` créée + RLS (auth read / admin write).
- [ ] Barèmes et abattements éditables par l'admin → sauvegarde → invalidation cache.
- [ ] Engine succession utilise les valeurs dynamiques de `dmtg_settings`.
- [ ] `npm run check` passe (lint + typecheck + 1088+ tests + build).
- [ ] Simulateur succession recalcule en temps réel après modification admin.

---

## 🚧 Item transversal — 📌 Taux vivants / `reference_rates` (simulateurs)

**Pourquoi** : les simulateurs (IR, placement, succession, crédit) nécessitent des taux et barèmes à jour (PASS, barèmes IR, taux PS, barèmes DMTG, abattements…). Coder ces valeurs en dur dans les rules statiques crée une dette croissante : chaque exercice ou PLF nécessite un patch manuel, et les oublis produisent des résultats silencieusement faux.

**Principe** : **séparer les rules statiques (règles de droit, Code civil) des taux vivants (valeurs numériques révisables par PLF)**.
- Les `rules/library/*.ts` ne doivent **jamais** contenir de valeur numériquement révisable (PASS, seuils micro-BIC, taux PS, abattements DMTG, forfait social…) sans commentaire `// À confirmer + source`.
- Les taux vivants sont stockés dans des tables Supabase dédiées avec date de mise à jour et source légale.

**Tables Supabase existantes** (taux vivants déjà migrés) :

| Table | Taux vivants couverts |
|-------|----------------------|
| `tax_settings` | Barème IR, PFU, CEHR, IS, DMTG (barèmes + abattements partiels) |
| `ps_settings` | PS patrimoine 17,2 %, cotisations retraite, seuils RFR |
| `fiscality_settings` | AV (990I, 757B), PER, PEA, dividendes |
| `dmtg_settings` *(P1-06 — à créer)* | Barèmes DMTG complets + abattements donation + art. 790 G + AV |

**Architecture cible — `reference_rates`** (phase suivante) :
- [ ] Table `reference_rates` : `{ key, value, label, source_url, last_updated_at, valid_from, valid_until }`.
- [ ] Clés typiques : `PASS_N`, `TAUX_PS_PATRIMOINE`, `SEUIL_MICRO_BIC`, `FORFAIT_SOCIAL_20`, `TAUX_LIVRET_A`…
- [ ] Edge Function `rates-refresh` (cron hebdomadaire) : fetch depuis les sources officielles (URSSAF, legifrance, service-public) + upsert avec horodatage.
- [ ] Alerte automatique si `last_updated_at` > 90 jours (webhook ou notification admin dans `RUNBOOK.md`).
- [ ] Affichage `last_updated_at` dans l'UI simulateur (transparence).
- [ ] Les `rules/library/*.ts` référencent uniquement la *clé* du taux (ex: `PASS_N`) — jamais la valeur brute.

**Classification complète taux vivants vs structurels** : voir `docs/ARCHITECTURE.md` § Taux vivants.

**DoD** :
- `rg "35 194\|77 700\|23 000\|8,3 %\|17,2 %" src/domain/base-contrat/rules/library/` → vide (valeurs migrées).
- Table `reference_rates` créée avec migration SQL + RLS (lecture authentifiée, écriture admin).
- Edge function `rates-refresh` déployée + test smoke.
- Alerte sur stale data documentée dans `docs/RUNBOOK.md`.

> ⚠️ **Règle immédiate** : d'ici la migration complète, tout nouveau taux révisable ajouté dans les rules **doit** être accompagné de `// À confirmer` et d'une source officielle. Le garde-fou `rules.test.ts` l'impose.

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
