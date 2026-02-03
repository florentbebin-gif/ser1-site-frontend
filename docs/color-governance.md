# Gouvernance Couleurs SER1

## Décision (5 lignes)

**Option choisie : B — Tokens C1-C10 + 2 exceptions (blanc + warning hardcodé)**

Rationale : Le thème utilisateur est entièrement personnalisable (cabinet/custom), donc aucun token C1-C10 ne garantit un contraste lisible pour les états critiques (warning). Seul un warning hardcodé (#996600) assure la lisibilité universelle. Le blanc (#FFFFFF) reste l'exception unique pour les fonds élevés (cards, panels).

---

## Architecture Tokens

### Base (C1-C10)

| Token | Hex défaut | Rôle sémantique | Usage |
|-------|------------|-----------------|-------|
| C1 | `#2B3E37` | Brand dark | Titres principaux, fond cover |
| C2 | `#709B8B` | Brand primary | CTA, liens, header Excel |
| C3 | `#9FBDB2` | Brand light | Hover, badges info, success light |
| C4 | `#CFDED8` | Brand faint | Fonds actifs, accent backgrounds |
| C5 | `#788781` | Neutral medium | Bordures, icônes secondaires |
| C6 | `#CEC1B6` | Warm accent | Séparateurs, lignes accent |
| C7 | `#F5F3F0` | Surface page | Fond page, inputs |
| C8 | `#D9D9D9` | Border light | Bordures légères, dividers |
| C9 | `#7F7F7F` | Text muted | Texte secondaire, labels |
| C10 | `#000000` | Text primary | Texte principal, titres |

### Exceptions (2 seulement)

| Exception | Valeur | Usage justifié |
|-----------|--------|----------------|
| `WHITE` | `#FFFFFF` | Fonds cards/panels, texte sur fond sombre (C1) |
| `WARNING` | `#996600` | Warning/alerte — hardcodé car le thème user peut rendre C6 illisible sur certains fonds |

### Dérivations sémantiques (calculées depuis C1-C10)

| Sémantique | Formule | Usage |
|------------|---------|-------|
| `surface-page` | C7 | Fond de page |
| `surface-card` | WHITE | Cards, panels, modals |
| `surface-raised` | C4 | Surfaces surélevées, hover léger |
| `surface-overlay` | `rgba(0,0,0,0.5)` | Backdrop modals (seul rgba autorisé) |
| `text-primary` | C10 | Texte principal |
| `text-secondary` | C9 | Labels, texte muted |
| `text-inverse` | WHITE | Texte sur fond C1 ou sombre |
| `border-default` | C8 | Bordures standards |
| `border-strong` | C5 | Bordures accentuées |
| `accent-line` | C6 | Lignes d'accent PPTX |
| `success` | C2 | Succès (green theme) |
| `danger` | C1 | Erreur (dark red/green theme) |
| `warning` | WARNING | Avertissement (hardcodé) |
| `info` | C4 | Information (light accent) |

---

## Règles de Combinaison & Contraste

### Tableau "Type de fond → Couleur texte autorisée"

| Fond | Couleur fond | Texte autorisé | Interdit |
|------|--------------|----------------|----------|
| **Page** | C7 (#F5F3F0) | C10 (noir), C9 (gris) | WHITE — manque de contraste |
| **Card/Panel** | WHITE | C10 (noir), C9 (gris), C1 (brand) | WHITE — invisible |
| **Cover Slide** | C1 (#2B3E37) | WHITE uniquement | C10, C9 — manque de contraste |
| **Header table** | C2 (#709B8B) | WHITE uniquement | C10 — manque de contraste |
| **Alert danger** | C1/C2 foncé | WHITE | C10 — illisible |
| **Alert warning** | #FFF7E6 | WARNING (#996600), C10 | C9 — manque de contraste |
| **Alert success** | C4 (#CFDED8) | C10, C1 | C9 si fond très clair |
| **Hover row** | C4 léger | C10, C9 | — |
| **Zebra row** | C7/C4 alternance | C10, C9 | — |

### Tableau "Composant → Règles"

| Composant | Fond | Texte | Bordure | Remarque |
|-----------|------|-------|---------|----------|
| **Button primary** | C2 | WHITE | — | Si C2 très clair → texte C10 |
| **Button secondary** | C7 | C10 | C8 | — |
| **Button ghost** | transparent | C2 | C2 | Hover : fond C4 |
| **Input default** | WHITE | C10 | C8 | Focus : border C2 |
| **Input disabled** | C7 | C9 | C8 | — |
| **Badge info** | C4 | C10 | — | — |
| **Badge success** | C3 | C10 | — | — |
| **Badge warning** | #FFF7E6 | WARNING | WARNING | Hardcodé pour contraste |
| **Badge danger** | C1 | WHITE | — | — |
| **Alert warning** | #FFF7E6 | WARNING | WARNING/10 | Hardcodé |
| **Table header** | C2 | WHITE | — | Excel : même mapping |
| **Table row zebra** | C7 / WHITE | C10 | — | Alternance |
| **Modal overlay** | rgba(0,0,0,0.5) | — | — | Seul rgba autorisé |
| **Modal panel** | WHITE | C10 | — | — |
| **Tooltip** | C1 | WHITE | — | — |

### Seuils WCAG (AA minimum)

| Contexte | Ratio minimum | Exemple valide |
|----------|---------------|----------------|
| Texte normal | 4.5:1 | C10 sur C7 (12:1) ✓ |
| Texte grand (>18pt) | 3:1 | WHITE sur C2 (4.5:1) ✓ |
| UI components | 3:1 | C2 sur WHITE (2.8:1) ⚠️ → C1 sur WHITE |

**Helper de décision** :
```typescript
function pickTextColorForBackground(bgColor: string): string {
  const luminance = getLuminance(bgColor);
  // Seuil 0.5 pour décision claire
  return luminance > 0.5 ? C10 : WHITE;
}
```

---

## Application par plateforme

### UI (React/CSS)

```css
/* Variables CSS à définir dans :root */
--color-white: #FFFFFF;
--color-warning: #996600;
--color-surface-page: var(--color-c7);
--color-surface-card: var(--color-white);
--color-text-primary: var(--color-c10);
--color-text-inverse: var(--color-white);
--color-border-default: var(--color-c8);
--color-accent-line: var(--color-c6);
```

### PPTX

```typescript
// Rôles thématiques validés
const pptxRoles = {
  bgMain: c1,        // Cover slide
  textOnMain: WHITE, // Sur C1
  textMain: c10,     // Titres
  textBody: c9,      // Contenu
  accent: c6,        // Lignes accent
  panelBg: WHITE,    // Cards/panels
  panelBorder: c8,   // Bordures
  warning: WARNING,  // ⚠️ hardcodé
  danger: c1,        // Erreurs
  success: c2,       // Succès
};
```

### Excel

```typescript
// Mapping imposé
const excelColors = {
  headerFill: c2,      // Header = Primary
  headerText: WHITE,   // Contraste forcé
  sectionFill: c4,     // Sections = Accent light
  sectionText: c10,    // Texte noir
  border: c8,          // Bordures
  zebraOdd: c7,        // Lignes impaires
  zebraEven: WHITE,    // Lignes paires
  warningFill: '#FFF7E6',
  warningText: WARNING,
};
```

---

## Checklist Validation

### UI

- [ ] **Titres** : C1 ou C10 — jamais sur fond clair sans contraste
- [ ] **Cards** : fond WHITE — texte C10 ou C9
- [ ] **Tables** : header C2/texte WHITE — rows C7/WHITE alternance
- [ ] **CTA** : C2 fond — WHITE texte (ou C10 si C2 clair)
- [ ] **Modals** : overlay rgba(0,0,0,0.5) — panel WHITE
- [ ] **Alerts** : warning hardcodé #996600 — danger C1/white
- [ ] **Inputs** : border C8 — focus C2

### PPTX

- [ ] **Cover** : fond C1 — texte WHITE
- [ ] **Titres slides** : C10 sur fond WHITE
- [ ] **Tableaux** : header C2/texte WHITE — rows C7/WHITE
- [ ] **Encarts** : fond C4 — texte C10
- [ ] **Warnings** : WARNING hardcodé
- [ ] **Accent lines** : C6

### Excel

- [ ] **Headers** : C2 fill — WHITE texte (toujours)
- [ ] **Sections** : C4 fill — C10 texte
- [ ] **Zebra** : C7 / WHITE alternance
- [ ] **Alertes** : warning hardcodé
- [ ] **Bordures** : C8 ou none

---

## Règles absolues (non négociables)

1. **Aucun texte WHITE sur fond C7** (C7 = #F5F3F0, trop clair)
2. **Aucun texte C10 sur fond C1** sans vérification — utiliser WHITE
3. **Warning obligatoirement WARNING (#996600)** — pas de fallback C6
4. **Seul rgba autorisé** : `rgba(0,0,0,0.5)` pour overlays
5. **Excel header** : C2 + WHITE texte — toujours

---

## Fichiers à modifier (implémentation minimale)

### Créer

- `src/styles/semanticColors.ts` — mapping sémantique + helper contraste
- `src/pptx/theme/semanticColors.ts` — version PPTX des rôles

### Modifier

- `src/styles.css` — ajouter variables sémantiques
- `src/utils/xlsxBuilder.ts` — supprimer fallbacks hardcodés, utiliser mapping
- `src/pptx/theme/pptxTheme.ts` — remplacer DEFAULT_PPTX_THEME par SER1_CLASSIC_COLORS
- `src/pptx/auditPptx.ts` — remplacer 996600 par WARNING, 666666 par c9

---

*Document de référence — Version 1.0 — 2026-02-03*
