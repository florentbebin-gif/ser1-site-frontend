# Snapshots (Vitest)

Objectif: garantir que nos sorties "IR" (et autres exports) restent **stables** dans le temps (small PR + preuves), sans committer d'outputs runtime sensibles.

## Principes

- Snapshots = **fixtures + normalisation + expectations**.
- On snapshot des **structures stables** (JSON), pas des binaires bruts.
- Toute valeur non-déterministe doit être neutralisée avant snapshot:
  - timestamps / dates
  - UUID / requestId
  - chemins absolus / OS-specific
  - champs "version" si volontairement variable

## Conventions

- Dossier: `tests/snapshots/`
- Chaque test doit:
  1. construire un objet déterministe (ou le rendre déterministe)
  2. passer par un helper `normalizeForSnapshot()`
  3. `expect(normalized).toMatchSnapshot()`

## Exécution

```bash
npm test
# ou ciblé
npx vitest run tests/snapshots --reporter=dot
```

## Sécurité

- Ne jamais logguer / snapshot:
  - headers HTTP
  - tokens (Bearer/apikey)
  - emails réels / IDs réels
