# Diagnostic CORS — Edge Function `admin`

## Objectif
Confirmer si les erreurs CORS/perte d'autorisation sur `/functions/v1/admin` proviennent du gateway (vérification JWT) ou d'un échec réseau côté client.

## Contexte actuel
- Front `/settings/comptes` affiche parfois "CORS error" avec AbortError.
- Dashboard Supabase ne montrait pas les requêtes (soupçon: rejet par gateway avant d'atteindre la fonction).
- Instrumentation ajoutée:
  - **Front**: `[ADMIN_CALL]` logs incluant `rid`, origine, présence token, session absente.
  - **Edge**: `[EDGE_REQ]` logs + headers CORS dynamiques + actions `ping`, `echo`.
  - **supabase/config.toml**: optionnellement `verify_jwt = false` (TEMPORAIRE) pour isoler les erreurs CORS vs auth.

## Procédure TEMPORAIRE (à revert après test)
1. **Désactiver verify_jwt** localement (temporaire) dans `supabase/config.toml`.<br>
   - Comment revert? remettre `verify_jwt = true` et redéployer `supabase functions deploy admin`.
2. **Déployer la fonction**: `npx supabase functions deploy admin`.
3. **Tester ping/echo**:
   - Navigateur: `fetch('https://<project>.supabase.co/functions/v1/admin?action=ping_public', { method: 'POST' })` → doit répondre `{ ok: true }`.
   - Script `scripts/admin-smoke.ps1` (cf. section Scripts) pour ping + echo avec TOKEN manuel.
4. **Observations**:
   - Si `verify_jwt=false` supprime le CORS error ⇒ problème auth/token (gateway).
   - Si toujours bloqué ⇒ focus sur headers ou réseau local.
5. **Revert sécurité**: remettre `verify_jwt = true` dès que la cause est identifiée.

## Protocole de test pas à pas
1. **Préparer variables**:
   - `setx SUPABASE_URL "https://<project>.supabase.co"`
   - `setx SUPABASE_ANON_KEY "<anon>"`
   - `setx SUPABASE_SERVICE_TOKEN "<service_jwt>"` (facultatif pour script).
2. **Lancer script smoke**:
   - `pwsh ./scripts/admin-smoke.ps1`
   - Résultats attendus:
     - `ping_public` → status 200, `ok: true`
     - `echo` → status 200, `origin`, `hasAuthHeader=true`, `headersKeys` listés
3. **Tester front**:
   - Ouvrir `/settings/comptes`.
   - Vérifier dans Network: `OPTIONS` 204, `POST` 200.
   - Dans console: logs `[ADMIN_CALL]` (front) et `EDGE_REQ` (Dashboard) avec le même `rid`.
4. **Réactiver verify_jwt**: modifier `supabase/config.toml`, redeployer, rerun tests pour vérifier que le comportement reste correct.

## Ce que confirme `verify_jwt=false`
- ✅ Si CORS error disparaît: rejet se produisait avant la fonction (gateway/auth). Action: inspecter Authorization header, refresh token.
- ❌ Si CORS error persiste: problème CORS/hôte réseau; inspecter `Access-Control-Allow-*` et `origin` côté front.

> ⚠️ **Important**: Ne jamais laisser `verify_jwt=false` en production. Utiliser uniquement cet état pour isoler l'erreur quelques heures.
