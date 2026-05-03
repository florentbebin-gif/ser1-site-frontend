# Exports PPTX & XLSX

À appliquer pour tout export PowerPoint (`.pptx`) ou Excel/CSV (`.xlsx`, `.xlsm`, `.csv`, `.tsv`).

---

## Architecture exports SER1

| Composant | Fichier |
|---|---|
| Contrat produit | `docs/GOUVERNANCE_EXPORTS.md` |
| Orchestrateur PPTX | `src/pptx/export/exportStudyDeck.ts` |
| Design system PPTX | `src/pptx/designSystem/serenity.ts` |
| Slides PPTX | `src/pptx/slides/` |
| Wrapper audit | `src/features/audit/export/exportAudit.ts` |
| Wrapper stratégie | `src/features/strategy/export/exportStrategy.ts` |
| Builder XLSX partagé | `src/utils/export/xlsxBuilder.ts` |
| Fingerprint exports | `src/utils/export/exportFingerprint.ts` |
| Exports feature-owned | `src/features/*/export/` |
| Snapshots exports | `tests/snapshots/` |

---

## Règles PPTX

- **Code versionné uniquement** : modifier le builder/wrapper, jamais un `.pptx` généré manuellement
- **Wrapper feature-owned** : les composants UI passent par un wrapper, pas directement dans le générateur PPTX
- Ne jamais référencer des guides Office externes non versionnés

## Règles XLSX

- **Builder modifié, pas fichier généré** : toujours modifier le code source
- **Cohérence UI** : hypothèses et warnings exportés = mêmes que l'interface
- **Fingerprints stables** : ne pas changer sans justification

---

## Workflow

1. Identifier le type d'export (audit, stratégie, XLSX succession, etc.)
2. Localiser le wrapper ou builder feature-owned correspondant
3. Modifier le code source
4. Mettre à jour `docs/GOUVERNANCE_EXPORTS.md` si le contrat change

---

## Commandes utiles

```powershell
# Tests d'export PPTX
npm test -- pptx

# Tests d'export XLSX
npm test -- xlsx

# Validation complète
npm run check

# Rechercher les wrappers PPTX
rg "exportStudyDeck|exportAudit|exportStrategy" src/ -n --include="*.ts"

# Rechercher les builders XLSX
rg "xlsxBuilder|exportFingerprint" src/ -n --include="*.ts"
```

---

## Critères d'arrêt

- [ ] Tests d'export passent (PPTX et/ou XLSX selon la modification)
- [ ] `npm run check` passe
- [ ] Aucun fichier généré modifié manuellement
- [ ] `docs/GOUVERNANCE_EXPORTS.md` à jour si le contrat change

## Ce qu'il ne faut pas faire

- ❌ Modifier un `.pptx` ou `.xlsx` généré manuellement
- ❌ Référencer des guides Office externes non versionnés
- ❌ Intégrer des composants UI directement dans le générateur PPTX
- ❌ Diverger les hypothèses exportées de l'UI
- ❌ Ignorer les tests de snapshot après modification
