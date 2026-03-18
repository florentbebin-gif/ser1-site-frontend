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

Le bouton `+ Dispositions` reste bloque tant qu'un contexte familial minimum n'est pas saisi, puis le modal adapte ses sections a la situation retenue.

### Entrees principales
- situation matrimoniale et contexte familial
- horizon de deces simule (`Aujourd'hui`, puis paliers de 5 a 50 ans) pour reevaluer les lectures dependantes de la date
- forfait mobilier optionnel et abattement de 20 % sur la residence principale, saisis dans le bloc patrimonial expert
- enfants / autres membres de la famille, avec distinction visuelle possible des enfants décédés
- actifs et passifs saisis distinctement en mode simplifie ; actifs / passifs detailles en mode expert
- groupements fonciers (`GFA`, `GFV`, `GFF`, `GF`) saisis en expert, avec reinjection de leur base taxable dans la masse successorale
- contrats d'assurance-vie saisis a part dans le bloc patrimonial, integres a la masse transmise affichee
- contrats `PER assurance` saisis a part dans le bloc patrimonial, avec lecture fiscale avant / apres 70 ans selon la date deces simulee
- contrats de prevoyance deces saisis a part dans le bloc patrimonial, avec capital transmis affiche et assiette taxable limitee a la `dernierePrime`
- donations / legs agrégés en mode simplifié ou détaillés en mode expert
- dispositions civiles et testamentaires via le modal dedie
- testament saisi par personne : une carte en situation solo, deux cartes en situation de couple, avec beneficiaires choisis dans le contexte familial declare
- legs particuliers saisis dans le testament sous forme de lignes `beneficiaire + montant + libelle optionnel`
- parametres DMTG issus du dossier fiscal

### Sorties principales
- analyses de predeces et de chainage
- succession directe affichee quand la chronologie 2 deces n'est pas la bonne source de verite pour la situation saisie
- lecture civile simplifiee de la devolution
- lecture patrimoniale simplifiee (masse civile, quotite disponible, liberalites a controler)
- synthese patrimoniale guidee sur les contrats d'assurance-vie saisis a part, avec ventilation fiscale simplifiee par beneficiaire
- synthese patrimoniale guidee sur la prevoyance deces, avec ventilation par beneficiaire et droits calcules sur la seule `dernierePrime`
- points d'attention et warnings de simplification

### Ce qui est couvert
- baremes et abattements DMTG par grandes categories de liens
- exoneration conjoint
- prise en compte du regime matrimonial dans certaines analyses guidees
- scenarios de predeces et ordre des deces
- integration des groupements fonciers dans la base taxable successorale avec regime distinct `GFA/GFV` vs `GFF/GF`
- routage explicite entre chronologie 2 deces (mariage) et succession directe affichee (celibataire, veuf, divorce, concubinage et PACS selon le cas)
- gating du modal `+ Dispositions` tant qu'aucun contexte familial exploitable n'est saisi
- modal `Dispositions particulieres` adapte a la situation familiale ou au regime, avec options impossibles masquees plutot que laissees actives
- saisie testamentaire par cote (`epoux1` / `epoux2`) dans le draft succession, avec beneficiaires resolus depuis le contexte familial
- chronologie 2 deces mariee branchee au testament du cote du defunt a chaque etape; le bouton d'ordre inverse change aussi le testament retenu
- restitution de la transmission sur une ligne par personne reelle quand les beneficiaires sont identifies, avec filtrage des descendants selon la branche du defunt simule
- saisie detaillee des actifs/passifs pour reconstituer des masses nettes par poche patrimoniale
- calcul du forfait mobilier uniquement s'il est explicitement ajoute, avec ventilation proportionnelle par porteur
- separation de la transmission successorale et des assurances hors succession dans la synthese de droite, avec restitution des capitaux par beneficiaire
- residence principale unique cote produit, avec option d'abattement 20 % visible sur la ligne immobiliere correspondante
- ventilation simplifiee de l'assurance-vie deces selon les clauses beneficiaires saisies (lecture 990 I / 757 B), avec mutualisation des abattements entre contrats d'un meme assure et d'un meme beneficiaire
- ventilation simplifiee du `PER assurance` deces selon les clauses beneficiaires saisies, avec bascule avant / apres 70 ans a la date deces simulee et coordination des abattements avec l'assurance-vie / la prevoyance
- ventilation simplifiee de la prevoyance deces selon une clause beneficiaire structuree, avec droits assis sur la seule `dernierePrime`, bascule avant / apres 70 ans a la date deces simulee et coordination des abattements avec l'assurance-vie / le `PER assurance`
- representation successorale simplifiee des enfants decedes par leurs petits-enfants quand ils sont identifies
- dates de naissance des personnes du couple / du defunt dans le contexte familial pour valoriser l'usufruit et la nue-propriete a la date du deces simule
- materiel de guidage sur liberalites, avantages matrimoniaux et situations familiales dans les settings succession
- devolution civile des ascendants (art. 757-1 / 757-2 CC pour les maries sans descendants) et des collateraux privilegies (art. 736-738-1 CC pour les celibataires/veufs/pacsés sans descendants)
- ventilation assurance-vie sur contrats demembres avec calcul art. 669 CGI (usufruitier/nu-proprietaire) selon age de l'usufruitier
- PACS: absence de vocation successorale legale automatique du partenaire sans testament; avec testament, le partenaire peut etre integre a la synthese directe avec exoneration DMTG
- union libre: les biens en indivision peuvent etre saisis; seule la quote-part du defunt est retenue dans la succession directe, avec hypothese 50/50 par defaut dans ce module
- exports PPTX/XLSX de la chronologie avec restitution des beneficiaires reels par etape quand ils sont identifies

### Limites connues
- ce n'est pas une liquidation notariale exhaustive
- toutes les subtilites civiles, donations anterieures et clauses complexes ne sont pas integralement calculees en moteur
- la ventilation assurance-vie reste simplifiee et depend des clauses beneficiaires saisies; les contrats demembres avec clause non standard ou sans age de l'usufruitier font l'objet d'un repli simplifie avec warning
- la ventilation `PER assurance` reste simplifiee; la bascule avant / apres 70 ans repose sur l'age de l'assure a la date deces simulee, pas sur un historique detaille des versements
- l'abattement de 20 % sur la residence principale reste une attestation utilisateur; l'outil ne modele pas toutes les conditions d'occupation juridiques
- la contrainte `une seule residence principale` est une simplification produit volontaire dans cette UI
- la valorisation usufruit / nue-propriete du conjoint survivant suit l'art. 669 CGI quand la date de naissance pertinente est renseignee; sinon le module reste en repli simplifie avec warning
- la representation successorale des enfants decedes reste simplifiee et ne remplace pas une analyse notariale detaillee
- la chronologie 2 deces n'est plus la source d'affichage principale hors mariage; pour PACS et autres situations, la synthese privilegie une lecture directe du deces simule
- la chronologie 2 deces reste sur un meme horizon deces simule pour les 2 etapes et ne modele pas un decalage calendaire distinct entre premier et second deces
- l'UI succession privilegie actuellement les analyses civiles/patrimoniales guidees; le calcul DMTG detaille par heredier n'est pas expose comme parcours principal de saisie
- une partie de la valeur actuelle de la page succession est analytique et pedagogique, pas uniquement calculatoire
- la chronologie 2 deces reste un module simplifie: elle reemploie le testament du cote du decede et le report economique vers le 2e deces, mais ne remplace pas une liquidation notariale exhaustive

### Matrice juridique de validation succession
La validation de `/sim/succession` repose sur une matrice de cas cibles, reliee a la fois aux sources juridiques et aux tests de non-regression du module.

| Situation | Attendu produit | Source juridique principale | Couverture repo |
| --- | --- | --- | --- |
| Celibataire + enfants | succession directe, droits DMTG ligne directe, affichage une ligne par enfant | Service-Public F1270 / F35794 | `successionDisplay.test.ts`, `successionValidationMatrix.test.ts` |
| Veuf + enfants | succession directe, pas de chaînage 2 deces, droits ligne directe sur les enfants | Service-Public F1270 / F35794 | `successionValidationMatrix.test.ts` |
| Divorce + enfants | succession directe du defunt simule, ex-conjoint hors droits successoraux legaux | Service-Public F1270 / F35794 | `successionValidationMatrix.test.ts` |
| Marie + enfants communs | chronologie 2 deces, conjoint + descendants selon la lecture civile retenue ; sans DDV, choix legal possible entre usufruit total et 1/4 PP ; sans choix explicite, le module peut rester sur une hypothese moteur affichee comme telle | Service-Public F1270 / Code civil art. 757 et 758-3 | `successionChainage.test.ts`, `successionDevolution.test.ts` |
| Marie + enfant non commun | l'enfant propre n'apparait que sur la branche du parent defunt, avec libelle stable dans la synthese meme en famille recomposee | Code civil art. 757 / 757-1 | `successionChainage.test.ts`, `successionValidationMatrix.test.ts` |
| Marie + testament (conjoint / enfant) | la chronologie 2 deces retient le testament du cote decede a chaque etape ; l'ordre inverse change le testament retenu et les beneficiaires exportes | Code civil art. 757 / 913 et s. | `successionChainage.test.ts`, `successionExport.test.ts`, `successionValidationMatrix.test.ts` |
| PACS sans testament | pas de vocation successorale legale automatique du partenaire, lecture directe du deces simule | Service-Public F1621 | `successionDevolution.test.ts`, `successionValidationMatrix.test.ts` |
| PACS avec testament | le partenaire peut apparaitre dans la synthese directe, avec exoneration DMTG | Service-Public F1621 / F35794 | `successionDisplay.test.ts`, `successionValidationMatrix.test.ts` |
| Union libre + indivision | seule la quote-part du defunt sur l'indivision est retenue, hypothese 50/50 par defaut | Service-Public F904 | `successionDisplay.test.ts`, `successionValidationMatrix.test.ts` |
| Enfant decede represente par petits-enfants | representation successorale simplifiee par branche | Code civil art. 751 et s. | `successionDevolution.test.ts`, `successionChainage.test.ts` |
| Usufruit / nue-propriete du conjoint | valorisation selon art. 669 CGI si la date de naissance est renseignee | CGI art. 669 | `successionUsufruit.test.ts`, `successionDevolution.test.ts`, `successionChainage.test.ts` |

En pratique, chaque PR corrective du module succession doit ajouter ou mettre a jour au moins un test rattache a cette matrice. La PR finale de consolidation verifie que les cas ci-dessus restent coherents entre affichage, moteur et exports.

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
