# Plan d'Action : PPTX "Conservateur+" — Issues #17, #22, #20

> **Date** : 2026-02-08  
> **Stratégie** : Template codé (PptxGenJS) + Spike timeboxé template natif  
> **Priorité** : #22 → #20 → Spike #17 (ADR)

---

## 🎯 Vision "Conservateur+"

Au lieu d'un chantier risqué "template PPTX natif", on structure l'existant PptxGenJS en **Design System codé** :

```
src/pptx/
├── designSystem/          # Tokens, couleurs, typo (existant)
├── masters/              # 🆕 Slide masters réutilisables
│   ├── coverMaster.ts
│   ├── chapterMaster.ts
│   ├── contentMaster.ts
│   └── endMaster.ts
├── layouts/              # 🆕 Grids et compositions
│   ├── twoColumnLayout.ts
│   ├── kpiGridLayout.ts
│   └── chartLayout.ts
├── components/           # 🆕 Composants atomiques
│   ├── TitleBlock.ts
│   ├── KpiCard.ts
│   ├── ChartContainer.ts
│   └── LegendBlock.ts
└── template/             # 🆕 "Template codé" (configuration déclarative)
    ├── serenityTemplate.ts    # Master template configuration
    └── simulationConfigs/     # Config par simulateur
        ├── irConfig.ts
        ├── creditConfig.ts
        └── placementConfig.ts
```

**Avantage** : Scalable, testable, versionnable — pas de parser XML à maintenir.

---

## 📋 Détails des Issues

---

### 🔷 Issue #22 : Logo Data URI (1 jour)

**Fichier** : `src/pptx/ops/applyCoverLogo.ts:113`

**Problème actuel** :
```typescript
// Logo chargé depuis URL externe → risque CORS/404
const logoUrl = cabinetLogo?.url || userMetadata?.logoUrl;
```

**Solution** :
```typescript
// Logo converti en base64 data URI au moment de l'upload/cache
const logoDataUri = await getLogoAsDataUri(cabinetId); // "data:image/png;base64,iVBOR..."
```

**Tâches** :
1. Créer `src/utils/logoCache.ts` — cache base64 des logos cab
2. Modifier `ThemeProvider.tsx` — stocker `logoDataUri` dans le contexte
3. Modifier `applyCoverLogo.ts` — utiliser data URI directement
4. Tests : fallback si logo absent, taille max (base64 inflaté ~33%)

**Breaking change** : Non (fallback URL externe si pas de data URI)

---

### 🔷 Issue #20 : Masters Slides (2-3 jours)

**Structure cible** :

```typescript
// src/pptx/masters/types.ts
export interface SlideMaster {
  name: 'cover' | 'chapter' | 'content' | 'end';
  background?: ColorToken;
  slots: SlotDefinition[];  // Zones définies (titre, contenu, logo)
}

export interface SlotDefinition {
  id: string;
  type: 'text' | 'chart' | 'image' | 'kpi';
  x: number; y: number; w: number; h: number;
  style?: TextStyle;
}
```

**Implémentation** :

```typescript
// src/pptx/masters/coverMaster.ts
export const coverMaster: SlideMaster = {
  name: 'cover',
  background: 'c1',
  slots: [
    { id: 'title', type: 'text', x: 0.5, y: 2.5, w: 9, h: 1.5, style: titleStyle },
    { id: 'subtitle', type: 'text', x: 0.5, y: 4.2, w: 9, h: 0.8, style: subtitleStyle },
    { id: 'logo', type: 'image', x: 7.5, y: 5.5, w: 2, h: 1 },
  ]
};
```

**Tâches** :
1. Créer `src/pptx/masters/` module avec types + 4 masters
2. Créer `src/pptx/layouts/` — grilles réutilisables
3. Créer `src/pptx/components/` — composants atomiques
4. Modifier `creditDeckBuilder.ts` et `irDeckBuilder.ts` — utiliser les masters
5. Tests : cohérence visuelle entre simulateurs

---

### 🔷 Spike #17 : Template PPTX Natif (Timebox 4h max)

**Objectif** : Vérifier si charger un .pptx existant est réaliste/stable.

**Hypothèses à tester** :
1. PptxGenJS peut-il ouvrir un fichier PPTX (même partiellement) ?
2. Une librairie comme `pptx-template` fonctionne-t-elle dans notre stack (Vite, browser) ?
3. Le coût de maintenance d'un parseur ZIP+XML est-il acceptable ?

**POC minimal** :

```typescript
// tests/spike-pptx-template.ts
import * as JSZip from 'jszip'; // Déjà utilisé par PptxGenJS

export async function spikeLoadPptx(file: File): Promise<boolean> {
  try {
    const zip = await JSZip.loadAsync(file);
    
    // 1. Lire [Content_Types].xml
    const contentTypes = await zip.file('[Content_Types].xml')?.async('text');
    
    // 2. Lire ppt/presentation.xml
    const presentation = await zip.file('ppt/presentation.xml')?.async('text');
    
    // 3. Parser slides (simplifié)
    const slideFiles = Object.keys(zip.files).filter(f => f.startsWith('ppt/slides/'));
    
    console.log('[Spike] Slides trouvés:', slideFiles.length);
    console.log('[Spike] Content types:', contentTypes?.slice(0, 200));
    
    return slideFiles.length > 0;
  } catch (e) {
    console.error('[Spike] Échec:', e);
    return false;
  }
}
```

**Critères de réussite du spike** :
- [ ] Lire structure ZIP d'un .pptx
- [ ] Extraire XML d'une slide
- [ ] Identifier placeholders (si présents)
- [ ] Estimer effort pour reconstruire avec PptxGenJS

**Critères d'abandon** (>4h ou blocage) :
- ZIP parsing trop complexe
- XML PPTX trop verbeux/instable
- Pas de solution pour lier data → placeholders

---

## 📄 ADR #17 : Template Natif vs Codé (Structure)

```markdown
# ADR-001 : Stratégie Template PPTX

## Contexte
Besoin : Exports PPTX professionnels, cohérents, scalables pour 10+ simulateurs.
Contrainte : PptxGenJS ne supporte pas l'ouverture de fichiers PPTX existants.

## Options évaluées

### Option A : Parser XML natif (ZIP + XML)
- ✅ Contrôle total
- ❌ 2-4 semaines de dev, maintenance lourde, fragile face aux versions Office
- **Verdict** : ❌ Rejeté (coût > valeur)

### Option B : Librairie externe (pptx-template)
- ✅ API plus simple
- ❌ Dépendance non maintenue, risque sécurité, bundle size
- **Verdict** : ❌ Rejeté (dépendance risquée)

### Option C : Template codé (PptxGenJS structuré)
- ✅ Stable, testable, versionnable, pas de dépendance externe
- ⚠️ Nécessite discipline de design system
- **Verdict** : ✅ Retenu

## Décision
**Template codé** avec Design System complet (masters, layouts, composants).

## Conséquences
- Tout template doit être "traduit" en code TypeScript
- Nouveaux simulateurs = nouvelle config déclarative (pas nouveau .pptx)
- Maintenance = refactor code (pas edit fichier binaire)

## Spike #17
POC template natif timeboxé 4h. Si réussi → Option D hybride (charge .pptx, extracte masters). Sinon → Option C pure.
```

---

## 🗓️ Planning Détaillé

### Semaine 1 (Février 10-14)

| Jour | Issue | Tâche | Livrable |
|------|-------|-------|----------|
| Lundi | #22 | Analyse `applyCoverLogo.ts` + cache base64 | Plan technique #22 |
| Mardi | #22 | Implémentation `logoCache.ts` + tests | PR #22 prête |
| Mercredi | #20 | Structure `masters/` module + types | Module masters squelette |
| Jeudi | #20 | Implémentation 4 masters + refacto builders | PR #20 prête |
| Vendredi | #17 | Spike POC template natif (4h max) | POC + notes |

### Semaine 2 (Février 17-21)

| Jour | Tâche | Livrable |
|------|-------|----------|
| Lundi | Rédaction ADR #17 | ADR-001 finalisé |
| Mardi | Review PR #22, #20 | Merge sur main |
| Mercredi | Début #17 si ADR = "go" OU amélioration template codé | Suite selon décision |

---

## ✅ Checklist de Validation

**Avant merge #22** :
- [ ] Logo s'affiche en offline (mode déconnecté)
- [ ] Fallback URL si data URI absent
- [ ] Taille base64 < 100KB (compression PNG si nécessaire)

**Avant merge #20** :
- [ ] 4 masters définis et documentés
- [ ] IR et Crédit utilisent les mêmes masters
- [ ] Cohérence visuelle validée (exports côte à côte)

**Avant fin spike #17** :
- [ ] POC lit un .pptx réel
- [ ] Décision ADR tranchée et documentée

---

*Plan généré suite à décision "Conservateur+" — 2026-02-08*
