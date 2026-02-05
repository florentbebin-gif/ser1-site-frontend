# Documentation SER1

Index de la documentation technique.

---

## Structure

```
docs/
├── README.md                    # Ce fichier
├── design/
│   └── color-governance.md      # 🎨 Source unique : tokens C1-C10, exceptions, contraste
├── runbook/
│   └── debug.md                 # 🔧 Flags de debug, politique console
├── history/                     # 📜 Archives (historique, post-mortems)
│   ├── changelog.md             # Journal d'évolutions détaillé
│   ├── dev-notes.md             # Notes développement Vague 0-3
│   ├── color-audit.md           # Audit couleurs (archive)
│   ├── color-correction-plan.md # Plan correction (archive)
│   └── rls-backup.md            # Backup RLS policies
└── technical/                   # Guides techniques
    ├── admin/                   # Documentation page admin
    ├── diagnostics/             # Guides de diagnostic
    └── fixes/                   # Historique des corrections
```

---

## 🎨 Gouvernance Couleurs (Source de Vérité)

| Document | Description | Usage |
|----------|-------------|-------|
| **[color-governance.md](design/color-governance.md)** | Tokens C1-C10, 2 exceptions (#FFFFFF, #996600), mapping sémantique, règles contraste | **OBLIGATOIRE** avant toute modif couleur |

**⚠️ Règle absolue** : Aucune couleur hardcodée sauf `WHITE (#FFFFFF)` et `WARNING (#996600)`. Tout le reste passe par les tokens C1-C10 ou `getSemanticColors()`.

---

## 🔧 Runbook

| Document | Description |
|----------|-------------|
| [debug.md](runbook/debug.md) | Flags DEBUG, politique console, helpers debugFlags |
| [README principal](../README.md) | Troubleshooting, commandes, architecture |

---

## 🐛 Diagnostics & Corrections

### Diagnostics
| Document | Description |
|----------|-------------|
| [technical/diagnostics/edge-functions-diagnostics.md](technical/diagnostics/edge-functions-diagnostics.md) | Debug Edge Functions Supabase |
| [technical/diagnostics/hardcoded-values-audit.md](technical/diagnostics/hardcoded-values-audit.md) | Audit valeurs hardcodées |
| [technical/diagnostics/cleanup-duplicate-proof.md](technical/diagnostics/cleanup-duplicate-proof.md) | Preuves cleanup |

### Fixes (Historique)
| Document | Problème résolu |
|----------|-----------------|
| [technical/fixes/theme-flash-fix.md](technical/fixes/theme-flash-fix.md) | FOUC (Flash of Unstyled Content) |
| [technical/fixes/theme-fixes.md](technical/fixes/theme-fixes.md) | Thèmes et couleurs |
| [technical/fixes/role-fix.md](technical/fixes/role-fix.md) | Gestion des rôles admin |
| [technical/fixes/settings-focus-bug.md](technical/fixes/settings-focus-bug.md) | Bug focus Settings |
| [technical/fixes/tmi-calculation-fix.md](technical/fixes/tmi-calculation-fix.md) | Calcul TMI |

---

## 📜 Historique (Archives)

Ces documents sont conservés pour référence mais ne reflètent pas l'état actuel :

| Document | Statut | Description |
|----------|--------|-------------|
| [history/color-audit.md](history/color-audit.md) | Archive | Audit initial couleurs — la plupart des écarts sont corrigés |
| [history/color-correction-plan.md](history/color-correction-plan.md) | Archive | Plan de correction — Phase 0 exécutée |
| [history/dev-notes.md](history/dev-notes.md) | Archive | Notes Vague 0-3 (Cabinets/Logos/Thèmes) |
| [CHANGELOG.md](../CHANGELOG.md) | Actif | Journal des releases et évolutions |
| [history/rls-backup.md](history/rls-backup.md) | Backup | Backup des policies RLS |

---

## Conventions

- **design/** : Règles et gouvernance (active)
- **runbook/** : Guides opérationnels (active)
- **technical/** : Guides techniques par thème
- **history/** : Archives, historiques, post-mortems
- Les fichiers `.xlsx` et `.pptx` sont ignorés par git (voir `.gitignore`)
