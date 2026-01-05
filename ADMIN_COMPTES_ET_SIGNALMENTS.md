# Gestion Admin des Comptes et Signalements

## 1. Vue d'ensemble

### Rôle de la page `/settings/comptes`
Interface d'administration réservée aux utilisateurs avec rôle `admin` permettant de :
- **Gérer les comptes** : lister, créer (invitation), supprimer, réinitialiser mot de passe
- **Gérer les signalements** : voir les signalements non lus, afficher les détails, marquer comme lus

### Pourquoi une Edge Function unique "admin"
- **Sécurité** : Centralise toutes les opérations admin avec vérification JWT côté serveur
- **Pas de secret client** : Le `service_role_key` n'est jamais exposé dans le frontend
- **Maintenance** : Un seul point de déploiement et de monitoring

### Permissions admin
- ✅ **Peut faire** : CRUD utilisateurs, lire tous les signalements, marquer comme lu
- ❌ **Ne peut pas faire** : Modifier les signalements, voir les mots de passe, accéder aux données privées hors signalements

## 2. Architecture globale

```
Frontend (React)
├── src/pages/SettingsNav.jsx          → Tab "Comptes" admin-only
├── src/pages/Sous-Settings/SettingsComptes.jsx → Page principale
├── src/pages/Sous-Settings/SettingsComptes.css → Styles
├── src/App.jsx                        → Route /settings/comptes protégée
└── src/auth/useUserRole.ts            → Vérification isAdmin

Backend (Supabase)
├── supabase/functions/admin/index.ts  → Edge Function unique
├── public.issue_reports               → Table avec admin_read_at
├── RLS policies                       → Sécurité accès
└── Auth Admin API                     → CRUD utilisateurs

Base de données
├── auth.users                         → Table utilisateurs Supabase
├── public.issue_reports              → Signalements utilisateurs
└── app_metadata.role = 'admin'       → Définit rôle admin
```

## 3. Prérequis Supabase

### 3.1 Obtenir le project_ref
```bash
# Dans Supabase Dashboard > Settings > General
# Copier "Project reference" (ex: abcdefghijklmnopqrstuvwxyz)
```

### 3.2 Configuration CLI
```bash
# Installer CLI si nécessaire
npm install -g supabase

# Se connecter
supabase login

# Lier le projet local
supabase link --project-ref VOTRE_PROJECT_REF

# Vérifier la connexion
supabase status
```

### 3.3 Secrets obligatoires
⚠️ **ATTENTION** : `SUPABASE_SERVICE_ROLE_KEY` ne doit PAS être préfixé avec `SUPABASE_` dans `supabase secrets set`

```bash
# INCORRECT (ne fonctionne pas)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...

# CORRECT
supabase secrets set SERVICE_ROLE_KEY=eyJ...

# Vérifier les secrets
supabase secrets list
```

**Pourquoi ?** Supabase ajoute automatiquement le préfixe `SUPABASE_` aux secrets. Si vous l'ajoutez vous-même, il devient `SUPABASE_SUPABASE_SERVICE_ROLE_KEY` et n'est pas trouvé.

## 4. SQL - Référentiel unique

### 4.1 Script REJOUABLE
Le fichier `admin_setup.sql` est conçu pour être exécuté plusieurs fois sans erreur :
- `IF NOT EXISTS` pour la colonne
- `CREATE INDEX IF NOT EXISTS`
- `DROP POLICY IF EXISTS` avant recréation

### 4.2 Ce que fait le SQL
1. **Ajoute la colonne** `admin_read_at` à `public.issue_reports` (timestamp de lecture par admin)
2. **Crée un index** sur `admin_read_at` pour les requêtes de signalements non lus
3. **Configure les RLS policies** :
   - Users : CRUD sur leurs propres signalements uniquement
   - Admins : Lecture + update `admin_read_at` sur tous les signalements

### 4.3 Exécution
```bash
# Via Supabase Dashboard > SQL Editor
# Copier-coller le contenu de admin_setup.sql
# Exécuter
```

### 4.4 Vérifications post-SQL
```sql
-- Vérifier la colonne
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'issue_reports' AND column_name = 'admin_read_at';

-- Vérifier les policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'issue_reports';
```

## 5. Edge Function "admin"

### 5.1 Localisation et déploiement
```
supabase/functions/admin/index.ts
```

```bash
# Déployer
npx supabase functions deploy admin

# Vérifier le statut
npx supabase functions list
```

### 5.2 Appel depuis le frontend
```javascript
const { data, error } = await supabase.functions.invoke('admin', {
  body: { action: 'list_users' },
  headers: { Authorization: `Bearer ${session.access_token}` }
});
```

### 5.3 Actions supportées
| Action | Description | Paramètres requis |
|--------|-------------|-------------------|
| `list_users` | Lister users avec count signalements | - |
| `create_user_invite` | Créer/inviter user | `email` |
| `delete_user` | Supprimer user | `userId` |
| `reset_password` | Envoyer email reset | `userId`, `email` |
| `get_latest_issue_for_user` | Dernier signalement (lu ou non) | `userId` |
| `mark_issue_read` | Marquer signalement comme lu | `reportId` |
| `delete_issue` | Supprimer définitivement un signalement | `reportId` |
| `delete_all_issues_for_user` | Supprimer tous les signalements d'un user | `userId` |

### 5.4 Sécurité
- **Vérification JWT** : Token utilisateur valide requis
- **Vérification rôle** : `app_metadata.role = 'admin'` côté serveur
- **CORS** : Headers configurés pour les appels frontend

## 6. Frontend - Intégration

### 6.1 SettingsNav.jsx
- Ajoute la tab "Comptes" avec `adminOnly: true`
- Filtre les tabs visibles selon `useUserRole().isAdmin`

### 6.2 Route protégée
```javascript
// App.jsx
<Route path="/settings/comptes" element={
  <PrivateRoute>
    <SettingsComptes />
  </PrivateRoute>
} />
```

### 6.3 useUserRole.ts
- Vérifie `user_metadata?.role` ou `app_metadata?.role`
- Retourne `{ isAdmin: boolean, role: string }`

### 6.4 Réutilisation modale
- Structure IssueReportButton adaptée pour lecture seule
- Pas de modification possible, affichage des détails + bouton "Marquer comme lu"

### 6.5 Règle d'or
**JAMAIS d'appel direct à `supabase.auth.admin` côté client**. Tout passe par l'Edge Function.

## 7. Parcours fonctionnels

### 7.1 Création utilisateur
1. Admin saisit email dans `/settings/comptes`
2. Frontend appelle `create_user_invite`
3. Supabase envoie email d'invitation
4. User clique lien → définit son mot de passe

### 7.2 Première connexion
1. User reçoit email invitation
2. Clique lien `/set-password`
3. Définit mot de passe
4. Apparaît dans liste utilisateurs

### 7.3 Reset password
1. Admin clique "Reset" sur un utilisateur
2. Frontend appelle `reset_password`
3. User reçoit email de réinitialisation
4. Nouveau mot de passe requis

### 7.4 Gestion signalement
1. User signale un problème via bouton flottant
2. Admin voit badge rouge dans `/settings/comptes`
3. Clique badge → ouvre modale avec détails
4. Admin clique "Marquer comme lu" → badge disparaît

## 8. Checklist de tests manuels

### 8.1 Accès admin / non-admin
- [ ] Admin voit la tab "Comptes" dans SettingsNav
- [ ] Non-admin ne voit pas la tab
- [ ] Route `/settings/comptes` accessible admin-only
- [ ] Accès direct par URL redirige si non-admin

### 8.2 Gestion utilisateurs
- [ ] Création user envoie email invitation
- [ ] User apparaît dans liste après création
- [ ] Reset password envoie email
- [ ] Suppression user avec confirmation fonctionne
- [ ] Rôle affiché correctement dans tableau

### 8.3 Signalements
- [ ] Badge affiche le TOTAL des signalements (lus + non lus)
- [ ] Badge rouge si au moins 1 non lu, gris si tous lus
- [ ] Badge cliquable si total > 0 (ouvre dernier signalement)
- [ ] User avec 1 signalement non lu => badge "1" rouge, clic ouvre modale
- [ ] Après "Marquer comme lu" => badge devient "1" gris, clic ouvre encore la modale
- [ ] User avec 3 signalements (2 lus/1 non lu) => badge "3" rouge
- [ ] Après lecture du dernier non lu => badge "3" gris
- [ ] "Supprimer le signalement" retire uniquement le signalement courant
- [ ] "Supprimer l'historique" retire tous les signalements du user
- [ ] Badge disparaît ou devient 0 après suppression de l'historique
- [ ] User normal ne voit jamais les boutons de suppression
- [ ] IssueReportButton côté user non impacté

### 8.4 Non-régression
- [ ] Autres tabs Settings fonctionnent (Impôts, Prélèvements, etc.)
- [ ] Login/logout normal
- [ ] Bouton "Signaler un problème" fonctionne sur pages simulation
- [ ] Navigation globale intacte

## 9. Dépannage

### 9.1 Edge Function retourne 500
**Cause** : Body vide ou mal formaté
**Solution** : Vérifier logs Supabase, redéployer avec `npx supabase functions deploy admin`

### 9.2 "Missing action"
**Cause** : Body ne contient pas `action` ou est vide
**Solution** : Vérifier que tous les appels frontend utilisent `{ body: { action: '...' } }`

### 9.3 "Admin access required"
**Cause** : L'utilisateur n'a pas le rôle admin
**Solution** : 
```sql
UPDATE auth.users 
SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
WHERE lower(email) = lower('admin@example.com');
```

### 9.4 L'admin ne voit rien
**Cause** : `useUserRole()` ne détecte pas le rôle
**Solution** : Vérifier `app_metadata.role` (pas `user_metadata`)

### 9.5 Le badge ne s'allume pas
**Cause** : `admin_read_at` null ou RLS policies incorrectes
**Solution** : Réexécuter `admin_setup.sql`

### 9.6 Signalements en base mais pas à jour dans `/settings/comptes`
**Symptôme** : un signalement est bien inséré dans `public.issue_reports`, mais le badge / les compteurs ne se mettent pas à jour immédiatement côté admin.

**Causes fréquentes** :
- La page `/settings/comptes` n'a pas été rechargée après navigation (données en mémoire).
- La session n'était pas encore disponible au moment du fetch (ex: après un refresh/retour sur l'onglet).

**Solutions** :
- Utiliser le bouton **Rafraîchir** en haut de la liste utilisateurs.
- Ou naviguer vers un autre onglet Settings puis revenir sur **Comptes**.

**Debug rapide** :
- Activer temporairement `DEBUG_COMPTES_REFRESH = true` dans `src/pages/Sous-Settings/SettingsComptes.jsx` et vérifier la console.

### 9.7 Admin non détecté sans refresh (Aucun utilisateur connecté)
**Symptôme** : sur `/settings` ou `/settings/comptes`, l’UI affiche “Aucun utilisateur connecté” alors que l’utilisateur est bien connecté. Un simple refresh navigateur fait revenir l’état correct.

**Causes fréquentes** :
- Race condition entre l’hydratation de la session et le rendu des composants (surtout avec `sessionStorage`).
- `useUserRole` rend `isLoading: true` au démarrage, mais le composant affiche “Aucun utilisateur connecté” avant la fin du chargement.

**Solutions mises en place** :
- **Session persistée en `localStorage`** (plus robuste que `sessionStorage` pour les navigations partielles).
- **Initialisation robuste** dans `App.jsx` et `useUserRole` avec `getSession()` + `onAuthStateChange`.
- **État `authLoading`** respecté dans `SettingsComptes` : affiche “Chargement de l’authentification…” tant que `isLoading: true`.
- **Debug optionnel** : activer `DEBUG_AUTH = true` dans `src/supabaseClient.js` pour tracer l’hydratation de session.

**Debug rapide** :
- Activer `DEBUG_AUTH` et observer les logs `[App] initSession`, `[useUserRole] fetchRole`, `[Settings] loadUser`.
- Vérifier que `localStorage` contient bien une clé `supabase.auth.token` après connexion.

## 10. Règles d'or

### 10.1 Ce qu'il ne faut JAMAIS faire
- ❌ Exposer `service_role_key` dans le frontend
- ❌ Appeler `supabase.auth.admin` côté client
- ❌ Modifier les noms d'actions existantes
- ❌ Ajouter des couleurs codées en dur (sauf blanc)
- ❌ Contourner les RLS policies

### 10.2 Où intervenir si bug
1. **Logs Edge Function** : Supabase Dashboard > Functions > Logs
2. **Frontend** : Console navigateur (F12)
3. **Base de données** : Vérifier colonnes et policies
4. **Auth** : Vérifier `app_metadata.role`

### 10.3 Ordre logique de reprise projet
1. Vérifier configuration CLI et secrets
2. Exécuter `admin_setup.sql`
3. Déployer Edge Function `admin`
4. Configurer un utilisateur admin
5. Tester la checklist manuelle
6. Documenter tout changement

---

⚠️ **IMPORTANT** : Ce document est la source de vérité. En cas de doute, suivre les étapes dans l'ordre. Ne pas inventer de nouvelles approches sans mettre à jour cette documentation.
