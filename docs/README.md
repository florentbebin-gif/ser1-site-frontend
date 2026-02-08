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
│   └── (archives nettoyées)     # Voir git log pour l'historique complet
└── technical/                   # Guides techniques
    ├── admin/                   # Documentation page admin
    └── fixes/                   # Historique des corrections
```

---

## 🎨 Gouvernance Couleurs (Source de Vérité)

| Document | Description | Usage |
|----------|-------------|-------|
| **[Gouvernance UI](docs/design/ui-governance.md)** | Standards Layout, Inputs, Typo, Composants "Premium" | **OBLIGATOIRE** pour toute nouvelle page |

**⚠️ RÈGLES ABSOLUES** : Aucune couleur hardcodée sauf `WHITE (#FFFFFF)` et `WARNING (#996600)`. Tout le reste passe par les tokens C1-C10 ou `getSemanticColors()`.

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

Les archives historiques ont été nettoyées. Voir `git log` ou `docs/CHANGELOG.md` pour l'historique complet.

| Document | Statut | Description |
|----------|--------|-------------|
| [CHANGELOG.md](../CHANGELOG.md) | Actif | Journal des releases et évolutions |

---

## Conventions

- **design/** : Règles et gouvernance (active)
- **runbook/** : Guides opérationnels (active)
- **technical/** : Guides techniques par thème
- **history/** : Archives, historiques, post-mortems
- Les fichiers `.xlsx` et `.pptx` sont ignorés par git (voir `.gitignore`)
