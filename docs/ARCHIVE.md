# Archive (registre)

> **Créé le** : 2026-02-15  
> **Dernière mise à jour** : 2026-02-15  
>
> **Gouvernance** : toute archive / contenu déprécié / legacy doit être ajouté **uniquement** dans ce fichier.
> Ne pas créer d'autres fichiers d'archive ailleurs dans le repo.

## Table des matières

- [Roadmap — Phases clôturées](#roadmap--phases-cloturees)
  - [Phase 0 — Foundations (DONE)](#phase-0--foundations-done)
  - [Phase 1 — MVP Simulateurs + JSON (DONE)](#phase-1--mvp-simulateurs--json-done)
- [Runbooks / Evidence](#runbooks--evidence)
  - [PR-B Runtime Evidence — 2026-02-14](#pr-b-runtime-evidence--2026-02-14)
- [Legacy / Deprecated docs](#legacy--deprecated-docs)
  - [Legacy SQL setup](#legacy-sql-setup)

---

## Roadmap — Phases clôturées

### Phase 0 — Foundations (DONE)

- **Source** : `docs/ROADMAP_SAAS_V1.md` (section "## 9. Roadmap Phase 0 → 4")
- **Archivé le** : 2026-02-15
- **Références** : voir le contenu ci-dessous (PR # / merge SHA déjà listés)

**Objectif** : Poser les bases SaaS sans casser l'existant.

| ID | Livrable | Risque |
|----|----------|--------|
| P0-01 | Auth : workflow invitation admin (email template, onboarding, **blocage self-signup**) | Moyen |
| P0-02 | Multi-tenant : RLS `profiles` filtrée par `cabinet_id` + RLS `cabinets` per-admin. **Les tables settings restent GLOBALES** (conforme à l'exigence : règles partagées SaaS) | Moyen |
| P0-03 | Validation isolation branding (logo + palette per-cabinet) | Faible |
| P0-04 | Exports traçables : fingerprint déterministe (PPTX + Excel) + preuves unitaires | Faible |
| P0-05 | Découpe god files critiques (`irEngine.js`, `placementEngine.js`) | Moyen |
| P0-06 | Sessions TTL pro : heartbeat 30 s, grâce **2-5 min** (perte heartbeat : réseau/tab hidden — PAS conservation après fermeture onglet), coupure **1 h inactivité** (reset : saisie, navigation, clic CTA), purge `sessionStorage`, UX "session expire dans X min" | Moyen |
| P0-07 | Unifier migrations (`database/` + `supabase/`) | Faible |
| P0-08 | ESLint `ser1-colors` → `error` + cleanup hardcodes | Faible |
| P0-09 | Politique de téléchargement MVP client-side : bouton export **disabled** si session expirée, révocation Blob URLs, purge `sessionStorage`, message UX "session expirée" | Faible |
| P0-10 | Gate tests admin : wizard règles fiscales/produits → publication **bloquée si 0 test** importé et exécuté. Le système demande explicitement un corpus de tests | Moyen |

**Reste Phase 0 : 0 item** — Phase 0 complète.

> Statut exécution runtime (2026-02-14) :
> - **P0-01 DONE (runtime proven)** (PR #60, merge `8cafc3e`) via B3 sur `xnpbxrqkzgimiugqtago`.
>   - Commande: `powershell -ExecutionPolicy Bypass -File tools/scripts/verify-runtime-saas.ps1 -SupabaseUrl "https://xnpbxrqkzgimiugqtago.supabase.co" -SupabaseAnonKey <anon> -ProjectRef "xnpbxrqkzgimiugqtago"`
>   - Preuve: `AUTH_CONFIG_SOURCE=GET /v1/projects/xnpbxrqkzgimiugqtago/config/auth`, `AUTH_DISABLE_SIGNUP=True`, `P0_01_DECISION=PASS(auth-config-disable_signup=true)`, `SIGNUP_STATUS=422`, `P0_01=PASS`.
> - **P0-02 DONE (runtime proven)** (PR #57, merge `e9f9eb6`) via B3 policy check.
>   - Commande: `powershell -ExecutionPolicy Bypass -File tools/scripts/verify-runtime-saas.ps1 -PolicyOnly -ProjectRef "xnpbxrqkzgimiugqtago" -ShowPolicyDefs`
>   - Preuve: `PROFILES_POLICIES_COUNT=5`, `PROFILES_RLS=true`, `POLICIES_INCLUDE_CABINET_ID=True`, `P0_02=PASS`.
> - **P0-03 DONE** (PR #49, merge `c703ce2`) branding isolation (logo + palette per-cabinet).
> - **P0-10 DONE (v1)** (PR #48, merge `0130d0c`) gate publication unifié sur les 3 écrans admin de publication (`BaseContrat`, `Impôts`, `Prélèvements`).
>   - Implémentation: `src/features/settings/publicationGate.ts` (gate partagé + messages blocage/warning + mode fail-safe `testsSourceAvailable=false`).
>   - Test: `src/features/settings/publicationGate.test.ts` (`tests=[] => blocked=true`, `tests=[..] => blocked=false`, source indisponible => blocage explicite).
>   - Intégration UI: boutons Save désactivés si gate bloquant + message visible (non silencieux) sur `/settings/base-contrat`, `/settings/impots`, `/settings/prelevements`.
> - **P0-04 DONE** (PR #50, merge `3c6cc28`) fingerprint exports déterministe (PPTX + XLSX + XLS legacy) (key commit `d60b260`).
>   - Implémentation: `src/utils/exportFingerprint.ts` + branchement central `src/pptx/export/exportStudyDeck.ts`, `src/utils/xlsxBuilder.ts`, `src/utils/exportExcel.js`.
>   - Preuve tests: `src/utils/exportFingerprint.test.ts` (même manifest => même hash, variation champ clé => hash différent).
>   - Exemple fingerprint (dev): `PPTX=10257885bcb868e0`, `XLSX=6ef5fec7658c652a`.
> - **P0-06 DONE** (PR #42, merge `e326fa4`) sessions TTL pro (heartbeat 30s, grâce, inactivité 1h, purge sessionStorage, UX expiration).
> - **P0-07 DONE** (PR #42, merge `e326fa4`) migrations unifiées (`database/` + `supabase/`).
> - **P0-08 DONE** (PR #50, merge `3c6cc28`) gouvernance couleurs en mode strict (key commit `d18ee3a`).
>   - Changement: `eslint.config.js` (`ser1-colors/no-hardcoded-colors` et `ser1-colors/use-semantic-colors` passés en `error`).
>   - Preuve: `npm run lint` = 0 erreur.
>   - Note: exception ciblée et documentée sur `src/settings/theme/hooks/brandingIsolation.test.ts` (fixtures hex explicites nécessaires pour prouver l'isolation A/B, sans impact UI/runtime).
> - **P0-09 DONE** (PR #42, merge `e326fa4`) politique téléchargement (exports disabled si session expirée, purge + UX).
> - **P0-05 DONE** (IR split) : helpers IR extraits vers `src/engine/ir/` (`parts`, `progressiveTax`, `cehr`, `cdhr`, `abattement10`, `effectiveParts`, `domAbatement`, `decote`, `capital`, `quotientFamily`, `socialContributions`, `excelCase`). `src/utils/irEngine.js` ≈ **213 lignes**.
>   - Preuves merges: PR #66 (`d8be201`), #68 (`e4383ff`), #69 (`100d056`), #70 (`6bbf64a`), #72 (`a763d7b`), #74 (`57a7e51`), #76 (`6e4e6be`), #79 (`7fda4a7`).
> - **Sécurité — guardrails secrets / `.env*`** : garde-fous repo/CI en place (blocage `.env*` + patterns sensibles).

### Phase 1 — MVP Simulateurs + JSON (DONE)

- **Source** : `docs/ROADMAP_SAAS_V1.md` (section "## 9. Roadmap Phase 0 → 4")
- **Archivé le** : 2026-02-15
- **Références** : voir le contenu ci-dessous (PR # / merge SHA déjà listés)

**Objectif** : Premiers simulateurs complets + sauvegarde locale robuste.

| ID | Livrable | Risque |
|----|----------|--------|
| P1-01 | JSON local : schema versioning + migrations auto + Zod | Moyen |
| P1-02 | Simulateur Succession : UI + export PPTX/Excel | Moyen |
| P1-03 | Simulateur Épargne retraite (PER) : UI + engine + export | Moyen |
| P1-04 | Refactor IR : pattern CreditV2 (components/hooks/utils) | **Haut** |
| P1-05 | Refactor Placement : pattern CreditV2 (shell + controller + panels + CSS local) | **Haut** |
| P1-06 | Feature flag `VITE_USE_BASE_CONTRAT_FOR_PLACEMENT` → ON | Moyen |

**Reste Phase 1 : 0 item** — Phase 1 complète.

> Statut exécution (2026-02-14) :
> - **P1-01 DONE** (PR #44, merge `9e58015`) JSON snapshot versioning + migrations auto + Zod.
> - **P1-02 DONE** (PR #45, merge `5424b07`) Succession simulator MVP + exports.
> - **P1-03 DONE** (PR #46, merge `fb5124e`) PER simulator MVP.
> - **P1-04 DONE** : simulateur IR en pattern CreditV2 via `src/features/ir/` (entry `IrPage.tsx` ~13, hook `hooks/useIr.ts` ~342, composants `components/*` < 500).
>   - Preuve merge: PR #46 (merge `fb5124e`, key commit `f2ac8cf`).
> - **P1-05 DONE** (PR #51, merge `ff270c5`) refactor placement (pattern CreditV2).
> - **P1-06 DONE** : `.env.example` documente `VITE_USE_BASE_CONTRAT_FOR_PLACEMENT=true` (env absent => ON), OFF possible via `false` (debug/rollback). (PR #80, merge `eac0da5`)

---

## Runbooks / Evidence

### PR-B Runtime Evidence — 2026-02-14

- **Source** : `docs/runbook/evidence/2026-02-14-pr-b-runtime.md`
- **Archivé le** : 2026-02-15
- **Références** : (preuve interne; voir metadata dans le document)

> Note: ce contenu contient déjà des redactions et des règles "no secrets". Ne pas ajouter d'outputs bruts.

#### Contenu

````markdown
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
Test-Path .\\tools\\scripts\\verify-runtime-saas.ps1
# output
True
```

```powershell
# commande
Test-Path .\\supabase\\migrations\\20260211100100_p0_02_rls_profiles_per_cabinet.sql
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
````

---

## Legacy / Deprecated docs

### Legacy SQL setup

- **Source** : `docs/_legacy/database/setup/*`
- **Archivé le** : 2026-02-15
- **Références** : P0-07 governance (`docs/technical/db-migrations-governance.md`)

#### README

```markdown
# Legacy SQL setup (archived)

Ce dossier contient des scripts SQL historiques déplacés depuis `database/setup/`.

## Statut

- **Deprecated**: ne pas utiliser comme source active de migration.
- **Lecture seule**: conservé pour audit/historique.

## Source active

Utiliser uniquement:

- `supabase/migrations/`

Référence gouvernance:

- `docs/technical/db-migrations-governance.md`
```

#### admin_setup.sql

```sql
-- Migration admin_setup.sql (REJOUABLE)
-- Ajout de la colonne admin_read_at pour le suivi des signalements lus par l'admin

DO $$
BEGIN
  -- Ajouter colonne admin_read_at si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'issue_reports' 
    AND column_name = 'admin_read_at'
  ) THEN
    ALTER TABLE public.issue_reports 
    ADD COLUMN admin_read_at timestamptz DEFAULT NULL;
  END IF;
END $$;

-- Créer index pour performance (si n'existe pas)
CREATE INDEX IF NOT EXISTS idx_issue_reports_admin_read_at 
ON public.issue_reports(admin_read_at) 
WHERE admin_read_at IS NULL;

-- Supprimer policies existantes pour les recréer proprement
DROP POLICY IF EXISTS "Users can insert their own issue reports" ON public.issue_reports;
DROP POLICY IF EXISTS "Users can view their own issue reports" ON public.issue_reports;
DROP POLICY IF EXISTS "Users can update their own issue reports" ON public.issue_reports;
DROP POLICY IF EXISTS "Users can delete their own issue reports" ON public.issue_reports;
DROP POLICY IF EXISTS "Admins can read all issue reports" ON public.issue_reports;
DROP POLICY IF EXISTS "Admins can read and update all issue reports" ON public.issue_reports;

-- Policies pour les utilisateurs (lecture seule de leurs propres signalements)
CREATE POLICY "Users can insert their own issue reports" ON public.issue_reports
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own issue reports" ON public.issue_reports
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own issue reports" ON public.issue_reports
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own issue reports" ON public.issue_reports
  FOR DELETE USING (user_id = auth.uid());

-- Policy pour les admins (lecture + update admin_read_at)
CREATE POLICY "Admins can read and update all issue reports" ON public.issue_reports
  FOR ALL USING (
    auth.jwt() -> 'app_metadata'::jsonb ->> 'role' = 'admin'
  )
  WITH CHECK (
    auth.jwt() -> 'app_metadata'::jsonb ->> 'role' = 'admin'
  );

-- Vérification de la configuration
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'issue_reports' 
AND column_name = 'admin_read_at';

-- Afficher les policies RLS actives
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies 
WHERE tablename = 'issue_reports';
```

#### supabase-setup.sql

```sql
-- ============================================================================
-- Supabase setup pour SER1 - Placement & Settings
-- ============================================================================
-- 1) Extensions utiles
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2) Table profiles (utilisateurs + rôle admin)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index sur email pour lookup rapide
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 3) Tables de settings (1 ligne par table, id=1)
-- ============================================================================
-- fiscality_settings (AV, PER, dividendes, etc.)
CREATE TABLE IF NOT EXISTS public.fiscality_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  settings JSONB NOT NULL DEFAULT '{}',
  version INT DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- tax_settings (barème IR, DMTG, etc.)
CREATE TABLE IF NOT EXISTS public.tax_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  settings JSONB NOT NULL DEFAULT '{}',
  version INT DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ps_settings (prélèvements sociaux)
CREATE TABLE IF NOT EXISTS public.ps_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  settings JSONB NOT NULL DEFAULT '{}',
  version INT DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Triggers updated_at pour les settings
CREATE TRIGGER set_fiscality_settings_updated_at
  BEFORE UPDATE ON public.fiscality_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_tax_settings_updated_at
  BEFORE UPDATE ON public.tax_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_ps_settings_updated_at
  BEFORE UPDATE ON public.ps_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 4) RLS (Row Level Security) - Activer sur toutes les tables
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscality_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ps_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5) Policies
-- ============================================================================

-- profiles : lecture pour son propre profil, écriture admin
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- fiscality_settings : lecture pour tous connectés, écriture admin
CREATE POLICY "Authenticated users can read fiscality_settings" ON public.fiscality_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can write fiscality_settings" ON public.fiscality_settings
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- tax_settings : lecture pour tous connectés, écriture admin
CREATE POLICY "Authenticated users can read tax_settings" ON public.tax_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can write tax_settings" ON public.tax_settings
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ps_settings : lecture pour tous connectés, écriture admin
CREATE POLICY "Authenticated users can read ps_settings" ON public.ps_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can write ps_settings" ON public.ps_settings
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================================
-- 6) Seeds initiaux (en cohérence avec les defaults du code)
-- ============================================================================

-- fiscality_settings (AV, PER, dividendes)
INSERT INTO public.fiscality_settings (id, settings, version) VALUES (1, '{
  "assuranceVie": {
    "retraitsCapital": {
      "psRatePercent": 17.2,
      "depuis2017": {
        "moins8Ans": { "irRatePercent": 12.8 },
        "plus8Ans": {
          "abattementAnnuel": { "single": 4600, "couple": 9200 },
          "primesNettesSeuil": 150000,
          "irRateUnderThresholdPercent": 7.5,
          "irRateOverThresholdPercent": 12.8
        }
      }
    },
    "deces": {
      "primesApres1998": {
        "allowancePerBeneficiary": 152500,
        "brackets": [
          { "upTo": 852500, "ratePercent": 20 },
          { "upTo": null, "ratePercent": 31.25 }
        ]
      },
      "apres70ans": { "globalAllowance": 30500 }
    }
  },
  "perIndividuel": {
    "sortieCapital": {
      "pfu": { "irRatePercent": 12.8, "psRatePercent": 17.2 }
    }
  },
  "dividendes": {
    "abattementBaremePercent": 40
  }
}', 1) ON CONFLICT (id) DO UPDATE SET
  settings = EXCLUDED.settings,
  version = fiscality_settings.version + 1,
  updated_at = now();

-- tax_settings (barème IR, DMTG)
INSERT INTO public.tax_settings (id, settings, version) VALUES (1, '{
  "incomeTax": {
    "scaleCurrent": [
      { "from": 0, "to": 11294, "rate": 0 },
      { "from": 11295, "to": 28797, "rate": 11 },
      { "from": 28798, "to": 82341, "rate": 30 },
      { "from": 82342, "to": 177106, "rate": 41 },
      { "from": 177107, "to": null, "rate": 45 }
    ]
  },
  "dmtg": {
    "abattementLigneDirecte": 100000,
    "scale": [
      { "from": 0, "to": 8072, "rate": 5 },
      { "from": 8072, "to": 12109, "rate": 10 },
      { "from": 12109, "to": 15932, "rate": 15 },
      { "from": 15932, "to": 552324, "rate": 20 },
      { "from": 552324, "to": 902838, "rate": 30 },
      { "from": 902838, "to": 1805677, "rate": 40 },
      { "from": 1805677, "to": null, "rate": 45 }
    ]
  }
}', 1) ON CONFLICT (id) DO UPDATE SET
  settings = EXCLUDED.settings,
  version = tax_settings.version + 1,
  updated_at = now();

-- ps_settings (prélèvements sociaux)
INSERT INTO public.ps_settings (id, settings, version) VALUES (1, '{
  "patrimony": {
    "current": { "totalRate": 17.2, "csgDeductibleRate": 6.8 }
  }
}', 1) ON CONFLICT (id) DO UPDATE SET
  settings = EXCLUDED.settings,
  version = ps_settings.version + 1,
  updated_at = now();

-- ============================================================================
-- 7) Créer un utilisateur admin (optionnel, à faire manuellement après auth)
-- ============================================================================
-- Exemple : après vous être connecté, exécutez :
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'votre-email@example.com';
-- ============================================================================
```
