# D) Liste des Problèmes Identifiés - SER1 Repository

> Date : 2026-02-07  
> Classification par sévérité et domaine

---

## 🔴 Critiques (à traiter en priorité)

### PROB-001 : Barèmes DMTG incomplets (Issue #24)
- **Fichier** : `src/engine/succession.ts:86`
- **Impact** : Calculs de succession incorrects pour frères/sœurs et collatéraux
- **Risque** : Métier - Données fiscales erronées pour les clients
- **Effort** : M (3-5 jours)
- **Dépendances** : Nécessite validation métier des barèmes exacts

### PROB-002 : Chargement PPTX par reconstruction (Issue #17)
- **Fichier** : `src/pptx/template/loadBaseTemplate.ts:26`
- **Impact** : Génération PPTX sans template réel, rendu basique
- **Risque** : UX - Exports PPTX de qualité insuffisante
- **Effort** : L (1-2 semaines)
- **Blocage** : PPTXGenJS ne supporte pas nativement l'ouverture de fichiers PPTX

---

## 🟠 Majeurs (à planifier)

### PROB-003 : Logo conversion data URI (Issue #22)
- **Fichier** : `src/pptx/ops/applyCoverLogo.ts:113`
- **Impact** : Logos chargés depuis URLs externes (risque CORS/404)
- **Risque** : Fiabilité - Logos manquants dans les exports
- **Effort** : S (1 jour)
- **Solution** : Convertir en base64 au moment de l'upload ou du cache

### PROB-004 : Masters slides manquants (Issue #20)
- **Fichier** : `src/pptx/template/loadBaseTemplate.ts:74`
- **Impact** : Pas de master slides définies dans les exports PPTX
- **Risque** : UX - Formatage inconsistent des slides
- **Effort** : M (3-5 jours)

---

## 🟡 Mineurs (dettes techniques)

### PROB-005 : Dimensions slides implicites (Issue #19)
- **Fichier** : `src/pptx/template/loadBaseTemplate.ts:70`
- **Impact** : Dimensions gérées par défaut par PPTXGenJS
- **Risque** : Faible - comportement actuel stable
- **Effort** : XS (1-2 heures)
- **Statut** : ✅ **RÉSOLU** - Layout 16:9 explicitement défini

### PROB-006 : Vérification fichiers template (Issue #21)
- **Fichier** : `src/pptx/template/loadBaseTemplate.ts:88`
- **Impact** : Fonction retourne toujours `true`
- **Risque** : Faible - fichier toujours présent dans le build
- **Effort** : XS (1-2 heures)
- **Statut** : ✅ **RÉSOLU** - `isTemplateAvailable()` utilise fetch HEAD

### PROB-007 : Vérification images chapitre (Issue #23)
- **Fichier** : `src/pptx/ops/applyChapterImage.ts:130`
- **Impact** : Pas de validation réelle des fichiers images
- **Risque** : Faible - images statiques dans public/
- **Effort** : XS (1-2 heures)
- **Statut** : ✅ **RÉSOLU** - `isChapterImageAvailable()` utilise fetch HEAD

### PROB-008 : Code deprecated Settings.jsx (Issue #25)
- **Fichier** : `src/pages/Settings.jsx:262`
- **Impact** : Code de compatibilité V3.1 encore présent
- **Risque** : Dette technique - code mort
- **Effort** : XS (1 heure)
- **Statut** : ✅ **RÉSOLU** - Supprimé dans PR #25

---

## 🟢 Observations (non bloquantes)

### OBS-001 : Fichiers volumineux
| Fichier | Lignes | Statut |
|---------|--------|--------|
| `src/settings/ThemeProvider.tsx` | ~970 | 🔴 À refactorer |
| `src/pages/PlacementV2.jsx` | ~530 | 🔴 À refactorer |

> Ces fichiers ont été **exclus du scope** de cette session comme demandé.

### OBS-002 : Dépendances
- Aucune dépendance critique obsolète détectée
- Vite 5.x, React 18.x, Supabase à jour

### OBS-003 : Couverture de tests
- 71 tests passent (Vitest)
- Couverture limitée à `src/engine/**`
- Manque de tests sur PPTX et UI

---

## Synthèse par Domaine

| Domaine | Critiques | Majeurs | Mineurs | Total |
|---------|-----------|---------|---------|-------|
| Métier/Fiscal | 2 | 0 | 0 | 2 |
| PPTX/Export | 0 | 2 | 3 | 5 |
| UI/Compatibilité | 0 | 0 | 2 | 2 |

---

## Recommandations de Priorisation

### Sprint 1 (Semaine prochaine)
1. ~~**PROB-008** (#25) - Nettoyage Settings.jsx~~ ✅ **RÉSOLU**

### Sprint 2 (Mois prochain)
2. **PROB-001** (#24) - Barèmes DMTG (validation métier nécessaire)
3. **PROB-002** (#17) - Template PPTX natif (recherche solution)

### Backlog
- ~~PROB-005, 006, 007 (XS - résolus)~~ ✅ **RÉSOLUS**
- **PROB-003** (#22) - Logo data URI (1 jour)
- **PROB-004** (#20) - Masters slides (3-5 jours)

---

*Document généré suite à l'audit de hardening SER1*
