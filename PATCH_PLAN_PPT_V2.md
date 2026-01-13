# PLAN D'IMPLÉMENTATION — PATCHS PPT V2 PREMIUM

**Version** : 1.0 | **Date** : 2026-01-13 | **Auteur** : Tech Lead
**Source** : `SPEC_EXPORT_PPT_V2_PREMIUM.md`

---

## LÉGENDE

- **Objectif** : But unique du patch.
- **Fichiers** : Liste exhaustive des fichiers à modifier.
- **Étapes** : Séquence d'actions pour l'implémentation.
- **DoD** : Definition of Done locale pour valider le patch.
- **Commandes** : Commandes PowerShell utiles.
- **Contexte** : Extraits de code/spec à fournir à l'IA de codage (max 20k tokens).
- **Anti-dérive** : Condition d'arrêt stricte.

---

### PATCH 1 : FONDATIONS — MISE À JOUR `slideHelpers.ts`

- **Objectif** : Mettre à jour les constantes de style dans `slideHelpers.ts` pour refléter le `STYLE_GUIDE_PPT_PREMIUM.md` (marges, polices, espacements).
- **Fichiers** : `src/pptx/slideHelpers.ts`
- **Étapes** :
    1. Remplacer l'objet `STYLE` existant par celui défini dans la SPEC V2 (marges 0.75", tailles de police H1 36pt, KPI 52pt, etc.).
    2. Mettre à jour les valeurs par défaut dans les helpers existants (`drawTitleWithOverline`, `drawTitleWithUnderline`, `drawFooter`) pour utiliser les nouvelles constantes.
    3. Vérifier que les helpers `drawKpiRow` et `drawResultLine` utilisent les nouvelles tailles de police pour les valeurs et labels.
    4. Ajouter un commentaire de version en haut du fichier : `// v2.0 - Premium Style Update 2026-01-13`.
    5. Lancer `npm run build` pour vérifier l'absence de régression de typage.
- **DoD local** :
    - L'objet `STYLE` dans `slideHelpers.ts` est identique à celui de la SPEC V2.
    - La marge par défaut (`MARGIN`) est de `0.75`.
    - La taille de police `KPI_VALUE_SIZE_HERO` est de `52`.
    - Le build passe sans erreur.
- **Commandes** : `npm run build`
- **Contexte** : `STYLE_GUIDE_PPT_PREMIUM.md` (section 3.6), `src/pptx/slideHelpers.ts` (contenu complet).
- **Anti-dérive** : Ne modifier QUE les constantes et les valeurs par défaut dans `slideHelpers.ts`. Ne pas créer de nouveaux helpers.

---

### PATCH 2 : AMÉLIORATION — `drawSegmentedBar` (Barre TMI)

- **Objectif** : Améliorer `drawSegmentedBar` pour supporter un dégradé de couleurs et un marqueur de position précis, comme requis pour la barre TMI de l'export IR.
- **Fichiers** : `src/pptx/slideHelpers.ts`
- **Étapes** :
    1. Modifier la signature de `drawSegmentedBar` pour accepter une palette de couleurs (`colors: string[]`) au lieu d'une couleur par segment.
    2. Mettre à jour la logique pour que les segments utilisent les couleurs de la palette en dégradé (ex: `colors[index]`).
    3. Modifier le `markerValue` pour qu'il puisse être positionné précisément sous le segment actif, avec une petite flèche (▼).
    4. Ajouter une option `sublabel` pour afficher du texte sous le `markerValue` (pour la "marge avant changement").
    5. Mettre à jour le smoke test (commenté) pour utiliser la nouvelle signature.
- **DoD local** :
    - La fonction peut dessiner une barre avec 5 segments de couleurs différentes.
    - Le `markerValue` s'affiche correctement sous le segment `activeIndex`.
    - Le build passe sans erreur.
- **Commandes** : `npm run build`
- **Contexte** : `SPEC_EXPORT_PPT_V2_PREMIUM.md` (section 2.1, Slide 3), `src/pptx/slideHelpers.ts` (uniquement la fonction `drawSegmentedBar`).
- **Anti-dérive** : Ne modifier QUE `drawSegmentedBar`. Ne pas toucher aux autres helpers.

---

### PATCH 3 : NOUVEAU HELPER — `drawLoanSummaryCard` (Crédit)

- **Objectif** : Créer le nouveau helper `drawLoanSummaryCard` pour afficher la "carte synthèse" du prêt.
- **Fichiers** : `src/pptx/slideHelpers.ts`
- **Étapes** :
    1. Ajouter la signature de la fonction `drawLoanSummaryCard` et son interface `LoanSummaryCardOptions` dans `slideHelpers.ts` comme défini dans la SPEC.
    2. Implémenter la logique pour dessiner un rectangle de fond (coins légèrement arrondis si possible, sinon carrés).
    3. Ajouter les textes (`CAPITAL EMPRUNTÉ`, `Durée`, `Taux`, `MENSUALITÉ TOTALE`, `TAEG`) en respectant la hiérarchie de polices de la SPEC.
    4. Utiliser des `addShape('line', ...)` pour les séparateurs horizontaux.
    5. Ajouter la fonction au smoke test pour validation visuelle.
- **DoD local** :
    - La fonction `drawLoanSummaryCard` est exportée depuis `slideHelpers.ts`.
    - La fonction dessine une carte avec toutes les données requises.
    - Le build passe sans erreur.
- **Commandes** : `npm run build`
- **Contexte** : `SPEC_EXPORT_PPT_V2_PREMIUM.md` (section 3.1, Slide 3), `src/pptx/slideHelpers.ts`.
- **Anti-dérive** : Ne créer que ce helper. Ne pas l'intégrer dans `creditPptx.ts` à ce stade.

---

### PATCH 4 : NOUVEAU HELPER — `drawMatchCard` (Placement)

- **Objectif** : Créer le helper `drawMatchCard` pour la comparaison côte à côte des deux produits de placement.
- **Fichiers** : `src/pptx/slideHelpers.ts`
- **Étapes** :
    1. Ajouter la signature de `drawMatchCard` et son interface `MatchCardOptions`.
    2. Implémenter la logique pour dessiner deux cartes côte à côte.
    3. Chaque carte doit afficher une liste de métriques (clé/valeur).
    4. Respecter le style de la SPEC (titre, séparateur, liste de métriques).
- **DoD local** :
    - La fonction `drawMatchCard` est exportée.
    - La fonction dessine deux cartes comparatives.
    - Le build passe.
- **Commandes** : `npm run build`
- **Contexte** : `SPEC_EXPORT_PPT_V2_PREMIUM.md` (section 4.1, Slide 4).
- **Anti-dérive** : Ne créer que ce helper. Ne pas l'intégrer dans `placementPptx.ts`.

---

### PATCH 5 : NOUVEAU HELPER — `drawPhaseTimeline` (Placement)

- **Objectif** : Créer le helper `drawPhaseTimeline` pour la frise des 3 phases.
- **Fichiers** : `src/pptx/slideHelpers.ts`
- **Étapes** :
    1. Ajouter la signature de `drawPhaseTimeline` et son interface `PhaseTimelineOptions`.
    2. Dessiner l'axe horizontal principal.
    3. Ajouter les marqueurs verticaux pour `ageActuel`, `ageFinEpargne`, `ageAuDeces`.
    4. Dessiner les 3 rectangles colorés pour les phases (Épargne, Liquidation, Transmission).
    5. Ajouter les labels de phase et les textes pédagogiques.
- **DoD local** :
    - La fonction `drawPhaseTimeline` est exportée.
    - La frise est générée avec les 3 phases distinctes.
    - Le build passe.
- **Commandes** : `npm run build`
- **Contexte** : `SPEC_EXPORT_PPT_V2_PREMIUM.md` (section 4.1, Slide 3).
- **Anti-dérive** : Ne créer que ce helper. Ne pas l'intégrer dans `placementPptx.ts`.

---

### PATCH 6 : NOUVEAU HELPER — `drawAnnexTable` (Pagination)

- **Objectif** : Créer un helper `drawAnnexTable` capable de paginer un grand tableau sur plusieurs slides.
- **Fichiers** : `src/pptx/slideHelpers.ts`
- **Étapes** :
    1. Ajouter la signature de `drawAnnexTable` et son interface `AnnexTableOptions`.
    2. La fonction doit calculer combien de lignes tiennent sur une slide (en fonction de `maxRowsPerSlide`).
    3. Itérer sur les `rows` et créer une nouvelle slide chaque fois que la limite est atteinte.
    4. Sur chaque nouvelle slide, redessiner le titre (ex: "Tableau d'amortissement (suite)") et les en-têtes du tableau.
    5. Ajouter un texte d'introduction optionnel sur la première slide du tableau.
    6. La fonction doit retourner le nombre de slides créées pour la pagination globale.
- **DoD local** :
    - La fonction `drawAnnexTable` est exportée.
    - Un tableau de 150 lignes avec `maxRowsPerSlide: 50` génère bien 3 slides.
    - Chaque slide paginée contient le titre et les en-têtes.
- **Commandes** : `npm run build`
- **Contexte** : `SPEC_EXPORT_PPT_V2_PREMIUM.md` (section 5.2).
- **Anti-dérive** : Se concentrer sur la logique de pagination. Le style du tableau reste simple à ce stade.

---

### PATCH 7 : REFONTE EXPORT IR

- **Objectif** : Mettre à jour `irPptx.ts` pour utiliser les nouveaux styles et helpers, conformément à la SPEC V2.
- **Fichiers** : `src/pptx/irPptx.ts`, `src/pages/Ir.jsx`
- **Étapes** :
    1. Modifier `generateIRPptx` pour utiliser les nouvelles constantes de `STYLE`.
    2. Remplacer la slide de synthèse actuelle par la nouvelle slide "ESTIMATION DE LA SITUATION FISCALE".
    3. Utiliser `drawKpiRow` pour les 4 KPI (Revenus, Imposable, Parts, TMI).
    4. Utiliser le `drawSegmentedBar` amélioré pour afficher la barre TMI avec le marqueur de position.
    5. Ajouter les nouvelles données requises (`montantDansTMI`, `margeAvantChangement`) à l'interface `IRPptxData`.
    6. Mettre à jour `Ir.jsx` pour passer ces nouvelles données à `generateIRPptx`.
    7. Ajouter les slides d'annexes (Barème, Hypothèses) en utilisant `drawAnnexTable`.
    8. S'assurer que le `LONG_DISCLAIMER` exact est utilisé.
- **DoD local** :
    - L'export IR génère 5 slides client + 3 annexes.
    - La slide 3 contient la barre TMI colorée et le marqueur.
    - Les marges et polices sont conformes au `STYLE_GUIDE_PPT_PREMIUM.md`.
- **Commandes** : `npm run dev` (pour tester l'export depuis l'UI)
- **Contexte** : `SPEC_EXPORT_PPT_V2_PREMIUM.md` (section 2), `src/pptx/irPptx.ts`, `src/pages/Ir.jsx` (fonction `exportPowerPoint`).
- **Anti-dérive** : Ne pas modifier les exports Crédit ou Placement.

---

### PATCH 8 : REFONTE EXPORT CRÉDIT

- **Objectif** : Mettre à jour `creditPptx.ts` pour utiliser le `drawLoanSummaryCard`.
- **Fichiers** : `src/pptx/creditPptx.ts`, `src/pages/Credit.jsx`
- **Étapes** :
    1. Remplacer la slide de synthèse KPI actuelle par une slide utilisant `drawLoanSummaryCard`.
    2. Ajouter une slide "Coût total du crédit" avec le graphique en barres horizontales empilées.
    3. Ajouter une slide "Évolution Amortissement" avec le graphique en aires empilées.
    4. Mettre à jour les annexes pour utiliser `drawAnnexTable` pour le tableau d'amortissement paginé.
    5. Ajouter les slides d'annexes "Formules" et "Hypothèses".
- **DoD local** :
    - L'export Crédit génère ~6 slides client + ~6 annexes.
    - La slide 3 est la `LoanSummaryCard`.
    - Le tableau d'amortissement est correctement paginé.
- **Commandes** : `npm run dev`
- **Contexte** : `SPEC_EXPORT_PPT_V2_PREMIUM.md` (section 3), `src/pptx/creditPptx.ts`, `src/pages/Credit.jsx`.
- **Anti-dérive** : Ne toucher qu'à l'export Crédit.

---

### PATCH 9 : REFONTE EXPORT PLACEMENT

- **Objectif** : Mettre à jour `placementPptx.ts` avec les nouveaux helpers et la structure de la SPEC V2.
- **Fichiers** : `src/pptx/placementPptx.ts`, `src/pages/PlacementV2.jsx`
- **Étapes** :
    1. Intégrer la slide `drawPhaseTimeline`.
    2. Intégrer la slide `drawMatchCard` pour comparer les produits.
    3. Créer les 3 slides de résultats pour chaque phase (Épargne, Liquidation, Transmission) en utilisant le layout KPI.
    4. Créer la slide "Synthèse Comparative Finale".
    5. Mettre à jour les annexes pour utiliser `drawAnnexTable` pour les tableaux détaillés.
    6. Ajouter les slides d'annexes sur les règles fiscales (AV, PER, Transmission).
- **DoD local** :
    - L'export Placement génère ~9 slides client + ~8 annexes.
    - La timeline, le match P1/P2 et les 3 phases sont présents.
    - Les tableaux d'annexes sont paginés.
- **Commandes** : `npm run dev`
- **Contexte** : `SPEC_EXPORT_PPT_V2_PREMIUM.md` (section 4), `src/pptx/placementPptx.ts`, `src/pages/PlacementV2.jsx`.
- **Anti-dérive** : Ne toucher qu'à l'export Placement.

---

### PATCH 10 : INTÉGRATION DONNÉES MANQUANTES

- **Objectif** : Ajouter la logique de calcul pour les champs de données manquants identifiés dans la SPEC.
- **Fichiers** : `src/engine/irEngine.js` (ou équivalent), `src/engine/placementEngine.js`.
- **Étapes** :
    1. Dans le moteur IR, calculer `montantDansTMI` et `margeAvantChangement`.
    2. Dans le moteur Crédit, créer la structure `echeancierResume` agrégée par année.
    3. Dans le moteur Placement, calculer `netGlobal` et déterminer le `gagnant`.
    4. Exposer ces nouvelles données dans les résultats des hooks de simulation (`useIrResult`, etc.).
- **DoD local** :
    - Les nouvelles données sont disponibles dans l'objet `results` des simulateurs.
    - Les calculs sont conformes aux définitions de la SPEC.
- **Commandes** : `npm test` (si des tests existent pour les moteurs)
- **Contexte** : `SPEC_EXPORT_PPT_V2_PREMIUM.md` (section 6), `src/engine/irEngine.js`, `src/engine/placementEngine.js`.
- **Anti-dérive** : Ne faire que les calculs. Ne pas modifier les composants UI ou PPTX.

