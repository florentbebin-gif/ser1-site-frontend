-- PR-B runtime evidence SQL log (no secrets)
-- File: docs/runbook/evidence/2026-02-14-pr-b-runtime.sql
-- Order: P0-01 first, then P0-02
-- Execution date (CET): 2026-02-14
-- Branch: pr-b2-runtime-evidence-results
-- Project ref: xnpbxrqkzgimiugqtago
-- PR-B4 execution date (CET): 2026-02-15
-- PR-B4 branch: pr-b4-runtime-evidence-cli
-- PR-B4 mode: 100% CLI cloud via Supabase Management API + Auth/Functions REST
-- Additional SQL runtime check (CET): 2026-02-15
-- Execution mode: docker exec -i supabase_db_SER1 psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "<SQL>"

-- =====================
-- P0-01: invite evidence
-- =====================

-- 0) disable_signup proof via Supabase management API (no secrets exposed)
-- Command executed (PowerShell):
-- $headers = @{ Authorization = "Bearer $env:SUPABASE_ACCESS_TOKEN" }
-- $resp = Invoke-RestMethod -Method Get -Uri "https://api.supabase.com/v1/projects/xnpbxrqkzgimiugqtago/config/auth" -Headers $headers
-- Write-Output ("AUTH_DISABLE_SIGNUP=" + [string]$resp.disable_signup)
-- Output:
-- AUTH_DISABLE_SIGNUP=True

-- PR-B4 command executed (PowerShell):
-- $ref='xnpbxrqkzgimiugqtago'
-- $headers=@{ Authorization = "Bearer $env:SUPABASE_ACCESS_TOKEN" }
-- $resp=Invoke-RestMethod -Method Get -Uri "https://api.supabase.com/v1/projects/$ref/config/auth" -Headers $headers
-- [pscustomobject]@{ project_ref=$ref; disable_signup=$resp.disable_signup } | ConvertTo-Json
-- Output:
-- {
--   "project_ref": "xnpbxrqkzgimiugqtago",
--   "disable_signup": true
-- }

-- 1) Signup/invite probe output from runtime script (without URL/anon vars)
-- Command executed:
-- powershell -ExecutionPolicy Bypass -File .\tools\scripts\verify-runtime-saas.ps1 -ShowPolicyDefs
-- Output excerpt:
-- SIGNUP_PROBE=UNKNOWN (missing SUPABASE_URL or SUPABASE_ANON_KEY)
-- P0_01=UNKNOWN

-- PR-B4 invitation attempt via Edge Function admin (CLI only)
-- Command outline:
-- 1) Login via /auth/v1/token with E2E_EMAIL/E2E_PASSWORD (from .env.local)
-- 2) POST /functions/v1/admin with body {"action":"create_user_invite","email":"b4-invite-<ts>@test.local","cabinet_id":"<cabinet_id>"}
-- Output:
-- {
--   "status": 500,
--   "body": "{\"error\":\"email rate limit exceeded\",\"requestId\":\"<redacted-request-id>\"}"
-- }

-- Invite projection checks (no invited row created)
select id, email, created_at
from auth.users
where email like 'b4-invite-%@test.local'
order by created_at desc;

select id, email, role, cabinet_id
from public.profiles
where email like 'b4-invite-%@test.local'
order by created_at desc;

-- Output:
-- (0 rows) on both queries
-- P0_01_INVITE=FAIL (runtime blocked by email rate limit)

-- ==============================
-- PR-B4b: P0-01 no-spam attempt
-- ==============================
-- Goal: official GoTrue Admin API path WITHOUT sending invite emails.
-- Endpoint: POST https://xnpbxrqkzgimiugqtago.supabase.co/auth/v1/admin/users
-- Auth: service_role key retrieved via Management API (not printed)
-- Notes:
-- - Password used for API call is NOT written in this file (per policy).

-- HTTP proof (redacted):
-- {
--   "status": 200,
--   "user_id": "f3e993bf-4db0-424f-b7e9-c2355c8bca3a",
--   "email": "b4b-user-1771146130@test.local",
--   "cabinet_id_used": "56ac87f7-17b1-4667-9b27-8ecd97aedf7a"
-- }

-- Verify user exists in auth.users
select id, email, email_confirmed_at, created_at
from auth.users
where email = 'b4b-user-1771146130@test.local';

-- Verify projection in public.profiles
select id, email, role, cabinet_id, created_at
from public.profiles
where email = 'b4b-user-1771146130@test.local';

-- Observed:
-- - auth.users.email_confirmed_at is NOT NULL (email_confirm=true) ✅
-- - public.profiles.role='user' ✅
-- - public.profiles.cabinet_id is NULL ❌

-- Prove there is no projection trigger that would set cabinet_id
select tgname, pg_get_triggerdef(t.oid) as def
from pg_trigger t
join pg_class c on c.oid=t.tgrelid
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname='profiles' and not t.tgisinternal
order by tgname;

-- Output:
-- tgname=set_profiles_updated_at (only)
-- P0_01_INVITE_NO_SPAM=FAIL (official creation OK, but profiles cabinet_id not set)

-- Cleanup proof: DELETE created user via Admin API
-- Additional run (capturing explicit DELETE status):
-- {
--   "create_status": 200,
--   "created_user_id": "7c2898b9-890b-44ac-9782-d41b7a01141c",
--   "created_email": "b4b-user-1771146313-b@test.local",
--   "delete_status": 200
-- }

-- Verify deletion (counts)
-- {
--   "email": "b4b-user-1771146313-b@test.local",
--   "auth_users_count": 0,
--   "profiles_count": 0
-- }

-- [Optional] Verify invited user profile projection
-- Replace placeholder values before execution.
select id, email, role, cabinet_id
from public.profiles
where email ilike '%{{invited_email_fragment}}%';

-- ==============================
-- P0-02: policies and isolation
-- ==============================

-- 1) List active policies on profiles
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname='public' and tablename='profiles'
order by policyname;

-- Command executed (API fallback with management token):
-- powershell -ExecutionPolicy Bypass -File .\tools\scripts\verify-runtime-saas.ps1 -PolicyOnly -ShowPolicyDefs -ProjectRef xnpbxrqkzgimiugqtago
-- Output summary:
-- PROJECT_REF=xnpbxrqkzgimiugqtago
-- PROFILES_POLICIES_COUNT=5
-- PROFILES_RLS=true
-- PROFILES_POLICY_NAMES=Admins can update any profile,profiles_select_admin_same_cabinet,profiles_select_own,profiles_update_admin_same_cabinet,profiles_update_own
-- POLICY_DEF=Admins can update any profile | qual=(EXISTS ( SELECT 1 FROM profiles profiles_1 WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'admin'::text)))) | with_check=
-- POLICY_DEF=profiles_select_admin_same_cabinet | qual=(is_admin() AND ((cabinet_id = get_my_cabinet_id()) OR (cabinet_id IS NULL))) | with_check=
-- POLICY_DEF=profiles_select_own | qual=(id = auth.uid()) | with_check=
-- POLICY_DEF=profiles_update_admin_same_cabinet | qual=(is_admin() AND ((cabinet_id = get_my_cabinet_id()) OR (cabinet_id IS NULL))) | with_check=(is_admin() AND ((cabinet_id = get_my_cabinet_id()) OR (cabinet_id IS NULL)))
-- POLICY_DEF=profiles_update_own | qual=(id = auth.uid()) | with_check=(id = auth.uid())
-- POLICIES_INCLUDE_CABINET_ID=True
-- P0_02=PASS

-- 2) Dataset sanity checks (replace placeholders)
-- PR-B4 dataset creation (cloud SQL API)
-- Generated test set:
-- cab_a_name=B4_CAB_A_1771145192
-- cab_b_name=B4_CAB_B_1771145192
-- admin_a_email=b4-admin-a-1771145192@test.local
-- admin_b_email=b4-admin-b-1771145192@test.local
-- Output:
-- {
--   "cab_a_id": "56ac87f7-17b1-4667-9b27-8ecd97aedf7a",
--   "cab_a_name": "B4_CAB_A_1771145192",
--   "cab_b_id": "57cdb648-b43b-4a80-bc40-724975470e2c",
--   "cab_b_name": "B4_CAB_B_1771145192",
--   "admin_a_id": "c3d59b7d-022b-49a3-afcb-128f36925604",
--   "admin_a_email": "b4-admin-a-1771145192@test.local",
--   "admin_b_id": "58a9aafc-deff-432b-9552-bef591a925ea",
--   "admin_b_email": "b4-admin-b-1771145192@test.local"
-- }

-- Dataset verification:
select u.id,u.email,u.raw_app_meta_data->>'role' as app_role,p.role as profile_role,p.cabinet_id
from auth.users u
join public.profiles p on p.id=u.id
where u.email in ('b4-admin-a-1771145192@test.local','b4-admin-b-1771145192@test.local')
order by u.email;

-- Output:
-- b4-admin-a-1771145192@test.local -> app_role=admin, profile_role=admin, cabinet_id=56ac87f7-17b1-4667-9b27-8ecd97aedf7a
-- b4-admin-b-1771145192@test.local -> app_role=admin, profile_role=admin, cabinet_id=57cdb648-b43b-4a80-bc40-724975470e2c

-- 2a) UUID lookup prerequisite for RLS A/B simulation
-- SQL executed:
-- select id, email from auth.users where email in ('{{admin_a_email}}', '{{admin_b_email}}');
-- Output:
--  id | email
-- ----+-------
-- (0 rows)

-- 2b) Dataset sanity checks
-- SQL executed:
-- select id, name from public.cabinets order by name;
-- Output:
--  id | name
-- ----+------
-- (0 rows)

-- SQL executed:
-- select id, email, role, cabinet_id from public.profiles where role='admin' order by email;
-- Output:
--  id | email | role | cabinet_id
-- ----+-------+------+------------
-- (0 rows)

-- 3) Isolation checks
-- Preferred: run the same query in two distinct authenticated sessions (Admin A then Admin B)
-- and archive outputs separately in markdown evidence.
-- Runtime status for this execution: NOT EXECUTED (no auth.users UUIDs + no admin A/B dataset in local DB)
-- Expected simulation query to run once admin_a/admin_b UUIDs are available:
-- begin;
-- set local role authenticated;
-- select set_config('request.jwt.claim.sub','<admin_uuid>', true);
-- select set_config('request.jwt.claim.role','authenticated', true);
-- select email, role, cabinet_id from public.profiles order by email;
-- rollback;

-- PR-B4 isolation checks executed (cloud SQL API)
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c3d59b7d-022b-49a3-afcb-128f36925604', true) as sub_set;
select set_config('request.jwt.claim.role', 'authenticated', true) as role_set;
select email, role, cabinet_id from public.profiles where email like 'b4-admin-%@test.local' order by email;
rollback;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '58a9aafc-deff-432b-9552-bef591a925ea', true) as sub_set;
select set_config('request.jwt.claim.role', 'authenticated', true) as role_set;
select email, role, cabinet_id from public.profiles where email like 'b4-admin-%@test.local' order by email;
rollback;

-- Output A:
-- {
--   "email": "b4-admin-a-1771145192@test.local",
--   "role": "admin",
--   "cabinet_id": "56ac87f7-17b1-4667-9b27-8ecd97aedf7a"
-- }
-- Output B:
-- {
--   "email": "b4-admin-b-1771145192@test.local",
--   "role": "admin",
--   "cabinet_id": "57cdb648-b43b-4a80-bc40-724975470e2c"
-- }
-- P0_02_ISOLATION=PASS (A does not see B, B does not see A)

-- 4) Local schema guard checks executed successfully via container
-- SQL executed:
-- select relrowsecurity from pg_class where relname='profiles';
-- Output:
--  relrowsecurity
-- ----------------
--  t
-- (1 row)

-- Notes:
-- - Do not paste service_role keys or bearer tokens in this file.
-- - If outputs contain sensitive values, redact before commit.
