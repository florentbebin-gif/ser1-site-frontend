-- Migration: Bloc 3 - Index sur clés étrangères non indexées
-- Résout les suggestions "unindexed_foreign_keys" du Performance Advisor Supabase.
-- Niveau INFO : gain réel faible (tables petites) mais bonne pratique structurelle.
-- Note : tout index ajoute un léger coût d'écriture et de stockage (risque faible).

-- ==============================================================================
-- 1. cabinets.default_theme_id → themes.id
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_cabinets_default_theme_id
  ON public.cabinets (default_theme_id);

-- ==============================================================================
-- 2. cabinets.logo_id → logos.id
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_cabinets_logo_id
  ON public.cabinets (logo_id);

-- ==============================================================================
-- 3. logos.created_by → auth.users.id
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_logos_created_by
  ON public.logos (created_by);

-- ==============================================================================
-- INDEX NON TRAITÉS — Candidats à revue ultérieure
-- ==============================================================================
-- Les index suivants sont signalés "unused" par pg_stat_user_indexes :
--   • idx_issue_reports_admin_unread     (issue_reports)
--   • issue_reports_user_id_created_at_idx (issue_reports)
--   • issue_reports_admin_read_at_idx    (issue_reports)
--   • idx_ui_settings_theme_mode         (ui_settings)
--   • idx_ui_settings_selected_theme     (ui_settings)
--
-- Les index issue_reports ont été posés lors de la modélisation du module support
-- (tri par date, filtrage admin non lu, lecture par user_id) — décision reportée.
-- Les index idx_ui_settings_theme_mode et idx_ui_settings_selected_theme sont à
-- vérifier : leur utilité réelle n'est pas documentée. Décision reportée à une
-- revue après observation pg_stat_user_indexes sur un volume réel et vérification
-- des requêtes frontend qui les utiliseraient effectivement.

-- ==============================================================================
-- ROLLBACK
-- ==============================================================================
-- DROP INDEX IF EXISTS public.idx_cabinets_default_theme_id;
-- DROP INDEX IF EXISTS public.idx_cabinets_logo_id;
-- DROP INDEX IF EXISTS public.idx_logos_created_by;
