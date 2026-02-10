# Troubleshooting Thème

## Accès et Debug

### Outils de diagnostic
| Outil | Usage | Commande |
|-------|-------|----------|
| **Dashboard Supabase** | Vérifier tables/ui_settings | https://supabase.com/dashboard → Project → Table Editor |
| **CLI** | Inspecter la base locale | `supabase db shell --linked` |
| **Browser DevTools** | Inspecter les CSS variables | `document.documentElement.style.getPropertyValue('--color-c1')` |

### Flags de Debug

```javascript
// Activer les logs de thème
localStorage.setItem('DEBUG_THEME_BOOTSTRAP', 'true');

// Activer les logs d'auth
localStorage.setItem('DEBUG_AUTH', 'true');
```

## Problèmes Courants

### 1. Input Controlled → Uncontrolled

**Symptôme** :
```
Warning: A component is changing a controlled input to be uncontrolled.
This is likely caused by the value changing from a defined to undefined.
```

**Cause** : Les inputs de couleur dans Settings.jsx reçoivent des valeurs `undefined`.

**Solution** : Ajouter des fallbacks dans les inputs :

```javascript
// Au lieu de :
value={colorsLegacy.color1}

// Utiliser :
value={colorsLegacy.color1 ?? '#000000'}
```

**Fichier** : `src/pages/Settings.jsx` lignes 575, 629

---

### 2. Thème Personnalisé Non Initialisé

**Symptôme** : En passant en "Personnalisé", les couleurs disparaissent.

**Cause** : `customPalette` est `null` et le code ne fait rien.

**Solution** : Utiliser les couleurs actuelles comme base :

```javascript
const basePalette = customPalette || {
  c1: colorsLegacy.color1 ?? DEFAULT_COLORS.c1,
  c2: colorsLegacy.color2 ?? DEFAULT_COLORS.c2,
  // ... etc
};
```

**Fichier** : `src/pages/Settings.jsx` lignes 363-374

---

### 3. Cache Cabinet Non Invalidé

**Symptôme** : L'utilisateur change de cabinet mais garde l'ancien thème.

**Cause** : Le cache localStorage n'est pas vidé après le changement de cabinet.

**Solution** : Invalider le cache dans `handleAssignUserCabinet` :

```javascript
// Dans SettingsComptes.jsx
localStorage.removeItem(`ser1_cabinet_theme_cache_${userId}`);
localStorage.removeItem(`ser1_cabinet_logo_cache_${userId}`);
```

---

### 4. Thème Non Chargé au Login

**Symptôme** : L'utilisateur voit le thème par défaut au lieu du thème cabinet.

**Cause** : Plusieurs possibilités :
- `cabinetThemeLoadedRef` empêche le rechargement
- Cache invalide mais pas de retry
- Erreur RPC silencieuse

**Debug** :

```javascript
// Dans ThemeProvider.tsx
console.log('[ThemeProvider] Loading theme:', {
  userId,
  cabinetColors,
  cached: getCabinetThemeFromCache(userId),
  loadedRef: cabinetThemeLoadedRef.current
});
```

---

### 5. Couleurs CSS Non Appliquées

**Symptôme** : Les couleurs CSS variables ne sont pas mises à jour.

**Cause** : `applyColorsToCSSWithGuard()` échoue silencieusement.

**Debug** :

```javascript
// Vérifier les variables CSS
document.documentElement.style.getPropertyValue('--color-c1');
document.documentElement.style.getPropertyValue('--color-c2');
```

---

## Outils de Debug

### Flags de Debug

```javascript
// Activer les logs de thème
localStorage.setItem('debug', 'theme:*');

// Activer les logs d'auth
localStorage.setItem('debug', 'auth:*');
```

### Inspection du Cache

```javascript
// Vérifier tous les caches de thème
Object.keys(localStorage)
  .filter(key => key.includes('theme_cache_'))
  .forEach(key => console.log(key, localStorage.getItem(key)));
```

### État du ThemeProvider

```javascript
// Dans DevTools, inspecter le contexte React
// ou ajouter un log temporaire :
console.log('[ThemeProvider] State:', {
  colorsState,
  cabinetColors,
  themeSource,
  isLoading
});
```

## Commandes Rapides

### Vider le Cache

```javascript
// Vider tous les caches thème
Object.keys(localStorage)
  .filter(key => key.includes('theme_cache_') || key.includes('cabinet_'))
  .forEach(key => localStorage.removeItem(key));
```

### Forcer le Reload du Thème

```javascript
// Réinitialiser les refs et recharger
if (window.__ser1ThemeProvider) {
  window.__ser1ThemeProvider.reloadTheme();
}
```

### Réinitialiser le Thème par Défaut

```javascript
localStorage.removeItem('ser1_theme');
localStorage.removeItem('ser1_theme_scope');
location.reload();
```

## Checklist de Diagnostic

### Étape 1 : Vérifier l'état de base
- [ ] L'utilisateur est connecté ?
- [ ] `userId` est défini ?
- [ ] `isLoading` est `false` ?

### Étape 2 : Vérifier les sources
- [ ] `themeSource` est correct ?
- [ ] `cabinetColors` est défini ?
- [ ] `customPalette` est défini ?

### Étape 3 : Vérifier le cache
- [ ] Cache présent dans localStorage ?
- [ ] Cache non expiré ?
- [ ] Cache valide (JSON) ?

### Étape 4 : Vérifier l'application
- [ ] Variables CSS appliquées ?
- [ ] Couleurs visibles dans l'UI ?
- [ ] Pas d'erreurs dans la console ?

### Étape 5 : Vérifier les exports
- [ ] PPTX utilise les bonnes couleurs ?
- [ ] Logo du cabinet présent ?

## Problèmes Spécifiques

### React Strict Mode

**Problème** : Double render en développement cause des incohérences.

**Solution** : Les hooks sont protégés contre les double appels.

### Navigation Rapide

**Problème** : Le thème se perd lors de la navigation rapide.

**Solution** : Le contexte React maintient l'état entre les pages.

### Mode Incognito

**Problème** : Le cache ne fonctionne pas en mode incognito.

**Solution** : Le système fonctionne sans cache (rechargement systématique).

## Support

Si le problème persiste après ces vérifications :

1. **Capturer les logs** de la console
2. **Vérifier l'état** du ThemeProvider
3. **Vider le cache** et tester
4. **Ouvrir un ticket** avec les détails du problème
