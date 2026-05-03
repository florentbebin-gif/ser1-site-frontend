# Supabase Patterns

À appliquer pour toute modification dans `src/pages/settings/`, `src/settings/`, `supabase/migrations/`, les policies RLS, ou les opérations admin.

---

## Règles absolues

### Opérations admin

- Toujours utiliser `adminClient` (`src/settings/admin/adminClient.ts`)
- **Jamais** `invokeAdmin` directement depuis des pages ou composants
- `update_user_role` est réservé au owner (`principal.accountKind === 'owner'`)

### Pattern obligatoire après settings write

```typescript
// Après tout write (tax_settings, ps_settings, fiscality_settings) :
write → fiscalSettingsCache.invalidate(kind) → broadcastInvalidation(kind)
```

- Les pages `src/pages/settings/*` lisent **directement** via `supabase.from()` au montage (intentionnel : l'admin a besoin de la valeur fraîche, pas du cache)
- Les **consommateurs** (simulateurs) utilisent `useFiscalContext` avec cache

### Auth et RLS

- Autorisation : toujours `app_metadata`, **jamais** `user_metadata`
- Permissions enforcées server-side via RLS — pas de gating UI-only
- Risque de récursion : toute policy touchant `profiles` avec joins doit être vérifiée

### Migrations

- Tout changement DB = fichier migration dans `supabase/migrations/`
- Inclure un plan de rollback dans la PR
- **Jamais** `supabase db reset` ou opérations destructives sans validation explicite

### Sécurité

- Pas de secrets, JWTs, service-role keys, ou signed URLs dans le code ou les logs
- Pas d'outputs runtime (SQL results, HTTP dumps) committés dans le repo

---

## Fichiers à lire si nécessaire

| Fichier | Quand lire |
|---|---|
| `src/settings/admin/adminClient.ts` | Si opération admin à implémenter |
| `src/utils/cache/fiscalSettingsCache.ts` | Si invalidation cache nécessaire |
| `supabase/migrations/` | Si nouvelle migration DB |
| `src/pages/settings/SettingsImpots.jsx` | Si modification settings fiscaux |
| `src/pages/settings/SettingsPrelevements.jsx` | Si modification settings prélèvements |

---

## Commandes utiles

```powershell
# Vérifier les appels Supabase directs hors zone autorisée
rg "from\('@/.*supabase|from\('.*supabase|createClient" src/features/ src/pages/ -n

# Vérifier invokeAdmin
rg "invokeAdmin\b" src/pages/settings/ src/features/ -n

# Vérifier user_metadata (doit être absent des décisions d'autorisation)
rg "user_metadata" src/ --include="*.ts" --include="*.tsx" -n
```

---

## Critères d'arrêt

- [ ] `adminClient` utilisé pour toutes les opérations admin
- [ ] `invalidate()` + `broadcastInvalidation()` présents après chaque write settings
- [ ] `app_metadata` utilisé pour les décisions d'autorisation
- [ ] Aucun secret/JWT dans le code
- [ ] Migration créée pour tout changement DB

## Ce qu'il ne faut pas faire

- ❌ Appeler `invokeAdmin` directement depuis une page/composant
- ❌ Utiliser `user_metadata` pour les permissions
- ❌ Modifier la DB sans fichier migration
- ❌ Committer des secrets, JWTs, ou service-role keys
- ❌ Faire `supabase db reset` sans validation utilisateur
