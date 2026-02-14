# PR-B Runtime Evidence — 2026-02-14

> Scope: **runtime evidence only** (no app code changes)
> Order: **P0-01 first** (disable_signup + invite), then **P0-02** (RLS multi-cabinet)
> Secrets policy: no keys/tokens/secrets committed; redact sensitive values in screenshots/outputs.

---

## 0) Metadata

- Date/time (CET): `{{YYYY-MM-DD HH:mm}}`
- Operator: `{{name}}`
- Branch: `pr-b-runtime-evidence`
- Repo HEAD: `{{git rev-parse --short HEAD}}`
- Supabase project ref: `{{project_ref}}`
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
{{output}}
```

```powershell
# commande
git status --porcelain
# output
{{output}}
```

```powershell
# commande
supabase --version
# output
{{output}}
```

### 1.2 Vérifs structure / scripts

```powershell
# commande
Test-Path .\tools\scripts\verify-runtime-saas.ps1
# output
{{output}}
```

```powershell
# commande
Test-Path .\supabase\migrations\20260211100100_p0_02_rls_profiles_per_cabinet.sql
# output
{{output}}
```

---

## 2) P0-01 — disable_signup + invite (RUNTIME)

## 2.1 Preuve disable_signup (Dashboard)

- Navigation: `Auth -> Providers -> Email`
- Vérification attendue: `Allow signups = OFF`
- Screenshot (redacted): `docs/runbook/evidence/img/p0-01-disable-signup.png`
- Notes redact: `{{what_was_masked}}`

Resultat: `{{PASS|FAIL}}`

## 2.2 Preuve invitation utilisateur

### Option utilisée
- [ ] UI Settings comptes
- [ ] Appel Edge Function admin

### Étapes exécutées
1. `{{step_1}}`
2. `{{step_2}}`
3. `{{step_3}}`

### Commande/Output (si applicable)

```powershell
# commande
{{commande_ou_requete}}
# output (redacted)
{{output}}
```

### Contrôle DB (profil/rôle/cabinet)

```sql
-- voir aussi le fichier SQL log
{{sql_query}}
```

Résultat attendu:
- user créé
- rôle correct
- cabinet correct (si applicable)

Résultat observé: `{{PASS|FAIL}}`

## 2.3 Verdict P0-01

- Disable signup OFF prouvé: `{{PASS|FAIL}}`
- Invite runtime prouvée: `{{PASS|FAIL}}`
- Conclusion P0-01: `{{PASS|FAIL}}`

---

## 3) P0-02 — RLS multi-cabinet (RUNTIME)

## 3.1 Jeu de données test

- Cabinet A: `{{cab_a}}`
- Cabinet B: `{{cab_b}}`
- Admin A: `{{admin_a_email}}`
- Admin B: `{{admin_b_email}}`

## 3.2 Policies actives (preuve SQL)

```sql
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname='public' and tablename='profiles'
order by policyname;
```

Output: voir `2026-02-14-pr-b-runtime.sql`

## 3.3 Isolation A/B

### Méthode utilisée
- [ ] UI/session réelle (recommandée)
- [ ] SQL claims simulés

### Evidence A
- Action: `{{description}}`
- Output/Screenshot: `{{path_or_output}}`
- Résultat: `{{PASS|FAIL}}`

### Evidence B
- Action: `{{description}}`
- Output/Screenshot: `{{path_or_output}}`
- Résultat: `{{PASS|FAIL}}`

### Cross-check
- A ne voit pas B: `{{PASS|FAIL}}`
- B ne voit pas A: `{{PASS|FAIL}}`

## 3.4 Verdict P0-02

Conclusion P0-02: `{{PASS|FAIL}}`

---

## 4) Synthèse PR-B

| Item | Status | Preuve principale |
|---|---|---|
| P0-01 disable_signup | `{{PASS|FAIL}}` | `p0-01-disable-signup.png` |
| P0-01 invite | `{{PASS|FAIL}}` | `{{link_to_output}}` |
| P0-02 policies profiles | `{{PASS|FAIL}}` | `2026-02-14-pr-b-runtime.sql` |
| P0-02 isolation A/B | `{{PASS|FAIL}}` | `{{screens_or_outputs}}` |

Gaps restants (si FAIL):
- `{{gap_1}}`
- `{{gap_2}}`

Décision:
- [ ] PR-B READY
- [ ] PR-B BLOCKED (actions requises)
