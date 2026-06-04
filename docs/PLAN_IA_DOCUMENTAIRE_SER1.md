# Plan IA documentaire SER1

> Date de cadrage : 2026-05-22
>
> Objectif : construire dans SER1 un parcours d'analyse patrimoniale assistée par IA, avec lecture documentaire, complétion contrôlée de l'UX, validation ciblée par le CGP, calculs SER1 déterministes, génération PPTX existante et dossier de conformité RGPD exploitable commercialement.
>
> Ce plan est l'explosion détaillée de **PR V2-14 — Scan documentaire** dans `docs/ROADMAP.md`.
>
> Mode opératoire Mistral jour J : [`docs/RUNBOOK_MISTRAL_SER1.md`](./RUNBOOK_MISTRAL_SER1.md).

---

## Décision de trajectoire

La trajectoire recommandée est une **souveraineté contractuelle et applicative** pour la V1 :

- SER1 reste la source de vérité du dossier, des calculs et du livrable.
- Mistral AI Studio sert de fournisseur technique OCR + extraction structurée, sous DPA et avec demande Zero Data Retention (ZDR).
- Au sens AI Act, SER1 assume le statut de fournisseur du système d'IA applicatif SER1 à risque limité ; Mistral est fournisseur du modèle GPAI / service OCR sous-jacent et le cabinet CGP est déployeur.
- Les moteurs SER1 restent déterministes : l'IA prépare les entrées et les points de validation, mais ne remplace jamais les calculs.
- La stratégie comparative `/strategy` reste calculée par SER1 : situation actuelle vs scénario réorienté, hypothèses explicites, écarts chiffrés et validation CGP.
- Les LLM ne rédigent pas l'étude client, ne produisent pas la recommandation finale et ne dialoguent pas librement avec le CGP. L'étude est générée par les calculateurs, règles, templates PPTX / Excel et textes contrôlés SER1.
- Le CGP ne valide pas une grande table exhaustive : il valide seulement les points critiques, incertains ou contradictoires.
- Les données envoyées aux appels LLM post-OCR sont pseudonymisées autant que possible.

Point de vigilance : si Mistral OCR est utilisé, les documents bruts sont envoyés à Mistral pour l'OCR. La pseudonymisation intervient surtout après l'OCR, pour les appels de structuration, complétion UX et détection d'incertitudes. Ce point doit être assumé contractuellement, pas masqué.

---

## Abonnement et fournisseur IA

### Choix précis du plan Mistral

| Offre Mistral                                | Usage                                                                           | Quand l'activer                                     |
| -------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------- |
| **API pay-as-you-go** (`console.mistral.ai`) | Socle backend SER1 : OCR + extraction + complétion UX contrôlée                 | Jour 1, c'est le socle technique                    |
| Le Chat Free / Pro perso                     | Tests internes équipe SER1                                                      | Optionnel, hors socle technique                     |
| Le Chat Team                                 | Chat interne équipe avec espace partagé                                         | Pas nécessaire pour SER1                            |
| **Mistral AI Studio Enterprise**             | ZDR contractualisé si nécessaire, SLA, support prioritaire, négociation directe | Bascule prévue au passage en production commerciale |
| Self-deployment / on-premise (poids ouverts) | Souveraineté technique pure                                                     | Seulement si un client institutionnel l'exige       |

Ne pas confondre « abonnement Le Chat » (interface utilisateur) et « compte API » (socle technique SER1). Le socle V1 est l'API pay-as-you-go ; un Enterprise est négocié quand le volume, le SLA ou le besoin contractuel ZDR le justifient.

### Commencer par l'API pay-as-you-go

1. Créer une organisation Mistral AI Studio dédiée à SER1.
2. Activer le mode pay-as-you-go (pas de minimum d'engagement).
3. Ne pas prendre Le Chat Team comme socle technique : SER1 a besoin d'appels API backend.
4. Créer trois espaces logiques ou trois jeux de clés : `dev`, `staging`, `prod`.
5. Stocker les clés uniquement côté backend (Supabase secrets, variables d'environnement serveur) ; jamais dans le frontend Vite.
6. Activer des plafonds de dépense et des alertes de consommation dès le prototype.
7. Demander formellement l'activation **Zero Data Retention** dans Mistral AI Studio, avec motif : traitement de dossiers patrimoniaux confidentiels pour des cabinets CGP.
8. Accepter et archiver le **Data Processing Addendum** Mistral.
9. S'abonner aux notifications de sous-traitants Mistral via le Trust Center.

### Modèles à utiliser en V1

| Étape                 | Modèle / service                      | Rôle                                                                                              |
| --------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| OCR                   | `mistral-ocr-latest`                  | Lire PDF, images, scans, tableaux et restituer texte, tables, métadonnées et scores de confiance. |
| Extraction structurée | Mistral Large 3 ou Mistral Medium 3.5 | Transformer les sorties OCR en JSON patrimonial sourcé, avec schéma strict.                       |
| Points à valider      | Mistral Large 3 ou Mistral Medium 3.5 | Produire des questions fermées ou semi-fermées pour lever les incertitudes documentaires.         |
| Mode économique       | Mistral Medium 3.5                    | Alternative pour extraction ou brouillons quand le coût doit être réduit.                         |

Décision de départ : utiliser un seul fournisseur IA en V1 pour limiter la complexité DPA, logs, sécurité et support. Une architecture multi-fournisseur pourra être ajoutée plus tard uniquement si le contrôle qualité l'impose.

### Trajectoire V2 multi-modèles

La V1 active reste **Mistral-only**. La V2 planifiée ajoute un orchestrateur SER1 multi-modèles, sans déléguer le routage à un LLM.

Paliers fonctionnels prévus :

- Basic : Mistral seul.
- Pro : Mistral + GPT-5.2.
- Premium : Mistral + GPT-5.2 (mêmes fournisseurs que Pro, quota IA élargi et fonctionnalités avancées). Aucun troisième fournisseur LLM n'est ajouté en V2 pour contenir la complexité réglementaire (DPA, SCC, AIPD par fournisseur).

Aucun montant de prix ni pourcentage de plafond n'est versionné dans cette documentation. Les seuils commerciaux et limites chiffrées restent dans la documentation commerciale hors repo.

La V2 multi-modèles est conditionnée à trois prérequis :

- évals qualité prouvant que l'écart avec Mistral apporte une valeur réelle sur extraction, complétion UX et réduction d'erreurs ;
- DPA, ZDR et qualification RGPD obtenus pour les fournisseurs concernés ;
- routage, logs et plafonds prêts côté SER1.

Risque : si la conformité des fournisseurs US échoue, les paliers Pro et Premium devront être redéfinis par budget IA ou fonctionnalités, pas par modèle US.

### Règle d'or premium

Aucun modèle premium ne peut être appelé avant pseudonymisation, validation JSON, score de complexité calculé par SER1, estimation du coût et vérification qu'un modèle moins cher ne suffit pas. Le score de complexité est déterministe : type de document, faible confiance OCR, contradictions, présence de donation, démembrement, clause bénéficiaire, société, régime matrimonial complexe ou volume documentaire.

### Plafonds de consommation IA

Le plafond IA fonctionne en deux couches.

Couche 1 — plafond par dossier dans le pipeline :

- modèles économiques pour le gros du travail ;
- raisonnement plafonné ;
- cache OCR par hash document ;
- validation déterministe ;
- pas de chat libre utilisateur ;
- aucun dossier seul ne peut s'emballer.

Couche 2 — plafond mensuel par utilisateur :

- le dossier en cours se termine, même si le plafond est atteint pendant l'analyse ;
- après épuisement, scan documentaire, complétion IA et validation guidée enrichie sont coupés jusqu'au reset mensuel ;
- simulateurs déterministes, saisie manuelle et exports PPTX / XLSX restent disponibles ;
- le plafond couvre tout le coût fournisseur IA : OCR et inférence ;
- la jauge est visible en unités métier, pas en tokens ni en pourcentage interne ;
- une alerte est affichée à l'approche du plafond ;
- un avertissement précède le lancement d'un gros dossier.

Principe directeur : l'IA est un accélérateur, jamais une dépendance.

---

## Organisation cible de SER1

### Principe de flux

```mermaid
flowchart LR
  A["Documents client"] --> B["Upload SER1"]
  B --> C["Stockage privé SER1"]
  C --> D["OCR Mistral Studio"]
  D --> E["Extraction JSON sourcée"]
  E --> F["Validation ciblée CGP"]
  F --> G["Dossier patrimonial validé"]
  G --> H["Moteurs SER1"]
  H --> I["Étude automatique SER1"]
  I --> J["PPTX SER1"]
```

### Règle d'or

Un champ extrait ne devient jamais une donnée exploitable si SER1 ne possède pas :

- la valeur normalisée ;
- le document source ;
- la page source ;
- un extrait ou une zone justificative ;
- un score de confiance ;
- un statut de revue.

Sans source, la valeur reste `inconnue` ou `a_confirmer`.

---

## Volet Dev SER1

### Phase 1 — Socle dossier documentaire

Commencer par créer un socle de stockage et de traçabilité documentaire.

1. Ajouter une zone « Documents » dans le workflow `/audit` ou dans un sous-parcours rattaché à l'audit patrimonial.
2. Créer un bucket Supabase Storage privé pour les documents patrimoniaux.
3. Stocker les fichiers sous un chemin stable par cabinet, dossier et document.
4. Interdire les liens publics ; utiliser uniquement des URL signées courtes pour la visualisation.
5. Créer une migration Supabase pour les tables minimales :
   - `patrimonial_cases` : dossier d'analyse ;
   - `patrimonial_documents` : fichier, type supposé, hash SHA-256, statut ;
   - `patrimonial_document_pages` : page, texte OCR, score de confiance, métadonnées ;
   - `patrimonial_extraction_runs` : fournisseur, modèle, coût estimé, statut, durée ;
   - `patrimonial_extracted_fields` : champ, valeur, source, confiance, statut ;
   - `patrimonial_validation_items` : points présentés au CGP ;
   - `patrimonial_pii_mapping` : table de correspondance pseudonymisation (voir § dédié).
6. Journaliser tous les traitements IA dans une table d'audit technique sans données sensibles en clair.
7. Prévoir une suppression complète du dossier : lignes SQL, objets Storage, extractions, table PII et journaux associés.

### Phase 2 — Upload CGP premium

Construire une expérience simple pour le CGP.

1. Permettre le dépôt multi-fichiers : PDF, images, scans PDF.
2. Afficher une file de traitement lisible : reçu, OCR en cours, extraction, validation prête.
3. Calculer et afficher un hash SHA-256 par document pour la traçabilité.
4. Ne pas demander au CGP de classifier parfaitement chaque document.
5. Proposer une classification automatique corrigeable : CNI, passeport, livret de famille, avis d'impôt, relevé bancaire, tableau d'amortissement, contrat d'assurance-vie, PER, bilan, statuts, acte notarié, acte d'avocat, autre.
6. Bloquer seulement les formats dangereux ou inutilisables.
7. Avertir si un document est trop flou, trop volumineux ou manifestement incomplet.

### Phase 3 — OCR Mistral

Brancher l'OCR côté backend.

1. Créer une Edge Function ou un service backend dédié `document-ai`.
2. Appeler `mistral-ocr-latest` depuis le backend uniquement.
3. Demander les scores de confiance page ou mot quand le document le justifie.
4. Demander le format de table adapté aux documents financiers.
5. Stocker le markdown OCR, les tables et les métadonnées par page.
6. Ne pas stocker les réponses OCR dans des logs applicatifs.
7. Mettre en place une reprise sur erreur : un document peut être relancé sans recréer tout le dossier.
8. Mesurer le temps de traitement et le coût par document.

### Phase 4 — Extraction JSON patrimoniale

Construire une extraction strictement sourcée.

1. Définir un schéma JSON patrimonial versionné dans SER1.
2. Découper le schéma par domaines :
   - identité et dates de naissance ;
   - foyer et situation familiale ;
   - régime matrimonial et actes ;
   - revenus et fiscalité ;
   - comptes bancaires et liquidités ;
   - emprunts et tableaux d'amortissement ;
   - placements et enveloppes ;
   - assurance-vie, PER, PEA, CTO, SCPI ;
   - immobilier ;
   - sociétés, bilans et statuts ;
   - actes notariés et actes d'avocat ;
   - donations, démembrements, Dutreil, préciput, divorce.
3. Créer le guide de lecture documentaire SER1 par type de document :
   - CNI, passeport ou titre d'identité : identité, dates de naissance, validité, cohérence entre époux ;
   - livret de famille : époux, enfants, dates ou années de naissance, filiation ;
   - avis d'impôt : revenus, parts, enfants rattachés, TMI indiquée si présente, plafonds utiles ;
   - relevés assurance-vie, PER, PEA, CTO et SCPI : titulaire, souscripteur, assuré, valeur, supports, versements, clauses et compartiments ;
   - relevés bancaires : établissement, compte, titulaire, solde, nature du compte ;
   - bilans et statuts de société : forme, détention, activité, valorisation, direction, associés, clauses utiles ;
   - contrat de mariage et actes notariés : régime, dates, donations, donateurs, bénéficiaires, rapport civil, démembrement ;
   - tableaux d'amortissement et contrats de prêt : emprunteurs, capital restant dû, assurance emprunteur, quotités, taux et durée.
4. Pour chaque type de document, préciser les champs attendus, le mapping cible SER1, les confusions fréquentes, les statuts `ok`, `a_confirmer`, `contradictoire`, et les validations humaines obligatoires.
5. Pour chaque champ, imposer :
   - `value` ;
   - `normalizedValue` ;
   - `confidence` ;
   - `sourceRefs` ;
   - `reviewStatus` ;
   - `reason`.
6. Interdire à l'IA d'inventer une valeur : elle doit renvoyer `unknown` si la source n'est pas assez claire.
7. Exécuter l'extraction par document, puis fusionner au niveau dossier.
8. Détecter les contradictions entre documents : date de naissance différente, régime matrimonial divergent, encours incohérent.
9. Marquer automatiquement les zones critiques à validation humaine obligatoire.

### Phase 5 — Validation ciblée CGP

Construire l'écran qui fait gagner du temps au CGP.

1. Afficher un résumé du type : « 183 données prêtes, 7 points à confirmer ».
2. Ne jamais afficher par défaut l'intégralité des champs extraits.
3. Présenter les validations par priorité :
   - bloquant ;
   - important ;
   - confort ;
   - informationnel.
4. Pour chaque point, afficher la valeur proposée, l'extrait source, le document et la page.
5. Permettre au CGP de corriger directement la valeur.
6. Garder une trace de la correction : qui, quand, ancienne valeur, nouvelle valeur.
7. Exiger une validation humaine pour :
   - régime matrimonial ;
   - divorce ;
   - contrat de mariage ;
   - donation entre époux ;
   - donations et donation-partage ;
   - clause de préciput ;
   - démembrement ;
   - Dutreil ;
   - statuts de société ;
   - actes notariés ou actes d'avocat ;
   - clause bénéficiaire si elle est lue dans un document ;
   - tout champ fiscal ou patrimonial à impact élevé.
8. Autoriser le passage à l'étape suivante uniquement quand les points bloquants sont traités.

### Phase 6 — Pseudonymisation et appels LLM post-OCR

Ajouter une couche de défense avant les appels de structuration et de complétion UX. Voir le § « Pseudonymisation — implémentation concrète » ci-après pour le détail technique.

1. Pseudonymiser les noms, adresses, emails, téléphones, numéros fiscaux, SIREN, NIR et identifiants documentaires quand ils ne sont pas utiles au raisonnement.
2. Conserver la table de correspondance uniquement dans SER1.
3. Envoyer au LLM de complétion un dossier réduit : texte OCR utile, champs candidats, sources, scores, contraintes de schéma et valeurs déjà connues.
4. Ne pas envoyer les documents bruts aux modèles de complétion si l'OCR et l'extraction ont déjà produit les sources nécessaires.
5. Ne pas présenter cette pseudonymisation comme une anonymisation RGPD : elle réduit le risque, mais les données restent personnelles.

### Phase 7 — Intégration moteurs SER1

Faire utiliser SER1 par l'IA, pas l'inverse.

1. Créer un adaptateur qui transforme le dossier validé en entrées compatibles avec les simulateurs SER1.
2. Réutiliser les moteurs existants dans `src/engine/**`.
3. Ne pas hardcoder de fiscalité dans le parcours IA.
4. Si les calculs sont exécutés côté serveur, créer un loader fiscal serveur qui respecte la chaîne `Supabase → fiscalSettingsCache.ts → useFiscalContext.ts → settingsDefaults.ts` ou son équivalent backend documenté.
5. Exposer des « tools » applicatifs internes :
   - calcul IR ;
   - calcul succession ;
   - projection placement ;
   - projection PER ;
   - crédit et amortissement ;
   - trésorerie société ;
   - génération d'hypothèses PPTX.
6. Le LLM ne reçoit pas le droit de modifier les résultats moteur.
7. Chaque piste stratégique doit citer le calcul SER1, la donnée validée ou l'hypothèse explicite qui la justifie.
8. La comparaison stratégique doit distinguer au minimum : situation actuelle, scénario réorienté, gains / pertes de valorisation, effets de transmission, protection, revenus, liquidité, fiscalité et limites.

### Phase 8 — Validation guidée CGP sans chat libre

Remplacer le chat par une revue structurée des champs préremplis et des points à confirmer.

1. Ne pas ajouter de chat libre CGP ↔ LLM en V1.
2. Afficher une file de validation rattachée au dossier patrimonial :
   - champs proposés ;
   - source document / page / extrait ;
   - score de confiance ;
   - raison de l'incertitude ;
   - proposition de valeur normalisée ;
   - action attendue du CGP.
3. Actions autorisées :
   - `Valider` ;
   - `Corriger` ;
   - `Ignorer` ;
   - `Demander pièce complémentaire` ;
   - `Marquer comme non applicable`.
4. Questions autorisées : fermées ou semi-fermées, générées depuis un schéma SER1 et une liste de catégories métier. Exemple : objectif de transmission, horizon, besoin de revenus, tolérance au risque, priorité fiscale, contrainte familiale, liquidité souhaitée.
5. Interdictions :
   - zone de saisie libre envoyée directement au LLM ;
   - réponse conversationnelle du LLM au CGP ;
   - recommandation patrimoniale générée par LLM ;
   - étude ou texte client rédigé par LLM.
6. Les réponses du CGP deviennent des données de dossier avec trace d'origine « déclaration CGP ».

### Phase 9 — Génération PPTX

Faire sortir l'étude par les templates actuels.

1. Réutiliser le pipeline PPTX existant :
   - `src/pptx/export/exportStudyDeck.ts` ;
   - `src/features/audit/export/exportAudit.ts` ;
   - `src/features/strategy/export/exportStrategy.ts`.
2. Ajouter un preset ou un wrapper dédié à l'analyse patrimoniale IA si les exports actuels ne couvrent pas le besoin.
3. Les slides ne recalculent jamais la fiscalité.
4. Les slides affichent uniquement des données validées ou des hypothèses clairement nommées.
5. Ajouter une annexe interne optionnelle pour le CGP :
   - documents traités ;
   - points validés ;
   - points incertains ;
   - limites et exclusions.
6. Ne pas exposer au client final les détails techniques IA inutiles.

### Phase 10 — Qualité et tests

Valider avant de vendre. Voir le § « Tests qualité IA » ci-après pour les fixtures et les assertions précises.

1. Créer un jeu de dossiers de test anonymisés ou synthétiques.
2. Tester les schémas JSON et les normalisations.
3. Tester la détection de contradictions.
4. Tester le refus d'hallucination : champ absent ⇒ `unknown`.
5. Tester les RLS Storage et SQL.
6. Tester la suppression complète d'un dossier.
7. Tester la génération PPTX sur dossier complet.
8. Lancer `npm run check`.
9. Lancer `npm run test:deno` si une edge function Supabase est modifiée.
10. Documenter en PR les preuves : commandes, fichiers, hypothèses et limites.

---

## Volet conformité

### Phase A — Qualification des rôles

Formaliser les rôles avant la production.

1. Identifier le cabinet CGP comme responsable de traitement pour ses clients.
2. Identifier SER1 comme sous-traitant du cabinet si SER1 est fourni en SaaS à plusieurs cabinets.
3. Identifier Mistral AI comme sous-traitant ultérieur ou sous-traitant selon la chaîne contractuelle retenue.
4. Documenter cette qualification dans le registre RGPD SER1.
5. Faire valider cette qualification par un juriste ou DPO avant ouverture commerciale.

### Phase B — Base légale et information client

Préparer le cadre client.

1. Ajouter une clause dans le mandat CGP (voir § « Modèles juridiques »).
2. Expliquer que le cabinet utilise SER1 et un fournisseur IA encadré contractuellement pour lire les documents, structurer les données et préremplir l'UX de validation.
3. Indiquer que le traitement repose sur l'exécution du mandat ou l'intérêt légitime documenté, selon validation juridique.
4. Prévoir une option d'opposition ou de traitement sans IA pour un dossier donné.
5. Indiquer que les LLM ne rédigent pas l'étude finale et ne dialoguent pas librement avec le CGP dans SER1 V1.
6. Ne pas promettre que « rien ne sort » si Mistral OCR est utilisé.
7. Promettre plutôt : traitement encadré, DPA, ZDR demandée ou active, chiffrement, accès limité, journalisation, suppression possible.

### Phase C — DPA et sous-traitance

Construire le dossier contractuel.

1. Archiver le DPA Mistral applicable.
2. Archiver les conditions commerciales Mistral.
3. Archiver la preuve de demande puis d'activation ZDR.
4. Conserver la liste des sous-traitants Mistral et la procédure de notification.
5. Mettre à jour les CGU ou contrats SER1 pour mentionner l'usage de sous-traitants IA.
6. Prévoir une clause de suppression et restitution des données.
7. Prévoir une clause d'audit documentaire raisonnable.
8. Tenir un registre des versions contractuelles acceptées.
9. Pour la V2 multi-modèles, répéter ces preuves pour chaque fournisseur avant activation : DPA, rétention, opt-out entraînement, ZDR ou équivalent, localisation, sous-traitants, transferts et procédure d'incident.

### Phase D — Registre RGPD article 30

Documenter le traitement.

1. Finalité : assistance à l'analyse patrimoniale et génération d'une étude.
2. Catégories de personnes : clients finaux, conjoint, enfants, associés, bénéficiaires, dirigeants.
3. Catégories de données : identité, famille, patrimoine, fiscalité, revenus, dettes, contrats, actes juridiques, données sociétaires.
4. Destinataires : utilisateurs autorisés du cabinet, SER1, Mistral AI selon contrat ; fournisseurs V2 uniquement s'ils sont activés et documentés.
5. Durées de conservation : définir par type de donnée.
6. Mesures de sécurité : chiffrement, RLS, accès rôle, URL signées, logs sans PII, suppression complète.
7. Transferts hors UE : documenter selon le contrat Mistral et les sous-traitants effectifs.
8. Droits des personnes : accès, rectification, suppression, opposition, limitation.

### Phase E — Analyse de risques

Faire une analyse de risques avant production.

1. Risque principal : extraction fausse acceptée sans contrôle.
2. Mesure : validation humaine obligatoire sur points critiques.
3. Risque : document client envoyé à un fournisseur IA.
4. Mesure : DPA, ZDR, minimisation, rétention limitée, fournisseur unique.
5. Risque : hallucination de complétion ou champ mal prérempli.
6. Mesure : sources obligatoires, scores de confiance, règles de blocage, validation CGP journalisée, escalade modèle déterministe sur dossiers complexes.
7. Risque : fuite via logs.
8. Mesure : interdiction PII dans logs, masquage automatique, tests.
9. Risque : erreur de droits entre cabinets.
10. Mesure : RLS cabinet, tests multi-tenant, chemins Storage cloisonnés.
11. Risque : documents conservés trop longtemps.
12. Mesure : rétention explicite, suppression dossier, purge automatique.

### Phase F — Validation CGP comme contrôle humain

Formaliser le rôle du CGP.

1. SER1 fournit une aide à l'analyse, pas une décision autonome.
2. Le CGP valide les données critiques avant génération finale.
3. Le CGP valide aussi le scénario stratégique retenu, les hypothèses modifiées, les pistes rejetées et les limites conservées.
4. La validation est journalisée.
5. Le PPTX final doit indiquer les hypothèses et limites pertinentes.
6. Les corrections du CGP priment sur les extractions IA.
7. Un dossier non validé reste en brouillon.

### Phase G — Page conformité SER1

Préparer une page claire pour les cabinets. Voir le § « Modèles juridiques » pour le texte concret prêt à intégrer.

Contenu recommandé :

- fournisseur IA utilisé ;
- statut DPA ;
- statut ZDR ;
- localisation et garanties contractuelles ;
- pseudonymisation post-OCR ;
- absence d'entraînement sur données client si le contrat le confirme ;
- journalisation des traitements ;
- droit de désactiver l'IA par dossier ;
- procédure de suppression ;
- contact support / DPO.

Le texte doit rester factuel. Toute mention comme « hors CLOUD Act », « zero retention active » ou « aucune donnée stockée » doit être affichée uniquement si elle est prouvée contractuellement.

---

## Ordre d'exécution recommandé

### Lot 1 — Cadrage fournisseur et conformité

1. Créer l'organisation Mistral AI Studio.
2. Passer en pay-as-you-go.
3. Créer les clés `dev`, `staging`, `prod`.
4. Demander ZDR.
5. Archiver DPA et conditions.
6. Rédiger la clause mandat CGP.
7. Rédiger le registre RGPD initial.

Livrable : SER1 peut appeler Mistral en environnement de test avec un cadre contractuel documenté.

### Lot 2 — Prototype documentaire SER1

1. Créer les tables et le bucket privé.
2. Construire l'upload.
3. Brancher OCR Mistral sur un document.
4. Stocker les pages OCR.
5. Afficher la trace document / page.

Livrable : un CGP peut uploader un PDF et voir que SER1 l'a lu.

### Lot 3 — Extraction sourcée

1. Définir le schéma patrimonial V1.
2. Extraire les champs d'un avis d'impôt.
3. Extraire les champs d'un relevé de situation épargne.
4. Extraire les champs d'un livret de famille ou acte civil.
5. Stocker les sources.
6. Afficher les points incertains.

Livrable : SER1 produit un JSON patrimonial sourcé, sans valeur non justifiée.

### Lot 4 — UX validation CGP

1. Construire l'écran « données prêtes / points à confirmer ».
2. Ajouter la correction manuelle.
3. Ajouter la validation bloquante.
4. Ajouter la trace de validation.
5. Ajouter la vue source document / page.

Livrable : le CGP contrôle vite ce qui compte vraiment.

### Lot 5 — Moteurs et étude automatique

1. Mapper le dossier validé vers les entrées moteurs.
2. Lancer les calculs SER1.
3. Construire les questions objectifs sous forme de champs structurés, sans chat libre.
4. Générer l'étude automatique depuis les calculateurs, templates et textes contrôlés SER1.
5. Afficher les calculs justifiant les recommandations ou pistes retenues.

Livrable : l'étude est produite par SER1 à partir des données validées, pas par un LLM.

### Lot 6 — PPTX et pilote cabinet

1. Brancher l'export PPTX.
2. Ajouter les slides d'hypothèses et limites.
3. Tester sur 10 dossiers pilotes.
4. Mesurer les corrections CGP.
5. Ajuster les seuils de validation.
6. Préparer la mise en production limitée.

Livrable : un cabinet peut produire une étude patrimoniale fiable et relisible.

---

## Calendrier prévisionnel V1

Hypothèse : 1 dev référent + Codex / Claude Code en assistance + 1 revue juridique externe.

| Période       | Lot                                      | Livrable cumulé                                                               |
| ------------- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| Semaine 1     | Lot 1 — Cadrage fournisseur + conformité | Compte Mistral opérationnel, DPA archivé, ZDR demandée, clause mandat rédigée |
| Semaines 2-3  | Lot 2 — Prototype documentaire           | Upload + OCR fonctionnel sur 1 document                                       |
| Semaines 4-5  | Lot 3 — Extraction sourcée               | JSON patrimonial V1 avec sources                                              |
| Semaine 6     | Lot 4 — UX validation CGP                | Écran « X prêts / Y à confirmer » utilisable                                  |
| Semaines 7-8  | Lot 5 — Moteurs + étude automatique      | Calculs SER1 branchés, étude automatique SER1                                 |
| Semaines 9-10 | Lot 6 — PPTX + pilote                    | Étude PPTX générée sur 10 dossiers pilotes                                    |

Jalons clés :

- **Fin semaine 1** : décision Go / No-Go conformité (DPA acceptable, ZDR demandée).
- **Fin semaine 3** : premier OCR fonctionnel sur un avis d'impôt synthétique.
- **Fin semaine 5** : démo extraction sourcée à un CGP pilote.
- **Fin semaine 8** : démo end-to-end interne.
- **Fin semaine 10** : pilote externe limité (1-2 cabinets).

---

## Point de départ — Semaine 1

Check-list opérationnelle pour démarrer dès lundi.

### Jour 1 — Compte Mistral et clés

1. Aller sur `console.mistral.ai`.
2. Créer une organisation `SER1`.
3. Activer le billing pay-as-you-go (carte ou virement entreprise).
4. Configurer un plafond mensuel initial, documenté hors repo.
5. Configurer des alertes de consommation avant épuisement du plafond.
6. Créer 3 workspaces : `dev`, `staging`, `prod` (ou 3 clés API distinctes si les workspaces sont indisponibles).
7. Générer une clé API par workspace, stocker dans le gestionnaire de secrets choisi (1Password, Bitwarden, etc.).
8. **Ne jamais** committer une clé dans le repo.

### Jour 2 — DPA et ZDR

1. Télécharger le DPA Mistral (`legal.mistral.ai/terms/data-processing-addendum`).
2. Lire le DPA, identifier les sous-traitants listés.
3. Archiver le PDF DPA dans le dossier conformité SER1 (hors repo si confidentiel).
4. Envoyer une demande ZDR à `privacy@mistral.ai` ou via le Trust Center, avec un motif clair :

   > Bonjour, nous opérons SER1, un outil SaaS pour Conseillers en Gestion de Patrimoine français. Notre traitement implique des documents personnels confidentiels (avis d'impôt, actes notariés, relevés bancaires). Nous souhaitons activer le mode Zero Data Retention sur notre compte SER1 (workspaces dev / staging / prod) pour garantir à nos cabinets et à leurs clients qu'aucune donnée n'est conservée par vos systèmes au-delà du temps de traitement. Merci de nous indiquer la procédure et les éventuelles conditions contractuelles applicables.

5. Archiver la demande et la réponse Mistral.

### Jour 3 — Juriste / DPO

1. Identifier un partenaire juridique : DPO externe mutualisé (Lexing, FORPP, DPO Connect, Dipeeo…) ou cabinet d'avocats spécialisé RGPD / CGP.
2. Demander un devis pour :
   - revue du DPA Mistral et qualification responsable / sous-traitant ;
   - rédaction de la clause mandat CGP ;
   - rédaction du registre RGPD article 30 ;
   - avis juridique global sur la chaîne SER1.
3. Budget cible à cadrer hors repo selon la profondeur de revue attendue.
4. Programmer un kickoff dans la semaine.

### Jour 4 — Migration Supabase

1. Créer une branche `feat/p4-prototype-documentaire`.
2. Créer la migration Supabase avec les 7 tables (`patrimonial_cases`, `_documents`, `_document_pages`, `_extraction_runs`, `_extracted_fields`, `_validation_items`, `_pii_mapping`).
3. Créer le bucket Storage privé `patrimonial-documents`.
4. Écrire les RLS multi-cabinet : un cabinet ne voit que ses dossiers.
5. Tester la migration en local avec `supabase db reset`.
6. Lancer `npm run check`.

### Jour 5 — Premier appel OCR

1. Créer une Edge Function `supabase/functions/document-ai/index.ts`.
2. Configurer le secret `MISTRAL_API_KEY_DEV` côté Supabase.
3. Implémenter un POST `/ocr` qui prend un `document_id`, charge le fichier depuis Storage, appelle `mistral-ocr-latest`, stocke la sortie en base.
4. Tester sur un document synthétique (avis d'impôt fictif).
5. Vérifier le retour : markdown, tables, scores, bboxes.
6. Lancer `npm run test:deno`.

---

## Lien avec la roadmap globale (`docs/ROADMAP.md`)

Ce plan IA documentaire est l'**explosion détaillée de PR V2-14 — Scan documentaire** de la roadmap globale.

| PR roadmap globale                                            | Lots de ce plan | Phases couvertes             |
| ------------------------------------------------------------- | --------------- | ---------------------------- |
| PR V2-14 / lot infra — Décision infra + confidentialité       | Lot 1           | Conformité A à D             |
| PR V2-14 / lot extraction — Prototype extraction minimale     | Lots 2, 3, 4    | Dev 1 à 6                    |
| PR V2-14 / lot intégration — Intégration analyse patrimoniale | Lots 5, 6       | Dev 7 à 10, Conformité E à G |

Toute évolution structurante de ce plan doit être reflétée dans `docs/ROADMAP.md` § PR V2-14.

---

## Plan B fournisseur

Que faire si Mistral ne convient plus.

### Scénario 1 — ZDR refusé ou non contractualisé sur pay-as-you-go

Mistral indique que ZDR peut être demandé dans AI Studio, avec validation par le support. Si la demande est refusée, trop lente ou insuffisamment contractualisée :

- **Option A** : passer en Mistral Enterprise (négociation directe, engagement annuel et minimum mensuel à prévoir).
- **Option B** : continuer en pay-as-you-go sans ZDR, en informant clairement le CGP et le client final que les prompts peuvent être conservés temporairement par Mistral à des fins anti-abus. Tolérable en pilote interne, à éviter en production commerciale grand public.
- **Option C** : basculer vers OVH AI Endpoints (LLM tiers hébergés en France, certaines configurations SecNumCloud-ready), en conservant Mistral OCR pour l'OCR uniquement.

### Scénario 2 — Client institutionnel exigeant souveraineté technique pure

- **Option D** : déployer un modèle open-weight Mistral en self-hosted sur infrastructure dédiée du client ou sur un cluster GPU SER1, via vLLM / TensorRT-LLM / TGI ou une offre entreprise Mistral adaptée. Coût significativement plus élevé, V2+ uniquement.

### Scénario 3 — Coût IA qui dérape

- Basculer l'extraction sur Mistral Medium 3.5 au lieu de Large 3.
- Cache OCR par hash document (un document re-uploadé n'est pas re-OCRisé).
- Structured output / JSON schema pour réduire les sorties inutiles et les erreurs.
- Validation déterministe avant escalade LLM.
- Prompt caching quand le fournisseur le permet.
- Batch API si le traitement n'est pas temps réel.
- Plafonnement reasoning / output.
- Plafond de coût par dossier.
- Pas d'escalade au-delà de GPT-5.2 en V2 ; aucun troisième fournisseur LLM ajouté sans nouveau cadrage AI Act + RGPD.
- Plafond mensuel SER1 par utilisateur avec dégradation gracieuse des fonctions IA.

**Recommandation V1** : démarrer pay-as-you-go avec ZDR demandée. Basculer Enterprise dès le passage en production commerciale ou si un cabinet pilote l'exige contractuellement.

---

## Pseudonymisation — implémentation concrète

### Où vit le module

Implémentation recommandée si le traitement IA reste dans Supabase Edge Functions :

```
supabase/functions/document-ai/lib/pii/
├── recognizers-fr.ts      # reconnaisseurs custom français
├── pseudonymizer.ts       # API publique : pseudonymize() / restore()
├── mapping-store.ts       # accès à la table de correspondance via service_role
└── recognizers-fr_test.ts
```

Alternative si SER1 ajoute un backend Node dédié :

```
api/document-ai/pii/
├── recognizers-fr.ts
├── pseudonymizer.ts
├── mapping-store.ts
└── recognizers-fr.test.ts
```

Le module est appelé **uniquement** côté backend. Il ne s'exécute jamais dans le frontend Vite.

Cohérence AGENTS.md : ne pas placer cette logique dans `src/features/**` ni dans `src/engine/**`, ne pas importer `src/**` depuis `supabase/functions/**`, et ne jamais exposer la table de correspondance au frontend. Les composants SER1 passent par une edge function ou un endpoint backend dédié.

### Reconnaisseurs français à implémenter

| Donnée                     | Détection                           | Remplacement  |
| -------------------------- | ----------------------------------- | ------------- |
| Nom de personne            | NER (Mistral ou modèle local léger) | `PERSON_<n>`  |
| Adresse postale            | NER + regex code postal FR          | `ADDRESS_<n>` |
| Email                      | regex standard                      | `EMAIL_<n>`   |
| Téléphone FR               | regex téléphone FR `+33` ou `0`     | `PHONE_<n>`   |
| NIR (sécurité sociale)     | regex norme INSEE                   | `NIR_<n>`     |
| Numéro fiscal de référence | 13 chiffres groupés                 | `TAXID_<n>`   |
| SIREN                      | 9 chiffres avec contrôle Luhn       | `SIREN_<n>`   |
| SIRET                      | 14 chiffres avec contrôle Luhn      | `SIRET_<n>`   |
| IBAN FR                    | regex IBAN commençant par `FR`      | `IBAN_<n>`    |
| RIB                        | regex banque / guichet / compte     | `RIB_<n>`     |

### Table de correspondance

Stockée dans `patrimonial_pii_mapping` :

| Colonne                    | Type        | Note                                      |
| -------------------------- | ----------- | ----------------------------------------- |
| `case_id`                  | uuid        | dossier                                   |
| `token`                    | text        | ex : `PERSON_1`                           |
| `original_value_encrypted` | bytea       | chiffré côté Supabase (pgsodium ou Vault) |
| `created_at`               | timestamptz |                                           |

RLS : seul le cabinet propriétaire et les edge functions privilégiées y accèdent.

### Cycle de vie

```
[Texte OCR avec PII]
  → pseudonymize(text, caseId)
  → [Texte tokenisé]
  → Mistral Large 3 (extraction / stratégie)
  → [Réponse tokenisée]
  → restore(response, caseId)
  → [Texte avec PII réinjectées]
  → SER1
```

### Précautions

- La pseudonymisation **n'est pas** une anonymisation au sens RGPD : les données restent réidentifiables via la table de correspondance.
- Elle reste utile : si un log fuit côté Mistral ou SER1, il ne contient pas les PII en clair.
- Documenter ce point dans le registre RGPD article 30.

### Alternative légère

Si Microsoft Presidio (open source, service Python séparé) est jugé trop lourd en V1, implémenter d'abord les reconnaisseurs ci-dessus en TypeScript natif (regex + NER léger via un petit appel Mistral). Migrer vers Presidio en V2 si le besoin est confirmé.

---

## Modèles juridiques (brouillons à valider par DPO)

⚠ Les textes ci-dessous sont des brouillons techniques. Ils doivent être validés par un juriste ou DPO avant production.

### Clause à insérer dans le mandat CGP

> **Article — Utilisation d'outils d'intelligence artificielle**
>
> Dans le cadre de la mission patrimoniale objet du présent mandat, le cabinet utilise l'outil SER1, qui intègre des fonctions d'intelligence artificielle pour assister l'analyse des documents que vous nous transmettez.
>
> Les documents et données personnelles sont traités par :
>
> - SER1 (responsable du traitement ou sous-traitant selon le contrat cabinet / SER1), pour la lecture, l'analyse et la production de l'étude patrimoniale ;
> - Mistral AI, société française, en qualité de sous-traitant ultérieur, pour la reconnaissance optique de caractères et l'aide à l'extraction structurée, sous Data Processing Agreement signé et avec demande ou activation contractuelle du mode de non-conservation des données (Zero Data Retention).
>
> Après la lecture OCR, les données personnelles identifiantes (nom, adresse, identifiants fiscaux et bancaires) sont remplacées par des codes neutres avant les analyses par intelligence artificielle générative qui ne nécessitent pas le document brut. Le cabinet et SER1 n'envoient aucun feedback contenant des données client et n'activent aucun usage des données client pour l'entraînement des modèles. Cette garantie doit être confirmée par le contrat fournisseur applicable.
>
> Le cabinet conserve la maîtrise des recommandations finales. Les stratégies comparatives s'appuient sur les calculs déterministes de SER1, les hypothèses validées et la validation humaine des points sensibles (régime matrimonial, donations, démembrement, clauses bénéficiaires, objectifs client, arbitrages de protection, transmission, revenus et liquidité, etc.).
>
> Vous pouvez à tout moment demander :
>
> - un traitement sans recours à l'IA pour votre dossier ;
> - l'accès, la rectification ou la suppression de vos données ;
> - la communication du registre des traitements applicable.
>
> Référent données personnelles du cabinet : [nom, fonction, email].

### Texte de la page conformité SER1 (front)

À afficher dans SER1 sous `/conformite` ou équivalent, accessible aux CGP et téléchargeable en PDF.

> ### Conformité et protection des données — SER1
>
> SER1 traite des documents patrimoniaux pour le compte des cabinets de Conseil en Gestion de Patrimoine. Cette page détaille notre dispositif de conformité RGPD.
>
> **Fournisseur d'intelligence artificielle**
> Mistral AI, société française (siège : Paris), hébergement Union Européenne par défaut. Les transferts temporaires éventuels liés aux fonctionnalités ou sous-traitants activés sont vérifiés dans le Trust Center et encadrés contractuellement.
>
> **Cadre contractuel**
> Data Processing Agreement signé avec Mistral AI. Archivé et disponible sur demande motivée.
>
> **Rétention des données chez Mistral**
> [État dynamique] : Zero Data Retention demandée / activée le [date] / refusée — bascule prévue [...].
>
> **Pseudonymisation**
> Les données identifiantes (nom, adresse, identifiants fiscaux et bancaires) sont remplacées par des codes neutres avant transmission aux services d'IA générative. La table de correspondance reste exclusivement dans SER1.
>
> **Entraînement des modèles**
> Les données client ne doivent pas être utilisées pour entraîner les modèles d'IA. SER1 désactive tout feedback contenant des données client et affiche cette garantie uniquement après confirmation contractuelle ou opt-out fournisseur documenté.
>
> **Journalisation**
> Chaque traitement IA est enregistré dans un registre article 30 RGPD : type de traitement, document concerné (par hash), date, utilisateur. Aucune donnée personnelle n'est conservée en clair dans les journaux applicatifs.
>
> **Désactivation de l'IA**
> Le cabinet peut désactiver les fonctions IA pour un dossier donné, à tout moment.
>
> **Suppression**
> La suppression d'un dossier dans SER1 entraîne la suppression : (i) des documents dans Supabase Storage, (ii) des données extraites en base, (iii) de la table de correspondance pseudonymisation associée. Une preuve de suppression est consultable.
>
> **Contact**
> Délégué à la Protection des Données SER1 : [email].

⚠ Les mentions « hors CLOUD Act », « données jamais sorties d'Europe », « anonymisation » sont à éviter sans validation contractuelle stricte. Préférer des formulations factuelles vérifiables.

---

## Tests qualité IA

Compléments à la Phase 10 du volet Dev SER1.

### Fixtures

Créer un répertoire `tests/fixtures/patrimonial/` avec au moins 10 dossiers de test :

1. `foyer-simple` : couple marié communauté, 2 enfants, salariés.
2. `divorce-en-cours` : jugement partiel.
3. `famille-recomposee` : enfants de différentes unions.
4. `chef-entreprise-dutreil` : pacte Dutreil en cours.
5. `assurance-vie-multiple` : 4 contrats avec clauses bénéficiaires différentes.
6. `per-multi-enveloppes` : PER individuels et collectifs.
7. `bilan-societe` : SAS avec immobilier d'exploitation.
8. `acte-donation` : donation-partage avec démembrement.
9. `regime-mixte` : changement de régime matrimonial documenté.
10. `dossier-incomplet` : documents flous, contradictions.

Chaque fixture contient :

- les documents source synthétiques (PDF générés) ;
- le JSON patrimonial attendu (`expected.json`) ;
- les points de validation attendus (`expected-validations.json`).

### Tests Vitest

| Test                              | Vérification                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------- |
| `extraction.golden.test.ts`       | Pour chaque fixture, sortie IA ≈ `expected.json` (tolérance sur les confiances) |
| `hallucination-refusal.test.ts`   | Champ absent du doc source ⇒ `value: "unknown"`, `reviewStatus: "a_confirmer"`  |
| `contradiction-detection.test.ts` | Deux documents donnent une date de naissance différente ⇒ flag contradiction    |
| `pseudonymizer-fr.test.ts`        | NIR, SIREN, IBAN détectés et remplacés correctement                             |
| `pii-restore.test.ts`             | Cycle pseudo → restore = identité texte                                         |
| `rls-multitenant.test.ts`         | Cabinet A ne voit ni les documents ni les extractions du cabinet B              |
| `case-deletion.test.ts`           | Suppression dossier ⇒ 0 ligne, 0 objet Storage, 0 pii_mapping                   |

### Tests d'intégration manuels (Lot 6)

- 10 dossiers réels (anonymisés) traités par 1 CGP référent.
- Métriques : nombre de corrections CGP par dossier, temps total, taux d'hallucinations détectées.
- Cible V1 acceptable : moins de 10 corrections par dossier moyen, plus de 90 % du contenu auto-validé sans intervention.

---

## Coûts

Les montants de prix, coûts fournisseurs, budgets internes et seuils commerciaux ne sont pas versionnés dans le repo. Ils vivent dans la documentation commerciale, financière ou conformité hors repo.

### Coût d'usage par dossier

Le coût d'usage est suivi dossier par dossier dans SER1, mais il ne structure pas la facturation client. Les tokens, pages OCR, retries et coûts fournisseur sont des métriques internes de pilotage.

Leviers de maîtrise :

- modèles économiques pour le gros du travail ;
- structured output / JSON schema ;
- validation déterministe avant escalade LLM ;
- prompt caching quand disponible ;
- batch si le traitement n'est pas temps réel ;
- plafonnement reasoning / output ;
- cache OCR par hash document ;
- plafond de coût par dossier ;
- Pas d'escalade au-delà de GPT-5.2 en V2 ; aucun troisième fournisseur LLM ajouté sans nouveau cadrage AI Act + RGPD.

### Principe tarifaire durable

SER1 retient un forfait fixe en 3 paliers fonctionnels, sans facturation au token :

- Basic : IA Mistral seule quand PR V2-14 V1 est livré.
- Pro : Mistral + GPT-5.2 quand la V2 multi-modèles est validée.
- Premium : Mistral + GPT-5.2 quand la V2 multi-modèles est validée, avec quota IA élargi et fonctionnalités avancées par rapport à Pro. Aucun troisième fournisseur LLM n'est ajouté en V2 : tout ajout (Anthropic, Google, autre) exige un nouveau cadrage AI Act + RGPD complet.

Les paliers Pro et Premium ne sont déverrouillés que si les évals qualité et la conformité fournisseur valident l'usage des modèles concernés.

### Synthèse budget V1

L'enjeu n'est pas de refacturer l'IA à l'usage ; c'est de construire une expérience fiable, défendable et commercialisable. Les simulateurs déterministes, la saisie manuelle et les exports restent utilisables même si le budget IA mensuel est épuisé.

---

## Définition de fiabilité

La V1 est acceptable seulement si :

- aucune donnée critique n'est auto-validée sans source ;
- aucune recommandation ne repose sur une valeur non validée, une hypothèse implicite ou une sortie IA non contrôlée ;
- chaque scénario stratégique est comparable à la situation actuelle et relié aux calculs SER1 ;
- les contradictions documentaires sont remontées ;
- les corrections CGP sont tracées ;
- le PPTX reprend les hypothèses utiles ;
- la suppression dossier supprime aussi les documents et la table de correspondance PII ;
- la conformité fournisseur est documentée ;
- `npm run check` passe ;
- les tests Deno passent si Supabase Edge Functions sont modifiées.

---

## Risques et rollback

| Risque                                       | Mitigation                                                                  | Rollback                                                           |
| -------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| ZDR refusée ou non activée                   | Continuer en prototype sans données réelles, ou contractualiser Enterprise. | Désactiver les appels IA sur dossiers réels.                       |
| OCR insuffisant sur manuscrit                | Ajouter validation obligatoire et second fournisseur plus tard.             | Garder l'upload + validation manuelle sans extraction automatique. |
| Coût IA trop élevé                           | Batch, seuils, modèle moins cher, cache OCR.                                | Limiter le nombre de pages par dossier pilote.                     |
| Trop de points à valider                     | Améliorer schémas, seuils et regroupements UX.                              | Revenir à une validation par document prioritaire.                 |
| Mauvaise qualification RGPD                  | Revoir contrats et information client avec DPO / juriste.                   | Bloquer la production commerciale.                                 |
| Fuite inter-cabinet                          | Tests RLS, chemins Storage tenant-scopes, audit.                            | Couper la feature documentaire et purger les buckets concernés.    |
| Hallucination LLM validée par erreur         | Tests golden + validation humaine obligatoire sur points critiques.         | Forcer revue intégrale du dossier impacté + correctif.             |
| Dépendance Mistral (panne, hausse tarifaire) | Architecture découplée, contrat de niveau de service.                       | Bascule OVH AI Endpoints ou pause temporaire.                      |

---

## Sources consultées

- Mistral AI Pricing : https://mistral.ai/pricing
- Mistral AI Studio tiers : https://docs.mistral.ai/admin/user-management-finops/tier
- Mistral Document AI : https://docs.mistral.ai/studio-api/document-processing/overview
- Mistral OCR Processor : https://docs.mistral.ai/studio-api/document-processing/basic_ocr
- Mistral ZDR : https://help.mistral.ai/en/articles/347612-can-i-activate-zero-data-retention-zdr
- Mistral DPA : https://legal.mistral.ai/terms/data-processing-addendum
- Mistral Large 3 : https://docs.mistral.ai/models/model-cards/mistral-large-3-25-12
- Mistral Medium 3.5 : https://docs.mistral.ai/models/model-cards/mistral-medium-3-5-26-04
- CNIL sous-traitant : https://www.cnil.fr/fr/qualification-juridique-sous-traitance
- CNIL rôles responsable / sous-traitant : https://www.cnil.fr/fr/rgpd-comment-bien-identifier-son-role
- CNIL anonymisation et pseudonymisation : https://www.cnil.fr/fr/technologies/lanonymisation-de-donnees-personnelles
- OVH AI Endpoints (Plan B) : https://www.ovhcloud.com/en/public-cloud/ai-endpoints/
- Microsoft Presidio (pseudonymisation) : https://microsoft.github.io/presidio/
