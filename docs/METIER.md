# METIER (ce que SER1 calcule vraiment)

## But
Expliquer ce que SER1 couvre aujourd'hui, ce qui est deja exploitable, et les limites connues.

## Audience
- Owner / PM
- Dev ou agent qui doit comprendre le perimetre fonctionnel sans lire tout le code
- Toute personne qui doit distinguer "deja calcule" de "encore a specifier"

## Ce que ce doc couvre / ne couvre pas
- Couvre : les simulateurs et regles metier deja presentes dans le repo
- Ne couvre pas : l'architecture technique detaillee, les regles UI, les procedures de debug
- Ne remplace pas une validation juridique, fiscale ou notariale

## Vue d'ensemble

### Simulateurs disponibles
| Surface | Statut | Role metier principal |
|---|---|---|
| `/sim/ir` | disponible | Estimer IR, TMI, CEHR et effets des revenus/charges du foyer |
| `/sim/placement` | disponible | Comparer 2 enveloppes / produits sur epargne, liquidation et transmission |
| `/sim/credit` | disponible | Simuler echeanciers, assurance et lissage de 1 a 3 prets |
| `/sim/succession` | disponible | Estimer droits de succession et fournir des analyses civiles/patrimoniales guidees |
| `/sim/per` | disponible | Simuler un PER individuel deductible en phase d'epargne et de sortie |
| `/sim/epargne-salariale` | upcoming | non documente metier ici tant que non stabilise |
| `/sim/tresorerie-societe` | upcoming | non documente metier ici tant que non stabilise |
| `/sim/prevoyance` | upcoming | non documente metier ici tant que non stabilise |

### Regle de lecture
- Ce doc decrit uniquement le perimetre implemente.
- Si un sujet est encore en page "upcoming", il n'est pas traite comme une feature metier stable.
- Les taux, baremes et abattements modifiables vivent dans les settings et sont consommes par les simulateurs via le dossier fiscal unifie.

## 1) IR

### Ce que SER1 calcule
Le simulateur IR estime l'impot du foyer a partir de la situation familiale, du nombre de parts, de la residence, des revenus imposables et des charges/credits saisis.

### Entrees principales
- statut du foyer
- isolement, enfants et personnes a charge
- revenus par declarant : salaires, article 62, pensions, BIC, fonciers, autres
- revenus du capital
- deductions et credits
- choix PFU ou bareme pour le capital quand applicable
- annee de bareme courante ou precedente

### Sorties principales
- impot estime
- TMI
- CEHR si applicable
- detail de calcul et ventilation des revenus

### Ce qui est couvert
- quotient familial
- abattement de 10 % salaires / pensions selon settings
- PFU et option bareme sur certains revenus du capital
- revenus fonciers et autres revenus imposables simples
- prise en compte des charges deductibles et credits saisis
- lecture stricte des baremes et parametres fiscaux via le dossier fiscal

### Limites connues
- ce n'est pas un moteur declaratif exhaustif case par case
- les cas complexes de fiscalite personnelle ne sont pas tous modelises
- le simulateur donne une estimation exploitable en rendez-vous, pas une liasse fiscale complete

## 2) Prelevements sociaux

### Role dans SER1
Il n'existe pas aujourd'hui de simulateur "prelevements sociaux" autonome. Les prelevements sociaux servent de donnees metier transverses pour IR, placement et certaines analyses de transmission.

### Ce qui est couvert
- taux de prelevements sociaux du patrimoine
- seuils et baremes retraite stockes dans les settings dedies
- historique PASS disponible dans les settings
- consommation des taux PS dans les moteurs qui en ont besoin

### Ou cela se pilote
- `settings/impots` pour les baremes fiscaux et DMTG
- `settings/prelevements` pour les PS patrimoine, retraites et seuils

### Limites connues
- pas de parcours utilisateur autonome pour "simuler uniquement les PS"
- la couverture depend du simulateur consommateur : IR, placement et transmission n'utilisent pas exactement les memes sous-ensembles de regles

## 3) DMTG / succession

### Ce que SER1 calcule
Le coeur moteur calcule des droits de succession a partir d'un actif net et d'heritiers avec leur lien de parente. La page `/sim/succession` expose surtout un parcours guide organise en 3 blocs de saisie (`Contexte familial`, `Actifs / Passifs`, `Donations`) complete par un modal `+ Dispositions` pour le testament, les ascendants et les clauses civiles (donation entre epoux, preciput, attribution communautaire simplifiee).

### Entrees principales
- situation matrimoniale et contexte familial
- enfants / autres membres de la famille
- masses patrimoniales agregees (defunt, conjoint/partenaire, masse commune ou indivise selon le cas)
- donations / legs agrégés en mode simplifié ou détaillés en mode expert
- dispositions civiles et testamentaires via le modal dedie
- parametres DMTG issus du dossier fiscal

### Sorties principales
- analyses de predeces et de chainage
- lecture civile simplifiee de la devolution
- lecture patrimoniale simplifiee (masse civile, quotite disponible, liberalites a controler)
- points d'attention et warnings de simplification

### Ce qui est couvert
- baremes et abattements DMTG par grandes categories de liens
- exoneration conjoint
- prise en compte du regime matrimonial dans certaines analyses guidees
- scenarios de predeces et ordre des deces
- materiel de guidage sur liberalites, avantages matrimoniaux et situations familiales dans les settings succession

### Limites connues
- ce n'est pas une liquidation notariale exhaustive
- toutes les subtilites civiles, donations anterieures et clauses complexes ne sont pas integralement calculees en moteur
- l'UI succession privilegie actuellement les analyses civiles/patrimoniales guidees; le calcul DMTG detaille par heredier n'est pas expose comme parcours principal de saisie
- une partie de la valeur actuelle de la page succession est analytique et pedagogique, pas uniquement calculatoire

## 4) Placement

### Ce que SER1 calcule
Le simulateur placement compare 2 produits / enveloppes sur 3 temps :
- phase d'epargne
- phase de liquidation
- phase de transmission

### Enveloppes actuellement prises en charge
- assurance-vie
- PER
- PEA
- CTO
- SCPI

### Entrees principales
- profil client (age, TMI, etc.)
- 2 produits a comparer
- versement initial, versements annuels et ponctuels
- hypotheses de rendement, distribution, frais et liquidation
- hypotheses de transmission (age au deces, beneficiaires, etc.)
- dossier fiscal unifie

### Sorties principales
- capital acquis
- effort d'epargne reel
- economie d'IR quand applicable
- revenus nets en phase de liquidation
- fiscalite totale
- capital transmis net
- comparaison produit 1 / produit 2

### Ce qui est couvert
- capitalisation et distribution selon enveloppe
- fiscalite differenciee selon enveloppe
- transmission avec regimes AV / PER / DMTG simplifie selon cas
- comparaison de deux scenarios homogenes dans une meme interface

### Limites connues
- le simulateur est un comparateur de scenarios, pas un back-office produit exhaustif
- le catalogue complet "Base-Contrat" n'est pas encore integre comme moteur universel de tous les produits
- certaines hypotheses restent simplifiees par rapport a la realite commerciale ou fiscale

## 5) PER

### Ce que SER1 calcule
Le simulateur PER traite aujourd'hui un PER individuel deductible simple.

### Entrees principales
- versement annuel
- duree d'epargne
- TMI
- rendement brut
- frais de gestion
- age de souscription

### Sorties principales
- total des versements
- capital a terme
- economie d'impot annuelle et totale
- sortie en capital estimee
- sortie en rente estimee
- projection annee par annee

### Ce qui est couvert
- versements volontaires deductibles
- economie d'IR selon TMI
- capitalisation avec frais
- estimation de rente via taux de conversion simplifie
- comparaison capital / rente a la sortie

### Limites connues
- pas de transferts PERP / Madelin / Article 83 / PERCO
- pas de cas de deblocage anticipe
- pas de modelisation avancee des plafonds reportables
- fiscalite de sortie volontairement simplifiee pour rester lisible

## 6) Credit

### Ce que SER1 calcule
Le simulateur credit calcule des echeanciers de prets et des agregats de cout / assurance pour 1 a 3 prets.

### Entrees principales
- capital
- duree
- taux
- taux assurance
- quotite
- type de pret : amortissable ou in fine
- mode assurance : capital initial ou CRD
- options de lissage et dates de depart

### Sorties principales
- mensualites
- interets
- assurance
- amortissement
- CRD
- echeancier global
- capital deces associe aux prets assures

### Ce qui est couvert
- jusqu'a 3 prets dans la meme simulation
- lissage du pret principal selon les autres prets
- agregations globales pour l'echeancier
- calcul centralise du capital deces pour coherence UI / exports
- exports PPTX / Excel

### Limites connues
- pas de scoring bancaire ni d'accord de financement
- pas de TAEG reglementaire complet
- pas de modelisation juridique detaillee des contrats d'assurance emprunteur

## Ce qui ne doit pas etre sur-vendu aujourd'hui
- Les pages "upcoming" ne sont pas des simulateurs metier finalises.
- SER1 ne remplace ni un logiciel de declaration fiscale, ni un logiciel notarial, ni un moteur bancaire de souscription.
- La valeur actuelle du produit est : comparer, expliquer, illustrer et fiabiliser des scenarios de conseil patrimonial.

## Repartition des sources de verite
| Sujet | Doc de reference |
|---|---|
| Ce que le produit calcule et ses limites | `docs/METIER.md` |
| Structure des routes, features et pages | `docs/ARCHITECTURE.md` |
| Contrat UI, baseline `/sim/*`, theming | `docs/GOUVERNANCE.md` |
| Exploitation, Supabase, debug, procedures | `docs/RUNBOOK.md` |
| Priorites et reste a faire | `docs/ROADMAP.md` |
