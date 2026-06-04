# Cadrage AI Act SER1

> Date de cadrage : 2026-05-23
>
> Mise à jour : 2026-05-24
>
> Objectif : produire la base juridique de la trajectoire AI Act pour SER1, identifier les articles du règlement (UE) 2024/1689 applicables au profil SER1 et leurs échéances, et préparer l'engagement volontaire AI Act SER1 rattaché à `PR V2-14 — Scan documentaire`.
>
> Ce document est le livrable de la Phase 1 du plan défini dans `docs/ROADMAP.md` → `PR V2-14`.

---

## Position SER1

- Texte applicable : règlement (UE) 2024/1689 du 13 juin 2024 (« AI Act »).
- Périmètre géographique : **France uniquement**.
- Rôles AI Act retenus :
  - **SER1** : fournisseur du système d'IA applicatif SER1 qui orchestre OCR, prompts, extraction structurée, préremplissage, journalisation, UX et exports sous la marque SER1.
  - **Mistral** : fournisseur du modèle GPAI / service OCR sous-jacent ; son statut exact, les obligations GPAI et l'adhésion aux codes de pratique doivent être confirmés et archivés côté dossier conformité fournisseur.
  - **Cabinet CGP** : déployeur du système SER1 dans le cadre de sa mission client.
- Périmètre IA au sens AI Act :
  - **Inclus** : LLM Mistral utilisé pour le scan documentaire et les extractions post-OCR (`PR V2-14`).
  - **Inclus avec garde-fou** : complétion structurée de l'UX après OCR, production de JSON patrimonial sourcé, signalement des incertitudes et génération de questions de validation fermées ou semi-fermées.
  - **Exclu** : moteurs fiscaux déterministes (`src/engine/**`), heuristiques et recommandations algorithmiques hors LLM. Décision produit explicite, tracée dans `docs/ROADMAP.md` -> `PR V2-14`.
- **Classification de risque proposée** : **risque limité** (article 50). Pas haut risque (annexe III). Aucune pratique interdite (article 5).
- Cible : **engagement volontaire AI Act SER1, auto-déclaratif**, via l'article 95, en appliquant volontairement un sous-ensemble des exigences haut risque du chapitre III section 2. Ce n'est pas un label officiel ni une certification.

---

## Calendrier d'application

| Date       | Échéance                                                                                                                                                        | Impact SER1                                                                                                |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 2024-08-01 | Entrée en vigueur du règlement                                                                                                                                  | —                                                                                                          |
| 2025-02-02 | Art. 5 (pratiques interdites) + Art. 4 (AI literacy) applicables                                                                                                | Vérifier non-applicabilité de l'art. 5 ; mettre en place la maîtrise de l'IA interne et CGP                |
| 2025-08-02 | Chapitre V (modèles GPAI) + chapitre XII (sanctions) applicables                                                                                                | Côté Mistral : confirmer les obligations GPAI ; côté SER1 : tenir compte des sanctions art. 99 applicables |
| 2026-08-02 | Art. 50 (transparence) applicable                                                                                                                               | Mentions UI « assisté par IA », marquage des champs préremplis                                             |
| 2027-08-02 | Obligations pour produits soumis à réglementation sectorielle                                                                                                   | Hors périmètre SER1                                                                                        |
| 2027-12-02 | Obligations haut risque annexe III pour systèmes autonomes, selon l'accord politique provisoire Digital Omnibus du 2026-05-07, sous réserve d'adoption formelle | Non applicable à SER1 sauf changement de périmètre                                                         |

---

## Articles applicables — analyse SER1

### Article 4 — Maîtrise de l'IA (AI literacy)

- **Statut SER1** : applicable depuis 2025-02-02.
- **Contenu** : prendre les mesures appropriées pour assurer un niveau suffisant de maîtrise de l'IA chez le personnel SER1 et les utilisateurs CGP.
- **Format libre** : pas d'obligation de programme formel ni d'évaluation des connaissances ; les mesures doivent être proportionnées au contexte de déploiement.
- **Actions SER1** :
  - Documenter en interne le périmètre IA, les limites du modèle et le mode de validation CGP.
  - Fournir une capsule explicative dans l'app destinée au CGP utilisateur : description du système Mistral, ce qu'il fait, ce qu'il ne fait pas, comment valider les sorties.
  - Lien vers la page conformité depuis l'écran scan documentaire et l'onboarding cabinet.

### Article 5 — Pratiques interdites

- **Statut SER1** : **non applicable**.
- **Vérification poste par poste** : SER1 ne déploie aucune des huit pratiques interdites :
  1. Manipulation subliminale ou trompeuse causant un préjudice significatif.
  2. Exploitation des vulnérabilités (enfants, handicap, précarité socio-économique).
  3. Social scoring par ou pour des autorités publiques.
  4. Profilage criminel basé uniquement sur le profilage.
  5. Scraping non ciblé d'images faciales pour bases de reconnaissance.
  6. Reconnaissance d'émotions en milieu de travail ou éducatif.
  7. Catégorisation biométrique inférant race, religion, opinions, orientation.
  8. Identification biométrique à distance en temps réel par autorités publiques.
- **Action SER1** : déclaration explicite dans la page conformité ; revue annuelle des fonctionnalités IA pour confirmer la non-applicabilité.

### Article 50 — Obligations de transparence (risque limité)

- **Statut SER1** : applicable au **2026-08-02** → **livrable avant premier pilote payant**.
- **Contenu pour SER1 fournisseur du système applicatif** :
  - Art. 50 §1 : informer les personnes concernées qu'elles interagissent avec un système d'IA quand l'interaction directe n'est pas évidente.
  - Art. 50 §2 : analyser le marquage machine-readable des contenus synthétiques produits par le système ; si le système se limite à une fonction d'assistance ou ne modifie pas substantiellement les données d'entrée, documenter l'exemption applicable.
  - Art. 50 §3 : non applicable à SER1 tant que le produit n'utilise ni reconnaissance d'émotions ni catégorisation biométrique.
  - Art. 50 §4 : les exports PPTX / Excel remis au cabinet ou au client ne sont pas, en l'état, une publication au public sur une question d'intérêt public ; le badge IA reste une bonne pratique UX et une preuve de transparence volontaire.
- **Actions SER1** :
  - Mention « assisté par IA » au moment de l'upload de document client.
  - Marquage visuel des champs préremplis par IA dans l'analyse patrimoniale (icône + tooltip).
  - Badge « extrait par IA » ou « assisté par IA » sur les sections concernées des exports PPTX / Excel quand l'information provient du pipeline IA, au titre de l'engagement volontaire.
  - Détail complet dans le lot conformité de `PR V2-14`.

### Annexe III — Systèmes haut risque

- **Statut SER1** : **non applicable**.
- **Vérification poste par poste** :
  - Point 5(b) — évaluation de la solvabilité ou scoring crédit des personnes physiques : SER1 ne fait pas de scoring crédit.
  - Point 5(c) — tarification du risque en assurance vie / santé : SER1 ne tarifie pas de produit d'assurance.
  - Aucun des huit domaines (biométrie, infrastructures critiques, éducation et formation, emploi et RH, services essentiels, autorités répressives, migration et asile, administration de la justice) ne couvre le conseil patrimonial CGP.
- **Action SER1** : déclaration motivée dans le cadrage et la page conformité ; revue à chaque évolution majeure. La stratégie comparative `/strategy` reste autorisée si elle compare des scénarios calculés par SER1, à partir de données validées, et si le CGP conserve l'arbitrage final. Toute évolution vers scoring solvabilité, tarification assurance vie / santé, décision automatisée de souscription, chat libre de conseil ou recommandation financière générée par IA déclenche une revue haut risque avant développement.

### Article 95 — Codes de conduite volontaires (engagement SER1)

- **Statut SER1** : applicable comme mécanisme d'**engagement volontaire AI Act SER1, auto-déclaratif**.
- **Contenu** : la Commission et les États membres encouragent les codes de conduite volontaires permettant d'appliquer à des systèmes non haut risque tout ou partie des exigences du chapitre III section 2 (gestion du risque, gouvernance des données, journalisation, transparence, surveillance humaine, exactitude, robustesse, cybersécurité).
- **Actions SER1** :
  - Choisir le sous-ensemble d'exigences haut risque appliquées volontairement (a minima : art. 12 journalisation, art. 13 transparence, art. 14 surveillance humaine, art. 15 exactitude).
  - Documenter publiquement ces engagements sur la page conformité, sans employer de vocabulaire de certification officielle.
  - L'engagement reste auto-déclaratif : aucun organisme certificateur officiel n'est retenu à ce stade. Sa crédibilité repose sur les preuves documentaires (registre IA, journalisation, AIPD, surveillance qualité).
  - Mention « SME » : SER1 entre dans le périmètre PME du règlement, qui prévoit explicitement un accompagnement et des adaptations.

### Garde-fou produit — stratégie comparative `/strategy`

- **Position SER1** : l'IA sert à lire, structurer et préremplir le dossier patrimonial. Elle peut repérer les incohérences documentaires et générer des points de validation pour le CGP.
- **Limite non négociable** : pas de chat libre CGP ↔ LLM, pas de rédaction de l'étude par LLM, pas de recommandation client par LLM. Les scénarios comparatifs sont construits sur les moteurs SER1, les hypothèses validées et les données sourcées.
- **UX attendue** : situation actuelle vs scénario réorienté, avec écarts de valorisation, transmission, fiscalité, revenus, protection, liquidité et limites. Chaque écart doit renvoyer à une donnée validée, une hypothèse explicite ou un calcul SER1.
- **Contrôle humain** : le CGP peut modifier, rejeter ou valider les hypothèses et scénarios ; la validation est journalisée et le livrable final reste sous responsabilité du cabinet.

### Conséquence réglementaire — pas de chat libre, étude non rédigée par LLM

- La surface IA exposée au cabinet est une **revue guidée de complétion documentaire**, pas un assistant conversationnel de conseil.
- L'étude remise au client est générée par les calculateurs, règles, templates et textes contrôlés SER1 à partir de données validées ; elle ne doit pas être présentée comme un contenu rédigé par IA.
- L'information art. 50 doit donc cibler les moments où l'IA intervient réellement : upload / scan documentaire, champs préremplis, points à valider, journal des traitements IA.
- Côté RGPD, l'absence de chat libre réduit le risque de saisie spontanée de données sensibles ou hors finalité, mais ne supprime pas les obligations : minimisation, pseudonymisation, DPA, registre, AIPD, droits des personnes, rétention et journalisation sans PII restent obligatoires.
- En V2 multi-modèles, l'escalade qualité est plafonnée à Mistral + GPT-5.2 pour contenir la complexité réglementaire (DPA, SCC, AIPD, registre par fournisseur). Chaque fournisseur activable doit avoir sa qualification RGPD, son DPA, sa politique de rétention / entraînement, son statut ZDR ou équivalent et son périmètre de données documentés avant activation. Tout troisième fournisseur LLM est explicitement exclu de la V2 et exige un nouveau cadrage AI Act et RGPD complet.

---

## Articulation avec le RGPD et la CNIL

- SER1 reste **responsable du traitement** des données personnelles envoyées à Mistral. Position constante de la CNIL : l'utilisateur d'un LLM tiers est responsable du traitement, pas le fournisseur du modèle.
- AIPD (article 35 RGPD) à conduire avant déploiement de PR V2-14 — couvert par la Phase D du plan IA documentaire.
- Mesures déjà prévues dans [docs/PLAN_IA_DOCUMENTAIRE_SER1.md](./PLAN_IA_DOCUMENTAIRE_SER1.md) :
  - DPA Mistral et demande ZDR (Zero Data Retention).
  - Pseudonymisation post-OCR pour les appels de structuration, complétion UX et détection d'incertitudes.
  - Hébergement UE.
  - Rétention limitée et registre article 30.
- Surveillance CNIL 2026 sur l'IA : contrôles ciblés, principe d'exactitude critique. Le **score de confiance + validation CGP** côté SER1 répondent directement à ce point.

---

## Transferts internationaux et escalade multi-fournisseurs

- **V1 (livraison PR V2-14)** : Mistral seul, traitement intégralement UE. Aucun transfert hors UE, aucun fournisseur US activé.
- **V2 (escalade qualité)** : ajout de **GPT-5.2 uniquement**, déclenché par règles SER1 déterministes pour les dossiers complexes ou faible confiance d'extraction. **Pas de troisième fournisseur LLM** en V2 pour contenir la complexité réglementaire (DPA, SCC, AIPD, registre, conformité commerciale).
- **Mode souverain** : option cabinet activable pour les clients sensibles, qui force le pipeline à rester Mistral UE only et désactive toute escalade GPT-5.2. Choix explicite et journalisé au niveau cabinet.
- **Conditions d'activation de GPT-5.2** :
  - DPA OpenAI signé et archivé dans le dossier conformité.
  - SCC (clauses contractuelles types) UE-US à jour, sous-traitants OpenAI documentés et surveillés via Trust Center.
  - Localisation EU Data Boundary explicitée, contrôlée à chaque appel, sans repli silencieux vers une région non-UE.
  - Zero retention contractuel équivalent au ZDR Mistral.
  - AIPD spécifique à OpenAI / GPT-5.2 conduite et archivée, distincte de l'AIPD Mistral.
  - Pseudonymisation renforcée avant tout appel hors UE : au-delà de la pseudonymisation post-OCR, suppression ou agrégation des montants identifiants quasi-uniques (patrimoine total, capital AV, valorisation société, identifiants familiaux).
  - Information cabinet : escalade GPT-5.2 mentionnée explicitement dans l'onboarding, la page conformité et les CGU.
- **Toute extension à un troisième fournisseur LLM** (Anthropic, Google, autre) est explicitement exclue de la V2 et nécessite un nouveau cadrage AI Act + RGPD complet, avec mise à jour de l'engagement volontaire, du registre IA et de la page conformité.
- **Sanction interne d'un manquement** : désactivation immédiate de l'escalade GPT-5.2 et retour Mistral UE only, sans préjudice fonctionnel pour le cabinet (la V1 reste pleinement utilisable).

---

## Garde-fous produit complémentaires

Ces garde-fous renforcent l'engagement volontaire AI Act SER1 et préviennent les dérives produit susceptibles de faire basculer le système en haut risque ou en assistance non encadrée.

- **Marquage `ai_assisted`** : chaque champ préremplis ou point de validation produit par le pipeline IA porte un flag `ai_assisted: true` en base de données, propagé en métadonnées des exports PPTX / Excel. C'est la réponse SER1 au principe de marquage machine-readable de l'art. 50 §2, défendable même si l'exemption « assistance à structuration » est retenue.
- **Détection d'incohérences = règles SER1 déterministes** : les contradictions documentaires (revenu déclaré ≠ revenu fiscal de référence, capital AV ≠ primes + intérêts, démembrement déclaré sans valeur cotisée, etc.) sont produites par des règles SER1 versionnées, jamais par jugement LLM. Le LLM peut **formuler** la question de validation au CGP ; il ne **décide** pas qu'il y a incohérence.
- **Indicateur qualité fin de scan** : tuile visible CGP affichant le nombre de champs préremplis, le score moyen de confiance, le nombre de points à valider et le nombre d'incohérences détectées. Transparence art. 50 + AI literacy art. 4 incarnées en UI.
- **Templates déterministes en doublon** : pour les documents normalisés (avis IR, formulaires 2042 / 2044, relevés assurance vie format AFER), extraction par templates positions + regex en complément du LLM. Si template = LLM, confiance élevée, préremplissage direct ; sinon, signalement explicite. Réduit le coût, améliore la fiabilité, sert de garde-fou qualité.
- **Pas de score d'opportunité généré par LLM** : si SER1 affiche un jour des « opportunités fiscales détectées », la détection doit venir de règles déterministes (par exemple `revenu > seuil X ET PER non saturé → opportunité PER`), jamais d'un LLM. Sinon, glissement vers conseil et bascule haut risque potentielle.
- **AIPD par fournisseur** : une AIPD distincte par fournisseur LLM (Mistral, puis GPT-5.2 en V2), révisée à chaque changement de version majeure du modèle ou de politique fournisseur. Posture défendable face à un audit CNIL.
- **Mini-registre IA public** : la page conformité expose un tableau cabinet listant pour chaque modèle activé : fournisseur, usage SER1, localisation, statut DPA / SCC / rétention, date de dernière revue qualité. Personne d'autre sur le marché CGP ne publie ce niveau de transparence ; c'est le différenciateur central de l'engagement volontaire.

---

## Sanctions encourues

| Manquement                                                                                         | Sanction maximale           |
| -------------------------------------------------------------------------------------------------- | --------------------------- |
| Art. 5 (pratiques interdites)                                                                      | 35 M€ ou 7 % du CA mondial  |
| Art. 50 (transparence) et obligations opérateurs visées par l'art. 99 §4                           | 15 M€ ou 3 % du CA mondial  |
| Informations inexactes, incomplètes ou trompeuses aux organismes notifiés ou autorités compétentes | 7,5 M€ ou 1 % du CA mondial |

Adaptations PME / start-up explicitement prévues par le règlement.

---

## Inventaire des systèmes IA SER1

Liste exhaustive des systèmes effectivement « IA » au sens AI Act, et liste des composants explicitement hors périmètre. Tout ajout d'inférence LLM dans un composant aujourd'hui hors périmètre déclenche une revue AI Act avant développement.

| Système / composant                               | Description                                                     | Statut                 | Rôle SER1                         | Classification AI Act   | Justification                                                                                                  |
| ------------------------------------------------- | --------------------------------------------------------------- | ---------------------- | --------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Scan documentaire — OCR Mistral                   | OCR de PDF / scans / images via `mistral-ocr-latest`            | Planifié V1 (PR V2-14) | Fournisseur du système applicatif | Risque limité (art. 50) | Système d'IA au sens art. 3(1) ; pas haut risque, pas pratique interdite                                       |
| Scan documentaire — extraction structurée Mistral | Transformation OCR → JSON patrimonial pseudonymisé              | Planifié V1 (PR V2-14) | Fournisseur du système applicatif | Risque limité (art. 50) | Préremplissage UX ; validation CGP obligatoire en aval                                                         |
| Scan documentaire — escalade qualité GPT-5.2      | Routage déterministe SER1 vers GPT-5.2 sur dossiers complexes   | Planifié V2 (PR V2-14) | Fournisseur du système applicatif | Risque limité (art. 50) | Améliore l'extraction, ne change pas la classe ; opt-in cabinet ; conditions d'activation détaillées plus haut |
| Détection d'incohérences documentaires            | Règles SER1 déterministes (matchings, contradictions de champs) | Planifié               | n/a                               | Hors périmètre AI Act   | Pas d'inférence, pas un système d'IA au sens art. 3(1)                                                         |
| Recommandations PER (`PR V2-08`)                  | Heuristique déterministe sur enveloppes PER et report IR        | Planifié               | n/a                               | Hors périmètre AI Act   | Règles humaines, pas d'inférence — considérant excluant les systèmes à base de règles                          |
| Stratégie comparative (`/strategy`)               | Calcul SER1 de scénarios `situation actuelle vs réorienté`      | Planifié               | n/a                               | Hors périmètre AI Act   | Le LLM ne décide pas ; calculs et comparaisons sont SER1                                                       |
| Moteurs fiscaux (`src/engine/**`)                 | Calculs IR, PER, succession, crédit, prévoyance, placement      | Existant               | n/a                               | Hors périmètre AI Act   | Règles déterministes paramétrées                                                                               |
| Exports PPTX / Excel                              | Templates `src/pptx/**` et `src/utils/export/xlsxBuilder.ts`    | Existant               | n/a                               | Hors périmètre AI Act   | Génération par template, pas d'inférence                                                                       |

Rôles fournisseurs / déployeurs récapitulés :

- **SER1** : fournisseur du système d'IA applicatif (orchestration Mistral, prompts, JSON, UX, exports sous marque SER1).
- **Mistral AI** : fournisseur du modèle GPAI et du service OCR sous-jacent.
- **OpenAI** (V2 conditionnelle) : fournisseur du modèle GPT-5.2 utilisé pour l'escalade qualité, sous conditions DPA / SCC / EU Data Boundary / zero retention.
- **Cabinet CGP** : déployeur du système SER1 dans le cadre de sa mission client.

---

## Déclinaison UI / UX art. 50

Tableau écran par écran des mentions et marquages à intégrer, qui matérialisent à la fois l'art. 50 § 1, l'engagement volontaire art. 95 et l'AI literacy art. 4.

| Surface                                             | Élément à intégrer                                                                                                                                                                                 | Format                                                            | Référence                                                          |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| Onboarding cabinet                                  | Capsule explicative : « SER1 utilise un système IA pour préremplir vos dossiers. Vous validez chaque champ. Les calculs et l'étude restent produits par SER1. »                                    | Modale ou page onboarding, lien permanent vers la page conformité | Art. 4 + art. 50 § 1                                               |
| Home — bouton « Préparer un dossier par documents » | Action dédiée dans le bloc `PAR OÙ COMMENCER`, avant la section guidée des simulateurs. Sous-titre court rappelant que c'est un scan IA, pas un chat                                               | Action primaire ou secondaire selon hiérarchie                    | Art. 50 § 1 + gouvernance UI                                       |
| Upload de document                                  | Bandeau persistant : « Vos documents sont traités par un système d'IA hébergé en UE (Mistral). Détails sur la page conformité. »                                                                   | Bandeau haut de page                                              | Art. 50 § 1 + RGPD                                                 |
| Pipeline scan en cours                              | Stepper indiquant les étapes et le modèle effectivement utilisé (Mistral V1 ; Mistral + GPT-5.2 si escalade V2 et cabinet opt-in)                                                                  | Stepper visible                                                   | Art. 50 § 1 + transparence engagement                              |
| Indicateur qualité fin de scan                      | Tuile résumé : nombre de champs préremplis, score moyen de confiance, nombre de points à valider, nombre d'incohérences détectées                                                                  | Bloc résumé visible                                               | Engagement art. 95 + art. 4                                        |
| Champs préremplis dans l'analyse patrimoniale       | Icône `ai_assisted` + tooltip indiquant source documentaire, page, score de confiance                                                                                                              | Inline sur chaque champ                                           | Art. 50 § 1 + engagement                                           |
| Points à valider                                    | Carte structurée par point : valeur extraite, source, confiance, raison de l'incertitude, actions `Valider`, `Corriger`, `Ignorer`, `Demander pièce complémentaire`. **Aucune zone de chat libre** | Liste de cartes                                                   | Art. 14 surveillance humaine (engagement art. 95) + gouvernance UI |
| Exports PPTX / Excel                                | Badge « assisté par IA » ou « extrait par IA » sur les sections issues du pipeline IA + métadonnée document `ai_assisted: true`                                                                    | Badge visuel + métadonnée fichier                                 | Engagement art. 95 + bonne pratique art. 50 § 2                    |
| Page conformité (`PR V2-14`)                        | Texte de l'engagement volontaire AI Act SER1, mini-registre IA, déclaration de non-applicabilité art. 5 et annexe III, contact responsable IA                                                      | Page dédiée publique                                              | Art. 13 transparence + engagement                                  |
| CGU                                                 | Section système IA : modèles activés (Mistral V1 ; GPT-5.2 V2 conditionnel), finalités, localisation, droits des personnes, base légale, durée de rétention                                        | Section CGU dédiée                                                | RGPD + transparence                                                |
| Footer global                                       | Lien permanent vers la page conformité                                                                                                                                                             | Lien texte                                                        | Bonne pratique                                                     |

Vocabulaire à employer : `scan documentaire`, `complétion IA`, `assisté par IA`, `extrait par IA`, `traitement documentaire IA`, `point à valider`.

Vocabulaire à éviter : `chat IA`, `assistant`, `robo-conseiller`, `IA conseille`, `IA recommande`, `IA décide`.

---

## Obligations techniques et engagement volontaire art. 95

SER1 applique volontairement, au titre de l'art. 95, un sous-ensemble des exigences chapitre III section 2 normalement réservées au haut risque. Ce sous-ensemble est public, auditable, et constitue le contenu opérationnel de l'engagement volontaire AI Act SER1.

### Exigences appliquées volontairement

- **Art. 12 — Journalisation** :
  - Chaque appel LLM est journalisé : dossier, modèle appelé, version du prompt, taille input / output, durée, coût estimé, score de confiance retourné, raison du routage si escalade GPT-5.2.
  - Journalisation des actions de validation CGP par champ : auteur, horodatage, action `Valider` / `Corriger` / `Ignorer` / `Demander pièce complémentaire`.
  - Logs purgés de toute PII identifiante directe ; rétention bornée et documentée.
- **Art. 13 — Transparence** :
  - Documentation technique SER1 lisible cabinet, exposée sur la page conformité : description du système, modèles utilisés, finalités, limites connues, taux d'erreur mesurés, contact responsable IA.
  - Prompts versionnés par release, listés dans le runbook interne.
- **Art. 14 — Surveillance humaine** :
  - Validation CGP obligatoire avant tout usage métier des données extraites par IA.
  - UX guidée par cartes et actions explicites, sans chat libre CGP ↔ LLM.
  - Tout champ préremplis par IA peut être modifié, rejeté ou ignoré sans frein.
- **Art. 15 — Exactitude / robustesse** :
  - Score de confiance par champ extrait.
  - Templates déterministes en doublon sur documents normalisés (avis IR, formulaires 2042 / 2044, relevés AV format AFER), avec signalement explicite en cas d'écart.
  - Évals qualité internes périodiques : taux d'erreur d'extraction, hallucinations, biais détectés, dérives entre versions de modèle.
  - Procédure de remontée d'incidents qualité (boîte dédiée, suivi trimestriel, journal des incidents publié dans le mini-registre IA).

### Exigences techniques RGPD × AI Act

- **AIPD distincte par fournisseur LLM** : Mistral pour la V1, OpenAI / GPT-5.2 pour la V2 si activée. Révision à chaque changement majeur de modèle ou de politique fournisseur.
- **Registre IA interne** : modèles activés et versions, prompts versionnés, fournisseurs et statut DPA / SCC / ZDR, dates de revue qualité, incidents recensés. Une vue publique simplifiée est exposée sur la page conformité (mini-registre IA).
- **Chaîne contractuelle** : DPA + zero retention pour Mistral ; DPA + SCC + EU Data Boundary + zero retention pour OpenAI en V2.
- **Pseudonymisation** : systématique post-OCR avant les appels de structuration et de complétion ; renforcée (suppression / agrégation des montants identifiants quasi-uniques) avant toute escalade hors UE.
- **Plan de gestion d'incidents IA** : détection (qualité, sécurité, fuite, biais), escalade interne, communication CNIL si critères de notification atteints, retour automatique en mode Mistral UE only si l'incident touche l'escalade GPT-5.2.

### AI literacy — capsule CGP

- Capsule explicative obligatoire à l'onboarding cabinet, accessible en permanence depuis la page conformité et le footer.
- Contenu : ce que fait l'IA SER1, ce qu'elle ne fait pas, comment valider, limites connues, contacts.
- Mise à jour à chaque évolution majeure (nouveau modèle, nouvelle finalité, changement de fournisseur, incident significatif).

### Engagement public — texte de référence

Bloc texte à publier sur la page conformité, sans vocabulaire de certification officielle :

> SER1 est fournisseur d'un système d'IA à risque limité au sens du règlement (UE) 2024/1689. Nous appliquons volontairement, au titre de l'article 95, un sous-ensemble des exigences haut risque : journalisation des appels IA et des validations CGP, transparence sur les modèles utilisés et leurs limites, surveillance humaine systématique par le CGP avant tout usage métier, score de confiance par donnée extraite. Aucun chat libre entre le CGP et un LLM n'est exposé. Les calculs et l'étude client sont produits par les moteurs et templates SER1 à partir de données validées par le CGP. Cet engagement est auto-déclaratif ; il ne constitue ni une certification officielle ni un label réglementaire.

---

## Synthèse — livrables avant premier pilote payant

1. Mettre en place la maîtrise de l'IA en interne et la capsule explicative utilisateur dans l'app (art. 4).
2. Décliner la transparence art. 50 dans l'UI scan documentaire, analyse patrimoniale et exports PPTX / Excel.
3. Produire le texte de la page conformité incluant la déclaration de non-applicabilité de l'art. 5 et de l'annexe III, et le contenu de l'engagement volontaire AI Act SER1.
4. Choisir et documenter les exigences haut risque appliquées volontairement (art. 95) : a minima journalisation, transparence, surveillance humaine, exactitude.
5. Documenter la frontière `/strategy` : étude générée par les calculateurs SER1, LLM limité à la complétion documentaire, validation CGP journalisée.
6. Maintenir la chaîne RGPD (DPA, ZDR, AIPD, registre article 30) déjà prévue dans `docs/PLAN_IA_DOCUMENTAIRE_SER1.md`.

Le détail technique (inventaire des systèmes IA, déclinaison UI / UX art. 50, obligations techniques et engagement art. 95) est consolidé dans les sections plus haut de ce même document, pour limiter la prolifération documentaire.

---

## Sources

- [Règlement (UE) 2024/1689 — texte officiel EUR-Lex](https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX%3A32024R1689)
- [AI Act Service Desk — Article 3, définitions](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-3)
- [AI Act Service Desk — Article 4, maîtrise de l'IA](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-4)
- [AI Act Service Desk — Article 5, pratiques interdites](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-5)
- [AI Act Service Desk — Article 6, classification haut risque](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-6)
- [AI Act Service Desk — Article 50, transparence](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50)
- [AI Act Service Desk — Article 95, codes de conduite volontaires](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-95)
- [AI Act Service Desk — Article 99, sanctions](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-99)
- [AI Act Service Desk — Article 113, calendrier d'application](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-113)
- [AI Act Service Desk — Annexe III, systèmes haut risque](https://ai-act-service-desk.ec.europa.eu/en/ai-act/annex-3)
- [Conseil de l'Union européenne — accord provisoire Digital Omnibus AI du 2026-05-07](https://www.consilium.europa.eu/fr/press/press-releases/2026/05/07/artificial-intelligence-council-and-parliament-agree-to-simplify-and-streamline-rules/)
- [CNIL — recommandations IA et RGPD](https://www.cnil.fr/fr/ia-et-rgpd-la-cnil-publie-ses-nouvelles-recommandations-pour-accompagner-une-innovation-responsable)
- [CNIL — programme de travail 2026](https://www.cnil.fr/fr/accompagnement-des-professionnels-le-programme-de-travail-de-la-cnil-pour-2026)
- [Direction générale des Entreprises — décryptage AI Act](https://www.entreprises.gouv.fr/decryptages-de-nos-experts/le-reglement-europeen-sur-lintelligence-artificielle-publics-concernes)
