# README_PPTX_UPDATE.md
# À copier-coller dans README.md

---

## 🎯 Templates PPTX (Base + Thèmes)

### Structure des templates

```text
public/pptx/
├── templates/
│   └── serenity-base.pptx          # Template de base Serenity
├── chapters/                       # Images chapitres (prêtes PPTX)
│   ├── ch-01.png
│   ├── ch-02.png
│   └── ... (jusqu'à ch-09.png)
└── icons/                          # Icônes business (générées)
    ├── icon-money.svg
    ├── icon-bank.svg
    └── ... (12 icônes business)
```

### Template de base

- **Fichier** : `public/pptx/templates/serenity-base.pptx`
- **Type** : Template premium Serenity
- **Version** : Versionné dans le repo
- **Usage** : Point de départ pour toutes les éditions PPTX

### API d'export PPTX

#### 1. Chargement du template
```typescript
import { loadBaseTemplate } from '@/pptx/template/loadBaseTemplate';

const pptx = loadBaseTemplate({
  title: 'Audit Patrimonial',
  author: 'Cabinet CGP',
  company: 'SER1'
});
```

#### 2. Thème dynamique
```typescript
import { getPptxThemeFromUiSettings } from '@/pptx/theme/pptxTheme';

const theme = getPptxThemeFromUiSettings(uiSettings);
// Règle : Aucune couleur hex codée en dur sauf blanc (#FFFFFF)
```

#### 3. Injection des éléments
```typescript
// Logo (Supabase Storage)
import { applyCoverLogo } from '@/pptx/ops/applyCoverLogo';
applyCoverLogo(slide, logoUrl, { x: '40%', y: '70%', w: 2, h: 1 });

// Image chapitre
import { applyChapterImage } from '@/pptx/ops/applyChapterImage';
applyChapterImage(slide, 1, theme); // ch-01.png

// Icônes business
import { addBusinessIcon } from '@/pptx/ops/addBusinessIcon';
addBusinessIcon(slide, 'bank', { x: 1, y: 1, w: 0.5, h: 0.5 });
```

#### 4. Types de slides
```typescript
import { buildSlide, SLIDE_TYPES } from '@/pptx/structure/slideTypes';

// Slide de couverture
buildSlide(pptx, SLIDE_TYPES.COVER, {
  title: 'Audit Patrimonial',
  author: 'Jean Dupont',
  logoUrl: '...',
  theme
});

// Slide de chapitre
buildSlide(pptx, SLIDE_TYPES.CHAPTER, {
  chapterNumber: 1,
  title: 'Situation Familiale',
  theme
});

// Slide de contenu
buildSlide(pptx, SLIDE_TYPES.CONTENT, {
  title: 'Analyse du Patrimoine',
  content: ['Point 1', 'Point 2'],
  theme
});
```

### Workflow complet d'export

1. **Charger le thème** : `getPptxThemeFromUiSettings(settings)`
2. **Charger le template** : `loadBaseTemplate(config)`
3. **Injecter le logo** : `applyCoverLogo()` sur la cover
4. **Injecter les images chapitres** : `applyChapterImage()` sur les slides chapitre
5. **Injecter les icônes business** : `addBusinessIcon()` sur les slides de contenu
6. **Générer le PPTX** : `pptx.writeFile({ fileName: 'audit.pptx' })`

### Caractéristiques techniques

#### Thème dynamique
- **Couleurs** : Toutes issues des settings utilisateur
- **Interdiction** : Aucune couleur hex codée en dur sauf blanc (#FFFFFF)
- **Valeurs par défaut** : Thème Serenity (#2B3F37 / #CEC1B6) si non défini

#### Images chapitres
- **Format** : PNG avec fond transparent
- **Ratio** : Portrait 3:4 (ex: 1200×1600px)
- **Traitement** : Coins arrondis, saturation ~30%
- **Usage** : "Prêtes à poser" - aucun traitement en code

#### Icônes business
- **Source** : `src/icons/business/svg/` (12 icônes)
- **Format** : SVG normalisés avec `fill="currentColor"`
- **Usage** : Data URI via `getBusinessIconDataUri()`

#### Template PPTX
- **Limitation** : PPTXGenJS ne supporte pas l'ouverture de fichiers PPTX existants
- **Stratégie** : Reconstruction minimale + TODO pour bibliothèque compatible
- **Fallback** : Création programmatique des slides

### Limitations connues

1. **Chargement PPTX** : PPTXGenJS ne peut pas ouvrir les fichiers .pptx existants
   - Solution actuelle : Reconstruction minimale
   - Future : Bibliothèque compatible ou PPTXGenJS avec support template

2. **Performance** : Génération 100% programmatique (plus lente que template réel)

3. **Complexité** : Maintenance manuelle de la structure des slides

### Tests et validation

#### Commande de test
```bash
npm run build  # Vérifie que tout compile
npm run typecheck  # Vérifie les types TypeScript
```

#### Exemple d'appel complet
```typescript
import { loadBaseTemplate } from '@/pptx/template/loadBaseTemplate';
import { getPptxThemeFromUiSettings } from '@/pptx/theme/pptxTheme';
import { buildSlide, SLIDE_TYPES } from '@/pptx/structure/slideTypes';

// 1. Thème
const theme = getPptxThemeFromUiSettings({
  c1: '#2B3F37', c2: '#CEC1B6', c7: '#F5F5F5',
  c8: '#E0E0E0', c9: '#666666', c10: '#333333',
  c3: '#...', c4: '#...', c5: '#...', c6: '#...'
});

// 2. Template
const pptx = loadBaseTemplate({
  title: 'Test Export',
  author: 'Test User',
  company: 'SER1'
});

// 3. Slides
buildSlide(pptx, SLIDE_TYPES.COVER, {
  title: 'Audit Patrimonial',
  author: 'Jean Dupont',
  theme
});

buildSlide(pptx, SLIDE_TYPES.CHAPTER, {
  chapterNumber: 1,
  title: 'Situation Familiale',
  theme
});

// 4. Export
await pptx.writeFile({ fileName: 'test-export.pptx' });
```

---

*Section à intégrer dans README.md après "🎯 Icônes Business"*
