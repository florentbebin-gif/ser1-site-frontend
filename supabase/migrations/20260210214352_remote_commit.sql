drop extension if exists "pg_net";


  create table "public"."app_settings_meta" (
    "key" text not null,
    "value" jsonb not null default '{}'::jsonb,
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."app_settings_meta" enable row level security;


  create table "public"."cabinets" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "default_theme_id" uuid,
    "logo_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "logo_placement" character varying(20) default 'center-bottom'::character varying
      );


alter table "public"."cabinets" enable row level security;


  create table "public"."fiscality_settings" (
    "id" bigint not null,
    "data" jsonb not null default '{}'::jsonb,
    "updated_at" timestamp with time zone not null default now(),
    "settings" jsonb,
    "version" integer default 1
      );


alter table "public"."fiscality_settings" enable row level security;


  create table "public"."issue_reports" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "user_id" uuid not null,
    "page" text not null,
    "title" text not null,
    "description" text not null,
    "meta" jsonb default '{}'::jsonb,
    "status" text not null default 'new'::text,
    "admin_read_at" timestamp with time zone
      );


alter table "public"."issue_reports" enable row level security;


  create table "public"."logos" (
    "id" uuid not null default gen_random_uuid(),
    "sha256" text not null,
    "storage_path" text not null,
    "mime" text not null,
    "width" integer,
    "height" integer,
    "bytes" integer,
    "created_at" timestamp with time zone default now(),
    "created_by" uuid
      );


alter table "public"."logos" enable row level security;


  create table "public"."pass_history" (
    "year" integer not null,
    "pass_amount" numeric,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."pass_history" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "email" text,
    "role" text not null default 'user'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "cabinet_id" uuid
      );


alter table "public"."profiles" enable row level security;


  create table "public"."ps_settings" (
    "id" integer not null,
    "data" jsonb not null,
    "updated_at" timestamp with time zone default now(),
    "settings" jsonb,
    "version" integer default 1
      );


alter table "public"."ps_settings" enable row level security;


  create table "public"."tax_settings" (
    "id" integer not null,
    "data" jsonb not null,
    "updated_at" timestamp with time zone default now(),
    "settings" jsonb,
    "version" integer default 1
      );


alter table "public"."tax_settings" enable row level security;


  create table "public"."themes" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "palette" jsonb not null,
    "is_system" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."themes" enable row level security;


  create table "public"."ui_settings" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "theme_name" text default 'default'::text,
    "colors" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "mode" text default 'simplifie'::text,
    "custom_palette" jsonb,
    "custom_palette_updated_at" timestamp with time zone,
    "selected_theme_ref" text default 'cabinet'::text,
    "active_palette" jsonb,
    "theme_mode" text,
    "preset_id" text,
    "my_palette" jsonb
      );


alter table "public"."ui_settings" enable row level security;

CREATE UNIQUE INDEX app_settings_meta_pkey ON public.app_settings_meta USING btree (key);

CREATE UNIQUE INDEX cabinets_name_key ON public.cabinets USING btree (name);

CREATE UNIQUE INDEX cabinets_pkey ON public.cabinets USING btree (id);

CREATE UNIQUE INDEX fiscality_settings_pkey ON public.fiscality_settings USING btree (id);

CREATE INDEX idx_cabinets_name ON public.cabinets USING btree (name);

CREATE INDEX idx_issue_reports_admin_unread ON public.issue_reports USING btree (created_at DESC) WHERE (admin_read_at IS NULL);

CREATE INDEX idx_issue_reports_unread ON public.issue_reports USING btree (created_at DESC) WHERE (admin_read_at IS NULL);

CREATE INDEX idx_logos_sha256 ON public.logos USING btree (sha256);

CREATE INDEX idx_profiles_cabinet_id ON public.profiles USING btree (cabinet_id);

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);

CREATE INDEX idx_themes_name ON public.themes USING btree (name);

CREATE INDEX idx_ui_settings_selected_theme ON public.ui_settings USING btree (selected_theme_ref);

CREATE INDEX idx_ui_settings_theme_mode ON public.ui_settings USING btree (theme_mode);

CREATE INDEX idx_ui_settings_user_id ON public.ui_settings USING btree (user_id);

CREATE INDEX issue_reports_admin_read_at_idx ON public.issue_reports USING btree (admin_read_at);

CREATE UNIQUE INDEX issue_reports_pkey ON public.issue_reports USING btree (id);

CREATE INDEX issue_reports_user_id_created_at_idx ON public.issue_reports USING btree (user_id, created_at DESC);

CREATE UNIQUE INDEX logos_pkey ON public.logos USING btree (id);

CREATE UNIQUE INDEX logos_sha256_key ON public.logos USING btree (sha256);

CREATE UNIQUE INDEX pass_history_pkey ON public.pass_history USING btree (year);

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX ps_settings_pkey ON public.ps_settings USING btree (id);

CREATE UNIQUE INDEX tax_settings_pkey ON public.tax_settings USING btree (id);

CREATE UNIQUE INDEX themes_name_key ON public.themes USING btree (name);

CREATE UNIQUE INDEX themes_pkey ON public.themes USING btree (id);

CREATE UNIQUE INDEX ui_settings_pkey ON public.ui_settings USING btree (id);

CREATE UNIQUE INDEX ui_settings_user_id_unique ON public.ui_settings USING btree (user_id);

alter table "public"."app_settings_meta" add constraint "app_settings_meta_pkey" PRIMARY KEY using index "app_settings_meta_pkey";

alter table "public"."cabinets" add constraint "cabinets_pkey" PRIMARY KEY using index "cabinets_pkey";

alter table "public"."fiscality_settings" add constraint "fiscality_settings_pkey" PRIMARY KEY using index "fiscality_settings_pkey";

alter table "public"."issue_reports" add constraint "issue_reports_pkey" PRIMARY KEY using index "issue_reports_pkey";

alter table "public"."logos" add constraint "logos_pkey" PRIMARY KEY using index "logos_pkey";

alter table "public"."pass_history" add constraint "pass_history_pkey" PRIMARY KEY using index "pass_history_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."ps_settings" add constraint "ps_settings_pkey" PRIMARY KEY using index "ps_settings_pkey";

alter table "public"."tax_settings" add constraint "tax_settings_pkey" PRIMARY KEY using index "tax_settings_pkey";

alter table "public"."themes" add constraint "themes_pkey" PRIMARY KEY using index "themes_pkey";

alter table "public"."ui_settings" add constraint "ui_settings_pkey" PRIMARY KEY using index "ui_settings_pkey";

alter table "public"."cabinets" add constraint "cabinets_default_theme_id_fkey" FOREIGN KEY (default_theme_id) REFERENCES public.themes(id) ON DELETE SET NULL not valid;

alter table "public"."cabinets" validate constraint "cabinets_default_theme_id_fkey";

alter table "public"."cabinets" add constraint "cabinets_logo_id_fkey" FOREIGN KEY (logo_id) REFERENCES public.logos(id) ON DELETE SET NULL not valid;

alter table "public"."cabinets" validate constraint "cabinets_logo_id_fkey";

alter table "public"."cabinets" add constraint "cabinets_name_key" UNIQUE using index "cabinets_name_key";

alter table "public"."cabinets" add constraint "chk_logo_placement" CHECK (((logo_placement)::text = ANY ((ARRAY['center-bottom'::character varying, 'center-top'::character varying, 'bottom-left'::character varying, 'bottom-right'::character varying, 'top-left'::character varying, 'top-right'::character varying])::text[]))) not valid;

alter table "public"."cabinets" validate constraint "chk_logo_placement";

alter table "public"."issue_reports" add constraint "issue_reports_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."issue_reports" validate constraint "issue_reports_user_id_fkey";

alter table "public"."logos" add constraint "logos_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."logos" validate constraint "logos_created_by_fkey";

alter table "public"."logos" add constraint "logos_sha256_key" UNIQUE using index "logos_sha256_key";

alter table "public"."profiles" add constraint "profiles_cabinet_id_fkey" FOREIGN KEY (cabinet_id) REFERENCES public.cabinets(id) ON DELETE SET NULL not valid;

alter table "public"."profiles" validate constraint "profiles_cabinet_id_fkey";

alter table "public"."profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_role_check" CHECK ((role = ANY (ARRAY['user'::text, 'admin'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_role_check";

alter table "public"."themes" add constraint "themes_name_key" UNIQUE using index "themes_name_key";

alter table "public"."ui_settings" add constraint "ui_settings_mode_check" CHECK ((mode = ANY (ARRAY['expert'::text, 'simplifie'::text]))) not valid;

alter table "public"."ui_settings" validate constraint "ui_settings_mode_check";

alter table "public"."ui_settings" add constraint "ui_settings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."ui_settings" validate constraint "ui_settings_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.bump_settings_version()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  new_version integer;
BEGIN
  INSERT INTO public.settings_version (version, updated_at)
  VALUES (
    COALESCE((SELECT MAX(version) FROM public.settings_version), 0) + 1,
    now()
  )
  RETURNING version INTO new_version;
  
  RETURN new_version;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.ensure_pass_history_current()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_year INT := EXTRACT(YEAR FROM now())::INT;
  v_max_year     INT;
  v_y            INT;
BEGIN
  -- Récupérer l'année max existante
  SELECT max(year) INTO v_max_year FROM public.pass_history;

  -- Si la table est vide, rien à faire (le seed doit avoir été appliqué)
  IF v_max_year IS NULL THEN
    RETURN;
  END IF;

  -- Insérer les années manquantes jusqu'à l'année courante
  IF v_max_year < v_current_year THEN
    FOR v_y IN (v_max_year + 1)..v_current_year LOOP
      INSERT INTO public.pass_history (year, pass_amount)
      VALUES (v_y, NULL)
      ON CONFLICT (year) DO NOTHING;
    END LOOP;
  END IF;

  -- Garder exactement les 8 plus récentes
  DELETE FROM public.pass_history
  WHERE year NOT IN (
    SELECT year FROM public.pass_history
    ORDER BY year DESC
    LIMIT 8
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_cabinet_logo()
 RETURNS TABLE(storage_path text, placement character varying)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    l.storage_path,
    c.logo_placement
  FROM public.profiles p
  JOIN public.cabinets c ON c.id = p.cabinet_id
  JOIN public.logos l ON l.id = c.logo_id
  WHERE p.id = auth.uid()
  LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_cabinet_theme_palette()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT t.palette
  FROM public.profiles p
  JOIN public.cabinets c ON c.id = p.cabinet_id
  JOIN public.themes t ON t.id = c.default_theme_id
  WHERE p.id = auth.uid()
  LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.get_settings_version()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_version integer;
BEGIN
  SELECT version INTO v_version
  FROM public.settings_version
  ORDER BY updated_at DESC
  LIMIT 1;
  
  RETURN COALESCE(v_version, 0);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_app_meta_data->>'role', 'user'),
    NEW.created_at
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT COALESCE(
    (COALESCE(current_setting('request.jwt.claims', true), '{}'))::jsonb
      -> 'app_metadata' ->> 'role',
    'user'
  ) = 'admin';
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles p 
    WHERE p.id = uid AND lower(COALESCE(p.role,'')) = 'admin'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.set_issue_report_user_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_settings_data_fiscality()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  PERFORM pg_notify('settings_changed', json_build_object(
    'table', 'fiscality_settings',
    'user_id', auth.uid(),
    'timestamp', extract(epoch from now())
  )::text);
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_settings_data_ps()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  PERFORM pg_notify('settings_changed', json_build_object(
    'table', 'ps_settings',
    'user_id', auth.uid(),
    'timestamp', extract(epoch from now())
  )::text);
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_settings_data_tax()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  -- Logique de sync à adapter selon votre implémentation actuelle
  -- Exemple: met à jour une table agrégée ou déclenche un event
  PERFORM pg_notify('settings_changed', json_build_object(
    'table', 'tax_settings',
    'user_id', auth.uid(),
    'timestamp', extract(epoch from now())
  )::text);
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_custom_palette_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- Met à jour l'horodatage si la palette personnalisée a changé
  IF NEW.custom_palette IS DISTINCT FROM OLD.custom_palette THEN
    NEW.custom_palette_updated_at := pg_catalog.now();
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_pass_history_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;

grant delete on table "public"."app_settings_meta" to "anon";

grant insert on table "public"."app_settings_meta" to "anon";

grant references on table "public"."app_settings_meta" to "anon";

grant select on table "public"."app_settings_meta" to "anon";

grant trigger on table "public"."app_settings_meta" to "anon";

grant truncate on table "public"."app_settings_meta" to "anon";

grant update on table "public"."app_settings_meta" to "anon";

grant delete on table "public"."app_settings_meta" to "authenticated";

grant insert on table "public"."app_settings_meta" to "authenticated";

grant references on table "public"."app_settings_meta" to "authenticated";

grant select on table "public"."app_settings_meta" to "authenticated";

grant trigger on table "public"."app_settings_meta" to "authenticated";

grant truncate on table "public"."app_settings_meta" to "authenticated";

grant update on table "public"."app_settings_meta" to "authenticated";

grant delete on table "public"."app_settings_meta" to "service_role";

grant insert on table "public"."app_settings_meta" to "service_role";

grant references on table "public"."app_settings_meta" to "service_role";

grant select on table "public"."app_settings_meta" to "service_role";

grant trigger on table "public"."app_settings_meta" to "service_role";

grant truncate on table "public"."app_settings_meta" to "service_role";

grant update on table "public"."app_settings_meta" to "service_role";

grant delete on table "public"."cabinets" to "anon";

grant insert on table "public"."cabinets" to "anon";

grant references on table "public"."cabinets" to "anon";

grant select on table "public"."cabinets" to "anon";

grant trigger on table "public"."cabinets" to "anon";

grant truncate on table "public"."cabinets" to "anon";

grant update on table "public"."cabinets" to "anon";

grant delete on table "public"."cabinets" to "authenticated";

grant insert on table "public"."cabinets" to "authenticated";

grant references on table "public"."cabinets" to "authenticated";

grant select on table "public"."cabinets" to "authenticated";

grant trigger on table "public"."cabinets" to "authenticated";

grant truncate on table "public"."cabinets" to "authenticated";

grant update on table "public"."cabinets" to "authenticated";

grant delete on table "public"."cabinets" to "service_role";

grant insert on table "public"."cabinets" to "service_role";

grant references on table "public"."cabinets" to "service_role";

grant select on table "public"."cabinets" to "service_role";

grant trigger on table "public"."cabinets" to "service_role";

grant truncate on table "public"."cabinets" to "service_role";

grant update on table "public"."cabinets" to "service_role";

grant delete on table "public"."fiscality_settings" to "anon";

grant insert on table "public"."fiscality_settings" to "anon";

grant references on table "public"."fiscality_settings" to "anon";

grant select on table "public"."fiscality_settings" to "anon";

grant trigger on table "public"."fiscality_settings" to "anon";

grant truncate on table "public"."fiscality_settings" to "anon";

grant update on table "public"."fiscality_settings" to "anon";

grant delete on table "public"."fiscality_settings" to "authenticated";

grant insert on table "public"."fiscality_settings" to "authenticated";

grant references on table "public"."fiscality_settings" to "authenticated";

grant select on table "public"."fiscality_settings" to "authenticated";

grant trigger on table "public"."fiscality_settings" to "authenticated";

grant truncate on table "public"."fiscality_settings" to "authenticated";

grant update on table "public"."fiscality_settings" to "authenticated";

grant delete on table "public"."fiscality_settings" to "service_role";

grant insert on table "public"."fiscality_settings" to "service_role";

grant references on table "public"."fiscality_settings" to "service_role";

grant select on table "public"."fiscality_settings" to "service_role";

grant trigger on table "public"."fiscality_settings" to "service_role";

grant truncate on table "public"."fiscality_settings" to "service_role";

grant update on table "public"."fiscality_settings" to "service_role";

grant delete on table "public"."issue_reports" to "anon";

grant insert on table "public"."issue_reports" to "anon";

grant references on table "public"."issue_reports" to "anon";

grant select on table "public"."issue_reports" to "anon";

grant trigger on table "public"."issue_reports" to "anon";

grant truncate on table "public"."issue_reports" to "anon";

grant update on table "public"."issue_reports" to "anon";

grant delete on table "public"."issue_reports" to "authenticated";

grant insert on table "public"."issue_reports" to "authenticated";

grant references on table "public"."issue_reports" to "authenticated";

grant select on table "public"."issue_reports" to "authenticated";

grant trigger on table "public"."issue_reports" to "authenticated";

grant truncate on table "public"."issue_reports" to "authenticated";

grant update on table "public"."issue_reports" to "authenticated";

grant delete on table "public"."issue_reports" to "service_role";

grant insert on table "public"."issue_reports" to "service_role";

grant references on table "public"."issue_reports" to "service_role";

grant select on table "public"."issue_reports" to "service_role";

grant trigger on table "public"."issue_reports" to "service_role";

grant truncate on table "public"."issue_reports" to "service_role";

grant update on table "public"."issue_reports" to "service_role";

grant delete on table "public"."logos" to "anon";

grant insert on table "public"."logos" to "anon";

grant references on table "public"."logos" to "anon";

grant select on table "public"."logos" to "anon";

grant trigger on table "public"."logos" to "anon";

grant truncate on table "public"."logos" to "anon";

grant update on table "public"."logos" to "anon";

grant delete on table "public"."logos" to "authenticated";

grant insert on table "public"."logos" to "authenticated";

grant references on table "public"."logos" to "authenticated";

grant select on table "public"."logos" to "authenticated";

grant trigger on table "public"."logos" to "authenticated";

grant truncate on table "public"."logos" to "authenticated";

grant update on table "public"."logos" to "authenticated";

grant delete on table "public"."logos" to "service_role";

grant insert on table "public"."logos" to "service_role";

grant references on table "public"."logos" to "service_role";

grant select on table "public"."logos" to "service_role";

grant trigger on table "public"."logos" to "service_role";

grant truncate on table "public"."logos" to "service_role";

grant update on table "public"."logos" to "service_role";

grant delete on table "public"."pass_history" to "anon";

grant insert on table "public"."pass_history" to "anon";

grant references on table "public"."pass_history" to "anon";

grant select on table "public"."pass_history" to "anon";

grant trigger on table "public"."pass_history" to "anon";

grant truncate on table "public"."pass_history" to "anon";

grant update on table "public"."pass_history" to "anon";

grant delete on table "public"."pass_history" to "authenticated";

grant insert on table "public"."pass_history" to "authenticated";

grant references on table "public"."pass_history" to "authenticated";

grant select on table "public"."pass_history" to "authenticated";

grant trigger on table "public"."pass_history" to "authenticated";

grant truncate on table "public"."pass_history" to "authenticated";

grant update on table "public"."pass_history" to "authenticated";

grant delete on table "public"."pass_history" to "service_role";

grant insert on table "public"."pass_history" to "service_role";

grant references on table "public"."pass_history" to "service_role";

grant select on table "public"."pass_history" to "service_role";

grant trigger on table "public"."pass_history" to "service_role";

grant truncate on table "public"."pass_history" to "service_role";

grant update on table "public"."pass_history" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."ps_settings" to "anon";

grant insert on table "public"."ps_settings" to "anon";

grant references on table "public"."ps_settings" to "anon";

grant select on table "public"."ps_settings" to "anon";

grant trigger on table "public"."ps_settings" to "anon";

grant truncate on table "public"."ps_settings" to "anon";

grant update on table "public"."ps_settings" to "anon";

grant delete on table "public"."ps_settings" to "authenticated";

grant insert on table "public"."ps_settings" to "authenticated";

grant references on table "public"."ps_settings" to "authenticated";

grant select on table "public"."ps_settings" to "authenticated";

grant trigger on table "public"."ps_settings" to "authenticated";

grant truncate on table "public"."ps_settings" to "authenticated";

grant update on table "public"."ps_settings" to "authenticated";

grant delete on table "public"."ps_settings" to "service_role";

grant insert on table "public"."ps_settings" to "service_role";

grant references on table "public"."ps_settings" to "service_role";

grant select on table "public"."ps_settings" to "service_role";

grant trigger on table "public"."ps_settings" to "service_role";

grant truncate on table "public"."ps_settings" to "service_role";

grant update on table "public"."ps_settings" to "service_role";

grant delete on table "public"."tax_settings" to "anon";

grant insert on table "public"."tax_settings" to "anon";

grant references on table "public"."tax_settings" to "anon";

grant select on table "public"."tax_settings" to "anon";

grant trigger on table "public"."tax_settings" to "anon";

grant truncate on table "public"."tax_settings" to "anon";

grant update on table "public"."tax_settings" to "anon";

grant delete on table "public"."tax_settings" to "authenticated";

grant insert on table "public"."tax_settings" to "authenticated";

grant references on table "public"."tax_settings" to "authenticated";

grant select on table "public"."tax_settings" to "authenticated";

grant trigger on table "public"."tax_settings" to "authenticated";

grant truncate on table "public"."tax_settings" to "authenticated";

grant update on table "public"."tax_settings" to "authenticated";

grant delete on table "public"."tax_settings" to "service_role";

grant insert on table "public"."tax_settings" to "service_role";

grant references on table "public"."tax_settings" to "service_role";

grant select on table "public"."tax_settings" to "service_role";

grant trigger on table "public"."tax_settings" to "service_role";

grant truncate on table "public"."tax_settings" to "service_role";

grant update on table "public"."tax_settings" to "service_role";

grant delete on table "public"."themes" to "anon";

grant insert on table "public"."themes" to "anon";

grant references on table "public"."themes" to "anon";

grant select on table "public"."themes" to "anon";

grant trigger on table "public"."themes" to "anon";

grant truncate on table "public"."themes" to "anon";

grant update on table "public"."themes" to "anon";

grant delete on table "public"."themes" to "authenticated";

grant insert on table "public"."themes" to "authenticated";

grant references on table "public"."themes" to "authenticated";

grant select on table "public"."themes" to "authenticated";

grant trigger on table "public"."themes" to "authenticated";

grant truncate on table "public"."themes" to "authenticated";

grant update on table "public"."themes" to "authenticated";

grant delete on table "public"."themes" to "service_role";

grant insert on table "public"."themes" to "service_role";

grant references on table "public"."themes" to "service_role";

grant select on table "public"."themes" to "service_role";

grant trigger on table "public"."themes" to "service_role";

grant truncate on table "public"."themes" to "service_role";

grant update on table "public"."themes" to "service_role";

grant delete on table "public"."ui_settings" to "anon";

grant insert on table "public"."ui_settings" to "anon";

grant references on table "public"."ui_settings" to "anon";

grant select on table "public"."ui_settings" to "anon";

grant trigger on table "public"."ui_settings" to "anon";

grant truncate on table "public"."ui_settings" to "anon";

grant update on table "public"."ui_settings" to "anon";

grant delete on table "public"."ui_settings" to "authenticated";

grant insert on table "public"."ui_settings" to "authenticated";

grant references on table "public"."ui_settings" to "authenticated";

grant select on table "public"."ui_settings" to "authenticated";

grant trigger on table "public"."ui_settings" to "authenticated";

grant truncate on table "public"."ui_settings" to "authenticated";

grant update on table "public"."ui_settings" to "authenticated";

grant delete on table "public"."ui_settings" to "service_role";

grant insert on table "public"."ui_settings" to "service_role";

grant references on table "public"."ui_settings" to "service_role";

grant select on table "public"."ui_settings" to "service_role";

grant trigger on table "public"."ui_settings" to "service_role";

grant truncate on table "public"."ui_settings" to "service_role";

grant update on table "public"."ui_settings" to "service_role";


  create policy "app_settings_meta_read_auth"
  on "public"."app_settings_meta"
  as permissive
  for select
  to authenticated
using (true);



  create policy "app_settings_meta_write_admin"
  on "public"."app_settings_meta"
  as permissive
  for all
  to authenticated
using (public.is_admin())
with check (public.is_admin());



  create policy "Admins can manage cabinets"
  on "public"."cabinets"
  as permissive
  for all
  to public
using (public.is_admin())
with check (public.is_admin());



  create policy "Admins can write fiscality_settings"
  on "public"."fiscality_settings"
  as permissive
  for all
  to public
using (public.is_admin())
with check (public.is_admin());



  create policy "Authenticated users can read fiscality_settings"
  on "public"."fiscality_settings"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "fiscality_settings_select_authenticated"
  on "public"."fiscality_settings"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Admins can manage all issue_reports"
  on "public"."issue_reports"
  as permissive
  for all
  to public
using (public.is_admin())
with check (public.is_admin());



  create policy "Users can insert issue reports"
  on "public"."issue_reports"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can read their own issue reports"
  on "public"."issue_reports"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "Users can view own issue reports"
  on "public"."issue_reports"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "Admins can manage logos"
  on "public"."logos"
  as permissive
  for all
  to public
using (public.is_admin())
with check (public.is_admin());



  create policy "pass_history_admin_delete"
  on "public"."pass_history"
  as permissive
  for delete
  to authenticated
using (public.is_admin());



  create policy "pass_history_admin_insert"
  on "public"."pass_history"
  as permissive
  for insert
  to authenticated
with check (public.is_admin());



  create policy "pass_history_admin_update"
  on "public"."pass_history"
  as permissive
  for update
  to authenticated
using (public.is_admin());



  create policy "pass_history_select"
  on "public"."pass_history"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Admins can update any profile"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles profiles_1
  WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'admin'::text)))));



  create policy "Users can view own profile"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((auth.uid() = id));



  create policy "Admins can write ps_settings"
  on "public"."ps_settings"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Authenticated users can read ps_settings"
  on "public"."ps_settings"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Admins can write tax_settings"
  on "public"."tax_settings"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Authenticated users can read tax_settings"
  on "public"."tax_settings"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Admins can manage themes"
  on "public"."themes"
  as permissive
  for all
  to public
using (public.is_admin())
with check (public.is_admin());



  create policy "Anyone can read themes"
  on "public"."themes"
  as permissive
  for select
  to public
using (true);



  create policy "Everyone can read default themes"
  on "public"."ui_settings"
  as permissive
  for select
  to public
using ((theme_name = 'default'::text));



  create policy "Users can manage their own UI settings"
  on "public"."ui_settings"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));


CREATE TRIGGER set_cabinets_updated_at BEFORE UPDATE ON public.cabinets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_fiscality_settings_updated_at BEFORE UPDATE ON public.fiscality_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tr_fiscality_settings_sync_settings_data BEFORE INSERT OR UPDATE ON public.fiscality_settings FOR EACH ROW EXECUTE FUNCTION public.sync_settings_data_fiscality();

CREATE TRIGGER trg_fiscality_settings_updated_at BEFORE UPDATE ON public.fiscality_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_set_issue_report_user_id BEFORE INSERT ON public.issue_reports FOR EACH ROW EXECUTE FUNCTION public.set_issue_report_user_id();

CREATE TRIGGER trg_pass_history_updated_at BEFORE UPDATE ON public.pass_history FOR EACH ROW EXECUTE FUNCTION public.update_pass_history_updated_at();

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_ps_settings_updated_at BEFORE UPDATE ON public.ps_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tr_ps_settings_sync_settings_data BEFORE INSERT OR UPDATE ON public.ps_settings FOR EACH ROW EXECUTE FUNCTION public.sync_settings_data_ps();

CREATE TRIGGER set_tax_settings_updated_at BEFORE UPDATE ON public.tax_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tr_tax_settings_sync_settings_data BEFORE INSERT OR UPDATE ON public.tax_settings FOR EACH ROW EXECUTE FUNCTION public.sync_settings_data_tax();

CREATE TRIGGER set_themes_updated_at BEFORE UPDATE ON public.themes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_custom_palette_timestamp BEFORE UPDATE ON public.ui_settings FOR EACH ROW EXECUTE FUNCTION public.update_custom_palette_timestamp();

CREATE TRIGGER update_ui_settings_updated_at BEFORE UPDATE ON public.ui_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER tr_handle_new_auth_user AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

do $$
begin
  if to_regclass('storage.objects') is not null then
    execute 'drop trigger if exists "objects_delete_delete_prefix" on "storage"."objects"';
    execute 'drop trigger if exists "objects_insert_create_prefix" on "storage"."objects"';
    execute 'drop trigger if exists "objects_update_create_prefix" on "storage"."objects"';
  end if;

  if to_regclass('storage.prefixes') is not null then
    execute 'drop trigger if exists "prefixes_create_hierarchy" on "storage"."prefixes"';
    execute 'drop trigger if exists "prefixes_delete_hierarchy" on "storage"."prefixes"';
  end if;
end
$$;


  create policy "Admins can delete logos"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'logos'::text) AND public.is_admin()));



  create policy "Admins can insert logos"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'logos'::text) AND public.is_admin()));



  create policy "Admins can select logos"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'logos'::text) AND public.is_admin()));



  create policy "Admins can update logos"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'logos'::text) AND public.is_admin()))
with check (((bucket_id = 'logos'::text) AND public.is_admin()));



  create policy "Authenticated uploads to COVERS"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'covers'::text));



  create policy "Public read logos"
  on "storage"."objects"
  as permissive
  for select
  to anon, authenticated
using ((bucket_id = 'logos'::text));



  create policy "Public read on COVERS"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'covers'::text));


do $$
begin
  if to_regclass('storage.buckets') is not null and not exists (
    select 1 from pg_trigger where tgname = 'protect_buckets_delete'
  ) then
    execute 'CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete()';
  end if;

  if to_regclass('storage.objects') is not null and not exists (
    select 1 from pg_trigger where tgname = 'protect_objects_delete'
  ) then
    execute 'CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete()';
  end if;
end
$$;


