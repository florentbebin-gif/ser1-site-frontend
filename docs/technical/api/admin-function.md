# Edge Function `admin` — Référence API

> **Source** : `config/supabase/functions/admin/index.ts`
> **Version** : `2026-01-23-v1` (`ADMIN_VERSION`)
> **Runtime** : Deno (Supabase Edge Functions)
> **Accès** : Dashboard Supabase + CLI locale + API REST

## Vue d'ensemble

Point d'entrée unique pour toutes les opérations back-end de SER1.
L'action est transmise soit via le query-string `?action=…`, soit dans le body JSON `{ "action": "…" }`.

### Accès à la fonction

| Méthode | URL | Usage |
|--------|-----|-------|
| **Dashboard** | Supabase Dashboard → Functions → admin | Interface web de test |
| **CLI** | `supabase functions invoke admin` | Développement local |
| **API** | `https://PROJECT_REF.supabase.co/functions/v1/admin` | Production |

### Authentification

| Niveau | Description |
|--------|-------------|
| **Public** | Aucun token requis |
| **User** | Bearer token valide (tout utilisateur connecté) |
| **Admin** | Bearer token + `app_metadata.role === 'admin'` |

### Headers communs en réponse

| Header | Valeur |
|--------|--------|
| `x-request-id` | UUID de la requête (fourni par le client ou généré) |
| `x-admin-version` | Valeur de `ADMIN_VERSION` |
| CORS | Dynamiques via `getCorsHeaders(req)` (cf. `cors.ts`) |

---

## Actions publiques (aucune auth)

### `ping_public`

Healthcheck sans authentification. Doit être appelé via query-string.

| Champ | Valeur |
|-------|--------|
| **Méthode** | `GET` ou `POST` |
| **Transmission** | Query-string `?action=ping_public` |
| **Permission** | Public |
| **Body requis** | Aucun |

**Réponse 200** :
```json
{ "ok": true, "ts": 1706000000000, "requestId": "uuid", "durationMs": 5 }
```

---

## Actions authentifiées (User)

### `get_original_theme`

Récupère le thème système (marqueur `is_system = true`). Utilisé pour les utilisateurs sans cabinet.

| Champ | Valeur |
|-------|--------|
| **Transmission** | Query-string `?action=get_original_theme` |
| **Permission** | User |
| **Body requis** | Aucun |

**Réponse 200** :
```json
{ "name": "SER1 Original", "palette": { "c1": "#...", "c2": "#...", ... } }
```

**Réponse 404** : `{ "error": "Original theme not found" }`

---

## Actions Admin — Gestion des utilisateurs

### `update_user_role`

Met à jour le rôle d'un utilisateur (`app_metadata` + `user_metadata` pour rétro-compatibilité).

| Champ | Valeur |
|-------|--------|
| **Permission** | Admin |
| **Body** | `{ "action": "update_user_role", "userId": "uuid", "role": "admin\|user" }` |

> Accepte `userId` ou `user_id`.

**Réponse 200** : `{ "success": true }`
**Réponse 400** : `{ "error": "ID utilisateur et rôle requis" }`
**Réponse 404** : `{ "error": "Utilisateur non trouvé" }`

---

### `list_users` / `users`

Liste tous les utilisateurs avec leurs statistiques de signalements et `cabinet_id`.

| Champ | Valeur |
|-------|--------|
| **Permission** | Admin |
| **Body** | `{ "action": "list_users" }` |
| **Alias** | `users` (rétro-compatibilité) |

**Réponse 200** :
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "created_at": "iso",
      "last_sign_in_at": "iso",
      "role": "user",
      "cabinet_id": "uuid|null",
      "total_reports": 3,
      "unread_reports": 1,
      "latest_report_id": "uuid|null",
      "latest_report_is_unread": true
    }
  ]
}
```

---

### `create_user_invite`

Invite un utilisateur par email (Supabase Auth invite) et crée/met à jour son profil.

| Champ | Valeur |
|-------|--------|
| **Permission** | Admin |
| **Body** | `{ "action": "create_user_invite", "email": "user@example.com", "cabinet_id": "uuid" }` |

> `cabinet_id` est optionnel.

**Réponse 200** : `{ "success": true, "user": { ... } }`
**Réponse 400** : `{ "error": "Email requis" }`

---

### `delete_user`

Supprime un utilisateur de Supabase Auth.

| Champ | Valeur |
|-------|--------|
| **Permission** | Admin |
| **Body** | `{ "action": "delete_user", "userId": "uuid" }` |

**Réponse 200** : `{ "success": true }`
**Réponse 400** : `{ "error": "ID utilisateur requis" }`

---

### `reset_password`

Génère un lien de récupération de mot de passe. Si `email` n'est pas fourni, il est résolu depuis `userId`.

| Champ | Valeur |
|-------|--------|
| **Permission** | Admin |
| **Body** | `{ "action": "reset_password", "userId": "uuid", "email": "user@example.com" }` |

> `email` est optionnel (résolu automatiquement via `userId`).

**Réponse 200** : `{ "success": true }`
**Réponse 400** : `{ "error": "ID utilisateur et email requis" }`
**Réponse 404** : `{ "error": "Email utilisateur non trouvé" }`

---

### `assign_user_cabinet`

Assigne (ou retire) un utilisateur à un cabinet. Crée le profil s'il n'existe pas.

| Champ | Valeur |
|-------|--------|
| **Permission** | Admin |
| **Body** | `{ "action": "assign_user_cabinet", "user_id": "uuid", "cabinet_id": "uuid\|null" }` |

> `cabinet_id = null` détache l'utilisateur du cabinet.

**Réponse 200** : `{ "profile": { ... } }`
**Réponse 400** : `{ "error": "ID utilisateur requis" }` ou `{ "error": "Cabinet invalide" }`
**Réponse 404** : `{ "error": "Utilisateur non trouvé" }` (si création profil échoue)

---

## Actions Admin — Signalements (Issue Reports)

### `list_issue_counts`

Liste tous les signalements, triés par date décroissante.

| Champ | Valeur |
|-------|--------|
| **Permission** | Admin |
| **Body** | `{ "action": "list_issue_counts" }` |

**Réponse 200** : `{ "reports": [ { ... } ] }`

---

### `list_issue_reports`

Liste les signalements d'un utilisateur donné.

| Champ | Valeur |
|-------|--------|
| **Permission** | Admin |
| **Body** | `{ "action": "list_issue_reports", "userId": "uuid" }` |

> Accepte `userId` ou `user_id`.

**Réponse 200** : `{ "reports": [ { ... } ] }`
**Réponse 400** : `{ "error": "ID utilisateur requis" }`

---

### `get_latest_issue_for_user`

Récupère le signalement le plus récent d'un utilisateur.

| Champ | Valeur |
|-------|--------|
| **Permission** | Admin |
| **Body** | `{ "action": "get_latest_issue_for_user", "userId": "uuid" }` |

**Réponse 200** : `{ "report": { ... } | null }`
**Réponse 400** : `{ "error": "ID utilisateur requis" }`

---

### `mark_issue_read`

Marque un signalement comme lu (`admin_read_at = now()`).

| Champ | Valeur |
|-------|--------|
| **Permission** | Admin |
| **Body** | `{ "action": "mark_issue_read", "reportId": "uuid" }` |

**Réponse 200** : `{ "success": true }`
**Réponse 400** : `{ "error": "ID signalement requis" }`

---

### `mark_issue_unread`

Marque un signalement comme non lu (`admin_read_at = null`).

| Champ | Valeur |
|-------|--------|
| **Permission** | Admin |
| **Body** | `{ "action": "mark_issue_unread", "reportId": "uuid" }` |
| **Alias** | `mark_issue_report_unread` |

> Accepte `reportId` ou `report_id`.

**Réponse 200** : `{ "success": true }`
**Réponse 400** : `{ "error": "ID signalement requis" }`

---

### `delete_issue`

Supprime un signalement.

| Champ | Valeur |
|-------|--------|
| **Permission** | Admin |
| **Body** | `{ "action": "delete_issue", "reportId": "uuid" }` |

**Réponse 200** : `{ "success": true }`
**Réponse 400** : `{ "error": "ID signalement requis" }`

---

### `delete_all_issues_for_user`

Supprime tous les signalements d'un utilisateur.

| Champ | Valeur |
|-------|--------|
| **Permission** | Admin |
| **Body** | `{ "action": "delete_all_issues_for_user", "userId": "uuid" }` |

**Réponse 200** : `{ "success": true, "deleted": 5 }`
**Réponse 400** : `{ "error": "ID utilisateur requis" }`

---

## Actions Admin — Cabinets

### `list_cabinets`

Liste tous les cabinets avec leurs thèmes et logos associés (via join).

| Champ | Valeur |
|-------|--------|
| **Permission** | Admin |
| **Body** | `{ "action": "list_cabinets" }` |

**Réponse 200** :
```json
{
  "cabinets": [
    {
      "id": "uuid",
      "name": "Cabinet Dupont",
      "created_at": "iso",
      "updated_at": "iso",
      "default_theme_id": "uuid|null",
      "logo_id": "uuid|null",
      "logo_placement": "center-bottom|null",
      "themes": { "name": "...", "is_system": false },
      "logos": { "sha256": "...", "storage_path": "...", "mime": "...", "width": 200, "height": 100, "bytes": 15000 }
    }
  ]
}
```

---

### `create_cabinet`

Crée un nouveau cabinet.

| Champ | Valeur |
|-------|--------|
| **Permission** | Admin |
| **Body** | `{ "action": "create_cabinet", "name": "Mon Cabinet", "default_theme_id": "uuid" }` |

> `default_theme_id` est optionnel. Si fourni, le thème est vérifié.

**Réponse 200** : `{ "cabinet": { ... } }`
**Réponse 400** : `{ "error": "Nom du cabinet requis" }` ou `{ "error": "Thème invalide" }`

---

### `update_cabinet`

Met à jour un cabinet (nom, thème, logo, placement du logo).

| Champ | Valeur |
|-------|--------|
| **Permission** | Admin |
| **Body** | `{ "action": "update_cabinet", "id": "uuid", "name": "…", "default_theme_id": "uuid\|null", "logo_id": "uuid\|null", "logo_placement": "center-bottom" }` |

> Seuls les champs fournis sont mis à jour. `logo_placement` accepte : `center-bottom`, `center-top`, `bottom-left`, `bottom-right`, `top-left`, `top-right`.

**Réponse 200** : `{ "cabinet": { ... } }`
**Réponse 400** : `{ "error": "ID cabinet requis" }` / `{ "error": "Thème invalide" }` / `{ "error": "Logo invalide" }`

---

### `delete_cabinet`

Supprime un cabinet. Échoue si des utilisateurs y sont encore assignés.

| Champ | Valeur |
|-------|--------|
| **Permission** | Admin |
| **Body** | `{ "action": "delete_cabinet", "id": "uuid" }` |

**Réponse 200** : `{ "success": true }`
**Réponse 400** : `{ "error": "ID cabinet requis" }` ou `{ "error": "Impossible de supprimer le cabinet : des utilisateurs y sont encore assignés", "assigned_users": 3 }`

---

## Actions Admin — Thèmes

### `list_themes`

Liste tous les thèmes (système en premier, puis par nom).

| Champ | Valeur |
|-------|--------|
| **Permission** | Admin |
| **Body** | `{ "action": "list_themes" }` |

**Réponse 200** : `{ "themes": [ { "id": "uuid", "name": "…", "palette": { "c1": "#…", … "c10": "#…" }, "is_system": true } ] }`

---

### `create_theme`

Crée un nouveau thème custom. La palette doit contenir les 10 tokens `c1`–`c10`.

| Champ | Valeur |
|-------|--------|
| **Permission** | Admin |
| **Body** | `{ "action": "create_theme", "name": "Thème Bleu", "palette": { "c1": "#…", … "c10": "#…" } }` |

**Réponse 200** : `{ "theme": { ... } }`
**Réponse 400** : `{ "error": "Nom du thème requis" }` / `{ "error": "Objet palette requis" }` / `{ "error": "Palette incomplète : couleurs manquantes", "missing": ["c7"] }`

---

### `update_theme`

Met à jour un thème existant (nom et/ou palette). Le thème système est modifiable (palette uniquement).

| Champ | Valeur |
|-------|--------|
| **Permission** | Admin |
| **Body** | `{ "action": "update_theme", "id": "uuid", "name": "…", "palette": { … } }` |

> Seuls les champs fournis sont mis à jour. La palette est re-validée (`c1`–`c10`).

**Réponse 200** : `{ "theme": { ... } }`
**Réponse 400** : `{ "error": "ID thème requis" }` / erreurs de validation

---

### `delete_theme`

Supprime un thème. Les thèmes système ne peuvent pas être supprimés. Les cabinets assignés sont automatiquement désassignés (`default_theme_id = null`).

| Champ | Valeur |
|-------|--------|
| **Permission** | Admin |
| **Body** | `{ "action": "delete_theme", "id": "uuid" }` |

**Réponse 200** : `{ "success": true, "unassigned_cabinets": 2 }`
**Réponse 400** : `{ "error": "ID thème requis" }` ou `{ "error": "Impossible de supprimer un thème système" }`

---

### `assign_cabinet_theme`

Raccourci pour assigner un thème à un cabinet (équivalent à `update_cabinet` avec `default_theme_id`).

| Champ | Valeur |
|-------|--------|
| **Permission** | Admin |
| **Body** | `{ "action": "assign_cabinet_theme", "cabinet_id": "uuid", "theme_id": "uuid\|null" }` |

**Réponse 200** : `{ "cabinet": { ... } }`
**Réponse 400** : `{ "error": "ID cabinet requis" }` ou `{ "error": "Thème invalide" }`

---

## Actions Admin — Logos

### `check_logo_exists`

Vérifie si un logo existe déjà par son hash SHA256 (dédoublonnage).

| Champ | Valeur |
|-------|--------|
| **Permission** | Admin |
| **Body** | `{ "action": "check_logo_exists", "sha256": "abc123…" }` |

**Réponse 200 (existe)** : `{ "exists": true, "logo": { "id": "uuid", "storage_path": "…", "mime": "…", "width": 200, "height": 100, "bytes": 15000 } }`
**Réponse 200 (n'existe pas)** : `{ "exists": false }`
**Réponse 400** : `{ "error": "Hash SHA256 requis" }`

---

### `create_logo`

Crée une entrée logo dans la table `logos`. Le fichier doit être uploadé séparément dans Supabase Storage.

| Champ | Valeur |
|-------|--------|
| **Permission** | Admin |
| **Body** | `{ "action": "create_logo", "sha256": "abc…", "storage_path": "logos/…", "mime": "image/png", "width": 200, "height": 100, "bytes": 15000 }` |

> Tous les champs sont requis. `width`, `height`, `bytes` doivent être des nombres.

**Réponse 200** : `{ "logo": { "id": "uuid", "created_by": "admin-uuid", ... } }`
**Réponse 400** : `{ "error": "sha256, storage_path et mime requis" }` / `{ "error": "width, height et bytes doivent être des nombres" }`

---

### `assign_cabinet_logo`

Assigne (ou retire) un logo à un cabinet.

| Champ | Valeur |
|-------|--------|
| **Permission** | Admin |
| **Body** | `{ "action": "assign_cabinet_logo", "cabinet_id": "uuid", "logo_id": "uuid\|null" }` |

**Réponse 200** : `{ "cabinet": { ... } }`
**Réponse 400** : `{ "error": "ID cabinet requis" }` ou `{ "error": "Logo invalide" }`

---

## Actions Admin — Diagnostics

### `ping`

Healthcheck authentifié admin. Mesure la latence aller-retour.

| Champ | Valeur |
|-------|--------|
| **Permission** | Admin |
| **Body** | `{ "action": "ping" }` |

**Réponse 200** : `{ "ok": true, "ts": 1706000000000, "requestId": "uuid", "durationMs": 12 }`

---

### `echo`

Retourne les informations de la requête (headers, origin) pour débogage CORS/réseau.

| Champ | Valeur |
|-------|--------|
| **Permission** | Admin |
| **Body** | `{ "action": "echo" }` |

**Réponse 200** :
```json
{ "ok": true, "origin": "https://app.ser1.fr", "hasAuthHeader": true, "headersKeys": ["authorization", "content-type", "…"], "requestId": "uuid" }
```

---

### `version`

Retourne la version déployée de la fonction.

| Champ | Valeur |
|-------|--------|
| **Permission** | Admin |
| **Body** | `{ "action": "version" }` |

**Réponse 200** : `{ "version": "2026-01-23-v1", "deployedAt": "iso" }`

---

## Erreurs globales

| Status | Condition | Réponse |
|--------|-----------|---------|
| 401 | Token manquant | `{ "error": "Token manquant" }` |
| 401 | Token invalide | `{ "error": "Token invalide" }` |
| 403 | Utilisateur non admin (pour actions admin) | `{ "error": "Accès administrateur requis" }` |
| 400 | Action non fournie | `{ "error": "Action manquante" }` |
| 400 | Action inconnue | `{ "error": "Action invalide", "requestId": "uuid" }` |
| 500 | Exception non gérée | `{ "error": "message", "requestId": "uuid" }` |

---

## Résumé des actions (30)

| # | Action | Permission | Domaine |
|---|--------|-----------|---------|
| 1 | `ping_public` | Public | Diagnostics |
| 2 | `get_original_theme` | User | Thèmes |
| 3 | `update_user_role` | Admin | Utilisateurs |
| 4 | `list_users` / `users` | Admin | Utilisateurs |
| 5 | `create_user_invite` | Admin | Utilisateurs |
| 6 | `delete_user` | Admin | Utilisateurs |
| 7 | `reset_password` | Admin | Utilisateurs |
| 8 | `assign_user_cabinet` | Admin | Utilisateurs |
| 9 | `list_issue_counts` | Admin | Signalements |
| 10 | `list_issue_reports` | Admin | Signalements |
| 11 | `get_latest_issue_for_user` | Admin | Signalements |
| 12 | `mark_issue_read` | Admin | Signalements |
| 13 | `mark_issue_unread` | Admin | Signalements |
| 14 | `delete_issue` | Admin | Signalements |
| 15 | `delete_all_issues_for_user` | Admin | Signalements |
| 16 | `list_cabinets` | Admin | Cabinets |
| 17 | `create_cabinet` | Admin | Cabinets |
| 18 | `update_cabinet` | Admin | Cabinets |
| 19 | `delete_cabinet` | Admin | Cabinets |
| 20 | `list_themes` | Admin | Thèmes |
| 21 | `create_theme` | Admin | Thèmes |
| 22 | `update_theme` | Admin | Thèmes |
| 23 | `delete_theme` | Admin | Thèmes |
| 24 | `assign_cabinet_theme` | Admin | Thèmes |
| 25 | `check_logo_exists` | Admin | Logos |
| 26 | `create_logo` | Admin | Logos |
| 27 | `assign_cabinet_logo` | Admin | Logos |
| 28 | `ping` | Admin | Diagnostics |
| 29 | `echo` | Admin | Diagnostics |
| 30 | `version` | Admin | Diagnostics |
