# Backlog TODO/FIXME - Triage 2026-02-06

## Règle de gouvernance
**Format obligatoire :** `TODO(#issue): description` ou `TODO(YYYY-MM-DD/owner): description`
Les TODO sans identifiant doivent être convertis en issue ou supprimés.

## Liste triée

### PPT Template Loading - À planifier
| Fichier | Ligne | TODO | Action | Priorité |
|---------|-------|------|--------|----------|
| `src/pptx/template/loadBaseTemplate.ts` | 26-30 | Implémenter chargement réel PPTX | Créer issue #XXX - Feature template PPTX | P2 |
| `src/pptx/template/loadBaseTemplate.ts` | 39 | Charger structure depuis serenity-base.pptx | Même issue #XXX | P2 |
| `src/pptx/template/loadBaseTemplate.ts` | 68 | Définir dimensions slide 16:9 | Vérifier si nécessaire (auto PPTXGenJS) | P3 |
| `src/pptx/template/loadBaseTemplate.ts` | 71-75 | Ajouter masters slides | Même issue #XXX | P2 |
| `src/pptx/template/loadBaseTemplate.ts` | 84 | Vérifier présence fichier template | Même issue #XXX | P2 |

### Engine - Succession
| Fichier | Ligne | TODO | Action | Priorité |
|---------|-------|------|--------|----------|
| `src/engine/succession.ts` | ~300+ | FIXME/TODO à identifier | Lire fichier complet et créer issue si pertinent | P2 |

### Autres fichiers à inspecter
- `src/pages/Settings.jsx` - 1 match
- `src/pptx/ops/applyChapterImage.ts` - 1 match  
- `src/pptx/ops/applyCoverLogo.ts` - 1 match
- `src/pptx/theme/pptxTheme.ts` - 1 match

## Recommandation
Créer une issue unique "Feature: Template PPTX natif" regroupant les 5 TODO de `loadBaseTemplate.ts`.
Les autres TODO sont probablement obsolètes ou devraient être transformés en tâches planifiées.
