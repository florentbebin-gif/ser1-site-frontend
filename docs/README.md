# Documentation SER1

Index de la documentation technique.

## Structure

```
docs/
├── technical/
│   ├── admin/        # Documentation page admin
│   ├── diagnostics/  # Guides de diagnostic
│   └── fixes/        # Historique des corrections
├── dev-notes.md      # Notes de développement
└── brainstorming-session-results.md
```

## Index par thème

### 🔧 Diagnostics

| Document | Description |
|----------|-------------|
| [`technical/diagnostics/edge-functions-diagnostics.md`](technical/diagnostics/edge-functions-diagnostics.md) | Debug Edge Functions Supabase |
| [`technical/diagnostics/hardcoded-values-audit.md`](technical/diagnostics/hardcoded-values-audit.md) | Audit valeurs hardcodées |

### 🐛 Corrections (historique)

| Document | Problème résolu |
|----------|-----------------|
| [`technical/fixes/theme-flash-fix.md`](technical/fixes/theme-flash-fix.md) | FOUC (Flash of Unstyled Content) |
| [`technical/fixes/theme-fixes.md`](technical/fixes/theme-fixes.md) | Thèmes et couleurs |
| [`technical/fixes/role-fix.md`](technical/fixes/role-fix.md) | Gestion des rôles admin |
| [`technical/fixes/settings-focus-bug.md`](technical/fixes/settings-focus-bug.md) | Bug focus Settings |
| [`technical/fixes/tmi-calculation-fix.md`](technical/fixes/tmi-calculation-fix.md) | Calcul TMI |

### 👤 Admin

| Document | Description |
|----------|-------------|
| [`technical/admin/`](technical/admin/) | Documentation page admin |

## Runbook rapide

Voir le [README principal](../README.md) section "Runbook" pour les erreurs fréquentes et leurs solutions.

## Conventions

- **diagnostics/** : guides pour investiguer un problème
- **fixes/** : documentation d'une correction appliquée (historique)
- Les fichiers `.xlsx` et `.pptx` sont ignorés par git (voir `.gitignore`)
