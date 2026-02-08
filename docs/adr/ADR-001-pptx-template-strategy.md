# ADR-001 : Stratégie Template PPTX

> **Date** : 2026-02-08  
> **Statut** : ✅ Accepté  
> **Auteur** : SER1 Team  
> **Issue** : #17 (Spike template PPTX natif)

---

## Contexte

SER1 génère des exports PPTX professionnels pour 10+ simulateurs (IR, Crédit, Audit, Stratégie…).  
Le moteur actuel utilise **PptxGenJS** pour construire les slides programmatiquement.

**Question** : Faut-il charger un fichier `.pptx` natif (template designer) ou continuer avec un template codé ?

---

## Spike #17 — Résultats POC (2026-02-08)

Un POC a été réalisé pour évaluer la faisabilité d'un template natif.  
Code : `src/pptx/template/__spike__/analyzePptxStructure.ts`  
Tests : `src/pptx/template/__spike__/spike17.test.ts` — **8/8 passent**

### Findings clés

| Critère | Résultat |
|---------|----------|
| Lecture ZIP d'un .pptx | ✅ JSZip lit parfaitement (déjà utilisé par `themeBuilder.ts`) |
| Extraction XML des slides | ✅ XML parsable, shapes/textes identifiables |
| Masters et layouts | ✅ PptxGenJS génère 1 master + 4 layouts |
| Placeholders natifs | ❌ **PptxGenJS ne génère PAS de `<p:ph>` placeholders** |
| Modification XML + re-ZIP | ✅ Fonctionne (preuve : `themeBuilder.ts` le fait déjà) |
| Complexité XML | ⚠️ Verbeux (~1KB/fichier simple, 53 fichiers pour 3 slides) |

### Rapport chiffré

```
📦 Fichiers dans le ZIP : 53
📄 Slides : 3    🎨 Masters : 1    📐 Layouts : 4    🎭 Themes : 1
📌 Placeholders : 0
📏 Taille : 60KB    ⏱️ Analyse : 1ms
🏆 Score faisabilité : 85/100
```

---

## Options évaluées

### Option A : Parser XML natif (ZIP + DOMParser)

- ✅ Contrôle total sur le format OOXML
- ✅ Possible techniquement (JSZip + DOMParser disponibles)
- ❌ **PptxGenJS ne génère pas de placeholders** → impossible de "remplir" un template
- ❌ Pipeline séparé à construire et maintenir (3-4 semaines)
- ❌ XML OOXML très verbeux, fragile face aux versions Office
- ❌ Pas de tests de régression visuelle automatisés

**Verdict** : ❌ Rejeté — coût disproportionné vs valeur

### Option B : Librairie externe (pptx-template, docxtemplater)

- ✅ API plus simple (placeholders `{{title}}`)
- ❌ `pptx-template` : dernière release 2019, non maintenu
- ❌ `docxtemplater` : payant pour PPTX, licence commerciale
- ❌ Dépendance tierce = risque sécurité + bundle size

**Verdict** : ❌ Rejeté — dépendance risquée pour un dev solo

### Option C : Template codé (PptxGenJS structuré) ✅ RETENU

- ✅ Stable, testable, versionnable
- ✅ Pas de dépendance externe supplémentaire
- ✅ `defineSlideMaster()` crée de vrais masters dans le PPTX
- ✅ `themeBuilder.ts` prouve que le post-processing ZIP fonctionne
- ✅ Design System complet déjà en place (serenity.ts, 985 lignes)
- ⚠️ Nécessite discipline de design system (mais c'est déjà le cas)

**Verdict** : ✅ Retenu

---

## Décision

**Template codé PptxGenJS** avec Design System structuré.

Architecture actuelle (post #20 + #22) :

```
src/pptx/
├── designSystem/serenity.ts     # 985 lignes — tokens, coords, helpers
├── template/loadBaseTemplate.ts  # defineSlideMasters() — 4 masters
├── theme/themeBuilder.ts         # Post-processing ZIP (couleurs)
├── slides/                       # 11 builders (cover, chapter, content, ...)
└── export/exportStudyDeck.ts     # Orchestrateur principal
```

---

## Conséquences

1. **Tout template = code TypeScript** — pas de fichier `.pptx` binaire à maintenir
2. **Nouveau simulateur = nouveau builder** — réutilise masters + design system existants
3. **Maintenance = refactor code** — pas d'édition de fichier binaire opaque
4. **Post-processing ZIP reste possible** — pour injecter couleurs, métadonnées, etc.

---

## Spike archivé

Le code du spike est conservé dans `src/pptx/template/__spike__/` comme référence.  
Il peut être réactivé si un besoin futur justifie de revisiter cette décision.

---

*ADR rédigé suite au spike #17 — 2026-02-08*
