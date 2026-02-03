# Audit du Système de Couleurs SER1

## Résumé (10 lignes)

**Incohérences majeures détectées :**
1. **Doublon de définition** : Les tokens C1-C10 sont définis à 3 endroits (`theme.ts`, `ThemeProvider.tsx`, `styles.css`) avec risque de divergence
2. **Couleurs hardcodées** : 307+ occurrences de hex codes dans 32 fichiers, dont 60 dans `Settings.jsx` seul
3. **Blancs inconsistants** : `#FFFFFF`, `#fff`, `white`, `rgba(255,255,255,x)` utilisés de manière anarchique
4. **Alertes/États non tokenisés** : Couleurs d'erreur (`#b00020`), warning (`#fff7e6`, `#e5c07b`) hardcodées
5. **Alias legacy** : `--green`, `--beige`, `--bg` coexistent avec `--color-cX` (maintenir ou nettoyer ?)

---

## A) INVENTAIRE DES TOKENS C1-C10

### Source de vérité (fichiers de définition)

| Fichier | Lignes | Format | Usage |
|---------|--------|--------|-------|
| `src/settings/theme.ts` | 21-33 | Objet TS `DEFAULT_THEME` | Fallback + sauvegarde localStorage |
| `src/settings/ThemeProvider.tsx` | 175-186 | `DEFAULT_COLORS` | Runtime React + cache |
| `src/styles.css` | 5-16 | Variables CSS `--color-c1..c10` | Application globale |

### Valeurs par défaut (SER1 Classic)

| Token | Hex | Usage sémantique (documenté) | Contraste WCAG |
|-------|-----|------------------------------|----------------|
| C1 | `#2B3E37` | Primary dark (titres, accents) | AAA sur fond clair |
| C2 | `#709B8B` | Primary medium (CTA, liens) | AA sur fond clair |
| C3 | `#9FBDB2` | Primary light (hover, badges) | AA sur fond foncé |
| C4 | `#CFDED8` | Primary very light (fonds actifs) | ❌ Mauvais contraste texte |
| C5 | `#788781` | Neutral medium (bordures) | AA sur fond clair |
| C6 | `#CEC1B6` | Warm neutral (séparateurs) | ❌ Mauvais contraste texte |
| C7 | `#F5F3F0` | Background light (fonds page) | - |
| C8 | `#D9D9D9` | Border/separator | - |
| C9 | `#7F7F7F` | Text secondary | AA sur fond clair |
| C10 | `#000000` | Text primary | AAA sur fond clair |

---

## B) CARTOGRAPHIE D'USAGE

### Tableau "Catégorie UI → Couleurs observées"

| Catégorie | Tokens utilisés | Couleurs hardcodées | Fichiers principaux |
|-----------|-----------------|---------------------|---------------------|
| **Titres H1/H2** | C1, C10 | `#222`, `#2b3e37` | `Credit.css`, `Ir.css` |
| **Texte body** | C9, C10 | - | Global |
| **Liens** | C2 | - | `Placement.css`, `styles.css` |
| **Fonds page** | C7 | `#fff`, `#ffffffee` | `Login.css`, `Home.css` |
| **Fonds cards** | C7 | `#FFFFFF`, `#fff` | `styles.css`, `Credit.css` |
| **Bordures** | C8, C3 | `transparent` | Tous les CSS |
| **Séparateurs** | C6 | - | `Ir.css`, `Credit.css` |
| **Entêtes tableaux** | C7 | - | `Placement.css`, `Credit.css` |
| **Lignes zebra** | C7 (hover) | `rgba(43,90,82,0.03)` | `Credit.css` |
| **CTA Primaire** | C2, C1 | - | `styles.css`, `Login.css` |
| **CTA Secondaire** | C7, C8 | `rgba(255,255,255,0.6)` | `styles.css` |
| **Badges/Tags** | C4, C2, C5 | `#fff` | `Placement.css` |
| **États Success** | C3, C4 | `#f0f9f0` | `styles.css`, `Login.css` |
| **États Error** | C6 (toast) | `#b00020`, `#fff3f3` | `Ir.css`, `Login.css` |
| **États Warning** | C6 | `#fff7e6`, `#e5c07b` | `Credit.css` |
| **Inputs border** | C8 | - | Global |
| **Inputs focus** | C2 | `rgba(61,122,111,0.12)` | `Placement.css`, `Credit.css` |
| **Modal overlay** | - | `rgba(0,0,0,0.5)`, `rgba(0,0,0,0.6)` | `styles.css`, `Placement.css` |
| **Topbar/Navbar** | C1 (brand), C7 (bg) | - | `styles.css`, `TopBar.css` |
| **Shadows** | C9 | `rgba(0,0,0,x)` | Multiple |

### Tableau "Token → Où utilisé"

| Token | Nb occurrences* | Fichiers principaux |
|-------|-----------------|---------------------|
| C1 | ~200 | `Placement.css`, `Settings.jsx`, `ThemeProvider.tsx` |
| C2 | ~180 | `Placement.css`, `styles.css`, `Credit.css` |
| C3 | ~120 | `styles.css`, `Home.css`, `Placement.css` |
| C4 | ~90 | `styles.css`, `Placement.css`, `Ir.css` |
| C5 | ~80 | `Placement.css`, `styles.css` |
| C6 | ~70 | `styles.css`, `Placement.css`, `Credit.css` |
| C7 | ~150 | `styles.css`, `Credit.css`, `Placement.css` |
| C8 | ~180 | `styles.css`, `Credit.css`, `Ir.css` |
| C9 | ~100 | `styles.css`, `Home.css`, `Credit.css` |
| C10 | ~90 | `styles.css`, `Settings.jsx` |

*Approximation basée sur `grep -o`

### Couleurs NON-TOKENS détectées

| Couleur | Type | Nb occ. | Fichiers | Recommandation |
|---------|------|---------|----------|----------------|
| `#FFFFFF` / `#fff` / `white` | Hex | ~50 | `styles.css`, `Credit.css`, `Home.css` | Remplacer par `C7` ou token "surface" |
| `#222` | Hex | 2 | `Credit.css`, `Ir.css` | Remplacer par `C10` |
| `#2b3e37` | Hex | 3 | `Credit.css`, `Ir.css` | Remplacer par `C1` |
| `rgba(0,0,0,0.5)` | RGBA | 5 | `styles.css`, `Placement.css` | Créer token `--overlay` |
| `rgba(255,255,255,0.6)` | RGBA | 4 | `styles.css` | Créer token `--surface-glass` |
| `#b00020` | Hex | 2 | `Ir.css`, `Login.css` | Créer token semantic `--color-danger` |
| `#fff3f3` | Hex | 1 | `Login.css` | Utiliser `C6` ou token semantic |
| `#fff7e6` / `#e5c07b` | Hex | 2 | `Credit.css` | Créer token semantic `--color-warning` |
| `#f0f9f0` | Hex | 1 | `Login.css` | Utiliser `C4` ou token semantic |

---

## C) CONVENTION PROPOSÉE

### Palette sémantique (mapping C1-C10)

| Sémantique | Token | Usage |
|------------|-------|-------|
| **Primary** | C2 | Boutons primaires, liens, accents |
| **Primary-Dark** | C1 | Titres, hover primaire, header brand |
| **Primary-Light** | C3 | Hover secondaire, badges info |
| **Surface** | C7 | Fonds de page, inputs |
| **Surface-Raised** | `#FFFFFF` | Cards, modals (à tokeniser en C11?) |
| **Border** | C8 | Bordures par défaut |
| **Border-Strong** | C5 | Bordures accentuées |
| **Text-Primary** | C10 | Texte principal |
| **Text-Secondary** | C9 | Texte muted, labels |
| **Accent-Warm** | C6 | Séparateurs, accents chauds |
| **Danger** | ❌ NEW | Erreurs, alertes critiques |
| **Warning** | ❌ NEW | Avertissements |
| **Success** | C3/C4 | Succès, états positifs |

### Règles strictes

1. **Interdiction** : Aucun hex/rgba direct dans les composants React/CSS
2. **Exception** : Les overlays peuvent utiliser `rgba(0,0,0,x)` avec documentation
3. **Obligation** : Utiliser `var(--color-cX)` ou classes utilitaires
4. **Naming** : Privilégier les classes sémantiques (`.btn-primary`, `.text-muted`)

### Composants à créer/standardiser

```css
/* Button variants */
.btn-primary { background: var(--color-c2); color: var(--color-c7); }
.btn-secondary { background: var(--color-c7); border: 1px solid var(--color-c8); }
.btn-ghost { background: transparent; }

/* Text utilities */
.text-primary { color: var(--color-c10); }
.text-secondary { color: var(--color-c9); }
.text-brand { color: var(--color-c1); }
.text-link { color: var(--color-c2); }

/* Surface */
.surface-page { background: var(--color-c7); }
.surface-card { background: #FFFFFF; } /* ou var(--color-c11) */
.surface-raised { background: var(--color-c4); }

/* Feedback states */
.text-error { color: var(--color-danger, #b00020); }
.bg-error { background: var(--color-danger-bg, #fff3f3); }
.text-warning { color: var(--color-warning, #7a5a00); }
.bg-warning { background: var(--color-warning-bg, #fff7e6); }
```

---

## D) PLAN DE MIGRATION

### Phase 1 : Fondations (haute visibilité)
- [ ] Créer les variables CSS sémantiques dans `styles.css`
- [ ] Remplacer `#222`, `#2b3e37` par `C1` dans `Credit.css`, `Ir.css`
- [ ] Standardiser les fonds blancs (`#fff` → C7 ou token surface)
- [ ] Créer tokens `--overlay`, `--surface-glass` pour les rgba

### Phase 2 : Composants encapsulés
- [ ] Créer composant `Button` avec variants (primary/secondary/ghost)
- [ ] Créer composant `Card` avec fond consistant
- [ ] Créer composant `Badge` avec couleurs tokenisées
- [ ] Créer composant `Alert` (success/warning/error) avec tokens sémantiques

### Phase 3 : Pages et features
- [ ] Refactor `Login.css` (alertes, fonds)
- [ ] Refactor `Credit.css` (warning banner)
- [ ] Refactor `Settings.jsx` (color picker hardcodé)
- [ ] Audit `Placement.css` (utilise bien les tokens)

### Phase 4 : Nettoyage
- [ ] Supprimer alias legacy (`--green`, `--beige`, `--bg`) si non utilisés
- [ ] Vérifier aucune régression visuelle
- [ ] Documenter la convention dans `docs/design-system.md`

---

## E) EXPORTS PPTX & EXCEL — AUDIT COULEURS

### Résumé exports (10 lignes)

**Problèmes majeurs détectés :**
1. **PPTX** : Architecture bien structurée avec `resolvePptxColors()` mais présence de couleurs hardcodées dans `DEFAULT_PPTX_THEME` (`pptxTheme.ts:54-60`)
2. **Excel** : Système minimaliste avec `xlsxBuilder.ts`, couleurs passées en paramètres (`headerFill`, `sectionFill`) mais fallback hardcodé (`2F4A6D`, `E5EAF2`)
3. **Blancs PPTX** : `FFFFFF` utilisé explicitement comme seule couleur autorisée hardcodée (documenté dans `types.ts:34` et `serenity.ts:783`)
4. **Debug colors** : `FF0000`, `00FF00`, `0000FF` dans `serenity.ts:356-358` (code de debug conditionnel)
5. **Divergence UI vs Export** : Excel n'utilise pas les tokens C1-C10, seulement des couleurs passées manuellement

---

### E1) INVENTAIRE PPTX

#### Structure des fichiers PPTX (29 fichiers identifiés)

| Fichier | Rôle | Couleurs utilisées |
|---------|------|-------------------|
| `src/pptx/designSystem/serenity.ts` | Design system complet | Rôles thème (bgMain, accent, textMain...) |
| `src/pptx/theme/resolvePptxColors.ts` | Résolution thème cabinet/custom | C1-C10 via `SER1_CLASSIC_COLORS` |
| `src/pptx/theme/types.ts` | Types et rôles sémantiques | Définition `PptxThemeRoles` |
| `src/pptx/theme/pptxTheme.ts` | Mapping UI → PPTX | **Hardcodé** `DEFAULT_PPTX_THEME` |
| `src/pptx/theme/themeBuilder.ts` | Construction du thème | C1-C10 via `resolvePptxColors` |
| `src/pptx/slides/buildCover.ts` | Slide de couverture | `bgMain`, `textOnMain`, `accent` |
| `src/pptx/slides/buildIrSynthesis.ts` | Synthèse IR (premium) | Gradient C4→C2, `color5`, `textMain` |
| `src/pptx/slides/buildCreditSynthesis.ts` | Synthèse crédit | Rôles thème |
| `src/pptx/slides/buildChapter.ts` | Slide chapitre | `bgMain`, `accent`, `panelBg` |
| `src/pptx/slides/buildContent.ts` | Slide contenu | Rôles thème |
| `src/pptx/auditPptx.ts` | Export audit patrimonial | C1, C2, C4, C7, C10 (variables locales) |
| `src/pptx/strategyPptx.ts` | Export stratégie | Rôles thème |
| `src/pptx/export/demoExport.ts` | Démo/test | **Hardcodé** `DEMO_THEME` (C1-C10) |
| `src/pptx/export/exportStudyDeck.ts` | Point d'entrée export | Délegation theme |

#### Mapping sémantique PPTX (Rôles → Tokens C1-C10)

| Rôle PPTX | Source | Token C1-C10 | Usage dans l'export |
|-----------|--------|--------------|---------------------|
| `bgMain` | `resolvePptxColors` | C1 | Fond cover slide, titres |
| `accent` | `resolvePptxColors` | C6 | Lignes d'accent, corner marks |
| `textMain` | `resolvePptxColors` | C10 | Titres, texte principal |
| `textBody` | `resolvePptxColors` | C9 | Texte secondaire, labels |
| `textOnMain` | Adaptative | C7 (ou calculé) | Texte sur fond C1 |
| `panelBg` | Constant | `#FFFFFF` | Fond des panneaux/cards |
| `panelBorder` | `resolvePptxColors` | C8 | Bordures des panneaux |
| `shadowBase` | `resolvePptxColors` | C10 | Ombres des cards |
| `footerOnLight` | `resolvePptxColors` | C10 | Footer sur fond clair |
| `footerAccent` | `resolvePptxColors` | C6 | Footer sur slide end |

#### Couleurs hardcodées détectées (PPTX)

| Valeur | Fichier:Ligne | Contexte | Remplacement recommandé |
|--------|---------------|----------|------------------------|
| `#FFFFFF` | `types.ts:34`, `serenity.ts:783` | Panel background, slide bg | Documenté comme seule exception autorisée |
| `FF0000` | `serenity.ts:356` | Debug layout (RED) | Conditionné `DEBUG_LAYOUT_ZONES` — acceptable |
| `00FF00` | `serenity.ts:357` | Debug layout (GREEN) | Conditionné `DEBUG_LAYOUT_ZONES` — acceptable |
| `0000FF` | `serenity.ts:358` | Debug layout (BLUE) | Conditionné `DEBUG_LAYOUT_ZONES` — acceptable |
| `#2B3F37` | `pptxTheme.ts:55` | `DEFAULT_PPTX_THEME.bgMain` | Remplacer par `SER1_CLASSIC_COLORS.c1` |
| `#FFFFFF` | `pptxTheme.ts:56` | `DEFAULT_PPTX_THEME.textMain` | Remplacer par `SER1_CLASSIC_COLORS.c10` |
| `#CEC1B6` | `pptxTheme.ts:57-58` | `DEFAULT_PPTX_THEME.accent/line` | Remplacer par `SER1_CLASSIC_COLORS.c6` |
| `#2B3E37`...`#000000` | `demoExport.ts:16-25` | `DEMO_THEME` | Référence SER1 Classic — aligner avec `SER1_CLASSIC_COLORS` |
| `996600` | `auditPptx.ts:310` | Warning text color | Créer token `--color-warning-pptx` |
| `666666` | `auditPptx.ts:368` | Disclaimer text | Utiliser `C9` |

---

### E2) INVENTAIRE EXCEL

#### Structure fichier Excel

| Fichier | Rôle | Couleurs utilisées |
|---------|------|-------------------|
| `src/utils/xlsxBuilder.ts` | Générateur XLSX from scratch | `headerFill`, `sectionFill` (params) |

#### Système de styles Excel (xlsxBuilder.ts)

```typescript
// Lignes 40-41 : Normalisation des couleurs
const normalizeColor = (color?: string, fallback = '2F4A6D') =>
  (color || fallback).replace('#', '').toUpperCase();

// Ligne 181 : Application header
const headerFill = normalizeColor(options.headerFill);

// Ligne 182 : Application section  
const sectionFill = normalizeColor(options.sectionFill, 'E5EAF2');
```

#### Couleurs hardcodées Excel

| Valeur | Fichier:Ligne | Contexte | Remplacement recommandé |
|--------|---------------|----------|------------------------|
| `2F4A6D` | `xlsxBuilder.ts:40` | Fallback headerFill | Paramétrer via thème (C1 ou C2) |
| `E5EAF2` | `xlsxBuilder.ts:182` | Fallback sectionFill | Paramétrer via thème (C4 ou C7) |
| `FF${headerFill}` | `xlsxBuilder.ts:75` | Header fill ARGB | OK — provient du paramètre |
| `FF${sectionFill}` | `xlsxBuilder.ts:76` | Section fill ARGB | OK — provient du paramètre |
| `FFFFFFFF` | `xlsxBuilder.ts:69` | Font header color | Blanc fixe pour contraste — acceptable |

#### Tableau "Élément Excel → Style → Couleur"

| Élément | Style ID | Couleur | Source |
|---------|----------|---------|--------|
| Header (titre colonne) | `sHeader` (1) | `headerFill` param | Paramètre appelant |
| Section (regroupement) | `sSection` (2) | `sectionFill` param | Paramètre appelant |
| Texte header | `fontId=1` | `FFFFFFFF` | Hardcodé (contraste) |
| Texte section | `fontId=2` | Noir par défaut | Arial bold |
| Texte standard | `sText` (3) | Aucune | Défaut Excel |
| Monétaire | `sMoney` (5) | Aucune | Format `#\,##0 "€"` |
| Pourcentage | `sPercent` (6) | Aucune | Format `0.00%` |

---

### E3) CONVENTION EXPORTS RECOMMANDÉE

#### Règles strictes PPTX

1. **Toutes les couleurs** doivent transiter par `resolvePptxColors()`
2. **Seul blanc autorisé** : `#FFFFFF` pour `panelBg` (déjà documenté)
3. **Pas de fallback hardcodé** : `DEFAULT_PPTX_THEME` doit utiliser `SER1_CLASSIC_COLORS`
4. **Warnings/Alerts** : Créer des tokens sémantiques dédiés

```typescript
// Proposition : src/pptx/theme/semanticColors.ts
export const SEMANTIC_COLORS = {
  // Utiliser les C1-C10 comme source
  success: (theme: ThemeColors) => theme.c2,
  warning: (theme: ThemeColors) => '996600', // ou C6 si assez contrasté
  danger: (theme: ThemeColors) => 'B00020',  // ou C1 si rouge
  info: (theme: ThemeColors) => theme.c4,
  // Blanc constant
  white: '#FFFFFF' as const,
  // Debug (conditionné)
  debug: {
    red: 'FF0000',
    green: '00FF00', 
    blue: '0000FF',
  }
};
```

#### Règles Excel

1. **Ne pas utiliser de fallback hardcodé** dans `normalizeColor`
2. **Exiger les couleurs** en paramètres de `buildXlsxBlob`
3. **Mapping suggéré** :
   - `headerFill` → C2 (Primary)
   - `sectionFill` → C4 (Light accent)

```typescript
// Proposition : Interface stricte
export type XlsxBuildOptions {
  sheets: XlsxSheet[];
  headerFill: string;  // Obligatoire — plus d'optionnel
  sectionFill: string; // Obligatoire — plus d'optionnel
}
```

---

### E4) PLAN DE MIGRATION EXPORTS

#### Phase 1 : PPTX — Unification thème
- [ ] Remplacer `DEFAULT_PPTX_THEME` dans `pptxTheme.ts` par référence à `SER1_CLASSIC_COLORS`
- [ ] Créer `DEMO_THEME` à partir de `SER1_CLASSIC_COLORS` (pas de duplication)
- [ ] Remplacer `996600` warning dans `auditPptx.ts` par token sémantique
- [ ] Remplacer `666666` dans `auditPptx.ts` par `C9`

#### Phase 2 : Excel — Tokenisation
- [ ] Rendre `headerFill` et `sectionFill` obligatoires dans `XlsxBuildOptions`
- [ ] Créer helper `getExcelColorsFromTheme(theme)` qui map C1-C10 → header/section
- [ ] Mettre à jour tous les appelants pour passer les couleurs explicites

#### Phase 3 : Validation cohérence
- [ ] Ajouter test : PPTX export utilise bien les couleurs du thème cabinet
- [ ] Ajouter test : Excel export reste cohérent avec les tokens C1-C10
- [ ] Vérifier contraste des couleurs d'export (WCAG AA minimum)

---

## F) GOUVERNANCE & CONTRASTE — DÉCISION FINALE

### Décision (Option B choisie)

**Architecture : Tokens C1-C10 + 2 exceptions (blanc + warning hardcodé)**

**Justification** :
1. Thème user entièrement personnalisable → aucun token C1-C10 ne garantit un contraste lisible pour les états critiques
2. Warning hardcodé (#996600) assure lisibilité universelle quelle que la palette du cabinet
3. Blanc (#FFFFFF) reste l'exception unique pour les fonds élevés (cards, panels, texte sur fond sombre)
4. Divergence UI/PPTX/Excel évitée : mêmes règles appliquées partout

---

### Comparaison Options A/B

#### Option A : Strict C1-C10 (tokens seuls)

| Avantages | Inconvénients |
|-----------|---------------|
| 100% cohérent avec le thème user | Warning peut devenir illisible si C6 clair |
| Zero hardcode (sauf blanc) | Risque de contraste insuffisant sur thèmes clairs |
| Simple à expliquer | Nécessite validation contraste à chaque changement de thème |

**Risque** : Un cabinet avec C6 très clair (#E8DDD4) rend les warnings illisibles sur fond blanc.

#### Option B : C1-C10 + 2 exceptions (blanc + warning) ⭐ Choisie

| Avantages | Inconvénients |
|-----------|---------------|
| Warning toujours lisible | 2 hardcodes au lieu d'1 |
| Contraste garanti pour les alertes | Nécessite documentation de l'exception |
| Peut supporter n'importe quel thème user | — |

**Risque** : Léger écart visuel si le thème a une dominante orange déjà proche du warning — mais lisibilité préservée.

---

### Mapping Sémantique Final

| Sémantique | Source | Usage | UI | PPTX | Excel |
|------------|--------|-------|----|------|-------|
| `white` | **Exception** `#FFFFFF` | Fonds cards, texte sur fond sombre | ✓ | ✓ | ✓ |
| `warning` | **Exception** `#996600` | Alertes, badges warning | ✓ | ✓ | ✓ |
| `surface-page` | C7 | Fond page | ✓ | ✓ | — |
| `surface-card` | white | Cards, panels, modals | ✓ | ✓ | — |
| `surface-raised` | C4 | Surfaces surélevées | ✓ | ✓ | — |
| `surface-overlay` | `rgba(0,0,0,0.5)` | Backdrop modals | ✓ | ✓ | — |
| `text-primary` | C10 | Texte principal | ✓ | ✓ | ✓ |
| `text-secondary` | C9 | Labels, texte muted | ✓ | ✓ | — |
| `text-inverse` | white | Texte sur fond sombre | ✓ | ✓ | ✓ |
| `border-default` | C8 | Bordures standards | ✓ | ✓ | — |
| `border-strong` | C5 | Bordures accentuées | ✓ | ✓ | — |
| `accent-line` | C6 | Lignes d'accent | ✓ | ✓ | — |
| `success` | C3 | Succès, états positifs | ✓ | ✓ | — |
| `danger` | C1 | Erreurs, alertes critiques | ✓ | ✓ | — |
| `info` | C4 | Information | ✓ | ✓ | — |
| `excel-header` | C2 | Header Excel | — | — | ✓ |
| `excel-section` | C4 | Sections Excel | — | — | ✓ |

---

### Règles de Combinaison (Contraste)

#### Tableau "Fond → Texte autorisé"

| Fond | Couleur | Texte autorisé | Interdiction |
|------|---------|----------------|--------------|
| **Page** | C7 (#F5F3F0) | C10 (noir), C9 (gris) | ❌ WHITE — manque de contraste |
| **Card/Panel** | WHITE | C10, C9, C1 | ❌ WHITE — invisible |
| **Cover Slide** | C1 (#2B3E37) | WHITE uniquement | ❌ C10, C9 — manque de contraste |
| **Header table** | C2 (#709B8B) | WHITE uniquement | ❌ C10 — manque de contraste |
| **Alert warning** | #FFF7E6 | WARNING (#996600), C10 | ❌ C9 — manque de contraste |
| **Alert danger** | C1 | WHITE | ❌ C10 — illisible |

#### Tableau "Composant → Règles" (Extraits)

| Composant | Fond | Texte | Règle contraste |
|-----------|------|-------|-----------------|
| Button primary | C2 | WHITE | Si C2 très clair → switch C10 |
| Button secondary | C7 | C10 | Toujours OK |
| Input focus | WHITE | C10 | Border C2 |
| Badge warning | #FFF7E6 | WARNING | Hardcodé |
| Table header | C2 | WHITE | Excel : même règle |
| Modal overlay | rgba(0,0,0,0.5) | — | Seul rgba autorisé |

---

### Implémentation Minimale Proposée

#### Module 1 : Semantic Colors (src/styles/semanticColors.ts)

```typescript
/**
 * Couleurs sémantiques SER1 — Source de vérité
 * 
 * Architecture : C1-C10 + 2 exceptions (white, warning)
 * Usage : UI + PPTX + Excel
 */

// Exceptions (hardcodées, justifiées)
export const WHITE = '#FFFFFF' as const;
export const WARNING = '#996600' as const; // Warning garanti lisible

// Dérivations depuis ThemeColors (C1-C10)
export interface SemanticColors {
  // Surfaces
  surfacePage: string;      // C7
  surfaceCard: string;      // WHITE
  surfaceRaised: string;    // C4
  surfaceOverlay: string;   // rgba(0,0,0,0.5)
  
  // Textes
  textPrimary: string;      // C10
  textSecondary: string;    // C9
  textInverse: string;      // WHITE
  
  // Bordures
  borderDefault: string;    // C8
  borderStrong: string;     // C5
  
  // Accents
  accentLine: string;       // C6
  
  // États
  success: string;          // C2 ou C3
  danger: string;           // C1
  warning: string;          // WARNING (hardcodé)
  info: string;             // C4
}

// Helper : Générer les couleurs sémantiques depuis C1-C10
export function getSemanticColors(theme: {
  c1: string; c2: string; c3: string; c4: string;
  c5: string; c6: string; c7: string; c8: string;
  c9: string; c10: string;
}): SemanticColors {
  return {
    surfacePage: theme.c7,
    surfaceCard: WHITE,
    surfaceRaised: theme.c4,
    surfaceOverlay: 'rgba(0,0,0,0.5)',
    textPrimary: theme.c10,
    textSecondary: theme.c9,
    textInverse: WHITE,
    borderDefault: theme.c8,
    borderStrong: theme.c5,
    accentLine: theme.c6,
    success: theme.c2,
    danger: theme.c1,
    warning: WARNING,
    info: theme.c4,
  };
}

// Helper : Choisir la couleur de texte selon le fond
export function pickTextColorForBackground(
  bgColor: string,
  theme: { c10: string }
): string {
  const luminance = getRelativeLuminance(bgColor);
  // Seuil 0.5 : au-dessus = fond clair → texte sombre
  return luminance > 0.5 ? theme.c10 : WHITE;
}

// Helper interne : Calcul luminance relative (WCAG)
function getRelativeLuminance(hexColor: string): number {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const toLinear = (c: number) => 
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}
```

#### Module 2 : Excel Colors (src/utils/excelColors.ts)

```typescript
import { getSemanticColors, WHITE } from '../styles/semanticColors';

// Mapping spécifique Excel depuis les couleurs sémantiques
export function getExcelColors(theme: { c1: string; c2: string; c4: string; c7: string; c8: string; c10: string; }) {
  const semantic = getSemanticColors({ ...theme, c3: theme.c2, c5: theme.c8, c6: theme.c8, c9: theme.c10 });
  
  return {
    headerFill: theme.c2.replace('#', ''),      // Primary
    headerText: WHITE.replace('#', ''),         // Blanc forcé
    sectionFill: theme.c4.replace('#', ''),     // Light accent
    sectionText: theme.c10.replace('#', ''),    // Noir
    border: theme.c8.replace('#', ''),          // Border light
    zebraOdd: theme.c7.replace('#', ''),        // Surface page
    zebraEven: WHITE.replace('#', ''),          // Blanc
    warningFill: 'FFF7E6',                      // Fond warning (hardcodé)
    warningText: '996600',                      // Warning (hardcodé)
  };
}
```

#### Module 3 : PPTX Semantic (src/pptx/theme/semanticColors.ts)

```typescript
import { getSemanticColors as getBaseSemanticColors, WHITE, WARNING } from '../../styles/semanticColors';
import type { ThemeColors } from '../../settings/ThemeProvider';

// Version PPTX : retourne les couleurs sans # pour PptxGenJS
export function getPptxSemanticColors(theme: ThemeColors) {
  const base = getBaseSemanticColors(theme);
  
  return {
    // Surfaces (sans #)
    surfacePage: base.surfacePage.replace('#', ''),
    surfaceCard: WHITE.replace('#', ''),
    surfaceRaised: base.surfaceRaised.replace('#', ''),
    surfaceOverlay: '000000', // PPTX utilise opacity séparée
    
    // Textes (sans #)
    textPrimary: base.textPrimary.replace('#', ''),
    textSecondary: base.textSecondary.replace('#', ''),
    textInverse: WHITE.replace('#', ''),
    
    // Bordures (sans #)
    borderDefault: base.borderDefault.replace('#', ''),
    borderStrong: base.borderStrong.replace('#', ''),
    
    // Accents (sans #)
    accentLine: base.accentLine.replace('#', ''),
    
    // États (sans #)
    success: base.success.replace('#', ''),
    danger: base.danger.replace('#', ''),
    warning: WARNING.replace('#', ''),
    info: base.info.replace('#', ''),
    
    // Raw pour références
    white: WHITE.replace('#', ''),
    warningRaw: WARNING,
  };
}

// Helper PPTX : détermine texte clair ou sombre pour un fond
export function getPptxTextForBackground(bgColor: string, theme: ThemeColors): string {
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Luminance approximative (perceptuelle)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? theme.c10.replace('#', '') : WHITE.replace('#', '');
}
```

---

### Checklist Validation Finale

#### UI
- [ ] Titres : C1 ou C10 — jamais sur fond clair sans contraste
- [ ] Cards : fond WHITE — texte C10 ou C9
- [ ] Tables : header C2/texte WHITE — rows C7/WHITE alternance
- [ ] CTA : C2 fond — WHITE texte (ou C10 si C2 clair)
- [ ] Modals : overlay rgba(0,0,0,0.5) — panel WHITE
- [ ] Alerts : warning #996600 hardcodé — danger C1/white

#### PPTX
- [ ] Cover : fond C1 — texte WHITE
- [ ] Titres slides : C10 sur fond WHITE
- [ ] Tableaux : header C2/texte WHITE — rows C7/WHITE
- [ ] Warnings : WARNING hardcodé

#### Excel
- [ ] Headers : C2 fill — WHITE texte (toujours)
- [ ] Sections : C4 fill — C10 texte
- [ ] Zebra : C7 / WHITE alternance
- [ ] Alertes : warning hardcodé

---

### Références

- [Détail complet gouvernance](./color-governance.md)
- [Fichier source à créer : src/styles/semanticColors.ts](../src/styles/semanticColors.ts)
- [Fichier source à créer : src/pptx/theme/semanticColors.ts](../src/pptx/theme/semanticColors.ts)

---

## Fichier généré (final)

- Date : 2026-02-03
- Documents : `docs/color-audit.md` (complet), `docs/color-governance.md` (référence)
- Implémentation proposée : 3 modules (`semanticColors.ts` ×2 + `excelColors.ts`)
