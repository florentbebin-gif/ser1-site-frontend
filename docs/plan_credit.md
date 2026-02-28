# PLAN — Refonte Simulateur Crédit SER1

Audit réalisé le **2026-02-28** — Toutes les preuves sont référencées (**fichier:ligne**)

> Objectif permanent : proposer une solution **SIMPLE, INTUITIVE et BIEN ORGANISÉE**, en respectant l’organisation actuelle du repo SER1.  
> Ce document est un **PLAN (pas de code)**, prêt à être exécuté via PR.

---

## Ajustements appliqués (vs plan initial)

Ces ajustements sont intégrés **sans supprimer** le contenu du plan, uniquement en le rendant plus sûr et conforme :

1) **Séparer les corrections de `premium-shared.css`** (blast radius global) dans une **PR dédiée “Gouvernance / shared CSS”**.  
2) **États d’erreur** : pas de “rouge hardcodé”. Utiliser un style d’erreur **conforme gouvernance** (C1 et/ou `#996600` selon le type d’erreur).  
3) **Toggle actif (C2 vs C4)** : **Home est la référence design** et ne doit pas bouger. On aligne donc les toggles (mode / switch) sur la **convention Home** (C4 pour l’état actif) **sauf décision produit explicite** de changer Home (dans ce cas, PR dédiée).

---

## 1) Executive Summary

Objectif : Faire de la page Crédit la référence template de tous les futurs simulateurs — ultra premium, intuitive, cohérente pixel-perfect avec Home et Settings, avec modes expert/simplifié opérationnels.

5 problèmes bloquants identifiés :

- useUserMode() absent de Credit.jsx — mode simplifié/expert non implémenté dans aucun simulateur
- Tous les styles des inputs sont en style={{}} inline dans CreditInputs.jsx avec mutation DOM via Object.assign(e.target.style, ...) — anti-pattern qui bypass React VDOM et bloque tout theming
- CreditV2.css duplique premium-shared.css avec ses propres classes cv2-* — le fichier partagé existe mais n'est pas utilisé
- 3 specs boutons différentes coexistent (cv2-btn / premium-btn / settings-save-btn) — padding et hover incohérents
- KPI manquant dans la synthèse : pas de mensualité totale avec assurance — le chiffre le plus attendu par un CGP ou son client

Vision cible : Shell simulateur partagé (SimulatorShell + SimulatorHeader) extrait en src/components/simulator/ ; page Crédit pilotée par le mode utilisateur global ; tableaux collapsés par défaut en mode simplifié ; inputs migrés vers classes CSS.

Découpage : **4 PR** — **PR0 (Gouvernance shared CSS)**, PR1 (CSS/archi Credit), PR2 (modes + UX), PR3 (polish + a11y).

> Note : le plan initial mentionnait “3 PR”. Pour réduire le risque, les changements “shared” sont isolés en PR0.

---

## 2) Diagnostic avec preuves

### 2.1 Problèmes bloquants

| # | Problème | Fichier:ligne | Gravité |
|---|---|---|---|
| B1 | useUserMode() jamais importé dans Credit.jsx — mode simplifié/expert absent | Credit.jsx:1-31 (aucun import) | 🔴 Bloquant |
| B2 | Styles inline dans CreditInputs.jsx + mutation DOM Object.assign(e.target.style) sur focus/blur | CreditInputs.jsx:18-70, l.109-112, l.151, l.171-173, l.219-225, l.259-264 | 🔴 Bloquant |
| B3 | CreditV2.css duplique premium-shared.css : .cv2-page = .premium-page (identiques), .cv2-header = .premium-header (identiques) — Credit n'importe pas premium-shared.css | CreditV2.css:10-14 vs premium-shared.css:212-216 ; CreditV2.css:27-35 vs premium-shared.css:218-226 | 🔴 Bloquant |
| B4 | KPI "Mensualité totale avec assurance" absent — seuls "hors ass." et "Assurance" séparés | CreditSummaryCard.jsx:34-50 | 🔴 Bloquant UX |
| B5 | Couleur hardcodée rgba(127, 176, 143, 0.1) dans focus ring (violation gouvernance) | premium-shared.css:190 | 🔴 Bloquant (gouvernance) |

### 2.2 Problèmes importants

| # | Problème | Fichier:ligne | Gravité |
|---|---|---|---|
| I1 | 3 specs boutons différentes : .cv2-btn padding 8px 16px / .premium-btn padding 10px 18px / .settings-save-btn padding 10px 28px | CreditV2.css:222 vs premium-shared.css:140 vs SettingsShared.css:209 | 🟠 Important |
| I2 | Focus ring 2px dans Credit vs 3px dans Settings — incohérent | CreditInputs.jsx:36 (0 0 0 2px) vs SettingsShared.css:67 (0 0 0 3px) | 🟠 Important |
| I3 | Toggle actif couleur C2 (Credit) vs C4 (Home/ModeToggle) — même composant, 2 couleurs | CreditInputs.jsx:350 vs Home.css:122 | 🟠 Important |
| I4 | Input border-radius: 6px (Credit) vs 4px (Settings) — incohérent | CreditInputs.jsx:23 vs SettingsShared.css:57,88 | 🟠 Important |
| I5 | Hiérarchie de titres incohérente sur la page : 11px / 13px / 14px pour "section title" selon l'endroit | CreditV2.css:177 (14px card title), l.202 (13px form section), l.307 (11px summary) | 🟠 Important |
| I6 | Tableaux (échéancier) ouverts par défaut — 240 lignes immédiates pour un non-expert | CreditScheduleTable.jsx:68-83 (toggle existe mais collapse=false par défaut) | 🟠 Important |
| I7 | Aucun état d'erreur visuel sur les inputs (pas de bordure rouge, pas de message) | CreditInputs.jsx:76-406 (pas d'error prop) | 🟠 Important |
| I8 | Loading state = texte brut "Chargement…" — pas de skeleton ni spinner | Credit.jsx:211-213 | 🟠 Important |
| I9 | Card background : .premium-card utilise var(--color-c7) au lieu de #FFFFFF — inverser la règle (c7=page, blanc=card) | premium-shared.css:50 | 🟠 Important |
| I10 | box-shadow avec rgba(0,0,0,0.04/0.06) — non couvert par les tokens, borderline gouvernance | CreditV2.css:170,302, premium-shared.css:54 | 🟠 Important |

### 2.3 Polish

| # | Problème | Fichier:ligne | Gravité |
|---|---|---|---|
| P1 | Bouton hover manque transform: translateY(-1px) (présent dans .premium-btn, absent de .cv2-btn) | CreditV2.css:233-236 vs premium-shared.css:155 | 🟡 Polish |
| P2 | .cv2-summary__lissage-info utilise var(--color-c6) pour border-top (incohérent avec C8 partout) | CreditV2.css:389 | 🟡 Polish |
| P3 | Ajout Prêt 2/3 : uniquement via onglet "+" — non découvrable pour novice | CreditLoanTabs.jsx:24,57 | 🟡 Polish |
| P4 | Hypothèses toujours visible et expand — section technique, devrait être collapsed pour simplifié | Credit.jsx:357-365 | 🟡 Polish |
| P5 | cv2-tabs__tab.is-addable opacity 0.7 — trop subtil, le "+" n'est pas assez visible | CreditV2.css:143 | 🟡 Polish |
| P6 | focus-visible manquant sur la plupart des éléments interactifs (seulement tab active a :focus-visible) | CreditV2.css:136-139 (seul endroit) | 🟡 Polish |
| P7 | Aucune transition sur l'affichage/masquage des sections mode expert (brusque) | — | 🟡 Polish |
| P8 | Champ "Date de souscription" avec type="month" : affichage natif du browser, incohérent visuellement entre OS | CreditInputs.jsx:249 | 🟡 Polish |

### 2.4 Tableau des écarts visuels Crédit vs Home + Settings

| Élément | Valeur actuelle (Crédit) | Valeur cible (Home/Settings) | Fichier preuve Crédit | Fichier preuve référence |
|---|---:|---:|---|---|
| Page max-width | 1200px | 1200px ✅ | CreditV2.css:11 | premium-shared.css:213 |
| Page padding | 32px 24px 64px | 32px 24px 64px ✅ | CreditV2.css:13 | premium-shared.css:215 |
| Header border-bottom | 2px solid var(--color-c8) ✅ | 2px solid var(--color-c8) | CreditV2.css:34 | premium-shared.css:225 |
| Titre page | 22px, 600, C1 ✅ | 22px, 600, C1 | CreditV2.css:38-41 | premium-shared.css:10-14 |
| Sous-titre page | 12px, 400, C9 ✅ | 12px, 400, C9 | CreditV2.css:46-48 | premium-shared.css:18-22 |
| Card background | #FFFFFF ✅ | #FFFFFF (gouvernance) | CreditV2.css:166 | GOUVERNANCE.md |
| Card border-radius | 12px ✅ | 12px | CreditV2.css:168 | Home.css:22 (.hero-tile) |
| Bouton padding | 8px 16px ❌ | 10px 18px | CreditV2.css:222 | premium-shared.css:140 |
| Bouton hover transform | absent ❌ | translateY(-1px) | CreditV2.css:233-236 | premium-shared.css:155 |
| Input height | 32px ✅ | 32px (settings inline) | CreditInputs.jsx:19 | SettingsShared.css:50-53 |
| Input border-radius | 6px ❌ | 4px (Settings) | CreditInputs.jsx:23 | SettingsShared.css:57 |
| Focus ring size | 2px ❌ | 3px | CreditInputs.jsx:36 | SettingsShared.css:67 |
| Focus ring color | var(--color-c4) ✅ | var(--color-c4) | CreditInputs.jsx:36 | SettingsShared.css:67 |
| Tab underline active | 2px solid C2 ✅ | 2px solid C2 | CreditV2.css:133 | SettingsShell (inféré) |
| Tab active color | C1, 600 ✅ | C1, 600 | CreditV2.css:131-132 | SettingsShell |
| Toggle actif | C2 ❌ | C4 (Home) | CreditInputs.jsx:350 | Home.css:122 |
| Section title 11px | présent sur summary ✅, absent sur form sections ❌ | 11px, 600, uppercase, C9 | CreditV2.css:307-313 | premium-shared.css:24-31 |
| Box-shadow card | 0 2px 12px rgba(0,0,0,0.04) | même spec ✅ | CreditV2.css:170 | premium-shared.css:54 |

### 2.5 Anti-patterns architecture

| Anti-pattern | Description | Preuve | Impact |
|---|---|---|---|
| Mutation DOM directe | Object.assign(e.target.style, inputFocusStyle) sur focus/blur bypasse React VDOM | CreditInputs.jsx:109-112,151,172 | Impossibilité de thématiser ; effets de bord si React re-render |
| Duplication CSS | CreditV2.css réimplémente 70%+ de premium-shared.css avec préfixe cv2- au lieu d'importer le fichier partagé | Credit.jsx:31 (seul import CSS) | Divergence garantie à terme |
| Style isolation artificielle | Commentaire CreditInputs.jsx:15 dit "inline pour isolation" — justification incorrecte | CreditInputs.jsx:15 | Bloque theming dynamique |
| 3 specs bouton | cv2-btn, premium-btn, settings-save-btn — même element, 3 specs | voir tableau ci-dessus | Incohérence visuelle garantie |
| Pas de composants ui/ utilisés | Button.tsx, Card.tsx, Table.tsx existent dans src/components/ui/ mais Credit n'en utilise aucun | Credit.jsx:1-31 | Duplication, token drift |

---

## 3) UX cible "ultra premium"

### 3.1 Wireframe ASCII — Mode Simplifié (desktop ≥1280px)

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  Simulateur de crédit                      [Mensuel | Annuel]  [Exporter ▾]     ║
║  Simulez les mensualités et le coût global du financement.     [Mode simplifié] ║
╠════════════════════════════════════════════╦═══════════════════════════════════╣
║                                            ║   ┌────────────────────────────┐  ║
║  ┌──────────────────────────────────────┐  ║   │  SYNTHÈSE DU PRÊT          │  ║
║  │  Montant emprunté     Durée          │  ║   │  ┌─────────────┬─────────┐  │  ║
║  │  [ 300 000        €]  [ 240   mois]  │  ║   │  │  3 630 €    │  150 € │  │  ║
║  │                                      │  ║   │  │  Mensualité │  Assur.│  │  ║
║  │  Taux d'intérêt      Mensualité      │  ║   │  │  (avec ass.)│  /mois │  │  ║
║  │  [  3,50         %]  1 740 €         │  ║   │  └─────────────┴─────────┘  │  ║
║  │                         Hors ass.    │  ║   │                              │  ║
║  ├──────────────────────────────────────┤  ║   │  Coût des intérêts  233 k€  │  ║
║  │  Assurance   Taux [ 0,30 %]         │  ║   │  Coût assurance      20 k€  │  ║
║  │  (Options avancées ∨)               │  ║   │  ────────────────────────── │  ║
║  └──────────────────────────────────────┘  ║   │  Coût total du crédit       │  ║
║                                            ║   │           253 141 €         │  ║
║  + Ajouter un 2ème prêt                    ║   └────────────────────────────┘  ║
║    (déplié seulement en mode simplifié)    ║                                   ║
║                                            ║                                   ║
╠════════════════════════════════════════════╩═══════════════════════════════════╣
║  ▶ Voir le tableau d'amortissement (240 lignes)          [Afficher ▾]           ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║  ▶ Hypothèses et limites                                 [Afficher ▾]           ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

Règles mode simplifié :

- Champs visibles : Montant, Durée, Taux crédit, Mensualité (read-only calculée)
- Assurance : taux seulement, mode CI et quotité 100% par défaut (silencieux)
- "Options avancées ∨" : accordion pour voir mode CI/CRD et quotité si besoin
- Type de crédit : caché (amortissable par défaut)
- Prêt 2/3 : lien discret sous le formulaire, pas d'onglet visible
- Tableau amortissement : collapsé par défaut
- Hypothèses : collapsées par défaut
- KPI principal = mensualité totale AVEC assurance (chiffre visible, grand)

### 3.2 Wireframe ASCII — Mode Expert (desktop ≥1280px)

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  Simulateur de crédit              [⚡ Mode expert]  [Mensuel|Annuel]  [Export] ║
║  Simulez les mensualités et le coût global du financement.                      ║
╠════════════════════════════════════╦═══════════════════════════════════════════╣
║  [Prêt 1] [Prêt 2 +] ···          ║   ┌────────────────────────────┐          ║
║  ───────────────────────────      ║   │  SYNTHÈSE DU PRÊT          │          ║
║  ┌───────────────────────────┐    ║   │  ┌─────────────┬─────────┐│          ║
║  │  Type de crédit  Date     │    ║   │  │  3 630 €    │  150 € ││          ║
║  │  [Amortissable▼] [2026-02]│    ║   │  │  Mensualité │  Assur.││          ║
║  │                           │    ║   │  │  (avec ass.)│  /mois ││          ║
║  │  Montant   Durée          │    ║   │  └─────────────┴─────────┘│          ║
║  │  [300 000€] [240 mois]    │    ║   │  Coût intérêts   233 k€    │          ║
║  │  Taux      Mensualité     │    ║   │  Coût assurance   20 k€    │          ║
║  │  [3,50%]   1 740€         │    ║   │  Coût total     253 141€   │          ║
║  ├─ Assurance emprunteur ────┤    ║   └────────────────────────────┘          ║
║  │ Mode  Taux  Quotité       │    ║                                           ║
║  │ [CRD] [0,30] [100%]       │    ║                                           ║
║  └───────────────────────────┘    ║                                           ║
║  ┌─ Options de lissage ──────┐    ║                                           ║
║  │ ⊙ Lisser le prêt 1        │    ║                                           ║
║  │ [Mensu cste] [Durée cste] │    ║                                           ║
║  └───────────────────────────┘    ║                                           ║
╠════════════════════════════════════╩═══════════════════════════════════════════╣
║  Répartition par période                                                        ║
║  [Tableau périodes — auto visible si 2+ prêts]                                   ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║  Échéancier mensuel                                          [Masquer ▾]        ║
║  [Tableau amortissement — ouvert par défaut en expert]                          ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║  Hypothèses et limites                                       [Masquer ▾]        ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

### 3.3 Règles de hiérarchie visuelle

Titres :

- H1 page : 22px, 600, C1, letter-spacing 0.5px — class premium-title
- Sous-titre : 12px, 400, C9 — class premium-subtitle
- Section title (card, schedule) : 14px, 600, C1 — class sim-section-title
- Section label (assurance, lissage) : 11px, 600, uppercase, letter-spacing 1.5px, C9 — class premium-section-title
- Labels input : 12px, 500, C9 — class premium-label

Placement de la synthèse (sticky sidebar) — justification :
La synthèse sticky droite est optimale pour un CGP qui saisit des données séquentiellement (capital → durée → taux) et doit voir le résultat se mettre à jour en temps réel sans scroller. C'est le pattern validated par Figma/banking tools. À ≤900px (tablette), la synthèse passe au-dessus du formulaire (position static, full-width) car le sticky n'a plus de sens en colonne unique.

Progressive disclosure par mode :

| Bloc | Simplifié | Expert |
|---|---:|---:|
| Montant + Durée + Taux crédit | ✅ visible | ✅ visible |
| Mensualité calculée (read-only) | ✅ visible | ✅ visible |
| KPI mensualité totale avec ass. | ✅ prioritaire | ✅ visible |
| Type de crédit (In fine) | ❌ caché (default: amortissable) | ✅ visible |
| Date de souscription | ❌ caché (default: mois courant) | ✅ visible |
| Assurance — taux uniquement | ✅ visible simplifié | ✅ visible |
| Assurance — mode CI/CRD + quotité | ❌ "Options avancées ∨" | ✅ visible |
| Prêt 2 / Prêt 3 (onglets) | ❌ lien discret | ✅ onglets visibles |
| Lissage | ❌ caché | ✅ visible |
| Tableau amortissement | ❌ collapsé par défaut | ✅ ouvert par défaut |
| Tableau périodes | ❌ caché | ✅ visible si 2+ prêts |
| Hypothèses | ❌ collapsées par défaut | ✅ ouvertes par défaut |

Bascule de mode :

- useUserMode() branché dans Credit.jsx (orchestrateur)
- Chip discret dans le header : [Mode simplifié] (cliquable → ouvre la page Home ou un popover info)
- Pas de double toggle sur la page — la source de vérité reste Home
- Transition CSS opacity + max-height sur les blocs conditionnels (éviter brusque)

---

## 4) Plan de refactor / réorganisation

### 4.1 Arborescence cible

```
src/
├── components/
│   ├── simulator/                    ← NOUVEAU — shell partagé tous simulateurs
│   │   ├── SimulatorShell.jsx        (wrapper: max-width, padding, bg page)
│   │   ├── SimulatorHeader.jsx       (titre + sous-titre + actions slot)
│   │   └── SimulatorShell.css        (styles: .sim-page, .sim-header)
│   └── ui/                           (Button, Card, Table — déjà bien organisé)
│
├── styles/
│   └── premium-shared.css            (AUDIT: fix rgba hardcodé l.190, aligner card bg)
│
└── features/
    └── credit/
        ├── Credit.jsx                (+ useUserMode, + isExpert prop drilling)
        ├── components/
        │   ├── CreditV2.css          (NETTOYÉ: supprimer tout ce qui duplique SimulatorShell.css/premium-shared.css)
        │   ├── CreditInputs.jsx      (supprimer inline styles, ajouter prop `error`)
        │   ├── CreditInputs.css      ← NOUVEAU (styles extraits des inline)
        │   ├── CreditLoanForm.jsx    (+ prop `isExpert` pour conditional rendering)
        │   ├── CreditLoanTabs.jsx    (+ prop `isExpert` pour visibilité tabs)
        │   ├── CreditSummaryCard.jsx (+ KPI total avec assurance)
        │   ├── CreditHeader.jsx      (+ chip mode + titre ajusté)
        │   ├── CreditScheduleTable.jsx (+ prop `defaultCollapsed`)
        │   └── CreditPeriodsTable.jsx
        ├── hooks/                    (inchangé)
        └── utils/                    (inchangé)
```

Shared vs Spécifique :

| Élément | Shared (simulator/) | Spécifique (credit) |
|---|---|---|
| Layout shell (max-width, padding, bg) | SimulatorShell.css:.sim-page | — |
| Header layout (flex, border-bottom) | SimulatorShell.css:.sim-header | — |
| Pill toggle Mensuel/Annuel | SimulatorHeader.jsx slot "actions" | CreditHeader.jsx l'instancie |
| Classes .premium-* | premium-shared.css | importé par Credit |
| Composants ui/ Button, Card, Table | src/components/ui/ | Credit les utilise |
| Tabs Prêt 1/2/3 | — | CreditLoanTabs (spécifique sémantique) |
| Logique calcul crédit | — | useCreditCalculations.js |
| Styles inputs spécifiques | — | CreditInputs.css |

Conventions de nommage pour futurs simulateurs :

- Shell : classe CSS .sim-page, .sim-header, .sim-grid (dans SimulatorShell.css)
- Sections : .sim-section, .sim-section-title
- Simulateur spécifique : préfixe propre (per-*, ir-*) pour styles spécifiques uniquement
- Nouveau simulateur = import SimulatorShell from '@/components/simulator/SimulatorShell' + son contenu

### 4.2 Migration des styles inline → CSS

Fichier créer : src/features/credit/components/CreditInputs.css

Classes à créer (équivalents des 9 objets inline actuels) :

| Objet inline actuel | Classe CSS cible | Note |
|---|---|---|
| inputBaseStyle (l.18-31) | .ci-input | remplace style={{...inputBaseStyle}} |
| inputFocusStyle (l.33-37) | .ci-input:focus-visible | pseudo-class CSS, supprime Object.assign |
| labelStyle (l.39-45) | .ci-label |  |
| unitStyle (l.47-52) | .ci-unit |  |
| hintStyle (l.54-59) | .ci-hint |  |
| fieldContainerStyle (l.61-65) | .ci-field |  |
| inputWrapperStyle (l.67-70) | .ci-field-row |  |
| selectBaseStyle (l.275-287) | .ci-select |  |
| Toggle styles (l.331-372) | .ci-toggle, .ci-toggle__knob, .ci-toggle--active |  |

Correction critique focus/blur :

- Supprimer tous les onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
- Remplacer par CSS pseudo-class .ci-input:focus-visible (déjà plus robuste)
- Les états disabled : [disabled].ci-input { opacity: 0.5; cursor: not-allowed; }

Dans CreditV2.css — Supprimer (remplacé par imports) :

- .cv2-page → remplacé par .sim-page de SimulatorShell.css
- .cv2-header, .cv2-header__title, .cv2-header__subtitle, .cv2-header__actions → remplacés par .sim-header de SimulatorShell.css
- .cv2-btn → remplacé par .premium-btn de premium-shared.css
- .cv2-table* → remplacé par .premium-table* de premium-shared.css
- .cv2-card → remplacé par <Card> composant ui/ ou .premium-card (avec correction bg blanc)

Conserver dans CreditV2.css (spécifique crédit) :

- .cv2-grid (ratio 1.85fr/1fr spécifique crédit)
- .cv2-tabs* (tabs Prêt 1/2/3)
- .cv2-loan-form*
- .cv2-lissage*
- .cv2-summary*
- .cv2-schedule*, .cv2-periods*
- .cv2-hypotheses*

Dans premium-shared.css — Corriger :

- L.190 : rgba(127, 176, 143, 0.1) → var(--color-c4) avec opacity via CSS filter ou valeur calculée acceptable
- L.50 : .premium-card bg var(--color-c7) → #FFFFFF (gouvernance: surfaces surélevées = blanc)
- L.163-167 : .premium-btn-primary couleur var(--color-c7) → #FFFFFF

Harmonisation focus ring :

- Partout : box-shadow: 0 0 0 3px var(--color-c4) (3px, pas 2px)

Harmonisation bouton :

- Un seul standard : padding: 10px 18px, border-radius: 8px, hover translateY(-1px)

Harmonisation toggle actif (**AJUSTÉ**) :

- **Référence = Home** : conserver l’état actif en **C4** (Home.css:122) et aligner les toggles de Crédit sur cette convention.  
- Si une décision produit impose C2, alors : **PR dédiée** qui met à jour Home/ModeToggle + documentation (ne pas faire “en douce” dans Crédit).

---

## 5) Stratégie de delivery — Séquence de PR

### PR0 — Gouvernance : corrections shared (premium-shared.css)

Objectif : Corriger les violations gouvernance **au bon endroit** (shared) et limiter le blast radius via PR isolée + revue visuelle.

Fichiers touchés :

- MODIFIER premium-shared.css : fix rgba l.190, fix card bg l.50, fix .premium-btn-primary (L.163-167), harmoniser focus ring 3px si c’est la règle de référence
- Ajouter notes dans docs/GOUVERNANCE.md si nécessaire (si une exception est introduite)

Risques : Moyen (impact global). Doit être revu sur 2–3 pages (Home, Settings, Placement/Credit si elles utilisent premium-shared).

DoD :

- npm run check passe (lint + typecheck + test + build)
- Revue visuelle rapide : Home + Settings + une page simulateur existante
- Aucune nouvelle couleur hardcodée hors exceptions gouvernance

---

### PR1 — Fondation Credit : extraction shell + CSS cleanup (sans changer la logique métier)

Objectif : Remettre le code dans les rails sans changer le comportement métier. Extraction du shell + réduction duplication côté Crédit.

Fichiers touchés :

- CRÉER src/components/simulator/SimulatorShell.jsx + SimulatorShell.css
- CRÉER src/features/credit/components/CreditInputs.css
- MODIFIER CreditInputs.jsx : supprimer tous inline styles, ajouter import CSS, supprimer Object.assign anti-pattern
- MODIFIER CreditV2.css : supprimer classes dupliquées de premium-shared (et remplacer par classes shared/simulator)
- MODIFIER Credit.jsx : importer premium-shared.css, utiliser .sim-page/.sim-header
- MODIFIER boutons : harmoniser padding + hover transform sur .cv2-btn → .premium-btn
- MODIFIER focus ring : 2px → 3px (dans CreditInputs.css + CreditV2.css) pour matcher la référence

Risques : Faible à moyen. Changements CSS/structure. Calculs inchangés. Persistance inchangée.

DoD (Definition of Done) :

- npm run check passe (lint + typecheck + test + build)
- Tests E2E credit.spec.ts passent sans modification **ou** mise à jour minimale si selectors ont changé
- Pas de régression UX évidente (layout stable, inputs utilisables, export OK)
- Aucune couleur hardcodée hors exceptions gouvernance
- Object.assign(e.target.style) : 0 occurrence dans Crédit

---

### PR2 — Modes simplifié / expert + UX

Objectif : Différencier l'expérience selon le mode ; ajouter le KPI manquant.

Fichiers touchés :

- MODIFIER Credit.jsx : import { useUserMode }, const isExpert = mode === 'expert', prop drilling vers composants
- MODIFIER CreditHeader.jsx : chip mode + ajustement layout
- MODIFIER CreditLoanForm.jsx : isExpert prop → conditional rendering type crédit, date, bloc assurance complet
- MODIFIER CreditLoanTabs.jsx : isExpert → onglets Prêt 2/3 masqués en simplifié (remplacés par lien discret)
- MODIFIER CreditSummaryCard.jsx : ajouter KPI "Mensualité totale avec ass." (= mensualiteTotaleM1 + primeAssMensuelle)
- MODIFIER CreditScheduleTable.jsx : prop defaultCollapsed ; en simplifié defaultCollapsed=true
- MODIFIER Credit.jsx : hypothèses collapsables (wrapper accordéon) ; simplifié → collapsed par défaut
- MODIFIER CreditV2.css : transitions CSS pour blocs conditionnels (opacity + max-height)

Risques : Moyen. Logique de rendu conditionnelle. Tester en basculant de mode.

DoD :

- npm run check passe
- En mode simplifié : ≤5 champs visibles, tableau collapsé, hypothèses collapsées
- En mode expert : tous les champs visibles, tableau ouvert, hypothèses visibles
- Bascule de mode immédiate (pas de rechargement page)
- KPI mensualité totale visible dans les deux modes
- Tests E2E updatés pour tester les deux modes

---

### PR3 — Polish UI + accessibilité + responsive

Objectif : Pixel-perfect, keyboard-navigable, responsive.

Fichiers touchés :

- MODIFIER CreditInputs.jsx + CSS : ajouter prop error (string), état bordure + message sous input (**AJUSTÉ : pas de rouge hardcodé**)
  - erreurs de validation “bloquantes” : bordure/texte **C1** (ou variant “danger” conforme)
  - avertissements / incohérences : utiliser **#996600** (warning, déjà accepté gouvernance)
- MODIFIER Credit.jsx : état de chargement skeleton (div animé) au lieu de "Chargement…" texte
- MODIFIER CreditLoanTabs.jsx : améliorer visibilité du "+" pour novices
- MODIFIER CreditV2.css : focus-visible sur tous les éléments interactifs (tabs, boutons, toggles)
- MODIFIER responsive : tester et ajuster 900px et 600px après PR2
- MODIFIER CreditSummaryCard.jsx : responsive — summary au-dessus du formulaire à ≤900px
- MODIFIER CreditPeriodsTable.jsx : scroll horizontal sur mobile

Risques : Faible. Purement UI/CSS. Aucune logique fonctionnelle.

DoD :

- Keyboard navigation complète (Tab, Enter, Space sur tous les contrôles)
- focus-visible visible et cohérent avec gouvernance
- Rendu propre à 1440, 1280, 900, 600px
- Aucune superposition / débordement sur mobile
- npm run check passe

---

## 6) Tests impactés

### 6.1 Tests E2E existants (tests/e2e/credit.spec.ts)

| Test (lignes) | Impact PR1 | Impact PR2 | Impact PR3 |
|---|---:|---:|---:|
| Page load, capital input visible (l.24-31) | ✅ inchangé | ⚠️ si simplifié masque capital → adapter selector | — |
| Fill capital + summary (l.33-43) | ✅ inchangé | ⚠️ data-testid="credit-summary-card" : nouveau KPI à vérifier | — |
| Export menu (l.45-52) | ✅ inchangé | ✅ inchangé | — |
| Excel download (l.54-68) | ✅ inchangé | ✅ inchangé | — |
| Invalid input resilience (l.70-84) | ✅ inchangé | ✅ inchangé | — |

### 6.2 Tests à ajouter (PR2)

credit-modes.spec.ts :

- Test : en mode simplifié, "Type de crédit" non visible
- Test : en mode simplifié, bloc assurance complet non visible
- Test : en mode simplifié, tableau amortissement collapsé par défaut
- Test : en mode expert, tous les champs présents
- Test : en mode expert, tableau amortissement ouvert par défaut
- Test : KPI "mensualité avec assurance" présent et > KPI "hors ass."
- Test : basculer de mode → UI change sans reload

### 6.3 Tests à ajouter (PR3)

- Test keyboard nav : Tab sur formulaire, tous les inputs atteignables
- Test responsive : viewport 375px, pas d'overflow-x sur le body
- Test : état erreur sur input si capital = 0 et blur (si validation ajoutée)

---

## 7) Checklist "Pixel Perfect"

### Typographie

- Page title : 22px, 600, letter-spacing: 0.5px, color: C1 — class .premium-title
- Page subtitle : 12px, 400, color: C9 — class .premium-subtitle
- Section title (card) : 14px, 600, color: C1
- Section label (assurance, lissage) : 11px, 600, uppercase, letter-spacing: 1.5px, color: C9
- Input label : 12px, 500, color: C9
- Table header : 11px, 600, uppercase, letter-spacing: 0.8px, color: C9
- Hint/disclaimer : 11px, italic, color: C9

### Boutons

- Padding : 10px 18px (pas 8px 16px)
- Border-radius : 8px
- Hover : border-color: C2 + box-shadow: 0 2px 8px rgba(0,0,0,0.08) + translateY(-1px)
- Focus-visible : outline: 2px solid C2, outline-offset: 2px
- Disabled : opacity: 0.5; cursor: not-allowed
- Loading state : spinner ou texte "Génération…" + disabled

### Inputs

- Fond : #FFFFFF (gouvernance ✅)
- Border : 1px solid C8
- Border-radius : décision unifiée (6px ou 4px — choisir et appliquer partout)
- Height : 32px
- Focus ring : box-shadow: 0 0 0 3px var(--color-c4) + border-color: C2
- Focus via CSS :focus-visible (pas via Object.assign JS)
- Error state (**AJUSTÉ**) : bordure + message **C1** (erreur) ou `#996600` (warning), jamais “rouge hardcodé”

### Tabs / Underline

- Inactive : color: C9, font-weight: 400
- Active : color: C1, font-weight: 600, border-bottom: 2px solid C2
- Hover : color: C2, background: C7
- Focus-visible sur chaque tab
- aria-current="page" sur tab active ✅ (déjà fait)

### Toggle

- Actif (**AJUSTÉ**) : background **C4** (référence Home) — aligner Crédit sur Home
- Inactif : background: C8
- Knob : #FFFFFF, transition: transform 0.2s
- role="switch", aria-checked ✅ (déjà fait)

### Spacing / Grille

- Page padding : 32px 24px 64px
- Grid gap (form | summary) : 24px
- Card padding : 20px 24px
- Form grid gap : 16px 20px (col row)
- Card border-radius : 12px
- Card border : 1px solid C8
- Card shadow : 0 2px 12px rgba(0,0,0,0.04)

### Couleurs

- Aucune couleur hex/rgb/rgba hardcodée sauf : #FFFFFF, #996600, rgba(0,0,0,0.5) (gouvernance)
- Box-shadow rgba(0,0,0,0.04/0.06/0.08) : accepté (utilitaire shadow, pas couleur design) — à documenter
- rgba(127,176,143,0.1) dans premium-shared.css:190 → à corriger vers token

### Responsive

- 1440px : layout 2 colonnes, sticky summary ✅
- 1280px : layout 2 colonnes, sticky summary ✅
- 900px : 1 colonne, summary static en haut (pas sticky) ✅
- 600px : 1 colonne, form 1 colonne, summary KPI 1 colonne ✅
- Mobile : pas d'overflow-x, tableaux scrollables horizontalement

### Accessibilité

- Navigation clavier complète (Tab, Shift+Tab, Enter, Space)
- Focus-visible visible sur tous les interactifs
- aria-label sur nav tabs ✅ (aria-label="Navigation prêts")
- Inputs : <label> associé via htmlFor (actuellement implicite via composition — vérifier)
- Toggle : role="switch", aria-checked ✅
- Contraste WCAG AA (C2 sur blanc = à vérifier, ratio ≥4.5:1)

### Architecture / Conventions

- Aucune duplication CSS avec premium-shared.css
- CreditInputs.jsx : 0 style inline (tous en classes CSS)
- Object.assign(e.target.style) : 0 occurrence
- SimulatorShell.jsx : utilisé par Credit, prêt pour Placement/IR/PER
- useUserMode() importé dans Credit.jsx
- npm run check passe (lint + typecheck + test + build)

Plan validé pour implémentation — **PR0 + PR1 + PR2 + PR3**. Aucun calcul modifié. Persistance sessionStorage intacte.
