# Plan de correction - Warnings Security Advisor restants

**Date:** 2026-01-31  
**Projet:** SER1  
**Statut:** Plan prêt, en attente d'exécution

---

## Résumé des warnings restants

| # | Warning | Nombre | Fichier de correction |
|---|---------|--------|----------------------|
| 1 | `function_search_path_mutable` | 5 fonctions | `database/migrations/202601312300_fix_search_path_remaining.sql` |
| 2 | `auth_leaked_password_protection` | 1 setting | Dashboard Supabase (manuel) |

---

## 1. Fix `function_search_path_mutable` (5 fonctions)

### Fonctions concernées

1. `public.get_settings_version()`
2. `public.bump_settings_version()`
3. `public.sync_settings_data_tax()`
4. `public.sync_settings_data_fiscality()`
5. `public.sync_settings_data_ps()`

### Cause
Ces fonctions n'ont pas de `search_path` fixé, ce qui permet potentiellement à un attaquant de créer des objets (tables, fonctions) dans un schéma prioritaire dans le `search_path` du rôle courant, provoquant leur exécution à la place des objets légitimes.

### Solution
Ajouter `SET search_path = pg_catalog, public` à chaque fonction.

### Fichier de migration
`database/migrations/202601312300_fix_search_path_remaining.sql`

### Étapes d'exécution

1. **Vérifier le DDL actuel** (dans Supabase SQL Editor):
```sql
-- Récupérer le DDL actuel de chaque fonction (pour rollback si besoin)
SELECT pg_get_functiondef(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_settings_version',
    'bump_settings_version',
    'sync_settings_data_tax',
    'sync_settings_data_fiscality',
    'sync_settings_data_ps'
  );
```

2. **Sauvegarder le DDL** dans un fichier texte local (rollback)

3. **Exécuter la migration**:
   - Ouvrir `database/migrations/202601312300_fix_search_path_remaining.sql`
   - Copier-coller dans Supabase SQL Editor
   - Exécuter

4. **Vérifier la correction**:
```sql
SELECT 
  p.proname,
  p.proconfig @> ARRAY['search_path=pg_catalog, public'] as ok
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_settings_version',
    'bump_settings_version',
    'sync_settings_data_tax',
    'sync_settings_data_fiscality',
    'sync_settings_data_ps'
  );
```

**Expected:** Toutes les lignes avec `ok = true`

5. **Vérifier dans Security Advisor** que les 5 warnings ont disparu

### Risque de rupture
- **Faible** : Ces fonctions sont des utilitaires/fonctions de sync, pas des fonctions métier critiques.
- **Test recommandé** : Vérifier que les settings peuvent toujours être lus/sauvegardés après le patch.

---

## 2. Fix `auth_leaked_password_protection`

### Description
La protection contre les mots de passe compromis est désactivée. Cette fonction vérifie les mots de passe des utilisateurs contre la base HaveIBeenPwned.org pour détecter si un mot de passe a fuité dans une violation de données.

### Solution
Activer dans le Dashboard Supabase (pas de SQL requis).

### Étapes d'exécution

1. **Accéder au Dashboard Supabase** :
   - URL: https://supabase.com/dashboard/project/xnpbxrqkzgimiugqtago
   - Section: **Authentication** → **Policies** (ou **Settings**)

2. **Activer la protection** :
   - Chercher l'option "Leaked Password Protection" ou "Password Security"
   - Activer le toggle/checkbox
   - Sauvegarder

3. **Alternative via SQL** (si disponible):
```sql
-- Cette option est généralement configurée via l'API Auth ou le Dashboard
-- Vérifier si possible via SQL:
SELECT * FROM auth.config;
-- Ou chercher dans les settings du projet
```

4. **Vérifier dans Security Advisor** que le warning a disparu

### Impact utilisateur
- Les utilisateurs qui essaient de définir un mot de passe compromis verront une erreur
- Ils devront choisir un mot de passe différent

---

## Checklist de validation finale

Après application des 2 corrections:

- [ ] Exécuter migration SQL `202601312300_fix_search_path_remaining.sql`
- [ ] Vérifier 5 fonctions avec `search_path` fixé
- [ ] Activer `auth_leaked_password_protection` dans Dashboard
- [ ] Re-check Security Advisor → 0 warnings restants
- [ ] Test fonctionnel: lecture/écriture settings OK
- [ ] Commit & push du fichier de migration

---

## Fichiers créés/modifiés

| Fichier | Action | Description |
|---------|--------|-------------|
| `database/migrations/202601312300_fix_search_path_remaining.sql` | Créé | Migration pour fixer search_path des 5 fonctions |
| `docs/technical/security-remaining-warnings-plan.md` | Créé | Ce document |

---

*Plan prêt pour exécution. Demander GO pour lancer la correction.*
