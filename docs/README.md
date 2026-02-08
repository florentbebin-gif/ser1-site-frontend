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
    ├── api/                     # Documentation API
    │   └── admin-function.md    # Référence Edge Function admin
    ├── fixes/                   # Corrections récentes (1 fichier restant)
    ├── placement-architecture.md  # 🏗️ Architecture modulaire PlacementV2
    └── sql/                     # 🔧 Scripts SQL de maintenance
        └── fix-ui-settings-duplicates.sql
```

---

## 🎨 Gouvernance Couleurs (Source de Vérité)

| Document | Description | Usage |
|----------|-------------|-------|
| **[Gouvernance UI](docs/design/ui-governance.md)** | Standards Layout, Inputs, Typo, Composants "Premium" | **OBLIGATOIRE** pour toute nouvelle page |

**⚠️ RÈGLES ABSOLUES** : Aucune couleur hardcodée sauf `WHITE (#FFFFFF)` et `WARNING (#996600)`. Tout le reste passe par les tokens C1-C10 ou `getSemanticColors()`.

---

## 🏗️ Architecture Technique

| Document | Description |
|----------|-------------|
| **[Architecture Placement](technical/placement-architecture.md)** | Modularisation de `PlacementV2.jsx` (Phase 3) — 7 modules, réduction 54% |

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

### Fixes (Historique — voir CHANGELOG.md pour le détail)
| Document | Problème résolu |
|----------|-----------------|
| [technical/fixes/role-fix.md](technical/fixes/role-fix.md) | Gestion des rôles admin (guide dépannage) |

> **Note** : Les autres corrections (theme flash, settings focus, TMI, etc.) sont documentées dans [CHANGELOG.md](../CHANGELOG.md). Les scripts SQL sont dans `technical/sql/`.

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
