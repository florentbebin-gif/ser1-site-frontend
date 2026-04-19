# Audit d'uniformisation des pages `/sim/*`

**Date** : 2026-04-19  
**Périmètre** : shell partagé des simulateurs, baseline CSS `/sim/*`, pages `IR`, `Succession`, `Crédit`, `Placement`

---

## 1. Objectif

Formaliser une structure de page unique pour les simulateurs SER1 afin de :
- supprimer les duplications de layout page-level ;
- fiabiliser la création de futures pages `/sim/*` ;
- centraliser le contrat HTML/CSS dans un composant partagé ;
- conserver les layouts métier spécifiques dans les features.

## 2. Fondations déjà partagées

- `src/styles/sim/layout.css`
- `src/styles/sim/headers.css`
- `src/styles/sim/surfaces.css`
- `src/styles/sim/fields.css`
- `src/styles/sim/modals.css`
- `src/styles/premium-shared.css`
- `src/components/ui/sim/SimFieldShell.tsx`
- `src/components/ui/sim/SimSelect.tsx`
- `src/components/ui/sim/SimModalShell.tsx`
- `src/components/ui/sim/SimCardHeader.tsx`

## 3. Divergences relevées avant migration

| Feature | Duplications / anomalies |
|---|---|
| IR | `.ir-grid`, `.ir-header__subtitle-row`, override mobile local de `.premium-title` |
| Succession | `.sc-header__subtitle-row`, `.sc-top-row`, `.sc-grid`, double structure page-level |
| Crédit | `.cv-grid`, `.cv-header__subtitle-row`, `.cv-controls-row`, `CreditHeader`, override mobile local de `.premium-title` |
| Placement | `.pl-ir-grid`, header d'erreur local, `PlacementToolbar` mélange header + nav |

## 4. Contrat partagé retenu

La structure de référence est implémentée par `src/components/ui/sim/SimPageShell.tsx`.

### Props

- `title`, `subtitle`
- `actions`, `nav`, `notice`, `controls`
- `loading`, `loadingContent`
- `error`, `errorContent`
- `pageClassName`
- `pageTestId`, `headerTestId`, `titleTestId`, `statusTestId`
- `mobileSideFirst`

### Slots

- `SimPageShell.Main`
- `SimPageShell.Side`
- `SimPageShell.Section`

### Garanties

- le shell rend les wrappers `.sim-page`, `.sim-controls-row`, `.sim-grid`, `.sim-grid__col` ;
- les features ne doivent plus rendre elles-mêmes les colonnes page-level ;
- l'état `error` prime sur `loading` ;
- l'absence de `Side` bascule la grille en mono-colonne ;
- le modificateur `mobileSideFirst` permet de remonter la colonne latérale en mobile.

## 5. HTML cible

```html
<div class="sim-page">
  <header class="premium-header sim-header sim-header--stacked">
    <h1 class="premium-title">…</h1>
    <div class="sim-header__subtitle-row">
      <p class="premium-subtitle">…</p>
      <div class="sim-header__actions">…</div>
    </div>
    <nav class="sim-header__nav">…</nav>
  </header>

  <div class="sim-notice">…</div>
  <div class="sim-controls-row">…</div>

  <main class="sim-grid">
    <section class="sim-grid__col sim-grid__col--main">…</section>
    <aside class="sim-grid__col sim-grid__col--side sim-grid__col--sticky">…</aside>
  </main>

  <section class="sim-section">…</section>
</div>
```

## 6. Règle de nommage

- `.sim-*` : réservé à `src/styles/sim/*`
- `.ir-*`, `.sc-*`, `.cv-*`, `.pl-*` : réservé aux contenus métier de feature
- Interdiction de recréer une grille, une ligne d'actions ou une ligne de contrôles page-level en préfixe feature

## 7. Séquence de migration

1. Introduire `SimPageShell` et la baseline CSS partagée.
2. Migrer `IR`.
3. Migrer `Succession`.
4. Migrer `Crédit`.
5. Migrer `Placement` et harmoniser les chips d'actions.
