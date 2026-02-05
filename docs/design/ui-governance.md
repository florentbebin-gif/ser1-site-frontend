# Gouvernance UI & Design System "Gestion Privée"

> **Philosophie** : L'interface doit refléter les codes du Luxe et de la Gestion Privée : Épurée, Rassurante, Lisible et Raffinée. Nous privilégions l'espace (breathability), la clarté typographique et des interactions douces.

---

## 1. Principes Fondamentaux

### A. Hiérarchie des Profondeurs (Z-Index Visuel)
L'interface se construit par superposition de plans pour créer de la profondeur sans alourdir.

1.  **Fond de Page (Niveau 0)** : `var(--color-c7)` (#F5F3F0 - Greige/Surface).
    *   *Usage* : Arrière-plan global de l'application. Évite l'effet "éblouissant" du tout-blanc.
2.  **Cartes de Contenu (Niveau 1)** : `#FFFFFF` (Blanc Pur).
    *   *Usage* : Zones de contenu principales (Graphiques, Tableaux, Synthèses).
    *   *Style* : Bordure fine `var(--color-c8)`, Ombre portée subtile (`shadow-sm` ou `shadow-md`).
    *   *Radius* : `12px` (Standard).
3.  **Zones Interactives Secondaires (Niveau 1 bis)** : `var(--color-c7)` + Accent.
    *   *Usage* : Formulaires de signalement, zones de configuration techniques.
    *   *Style* : Fond `var(--color-c7)`, Bordure `var(--color-c8)`.
    *   *Distinction* : Accentuation latérale gauche (ex: `border-left: 4px solid var(--color-c2)`).

### B. Typographie & Lisibilité
*   **Titres** : Utiliser "Sentence case" (Majuscule en début de phrase uniquement). Bannir le TOUT MAJUSCULE agressif pour les titres principaux.
    *   *Graisse* : `600` (Semi-bold) ou `500` (Medium). L'élégance vient de la finesse.
    *   *Couleur* : `var(--color-c10)` (Noir) ou `var(--color-c1)` (Brand Dark).
*   **Sous-titres & Labels** : `var(--color-c9)` (Gris moyen).
*   **Alignements** : Privilégier l'alignement à gauche pour le texte. Le bandeau utilisateur ("Meta info") doit être aligné à **droite**.

---

## 2. Composants Standards

### A. Champs de Saisie (Inputs) — RÈGLE CRITIQUE ⚠️
Pour garantir une affordance maximale (l'utilisateur doit savoir où cliquer), les champs de saisie doivent se détacher visuellement du fond.

*   **Fond** : **TOUJOURS BLANC (`#FFFFFF`)**. Même sur fond `C7`.
*   **Bordure** : `1px solid var(--color-c8)`.
*   **Focus** : Bordure `var(--color-c2)` + Ombre portée légère `var(--color-c4)`.
*   **Radius** : `6px` ou `8px`.
*   **Typographie** : `var(--color-c10)`.

```css
/* Standard Input Style */
input, select, textarea {
  background-color: #FFFFFF; /* OBLIGATOIRE */
  border: 1px solid var(--color-c8);
  color: var(--color-c10);
  border-radius: 6px;
  padding: 8px 12px;
}
input:focus {
  outline: none;
  border-color: var(--color-c2);
  box-shadow: 0 0 0 3px var(--color-c4); /* Ring d'accessibilité */
}
```

### B. Boutons
*   **Primaire** : Fond `var(--color-c2)`, Texte Blanc.
    *   *Hover* : Assombrissement léger ou changement d'opacité.
*   **Secondaire** : Fond Transparent/Blanc, Bordure `var(--color-c8)`, Texte `var(--color-c10)`.
*   **Forme** : "Pill" (Radius complet) ou Arrondi léger (`6px`). Éviter les boutons rectangulaires durs.

### C. Badges & Tags
Pour un rendu "Premium", éviter les aplats de couleurs lourds.
*   **Style** : "Outline" (Contour).
*   **Fond** : Transparent ou très légèrement teinté (ex: `rgba(var(--color-c2-rgb), 0.1)`).
*   **Bordure** : Fine (`1px solid var(--color-c8)`).
*   **Forme** : "Pill" (`border-radius: 999px`).

### D. Tableaux (Data Grids)
*   **Header** : Fond transparent ou `var(--color-c7)`. Texte `var(--color-c9)` (Muted) ou `var(--color-c1)` (Brand).
*   **Lignes** : Bordure basse `1px solid var(--color-c8)`.
*   **Zebra** : Alternance Blanc / `var(--color-c7)` pour la lisibilité des grands sets de données.
*   **Cellules** : Padding confortable (`12px 16px`). Pas de densification excessive.

---

## 3. Structure des Pages (Templates)

### A. Page "Dashboard / Settings" (Standard)
1.  **Header Page** : Titre H1 (`24px+`) à gauche. Actions globales à droite.
2.  **Bandeau Utilisateur** : Aligné à droite, style "Pill" discret.
3.  **Contenu** :
    *   Cartes Blanches (`#FFFFFF`) pour les données.
    *   Séparateurs : Utiliser des dégradés fins (`linear-gradient`) plutôt que des lignes solides grises.

### B. Page "Simulateur" (Complexe)
Pour les outils de calcul (IR, Crédit, Placement) :
1.  **Layout** : Split view ou Stacked.
    *   *Desktop* : Panneau Saisie à Gauche (2/3) / Synthèse à Droite (1/3).
    *   *Mobile* : Stacked (Saisie puis Synthèse).
2.  **Panneaux** :
    *   Saisie : `var(--color-c7)` ou Blanc selon densité.
    *   Synthèse (Résultat) : Toujours **Blanc (`#FFFFFF`)** pour attirer l'œil, avec une ombre plus marquée (`shadow-md`).
3.  **Actions** : Boutons "Calculer" ou "Simuler" bien visibles (Primaire).

### C. Modales
*   **Overlay** : `rgba(0, 0, 0, 0.5)` (Seul alpha autorisé).
*   **Panel** : Blanc (`#FFFFFF`), centré, `shadow-lg`.
*   **Header** : Titre simple, bouton fermer discret (croix).

---

## 4. Checklist Qualité (Avant commit)
- [ ] La page respire-t-elle ? (Pas de contenu tassé).
- [ ] Les inputs sont-ils bien sur fond BLANC ?
- [ ] Le bandeau utilisateur est-il à droite ?
- [ ] Les titres sont-ils en "Sentence case" (pas de ALL CAPS sauf labels) ?
- [ ] L'usage des couleurs respecte-t-il `var(--color-c1)` à `var(--color-c10)` ?

---

## 5. Migration & Refactoring (Legacy)

### Points d'attention sur les pages existantes (`Credit`, `Ir`, `Placement`)
Ces pages utilisent d'anciens styles (`.ir-table`, inputs grisés ou transparents) qui doivent être harmonisés.

1.  **Inputs Tableaux** :
    *   *Actuel* : Souvent fond transparent ou `var(--color-c7)`.
    *   *Cible* : Passer en **Blanc (`#FFFFFF`)** avec bordure standard.
2.  **Boutons d'Export** :
    *   Standardiser l'usage du composant `ExportMenu` (déjà en place, vérifier le style).
3.  **Cartes de Saisie** :
    *   Remplacer les styles ad-hoc (`.ir-left`, `.ir-panel`) par les classes utilitaires premium ou des composants conteneurs standards.
