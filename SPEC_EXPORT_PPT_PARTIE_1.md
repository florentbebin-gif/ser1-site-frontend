# SPEC EXPORT POWERPOINT PREMIUM — PARTIE 1/3

**Version** : 1.1 | **Date** : 2026-01-12 | **Scope** : /sim/ir, /sim/credit, /sim/placement  
**Style Guide** : Voir `STYLE_GUIDE_PPT_PREMIUM.md` (validé 12/01/2026)

---

## A) AUDIT REPO (SANS CODE)

### Infrastructure existante

#### Modules PPTX (`src/pptx/`)
- **`index.ts`** : utilitaires communs, exports DEFAULT_COLORS
- **`auditPptx.ts`** : Audit complet (7 slides), reçoit `{dossier, colors?, logoBase64?}` ✅
- **`strategyPptx.ts`** : Stratégie (6 slides), reçoit `{dossier, strategie, comparaison, colors?}` ⚠️ colors non passé depuis UI
- **`creditPptx.ts`** : Crédit simple (3 slides), utilise DEFAULT_COLORS
- **`irPptx.ts`** : IR simple (2-3 slides), utilise DEFAULT_COLORS

#### Gestion thème (`src/settings/ThemeProvider.tsx`)
- **ThemeProvider** : contexte React central, cache local 24h (`ser1_theme_cache`)
- **Double stockage** : `ui_settings` (nouveau) + `user_metadata` (legacy)
- **10 tokens couleurs** : c1..c10, appliqués via CSS variables `--color-c1` à `--color-c10`
- **5 thèmes prédéfinis** + éditeur manuel
- **Portée thème `theme_scope`** :
  - `"all"` : Interface + études PowerPoint prennent le thème user
  - `"ui-only"` : Interface uniquement, PPT utilise DEFAULT_COLORS
- **Hook `useThemeForPptx()`** : renvoie couleurs sans "#" (format PPTX)
- **Cover slide** : `cover_slide_url` dans `user_metadata` (URL publique Supabase Storage bucket "covers")

#### Simulateurs

**IR** : Calcul impôt sur le revenu (barème IR progressif, TMI, tranches)
- Données : `revenuNetImposable`, `nombreParts`, `impotBrut`, `tmi`, `revenuParPart`, `detailTranches`
- Export PPT : `irPptx.ts` existe mais non branché UI

**Crédit** (`src/pages/Credit.jsx`) : Crédit immobilier/amortissable/in fine
- Données : `capitalEmprunte`, `dureeAnnees`, `tauxNominal`, `tauxAssurance`, `mensualiteTotale`, `coutTotal`, `taeg`, échéancier
- Export PPT : `generateCreditPptx()` dans `creditPptx.ts`

**Placement** (`src/pages/PlacementV2.jsx` + `src/engine/placementEngine.js`)
- Architecture 3 phases : Épargne → Liquidation → Transmission
- Enveloppes : AV, PER, PEA, CTO, SCPI
- Moteur découplé : `simulateComplete()`, `compareProducts()`
- Settings-driven : `usePlacementSettings()` charge paramètres fiscaux Supabase
- Export Excel existant, pas de PPT

#### Points d'intégration

**Où appeler générateurs PPT :**
- **Audit** : `AuditWizard.tsx:123-133` → ✅ passe colors
- **Strategy** : `StrategyBuilder.tsx:89-100` → ⚠️ NE passe PAS colors
- **IR** : à brancher UI (bouton manquant)
- **Crédit** : à brancher UI (bouton manquant)
- **Placement** : à créer module `placementPptx.ts` + brancher UI

**Règles `theme_scope` à implémenter** (pseudo-code) :
```typescript
const { user } = await supabase.auth.getUser();
const themeScope = user?.user_metadata?.theme_scope || 'all';
const finalColors = (themeScope === 'ui-only') ? DEFAULT_COLORS : colors;
```

**Cover slide (page de garde)** :
- Source : `user.user_metadata.cover_slide_url`
- Usage : télécharger, convertir base64, passer à `addTitleSlide(pptx, clientName, colors, logoBase64)`
- Fallback : slide titre propre sans logo

---

## B) PPT TEMPLATE SYSTEM RÉUTILISABLE

### Vision globale

**Objectif** : Système de composants de slides + conventions pour brancher n'importe quel simulateur.

**Philosophie** :
- **Premium & pédagogique** : design soigné, hiérarchie visuelle, client-friendly
- **Séparation stricte** : Partie Client (8-15 slides visuelles) vs Annexes CGP (tables détaillées, hypothèses, formules)
- **Réutilisable** : composants typés (Cover, SectionHeader, KeyMetrics, Comparison, ChartSlide, TableAnnex, Methodology, Disclaimer)

### Grille & Marges (Format 16:9)

**Dimensions** : 10 pouces × 5.625 pouces  
**Marges** : **0.75 pouces** → zone utile **8.5×4.125 pouces**  
**Layout** : 3-4 zones simples (gauche/centre/droite ou grille 2×2)

> ⚠️ **CHANGEMENT v1.1** : Marges élargies pour style "luxury premium" (cf. Style Guide)

### Styles typographiques

| Élément | Police | Taille | Couleur | Graisse |
|---------|--------|--------|---------|---------|
| **H1 (Titre slide)** | Arial | 28-32pt | c1 | Bold |
| **H2 (Sous-titre)** | Arial | 20-24pt | c2 | Bold |
| **H3 (Titre section)** | Arial | 16-18pt | c1 | Bold |
| **Body** | Arial | 12-14pt | c10 | Regular |
| **Caption** | Arial | 10-11pt | c9 | Italic |
| **Disclaimer** | Arial | 9-10pt | c9 | Italic |
| **Metrics (KPI)** | Arial | 36-44pt | c1/c2 | Bold |

### Tokens couleurs (mapping c1..c10)

**Convention d'usage** :
- **c1** : Primaire (fonds, titres H1, métriques)
- **c2** : Secondaire (accents, sous-titres, highlights)
- **c3** : Tertiaire (bordures douces, backgrounds légers)
- **c4** : Accent clair (complémentaire c1, texte sur fonds sombres)
- **c5** : Neutre moyen (séparateurs, grilles)
- **c6** : Background chaud (zones secondaires, cards)
- **c7** : Background principal (tableaux, zones neutres)
- **c8** : Neutre clair (grilles, bordures)
- **c9** : Texte secondaire (captions, notes)
- **c10** : Texte principal (body, contenu)

**Palette graphiques** : c1, c2, c4, c5 (ordre séries)  
**Alertes** : rouge #DC2626 (fixe, warnings)

### Composants de slides (Slide Kit)

#### 1. Cover Slide (Page de garde) — OBLIGATOIRE
**Layout** : Fond plein c1, **ligne horizontale blanche AU-DESSUS du titre** (style Présentation1 PAGE 1)  
**Titre** : 40pt blanc, centré  
**Sous-titre** : 22pt c4, centré  
**Date** : 14pt gris clair, bas  
**Logo** : 10%×8%, bas droit, opacité 60% (si présent)  
**Données** : `clientName`, `studyType`, `date`, `coverUrl?`, `colors`  
**Helper** : `drawTitleWithOverline()`  
**Règle** : Toujours slide 1, fallback propre sans logo

#### 2. Section Header (Séparateur)
**Layout** : Fond c7/dégradé, titre section c1 32pt centré, icône optionnelle  
**Données** : `title`, `icon?`  
**Usage** : Transition "Annexes CGP"

#### 3. Key Metrics (KPI cards)
**Layout** : Grille 2×2 ou 1×4, **icône SVG au-dessus** + label + valeur (style Présentation1 PAGE 3)  
**Icône** : 0.45"×0.45", mini-kit SVG (`money`, `document`, `scale`, `percent`)  
**Label** : 11pt c9, centré  
**Valeur** : 24pt c1 bold (contenu) / 52pt (hero)  
**Fond** : Transparent (pas de bordure, pas de carte visible)  
**Données** : `metrics[]` {icon?, label, value, sublabel?}  
**Helper** : `drawKpiRow()`  
**Règle** : Hiérarchie icône → label → valeur (vertical)

#### 4. Comparison Slide (2 scénarios)
**Layout** : 2 colonnes 50/50, tableaux alignés, deltas +/- colorés (vert #059669 / rouge #DC2626)  
**Données** : `scenario1`, `scenario2`, `deltas`  
**Règle** : Meilleur scénario = bordure épaisse

#### 5. Chart Slide (Graphiques)
**Layout** : Graphique centré 70%×60%, légende, note méthodologique  
**Données** : `title`, `chartType` (line/bar/pie/area), `data[]`, `labels[]`, `note?`  
**Règle** : Palette c1,c2,c4,c5, pas de 3D, lisibilité premium

#### 6. Table Slide (Synthèse client)
**Layout** : Tableau max 6-8 lignes, **header texte c1 + ligne soulignée 2pt** (pas de fond plein)  
**Lignes** : Fond transparent, séparateur 0.5pt c8  
**Total** : Texte c1 bold, ligne au-dessus 1pt c1  
**Données** : `title`, `headers[]`, `rows[][]`, `totalRow?`  
**Règle** : Max 4-5 colonnes partie client. Colonnes alignées (texte gauche, nombres droite)

#### 7. Table Annex (Tableaux détaillés CGP)
**Layout** : Tableau dense jusqu'à 30 lignes, police 10-11pt, bordures c8 0.5pt  
**Données** : `title`, `headers[]`, `rows[][]`, `notes?`  
**Règle** : Si >8 colonnes, split en 2 slides

#### 8. Methodology Slide (Hypothèses)
**Layout** : Blocs explicatifs 2-3, titre bloc c2 16pt bold, bullets 3-5 points max  
**Données** : `sections[]` {title, bullets}  
**Règle** : Langage simple, max 1 slide méthodologie partie client

#### 9. Disclaimer Slide (Mentions légales) — OBLIGATOIRE
**Layout** : Titre centré c1 20pt, texte 10pt justifié, fond blanc/c7, sobre  
**Données** : `text` (constant)  
**Règle** : Toujours dernière slide, texte exact non modifiable

### Convention ExportModel (TypeScript)

```typescript
interface SlideSpec {
  type: 'cover'|'sectionHeader'|'keyMetrics'|'comparison'|'chart'|'table'|'tableAnnex'|'methodology'|'disclaimer';
  title?: string;
  data: any;
  section?: 'client'|'annex';
  notes?: string;
}

interface ExportModel {
  metadata: {
    studyType: string; // 'IR'|'Credit'|'Placement'
    clientName: string;
    date: Date;
    author: string;
  };
  theme: {
    colors: ThemeColors;
    coverUrl?: string;
    scope: 'all'|'ui-only';
  };
  slides: SlideSpec[];
}
```

**Usage** : Simulateur construit `ExportModel` → passe à `generatePptxFromModel(model)` → générateur itère sur slides[]

---

## DISCLAIMER (texte EXACT, dernière slide)

"Document sans valeur contractuelle et purement indicatif, établi sur la base des dispositions légales et règlementaires en vigueur à la date de publication et sont susceptibles d'évolution.  

Le contenu et la forme du document et la méthodologie employée, relèvent de la législation sur le droit d'auteur, le droit des marques et, de façon générale, sur la propriété intellectuelle. La société Laplace en est le concepteur. 

Toute reproduction, représentation, diffusion ou rediffusion, en tout ou partie, de ce document ou ses annexes sur quelque support ou par tout procédé que ce soit, de même que toute vente, revente, retransmission ou mise à disposition de tiers de quelque manière que ce soit sont réglementées. Le non-respect de cette règlementation peut constituer une contrefaçon susceptible d'engager la responsabilité civile et pénale du contrefacteur (articles L335-1 à L335-10 du Code de la propriété intellectuelle)."
