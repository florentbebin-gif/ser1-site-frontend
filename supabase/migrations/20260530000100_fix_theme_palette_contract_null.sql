create or replace function public.is_theme_palette(value jsonb)
returns boolean
language sql
immutable
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

do $$
declare
  valid_palette constant jsonb := jsonb_build_object(
    'c1', '#111111',
    'c2', '#222222',
    'c3', '#333333',
    'c4', '#444444',
    'c5', '#555555',
    'c6', '#666666',
    'c7', '#777777',
    'c8', '#888888',
    'c9', '#999999',
    'c10', '#AAAAAA'
  );
begin
  if public.is_theme_palette('{}'::jsonb) is not false then
    raise exception 'is_theme_palette doit refuser une palette vide';
  end if;

  if public.is_theme_palette(null::jsonb) is not false then
    raise exception 'is_theme_palette doit refuser une valeur null';
  end if;

  if public.is_theme_palette(valid_palette - 'c10') is not false then
    raise exception 'is_theme_palette doit refuser une cle manquante';
  end if;

  if public.is_theme_palette(valid_palette || jsonb_build_object('c11', '#BBBBBB')) is not false then
    raise exception 'is_theme_palette doit refuser une cle extra';
  end if;

  if public.is_theme_palette(jsonb_set(valid_palette, '{c2}', '"#12345G"'::jsonb)) is not false then
    raise exception 'is_theme_palette doit refuser un hex invalide';
  end if;

  if public.is_theme_palette(valid_palette) is not true then
    raise exception 'is_theme_palette doit accepter une palette valide';
  end if;
end $$;

alter table public.themes
  drop constraint if exists themes_palette_contract_check;

alter table public.themes
  add constraint themes_palette_contract_check
  check (public.is_theme_palette(palette) is true) not valid;

alter table public.themes
  validate constraint themes_palette_contract_check;

alter table public.ui_settings
  drop constraint if exists ui_settings_my_palette_contract_check;

alter table public.ui_settings
  add constraint ui_settings_my_palette_contract_check
  check (my_palette is null or public.is_theme_palette(my_palette) is true) not valid;

alter table public.ui_settings
  validate constraint ui_settings_my_palette_contract_check;
