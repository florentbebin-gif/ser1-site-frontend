# Reporting & Snapshots

À appliquer pour toute modification de `src/reporting/`, des snapshots `.ser1`, des migrations de schéma, ou du fingerprint fiscal.

---

## Architecture

### Fichiers clés

| Fichier | Rôle |
|---|---|
| `src/reporting/snapshot/snapshotSchema.ts` | Définition du schéma courant |
| `src/reporting/snapshot/snapshotMigrations.ts` | Migrations inter-versions |
| `src/reporting/snapshot/snapshotIO.ts` | Lecture/écriture fichiers `.ser1` |
| `src/reporting/snapshot/index.ts` | Point d'entrée public |
| `src/utils/export/exportFingerprint.ts` | Fingerprint fiscal (consommé par `App.tsx`) |

---

## Règles absolues

- **Jamais** modifier le schéma d'un snapshot existant sans créer une migration dans `snapshotMigrations.ts`
- Toute nouvelle version = incrémenter le numéro de version + migration depuis la version précédente
- Tests de migration : couvrir le **round-trip** `ancien format → migration → nouveau format → sérialisation → désérialisation`
- Le fingerprint fiscal est embarqué dans chaque snapshot v4+

---

## Workflow

1. Identifier si le changement touche le schéma de snapshot
2. Si oui : créer une migration dans `snapshotMigrations.ts`
3. Incrémenter la version du schéma
4. Ajouter le test de round-trip
5. Vérifier le fingerprint fiscal

---

## Commandes utiles

```powershell
npm test -- snapshot
npm run check
Get-ChildItem src/reporting/snapshot/*.ts | Select-Object Name
```

---

## Critères d'arrêt

- [ ] Test de round-trip passe
- [ ] Version de schéma incrémentée
- [ ] Migration créée pour tout changement de schéma
- [ ] `npm run check` passe

## Ce qu'il ne faut pas faire

- ❌ Modifier `snapshotSchema.ts` sans créer de migration
- ❌ Oublier le test de round-trip
- ❌ Supprimer d'anciennes migrations (risque pour les snapshots existants)
