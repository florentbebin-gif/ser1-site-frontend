# RLS Policies Backup - fiscality_settings

**Date de sauvegarde :** 2026-01-31
**Table :** `fiscality_settings`

## Politiques RLS actuelles

Ce fichier sert de backup pour rollback en cas de modification des politiques RLS.

### 1. Admins can write fiscality_settings

```sql
CREATE POLICY "Admins can write fiscality_settings"
  ON fiscality_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'::text
    )
  );
```

### 2. Authenticated users can read fiscality_settings

```sql
CREATE POLICY "Authenticated users can read fiscality_settings"
  ON fiscality_settings
  FOR SELECT
  USING (auth.role() = 'authenticated'::text);
```

### 3. fiscality_settings_select_authenticated

```sql
CREATE POLICY "fiscality_settings_select_authenticated"
  ON fiscality_settings
  FOR SELECT
  USING (true);
```

### 4. fiscality_settings_write_admin

```sql
CREATE POLICY "fiscality_settings_write_admin"
  ON fiscality_settings
  FOR ALL
  USING (
    lower(COALESCE(
      (auth.jwt() -> 'user_metadata'::text) ->> 'role'::text,
      ''::text
    )) = 'admin'::text
  )
  WITH CHECK (
    lower(COALESCE(
      (auth.jwt() -> 'user_metadata'::text) ->> 'role'::text,
      ''::text
    )) = 'admin'::text
  );
```

## Rollback - Récréation complète

```sql
-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "Admins can write fiscality_settings" ON fiscality_settings;
DROP POLICY IF EXISTS "Authenticated users can read fiscality_settings" ON fiscality_settings;
DROP POLICY IF EXISTS "fiscality_settings_select_authenticated" ON fiscality_settings;
DROP POLICY IF EXISTS "fiscality_settings_write_admin" ON fiscality_settings;

-- Recréer les politiques
CREATE POLICY "Admins can write fiscality_settings"
  ON fiscality_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'::text
    )
  );

CREATE POLICY "Authenticated users can read fiscality_settings"
  ON fiscality_settings
  FOR SELECT
  USING (auth.role() = 'authenticated'::text);

CREATE POLICY "fiscality_settings_select_authenticated"
  ON fiscality_settings
  FOR SELECT
  USING (true);

CREATE POLICY "fiscality_settings_write_admin"
  ON fiscality_settings
  FOR ALL
  USING (
    lower(COALESCE(
      (auth.jwt() -> 'user_metadata'::text) ->> 'role'::text,
      ''::text
    )) = 'admin'::text
  )
  WITH CHECK (
    lower(COALESCE(
      (auth.jwt() -> 'user_metadata'::text) ->> 'role'::text,
      ''::text
    )) = 'admin'::text
  );
```
