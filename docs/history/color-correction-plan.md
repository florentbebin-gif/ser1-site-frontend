# Plan de Correction des Couleurs Hardcodées

> ⚠️ **HISTORIQUE — NE PAS SUIVRE POUR NOUVEAU DEV**
> Ce plan de correction a été partiellement exécuté (Phase 0). Les règles actuelles sont dans la gouvernance.
> **Source de vérité actuelle :** `docs/design/color-governance.md`

> **Date**: 2026-02-05  
> **Objectif**: Éliminer toutes les couleurs hardcodées non autorisées selon la gouvernance SER1  
> **Référence**: `docs/color-governance.md`

---

## 📋 Résumé Exécutif

**256 occurrences** de couleurs hexadécimales détectées dans **28 fichiers**.

### Classification
- ✅ **Légitimes** (définitions de thèmes) : ~136 occurrences
- ⚠️ **À corriger** (usage direct) : ~120 occurrences

---

## 🎯 Gouvernance Applicable

### Exceptions Autorisées (2 seulement)
| Exception | Valeur | Usage |
|-----------|--------|-------|
| `WHITE` | `#FFFFFF` | Fonds cards/panels, texte sur fond sombre |
| `WARNING` | `#996600` | Warning/alerte — hardcodé pour lisibilité universelle |

### Primitives Tolérées
| Primitive | Valeur | Usage | Condition |
|-----------|--------|-------|-----------|
| `OVERLAY` | `rgba(0,0,0,0.5)` | Backdrop modals | Uniquement overlays |
| `rgba(X,X,X,0.12-0.15)` | Shadows | À tokeniser prochainement |

### Règles Absolues
1. ❌ Aucun `#RRGGBB` en dehors des exceptions ci-dessus
2. ❌ Aucun `color: #xxx` ou `background: #xxx` direct
3. ✅ Utiliser exclusivement `var(--color-cX)` ou classes CSS
4. ✅ Les définitions de thèmes (`DEFAULT_COLORS`, `PREDEFINED_THEMES`) sont légitimes

---

## 📁 Inventaire Détaillé par Fichier

### Catégorie A : Définitions de Thèmes (LÉGITIMES)

| Fichier | Occurrences | Description | Action |
|---------|-------------|-------------|--------|
| `src/settings/theme.ts` | 10 | `DEFAULT_COLORS` C1-C10 | ✅ Aucune — Source de vérité |
| `src/pages/Settings.jsx` | 60 | `DEFAULT_COLORS`, `PREDEFINED_THEMES` | ✅ Aucune — Définitions de thèmes |
| `src/styles.css` (lignes 7-16) | 10 | Variables CSS `--color-c1` à `--color-c10` | ✅ Aucune — Infrastructure CSS |
| `src/utils/paletteGenerator.ts` | 20 | Utilitaires de génération | ✅ Aucune — Logic métier |
| `src/__tests__/themes-and-auth.test.ts` | 25 | Données de test | ✅ Aucune — Tests isolés |

**Total légitime**: ~125 occurrences

---

### Catégorie B : Hardcodes à Corriger (PAR PRIORITÉ)

#### 🔴 PRIORITÉ 0 (Critique — 5 minutes)

| # | Fichier | Ligne | Code Actuel | Correction | Justification |
|---|---------|-------|-------------|------------|---------------|
| 1 | `src/pages/StrategyPage.jsx` | 18 | `color: '#666'` | `color: 'var(--color-c9)'` | Texte secondaire doit utiliser C9 |
| 2 | `src/pages/Ir.jsx` | 1052 | `background: '#f3f3f3'` | `background: 'var(--color-c7)'` | Fond input readonly → C7 |

#### 🟠 PRIORITÉ 1 (Core CSS — 30 minutes)

**Fichier: `src/pages/Credit.css`**

| Ligne(s) | Code Actuel | Correction | Notes |
|----------|-------------|------------|-------|
| 21 | `color: #2b3e37` | `color: var(--color-c1)` | Titre header |
| 22 | `border-bottom: 4px solid var(--beige, #e8e0d5)` | `border-bottom: 4px solid var(--color-c6)` | Supprimer fallback hardcodé |
| 29 | `color: #222` | `color: var(--color-c10)` | Titre principal |
| 44 | `background: #fff` | `background: var(--color-c7)` | Menu dropdown |
| 45 | `border: 1px solid #c0b5aa` | `border: 1px solid var(--color-c6)` | Bordure dropdown |
| 47 | `box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12)` | `box-shadow: var(--shadow-md)` | Tokeniser shadow |
| 83 | `background: #fff` | `background: var(--color-c7)` | Card section |
| 108 | `color: #fff` | `color: var(--color-c7)` | Texte sur fond C1 (vérifier contraste) |
| 115 | `color: #fff` | `color: var(--color-c7)` | Texte sur fond C2 (vérifier contraste) |
| 116 | `box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15)` | `box-shadow: var(--shadow-sm)` | Tokeniser |
| 186 | `background: #fff` | `background: var(--color-c7)` | Input field |
| 193 | `box-shadow: 0 0 0 2px rgba(61, 122, 111, 0.12)` | `box-shadow: 0 0 0 2px rgba(var(--color-c2-rgb), 0.12)` | Ou utiliser C4 |
| 208 | `background: #fff` | `background: var(--color-c7)` | Select |
| 220 | `linear-gradient(135deg, var(--color-c7) 0%, #fff 100%)` | `linear-gradient(135deg, var(--color-c7) 0%, var(--color-c7) 100%)` | Ou utiliser WHITE |
| 240 | `border-bottom: 1px solid rgba(0, 0, 0, 0.06)` | `border-bottom: 1px solid var(--color-c8)` | Bordure subtile |
| 271-273 | `background: #fff7e6; border: 1px solid #e5c07b; color: #7a5a00` | **Garder tel quel OU** utiliser semantic tokens warning | ⚠️ Couleurs warning — décision requise |
| 315 | `background: #fff` | `background: var(--color-c7)` | Table wrapper |
| 361 | `background: rgba(43, 90, 82, 0.03)` | `background: rgba(var(--color-c1-rgb), 0.03)` | Hover row |
| 427 | `background: #fff` | `background: var(--color-c7)` | KPI card |

**Fichier: `src/pages/Ir.css`** (mêmes patterns que Credit.css)

| Ligne(s) | Code Actuel | Correction |
|----------|-------------|------------|
| ~17-24 | `#2b3e37`, `#222` | `var(--color-c1)`, `var(--color-c10)` |
| ~32 | `background: #fff` | `var(--color-c7)` |
| ~45 | `border: 1px solid #c0b5aa` | `var(--color-c6)` |
| Divers | Shadows rgba | Tokeniser |

#### 🟡 PRIORITÉ 2 (Alertes et États — 20 minutes)

**Fichier: `src/pages/Login.css`**

| Ligne(s) | Code Actuel | Correction | Stratégie |
|----------|-------------|------------|-----------|
| 166-168 | `background: #fff3f3; border: 1px solid #ffd3d3; color: #b00020` | Utiliser `--color-error-*` | Créer variables CSS si inexistantes |
| 176 | `background: #f0f9f0` | Utiliser `--color-success-bg` | Vérifier que le token existe |
| 177-178 | `border: 1px solid var(--color-c1); color: var(--color-c1)` | ✅ Déjà tokenisé | — |

**Fichier: `src/pages/Sous-Settings/SettingsComptes.jsx`**

| Ligne(s) | Code Actuel | Correction |
|----------|-------------|------------|
| 1077-1079 | `background: '#d4edda', border: '1px solid #c3e6cb', color: '#155724'` | `background: 'var(--color-success-bg)'`, etc. |
| 1101, 1117 | `backgroundColor: '#FFFFFF'` | `backgroundColor: 'var(--color-c7)'` |

#### 🟢 PRIORITÉ 3 (Styles globaux et Composants — 15 minutes)

**Fichier: `src/styles.css`**

| Ligne | Code Actuel | Correction | Notes |
|-------|-------------|------------|-------|
| 120 | `background: #FFFFFF` | ✅ **Exception autorisée** | Chips peuvent utiliser WHITE |
| 135 | `background: #f9f9f9` | `background: var(--color-c7)` | Hover chip |

**Fichier: `src/components/ExportMenu.css`**

| Ligne | Code Actuel | Correction |
|-------|-------------|------------|
| 61 | `background: var(--color-c8, #333)` | Supprimer fallback `#333` |
| 62 | `color: var(--color-c1, #fff)` | Supprimer fallback `#fff` |
| 78 | `border-right-color: var(--color-c8, #333)` | Supprimer fallback `#333` |

#### 🔵 PRIORITÉ 4 (Shadows et Avancé — 30 minutes)

| Fichier(s) | Pattern | Stratégie |
|------------|---------|-----------|
| `Credit.css`, `Ir.css`, `premium-shared.css` | `rgba(0, 0, 0, 0.12)`, `rgba(0, 0, 0, 0.15)`, etc. | **Option A**: Tokeniser avec `--shadow-sm/md/lg`  <br>**Option B**: Utiliser `rgba(var(--color-c10-rgb), 0.12)` |

---

## 📊 Statistiques par Priorité

| Priorité | Fichiers | Occurrences | Temps Estimé |
|----------|----------|-------------|--------------|
| P0 | 2 | 2 | 5 min |
| P1 | 2 (CSS core) | ~25 | 30 min |
| P2 | 3 (alertes) | ~8 | 20 min |
| P3 | 3 (global/composants) | ~5 | 15 min |
| P4 | 4 (shadows) | ~15 | 30 min |
| **Total** | **14** | **~55** | **~2h** |

---

## 🔧 Spécifications Techniques

### Variables CSS à Ajouter (si inexistantes)

```css
/* Dans src/styles.css */
:root {
  /* Shadows tokenisés */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 6px 20px rgba(0, 0, 0, 0.12);
  --shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.16);
  
  /* Couleurs RGB pour opacité (optionnel) */
  --color-c1-rgb: 43, 62, 55;
  --color-c2-rgb: 112, 155, 139;
  /* etc. pour C3-C10 */
}
```

### Définition des Alertes Sémantiques (à créer si besoin)

```css
.alert-error {
  background: var(--color-error-bg, var(--color-c7));
  border: 1px solid var(--color-error-border, var(--color-c8));
  color: var(--color-error-text, var(--color-c10));
}

.alert-success {
  background: var(--color-success-bg, var(--color-c4));
  border: 1px solid var(--color-success-border, var(--color-c8));
  color: var(--color-success-text, var(--color-c10));
}
```

---

## ✅ Checklist de Validation

### Pré-correction
- [ ] Sauvegarde de la branche actuelle
- [ ] Exécution des tests existants
- [ ] Capture d'écran des pages critiques (Credit, Ir, Login)

### Post-correction
- [ ] Build sans erreur (`npm run build`)
- [ ] Lint passe (`npm run lint`)
- [ ] Tests passent (`npm test`)
- [ ] Vérification visuelle manuelle sur 3 thèmes (Classic, Bleu, Vert)
- [ ] Contraste WCAG AA vérifié sur textes modifiés

---

## 🚀 Plan d'Exécution Proposé

### Option A : Par Priorité (Recommandé)
1. **P0** → Merge rapide, validation immédiate
2. **P1** → PR dédiée "Core CSS"
3. **P2+P3** → PR "Alertes et Global"
4. **P4** → PR "Tokenisation Shadows"

### Option B : Par Fichier
1. Corriger tous les hardcodes fichier par fichier
2. Un commit par fichier
3. Validation finale globale

---

## 📝 Notes de Décision

### Points de vigilance
1. **Texte blanc sur C1/C2** (lignes 108, 115 de Credit.css) : Vérifier que C1/C2 sont assez foncés, sinon utiliser helper de contraste
2. **Warnings** (ligne 271-273 Credit.css) : Couleurs `#fff7e6/#e5c07b/#7a5a00` sont proches de WARNING mais pas identiques — décider si on uniformise sur WARNING ou on garde
3. **Shadows** : Choix entre tokenisation complète ou utilisation de C10 avec opacité

### Questions pour le PO/Design
1. Les alertes warning doivent-elles strictement utiliser `#996600` ou peut-on dériver de C6 ?
2. Les shadows doivent-ils s'adapter au thème (utiliser C10) ou rester neutres (noir) ?

---

*Document généré le 2026-02-05 — À valider avant exécution*
