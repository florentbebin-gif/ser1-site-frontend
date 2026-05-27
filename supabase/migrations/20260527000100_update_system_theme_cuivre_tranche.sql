-- Aligne le thème système historique sur la palette SER1 Cuivre tranché.

DO $$
DECLARE
  cuivre_palette jsonb := jsonb_build_object(
    'c1', '#0E1426',
    'c2', '#1F3056',
    'c3', '#5B73A0',
    'c4', '#C6CFE2',
    'c5', '#475061',
    'c6', '#C2733A',
    'c7', '#F2EEE8',
    'c8', '#C9CCDA',
    'c9', '#424659',
    'c10', '#060A18'
  );
BEGIN
  UPDATE public.themes
  SET
    name = 'Cuivre tranché personnalisé ' || id::text,
    updated_at = now()
  WHERE name = 'Cuivre tranché'
    AND COALESCE(is_system, false) = false;

  UPDATE public.themes
  SET
    name = 'Cuivre tranché',
    palette = cuivre_palette,
    updated_at = now()
  WHERE COALESCE(is_system, false) = true
    AND name IN ('Thème Original', 'Cuivre tranché');

  INSERT INTO public.themes (name, palette, is_system)
  SELECT 'Cuivre tranché', cuivre_palette, true
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.themes
    WHERE COALESCE(is_system, false) = true
  );
END $$;
