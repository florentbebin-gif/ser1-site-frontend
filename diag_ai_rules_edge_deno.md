# Diagnostic: Règles IA, Edge Function admin, Deno/Supabase CLI

**Date:** 2025-01-09  
**Auteur:** Cascade (architecte)  
**Objectif:** Identifier la cause des problèmes de chargement `/settings/comptes` avec preuves reproductibles

---

## Contexte du bug

**Symptômes observés:**
- Écran bloqué "Chargement…" sur `/settings/*`
- Console: `AbortError "signal is aborted without reason"`
- Realtime monitor: `CHANNEL_ERROR` / `CLOSED` / `SUBSCRIBED` en boucle

**Catégories à distinguer:**
| Catégorie | Description |
|-----------|-------------|
| **(A) HTTP Edge Function / REST** | Appels `supabase.functions.invoke('admin', ...)` |
| **(B) WebSocket Realtime** | Connexion persistante Supabase Realtime |
| **(C) Auth/Session** | `onAuthStateChange`, refresh token, `ensureSession` |

---

## H1 — "Règles absolues IA dans le repo"

### Commandes exécutées

```powershell
# Fichiers de règles connus
Get-ChildItem -Path . -Force -Recurse -Include ".windsurfrules",".cursorrules",".clinerules","RULES.md","INSTRUCTIONS.md" -ErrorAction SilentlyContinue | Select-Object FullName

# Dossiers de règles
Get-ChildItem -Path . -Force -Recurse -Directory -Include ".windsurf",".cursor",".github","prompts","ai","llm","agent","memory" -ErrorAction SilentlyContinue | Select-Object FullName

# Patterns "DO NOT", "ABSOLUTE", "MUST NOT", "NEVER" dans fichiers .md/.txt
Get-ChildItem -Path . -Force -Recurse -File -Include "*.md","*.txt" -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules" } | Select-String -Pattern "DO NOT|ABSOLUTE|MUST NOT|NEVER" -List | Select-Object Path -First 20
```

### Résultats

#### Fichiers de règles trouvés
| Fichier | Résultat |
|---------|----------|
| `.windsurfrules` | ❌ Non trouvé |
| `.cursorrules` | ❌ Non trouvé |
| `.clinerules` | ❌ Non trouvé |
| `RULES.md` | ❌ Non trouvé |
| `INSTRUCTIONS.md` | ❌ Non trouvé |
| `.github/copilot-instructions.md` | ❌ Non trouvé |

#### Dossiers trouvés (hors node_modules)
| Dossier | Impact |
|---------|--------|
| `bmad-method/.windsurf/` | ✅ Existe — contient workflows Windsurf |

#### Fichiers avec patterns "DO NOT", "ABSOLUTE", etc.
Tous dans `bmad-method/` (template méthodologique externe):
- `bmad-method/.bmad-core/agents/analyst.md`
- `bmad-method/.bmad-core/agents/architect.md`
- `bmad-method/.bmad-core/agents/bmad-master.md`
- `bmad-method/.bmad-core/agents/dev.md`
- ... (20 fichiers au total)

### Conclusion H1

**AUCUNE règle IA repo détectée dans le code SER1 lui-même.**

Les fichiers trouvés sont dans `bmad-method/`, qui est un **template méthodologique externe** (BMAD methodology). Ces fichiers ne contraignent pas le runtime de l'application SER1.

**Ce que ça n'exclut pas:**
- Règles globales IDE (ex: `~/.windsurfrules` hors repo)
- Instructions système Windsurf/Cursor configurées globalement
- Règles chargées dynamiquement par l'IDE

---

## H2 — "Ça vient de l'Edge Function admin"

### Analyse du code Edge Function

**Fichier:** `supabase/functions/admin/index.ts`

#### Chemins d'exécution identifiés

| Étape | Code | Peut bloquer ? |
|-------|------|----------------|
| 1. CORS/OPTIONS | `if (req.method === 'OPTIONS')` | ❌ Non |
| 2. Auth check | `supabase.auth.getUser(token)` | ⚠️ Oui (réseau) |
| 3. Role check | `userRole !== 'admin'` | ❌ Non |
| 4. Body parse | `req.json()` | ❌ Non |
| 5. Action dispatch | `if (action === '...')` | ⚠️ Dépend de l'action |
| 6. DB queries | `supabase.from(...).select(...)` | ⚠️ Oui (réseau) |

#### Instrumentation ajoutée

**1. `ping_public` — healthcheck sans auth:**
```typescript
// Ajouté AVANT la vérification d'auth
if (actionFromQuery === 'ping_public') {
  return new Response(JSON.stringify({ 
    ok: true, 
    ts: Date.now(),
    requestId,
    durationMs: duration
  }), { headers: responseHeaders })
}
```

**2. Logs corrélés avec `x-request-id`:**
```typescript
const requestId = req.headers.get('x-request-id') || crypto.randomUUID()
console.log(`[admin] START | rid=${requestId} | action=${action} | method=${method}`)
// ... processing ...
console.log(`[admin] END | rid=${requestId} | action=${action} | ${duration}ms | 200`)
```

**3. CORS headers mis à jour:**
```typescript
'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id'
```

### Instrumentation front ajoutée

**Fichier:** `src/pages/Sous-Settings/SettingsComptes.jsx`

```javascript
const requestId = crypto.randomUUID();
console.log(`[SettingsComptes] callAdmin:start | rid=${requestId} | action=${action} | attempt=${attempt}`);

const { data, error } = await supabase.functions.invoke('admin', {
  body: { action, ...payload },
  headers: { 'x-request-id': requestId },
});

console.info(`[SettingsComptes] callAdmin:success | rid=${requestId} | action=${action} | ${duration}ms`);
```

### Tests de validation H2

#### Test 1: ping_public (sans auth)

**Commande console navigateur:**
```javascript
// Remplacer <PROJECT_REF> par votre ref Supabase
fetch("https://<PROJECT_REF>.supabase.co/functions/v1/admin?action=ping_public", {
  method: "POST",
  headers: { "Content-Type": "application/json" }
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

**Critère pass/fail:**
- ✅ PASS: Réponse `{ ok: true, ts: ..., requestId: ..., durationMs: < 1000 }`
- ❌ FAIL: Timeout, CORS error, ou erreur réseau

#### Test 2: Corrélation request-id

**Procédure:**
1. Ouvrir `/settings/comptes` dans l'app
2. Ouvrir DevTools > Console
3. Observer les logs `[SettingsComptes] callAdmin:start | rid=XXX`
4. Vérifier les logs Supabase Dashboard (Edge Function logs)
5. Chercher le même `rid=XXX`

**Critère pass/fail:**
- ✅ PASS: Même `rid` visible front ET edge
- ❌ FAIL: Edge function ne reçoit jamais la requête

#### Test 3: Si edge function ne reçoit rien

**Hypothèses à vérifier:**
| Hypothèse | Test |
|-----------|------|
| CORS/preflight bloqué | Vérifier Network tab pour requête OPTIONS |
| Extension navigateur | Tester en navigation privée |
| URL incorrecte | Vérifier `VITE_SUPABASE_URL` dans `.env` |
| Blocage réseau | `Invoke-RestMethod` depuis PowerShell |

**Test PowerShell:**
```powershell
Invoke-RestMethod -Uri "https://<PROJECT_REF>.supabase.co/functions/v1/admin?action=ping_public" -Method POST -ContentType "application/json"
```

**Test navigation privée:**
1. Ouvrir fenêtre privée (Ctrl+Shift+N)
2. Aller sur l'app
3. Se connecter en admin
4. Observer si `/settings/comptes` charge

---

## H3 — "Problème Deno / Supabase CLI"

### Commandes exécutées

```powershell
deno --version
npx supabase --version
node -v
npm -v
```

### Résultats

| Outil | Version | Status |
|-------|---------|--------|
| **Node.js** | v22.21.0 | ✅ OK |
| **npm** | 10.9.4 | ✅ OK |
| **Supabase CLI (npx)** | 2.72.1 | ✅ OK |
| **Deno** | N/A | ❌ Non installé |

**Erreur Deno:**
```
deno : Le terme «deno» n'est pas reconnu comme nom d'applet de commande...
CommandNotFoundException
```

### Solutions proposées

#### Solution 1 (préférée): Utiliser Supabase CLI via npx

```powershell
# Servir les edge functions localement
npx supabase functions serve admin --env-file .env.local

# Déployer
npx supabase functions deploy admin
```

**Avantage:** Pas besoin d'installer Deno globalement.

#### Solution 2: Installer Deno proprement

**Méthode winget (recommandée Windows):**
```powershell
winget install DenoLand.Deno
# Redémarrer le terminal
deno --version
```

**Méthode script officiel:**
```powershell
irm https://deno.land/install.ps1 | iex
# Ajouter au PATH si nécessaire
$env:Path += ";$env:USERPROFILE\.deno\bin"
```

**Causes possibles d'échec:**
| Cause | Solution |
|-------|----------|
| Proxy/Firewall | Configurer `HTTP_PROXY` / `HTTPS_PROXY` |
| Antivirus | Ajouter exception pour `deno.exe` |
| Droits insuffisants | Lancer PowerShell en admin |
| PATH non mis à jour | Redémarrer terminal ou ajouter manuellement |

### Conclusion H3

**Deno n'est pas installé**, mais ce n'est **pas bloquant** car:
- `npx supabase` fonctionne (v2.72.1)
- Les Edge Functions peuvent être déployées et testées via CLI npx
- Le développement local des functions peut se faire avec `npx supabase functions serve`

---

## Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `supabase/functions/admin/index.ts` | +`ping_public`, +logs corrélés, +`x-request-id` |
| `src/pages/Sous-Settings/SettingsComptes.jsx` | +`x-request-id` header, +logs corrélés |

---

## Actions testables (P1/P2/P3)

### P1 — Vérifier connectivité Edge Function (5 min)

| Action | Commande/Manipulation | Critère pass/fail |
|--------|----------------------|-------------------|
| **P1.1** Test ping_public console | Exécuter fetch `ping_public` dans console | Réponse `{ ok: true }` en < 1s |
| **P1.2** Test ping_public PowerShell | `Invoke-RestMethod` vers ping_public | Même résultat |
| **P1.3** Déployer edge function | `npx supabase functions deploy admin` | Deploy success |

### P2 — Valider corrélation logs (10 min)

| Action | Commande/Manipulation | Critère pass/fail |
|--------|----------------------|-------------------|
| **P2.1** Charger /settings/comptes | Ouvrir la page, observer console | Logs `rid=XXX` visibles |
| **P2.2** Vérifier logs edge | Supabase Dashboard > Edge Functions > Logs | Même `rid=XXX` côté edge |
| **P2.3** Test navigation privée | Même test en fenêtre privée | Même comportement |

### P3 — Diagnostiquer si edge ne reçoit rien (15 min)

| Action | Commande/Manipulation | Critère pass/fail |
|--------|----------------------|-------------------|
| **P3.1** Vérifier Network tab | Observer requête OPTIONS + POST | 200 sur les deux |
| **P3.2** Vérifier .env | `VITE_SUPABASE_URL` correcte | URL valide |
| **P3.3** Désactiver extensions | Tester avec extensions désactivées | Même comportement |
| **P3.4** Installer Deno (optionnel) | `winget install DenoLand.Deno` | `deno --version` fonctionne |

---

## Conclusion générale

| Hypothèse | Verdict | Preuves |
|-----------|---------|---------|
| **H1** Règles IA repo | ❌ Non confirmé | Aucun fichier de règles IA dans SER1 (seulement bmad-method/) |
| **H2** Edge Function admin | ⚠️ À valider | Instrumentation ajoutée, tests P1/P2 à exécuter |
| **H3** Deno non installé | ✅ Confirmé mais non bloquant | `npx supabase` fonctionne |

**Prochaine étape:** Exécuter les tests P1.1 à P1.3 pour confirmer ou infirmer H2.
