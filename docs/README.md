# Documentation SER1

Index de la documentation technique.

---

## Structure

```
docs/
├── README.md                    # Ce fichier
├── design/
│   ├── color-governance.md      # 🎨 Source unique : tokens C1-C10, exceptions, contraste
│   └── ui-governance.md         # 📐 Standards Layout, Inputs, Typo, Composants "Premium"
├── runbook/
│   └── debug.md                 # 🔧 Flags de debug, politique console
├── CHANGELOG.md                 # 📜 Historique détaillé des évolutions
├── adr/                         # Architecture Decision Records
│   └── ADR-001-pptx-template-strategy.md
├── technical/                   # Guides techniques
    ├── admin/                   # Documentation page admin
    ├── api/                     # Documentation API
    │   └── admin-function.md    # Référence Edge Function admin
    ├── diagnostics/             # Guides diagnostics
    │   └── edge-functions-diagnostics.md
    └── security/
        └── security-user-metadata-guidelines.md
└── theme/                       # 🎨 Système de thème
    ├── architecture.md          # Architecture ThemeProvider, sources, hiérarchie
    ├── cabinet-themes.md        # Thèmes cabinet, cache, invalidation
    └── troubleshooting.md      # Debug et résolution des problèmes de thème
```

---

## 🎨 Gouvernance Design System

| Document | Description | Usage |
|----------|-------------|-------|
| **[Gouvernance Couleurs](design/color-governance.md)** | Règles complètes C1-C10, exceptions, contraste | **OBLIGATOIRE** avant toute modif couleur |
| **[Gouvernance UI](design/ui-governance.md)** | Standards Layout, Inputs, Typo, Composants "Premium" | **OBLIGATOIRE** pour toute nouvelle page |

## 🎨 Système de Thème

| Document | Description | Usage |
|----------|-------------|-------|
| **[Architecture Thème](theme/architecture.md)** | ThemeProvider, sources, hiérarchie des couleurs | **OBLIGATOIRE** pour comprendre le système |
| **[Thèmes Cabinet](theme/cabinet-themes.md)** | Cache, invalidation, changement de cabinet | **OBLIGATOIRE** pour debug thème cabinet |
| **[Troubleshooting Thème](theme/troubleshooting.md)** | Debug et résolution des problèmes de thème | **OBLIGATOIRE** pour résoudre les bugs |

**⚠️ RÈGLES ABSOLUES** : Aucune couleur hardcodée sauf `WHITE (#FFFFFF)` et `WARNING (#996600)`. Tout le reste passe par les tokens C1-C10 ou `getSemanticColors()`.

---

## 🏗️ Architecture Technique

| Document | Description |
|----------|-------------|
| **[ADR-001](adr/ADR-001-pptx-template-strategy.md)** | Stratégie PPTX : template codé vs natif |
| **[Security Guidelines](technical/security/security-user-metadata-guidelines.md)** | Règles sécurité : app_metadata vs user_metadata |

---

## 🔧 Runbook

| Document | Description |
|----------|-------------|
| [debug.md](runbook/debug.md) | Flags DEBUG, politique console, helpers debugFlags |
| [README principal](../README.md) | Troubleshooting, commandes, architecture |
| [CHANGELOG.md](CHANGELOG.md) | Historique détaillé des évolutions et fixes |

---

## 🐛 Diagnostics & Sécurité

### Diagnostics
| Document | Description |
|----------|-------------|
| [technical/diagnostics/edge-functions-diagnostics.md](technical/diagnostics/edge-functions-diagnostics.md) | Debug Edge Functions Supabase |

### Sécurité
| Document | Description |
|----------|-------------|
| [technical/security/security-user-metadata-guidelines.md](technical/security/security-user-metadata-guidelines.md) | Guidelines app_metadata vs user_metadata |

---

## 📜 Historique & ADRs

| Document | Statut | Description |
|----------|--------|-------------|
| [CHANGELOG.md](CHANGELOG.md) | Actif | Journal des releases et évolutions |
| [ADR-001](adr/ADR-001-pptx-template-strategy.md) | Actif | Architecture Decision Record PPTX |

---

## Conventions

- **design/** : Règles et gouvernance (active)
- **runbook/** : Guides opérationnels (active)
- **technical/** : Guides techniques par thème (admin, api, diagnostics, security)
- **adr/** : Architecture Decision Records
- **CHANGELOG.md** : Historique détaillé des évolutions
- Les fichiers `.xlsx` et `.pptx` sont ignorés par git (voir `.gitignore`)
