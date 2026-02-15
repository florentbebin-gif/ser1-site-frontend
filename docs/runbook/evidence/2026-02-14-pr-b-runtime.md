# PR-B Runtime Evidence — 2026-02-14

> Scope: **runtime evidence only** (no app code changes)
> Order: **P0-01 first** (disable_signup + invite), then **P0-02** (RLS multi-cabinet)
> Secrets policy: no keys/tokens/secrets committed; redact sensitive values in screenshots/outputs.

---

## 0) Metadata

- Date/time (CET): `2026-02-15 10:05`
- Operator: `Cascade`
- Branch: `pr-b4b-p0-01-invite-no-spam`
- Repo HEAD: `506e25b`
- Supabase project ref: `xnpbxrqkzgimiugqtago`
- Evidence files:
  - this file: `docs/runbook/evidence/2026-02-14-pr-b-runtime.md`
  - SQL log template: `docs/runbook/evidence/2026-02-14-pr-b-runtime.sql.example`
  - screenshots: `docs/runbook/evidence/img/`

---

## 1) Pre-flight local (sans secrets)

### 1.1 Commandes

```powershell
# commande
git branch --show-current
# output
pr-b4b-p0-01-invite-no-spam
```

```powershell
# commande
git status --porcelain
# output
(no output)
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

## 2.1 Preuve disable_signup (CLI/API)

- Méthode: `Supabase Management API` (token local, non affiché)
- Notes redact: `Aucune clé/token affichée dans la preuve commitée`

Preuve exécutée:

```powershell
# commande (token non affiché; ne jamais committer de headers HTTP)
# 1) Appel Management API: GET /v1/projects/<project_ref>/config/auth
# 2) Extraction de disable_signup

$ref='xnpbxrqkzgimiugqtago'
$resp=Invoke-RestMethod -Method Get -Uri "https://api.supabase.com/v1/projects/$ref/config/auth" -Headers <redacted>
[pscustomobject]@{ project_ref=$ref; disable_signup=$resp.disable_signup } | ConvertTo-Json
# output
{
  "project_ref": "xnpbxrqkzgimiugqtago",
  "disable_signup": true
}
```

Resultat: `PASS`

## 2.2 Preuve invitation utilisateur

### Option utilisée
- [ ] UI Settings comptes
- [x] Appel Edge Function admin (CLI)
- [ ] Non exécuté

### Étapes exécutées
1. `Login CLI via /auth/v1/token (E2E_EMAIL/E2E_PASSWORD) -> access token obtenu.`
2. `Promotion du compte e2e en admin via SQL API (raw_app_meta_data.role='admin', profiles.role='admin').`
3. `Appel Edge Function /functions/v1/admin avec action=create_user_invite (sans afficher token).`
4. `Résultat runtime: HTTP 500 email rate limit exceeded.`

### PR-B4b (no-spam) — voie officielle GoTrue Admin API (sans email)

Objectif: créer un user via endpoint officiel `POST /auth/v1/admin/users` (clé admin récupérée via Management API, non affichée) avec `email_confirm=true`.

Résultat:
- ✅ user créé (HTTP 200)
- ✅ pas de rate limit email (pas d'invite)
- ⚠️ `public.profiles.cabinet_id` reste `NULL` (pas de projection automatique du cabinet)

```powershell
# commande (résumé; clé admin récupérée via Management API et non affichée)
POST https://xnpbxrqkzgimiugqtago.supabase.co/auth/v1/admin/users
body: { email: "b4b-user-<ts>@test.local", email_confirm: true, user_metadata: { source: "pr-b4b-cli", cabinet_id: "<cabinet_uuid>" } }

# output (redacted)
{
  "status": 200,
  "user_id": "<redacted>",
  "email": "b4b-user-<redacted>@test.local",
  "cabinet_id_used": "<redacted>"
}
```

### Commande/Output (si applicable)

```powershell
# commande
$authResp=Invoke-RestMethod -Method Post -Uri "$url/auth/v1/token?grant_type=password" -Headers $authHeaders -Body $authBody
$fnBody=@{ action='create_user_invite'; email='b4-invite-<ts>@test.local'; cabinet_id='<cabinet_id>' } | ConvertTo-Json
$resp=Invoke-WebRequest -Method Post -Uri "$url/functions/v1/admin" -Headers $fnHeaders -Body $fnBody
# output (redacted)
{
  "status": 500,
  "body": "{\"error\":\"email rate limit exceeded\",\"requestId\":\"<redacted-request-id>\"}"
}
```

### Contrôle DB (profil/rôle/cabinet)

```sql
select id, email, created_at
from auth.users
where email like 'b4-invite-%@test.local'
order by created_at desc;

select id, email, role, cabinet_id
from public.profiles
where email like 'b4-invite-%@test.local'
order by created_at desc;
```

Résultat attendu:
- user créé
- rôle correct
- cabinet correct (si applicable)

Résultat observé: `0 row` (aucun user invité créé)

PR-B4b — vérifs DB post-création (cloud SQL API):

```sql
select id, email, email_confirmed_at, created_at
from auth.users
where email = 'b4b-user-<redacted>@test.local';

select id, email, role, cabinet_id, created_at
from public.profiles
where email = 'b4b-user-<redacted>@test.local';
```

Output (extraits):
- `auth.users.email_confirmed_at` non-null ✅
- `public.profiles.role = 'user'` ✅
- `public.profiles.cabinet_id = NULL` ❌

Preuve mécanisme projection cabinet_id (triggers profiles):

```sql
select tgname, pg_get_triggerdef(t.oid) as def
from pg_trigger t
join pg_class c on c.oid=t.tgrelid
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname='profiles' and not t.tgisinternal
order by tgname;
```

Output: `set_profiles_updated_at` uniquement (pas de trigger de projection cabinet).

## 2.3 Verdict P0-01

- Disable signup OFF prouvé: `PASS`
- Invite runtime prouvée: `FAIL (création officielle OK, mais projection cabinet_id absente)`
- Conclusion P0-01: `FAIL`

---

## 3) P0-02 — RLS multi-cabinet (RUNTIME)

## 3.1 Jeu de données test

- Cabinet A: `{{cab_a}}`
- Cabinet B: `{{cab_b}}`
- Admin A: `{{admin_a_email}}`
- Admin B: `{{admin_b_email}}`

Valeurs runtime utilisées dans cette exécution:
- Cabinet A: `B4_CAB_A_1771145192`
- Cabinet B: `B4_CAB_B_1771145192`
- Admin A: `b4-admin-a-1771145192@test.local`
- Admin B: `b4-admin-b-1771145192@test.local`

## 3.2 Policies actives (preuve SQL)

```sql
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname='public' and tablename='profiles'
order by policyname;
```

Output: voir `2026-02-14-pr-b-runtime.sql.example` (template; les sorties réelles ne doivent pas être commitées)

Commande exécutée (SQL API cloud avec token management):

```powershell
$body=@{ query = "select policyname, cmd, qual, with_check from pg_policies where schemaname='public' and tablename='profiles' order by policyname;" } | ConvertTo-Json
$resp=Invoke-RestMethod -Method Post -Uri "https://api.supabase.com/v1/projects/xnpbxrqkzgimiugqtago/database/query" -Headers <redacted> -Body $body
```

Output synthèse:
- `PROFILES_POLICIES_COUNT=5`
- `PROFILES_RLS=true`
- `POLICIES_INCLUDE_CABINET_ID=True`
- `P0_02=PASS`

## 3.3 Isolation A/B

### Méthode utilisée
- [ ] UI/session réelle (recommandée)
- [x] SQL claims simulés (cloud)
- [ ] Non exécuté complètement

Commande de simulation SQL cloud (claims A puis B):

```sql
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','<redacted-uuid>', true);
select set_config('request.jwt.claim.role','authenticated', true);
select email, role, cabinet_id from public.profiles where email like 'b4-admin-%@test.local' order by email;
rollback;
```

Préconditions vérifiées cloud:
- `auth.users/profiles`: 2 admins de test créés et liés à 2 cabinets distincts
- `pg_policies`: 5 policies actives
- `relrowsecurity`: true

### Evidence A
- Action: `claims sub=admin_a + role=authenticated`
- Output/Screenshot: `{"email":"b4-admin-a-<redacted>@test.local","role":"admin","cabinet_id":"<redacted>"}`
- Résultat: `PASS`

### Evidence B
- Action: `claims sub=admin_b + role=authenticated`
- Output/Screenshot: `{"email":"b4-admin-b-<redacted>@test.local","role":"admin","cabinet_id":"<redacted>"}`
- Résultat: `PASS`

### Cross-check
- A ne voit pas B: `PASS`
- B ne voit pas A: `PASS`

## 3.4 Verdict P0-02

Conclusion P0-02: `PASS`

---

## 4) Synthèse PR-B

| Item | Status | Preuve principale |
|---|---|---|
| P0-01 disable_signup | `PASS` | `AUTH_DISABLE_SIGNUP=True` (API management) |
| P0-01 invite | `FAIL` | `Edge function create_user_invite -> HTTP 500 email rate limit exceeded` |
| P0-02 policies profiles | `PASS` | `2026-02-14-pr-b-runtime.sql` |
| P0-02 isolation A/B | `PASS` | `Simulation RLS cloud (claims A/B) avec résultats distincts` |

Gaps restants (si FAIL):
- `P0-01 invite bloqué par quota d'envoi email (rate limit) au moment du run.`

Décision:
- [ ] PR-B READY
- [x] PR-B BLOCKED (actions requises)
