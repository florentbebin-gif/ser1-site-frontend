# 🛠️ Rapport de correction : Theme Flash & Concurrent Writes

## 1. Diagnostic : Sources d'écriture du thème

Après analyse complète du code, voici les sources d'écriture identifiées :

### ✅ Source Autoritaire (Légitime)
*   **`src/settings/ThemeProvider.tsx`** : Gère le chargement initial (Cache), les mises à jour `ui_settings` via Supabase, et les changements d'état Auth. C'est la seule source qui devrait écrire le thème automatiquement.

### ❌ Écriture Concurrente (Corrigée)
*   **`src/pages/Settings.jsx`** : 
    *   **Problème** : Au montage du composant (`useEffect`), il récupérait `user_metadata.theme_colors` (données potentiellement obsolètes ou dupliquées) et appelait `setColors(merged)`.
    *   **Conséquence** : Cela écrasait le thème fraîchement chargé par `ThemeProvider` depuis `ui_settings`, provoquant le saut visible "APPLY ui_settings -> APPLY setColors-manual" et potentiellement des incohérences.
    *   **Correctif** : Suppression de l'appel `setColors(merged)` dans le `useEffect` de chargement. Le composant `Settings` ne fait désormais que **lire** le thème courant via `useTheme()` pour initialiser ses contrôles.

### ⚠️ Code Mort / Obsolète (Sans impact actuel)
*   **`src/components/ThemeCustomizer.jsx`** : Utilise un ancien hook `src/hooks/useTheme.js` (marqué désactivé). Ce composant n'est pas utilisé dans l'arbre principal (`App.jsx`).
*   **`src/settings/theme.ts`** : Contient des helpers (`applyThemeToCss`) mais ne sont pas appelés automatiquement au runtime.

## 2. Actions Correctives

### A) Patch `src/pages/Settings.jsx`
*   Suppression de la logique qui ré-appliquait le thème au chargement de l'utilisateur.
*   Conservation de la logique de lecture pour pré-remplir les champs du formulaire.
*   Conservation de la logique d'écriture **uniquement** lors d'une action explicite de l'utilisateur (modification via les pickers ou clic sur "Enregistrer").

### B) Nettoyage `src/settings/ThemeProvider.tsx`
*   Retrait des `console.trace` de débogage.
*   La logique de protection contre les doubles applications (`applyColorsToCSSWithGuard`) et la priorité au Cache sont maintenues.

## 3. Validation et Tests

### Checklist de vérification

1.  **Navigation** : 
    *   Naviguer entre `Accueil` et `Paramètres`.
    *   **Résultat attendu** : Aucun flash, aucune mention `setColors-manual` dans la console lors de la navigation.

2.  **Connexion** :
    *   Se déconnecter -> Se reconnecter.
    *   **Résultat attendu** : 
        *   Chargement immédiat du cache (si présent).
        *   `SIGNED_IN` déclenche une vérification `ui_settings`.
        *   **Pas** d'appel parasite `setColors-manual`.

3.  **Modification du thème** :
    *   Aller dans `Paramètres`, changer une couleur.
    *   **Résultat attendu** : `setColors-manual` apparaît (normal, c'est une action utilisateur).
    *   Sauvegarder -> Recharger la page (F5).
    *   **Résultat attendu** : Le thème personnalisé s'affiche instantanément (via Cache).

### Concernant le "Unmounting" du ThemeProvider
Le `ThemeProvider` est situé dans `main.jsx`, à la racine. S'il se démonte, c'est généralement dû à :
*   Un rechargement complet de la page (F5).
*   Le Hot Module Replacement (HMR) de Vite en développement lors de la modification de fichiers racines.
*   Il n'y a pas de remontage inattendu détecté dans la structure de production (`App.jsx`).

## 4. Conclusion
Le conflit de "lutte d'influence" entre `ThemeProvider` et `Settings` est résolu. `ThemeProvider` est désormais l'unique source de vérité pour l'application du thème au chargement.
