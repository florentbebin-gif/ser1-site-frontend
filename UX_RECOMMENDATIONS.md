# Recommandations UX - Page Placement SER1

## 📋 1. Règles UX globales pour les champs éditables

### Distinction claire entre zones éditables et non-éditables

| Élément | Apparence | Justification |
|---------|-----------|---------------|
| **DOIT RESTER BLANC** | | |
| Champs texte | `background: #fff` | Standard d'interface, signale l'édition |
| Champs nombre | `background: #fff` | Cohérence avec les champs texte |
| Select/dropdown | `background: #fff` | Signale une interaction possible |
| Textarea | `background: #fff` | Cohérence avec les autres inputs |
| **PEUT ÊTRE LÉGÈREMENT TEINTÉ** | | |
| Labels | `color: var(--color-c9)` | Hiérarchie visuelle, moins important que la valeur |
| Conteneurs/Cards | `background: var(--color-c7)` | Regroupement visuel, pas d'édition directe |
| Tableaux (header) | `background: var(--color-c6)` | Distinction des en-têtes, pas éditable |
| Tableaux (rows) | `background: var(--color-c7)` | Zébrage subtil pour lisibilité |
| Boutons secondaires | `background: var(--color-c7)` | Actions secondaires, moins d'emphase |
| **CAS PARTICULIERS** | | |
| Checkbox/Radio | Accent color thématique, fond blanc | Visibilité de l'état tout en restant sobre |
| Toggle | Accent color thématique | Visibilité de l'état actif/inactif |
| Disabled inputs | `background: var(--color-c8)` | Signale clairement l'impossibilité d'édition |

### Exemples concrets

```css
/* ✅ CORRECT - Input éditable */
.pl-input__field {
  background: #fff;
  border: 1px solid var(--color-c8);
  color: var(--color-c10);
}

/* ✅ CORRECT - Select éditable */
.pl-select {
  background: #fff;
  border: 1px solid var(--color-c8);
  color: var(--color-c10);
}

/* ✅ CORRECT - Checkbox */
.pl-toggle input {
  accent-color: var(--color-c2);
}

/* ❌ INCORRECT - Input avec fond coloré */
.pl-input__field {
  background: var(--color-c7);
}
```

---

## 📊 2. Phase ÉPARGNE - Améliorations

### Centrage des libellés et éléments

| Problème | Solution | Priorité |
|----------|----------|----------|
| Libellés "Exp produit 1" mal alignés | Utiliser CSS Grid avec `text-align: center` pour les libellés | MUST-HAVE |
| Checkbox options fiscales désalignées | Wrapper dans un conteneur flex avec `justify-content: center` | MUST-HAVE |

```css
/* Recommandation pour les libellés */
.pl-product-header {
  display: grid;
  text-align: center;
  margin-bottom: 8px;
}

/* Recommandation pour les checkbox */
.pl-options-container {
  display: flex;
  justify-content: center;
  gap: 16px;
}
```

### Modal - Palette plus lisible

| Élément | Actuel | Recommandé | Justification |
|---------|--------|------------|---------------|
| Header | Dégradé vert foncé | Dégradé plus clair `var(--color-c3)` à `var(--color-c2)` | Meilleure lisibilité du texte |
| Texte header | Blanc sur fond foncé | Blanc sur fond plus clair | Meilleur contraste |
| Fond modal | Dégradé gris | Blanc uniforme `#fff` | Clarté pour les nombreux champs |
| Séparateurs | Gris foncé | `var(--color-c8)` (gris clair) | Subtilité, ne pas surcharger |

### Tableau "Détail" - Affichage intelligent

| Fonctionnalité | Description | Priorité |
|----------------|-------------|----------|
| Colonnes dynamiques | N'afficher que les colonnes avec valeurs >0 | MUST-HAVE |
| Toggle "Afficher tout" | Bouton discret pour afficher toutes les colonnes | MUST-HAVE |
| Tooltips contextuels | Sur les en-têtes de colonnes pour expliquer les calculs | NICE-TO-HAVE |
| Export configurable | Permettre de choisir les colonnes à exporter | NICE-TO-HAVE |

---

## 💰 3. Phase LIQUIDATION - Corrections

### Option au barème IR - Ambiguïté des checkboxes

| Problème | Solution | Priorité |
|----------|----------|----------|
| Une seule checkbox pour deux produits | Créer deux checkboxes distinctes, une par produit | MUST-HAVE |
| Ambiguïté sur ce qui est sélectionné | Libellé explicite par checkbox | MUST-HAVE |

#### Recommandation concrète

```html
<!-- AVANT (problématique) -->
<div class="pl-option">
  <input type="checkbox" id="opt-ir">
  <label for="opt-ir">Option au barème IR</label>
</div>

<!-- APRÈS (recommandé) -->
<div class="pl-options-group">
  <div class="pl-option">
    <input type="checkbox" id="opt-ir-prod1">
    <label for="opt-ir-prod1">Option barème IR - Produit 1</label>
  </div>
  <div class="pl-option">
    <input type="checkbox" id="opt-ir-prod2">
    <label for="opt-ir-prod2">Option barème IR - Produit 2</label>
  </div>
</div>
```

### Alignement du texte "PFU (Flat Tax 30%)"

| Problème | Solution | Priorité |
|----------|----------|----------|
| Texte mal aligné avec les autres options | Utiliser une grille CSS cohérente pour tous les éléments | MUST-HAVE |

```css
/* Recommandation */
.pl-tax-options {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 8px 12px;
}
```

---

## 👪 4. Phase TRANSMISSION - Alignement

### Problème d'alignement "Minimum : 45 ans (âge actuel)"

| Problème | Solution | Priorité |
|----------|----------|----------|
| Texte d'aide mal aligné sous le champ | Créer une structure cohérente avec grid ou flexbox | MUST-HAVE |

```css
/* Recommandation */
.pl-field-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pl-field-help {
  font-size: 12px;
  color: var(--color-c9);
  margin-left: 2px;
}
```

---

## 📈 5. SYNTHÈSE - Repenser l'approche

### Suppression de l'étape "Synthèse" comme page distincte

| Élément | Recommandation | Priorité |
|---------|----------------|----------|
| Navigation | Réduire à 3 onglets : Épargne, Liquidation, Transmission | MUST-HAVE |
| Carte latérale | Ajouter une carte fixe à droite sur toutes les phases | MUST-HAVE |

### Carte de synthèse latérale

| Contenu | Description | Priorité |
|---------|-------------|----------|
| KPIs clés | Capital final, Revenus cumulés, Fiscalité totale | MUST-HAVE |
| Graphique simplifié | Évolution du capital (mini-graphique) | MUST-HAVE |
| Indicateurs de performance | TRI, Rendement moyen | NICE-TO-HAVE |
| Actions rapides | Boutons d'export, partage | NICE-TO-HAVE |

### Éléments à supprimer/déplacer

| Élément | Action | Justification |
|---------|--------|---------------|
| Carte "Paramètres globaux" | Déplacer vers un modal accessible depuis le header | Information secondaire |
| Graphiques redondants | Conserver uniquement le plus pertinent | Réduire la surcharge cognitive |
| Tableaux détaillés | Déplacer vers un onglet "Détails" dans la carte de synthèse | Information à la demande |

---

## 🚀 Récapitulatif des priorités

### MUST-HAVE
1. Maintenir les champs éditables avec fond blanc
2. Corriger l'alignement des libellés et checkboxes en phase Épargne
3. Implémenter l'affichage intelligent des colonnes dans les tableaux
4. Séparer les checkboxes d'option IR par produit
5. Corriger les problèmes d'alignement en Transmission
6. Transformer la Synthèse en carte latérale persistante

### NICE-TO-HAVE
1. Ajouter des tooltips contextuels sur les en-têtes de colonnes
2. Permettre l'export configurable des tableaux
3. Ajouter des indicateurs de performance dans la carte de synthèse
4. Améliorer les transitions entre les phases

---

## 🎨 Conclusion

Ces recommandations visent à améliorer significativement l'expérience utilisateur tout en respectant les contraintes imposées. L'accent est mis sur la clarté, la cohérence et l'efficacité pour un public expert. La distinction claire entre zones éditables (blanches) et non-éditables (teintées) permettra une meilleure compréhension immédiate de l'interface.

La transformation de la synthèse en élément persistant offrira une vision globale constante, réduisant les allers-retours entre les onglets et améliorant l'efficacité des CGP dans leur travail quotidien.
