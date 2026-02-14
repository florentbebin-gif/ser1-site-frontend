# B3 — Vérification runtime SaaS (read-only)

## Objectif

Valider sur l'environnement cible:

1. `self-signup` désactivé (P0-01)
2. politiques RLS `profiles` actives (P0-02)
3. isolation multi-cabinet vérifiable

## Pré-requis

- Variables d'environnement (ou paramètres script):
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - (optionnel) `SUPABASE_DB_URL` pour exécuter les requêtes SQL via `psql`
- Script: `tools/scripts/verify-runtime-saas.ps1`

## Exécution rapide

```powershell
# Probe signup + SQL checks (si SUPABASE_DB_URL disponible)
powershell -ExecutionPolicy Bypass -File tools/scripts/verify-runtime-saas.ps1
```

## Checks et résultats attendus

### 1) Signup probe (P0-01)

- Endpoint: `POST {SUPABASE_URL}/auth/v1/signup`
- Attendu: refus explicite (`Signups not allowed` ou équivalent)
- Si statut ambigu: marquer `RUNTIME=UNKNOWN` et vérifier dashboard Auth.

### 2) Policies `profiles` (P0-02)

Requête:

```sql
select schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check
from pg_policies
where tablename = 'profiles'
order by policyname;
```

Attendu:

- policies type `profiles_select_own`, `profiles_select_admin_same_cabinet`, etc.

### 3) RLS activé `profiles`

Requête:

```sql
select relrowsecurity
from pg_class
where relname = 'profiles';
```

Attendu:

- `relrowsecurity = true`

### 4) Mini test isolation cabinet (lecture seule)

Le script fournit un SQL template pour vérifier qu'un admin A ne lit pas les profils cabinet B.

> Note: ce test nécessite des IDs de profils/cabinets de test.

## Sortie attendue

- Résumé final avec statuts:
  - `SIGNUP_PROBE`: PASS/FAIL/UNKNOWN
  - `PROFILES_POLICIES`: PASS/FAIL/UNKNOWN
  - `PROFILES_RLS`: PASS/FAIL/UNKNOWN
  - `CABINET_ISOLATION`: PASS/FAIL/UNKNOWN
