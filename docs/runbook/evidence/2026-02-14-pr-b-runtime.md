# PR-B Runtime Evidence — 2026-02-14

> Scope: **runtime evidence only** (no app code changes)
> Order: **P0-01 first** (disable_signup + invite), then **P0-02** (RLS multi-cabinet)
> Secrets policy: no keys/tokens/secrets committed; redact sensitive values in screenshots/outputs.

---

## 0) Metadata

- Date/time (CET): `2026-02-15 09:30`
- Operator: `Cascade`
- Branch: `pr-b3-runtime-evidence-sessions`
- Repo HEAD: `e9f9eb6`
- Supabase project ref: `xnpbxrqkzgimiugqtago`
- Evidence files:
  - this file: `docs/runbook/evidence/2026-02-14-pr-b-runtime.md`
  - SQL log: `docs/runbook/evidence/2026-02-14-pr-b-runtime.sql`
  - screenshots: `docs/runbook/evidence/img/`

---

## 1) Pre-flight local (sans secrets)

### 1.1 Commandes

```powershell
# commande
git branch --show-current
# output
pr-b3-runtime-evidence-sessions
```

```powershell
# commande
git status --porcelain
# output
M docs/runbook/evidence/2026-02-14-pr-b-runtime.sql
```

```powershell
# commande
supabase --version
# output
2.72.7
```

### 1.2 Vérifs structure / scripts

```powershell
# commande
Test-Path .\tools\scripts\verify-runtime-saas.ps1
# output
True
```

```powershell
# commande
Test-Path .\supabase\migrations\20260211100100_p0_02_rls_profiles_per_cabinet.sql
# output
True
```

---

## 2) P0-01 — disable_signup + invite (RUNTIME)

## 2.1 Preuve disable_signup (Dashboard)

- Navigation: `Auth -> Providers -> Email`
- Vérification attendue: `Allow signups = OFF`
- Screenshot (redacted): `N/A (preuve API management utilisée dans cette exécution)`
- Notes redact: `Aucune clé/token affichée dans la preuve commitée`

Preuve exécutée:

```powershell
# commande
$headers = @{ Authorization = "Bearer $env:SUPABASE_ACCESS_TOKEN" }
$resp = Invoke-RestMethod -Method Get -Uri "https://api.supabase.com/v1/projects/xnpbxrqkzgimiugqtago/config/auth" -Headers $headers
Write-Output ("AUTH_DISABLE_SIGNUP=" + [string]$resp.disable_signup)
# output
AUTH_DISABLE_SIGNUP=True
```

Resultat: `PASS`

## 2.2 Preuve invitation utilisateur

### Option utilisée
- [ ] UI Settings comptes
- [ ] Appel Edge Function admin
- [x] Non exécuté (bloqué accès runtime UI/JWT admin)

### Étapes exécutées
1. `Tentative via script runtime read-only (sans SUPABASE_URL/SUPABASE_ANON_KEY).`
2. `Le probe invite n'est pas réalisable sans accès UI dashboard/settings ou JWT admin runtime.`
3. `Aucun user d'invitation n'a été créé pendant cette exécution.`

### Commande/Output (si applicable)

```powershell
# commande
powershell -ExecutionPolicy Bypass -File .\tools\scripts\verify-runtime-saas.ps1 -ShowPolicyDefs
# output (redacted)
SIGNUP_PROBE=UNKNOWN (missing SUPABASE_URL or SUPABASE_ANON_KEY)
P0_01=UNKNOWN
```

### Contrôle DB (profil/rôle/cabinet)

```sql
-- voir aussi le fichier SQL log
-- Non exécutable sans email invité effectif généré en runtime
select id, email, role, cabinet_id
from public.profiles
where email ilike '%{{invited_email_fragment}}%';
```

Résultat attendu:
- user créé
- rôle correct
- cabinet correct (si applicable)

Résultat observé: `UNKNOWN`

## 2.3 Verdict P0-01

- Disable signup OFF prouvé: `PASS`
- Invite runtime prouvée: `UNKNOWN`
- Conclusion P0-01: `FAIL (preuve invitation manquante)`

---

## 3) P0-02 — RLS multi-cabinet (RUNTIME)

## 3.1 Jeu de données test

- Cabinet A: `{{cab_a}}`
- Cabinet B: `{{cab_b}}`
- Admin A: `{{admin_a_email}}`
- Admin B: `{{admin_b_email}}`

Valeurs runtime utilisées dans cette exécution:
- Cabinet A: `N/A`
- Cabinet B: `N/A`
- Admin A: `N/A`
- Admin B: `N/A`

## 3.2 Policies actives (preuve SQL)

```sql
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname='public' and tablename='profiles'
order by policyname;
```

Output: voir `2026-02-14-pr-b-runtime.sql`

Commande exécutée (API fallback avec token management):

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\scripts\verify-runtime-saas.ps1 -PolicyOnly -ShowPolicyDefs -ProjectRef xnpbxrqkzgimiugqtago
```

Output synthèse:
- `PROFILES_POLICIES_COUNT=5`
- `PROFILES_RLS=true`
- `POLICIES_INCLUDE_CABINET_ID=True`
- `P0_02=PASS`

## 3.3 Isolation A/B

### Méthode utilisée
- [ ] UI/session réelle (recommandée)
- [x] SQL claims simulés (tentative locale)
- [x] Non exécuté complètement (bloqué: dataset local vide)

Commande de simulation SQL locale (container Postgres):

```sql
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','<UUID_ADMIN>', true);
select set_config('request.jwt.claim.role','authenticated', true);
select email, role, cabinet_id from public.profiles order by email;
rollback;
```

Préconditions vérifiées en local:
- `auth.users`: `0 row`
- `public.profiles` (admins): `0 row`
- `public.cabinets`: `0 row`

Conclusion: simulation RLS A/B non probante en local sans UUID admin ni dataset A/B.

### Evidence A
- Action: `N/A`
- Output/Screenshot: `N/A`
- Résultat: `UNKNOWN`

### Evidence B
- Action: `N/A`
- Output/Screenshot: `N/A`
- Résultat: `UNKNOWN`

### Cross-check
- A ne voit pas B: `UNKNOWN`
- B ne voit pas A: `UNKNOWN`

## 3.4 Verdict P0-02

Conclusion P0-02: `FAIL (preuve isolation A/B manquante)`

---

## 4) Synthèse PR-B

| Item | Status | Preuve principale |
|---|---|---|
| P0-01 disable_signup | `PASS` | `AUTH_DISABLE_SIGNUP=True` (API management) |
| P0-01 invite | `UNKNOWN` | `SIGNUP_PROBE=UNKNOWN (missing SUPABASE_URL or SUPABASE_ANON_KEY)` |
| P0-02 policies profiles | `PASS` | `2026-02-14-pr-b-runtime.sql` |
| P0-02 isolation A/B | `UNKNOWN` | `SQL local possible via docker exec/psql mais dataset local vide (0 row)` |

Gaps restants (si FAIL):
- `Preuve runtime invitation admin absente (UI/JWT admin non fournis).`
- `Preuve isolation A/B absente sur dataset réel (local SQL OK mais DB locale vide).`

Décision:
- [ ] PR-B READY
- [x] PR-B BLOCKED (actions requises)
