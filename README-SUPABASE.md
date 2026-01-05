# Supabase setup pour SER1 (Placement & Settings)

## 1) Créer le projet Supabase

1. Allez sur https://supabase.com
2. Créez un nouveau projet (choisissez une région proche, ex: EU West)
3. Attendez que le projet soit prêt (1-2 minutes)
4. Allez dans **Settings > API**
5. Copiez :
   - **Project URL** (ex: `https://xxxxxxxx.supabase.co`)
   - **anon public** key (commence par `eyJ...`)

## 2) Configurer le frontend (.env)

Dans `.env` à la racine du projet :

```env
VITE_SUPABASE_URL=https://VOTRE-PROJET.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

> Le client Supabase (`src/supabaseClient.js`) utilise déjà ces variables.

## 3) Appliquer le schéma et les seeds

### Via l’éditeur SQL (recommandé)

1. Dans Supabase, allez dans **SQL Editor**
2. Collez tout le contenu de `supabase-setup.sql`
3. Cliquez sur **Run** (ou F5)
4. Vérifiez que les tables sont créées : `profiles`, `fiscality_settings`, `tax_settings`, `ps_settings`

### Via psql (si vous avez accès)

```bash
psql -h VOTRE-PROJET.supabase.co -U postgres -d postgres -f supabase-setup.sql
```

## 4) Rendre un utilisateur admin

1. Lancez l’application et connectez-vous (via le provider que vous avez configuré, ex: GitHub)
2. Allez dans **Supabase > Table Editor > profiles**
3. Trouvez votre ligne (votre email) et éditez `role` → mettez `admin`
4. Sauvegardez

> Alternativement, en SQL :
> ```sql
> UPDATE public.profiles SET role = 'admin' WHERE email = 'votre-email@example.com';
> ```

## 5) Vérifier que tout fonctionne

### 5.1) Test API REST (curl ou Postman)

```bash
curl -H "apikey: VOTRE_ANON_KEY" \
     -H "Authorization: Bearer VOTRE_ANON_KEY" \
     https://VOTRE-PROJET.supabase.co/rest/v1/fiscality_settings?id=eq.1
```

Vous devriez voir un JSON avec le payload `settings`.

### 5.2) Dans l’app

1. Ouvrez `/settings/impots`, `/settings/prelevements-sociaux`, `/settings/fiscalites-contrats`
   - Les formulaires doivent se charger (pas d’erreur 404)
2. Ouvrez `/sim/placement`
   - La console ne doit plus afficher de 404
   - Les TMI dans les selects doivent être dynamiques (0/11/30/41/45%)

### 5.3) Console logs attendus

- Si tout va bien : pas de warning `[Placement] Erreur ...`
- Si un champ manque : un warning `[Placement] Paramètres fiscaux incomplets, fallback appliqué pour : ...`

## 6) Structure des tables

| Table | Colonnes | Description |
|-------|----------|-------------|
| `profiles` | `id`, `email`, `role`, `created_at`, `updated_at` | Utilisateurs + rôle admin |
| `fiscality_settings` | `id=1`, `settings` (JSONB), `version`, `updated_at` | AV, PER, dividendes |
| `tax_settings` | `id=1`, `settings` (JSONB), `version`, `updated_at` | Barème IR, DMTG |
| `ps_settings` | `id=1`, `settings` (JSONB), `version`, `updated_at` | Prélèvements sociaux |

> Chaque table contient une seule ligne (`id=1`) avec un payload JSONB.

## 7) Sécurité (RLS)

- **Lecture** : tout utilisateur authentifié peut lire les settings
- **Écriture** : seul un `profiles.role = 'admin'` peut écrire
- RLS activé sur toutes les tables

## 8) Dépannage

| Symptôme | Cause probable | Solution |
|----------|----------------|-----------|
| 404 sur `/rest/v1/*` | Tables non créées | Relancer `supabase-setup.sql` |
| 403 Permission denied | RLS bloquant | Vérifiez que vous êtes connecté et que `profiles.role` est bien défini |
| Settings vides | Pas de seed | Vérifiez les `INSERT` dans le setup SQL |
| TMI statiques | `tmiOptions` non utilisé | Vérifiez que le hook retourne bien `tmiOptions` dans `PlacementV2.jsx` |

---

**Prochaine étape** : vous pouvez maintenant éditer les settings via les pages `/settings/*` et les valeurs seront utilisées par le simulateur Placement.
