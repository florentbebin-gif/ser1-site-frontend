-- ============================================================================
-- Migration: Add RPC get_my_cabinet_logo() - SECURITY DEFINER
-- ============================================================================
-- Purpose: Allow authenticated users to retrieve their cabinet's logo storage path
-- bypassing RLS restrictions on cabinets/logos tables.
-- Returns: storage_path (TEXT) or NULL if no cabinet/logo assigned.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_my_cabinet_logo()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.storage_path
  FROM public.profiles p
  JOIN public.cabinets c ON c.id = p.cabinet_id
  JOIN public.logos l ON l.id = c.logo_id
  WHERE p.id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_cabinet_logo() TO authenticated;

-- ============================================================================
-- Rollback plan (if needed):
-- DROP FUNCTION IF EXISTS public.get_my_cabinet_logo();
-- ============================================================================
