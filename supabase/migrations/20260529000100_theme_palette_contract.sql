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
  invalid_palette_rows jsonb;
begin
  with required(key) as (
    values ('c1'), ('c2'), ('c3'), ('c4'), ('c5'), ('c6'), ('c7'), ('c8'), ('c9'), ('c10')
  ),
  candidates as (
    select 'themes' as table_name, id::text as row_id, 'palette' as field_name, palette, false as null_allowed
    from public.themes
    union all
    select 'ui_settings' as table_name, id::text as row_id, 'my_palette' as field_name, my_palette as palette, true as null_allowed
    from public.ui_settings
  ),
  diagnostics as (
    select
      table_name,
      row_id,
      field_name,
      case
        when palette is null and null_allowed then null
        when palette is null then 'palette null'
        when jsonb_typeof(palette) <> 'object' then 'palette non objet'
        when jsonb_typeof(palette) = 'object'
          and exists (select 1 from required where not palette ? key) then 'cle manquante'
        when jsonb_typeof(palette) = 'object'
          and exists (
            select 1
            from jsonb_object_keys(palette) as actual(key)
            where not exists (select 1 from required where required.key = actual.key)
          ) then 'cle extra'
        when jsonb_typeof(palette) = 'object'
          and exists (
            select 1
            from required
            where jsonb_typeof(palette -> key) <> 'string'
              or not ((palette ->> key) ~ '^#[0-9A-Fa-f]{6}$')
          ) then 'hex invalide'
        else null
      end as reason
    from candidates
  )
  select
    count(*) filter (where table_name = 'themes' and reason is not null),
    count(*) filter (where table_name = 'ui_settings' and reason is not null),
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'table', table_name,
          'id', row_id,
          'champ', field_name,
          'raison', reason
        )
        order by table_name, row_id, field_name
      ) filter (where reason is not null),
      '[]'::jsonb
    )
  into invalid_themes_count, invalid_ui_settings_count, invalid_palette_rows
  from diagnostics;

  if invalid_themes_count > 0 or invalid_ui_settings_count > 0 then
    raise exception
      'Contrat palette theme invalide sur les donnees existantes : themes=% ui_settings=% lignes invalides=%',
      invalid_themes_count,
      invalid_ui_settings_count,
      invalid_palette_rows;
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
