# Debug Flags & Console Policy

## Politique Console en Production (VERROUILLÉE ✅)

### Résumé (Politique Soft mais Bloquante)

| Méthode | En prod | ESLint | Condition |
|---------|---------|--------|-----------|
| `console.error` | ✅ Autorisé | ✅ Allow | Erreurs critiques, support |
| `console.warn` | ✅ Autorisé | ✅ Allow | Avertissements actionnables |
| `console.log` | ❌ Interdit | ❌ ERROR | Jamais en prod (sauf eslint-disable avec justification) |
| `console.debug` | ❌ Interdit | ❌ ERROR | Sous DEV ou flag DEBUG uniquement |
| `console.info` | ❌ Interdit | ❌ ERROR | Sous DEV ou flag DEBUG uniquement |
| `console.trace` | ❌ Interdit | ❌ ERROR | Jamais en prod |

### Règle ESLint (bloquante)

```javascript
// eslint.config.js
'no-console': ['error', { allow: ['warn', 'error'] }]
```

**Conséquence** : Le build échoue si un `console.log/debug/info/trace` non protégé est introduit.

---

## Debug Flags

Les flags de debug permettent d'activer des logs détaillés pour le développement et le diagnostic.

### Comment activer (sans modifier le code)

**Option 1 : Variable d'environnement (recommandée)**
```bash
# .env.local
VITE_DEBUG_AUTH=1
VITE_DEBUG_PPTX=1
VITE_DEBUG_COMPTES=1
```

**Option 2 : localStorage (runtime)**
```javascript
// Dans la console du navigateur
localStorage.setItem('SER1_DEBUG_AUTH', '1');      // Activer auth
localStorage.setItem('SER1_DEBUG_PPTX', '1');      // Activer PPTX
localStorage.setItem('SER1_DEBUG_COMPTES', '1');   // Activer comptes
localStorage.setItem('SER1_DEBUG_ADMIN', '1');     // Activer admin
localStorage.removeItem('SER1_DEBUG_AUTH');        // Désactiver
```

### Flags disponibles

| Flag | Variable env | localStorage | Effet | Fichiers concernés |
|------|--------------|--------------|-------|-------------------|
| `auth` | `VITE_DEBUG_AUTH` | `SER1_DEBUG_AUTH` | Logs auth (session, refresh, erreurs) | `supabaseClient.js`, `AuthProvider.tsx`, `App.jsx`, `useUserRole.ts`, `Settings.jsx` |
| `pptx` | `VITE_DEBUG_PPTX` | `SER1_DEBUG_PPTX` | Logs export PPTX (deck building) | `creditDeckBuilder.ts`, `irDeckBuilder.ts` |
| `comptes` | `VITE_DEBUG_COMPTES` | `SER1_DEBUG_COMPTES` | Logs refresh comptes admin | `SettingsComptes.jsx` |
| `admin` | `VITE_DEBUG_ADMIN` | `SER1_DEBUG_ADMIN` | Logs admin/fetch | `isAbortError.js` |
| `admin_fetch` | `VITE_DEBUG_ADMIN_FETCH` | `SER1_DEBUG_ADMIN_FETCH` | Logs fetch admin | `isAbortError.js` |

### Valeurs acceptées

- `'1'`, `'true'`, `true` → Activé
- Absent, `'0'`, `'false'`, `false` → Désactivé

---

## Helper Debug Flags

Le fichier `src/utils/debugFlags.ts` fournit une API unifiée :

```typescript
import { isDebugEnabled, debugLog } from './utils/debugFlags';

// Vérifier si un flag est actif
if (isDebugEnabled('auth')) {
  // eslint-disable-next-line no-console
  console.debug('[Auth] Session refreshed');
}

// Ou utiliser le helper directement
debugLog('auth', 'Session refreshed', { userId: user.id });
```

---

## Pratiques recommandées

### 1. Logs développement uniquement
```typescript
if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.debug('[Debug] Info de développement');
}
```

### 2. Logs derrière flag DEBUG
```typescript
import { isDebugEnabled } from './utils/debugFlags';

const DEBUG_AUTH = isDebugEnabled('auth');

if (DEBUG_AUTH) {
  // eslint-disable-next-line no-console
  console.debug('[Auth] Session updated:', session);
}
```

### 3. Erreurs conservées en prod
```typescript
// Toujours logger les erreurs critiques (pas besoin de eslint-disable)
try {
  await riskyOperation();
} catch (error) {
  console.error('[Module] Operation failed:', error);
}
```

### 4. Avertissements actionnables
```typescript
// Garder si ça aide l'utilisateur ou le support (pas besoin de eslint-disable)
console.warn('[ThemeProvider] Cache read error:', e);
```

---

## Vérification pre-commit

```bash
# Vérifier les console.log restants
rg "console\.(log|debug|info|trace)" src --type-add 'src:*.{js,jsx,ts,tsx}' -tsrc

# Lint (doit passer sans erreur)
npm run lint

# Build (doit passer)
npm run build
```

---

## Statut Roadmap Post-Stabilisation

| Sujet | Statut |
|-------|--------|
| Politique console en prod | ✅ Verrouillée (ESLint error) |
| Réduction consoles src | ✅ Terminée |
| Helper debugFlags | ✅ Créé et intégré |
| Checklist debug flags | ✅ Documentée |
| Documentation | ✅ À jour |
