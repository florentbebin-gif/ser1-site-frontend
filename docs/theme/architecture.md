# Architecture du Système de Thème

## Vue d'ensemble

Le système de thème SER1 gère les couleurs de l'interface et des exports PPTX à travers une hiérarchie de sources avec priorisation et caching.

## Architecture

### Fichiers Principaux

| Fichier | Rôle |
|---------|------|
| `src/settings/theme.ts` | **Source unique** des couleurs par défaut (DEFAULT_COLORS) |
| `src/settings/ThemeProvider.tsx` | Context React, gestion des sources, application CSS |
| `src/settings/theme/hooks/useCabinetTheme.ts` | Chargement des thèmes cabinet depuis Supabase |
| `src/settings/theme/hooks/useThemeCache.ts` | Cache localStorage avec TTL |
| `src/settings/theme/types.ts` | Types TypeScript du système |

### Flux de Chargement

```
AuthProvider (login/session change)
  ↓
ThemeProvider useEffect
  ↓
ensureCabinetThemeFetch(userId)
  ↓
useCabinetTheme() → RPC get_my_cabinet_theme_palette()
  ↓
Cache localStorage (24h TTL)
  ↓
setCabinetColors() + applyColorsToCSSWithGuard()
```

## Hiérarchie des Sources (par priorité)

| Source | Rank | Description | Cas d'usage |
|--------|------|-------------|-------------|
| `cabinet-theme` | 3 | Thème du cabinet assigné | Utilisateur avec cabinet |
| `original-db` | 2 | Thème global de la DB | Utilisateur sans cabinet |
| `custom-palette` | 1 | Thème personnalisé user | Thème sauvegardé par l'utilisateur |
| `default` | 0 | Couleurs par défaut | Fallback système |

## États Tri-état

Le système utilise un tri-état pour `cabinetColors` :
- `undefined` : En cours de chargement
- `null` : Confirmé absence de cabinet
- `ThemeColors` : Palette du cabinet valide

## Cache

### Types de Cache

| Cache | Clé | TTL | Usage |
|-------|-----|-----|-------|
| User theme | `ser1_theme_cache_{userId}` | 24h | Thème personnalisé |
| Cabinet theme | `ser1_cabinet_theme_cache_{userId}` | 24h | Thème du cabinet |
| Cabinet logo | `ser1_cabinet_logo_cache_{userId}` | 24h | Logo du cabinet |

### Invalidation

Le cache est invalidé automatiquement après 24h ou manuellement lors de :
- Changement de cabinet (admin)
- Modification du thème personnalisé
- Réinitialisation du cache

## Application CSS

Les couleurs sont appliquées via CSS variables :
```css
:root {
  --color-c1: #1a73e8;
  --color-c2: #4285f4;
  /* ... */
}
```

La fonction `applyColorsToCSSWithGuard()` garantit que seules les valeurs valides sont appliquées.

## PPTX Integration

Les exports PPTX utilisent `resolvePptxColors()` pour :
- Mapper les couleurs UI vers les couleurs PPTX
- Gérer les cas de fallback
- Maintenir la cohérence visuelle

## Debug

### Flags de Debug

```javascript
// Dans DevTools
localStorage.setItem('debug', 'theme:*');
localStorage.setItem('debug', 'auth:*');
```

### Logs Clés

```javascript
console.log('[ThemeProvider] Loading cabinet theme:', { userId, cabinetColors });
console.log('[ThemeProvider] Cache hit:', getCabinetThemeFromCache(userId));
```

## Bonnes Pratiques

1. **Jamais de couleurs hardcodées** sauf `WHITE` et `WARNING`
2. **Utiliser `useTheme()` hook** pour accéder aux couleurs
3. **Vérifier le tri-état** avant d'utiliser `cabinetColors`
4. **Invalider le cache** après modification admin
5. **Utiliser les tokens sémantiques** via `getSemanticColors()`

## Migration

Pour migrer de l'ancien système :
1. Remplacer les couleurs hardcodées par `colors.c1`, `colors.c2`, etc.
2. Utiliser le hook `useTheme()` au lieu des imports directs
3. Gérer les états de chargement avec `isLoading`
