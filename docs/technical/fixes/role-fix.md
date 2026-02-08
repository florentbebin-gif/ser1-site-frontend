# Fix définitif du rôle admin dans SER1

> **Statut** : ✅ Terminé — Solution intégrée dans `useUserRole.ts`

## Résumé
Le hook `useUserRole.ts` lit maintenant depuis `public.profiles` en priorité avec fallback sur `user_metadata`.

## Changement clé
- `src/auth/useUserRole.ts` : lecture `profiles` table + fallback

---

## Problème identifié (historique)

L’application lit le rôle depuis `user_metadata` au lieu de `public.profiles`. Vous avez mis `role = 'admin'` dans `profiles`, mais le front ne regarde pas cette table.

## Cause racine

1. **Frontend** : `useUserRole.ts` et les pages settings lisent `user.user_metadata.role`
2. **Backend** : Rôle stocké dans `public.profiles.role`
3. **Décalage** : Les deux sources ne sont pas synchronisées

---

## 1) Diagnostic rapide

### Vérifier si votre profile existe
```sql
-- Dans Supabase SQL Editor
SELECT * FROM public.profiles WHERE email = 'votre-email@example.com';
```

### Vérifier votre auth.users.id
```sql
SELECT id, email FROM auth.users WHERE email = 'votre-email@example.com';
```

Si `profiles.id` ≠ `auth.users.id` → le RLS bloquera la lecture.

---

## 2) Correction backend (Supabase)

### Option A : Via l’éditeur SQL (recommandé)

1. Ouvrez `fix-profiles.sql`
2. Remplacez `votre-email@example.com` et `VOTRE-UUID-ICI`
3. Exécutez le SQL

### Option B : Manuellement dans Table Editor

1. Allez dans **Table Editor > profiles**
2. Vérifiez que votre ligne a :
   - `id` = votre `auth.users.id`
   - `email` = votre email
   - `role` = `admin`
3. Si la ligne n’existe pas, créez-la avec le bon `id`

---

## 3) Correction frontend (déjà appliquée)

Le hook `useUserRole.ts` a été modifié pour :

1. **Lire depuis `public.profiles`** en priorité
2. **Fallback sur `user_metadata`** si profiles inaccessible
3. **Recharger au changement de session**
4. **Logs clairs** en cas d’erreur

Les pages settings (`SettingsImpots.jsx`, etc.) utilisent déjà `useUserRole()` donc elles bénéficient du fix.

---

## 4) Rafraîchissement immédiat

### Pour voir le rôle admin sans re-déployer :

1. **Déconnexion / reconnexion** (le plus simple)
   - Cliquez sur Logout
   - Reconnectez-vous
   - L’UI doit afficher “Admin”

2. **Ou simple refresh** (si session active)
   - F5 ou Ctrl+R
   - Le hook rechargera depuis `profiles`

---

## 5) Validation

### 5.1) Côté Supabase

```sql
-- Vérifier que le profil est correct
SELECT id, email, role FROM public.profiles WHERE email = 'votre-email@example.com';
-- → doit retourner une ligne avec role = 'admin'
```

### 5.2) Côté application

1. Ouvrir les pages `/settings/*`
   - Le bandeau doit afficher : `Utilisateur: email — Statut: Admin`
2. Ouvrir `/sim/placement`
   - Console ne doit plus afficher de warnings “fallback utilisé”
   - Les TMI doivent être dynamiques

### 5.3) Console logs attendus

- Si tout va bien : pas de warning `[useUserRole] Erreur lecture profiles`
- Si profiles inaccessible : warning avec fallback sur metadata (mais le rôle doit quand même être correct si metadata contient admin)

---

## 6) Dépannage

| Symptôme | Cause | Solution |
|----------|-------|----------|
| Toujours “User” après reconnexion | `profiles.id` ≠ `auth.users.id` | Corriger l’id dans profiles |
| 403 Permission denied | Policy RLS trop restrictive | Appliquer les policies alternatives (voir fix-profiles.sql) |
| “Admin” mais settings non modifiables | Rôle correct mais policies settings bloquantes | Vérifier que vous êtes bien admin dans `profiles` |

---

## 7) Résumé des changements

- ✅ `useUserRole.ts` : lecture depuis `profiles` + fallback
- ✅ Logs améliorés pour debug
- ✅ `fix-profiles.sql` : script de correction backend
- ✅ Instructions de validation

Après avoir appliqué le SQL de correction et rafraîchi la session, vous devriez voir “Admin” dans l’UI et les settings dynamiques seront fonctionnels.
