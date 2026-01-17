# Fix: Bug de déconnexion sur changement de focus (Settings)

## Date: 2026-01-09

## Problème
Après un changement de focus (changement d'onglet navigateur), les pages Settings affichaient "Chargement..." et le bouton "Se déconnecter" devenait non cliquable.

## Cause racine
**Double listener `onAuthStateChange`** causant des re-renders en cascade :
1. `AuthProvider.tsx` avait un listener `onAuthStateChange`
2. `ThemeProvider.tsx` avait AUSSI un listener `onAuthStateChange`

Quand l'utilisateur changeait de focus, ces listeners se déclenchaient et causaient des re-renders multiples de toute l'application, corrompant l'état de l'UI.

## Solution appliquée

### 1. Simplification de `AuthProvider.tsx`
- Remplacé par la version simple sans listeners `focus`/`visibility`/`pageshow`
- Fait confiance à Supabase pour gérer les sessions automatiquement via `autoRefreshToken: true`

### 2. Désactivation du listener dans `ThemeProvider.tsx`
- Commenté le `useEffect` avec `onAuthStateChange` (lignes 201-221)
- Le thème est maintenant chargé uniquement au montage initial via le premier `useEffect`

### 3. Simplification de `SettingsShell.jsx`
- Supprimé les logs de debug
- Supprimé le listener `popstate` inutile

## Fichiers modifiés
- `src/auth/AuthProvider.tsx` - Version simplifiée
- `src/settings/ThemeProvider.tsx` - Listener désactivé
- `src/pages/SettingsShell.jsx` - Simplifié

## Règle à retenir
**NE JAMAIS avoir plusieurs listeners `onAuthStateChange` dans l'application !**
Un seul listener dans `AuthProvider` suffit. Les autres composants doivent utiliser le contexte `useAuth()`.
