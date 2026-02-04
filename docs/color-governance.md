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

### Exceptions autorisées (liste exhaustive)

#### A) Exceptions Design (2)

| Exception | Valeur | Usage justifié | Fichier référence |
|-----------|--------|----------------|-------------------|
| `WHITE` | `#FFFFFF` | Fonds cards/panels, texte sur fond sombre (C1) | `serenity.ts:783`, `types.ts:34,52` |
| `WARNING` | `#996600` | Warning/alerte — hardcodé car le thème user peut rendre C6 illisible sur certains fonds | `color-governance.md` |

#### B) Primitives techniques tolérées (3)

| Primitive | Valeur | Usage | Condition | Justification |
|-----------|--------|-------|-----------|---------------|
| `OVERLAY` | `rgba(0,0,0,0.5)` | Backdrop modals | Uniquement pour overlays | Seul rgba autorisé — transparence nécessaire pour voir le contenu derrière |
| `DEBUG_RED` | `FF0000` | Debug layout zones | `DEBUG_LAYOUT_ZONES === true` | Couleur de debug uniquement — jamais en production |
| `DEBUG_GREEN` | `00FF00` | Debug layout zones | `DEBUG_LAYOUT_ZONES === true` | Couleur de debug uniquement — jamais en production |
| `DEBUG_BLUE` | `0000FF` | Debug layout zones | `DEBUG_LAYOUT_ZONES === true` | Couleur de debug uniquement — jamais en production |

> **Note** : Les couleurs DEBUG (RGB pur) sont définies dans `serenity.ts:356-358` et utilisées uniquement quand `DEBUG_LAYOUT_ZONES = true`. Elles ne doivent jamais apparaître dans les exports finaux.

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

### Décision produit : Mapping des états sémantiques

> **⚠️ IMPORTANT** : Le mapping `danger = C1` (`#2B3E37` — vert foncé) est un **choix volontaire** de design system adaptable.
>
> **Pourquoi pas de rouge ?**
> - Le thème utilisateur est entièrement personnalisable (cabinet/custom)
> - Un rouge hardcodé casserait la cohérence visuelle sur les thèmes non-rouges
> - C1 garantit un contraste élevé sur les fonds clairs (C7, WHITE)
> - La sémantique "danger" est portée par le contexte (icône, message), pas uniquement par la couleur
>
> **Conséquence** : Les états d'erreur/danger utilisent C1 (brand dark) avec texte WHITE. C'est intentionnel et cohérent avec le thème SER1.
>
> | État | Token | Hex (défaut) | Usage |
> |------|-------|--------------|-------|
> | `danger` | C1 | `#2B3E37` | Alertes erreur, badges danger — fond C1, texte WHITE |
> | `success` | C3 | `#9FBDB2` | Succès, validations — fond C3, texte C10 |
> | `warning` | WARNING | `#996600` | Avertissements — hardcodé pour lisibilité universelle |
> | `info` | C4 | `#CFDED8` | Information — fond C4, texte C10 |

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

**Helper de décision (pseudo-code copiable)** :
```typescript
/**
 * Choix de la couleur de texte selon le fond (WCAG AA compliant)
 * @param bgColor - Couleur de fond en hex (#RRGGBB)
 * @param darkColor - Couleur sombre à utiliser si fond clair (défaut: C10)
 * @param lightColor - Couleur claire à utiliser si fond sombre (défaut: WHITE)
 * @returns Couleur de texte adaptée
 */
function pickTextColorForBackground(
  bgColor: string,
  darkColor: string = '#000000',
  lightColor: string = '#FFFFFF'
): string {
  const luminance = getLuminance(bgColor);
  // Seuil 0.5 = fond moyen
  // Luminance > 0.5 = fond clair → texte sombre
  // Luminance ≤ 0.5 = fond sombre → texte clair
  return luminance > 0.5 ? darkColor : lightColor;
}

/** 
 * Calcule la luminance relative d'une couleur (WCAG formula)
 */
function getLuminance(hexColor: string): number {
  const rgb = hexColor.replace('#', '').match(/.{2}/g)?.map(c => {
    const v = parseInt(c, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }) || [0, 0, 0];
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}
```

### Règles spécifiques Excel

| Élément | Fond | Texte | Contrôle obligatoire |
|---------|------|-------|---------------------|
| **Header** | C2 (headerFill) | Calculé via `pickTextColorForBackground(headerFill)` | Si C2 clair → texte C10, sinon WHITE |
| **Section** | C4 (sectionFill) | C10 (toujours sombre sur C4 clair) | Pas de calcul nécessaire |
| **Zebra odd** | C7 | C10 | — |
| **Zebra even** | WHITE | C10 | — |

> **⚠️ Règle absolue** : L'export Excel NE DOIT PLUS forcer le texte header en blanc (`FFFFFFFF` hardcodé). Il doit utiliser `pickTextColorForBackground()` pour garantir la lisibilité quel que soit le thème.

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
// Mapping imposé avec helper de contraste
const excelColors = {
  headerFill: c2,      // Header = Primary
  headerText: pickTextColorForBackground(c2),  // Calculé selon C2
  sectionFill: c4,     // Sections = Accent light
  sectionText: c10,    // Texte noir (C4 toujours clair)
  border: c8,          // Bordures
  zebraOdd: c7,        // Lignes impaires
  zebraEven: WHITE,    // Lignes paires
  warningFill: '#FFF7E6',
  warningText: WARNING,
};

// Helper à implémenter dans xlsxBuilder.ts
function getExcelHeaderTextColor(headerFill: string): string {
  // Si C2 est clair (luminance > 0.5), utiliser C10 (noir)
  // Sinon utiliser WHITE pour contraste
  return pickTextColorForBackground(headerFill, '#000000', '#FFFFFF');
}
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

- [ ] **Headers** : C2 fill — texte calculé via `pickTextColorForBackground(C2)`
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
5. **Excel header** : C2 fill — texte calculé via `pickTextColorForBackground()` (plus de WHITE hardcodé)

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

## Annexe A — Usage réel des tokens C1..C10 (UI + PPTX)

### Source de vérité des tokens

| Source | Fichier | Lignes | Valeurs C1-C10 |
|--------|---------|--------|----------------|
| `DEFAULT_THEME` | `src/settings/theme.ts` | 21-34 | C1:#2B3E37, C2:#709B8B, C3:#9FBDB2, C4:#CFDED8, C5:#788781, C6:#CEC1B6, C7:#F5F3F0, C8:#D9D9D9, C9:#7F7F7F, C10:#000000 |
| `DEFAULT_COLORS` | `src/settings/ThemeProvider.tsx` | 175-186 | Mêmes valeurs |
| Variables CSS | `src/styles.css` | 7-16 | Mêmes valeurs |
| `SER1_CLASSIC_COLORS` | `src/pptx/theme/resolvePptxColors.ts` | 15-26 | Mêmes valeurs (fallback PPTX) |

**Problème détecté** : Doublon de définition — 4 sources potentiellement divergentes.

---

### Tableau C1..C10 — usage réel (AUJOURD'HUI)

| Token | Hex | UI : usages observés (catégories) | UI : preuves (fichier:ligne) | PPTX : usages observés | PPTX : preuves (fichier:ligne) | Incohérences / risques |
|-------|-----|-----------------------------------|------------------------------|------------------------|------------------------------|------------------------|
| **C1** | #2B3E37 | Titres H1/H2, headers de section, couvertures, borders-bottom forts, status-values, boutons primaires, erreurs | `premium-shared.css:13` (color: var(--color-c1)), `SignalementsBlock.css:42` (error color), `Placement.css:88` (tab active), `SettingsComptes.css:49` (btn bg) | bgMain (cover slide), textMain (titres), danger (erreurs), shadowBase | `auditPptx.ts:47` (cover bg c1), `auditPptx.ts:58` (slide background), `strategyPptx.ts:44` (cover), `resolvePptxColors.ts:75` (bgMain) | **Incohérence** : Utilisé tantôt pour fond (cover C1), tantôt pour texte (titres). Risque contraste si thème user a C1 très clair |
| **C2** | #709B8B | Liens, hover states, focus inputs, accents visuels, badges admin, titres tableaux, boutons primaires | `premium-shared.css:83,154` (hover, btn-primary), `styles.css:136` (border focus), `Placement.css:83` (hover), `SettingsComptes.css:151` (badge admin), `SignalementsBlock.css:117` (alert-success) | accent (lignes décoratives), success states | `resolvePptxColors.ts:76` (accent), `getPptxThemeFromUiSettings.ts:158` (adaptive accent) | **Gap Excel** : Fallback `#2F4A6D` dans xlsxBuilder ≠ C2. Incohérence visuelle exports Excel |
| **C3** | #9FBDB2 | Hover secondaire, états success, accents légers, focus doux, stepper active | `Placement.css:113` (step is-active border), `styles.css:30` (success-bg via alias) | Gradient TMI brackets (C4→C2), pas d'usage isolé direct | `buildIrSynthesis.ts` (gradient avec C4, C2) | **Sous-utilisé** : Pas de mapping sémantique `success` clair. Devrait être le token succès |
| **C4** | #CFDED8 | Fonds actifs, surfaces surélevées, hover rows, sections info, zebra rows, alertes succès | `premium-shared.css:50,63,77` (premium-card, table), `SettingsFiscalites.css:17,31` (bg banner/table), `SignalementsBlock.css:189` (status-new bg) | bgAccent, info states, gradient TMI | `auditPptx.ts:49` (sous-titre cover c4), `strategyPptx.ts:46`, `resolvePptxColors.ts:84` (bgAccent) | **OK** : Usage cohérent "fond léger accent" UI et PPTX |
| **C5** | #788781 | Bordures fortes, icônes secondaires, séparateurs accentués, stepper borders | `Credit.css:22` (border-bottom via --beige), `Ir.css:18` (border-bottom), `Placement.css:104` (step border) | Pas de mapping sémantique dédié dans PPTX roles | — | **Gap** : C5 présent dans CSS legacy (`--beige` alias) mais pas exploité dans PPTX roles |
| **C6** | #CEC1B6 | Séparateurs chauds, lignes d'accent, borders doux, headers tableaux, accents décoratifs | `Credit.css:22` (border-bottom beige), `Ir.css:18` (border-bottom), `SettingsComptes.css:122` (table header bg), `Placement.css:149` (alert-warning bg) | accent (lignes décoratives, corner marks), footerAccent | `resolvePptxColors.ts:76` (accent), `types.ts:49,64` (accent, footerAccent), `buildCover.ts` (addAccentLine) | **Incohérence UI/PPTX** : UI utilise C6 pour bordures/table headers, PPTX pour accent lines. Sémantique différente mais OK |
| **C7** | #F5F3F0 | Fond de page, backgrounds inputs, cards, bannières, KPIs, surfaces générales, formulaires | `premium-shared.css:50,63` (premium-card bg), `SettingsFiscalites.css:17` (banner bg), `SignalementsBlock.css:108,115` (alert bg), `Placement.css:105,178` (step bg, input bg) | textOnMain (texte sur C1), bgLight, surfaces | `auditPptx.ts:50` (var locale c7), `resolvePptxColors.ts:79` (textOnMain), `types.ts:40` (textOnMain) | **Incohérence majeure** : C7 théoriquement "surface page" mais souvent remplacé par `#fff` hardcodé en UI (Credit.css, Home.css, Ir.css) |
| **C8** | #D9D9D9 | Bordures standards, inputs, dividers, séparateurs de section, table borders | `premium-shared.css:51,64,82,100` (borders), `SettingsFiscalites.css:10,38` (borders), `Placement.css:65` (tab border), `SignalementsBlock.css:109,116,152` (alert borders) | panelBorder, borderLight | `resolvePptxColors.ts:80,85` (panelBorder, borderLight), `types.ts:55` (panelBorder) | **OK** : Usage cohérent "border default" partout |
| **C9** | #7F7F7F | Texte secondaire, labels, meta info, subtitles, chevrons, textes muted | `premium-shared.css:20,29,36,92` (subtitles, labels, table headers), `Placement.css:54,135,195` (subtitle, hint, unit), `Home.css:40` (status-label) | textBody (contenu secondaire) | `resolvePptxColors.ts:78` (textBody), `types.ts:46` (textBody) | **OK** : Usage cohérent "text muted" |
| **C10** | #000000 | Texte principal, titres, labels forts, contenu dense, valeurs | `premium-shared.css:110` (table td), `SettingsComptes.css:11` (h2), `SettingsFiscalites.css:108` (block title), `SignalementsBlock.css:173` (report-title) | textMain (titres sur fond clair), textBody, footerOnLight | `auditPptx.ts:51` (var locale c10), `resolvePptxColors.ts:77` (textMain), `types.ts:43,61` (textMain, footerOnLight) | **OK** : Usage cohérent "text primary" |

---

### Couleurs hardcodées détectées (UI + PPTX)

| Couleur | Contexte | Occurrences | Fichiers (lignes) | Remplacer par | Statut |
|---------|----------|-------------|-------------------|---------------|--------|
| `#FFFFFF` | Cards, panels, fonds élevés, texte sur fond sombre | ~50+ | `Credit.css:44`, `Home.css:20`, `Ir.css:32`, `SignalementsBlock.css:125,154` | `surface-card` (WHITE exception autorisée) | **Exception validée** |
| `#996600` | Warning/alerte texte (audit PPTX) | 1 | `auditPptx.ts:310` | WARNING hardcodé | **Exception validée** |
| `#666666` | Disclaimer texte (audit PPTX) | 1 | `auditPptx.ts:368` | C9 (textBody) | **À corriger** |
| `#222` | Titres hardcodés | 2 | `Credit.css:29`, `Ir.css:24` | C10 (textMain) | **À corriger** |
| `#2b3e37` | Titres brand hardcodés | 3 | `Credit.css:21`, `Ir.css:17` | C1 (bgMain) | **À corriger** |
| `rgba(0,0,0,0.5)` | Overlays modals | 5 | `styles.css`, `Placement.css` | surface-overlay (rgba autorisé) | **Exception validée** |
| `rgba(0,0,0,0.12)` | Shadows | 4 | `Credit.css`, `Ir.css`, `premium-shared.css:54` | shadowBase via token | **À tokeniser** |
| `rgba(0,0,0,0.04-0.08)` | Shadows divers | 6+ | `premium-shared.css:55,67,150,154` | shadowBase dérivé | **À tokeniser** |
| `#2F4A6D` | Fallback Excel header | 1 | `xlsxBuilder.ts:40` (fallback) | C2 (primary) | **À corriger** |
| `#E5EAF2` | Fallback Excel section | 1 | `xlsxBuilder.ts:182` (fallback) | C4 (accent light) | **À corriger** |
| `DEFAULT_PPTX_THEME` | Hardcodé PPTX fallback | 5 valeurs | `pptxTheme.ts:54-60` | SER1_CLASSIC_COLORS | **À corriger** |

---

### Tableau TOP 15 Incohérences

| # | Problème | Impact | Où (fichiers:ligne) | Correction recommandée | Priorité |
|---|----------|--------|---------------------|------------------------|----------|
| 1 | **Excel fallback `#2F4A6D` ≠ C2** | Headers Excel incohérents avec thème UI | `xlsxBuilder.ts:40` | Supprimer fallback, forcer passage explicite de C2 | P0 |
| 2 | **Cards UI utilisent `#fff` au lieu de C7** | Divergence UI/PPTX surfaces | `Credit.css:44`, `Home.css:20`, `Ir.css:32` | Créer token `surface-card` = WHITE, migrer progressivement | P1 |
| 3 | **`#666666` hardcodé dans PPTX** | Disclaimer non thémable | `auditPptx.ts:368` | Remplacer par C9 (textBody) | P0 |
| 4 | **`#222` hardcodé pour titres** | Titres non thémables | `Credit.css:29`, `Ir.css:24` | Remplacer par C10 (textMain) | P0 |
| 5 | **`#2b3e37` hardcodé (brand)** | Titres brand non thémables | `Credit.css:21`, `Ir.css:17` | Remplacer par C1 (bgMain) | P0 |
| 6 | **Shadows hardcodés rgba** | Non thémables, incohérents | `premium-shared.css:54,55,67`, `Placement.css` | Créer token `--shadow-sm/md/lg` dérivé de C10 | P1 |
| 7 | **C3 sous-utilisé / pas de mapping success** | Token C3 inexploité | `styles.css:30` (alias uniquement) | Créer mapping sémantique `success → C3` | P1 |
| 8 | **C5 non mappé dans PPTX roles** | Couleur C5 inexistante exports | — | Ajouter C5 aux rôles PPTX (accent2?) ou documenter exclusion | P2 |
| 9 | **`DEFAULT_PPTX_THEME` hardcodé** | Fallback PPTX divergent | `pptxTheme.ts:54-60` | Remplacer par référence à `SER1_CLASSIC_COLORS` | P1 |
| 10 | **4 sources de vérité C1-C10** | Risque de divergence | `theme.ts`, `ThemeProvider.tsx`, `styles.css`, `resolvePptxColors.ts` | Centraliser dans module unique exporté | P1 |
| 11 | **Texte blanc hardcodé sur C2** | Si C2 clair → texte illisible | `SignalementsBlock.css:125` | Utiliser helper `pickTextColorForBackground(C2)` | P1 |
| 12 | **Input background `#fff` hardcodé** | Incohérence avec thème | `premium-shared.css:183` | Remplacer par C7 ou surface-card | P2 |
| 13 | **C7 utilisé comme texte (textOnMain)** | Ambiguïté rôle C7 | `resolvePptxColors.ts:79` | Documenter: C7 = surface, pas texte. Utiliser C10+C luminance | P2 |
| 14 | **Pas de helper contraste PPTX** | Risque texte illisible selon thème | — | Implémenter `getPptxTextForBackground(bgColor)` | P1 |
| 15 | **Excel section fallback `#E5EAF2`** | Couleur sections Excel non thémable | `xlsxBuilder.ts:182` | Supprimer fallback, mapper vers C4 | P0 |

---

### Plan de Mise à Jour (Phasé)

#### Phase 0 — Quick Wins (P0) — 1-2 jours

| Tâche | Fichiers | Action | Validation |
|-------|----------|--------|------------|
| 0.1 | `xlsxBuilder.ts:40` | Supprimer fallback `#2F4A6D`, rendre headerFill obligatoire | Export Excel avec header coloré selon thème |
| 0.2 | `xlsxBuilder.ts:182` | Supprimer fallback `#E5EAF2`, rendre sectionFill obligatoire | Sections Excel avec C4 |
| 0.3 | `auditPptx.ts:368` | Remplacer `#666666` par `c9` | Disclaimer en C9 |
| 0.4 | `Credit.css:29`, `Ir.css:24` | Remplacer `#222` par `var(--color-c10)` | Titres en C10 |
| 0.5 | `Credit.css:21`, `Ir.css:17` | Remplacer `#2b3e37` par `var(--color-c1)` | Titres brand en C1 |

**Livrable** : PR #0 — Nettoyage hardcodes visibles

---

#### Phase 1 — Fondations (P1) — 2-3 jours

| Tâche | Fichiers | Action | Validation |
|-------|----------|--------|------------|
| 1.1 | Créer `src/styles/semanticColors.ts` | Module core avec `getSemanticColors()`, `WHITE`, `WARNING`, helpers contraste | Tests unitaires helpers |
| 1.2 | Créer `src/pptx/theme/semanticColors.ts` | Version PPTX avec `getPptxSemanticColors()`, `getPptxTextForBackground()` | Tests PPTX contraste |
| 1.3 | `src/styles.css` | Ajouter variables CSS sémantiques (`--surface-page`, `--text-primary`, etc.) | Variables présentes dans DOM |
| 1.4 | `src/settings/theme.ts` | Centraliser DEFAULT_THEME, exporter pour tous les consommateurs | Un seul point de vérité |
| 1.5 | `pptxTheme.ts:54-60` | Remplacer DEFAULT_PPTX_THEME par référence SER1_CLASSIC_COLORS | Fallback PPTX cohérent |

**Livrable** : PR #1 — Infrastructure sémantique

---

#### Phase 2 — Composants Tokenisés (P1) — 3-4 jours

| Tâche | Composant | Action | Validation |
|-------|-----------|--------|------------|
| 2.1 | `Button` | Standardiser variants: `primary` (C2), `secondary` (C7), `ghost`. Ajouter helper contraste | BTN primary lisible sur tous thèmes |
| 2.2 | `Card` | Fond `surface-card` (WHITE), border `border-default` (C8) | Cards cohérentes UI/PPTX |
| 2.3 | `Table` | Header C2/texte adaptatif, rows C7/WHITE zebra, borders C8 | Tables avec thème user |
| 2.4 | `Badge` | Variants: `success` (C3), `warning` (WARNING), `danger` (C1), `info` (C4) | Badges thémables |
| 2.5 | `Alert` | Variants avec tokens sémantiques + helper contraste | Alertes lisibles |

**Livrable** : PR #2 — Bibliothèque de composants tokenisés

---

#### Phase 3 — Pages + PPTX (P1/P2) — 3-4 jours

| Tâche | Pages/Slides | Action | Validation |
|-------|--------------|--------|------------|
| 3.1 | `Credit.css`, `Ir.css`, `Placement.css` | Migrer vers composants tokenisés, remplacer hardcodes | Pas de régression visuelle |
| 3.2 | `Home.css` | Cards `status-card` → composant Card tokenisé | Cards utilisent surface-card |
| 3.3 | `Login.css` | Alerts → composant Alert tokenisé | Alerts avec WARNING si besoin |
| 3.4 | `buildCover.ts` | Utiliser `getPptxSemanticColors()` | Cover avec rôles sémantiques |
| 3.5 | `buildIrSynthesis.ts`, `buildCreditSynthesis.ts` | Utiliser tokens sémantiques PPTX | Slides IR/Crédit cohérents |
| 3.6 | `auditPptx.ts`, `strategyPptx.ts` | Remplacer variables locales `c1, c2...` par appel `getPptxSemanticColors()` | Pas de régression PPTX |

**Livrable** : PR #3 — Migration pages et slides PPTX

---

#### Phase 4 — Excel + Validation (P0/P1) — 2-3 jours

| Tâche | Fichiers | Action | Validation |
|-------|----------|--------|------------|
| 4.1 | `xlsxBuilder.ts` | Supprimer tous fallbacks hardcodés | Tests exports Excel échouent si couleurs manquantes |
| 4.2 | Créer `getExcelColorsFromTheme()` | Mapper: C2→headerFill, C4→sectionFill, C10→texte | Helper testé |
| 4.3 | Tous appelants `buildXlsxBlob` | Passer couleurs explicitement via helper | Excel avec thème user |
| 4.4 | Tests visuels | Vérifier cohérence UI/PPTX/Excel sur 3 thèmes (dark, light, classic) | Validation manuelle |

**Livrable** : PR #4 — Excel aligné + tests validation

---

### Stratégie de Gouvernance

#### Où vit la vérité ?

**Une seule source de vérité** : `src/settings/theme.ts`
- `DEFAULT_THEME` exporté et réutilisé par :
  - `ThemeProvider.tsx` (import, pas redéfinition)
  - `styles.css` (variables CSS synchronisées au runtime)
  - `resolvePptxColors.ts` (SER1_CLASSIC_COLORS importe DEFAULT_THEME)

#### Comment éviter les régressions ?

1. **Lint rule** : Interdire les hex hardcodés (sauf WHITE et WARNING)
2. **Tests unitaires** : Vérifier que tous les exports (PPTX/Excel) utilisent les couleurs du thème
3. **Visual regression tests** : Comparer screenshots avant/après sur 3 thèmes
4. **Code review checklist** :
   - [ ] Pas de `#RRGGBB` dans le code (sauf exceptions validées)
   - [ ] Pas de `colors.cX` direct dans PPTX (utiliser rôles sémantiques)
   - [ ] Helper contraste utilisé pour texte sur fond coloré

---

*Annexe A — Version 3.0 — Fusionnée avec color-governance-annexe-a.md — 2026-02-04*
