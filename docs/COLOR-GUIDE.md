# Gouvernance Couleurs - Guide Développeur

## Vue d'ensemble

SER1 utilise un système de **tokens sémantiques C1-C10** pour garantir la cohérence visuelle et faciliter la personnalisation des thèmes.

## 🎨 Tokens C1-C10 (Source de vérité)

| Token | Usage | Exemple SER1 Classic |
|-------|-------|---------------------|
| `c1` | Primary dark (fonds foncés, titres) | `#2B3E37` |
| `c2` | Primary medium (accents, boutons) | `#709B8B` |
| `c3` | Primary light | `#9FBDB2` |
| `c4` | Primary very light (surfaces secondaires) | `#CFDED8` |
| `c5` | Neutral medium | `#788781` |
| `c6` | Warm neutral (beige, accents chauds) | `#CEC1B6` |
| `c7` | Background light (fond de page) | `#F5F3F0` |
| `c8` | Border/separator | `#D9D9D9` |
| `c9` | Text secondary/muted | `#7F7F7F` |
| `c10` | Text primary | `#000000` |

Source : `src/settings/theme.ts`

## 🧰 Utilisation dans le code

### 1. Composants React (Recommandé)

```tsx
import { useTheme } from '../settings/ThemeProvider';
import { getSemanticColors } from '../styles/semanticColors';

function MyComponent() {
  const { colors } = useTheme();
  const semantic = getSemanticColors(colors);
  
  return (
    <div style={{ 
      backgroundColor: semantic['surface-card'],
      color: semantic['text-primary']
    }}>
      Contenu
    </div>
  );
}
```

### 2. Directement avec les tokens C1-C10

```tsx
import { DEFAULT_COLORS } from '../settings/theme';

// Dans les PPTX
const c1 = colors.c1.replace('#', '');
slide.background = { color: c1 };
```

### 3. Composants UI Tokenisés (Privilégié)

```tsx
import { Button, Card, Table, Badge, Alert } from '../components/ui';

// Ces composants utilisent automatiquement les tokens sémantiques
<Button variant="primary">Action</Button>
<Card variant="elevated">
  <Card.Header>Titre</Card.Header>
  Contenu
</Card>
```

## ⚠️ Règle Absolue

> **Aucune couleur hardcodée sauf `#FFFFFF` (WHITE) et `#996600` (WARNING)**

### ❌ Interdit
```tsx
// Ne jamais faire ceci
color: '#ff0000'
color: 'rgb(255, 0, 0)'
background: '#2B3E37' // Même les couleurs SER1 !
```

### ✅ Autorisé
```tsx
// Exceptions officielles
color: '#FFFFFF' // Texte sur fond foncé
color: '#996600' // Messages d'avertissement
```

## 🔧 Outils

### Audit des couleurs

```bash
node tools/scripts/audit-colors.mjs
```

Génère un rapport des couleurs hardcodées et de l'adoption des tokens.

### ESLint

Les règles ESLint sont configurées pour détecter les couleurs hardcodées :

```bash
npm run lint
```

Règles activées :
- `ser1-colors/no-hardcoded-colors`: Error
- `ser1-colors/use-semantic-colors`: Warning

## 📝 Mapping Sémantique

### UI (React)

| Rôle Sémantique | Token | Usage |
|-----------------|-------|-------|
| `accent-line` | c2 | Boutons primary, liens |
| `surface-card` | c7 | Cartes, panneaux |
| `surface-raised` | c4 | Surfaces surélevées |
| `text-primary` | c10 | Texte principal |
| `text-secondary` | c9 | Texte secondaire |
| `border-default` | c8 | Bordures standard |
| `border-strong` | c5 | Bordures accentuées |

### PPTX

| Rôle | Token | Usage |
|------|-------|-------|
| `bgMain` | c1 | Fond slide titre |
| `textMain` | c1/c10 | Titres, texte important |
| `accent` | c6 | Lignes d'accent, highlights |
| `panelBorder` | c8 | Bordures panneaux |

## 🆘 Aide

### Je dois ajouter une nouvelle couleur

1. Ne pas hardcoder !
2. Utiliser `getSemanticColors()` avec un rôle existant
3. Si vraiment nécessaire, ajouter un token C1-C10

### Comment migrer un hardcode existant ?

**Avant :**
```tsx
<div style={{ color: '#666666' }}>Text</div>
```

**Après :**
```tsx
const semantic = getSemanticColors(colors);
<div style={{ color: semantic['text-secondary'] }}>Text</div>
```

## 📚 Ressources

- [Gouvernance complète](../docs/color-governance.md)
- [Audit couleurs](../docs/color-audit.md)
- Composants UI : `src/components/ui/`
- Tokens : `src/styles/semanticColors.ts`
- Theme : `src/settings/theme.ts`
