-- ============================================================================
-- Migration: Update RPC get_my_cabinet_logo() to return placement
-- ============================================================================
-- Purpose: Return both storage_path and logo_placement for cabinet logo
-- Created: 2026-02-03
-- Replaces: add-rpc-get-my-cabinet-logo.sql
-- ============================================================================

-- Drop existing function (to replace with new signature)
DROP FUNCTION IF EXISTS public.get_my_cabinet_logo();

-- Create new function returning composite result
CREATE OR REPLACE FUNCTION public.get_my_cabinet_logo()
RETURNS TABLE(
  storage_path TEXT,
  placement VARCHAR(20)
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    l.storage_path,
    c.logo_placement
  FROM public.profiles p
  JOIN public.cabinets c ON c.id = p.cabinet_id
  JOIN public.logos l ON l.id = c.logo_id
  WHERE p.id = auth.uid()
  LIMIT 1;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_cabinet_logo() TO authenticated;

-- ============================================================================
-- Rollback plan (if needed):
-- DROP FUNCTION IF EXISTS public.get_my_cabinet_logo();
-- 
-- To restore previous version:
-- CREATE OR REPLACE FUNCTION public.get_my_cabinet_logo()
-- RETURNS TEXT
-- LANGUAGE sql STABLE SECURITY DEFINER
-- SET search_path = public
-- AS $$
--   SELECT l.storage_path
--   FROM public.profiles p
--   JOIN public.cabinets c ON c.id = p.cabinet_id
--   JOIN public.logos l ON l.id = c.logo_id
--   WHERE p.id = auth.uid()
--   LIMIT 1;
-- $$;
-- ============================================================================
