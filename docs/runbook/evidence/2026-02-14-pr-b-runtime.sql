-- PR-B runtime evidence SQL log (no secrets)
-- File: docs/runbook/evidence/2026-02-14-pr-b-runtime.sql
-- Order: P0-01 first, then P0-02

-- =====================
-- P0-01: invite evidence
-- =====================

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

-- 2) Dataset sanity checks (replace placeholders)
select id, name
from public.cabinets
where name in ('{{cab_a}}', '{{cab_b}}');

select id, email, role, cabinet_id
from public.profiles
where email in ('{{admin_a_email}}', '{{admin_b_email}}')
order by email;

-- 3) Isolation checks
-- Preferred: run the same query in two distinct authenticated sessions (Admin A then Admin B)
-- and archive outputs separately in markdown evidence.
select id, email, role, cabinet_id
from public.profiles
order by email;

-- Notes:
-- - Do not paste service_role keys or bearer tokens in this file.
-- - If outputs contain sensitive values, redact before commit.
