create or replace function public.is_theme_palette(value jsonb)
returns boolean
language sql
immutable
as $$
  select
    jsonb_typeof(value) = 'object'
    and (
      select array_agg(key order by key)
      from jsonb_object_keys(value) as key
    ) = array['c1', 'c10', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9']
    and (
      select bool_and(
        jsonb_typeof(value -> key) = 'string'
        and (value ->> key) ~ '^#[0-9A-Fa-f]{6}$'
      )
      from unnest(array['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10']) as key
    );
$$;

do $$
declare
  invalid_themes_count integer;
  invalid_ui_settings_count integer;
begin
  select count(*)
  into invalid_themes_count
  from public.themes
  where not public.is_theme_palette(palette);

  select count(*)
  into invalid_ui_settings_count
  from public.ui_settings
  where my_palette is not null
    and not public.is_theme_palette(my_palette);

  if invalid_themes_count > 0 or invalid_ui_settings_count > 0 then
    raise exception
      'Contrat palette theme invalide sur les donnees existantes : themes=% ui_settings=%',
      invalid_themes_count,
      invalid_ui_settings_count;
  end if;
end $$;

alter table public.themes
  add constraint themes_palette_contract_check
  check (public.is_theme_palette(palette)) not valid;

alter table public.themes
  validate constraint themes_palette_contract_check;

alter table public.ui_settings
  add constraint ui_settings_my_palette_contract_check
  check (my_palette is null or public.is_theme_palette(my_palette)) not valid;

alter table public.ui_settings
  validate constraint ui_settings_my_palette_contract_check;
