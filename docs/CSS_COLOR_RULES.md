# Règles de gestion des couleurs codées en dur

## 📏 RÈGLE FONDAMENTALE - BLANC AUTORISÉ

**Le blanc codé en dur (#FFFFFF, #fff, #ffffff) DOIT rester inchangé**

### Raison :
- Le blanc est une constante UI universelle
- Il ne dépend pas du thème choisi
- Il garantit la lisibilité et l'accessibilité de base
- Changer le blanc casserait l'interface visuellement

### Formats autorisés :
- `#FFFFFF`
- `#fff` 
- `#ffffff`
- `white`

---

## 🎨 COULEURS À REMPLACER (OBLIGATOIRE)

Toutes les couleurs SAUF le blanc doivent être remplacées par des variables CSS :

### Couleurs interdites (à remplacer) :
- `#000000`, `#000`, `#000000` → `var(--color-c10)`
- `#333333`, `#333` → `var(--color-c10)`
- `#555555`, `#555` → `var(--color-c9)`
- `#777777`, `#777` → `var(--color-c9)`
- `#888888`, `#888` → `var(--color-c9)`
- `#999999`, `#999` → `var(--color-c9)`
- Toutes les nuances de gris sauf blanc
- Toutes les couleurs thématiques (vert, bleu, rouge, jaune, etc.)

### Exceptions autorisées :
- **rgba()** pour les ombres et transparences complexes
- **hsl()** si utilisé pour des calculs dynamiques
- **border: 1px solid transparent** (pas une couleur réelle)

---

## 🔧 MÉTHODE DE REMPLACEMENT

### Variables CSS à utiliser :
- `var(--color-c1)` : Couleur principale (texte, éléments importants)
- `var(--color-c2)` : Couleur secondaire (accents, actions)
- `var(--color-c3)` : Couleur tertiaire (survol, focus)
- `var(--color-c4)` : Couleur claire (backgrounds secondaires)
- `var(--color-c5)` : Couleur neutre (bordures, séparateurs)
- `var(--color-c6)` : Couleur très claire (subtles)
- `var(--color-c7)` : Background principal (remplace le blanc dans les conteneurs)
- `var(--color-c8)` : Bordures et lignes
- `var(--color-c9)` : Texte secondaire/muted
- `var(--color-c10)` : Texte principal

### Exemples de remplacement :
```css
/* ❌ À CORRIGER */
background: #f5f5f5;
color: #555;
border: 1px solid #ddd;

/* ✅ CORRECT */
background: var(--color-c7);
color: var(--color-c9);
border: 1px solid var(--color-c8);
```

---

## ⚠️ CAS PARTICULIERS

### 1. Blanc dans les gradients
```css
/* ❌ NE PAS CHANGER */
background: linear-gradient(90deg, #fff 0%, var(--color-c7) 100%);

/* ✅ CORRECT */
background: linear-gradient(90deg, #fff 0%, var(--color-c7) 100%);
```

### 2. Blanc pour les overlays
```css
/* ❌ NE PAS CHANGER */
background: rgba(255, 255, 255, 0.9);

/* ✅ CORRECT */
background: rgba(255, 255, 255, 0.9);
```

### 3. Blanc pour les icônes SVG
```css
/* ❌ NE PAS CHANGER */
fill: #ffffff;

/* ✅ CORRECT */
fill: #ffffff;
```

---

## 🚀 AUTOMATISATION

### Script de recherche :
```bash
# Trouver les couleurs à remplacer (sauf blanc)
grep -r "#[0-9a-fA-F]\{3,6\}" src/ | grep -v "#fff\|#FFFFFF\|#ffffff"
```

### Script de remplacement :
```bash
# Exemple pour les gris
find src/ -name "*.css" -exec sed -i 's/#555/var(--color-c9)/g' {} \;
```

---

## 📋 CHECKLIST AVANT VALIDATION

- [ ] Aucune couleur hexadécimale sauf blanc
- [ ] Tous les gris utilisent var(--color-cX)
- [ ] Toutes les couleurs thématiques utilisent var(--color-cX)
- [ ] Le blanc (#fff, #FFFFFF) est conservé
- [ ] Les rgba/ombres sont conservés si complexes
- [ ] L'interface reste lisible avec tous les thèmes

---

## 🎯 OBJECTIF

Garantir que :
1. **Le blanc reste blanc** (constante UI)
2. **Toutes les autres couleurs suivent le thème**
3. **L'interface est cohérente** quel que soit le thème choisi
4. **L'accessibilité est préservée**

---

*Règle créée le 03/01/2026 - À appliquer systématiquement*
