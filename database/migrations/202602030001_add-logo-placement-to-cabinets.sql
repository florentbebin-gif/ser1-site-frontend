-- ============================================================================
-- Migration: Add logo_placement to cabinets table
-- ============================================================================
-- Purpose: Store logo position preference for PPTX cover slides
-- Created: 2026-02-03
-- ============================================================================

-- 1. Add logo_placement column with default 'center-bottom'
ALTER TABLE public.cabinets 
ADD COLUMN IF NOT EXISTS logo_placement VARCHAR(20) DEFAULT 'center-bottom';

-- 2. Add constraint to validate placement values
ALTER TABLE public.cabinets 
DROP CONSTRAINT IF EXISTS chk_logo_placement;

ALTER TABLE public.cabinets 
ADD CONSTRAINT chk_logo_placement 
CHECK (logo_placement IN (
  'center-bottom',
  'center-top',
  'bottom-left',
  'bottom-right',
  'top-left',
  'top-right'
));

-- 3. Update existing cabinets to have default value
UPDATE public.cabinets 
SET logo_placement = 'center-bottom' 
WHERE logo_placement IS NULL;

-- 4. Validation
SELECT 
  'cabinets with placement' as check_type,
  COUNT(*) as count
FROM public.cabinets
WHERE logo_placement IS NOT NULL
UNION ALL
SELECT 
  'by placement value',
  COUNT(*)
FROM public.cabinets
GROUP BY logo_placement;
