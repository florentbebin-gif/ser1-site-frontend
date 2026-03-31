# Plan — Contrôle du Potentiel Épargne Retraite — /sim/per

> Fusion des deux plans : analyse Excel + architecture repo. 4 PRs.

---

## 1. Analyse Excel (points forts & calculs)

### Flux pédagogique

```
Pot ER Mode → Avis IR N-2 → Décla N-1 ou Estimation N → Synthèse décla ou Synthèse → Impr (2)
  (mode)       (plafonds)     (revenus + cotisations)     (plafonds + simulation IR)    (PPTX)
```

### Deux modes

| Mode | Source revenus | Source plafonds |
|---|---|---|
| "Versement N" — vérifier le potentiel | Estimation N | Synthèse |
| "Déclaration 2042" — accompagner N-1 | Décla N-1 | Synthèse décla |

Les formules basculent via `IF('Pot ER Mode'!G13="Réaliser un versement N…", …, …)`.

### Calculs clés

**1. Plafond 163 Quatervicies (personnel)**
```
plafond_brut = CLAMP(revenu_imposable * 10%, 10% * PASS, 10% * 8 * PASS)
plafond_net  = plafond_brut - art83 - MAX(0, madelin - 15%*(BIC-PASS)) - PERCO
```

**2. Report en avant (3 ans, FIFO)**
```
total = plafond_163Q_N + non_utilisé_N-2 + non_utilisé_N-3 + non_utilisé_N-4
# Chaque année utilise le PASS historique correspondant
```

**3. Plafond Madelin 154 bis (TNS)**
```
assiette = BIC + art62 + cotisations_madelin + PERin_154bis + prévoyance
env_15pct = IF(assiette > PASS, MIN(assiette, 8*PASS) - PASS) * 15%, 0)
env_10pct = CLAMP(assiette * 10%, 10% * PASS, 10% * 8 * PASS)
potentiel = env_15pct + env_10pct - versements_déjà_faits
```

**4. Estimation IR** → wrapper sur `src/engine/ir/compute.ts` (barème, décote, QF, CEHR)

**5. Impact versement** → `économie = MIN(versement, plafond_dispo) × TMI`

### Points forts à préserver

1. Choix du mode avant tout
2. Lecture pédagogique de l'avis IR
3. Deux déclarants (conjoint)
4. Mutualisation plafonds (6QR)
5. Double enveloppe TNS (163Q + Madelin)
6. Report 3 ans FIFO
7. Références cases 2042 (6NS/6NT/6RS/6QS/6OS…)
8. Export PPTX structuré

### Erreurs / simplifications Excel identifiées

- VLOOKUP PASS peut dériver si année changée manuellement
- Quotient familial simplifié (enfants×0.25 au lieu de la règle réelle : 3ème enfant = 1 part)
- Parent isolé : **géré** pour le plafonnement QF (Décla N-1!G16 + Données!G18=4224), mais pas
  pour le calcul des demi-parts enfants. Le moteur IR repo (`src/engine/ir/parts.ts`,
  `src/engine/ir/adjustments.ts`) gère les deux → écart volontaire documenté dans PARITE_WORKBOOK.md

---

## 2. Violations existantes à corriger (PR-1)

`src/engine/per.ts` lignes 82-95 : barème IR hardcodé (`TRANCHES_IR_2024`), plafond `35194`, abattement `0.10`.
Le CI (`check:fiscal-hardcode`) ne détecte pas ces valeurs mais AGENTS.md les interdit.
Pattern à suivre : `src/engine/placement/fiscalParams.ts` → `extractFiscalParams()`.

---

## 3. Cibles / Contraintes repo

- Valeurs fiscales → `settingsDefaults.ts` uniquement (jamais hardcoded)
- Barème IR live → `useFiscalContext({ strict: true })`
- PASS history → `settingsDefaults.ts` (mise à jour annuelle)
- Engine = fonctions pures, zéro React, zéro Supabase
- Fichiers < 500 lignes idéal, < 800 obligatoire
- TypeScript strict, `npm run check` avant chaque commit
- Réutiliser `src/engine/ir/` pour estimation IR (ne pas recoder)

---

## 4. Architecture cible

### Routing (sous-routes réelles)

```
/sim/per            → PerHome.tsx (hub 3 cartes)
/sim/per/potentiel  → PerPotentielSimulator.tsx (wizard 4 étapes)
/sim/per/ouverture  → PerSimulator.tsx (existant, déplacé)
/sim/per/transfert  → PerTransfertPlaceholder.tsx (stub)
```

### Structure fichiers

```
src/engine/per/
  index.ts
  perCapitalisation.ts          # existant per.ts déplacé + refactor fiscal
  perPotentiel.ts               # ou splitté en sous-modules :
    plafond163Q.ts
    plafondMadelin.ts
    reportEnAvant.ts
  perIrEstimation.ts            # wrapper src/engine/ir/compute.ts
  types.ts
  __tests__/
    perPotentiel.test.ts

src/features/per/
  index.ts
  PerHome.tsx                   # hub 3 cartes (~80 lignes)
  Per.css
  components/
    ouverture/
      PerSimulator.tsx          # existant déplacé
    potentiel/
      PerPotentielSimulator.tsx # orchestrateur (~120 lignes)
      PerPotentielStepper.tsx   # indicateur étapes (~60 lignes)
      steps/
        ModeStep.tsx            # (~80 lignes)
        AvisIrStep.tsx          # (~150 lignes)
        SituationFiscaleStep.tsx        # (~200 lignes, split si besoin)
        SituationFiscaleRevenusPart.tsx # (~150 lignes)
        SituationFiscaleCotisationsPart.tsx # (~120 lignes)
        SynthesePotentielStep.tsx       # (~200 lignes)
    transfert/
      PerTransfertPlaceholder.tsx
  hooks/
    usePerCalc.ts               # existant inchangé
    usePerPotentiel.ts          # nouveau (~150 lignes)
  export/
    perPotentielPptx.ts         # (~250 lignes)

src/constants/
  settingsDefaults.ts           # ajout PASS_HISTORY
```

### Types exportés (engine)

```ts
// ── Entrées ──
interface DeclarantRevenus {
  salaires: number;
  fraisReels?: number;
  fraisReelsMontant?: number;
  art62: number;              // Revenus associés/gérants art.62
  bic: number;                // BIC/BNC/BA
  retraites: number;
  fonciersNets: number;
  autresRevenus: number;
  cotisationsPer163Q: number;       // 6NS/6NT
  cotisationsPerp: number;          // 6RS/6RT
  cotisationsArt83: number;         // 6QS/6QT
  cotisationsMadelin154bis: number; // 6OS/6OT
  abondementPerco: number;
  cotisationsPrevo: number;         // warning si > 0
}

interface AvisIrPlafonds {
  // Du plus ancien au plus récent (lignes de l'avis IR)
  nonUtiliseAnnee1: number;   // plafond non utilisé le plus ancien
  nonUtiliseAnnee2: number;
  nonUtiliseAnnee3: number;
  plafondCalcule: number;     // plafond calculé sur revenus
  anneeRef: number;           // année de l'avis IR
}

interface SituationFiscaleInput {
  situationFamiliale: 'celibataire' | 'marie';
  nombreParts: number;
  isole: boolean;
  declarant1: DeclarantRevenus;
  declarant2?: DeclarantRevenus;
}

interface PerPotentielInput {
  mode: 'versement-n' | 'declaration-n1';
  anneeRef: number;
  situationFiscale: SituationFiscaleInput;
  avisIr?: AvisIrPlafonds;
  versementEnvisage?: number;
  mutualisationConjoints: boolean;
}

// ── Sorties ──
interface PlafondDetail {
  plafondCalculeN: number;
  nonUtiliseN1: number;
  nonUtiliseN2: number;
  nonUtiliseN3: number;
  totalDisponible: number;
  cotisationsDejaVersees: number;
  disponibleRestant: number;
  depassement: boolean;
}

interface SituationFiscaleResult {
  revenuImposableD1: number;
  revenuImposableD2: number;
  revenuFiscalRef: number;
  tmi: number;               // 0 | 0.11 | 0.30 | 0.41 | 0.45
  irEstime: number;
  decote: number;
  cehr: number;
  montantDansLaTMI: number;  // "reste dans la TMI"
}

interface PerPotentielResult {
  situationFiscale: SituationFiscaleResult;
  plafond163Q: { declarant1: PlafondDetail; declarant2?: PlafondDetail };
  plafondMadelin?: { declarant1: PlafondDetail; declarant2?: PlafondDetail };
  estTNS: boolean;
  warnings: string[];
  simulation?: {
    versementEnvisage: number;
    economieIRAnnuelle: number;
    coutNetApresFiscalite: number;
    plafondRestantApres: number;
  };
}
```

### Flux de données

```
Settings (tax_settings, ps_settings, fiscality_settings)
  → useFiscalContext({ strict: true })
    → Engine perPotentiel.ts
      - calculatePlafond163Q()    # plafond personnel
      - calculatePlafond154Bis()  # Madelin TNS
      - calculateReportEnAvant()  # carry-forward 3 ans FIFO
      - calculateMutualisation()  # transfert plafond conjoint
    → Engine perIrEstimation.ts   # wrapper sur src/engine/ir/compute.ts
      - estimerIR() → TMI, IR, décote, CEHR, marge dans TMI
```

---

## 5. Plan en 5 PRs

### PR-1 : Hub /sim/per + sous-routes + retrait route legacy

**Objectif** : créer le hub, les sous-routes, retirer le legacy PER du chemin produit.

> Note : GOUVERNANCE.md L629 dit explicitement « PER : branché et fonctionnel mais non reviewé
> — ne pas s'en inspirer. » Le legacy n'est donc pas déplacé vers /ouverture mais remplacé
> par un stub UpcomingSimulatorPage.

**Fichiers créés** :
- `src/features/per/PerHome.tsx` (~80 lignes) — 3 cartes : Potentiel (actif), Transfert (upcoming), Ouverture (upcoming).
- `src/features/per/components/transfert/PerTransfertPlaceholder.tsx` (~30 lignes) — stub.

**Fichiers modifiés** :
- `src/routes/appRoutes.ts` — sous-routes explicites :
  - `/sim/per` → `PerHome`
  - `/sim/per/potentiel` → stub (PerPotentielStub) temporaire
  - `/sim/per/ouverture` → `UpcomingSimulatorPage` (pas le legacy)
  - `/sim/per/transfert` → `PerTransfertPlaceholder`
- `src/features/per/index.ts` — exporter `PerHome` comme default.
- Le legacy (`PerSimulator.tsx`, `usePerCalc.ts`, `Per.css`) reste en place pour référence
  mais n'est plus routé. Suppression complète en PR-3 après livraison du nouveau moteur.

**Tests** : `npm run check` vert, golden test existant inchangé (le code legacy est toujours là, juste déconnecté de la route).

---

### PR-2 : Branchement PASS dans la chaîne fiscale + garde-fous étendus

**Objectif** : faire de `public.pass_history` la source de vérité du PASS, branchée dans la chaîne
fiscale standard du repo.

> Décision : le PASS vit dans Settings (table Supabase `pass_history`, déjà administrable via
> `PassHistoryAccordion` dans SettingsPrelevements). Il sera chargé dans le cache fiscal et
> exposé par `useFiscalContext`, avec fallback dans `settingsDefaults.ts`.
> Aucun composant React ne lira Supabase directement.

**Chaîne PASS cible** :
```
public.pass_history (Supabase, administré via Settings)
  → src/utils/cache/fiscalSettingsCache.ts (ajout fetch pass_history)
    → src/hooks/useFiscalContext.ts (ajout passHistoryByYear: Record<number, number>)
      → src/constants/settingsDefaults.ts (fallback PASS_HISTORY)
```

**Fichiers modifiés** :
- `src/utils/cache/fiscalSettingsCache.ts` — ajouter fetch `pass_history` + cache.
- `src/hooks/useFiscalContext.ts` — exposer `passHistoryByYear` dans `FiscalContext`.
- `src/constants/settingsDefaults.ts` — ajouter fallback :
  ```ts
  export const DEFAULT_PASS_HISTORY: Record<number, number> = {
    2019: 40524, 2020: 41136, 2021: 41136,
    2022: 41136, 2023: 43992, 2024: 46368, 2025: 47100,
  };
  ```
- `scripts/check-no-hardcoded-fiscal-values.mjs` — étendre aux patterns PER :
  ajouter `35194` (plafond déduction), `40524`/`41136`/`43992`/`46368`/`47100` (PASS)
  dans les FORBIDDEN_VALUES (exclure `settingsDefaults.ts` et tests).

**Tests** : `npm run check` vert, vérifier que le PASS est bien exposé dans fiscalContext.

---

### PR-3 : Engine perPotentiel + suppression legacy + golden tests

**Objectif** : moteur de calcul pur (zéro React) + suppression du legacy PER.

**Fichiers créés** :
- `src/engine/per/` (dossier) :
  - `types.ts` — interfaces PerPotentielInput, PerPotentielResult, etc.
  - `plafond163Q.ts` — calcul plafond personnel (salariés + TNS), avec réductions art83/Madelin/PERCO
  - `plafondMadelin.ts` — enveloppe 154bis TNS (15% + 10%)
  - `reportEnAvant.ts` — carry-forward 3 ans FIFO + lecture avis IR
  - `perIrEstimation.ts` — **wrapper** `src/engine/ir/compute.ts` (ne pas recoder l'IR)
  - `perPotentiel.ts` — orchestrateur principal
  - `index.ts` — barrel
- `src/engine/per/__tests__/perPotentiel.test.ts` — golden tests (8+ cas) :
  - Célibataire salarié TMI 30%, 80k
  - Couple avec mutualisation
  - Parent isolé (isIsolated=true)
  - TNS Madelin simple
  - TNS Madelin avec recalcul RBG (interprétation)
  - Mode déclaration (avis IR fourni)
  - Mode estimation avec avis
  - Mode estimation sans avis
  - Dépassement → warning
- `docs/PARITE_WORKBOOK.md` — registre de parité Excel vs repo :
  - Écarts volontaires documentés (parts enfants, parent isolé, arrondis IR)
  - Tolérance : 0 € sur boxes 2042 et reportables, ≤ 1 € sur IR/TMI/CEHR

**Fichiers supprimés** :
- `src/engine/per.ts` — remplacé par `src/engine/per/`
- `src/engine/__tests__/golden/per-tmi0-3k-10ans.golden.json` — legacy
- `src/engine/__tests__/golden/per-tmi30-5k-20ans.golden.json` — legacy
- `src/engine/__tests__/golden/per-tmi41-10k-15ans.golden.json` — legacy
- `src/features/per/PerSimulator.tsx` — legacy non reviewé
- `src/features/per/usePerCalc.ts` — legacy
  (Per.css conservé si réutilisable pour le wizard)

**Contraintes** :
- Moteur consomme `passHistoryByYear` depuis fiscalContext (pas de hardcode PASS)
- Moteur consomme barème IR depuis fiscalContext (pas de hardcode barème)
- Wrapper IR réutilise `src/engine/ir/compute.ts` — ne pas recoder

**Tests** : `npm run check` vert, `check:fiscal-hardcode` passe, 8+ golden tests passent.

---

### PR-4 : Wizard "Contrôle du Potentiel" (UX 4 étapes)

**Objectif** : 4 étapes du wizard, state management complet.

**3 flux retenus** (calés sur Pot ER Mode!G13) :
- **Mode déclaration** : Mode → SituationFiscale → Synthèse décla
- **Mode estimation avec avis** : Mode → AvisIR → SituationFiscale → Synthèse
- **Mode estimation sans avis** : Mode → SituationFiscale → Synthèse (plafonds historiques estimés)

**Étape 1 — ModeStep.tsx** (~80 lignes)
- Deux cartes visuelles : "Réaliser un versement" / "Déclarer dans la 2042"
- CTA "Continuer"

**Étape 2 — AvisIrStep.tsx** (~150 lignes, conditionnel)
- Écran pédagogique reproduisant le format avis IR officiel
- 4 champs par déclarant : plafonds non utilisés (3 années) + plafond calculé
- Toggle "Je n'ai pas mon avis" → skip vers estimation

**Étape 3 — SituationFiscaleStep.tsx** (~200 lignes, split si > 350)
- Situation familiale, enfants (charge/shared, pas compteur simple), parent isolé
- Revenus par déclarant : salaires, art62, BIC, pensions, foncier, autres
- Frais réels (toggle + montant)
- Cotisations ER avec codes 2042 (6NS/6NT/6RS/6QS/6OS…)
- Cotisations prévoyance Madelin (⚠️ warning si > 0)
- Toggle mutualisation (si couple)
- Interprétation Madelin : "Revenu Brut Global" vs "Revenu imposable" (select, défaut RBG)

**Étape 4 — SynthesePotentielStep.tsx** (~200 lignes)
- Card Situation fiscale : TMI, IR, CEHR, décote, "Montant dans la TMI"
- Card Plafond 163Q : tableau D1/D2, carry-forward, disponible, badge dépassement
- Card Plafond Madelin 154bis (si TNS) : enveloppes 15%+10%
- Boxes 2042 simulées (6NS→6QW)
- Alertes réintégration fiscale si dépassement
- Section Simulation versement (mode "versement N") : input + affichage live économie IR

**Hook** `usePerPotentiel.ts` (~150 lignes) :
```ts
interface PerPotentielState {
  step: 1 | 2 | 3 | 4;
  mode: 'versement-n' | 'declaration-n1' | null;
  avisIr: AvisIrPlafonds | null;
  avisIrConnu: boolean;
  situationFiscale: SituationFiscaleInput;
  versementEnvisage: number | null;
  mutualisationConjoints: boolean;
  interpretationMadelin: 'rbg' | 'revenu-imposable';
}
// Persistence : sessionStorage 'ser1:sim:per:potentiel:v1'
```

**Orchestrateur** `PerPotentielSimulator.tsx` (~120 lignes) :
- `useFiscalContext({ strict: true })` → fiscalParams + passHistoryByYear
- Stepper horizontal, étapes conditionnelles selon mode + avisIrConnu

**Tests** : `npm run check`, `check:fiscal-hardcode`, vérification manuelle desktop + mobile.

---

### PR-5 : Exports PPTX/Excel + docs finales

**Objectif** : exports + finalisation docs + captures de vérification.

**PPTX** (`perPotentielPptx.ts` ~250 lignes) — narration Impr (2), pas pixel-perfect :

| Slide | Titre | Contenu |
|---|---|---|
| 1 | Couverture | Client, date, CGP — adapté au mode |
| 2 | Objectifs & Contexte | Texte adaptatif (versement vs déclaration) |
| 3 | Situation fiscale | TMI, IR, CEHR |
| 4 | Plafonds 163Q | Tableau D1/D2, carry-forward |
| 5 | Plafonds Madelin (si TNS) | 154bis D1/D2 |
| 6 | Synthèse avis IR simulé | Cases 2042, plafonds reportés |

**Excel** (via xlsxBuilder) :
- Onglets : Synthèse, Cases 2042, Hypothèses

**Docs** :
- `docs/METIER.md` § PER enrichi
- `docs/ROADMAP.md` — items P3 marqués
- `docs/ARCHITECTURE.md` — routes map + fichiers clés PER
- `docs/GOUVERNANCE.md` L629 — mettre à jour statut PER

---

## 6. Vérification end-to-end

```bash
# Après chaque PR :
npm run check                    # lint + fiscal-hardcode + typecheck + test + build
npm test -- perPotentiel         # golden tests spécifiques
npm run check:fiscal-hardcode    # aucune valeur dans engine/features

# Vérifier manuellement :
# 1. /sim/per → 3 cartes visibles
# 2. /sim/per/ouverture → simulateur existant intact
# 3. /sim/per/potentiel → wizard 4 étapes
# 4. Salarié TMI30, 80k : plafond = 10% * 80k = 8k (si pas de réductions)
# 5. TNS BIC 120k : Madelin = 15%*(120k-47100) + 10%*47100 = 10935 + 4710 = 15645
# 6. Mutualisation : plafond D2 déversé sur D1
# 7. Mode déclaration : carry-forward N-4+N-3+N-2+N calculé
```

## 7. Fichiers critiques à ne pas casser

- `src/engine/per.ts` → golden `per-tmi30-5k-20ans.golden.json`
- `src/constants/settingsDefaults.ts` — source unique
- `src/routes/appRoutes.ts` — routing
- `src/features/per/usePerCalc.ts` — hook existant
- `src/engine/__tests__/golden/` — tous les golden tests

## 8. Éléments reportés (futurs)

| Simulateur | Onglets Excel | Statut |
|---|---|---|
| **Transfert ER** | CT à Transf, BASECG, NewPER, SynthèsePER, Sit 1/2, Impr (3) | Upcoming |
| **Ouverture PER** | MEPPER, MEPPER2/3, Sit 1(2)/2(2), TGF05 | Upcoming |

## 9. Résumé PRs

| PR | Effort | Risque | Dépendances |
|---|---|---|---|
| PR-1 : Hub + sous-routes + retrait legacy | Faible | Faible | — |
| PR-2 : Branchement PASS + garde-fous | Faible | Moyen | PR-1 |
| PR-3 : Engine perPotentiel + suppression legacy + golden | Moyen | Moyen | PR-2 |
| PR-4 : Wizard UX 4 étapes | Élevé | Moyen | PR-3 |
| PR-5 : Exports PPTX/Excel + docs finales | Moyen | Faible | PR-4 |

## 10. Hypothèses retenues

- `Impr (2)` est la seule source locale de "study deck" ; il n'y a pas de .pptx séparé.
- Le legacy PER peut être supprimé ; aucune dépendance runtime hors sa route et ses tests.
- Les enfants sont modélisés comme `charge | shared` (engine IR repo), pas comme un compteur.
- Le tableur reste une source d'analyse et de tests, pas une dépendance runtime.
- Un état transitoire (landing + stubs) entre PR-1 et PR-4 est accepté.
- Si un cas workbook révèle une divergence > 1 € non expliquée, l'implémentation s'arrête
  et remonte la cellule concernée pour arbitrage utilisateur avant UI finale.
