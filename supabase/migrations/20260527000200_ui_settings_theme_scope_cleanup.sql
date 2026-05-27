-- Theme V5 : remplace le scope dérivé de theme_name par un champ dédié.
-- Aucune lecture publique de ui_settings : les thèmes publics restent dans public.themes.

ALTER TABLE public.ui_settings
ADD COLUMN IF NOT EXISTS theme_scope text NOT NULL DEFAULT 'all';

ALTER TABLE public.ui_settings
DROP CONSTRAINT IF EXISTS ui_settings_theme_scope_check;

ALTER TABLE public.ui_settings
ADD CONSTRAINT ui_settings_theme_scope_check
CHECK (theme_scope = ANY (ARRAY['all'::text, 'ui-only'::text]));

UPDATE public.ui_settings
SET theme_scope = 'ui-only'
WHERE theme_name ILIKE '%ui-only%';

DROP POLICY IF EXISTS "Everyone can read default themes" ON public.ui_settings;
DROP POLICY IF EXISTS "Users can manage their own UI settings" ON public.ui_settings;
DROP POLICY IF EXISTS "ui_settings_select_all" ON public.ui_settings;
DROP POLICY IF EXISTS "ui_settings_insert_own" ON public.ui_settings;
DROP POLICY IF EXISTS "ui_settings_update_own" ON public.ui_settings;
DROP POLICY IF EXISTS "ui_settings_delete_own" ON public.ui_settings;

CREATE POLICY "ui_settings_select_own" ON public.ui_settings FOR SELECT TO authenticated
USING (user_id = (select auth.uid()));

CREATE POLICY "ui_settings_insert_own" ON public.ui_settings FOR INSERT TO authenticated
WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "ui_settings_update_own" ON public.ui_settings FOR UPDATE TO authenticated
USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "ui_settings_delete_own" ON public.ui_settings FOR DELETE TO authenticated
USING (user_id = (select auth.uid()));

DROP TRIGGER IF EXISTS update_custom_palette_timestamp ON public.ui_settings;
DROP FUNCTION IF EXISTS public.update_custom_palette_timestamp();
DROP INDEX IF EXISTS public.idx_ui_settings_selected_theme;

ALTER TABLE public.ui_settings
DROP COLUMN IF EXISTS theme_name,
DROP COLUMN IF EXISTS colors,
DROP COLUMN IF EXISTS custom_palette,
DROP COLUMN IF EXISTS custom_palette_updated_at,
DROP COLUMN IF EXISTS selected_theme_ref,
DROP COLUMN IF EXISTS active_palette;
