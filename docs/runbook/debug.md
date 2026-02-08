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

---

## CI/CD E2E Debugging

Guide de configuration et debug des tests E2E sur GitHub Actions.

### Configuration des secrets GitHub Actions

**Requis pour les tests E2E :**
1. Allez dans **Settings → Secrets and variables → Actions**
2. Cliquez **New repository secret** pour chaque variable :

| Secret | Description | Source |
|--------|-------------|--------|
| `VITE_SUPABASE_URL` | URL Supabase du projet | `.env.local` |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme Supabase | `.env.local` |
| `E2E_EMAIL` | Email compte de test | Créer un compte dédié |
| `E2E_PASSWORD` | Mot de passe compte de test | Idem |

### Relancer un workflow E2E

**Option 1 : Push sur main (déclenchement auto)**
```bash
git commit --allow-empty -m "chore: trigger E2E rerun"
git push
```

**Option 2 : Re-run depuis l'interface GitHub**
1. Allez dans **Actions → E2E Tests**
2. Sélectionnez le run échoué
3. Cliquez **Re-run jobs** (bouton en haut à droite)
4. Choisissez **Re-run failed jobs** ou **Re-run all jobs**

### Télécharger et analyser les traces

**1. Download des artifacts (si le workflow a échoué)**
- Les artifacts sont uploadés avec `if: always()` (même en cas d'échec)
- Cliquez sur le run → Section **Artifacts** → Téléchargez `playwright-report`

**2. Ouvrir le rapport HTML**
```bash
# Dézipper l'artifact
unzip playwright-report.zip -d playwright-report/

# Lancer le serveur de rapport
npx playwright show-report playwright-report/
# ou
npx playwright show-report playwright-report/playwright-report/
```

**3. Ouvrir les traces (trace.zip)**
Les traces sont dans `test-results/` et permettent de voir :
- Screenshots écran par écran
- Actions Playwright chronologiques
- Network logs
- Console logs

```bash
# Ouvrir une trace spécifique
npx playwright show-trace test-results/auth-login-fails/trace.zip
```

**Ou visuellement :**
1. Ouvrez `playwright-report/index.html` dans le navigateur
2. Cliquez sur un test échoué
3. La trace s'ouvre avec timeline, screenshots, et DOM

### Diagnostic rapide des erreurs communes

| Erreur | Cause probable | Fix |
|--------|---------------|-----|
| `VITE_SUPABASE_URL missing` | Secrets non configurés | Ajouter les 4 secrets GitHub |
| `login-* selectors not found` | Auth échoue (pas de compte) | Vérifier E2E_EMAIL / E2E_PASSWORD |
| `net::ERR_CONNECTION_REFUSED` | Le serveur preview ne démarre pas | Vérifier le build passe d'abord |
| `timeout exceeded` | Serveur lent ou crash | Augmenter timeout dans playwright.config.ts |
