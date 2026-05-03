# Base — Conventions transverses SER1

Règles de base actives en permanence pour tout travail sur ce dépôt.

---

## Terminal

- OS : **Windows / PowerShell**
- Ne jamais proposer de commandes macOS/Linux (`bash`, `ls`, `grep`, `wc -l`, etc.)
- Toujours utiliser les équivalents PowerShell :

| Commande Linux | Équivalent PowerShell |
|---|---|
| `ls` | `Get-ChildItem` |
| `grep` | `rg` (ripgrep) ou `Select-String` |
| `wc -l` | `(Get-Content fichier).Count` |
| `cat` | `Get-Content` |
| `rm` | `Remove-Item` |
| `&&` | `;` ou `Start-Process` |
| `2>&1` | `2>&1` (compatible PowerShell) |

Exemple de diagnostic CI :

```powershell
npm run check 2>&1 | Tee-Object -FilePath check_output.log
```

---

## Langue

- **Français obligatoire** dans tous les commentaires, commits, docs, et réponses
- Corriger les fautes dans les fichiers modifiés
- Noms de variables et fonctions : anglais (convention TypeScript du projet)

---

## Règles absolues (toujours actives)

### Zéro valeur fiscale hardcodée

Ne jamais écrire : `17.2`, `12.8`, `30`, `100000`, `15932`
→ Utiliser `src/constants/settingsDefaults.ts`
→ Guard CI : `npm run check:fiscal-hardcode`

### Chaîne fiscale obligatoire

```
Supabase → fiscalSettingsCache.ts → useFiscalContext.ts → settingsDefaults.ts
```

Ne jamais court-circuiter cette chaîne.

### Imports Supabase — zones autorisées uniquement

- `src/auth/`
- `src/utils/cache/`
- `src/hooks/`
- `src/settings/`
- `src/pages/` (auth flow + settings admin)
- **Interdit** dans `src/features/`, `src/engine/`, `src/components/`

### Diff minimal

Patch le plus petit qui résout le problème. Pas de refactor annexe.

### Zéro `console.log` en production

- `console.log/info/debug` : interdits sauf derrière `if (DEBUG_FOO)`
- `console.error/warn` : autorisés pour les erreurs réelles

### Zéro `any` TypeScript

Toujours typer explicitement. Si le type est inconnu, utiliser `unknown` avec une assertion typée.

---

## CI gate

`npm run check` doit passer avant tout commit :

```powershell
npm run check
```

Étapes dans l'ordre : lint → fiscal-hardcode → css-colors → theme-sync → no-js → arch → circular → typecheck → test → build
