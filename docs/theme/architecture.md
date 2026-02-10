# Architecture du Système de Thème

## Vue d'ensemble

Le système de thème SER1 gère les couleurs de l'interface et des exports PPTX à travers une hiérarchie de sources avec priorisation et caching.

> **V5 (2026-02-10)** : Modèle déterministe à 3 états (`cabinet` | `preset` | `my`). Voir [CHANGELOG.md](../CHANGELOG.md) pour l'historique.

## Accès aux données de thème

### Méthodes d'accès aux thèmes
| Source | Usage | Commande |
|--------|-------|----------|
| **Dashboard** | Voir/éditer les thèmes | https://supabase.com/dashboard → Project → Table Editor → themes |
| **CLI** | Inspecter les données | `supabase db shell --linked` → `SELECT * FROM themes;` |
| **RPC** | Charger les thèmes cabinet | `get_my_cabinet_theme_palette()` |
| **Application** | Interface utilisateur | `/settings/comptes` |

### Tables principales
| Table | Usage | Champs V5 |
|-------|-------|-----------|
| `themes` | Thèmes système et custom | `id`, `name`, `palette`, `is_system` |
| `ui_settings` | Préférences utilisateur | `theme_mode`, `preset_id`, `my_palette` |
| `cabinets` | Configuration cabinets | `default_theme_id`, `logo_id` |

## Architecture V5

### Fichiers Principaux

| Fichier | Rôle |
|---------|------|
| `src/settings/theme.ts` | **Source unique** des couleurs par défaut (DEFAULT_COLORS) |
| `src/settings/ThemeProvider.tsx` | Context React, gestion des modes, application CSS |
| `src/settings/presets.ts` | **Source unique** des thèmes prédéfinis (PRESET_THEMES) |
| `src/settings/theme/types.ts` | Types TypeScript (ThemeMode, ThemeContextValue, etc.) |
| `src/settings/theme/hooks/useCabinetTheme.ts` | Chargement des thèmes cabinet depuis Supabase |
| `src/settings/theme/hooks/useThemeCache.ts` | Cache localStorage avec TTL |

### Modèle Déterministe 3 États (V5)

| Mode | Description | DB Column | Usage |
|------|-------------|-----------|-------|
| `cabinet` | Thème du cabinet assigné | `theme_mode='cabinet'` | PPTX toujours, UI si sélectionné |
| `preset` | Thème prédéfini | `theme_mode='preset'` + `preset_id` | UI preset, `my_palette` préservé |
| `my` | Palette personnalisée | `theme_mode='my'` + `my_palette` | Palette perso de l'utilisateur |

### Flux de Chargement V5

```
AuthProvider (login/session change)
  ↓
ThemeProvider useEffect (loadTheme)
  ↓
Lire ui_settings (theme_mode, preset_id, my_palette)
  ↓
Switch déterministe :
  ├─ cabinet → RPC get_my_cabinet_theme_palette() → fallback original
  ├─ preset  → resolvePresetColors(preset_id) → fallback active_palette
  └─ my      → my_palette → fallback custom_palette (legacy)
  ↓
Cache localStorage (24h TTL)
  ↓
applyColorsToCSSWithGuard()
```

### API V5

```typescript
// Dans un composant
const { 
  themeMode,      // 'cabinet' | 'preset' | 'my'
  presetId,       // ex: 'gold-elite' | null
  myPalette,      // ThemeColors | null
  applyThemeMode, // (mode, presetId?) => Promise
  saveMyPalette,  // (colors) => Promise
} = useTheme();

// Appliquer un preset
await applyThemeMode('preset', 'gold-elite');

// Appliquer le cabinet
await applyThemeMode('cabinet');

// Sauvegarder ma palette (uniquement si themeMode='my')
await saveMyPalette(colors);
```

## Hiérarchie des Sources (Legacy V4 - gardée pour compat)

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
| User theme | `ser1_theme_cache_{userId}` | 24h | Thème actif (dernier mode appliqué) |
| Cabinet theme | `ser1_cabinet_theme_cache_{userId}` | 24h | Thème du cabinet |
| Cabinet logo | `ser1_cabinet_logo_cache_{userId}` | 24h | Logo du cabinet |

> **Règle** : Le cache est un **miroir** (anti-flash), pas une source de vérité. La DB (`theme_mode`) fait foi.

### Invalidation

Le cache est invalidé automatiquement après 24h ou manuellement lors de :
- Changement de cabinet (admin)
- Modification du thème personnalisé
- Réinitialisation du cache

## Règles Métier V5

### 1. Séparation "Appliqué" vs "Sauvegardé"
- **Appliqué** : `theme_mode` + `preset_id` + `active_palette` (dénormalisé)
- **Sauvegardé** : `my_palette` (uniquement quand l'utilisateur édite son thème)

### 2. Protection de `my_palette`
- Cliquer un preset **NE TOUCHE JAMAIS** `my_palette`
- "Enregistrer Mon thème" **UNIQUEMENT** si `themeMode='my'`

### 3. Tile "Mon thème"
- Visible dès que `my_palette` existe (même si un preset est actif)
- Preview basée sur `my_palette`, pas sur les couleurs actives

### 4. Backward Compatibility
- Lecture fallback : `custom_palette` → `my_palette`
- `selected_theme_ref='cabinet'` → `theme_mode='cabinet'`
- `selected_theme_ref='custom'` → `theme_mode='my'`

## Migration

Pour migrer de l'ancien système V4 :
1. Exécuter `database/migrations/202602100001_add_theme_mode.sql`
2. Le code lit automatiquement les anciennes colonnes en fallback
3. Les écritures se font dans les nouvelles colonnes

### Vérification post-migration
```bash
# Vérifier que les colonnes V5 existent
supabase db shell --linked -c "\d ui_settings"

# Vérifier les données
supabase db shell --linked -c "SELECT theme_mode, preset_id, my_palette FROM ui_settings LIMIT 5;"
```

## Debug

### Flags de Debug

```javascript
// Activer les logs
tlocalStorage.setItem('DEBUG_THEME_BOOTSTRAP', 'true');
```

### État du ThemeProvider

```javascript
// Dans DevTools
const { themeMode, presetId, myPalette } = useTheme();
console.log({ themeMode, presetId, myPalette });
```

## Bonnes Pratiques

1. **Jamais de couleurs hardcodées** sauf `WHITE` et `WARNING`
2. **Utiliser `useTheme()` hook** pour accéder aux couleurs ET au mode
3. **Vérifier le tri-état** avant d'utiliser `cabinetColors`
4. **Ne pas utiliser localStorage comme source de vérité** (seulement comme miroir)
5. **Utiliser les tokens sémantiques** via `getSemanticColors()`
