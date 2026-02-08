# Thèmes Cabinet

## Vue d'ensemble

Les thèmes cabinet permettent aux administrateurs de définir une palette de couleurs et un logo pour chaque cabinet. Les utilisateurs affectés à un cabinet voient automatiquement le thème appliqué dans l'interface et les exports PPTX.

## Architecture

### Flux de Changement de Cabinet

```
Admin change cabinet (SettingsComptes.jsx)
  ↓
handleAssignUserCabinet(userId, cabinetId)
  ↓
invokeAdmin('assign_user_cabinet', { user_id, cabinet_id })
  ↓
Edge Function admin → UPDATE user_profiles.cabinet_id
  ↓
[TODO] Invalider cache utilisateur cible
  ↓
User reconnect/reload → nouveau thème
```

### Cache Cabinet

Le cache des thèmes cabinet est indexé par `userId` :
```javascript
// Clé de cache
`ser1_cabinet_theme_cache_${userId}`

// Structure
{
  colors: ThemeColors,
  timestamp: Date.now()
}
```

**TTL** : 24 heures

## Problèmes Connus

### 1. Cache Non Invalidé

**Symptôme** : L'utilisateur change de cabinet mais garde l'ancien thème.

**Cause** : Le cache localStorage n'est pas vidé lors du changement de cabinet.

**Solution** : Ajouter l'invalidation du cache dans `handleAssignUserCabinet` :

```javascript
const handleAssignUserCabinet = async (userId, cabinetId) => {
  try {
    // Appel API existant
    await invokeAdmin('assign_user_cabinet', { user_id: userId, cabinet_id });
    
    // Invalider le cache de l'utilisateur cible
    localStorage.removeItem(`ser1_cabinet_theme_cache_${userId}`);
    localStorage.removeItem(`ser1_cabinet_logo_cache_${userId}`);
    
    triggerRefresh('assign_cabinet');
  } catch (err) {
    setError(err.message);
  }
};
```

### 2. Pas de Notification Temps Réel

**Symptôme** : L'utilisateur doit se déconnecter/reconnecter pour voir le nouveau thème.

**Cause** : Le système est pull-based uniquement.

**Solutions possibles** :
- **Realtime Supabase** : Écouter les changements `user_profiles.cabinet_id`
- **BroadcastChannel** : Notifier les autres tabs
- **Polling** : Vérifier périodiquement les changements

## Debug

### Vérifier le Cache

```javascript
// Dans DevTools Console
const userId = 'user-id-ici';
console.log('Cache cabinet:', localStorage.getItem(`ser1_cabinet_theme_cache_${userId}`));
console.log('Cache logo:', localStorage.getItem(`ser1_cabinet_logo_cache_${userId}`));
```

### Vider Manuellement le Cache

```javascript
localStorage.removeItem(`ser1_cabinet_theme_cache_${userId}`);
localStorage.removeItem(`ser1_cabinet_logo_cache_${userId}`);
```

### Logs de Debug

```javascript
// Dans ThemeProvider.tsx
console.log('[ThemeProvider] Cabinet theme loading:', {
  userId,
  cabinetColors,
  cached: getCabinetThemeFromCache(userId)
});
```

## Cas d'Usage

### 1. Création d'un Nouveau Cabinet

1. Admin crée le cabinet dans SettingsComptes
2. Associe un thème et un logo
3. Affecte des utilisateurs au cabinet
4. Les utilisateurs voient le thème au prochain login

### 2. Changement de Thème Cabinet

1. Admin modifie le thème du cabinet
2. Le cache expire après 24h OU est invalidé manuellement
3. Les utilisateurs voient le nouveau thème

### 3. Changement d'Affectation

1. Admin change l'utilisateur de cabinet
2. Le cache de l'utilisateur est invalidé
3. L'utilisateur voit le nouveau thème au prochain rechargement

## Bonnes Pratiques

1. **Toujours invalider le cache** après modification admin
2. **Utiliser le tri-état** pour gérer le chargement
3. **Prévoir un fallback** si le thème cabinet est indisponible
4. **Documenter les changements** dans les logs admin

## Tests

### Scénarios à Tester

- [ ] Changement de cabinet → cache vidé
- [ ] Utilisateur reconnecte → bon thème
- [ ] Export PPTX → bonnes couleurs/logo
- [ ] Cabinet sans thème → fallback original
- [ ] Cache expiré → rechargement automatique

### Commandes de Test

```bash
# Vider le cache pour un utilisateur
localStorage.removeItem('ser1_cabinet_theme_cache_user-id');
localStorage.removeItem('ser1_cabinet_logo_cache_user-id');

# Forcer le rechargement du thème
location.reload();
```
