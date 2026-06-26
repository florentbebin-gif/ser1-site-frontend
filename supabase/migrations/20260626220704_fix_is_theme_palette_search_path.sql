-- Fige le search_path de public.is_theme_palette (advisor function_search_path_mutable).
-- Corps inchangé (variante null-safe de 20260530000100) ; seules des fonctions pg_catalog
-- sont appelées, donc search_path = '' est sûr et ne nécessite aucune requalification de schéma.
-- Les contraintes themes_palette_contract_check / ui_settings_my_palette_contract_check qui
-- référencent cette fonction restent valides (signature inchangée).
create or replace function public.is_theme_palette(value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    case
      when jsonb_typeof(value) is distinct from 'object' then false
      else
        coalesce(
          (
            select array_agg(key order by key)
            from jsonb_object_keys(value) as key
          ) = array['c1', 'c10', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9'],
          false
        )
        and coalesce(
          (
            select bool_and(
              jsonb_typeof(value -> key) = 'string'
              and (value ->> key) ~ '^#[0-9A-Fa-f]{6}$'
            )
            from unnest(array['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10']) as key
          ),
          false
        )
    end;
$$;
