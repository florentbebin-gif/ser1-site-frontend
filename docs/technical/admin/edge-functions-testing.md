# Guide de test Edge Function admin

## Accès et Déploiement

### Prérequis
- **Supabase CLI** installée localement (`supabase --version`)
- **Docker Desktop** en cours d'exécution pour tests locaux
- **Projet lié** : `supabase link --project-ref xnpbxrqkzgimiugqtago`

### Déploiement
```bash
# Déployer depuis la racine (organisation standard Supabase)
npx supabase functions deploy admin --project-ref xnpbxrqkzgimiugqtago

# Vérifier le déploiement
supabase functions list
```

## Test via Dashboard Supabase

1. **Accéder au Dashboard** :
   - https://supabase.com/dashboard
   - Projet "SER1-Simulator" (xnpbxrqkzgimiugqtago)
   - Section Functions → admin

2. **Tester dans l'interface** :
   - Cliquer sur "Test"
   - Headers : `Authorization: Bearer VOTRE_JETON_ADMIN`
   - Body :
   ```json
   {
     "action": "list_users"
   }
   ```

3. **Vérifier les logs** :
   - Dashboard > Functions > Logs
   - Chercher les messages : `Method: POST, Action: list_users, Body vide: false`

## Test via CLI locale

```bash
# Test depuis le dossier racine
supabase functions invoke admin --project-ref xnpbxrqkzgimiugqtago \
  --data '{"action": "ping_public"}'

# Test avec authentification admin
supabase functions invoke admin --project-ref xnpbxrqkzgimiugqtago \
  --data '{"action": "list_users"}' \
  --headers '{
    "Authorization": "Bearer VOTRE_JETON_ADMIN"
  }'
```

## Test via l'application

1. **Se connecter comme admin** :
   - Vérifier que `app_metadata.role = 'admin'`

2. **Aller sur /settings/comptes** :
   - La page doit charger la liste des utilisateurs
   - Pas d'erreur "Edge Function returned a non-2xx status code"

3. **Tester les actions** :
   - Créer un utilisateur
   - Reset password
   - Voir les signalements

## Dépannage

### Si erreur 500 persiste
1. Vérifier les logs dans Supabase Dashboard
2. Vérifier que le body contient bien `{"action": "..."}`
3. Vérifier que le token JWT est valide

### Si erreur "Missing action"
1. Le body est vide ou mal formaté
2. Vérifier l'appel `supabase.functions.invoke('admin', { body: { action: '...' } })`

### Si erreur "Admin access required"
1. L'utilisateur n'a pas le rôle admin
2. Vérifier `app_metadata.role = 'admin'` dans la table auth.users
