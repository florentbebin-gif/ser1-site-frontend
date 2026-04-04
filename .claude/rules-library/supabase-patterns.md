---
description: Rules for Supabase interactions and settings admin pages
globs:
  - src/pages/settings/**
  - src/settings/**
  - supabase/**
---

# Supabase Patterns

## Admin operations
- Always use `adminClient` (`src/settings/admin/adminClient.ts`) for admin operations.
- Never use `invokeAdmin` directly from pages or components — it is an internal implementation detail.
- `update_user_role` is owner-only (`principal.accountKind === 'owner'`).

## Settings writes
- After any settings write (tax_settings, ps_settings, fiscality_settings): invalidate cache and broadcast.
- Pattern: write → `fiscalSettingsCache.invalidate()` → broadcast to other tabs.

## Auth and RLS
- Authorization decisions: always `app_metadata`, never `user_metadata`.
- Permissions enforced server-side via RLS, not UI-only gating.
- Recursive policy risk: any policy touching `profiles` with joins must be checked for recursion.

## Migrations
- Every DB change requires a migration file in `supabase/migrations/`.
- Include rollback plan in the PR description.
- Never run `supabase db reset` or destructive operations without explicit user confirmation.

## Security
- No secrets, JWTs, service-role keys, or signed URLs in code or logs.
- No runtime outputs (SQL results, HTTP dumps) committed to repo.
