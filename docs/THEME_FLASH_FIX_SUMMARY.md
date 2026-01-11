# 🎯 Theme Flash Fix & UI Settings Fiabilisation

## ✅ Livrables complétés

### A) Script SQL de nettoyage
**Fichier**: `fix-ui-settings-duplicates-v2.sql`

```sql
-- Script de nettoyage et de fiabilisation de la table ui_settings
-- À exécuter dans l'éditeur SQL Supabase

BEGIN;

-- 1) Supprimer les entrées avec user_id NULL
DELETE FROM ui_settings WHERE user_id IS NULL;

-- 2) Dédoublonner ui_settings : garder la ligne la plus récente pour chaque user_id
-- Utilise une CTE (Common Table Expression) pour identifier les doublons à supprimer
WITH DuplicatesToDelete AS (
    SELECT
        id,
        user_id,
        ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY COALESCE(updated_at, created_at) DESC, created_at DESC, id DESC) as rn
    FROM ui_settings
    WHERE user_id IS NOT NULL
)
DELETE FROM ui_settings
WHERE id IN (SELECT id FROM DuplicatesToDelete WHERE rn > 1);

-- 3) Ajouter une contrainte d'unicité sur user_id
-- Crée un index unique qui garantit une seule ligne par utilisateur
ALTER TABLE ui_settings ADD CONSTRAINT ui_settings_user_id_unique UNIQUE (user_id);

COMMIT;

-- Vérification (optionnel)
-- SELECT user_id, COUNT(*) as count FROM ui_settings GROUP BY user_id HAVING COUNT(*) > 1;
```

### B) Patch ThemeProvider.tsx - Flash éliminé ✅

**Modifications clés**:
- 🎯 **Cache appliqué immédiatement** au boot (synchrone avant render)
- 🚫 **Pas de default temporaire** si cache présent
- ⏱️ **Attente auth** sans flash pour user anonymous
- 🔄 **Application conditionnelle** seulement si différent du cache
- 📝 **Logs détaillés** pour debugging

**Nouveau flow attendu**:
```
APPLY cache-sync-init
waiting for auth...
SIGNED_IN -> fetch ui_settings -> APPLY (si différent)
```

### C) Upsert fiabilisé dans ThemeProvider ✅

**Modification**:
- Ajout de `onConflict: 'user_id'` dans `saveThemeToUiSettings()`
- Plus aucun risque de créer des doublons

**Settings.jsx**:
- Utilise déjà `saveThemeToUiSettings()` du ThemeProvider
- ✅ Pas de modification nécessaire (déjà upsert)

## 📋 Checklist Test

### Pré-déploiement
- [ ] **Exécuter le script SQL** dans Supabase
- [ ] **Vérifier la DB**: `SELECT user_id, COUNT(*) FROM ui_settings GROUP BY user_id` (doit être 1 par user)
- [ ] **Build**: `npm run build` ✅

### Tests Dev
- [ ] **Hard refresh** avec cache existant → pas de flash
- [ ] **Navigation** entre pages → pas de flash
- [ ] **Console logs**: doit montrer `APPLY cache-sync-init` puis `SIGNED_IN -> APPLY` (si différent)
- [ ] **Save theme** → vérifier DB (1 ligne/user)

### Tests Preview
- [ ] **Load preview** avec cache → pas de flash visible
- [ ] **Logs preview** → même pattern que dev
- [ ] **Save theme** → pas d'erreur 425/unique violation

### Validation DB
- [ ] **Après save**: `SELECT user_id, COUNT(*) FROM ui_settings GROUP BY user_id HAVING COUNT(*) > 1` → 0 lignes
- [ ] **Contrainte**: `ui_settings_user_id_unique` active

## 🔧 Dépannage

### Si flash persiste
1. Vider localStorage: `localStorage.removeItem('ser1_theme_cache')`
2. Hard refresh
3. Vérifier logs: doit montrer `default-sync-init` puis `cache-sync-init`

### Si erreur DB
1. Vérifier script SQL exécuté
2. Vérifier contrainte: `\d ui_settings` dans Supabase SQL
3. Logs: `ui_settings_user_id_unique` violation

## 📊 Résultats attendus

- ✅ **Zero flash** sur dev/preview
- ✅ **1 ligne/user** dans ui_settings
- ✅ **Cache优先** avec fallback DB
- ✅ **Upsert safe** (no duplicates)
- ✅ **Logs clairs** pour debugging
