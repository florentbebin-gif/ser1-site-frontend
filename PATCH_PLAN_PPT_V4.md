# PLAN D'IMPLÉMENTATION — PATCHS PPT V4 PREMIUM

**Version** : 1.0 | **Date** : 2026-01-13 | **Auteur** : Tech Lead
**Source** : `SPEC_EXPORT_PPT_V4_PREMIUM.md`

---

## LÉGENDE

- **Objectif** : But unique et atomique du patch.
- **Fichiers** : Liste exhaustive des fichiers à modifier.
- **Étapes** : Séquence d'actions pour l'implémentation.
- **DoD** : Definition of Done locale pour valider le patch.
- **Commandes** : Commandes PowerShell utiles.
- **Context Budget** : Extraits de code/spec à fournir à l'IA de codage (≤ 15k tokens).
- **Anti-dérive** : Condition d'arrêt stricte pour éviter le "scope creep".

---

### PARTIE 1 : FONDATIONS & HELPERS

#### PATCH 1 : NOUVEAU HELPER — `applySplitLayout`

- **Objectif** : Créer un helper `applySplitLayout` pour la slide "Objectifs & Contexte" (style Présentation1 PAGE 2).
- **Fichiers** : `src/pptx/slideHelpers.ts`
- **Étapes** :
    1. Ajouter une nouvelle fonction `applySplitLayout` qui prend en paramètre une slide, une URL d'image, et la position de l'image (`'left'` ou `'right'`).
    2. La fonction ajoute l'image sur 45% de la largeur de la slide.
    3. La fonction retourne les coordonnées (`x`, `y`, `w`, `h`) de la zone de contenu restante (55% de la slide) pour y placer des textes ou autres éléments.
    4. Ajouter un exemple d'utilisation dans le smoke test du fichier.
- **DoD local** :
    - La fonction `applySplitLayout` est exportée.
    - L'appel de la fonction ajoute une image et retourne une zone de contenu valide.
    - Le build passe sans erreur.
- **Commandes** : `npm run build`
- **Context Budget** : `SPEC_EXPORT_PPT_V4_PREMIUM.md` (section Storyboard IR, Slide 2), `docs/Présentation1_PAGE_2.png`.
- **Anti-dérive** : Ne créer que le helper. Ne pas l'intégrer dans les générateurs de PPTX.

---

#### PATCH 2 : AMÉLIORATION — `drawSegmentedBar` (Gradient TMI)

- **Objectif** : Mettre à jour `drawSegmentedBar` pour supporter un dégradé de 5 couleurs et afficher les informations de marge sous la barre.
- **Fichiers** : `src/pptx/slideHelpers.ts`
- **Étapes** :
    1. Modifier la signature de `drawSegmentedBar` pour accepter une palette de couleurs (`colors: string[]`).
    2. S'assurer que la largeur des segments est proportionnelle à la taille des tranches fiscales, et non fixe.
    3. Ajouter une option `subMarkerValue` pour afficher un second texte sous le `markerValue` (pour la "marge avant changement").
    4. Mettre à jour le smoke test pour refléter la nouvelle signature et les nouvelles options.
- **DoD local** :
    - La fonction peut dessiner une barre avec 5 segments de couleurs et de largeurs différentes.
    - Les options `markerValue` et `subMarkerValue` s'affichent correctement.
- **Commandes** : `npm run build`
- **Context Budget** : `SPEC_EXPORT_PPT_V4_PREMIUM.md` (section Storyboard IR, Slide 3), `src/pptx/slideHelpers.ts` (fonction `drawSegmentedBar`).
- **Anti-dérive** : Ne modifier que `drawSegmentedBar`. Ne pas toucher aux autres helpers.

---

#### PATCH 3 : NOUVEAU HELPER — `drawDonutChart`

- **Objectif** : Créer un helper `drawDonutChart` pour la slide "Coût total du crédit".
- **Fichiers** : `src/pptx/slideHelpers.ts`
- **Étapes** :
    1. Ajouter une nouvelle fonction `drawDonutChart` qui prend en paramètre une slide et une liste de `data` (label, valeur, couleur).
    2. La fonction doit utiliser les formes de `pptxgenjs` (ex: `arc`) pour simuler un donut chart. PptxGenJS ne supporte pas nativement les donuts.
    3. Ajouter une légende à droite du graphique affichant le label, la valeur et le pourcentage de chaque part.
- **DoD local** :
    - La fonction `drawDonutChart` est exportée.
    - La fonction génère un visuel de donut avec sa légende.
- **Commandes** : `npm run build`
- **Context Budget** : `SPEC_EXPORT_PPT_V4_PREMIUM.md` (section Storyboard Crédit, Slide 4), documentation `pptxgenjs` sur les formes.
- **Anti-dérive** : Ne créer que ce helper. Ne pas l'intégrer dans `creditPptx.ts`.

---

#### PATCH 4 : NOUVEAU HELPER — `drawPhaseTimeline`

- **Objectif** : Créer le helper `drawPhaseTimeline` pour la slide "Votre horizon de vie" du simulateur Placement.
- **Fichiers** : `src/pptx/slideHelpers.ts`
- **Étapes** :
    1. Ajouter la fonction `drawPhaseTimeline` qui prend les âges (`ageActuel`, `ageFinEpargne`, `ageAuDeces`).
    2. Dessiner l'axe horizontal et les marqueurs verticaux pour chaque âge.
    3. Dessiner 3 rectangles colorés pour représenter les phases "Épargne", "Liquidation", "Transmission".
    4. Ajouter les labels de phase et les textes pédagogiques sous chaque rectangle.
- **DoD local** :
    - La fonction `drawPhaseTimeline` est exportée.
    - La frise est générée avec les 3 phases distinctes et les âges corrects.
- **Commandes** : `npm run build`
- **Context Budget** : `SPEC_EXPORT_PPT_V4_PREMIUM.md` (section Storyboard Placement, Slide 3).
- **Anti-dérive** : Ne créer que ce helper. Ne pas l'intégrer dans `placementPptx.ts`.

---

### PARTIE 2 : INTÉGRATION DES DONNÉES

#### PATCH 5 : DATA GAPS — IR

- **Objectif** : Calculer et exposer les champs `montantDansTMI` et `margeAvantChangement`.
- **Fichiers** : `src/engine/irEngine.js` (ou équivalent), `src/pptx/irPptx.ts`.
- **Étapes** :
    1. Localiser le moteur de calcul de l'IR.
    2. Ajouter la logique pour calculer le montant de revenu imposé dans la tranche marginale.
    3. Ajouter la logique pour calculer l'écart en euros avant d'atteindre le seuil de la tranche suivante.
    4. Ajouter ces deux champs à l'interface `IRPptxData` dans `irPptx.ts`.
    5. Mettre à jour l'appel à `generateIRPptx` pour passer ces nouvelles données.
- **DoD local** :
    - Les deux nouveaux champs sont présents dans l'objet `data` passé à `generateIRPptx`.
    - Les calculs sont corrects (vérifiables via `console.log` en dev).
- **Commandes** : `npm run dev`
- **Context Budget** : `SPEC_EXPORT_PPT_V4_PREMIUM.md` (section Data Gaps), `src/engine/irEngine.js`.
- **Anti-dérive** : Ne faire que les calculs. Ne pas modifier les slides PPTX.

---

#### PATCH 6 : DATA GAPS — Crédit & Placement

- **Objectif** : Exposer les données manquantes pour les simulateurs Crédit et Placement.
- **Fichiers** : `src/engine/creditEngine.js`, `src/engine/placementEngine.js`, `src/pptx/creditPptx.ts`, `src/pptx/placementPptx.ts`.
- **Étapes** :
    1. Dans le moteur Crédit, créer la structure `echeancierResume` en agrégeant l'échéancier mensuel par année.
    2. Ajouter `echeancierResume` à l'interface `CreditPptxData`.
    3. Dans le moteur Placement, s'assurer que `client.ageActuel`, `product.dureeEpargne`, et `transmission.ageAuDeces` sont bien exposés.
    4. Ajouter ces champs à l'interface `PlacementPptxData`.
- **DoD local** :
    - `echeancierResume` est disponible dans les données de l'export Crédit.
    - Les données d'âge et de durée sont disponibles pour l'export Placement.
- **Commandes** : `npm run dev`
- **Context Budget** : `SPEC_EXPORT_PPT_V4_PREMIUM.md` (section Data Gaps).
- **Anti-dérive** : Ne faire que l'exposition des données. Ne pas modifier les slides.

---

### PARTIE 3 : REFONTE DES SIMULATEURS

#### PATCH 7 : REFONTE EXPORT IR (CLIENT)

- **Objectif** : Mettre à jour la partie client de `irPptx.ts` pour correspondre à la SPEC V4.
- **Fichiers** : `src/pptx/irPptx.ts`
- **Étapes** :
    1. Ajouter une slide 2 "Objectifs & Contexte" en utilisant `applySplitLayout`.
    2. Refondre la slide 3 "Estimation" pour copier le layout de Présentation1 PAGE 3, en utilisant le `drawSegmentedBar` amélioré et les nouvelles données (`montantDansTMI`, `margeAvantChangement`).
    3. Ajouter une slide 4 "Comprendre le barème progressif" avec le schéma et les 3 blocs explicatifs.
    4. S'assurer que la slide "Impacts comparés" est conditionnelle.
- **DoD local** :
    - L'export IR client contient 6-7 slides.
    - La slide 2 est une slide split 50/50.
    - La slide 3 est une copie fidèle de Présentation1 PAGE 3.
- **Commandes** : `npm run dev`
- **Context Budget** : `SPEC_EXPORT_PPT_V4_PREMIUM.md` (Storyboard IR), `src/pptx/irPptx.ts`.
- **Anti-dérive** : Ne modifier que la partie client de l'export IR.

---

#### PATCH 8 : REFONTE EXPORT CRÉDIT (CLIENT)

- **Objectif** : Mettre à jour la partie client de `creditPptx.ts`.
- **Fichiers** : `src/pptx/creditPptx.ts`
- **Étapes** :
    1. Ajouter la slide "Objectifs & Contexte" (`applySplitLayout`).
    2. Remplacer la slide de synthèse par la "Carte synthèse du prêt" (déjà implémentée en V2, vérifier la conformité V4).
    3. Ajouter la slide "Coût total du crédit" en utilisant le nouveau helper `drawDonutChart`.
    4. Ajouter la slide "Évolution de l'amortissement" avec un `area chart` basé sur `echeancierResume`.
- **DoD local** :
    - L'export Crédit client contient 7-8 slides.
    - La slide 4 contient un donut chart.
    - La slide 5 contient un area chart.
- **Commandes** : `npm run dev`
- **Context Budget** : `SPEC_EXPORT_PPT_V4_PREMIUM.md` (Storyboard Crédit), `src/pptx/creditPptx.ts`.
- **Anti-dérive** : Ne modifier que la partie client de l'export Crédit.

---

#### PATCH 9 : REFONTE EXPORT PLACEMENT (CLIENT)

- **Objectif** : Mettre à jour la partie client de `placementPptx.ts`.
- **Fichiers** : `src/pptx/placementPptx.ts`
- **Étapes** :
    1. Ajouter la slide "Objectifs & Contexte" (`applySplitLayout`).
    2. Ajouter la slide "Votre horizon de vie" en utilisant `drawPhaseTimeline`.
    3. Améliorer les slides de phase (Épargne, Liquidation, Transmission) en y ajoutant des mini-dataviz (graph, barres, schéma fiscal).
    4. Améliorer la slide "Synthèse comparative finale" pour correspondre au style de Présentation2 PAGE 14.
- **DoD local** :
    - L'export Placement client contient 10 slides.
    - La slide 3 est la timeline des phases.
    - Les slides de phase contiennent des éléments visuels en plus des KPI.
- **Commandes** : `npm run dev`
- **Context Budget** : `SPEC_EXPORT_PPT_V4_PREMIUM.md` (Storyboard Placement), `src/pptx/placementPptx.ts`.
- **Anti-dérive** : Ne modifier que la partie client de l'export Placement.

---

### PARTIE 4 : ANNEXES & FINALISATION

#### PATCH 10 : AMÉLIORATION DES ANNEXES (TOUS)

- **Objectif** : Ajouter les blocs de texte pédagogique dans les annexes de tous les simulateurs.
- **Fichiers** : `src/pptx/irPptx.ts`, `src/pptx/creditPptx.ts`, `src/pptx/placementPptx.ts`
- **Étapes** :
    1. Pour chaque simulateur, créer une ou plusieurs slides d'annexes dédiées aux textes ("Hypothèses", "Méthodologie", "Références techniques").
    2. Utiliser les textes fournis dans `TEXTES_PREMIUM_PPT.md`.
    3. Sur la première page de chaque tableau d'annexe paginé, ajouter un court texte d'introduction.
    4. S'assurer que le style des tableaux est premium (header souligné, pas de fond plein).
- **DoD local** :
    - Les annexes IR contiennent les blocs "Hypothèses", "Méthodologie", "Barème".
    - Les annexes Crédit contiennent les blocs "Formules", "Hypothèses".
    - Les annexes Placement contiennent les blocs "Hypothèses", "Règles fiscales".
- **Commandes** : `npm run dev`
- **Context Budget** : `TEXTES_PREMIUM_PPT.md`, les 3 fichiers `...Pptx.ts`.
- **Anti-dérive** : Ne faire que l'ajout de textes et la mise en style des tableaux. Ne pas modifier les calculs.

---

#### PATCH 11 : REFONTE DISCLAIMER

- **Objectif** : S'assurer que la dernière slide de chaque export est le disclaimer long, formaté premium.
- **Fichiers** : `src/pptx/irPptx.ts`, `src/pptx/creditPptx.ts`, `src/pptx/placementPptx.ts`
- **Étapes** :
    1. Vérifier que la dernière slide de chaque générateur utilise bien le `LONG_DISCLAIMER`.
    2. Appliquer le style V4 : titre "Disclaimer" avec underline, texte justifié, taille 11pt, marges respectées.
    3. S'assurer qu'il n'y a pas de footer sur cette slide.
- **DoD local** :
    - La dernière slide de chaque export est le disclaimer V4.
    - Le texte est complet et la mise en page est correcte.
- **Commandes** : `npm run build`
- **Context Budget** : `SPEC_EXPORT_PPT_V4_PREMIUM.md` (section Disclaimer), les 3 fichiers `...Pptx.ts`.
- **Anti-dérive** : Ne modifier que la slide du disclaimer.

---

#### PATCH 12 : VALIDATION FINALE & CLEANUP

- **Objectif** : Lancer tous les exports, vérifier la cohérence visuelle et nettoyer le code.
- **Fichiers** : Tous les fichiers modifiés.
- **Étapes** :
    1. Générer un export pour chaque simulateur.
    2. Comparer visuellement avec la SPEC V4 et les références Présentation1/2.
    3. Corriger les derniers écarts mineurs (alignements, couleurs, polices).
    4. Supprimer les anciens helpers ou variables devenus obsolètes.
    5. S'assurer que le `npm run build` passe sans aucune erreur.
- **DoD local** :
    - Les 3 exports sont conformes à la SPEC V4.
    - Le code est propre et documenté.
    - Le build est 100% OK.
- **Commandes** : `npm run dev`, `npm run build`
- **Context Budget** : Aucun, ce patch est une revue manuelle.
- **Anti-dérive** : Ne faire que des corrections mineures. Pas de nouvelles fonctionnalités.
