# Mode simplifié / expert

## But

Fixer le contrat produit du mode simplifié / expert avant son déploiement dans les simulateurs.

Le mode simplifié sert le rendez-vous : moins de bruit, une lecture plus rapide, des hypothèses avancées repliées ou masquées.
Le mode expert sert l'analyse : accès aux paramètres fins, aux détails de calcul et aux sections de contrôle.

## Contrat général

- Le mode global vit dans `ui_settings.mode` et se pilote depuis la Home via `useUserMode`.
- Le mode global est persistant par utilisateur.
- Un simulateur peut proposer un override local, mais cet override reste non persistant.
- Le toggle local ne doit jamais écrire dans `ui_settings`.
- Le mode masque, replie ou réordonne l'interface ; il ne change jamais seul les hypothèses envoyées au moteur.
- Le mode simplifié ne pré-sélectionne pas un parcours métier à la place de l'utilisateur ; il réduit la densité visible après un choix explicite.
- Les exports et snapshots doivent rester cohérents avec les données réellement calculées, pas avec la densité d'affichage.
- Périmètre du toggle : il pilote l'UX des simulateurs `/sim/*`. Les flux `/audit`, `/strategy` et le scan documentaire IA (à partir de P4) suivent leur propre progression guidée et ne sont pas pilotés par ce toggle ; voir `docs/AI_ACT_CADRAGE.md` pour la déclinaison UI / UX du scan IA.

## Visible en simplifié

Le mode simplifié affiche uniquement ce qui permet une décision rendez-vous :

- hypothèses principales ;
- résultats et ordres de grandeur ;
- alertes ou blocages qui changent la recommandation ;
- commandes usuelles : sauvegarder, charger, exporter, réinitialiser.

Les champs avancés doivent rester disponibles via mode expert ou section explicitement ouverte si leur absence peut empêcher une saisie correcte.

## Visible en expert

Le mode expert affiche :

- hypothèses avancées ;
- paramètres de contrôle ;
- détails de calcul et tableaux complets ;
- sections d'audit ou d'explication utiles au CGP ;
- options d'export avancées si elles existent.

## Exceptions

Un simulateur peut rester `expertOnly` lorsqu'une décision produit dédiée est nécessaire avant de simplifier un parcours structurant.

Exception active :

- `/sim/tresorerie-societe` est `expertOnly` temporaire et volontaire dans cette PR. Le mode simplifié n'est pas livré ici, car le parcours société / associé / allocation pilote des hypothèses structurantes de détention, revenus, CCA et trésorerie. Le chantier roadmap `PR-P2-06 - Parcours simplifié trésorerie société` porte la définition et la livraison de cette exception.

Une exception doit être documentée dans `docs/ARCHITECTURE.md` ou dans la doc métier du simulateur concerné.

## Exemples

### `/sim/credit`

Simplifié :

- montant, durée, taux, assurance ;
- mensualité, coût total, synthèse amortissement ;
- affichage d'un seul prêt par défaut.

Expert :

- prêts multiples ;
- lissage ;
- décalages de calendrier ;
- tableaux d'amortissement détaillés.

### `/sim/ir`

Simplifié :

- foyer, revenus principaux, réductions ou charges majeures ;
- impôt estimé, TMI, revenu net fiscal lisible ;
- alertes de cohérence.

Expert :

- détail par catégorie de revenus ;
- quotient familial, décote, CEHR/CDHR ;
- métriques TMI détaillées ;
- contrôles de barème et contributions sociales.

### `/sim/succession`

Simplifié :

- situation familiale ;
- masses patrimoniales principales ;
- donations / legs agrégés ;
- droits estimés et alertes structurantes.

Expert :

- actifs et passifs détaillés par poche ;
- donations, assurance-vie, PER, prévoyance et legs détaillés ;
- dispositions matrimoniales avancées ;
- liquidation civile et fiscale contrôlable.

## Règle de revue

Toute PR qui branche `ExpertOnly`, `SimpleOnly` ou `DetailLevel` dans un simulateur doit prouver :

- que les entrées moteur ne changent pas par simple changement de mode ;
- que l'override local ne persiste pas ;
- que les exports restent cohérents ;
- que les champs masqués ont une valeur par défaut explicite ou restent accessibles en expert.
