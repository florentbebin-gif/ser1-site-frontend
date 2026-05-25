# Snapshots visuels simulateurs

Le script `sim-visual-snapshot.mjs` capture une page simulateur sur desktop et mobile, puis écrit les images et mesures DOM dans `.tmp/sim-ser1-2026/<commit>/`.

Exemple :

```powershell
node scripts/sim-visual-snapshot.mjs --page=credit --label=before
node scripts/sim-visual-snapshot.mjs --page=credit --label=after --compare
```

Le serveur Vite preview doit être disponible sur `http://localhost:4173`, ou via `SER1_VISUAL_BASE_URL`.
