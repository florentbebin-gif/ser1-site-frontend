# Security Guidelines: user_metadata vs app_metadata

## Rule

**Never use `user_metadata` for authorization decisions.**

`user_metadata` is editable by the end user and can be tampered with. Using it for role checks would allow privilege escalation attacks.

## Approved Usage Patterns

### 1. Authorization (Security-Critical)

**Use `app_metadata` only.**

```typescript
// ✅ CORRECT - Security check uses app_metadata only
const userRole = user.app_metadata?.role || 'user'
if (userRole !== 'admin') {
  return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403 })
}
```

```sql
-- ✅ CORRECT - SQL function checks app_metadata only
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT COALESCE(
    (COALESCE(current_setting('request.jwt.claims', true), '{}'))::jsonb
      -> 'app_metadata' ->> 'role',
    'user'
  ) = 'admin';
$$;
```

### 2. Display / Backward Compatibility (Non-Security)

**Can read `user_metadata` for display purposes only.**

```typescript
// ✅ ACCEPTABLE - For display only, not for security decisions
const role = user.user_metadata?.role || user.app_metadata?.role || 'user'
// Used to show role in UI, actual auth check already passed
```

### 3. Writing (Backward Compatibility)

**Can write to both for migration/compat.**

```typescript
// ✅ ACCEPTABLE - Writing for backward compatibility
const nextUserMetadata = { ...(existing.user.user_metadata ?? {}), role }
const nextAppMetadata = { ...(existing.user.app_metadata ?? {}), role }

await supabase.auth.admin.updateUserById(userId, {
  user_metadata: nextUserMetadata,  // backward compat
  app_metadata: nextAppMetadata,    // security source of truth
})
```

## Prohibited Patterns

```typescript
// ❌ WRONG - Never use user_metadata for authorization
const userRole = user.user_metadata?.role || user.app_metadata?.role || 'user'
if (userRole !== 'admin') {  // User can edit user_metadata to become 'admin'!
  return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403 })
}
```

```sql
-- ❌ WRONG - Never reference user_metadata in RLS policies
CREATE POLICY "Admins can write" ON public.settings
  FOR ALL
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'  -- BROKEN: user can edit this!
  );
```

## Regression Check

Run this grep to detect potential security regressions:

```bash
# Search for dangerous patterns: user_metadata used with role/authorization
cd config/supabase/functions
rg "user_metadata.*role" --type ts

# In SQL files
rg "user_metadata" database/migrations/ --type sql
```

If any matches are found for authorization patterns, they must be reviewed immediately.

## Files Affected by Security Patch (2026-01-31)

- `config/supabase/functions/admin/index.ts` - Line 128 (security check now uses app_metadata only)
- `database/migrations/202601312200_security_rls_no_user_metadata.sql` - Migration hardening RLS
- `public.is_admin()` function - Now checks app_metadata only

## References

- Supabase Security Advisor: `rls_references_user_metadata` lint rule
- PostgreSQL `search_path` security: https://supabase.com/docs/guides/database/database-linter
