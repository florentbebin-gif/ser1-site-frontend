-- PR-B runtime evidence SQL log (no secrets)
-- File: docs/runbook/evidence/2026-02-14-pr-b-runtime.sql
-- Order: P0-01 first, then P0-02
-- Execution date (CET): 2026-02-14
-- Branch: pr-b2-runtime-evidence-results
-- Project ref: xnpbxrqkzgimiugqtago
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

-- 1) Signup/invite probe output from runtime script (without URL/anon vars)
-- Command executed:
-- powershell -ExecutionPolicy Bypass -File .\tools\scripts\verify-runtime-saas.ps1 -ShowPolicyDefs
-- Output excerpt:
-- SIGNUP_PROBE=UNKNOWN (missing SUPABASE_URL or SUPABASE_ANON_KEY)
-- P0_01=UNKNOWN

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
