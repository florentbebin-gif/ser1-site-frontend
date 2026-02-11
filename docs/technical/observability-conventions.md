# Conventions d'observabilité — SER1 SaaS

> **Statut** : Actif (P0-10)  
> **Source de vérité** : ce fichier + `docs/runbook/debug.md`

## Principes

1. **Logs uniquement techniques** — jamais de données métier dans les logs
2. **Zéro PII** — aucun email, nom, adresse, numéro de téléphone, RFR, patrimoine, etc.
3. **Zéro métriques métier** — pas de compteurs de simulations, montants calculés, types de produits utilisés
4. **Identifiants techniques autorisés** — `user.id` (UUID), `cabinet_id` (UUID), `request_id`, `action`, `duration_ms`

## Règles par couche

### Frontend (React)

| Autorisé | Interdit |
|----------|----------|
| `console.error('Auth failed', { userId })` | `console.log('User email:', user.email)` |
| `console.warn('[TTL] session expirée')` | `console.log('RFR:', revenuFiscal)` |
| `debugLog('auth', 'session refreshed')` | `console.log('Patrimoine:', montant)` |

- **Production** : `console.log/debug/info/trace` interdit (ESLint `no-console: error`)
- **Dev** : derrière flags `DEBUG_*` uniquement (cf. `src/utils/debugFlags.ts`)

### Edge Functions (Deno/Supabase)

| Autorisé | Interdit |
|----------|----------|
| `console.log('[admin] action=list_users rid=xxx 42ms')` | `console.log('[admin] user email: alice@corp.com')` |
| `console.error('[admin] DB error:', error.message)` | `console.log('[admin] barème IR:', jsonData)` |

- Format : `[module] action=X rid=Y duration=Zms status=N`
- Pas de payload body dans les logs
- `rawBodyPreview` limité aux 100 premiers caractères (déjà en place dans `admin/index.ts`)

### CI/CD

- Les logs CI ne doivent pas exposer de secrets (`.env` est gitignored)
- Les E2E Playwright utilisent `SER1_DEBUG_E2E` pour logs conditionnels

## Checklist revue PR

- [ ] Aucun `console.log` hors flag debug ou `console.error/warn`
- [ ] Aucun email, nom, montant, RFR, patrimoine dans les logs
- [ ] Aucun compteur métier (nombre de simulations, types produits, etc.)
- [ ] Les identifiants loggés sont des UUID techniques uniquement
- [ ] Edge Functions : format `[module] action=X rid=Y` respecté

## Métriques futures (Phase 2+)

Si des métriques sont nécessaires, elles seront :
- Techniques uniquement (latence, taux d'erreur, uptime)
- Agrégées et anonymisées
- Jamais corrélables à un dossier client spécifique
