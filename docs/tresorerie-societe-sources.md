# Trésorerie société — preuves Excel et PowerPoint

Cette annexe documente les sources utilisées pour cadrer la refonte de
`/sim/tresorerie-societe`. Elle sert de preuve produit et de garde-fou
avant extension du moteur.

## SER1 - LAPLACE 2025.xlsm

### Onglet `Treso IS`

Rôle : cadrage du client, horizon retraite, besoin de revenus et fiscalité
personnelle indicative.

- `H14` : année de naissance du client.
- `H16` : situation familiale.
- `H18` : revenus imposables du foyer N.
- `H20` : impôt sur le revenu N.
- `H24` : âge de la retraite.
- `P24` : âge de déclenchement des revenus.
- `H26` : pensions retraite.
- `P26` : besoin complémentaire de revenu net.
- `AE15` : IR avant décote.
- `AE18` : IR après réductions.
- `AI15` : TMI.

Décision SER1 : l’onglet cadre le besoin retraite et la lecture fiscale
personnelle. Il ne devient pas un moteur IR complet dans cette refonte.

### Onglet `Param treso`

Rôle : trésorerie IS disponible, distribution brute nécessaire, fiscalité
dividendes, option IS réduit et premières poches de placement.

- `Q16` : distribution brute nécessaire pour servir le besoin net.
- `H18` / `Q18` : fiscalité dividendes et CEHR.
- `H20` : option IS réduit.
- `H24` : trésorerie restant à investir.
- `H30` : rendement source de la poche distribution.
- `I34` : revenu brut de distribution (`H28 * H30`).
- `J34` : revenu net après IS.

Décision SER1 : conserver la distinction rendement source, revenu brut et
revenu net après IS ; ne pas confondre `I34:J34` avec des rendements.

### Onglet `Crédit (IR)`

Rôle : emprunt personnel remboursé via dividendes.

- `K13` : mensualité.
- `K19` : coût total du crédit.
- `O:Q` : agrégats annuels intérêts / remboursement capital.
- `Résultat tréso!AC21` : dividendes bruts nécessaires au crédit IR.

Décision SER1 : le crédit IR reste personnel ; le moteur société calcule
seulement les dividendes nécessaires pour servir le besoin net.

### Onglet `Résultat tréso`

Rôle : projection annuelle comptable, fiscale et de trésorerie.

- `H21` : revenus de la poche de distribution.
- `M21` : gain de capitalisation, déclenché uniquement à la sortie.
- `P21:T21` : résultat fiscal et base taxable.
- `V21` : IS.
- `AI21` : retraits CCA.
- `AJ21` : dividendes distribués.

Décision SER1 : conserver le format de projection annuelle en colonnes, la
capitalisation taxée à la sortie et la priorité de lecture CCA/dividendes.

### Onglet `Crédit (IS)`

Rôle : emprunt porté par la société, intérêts déductibles, remboursement
capital et capacité de financement.

Décision SER1 : le modèle v2 doit conserver le lien emprunt IS → actif financé
→ rendement → délai de jouissance.

## Graphique dans Microsoft PowerPoint.xlsx

### Onglet `Paramètres FCB`

Rôle : société, holding, charges de structure, CCA initial et annuel, emprunt,
filiales, poches distribution/capitalisation et répétition au terme.

Décision SER1 : reprendre le parcours fonctionnel, sans reprendre le terme
`FCB`.

### Onglet `Projection`

Rôle : projection horizontale années en colonnes.

- `C8` : apport CCA initial + apport annuel.
- `C32` : trésorerie réinvestissable au-dessus du seuil.

Décision SER1 : à chaque fin d’exercice, la trésorerie disponible après IS,
charges, dettes, CCA et dividendes peut être balayée au-dessus du seuil selon
la matrice. Le balayage ne produit pas de revenus sur l’exercice écoulé.

## L'approche épargne.pptx

Slide 1 contient notamment :

- `Votre Family CASH BOX`
- `Retraits annuels en C/CA`
- `Perception de dividendes`

Décision SER1 : reprendre la pédagogie du flux CCA / retraite / dividendes,
mais bannir `FCB` et `Family Cash Box` des écrans et exports client.
