# Session Brainstorming - Extraction Documents Clients & RGPD - SER1

**Date** : 10 janvier 2026  
**Participants** : Développeur SER1 + Mary (Analyste Business)  
**Sujet** : Intégration chargement de pièces clients avec extraction automatique et conformité RGPD  

---

## Résumé Exécutif

**Session** : Brainstorming extraction documents & RGPD  
**Durée totale** : 35 minutes  
**Techniques utilisées** : First Principles Thinking, Reversal/Inversion, What If Scenarios  
**Total idées générées** : 15+ concepts structurés  

**Objectif** : Intégration chargement pièces clients avec extraction automatique et conformité RGPD maximale  

**Résultat clé** : Stratégie hybride innovante - Vision expert (scénario 3) pour lancement → Apprentissage continu (scénario 2) pour évolution  

**Principes fondamentaux identifiés** :
1. Zero stockage noms clients (RGPD absolu)
2. Extraction maximale avis d'impôt (données structurées)  
3. Intégration fluide SER1 (1-clic upload → auto-remplissage)
4. **FIABILITÉ EXTRACTION** (critique pour adoption)

**Thématiques documentaires** : Banque/Épargne, Famille/Identité, Entreprise, Prévoyance/Crédits, Succession/Donation, Train de vie

---

## Techniques Utilisées

### 1. First Principles Thinking (Principes Fondamentaux)
**Durée** : 10 minutes  
**Objectif** : Décomposer le problème en éléments essentiels

---

## Idées Générées

### Technique 1 : First Principles Thinking

**Question fondamentale** : Quels sont les 3 éléments absolument essentiels que votre solution doit accomplir ?

**Réponses du participant** :
1. **Zero stockage noms clients** - Contrainte RGPD absolue, aucune donnée personnelle persistante
2. **Extraction maximale avis d'impôt** - Nombre déclarants, détail revenus, déductions automatiques
3. **Intégration fluide SER1** - Import organisé et efficace dans la page /audit existante

**Approfondissement des principes fondamentaux** :

**Principe 1 - Zero stockage** : La confiance utilisateur est clé. Une méthode "ultra safe" avec disclaimer rassurant augmentera l'adoption. La méfiance des utilisateurs peut bloquer complètement l'utilisation de cette fonctionnalité.

**Principe 2 - Extraction avis d'impôt** : Document extrêmement riche en informations structurées :
- Situation familiale (C=Célibataire, D=Divorcé, etc.)
- Types revenus → statut professionnel (salarié/TNS/fonctionnaire)
- Revenus fonciers → parc immobilier
- Dividendes → détention société  
- BNC/BA/BIC → profession libérale/agricole/commerçant
- Nombre parts → enfants à charge
- Croisement des indices pour validation

**Principe 3 - Flux utilisateur optimal** : 1 clic upload → chargement documents → 1 clic "analyser" → fenêtre ferme → champs pré-remplis avec alerte vérification

---

### 2. Reversal/Inversion (Inversion)
**Durée** : 15 minutes  
**Objectif** : Explorer des solutions "privacy-first" en inversant la problématique

**Question inversée** : Comment accomplir la même tâche SANS JAMAIS avoir les données personnelles sur nos serveurs, même pendant 1 seconde ?

**Explication pour le participant** :
Imaginez que le navigateur de l'utilisateur est un mini-ordinateur ultra-puissant qui peut :
- Lire et analyser les PDF directement
- Faire de la reconnaissance de texte (OCR) 
- Extraire les données structurées
- Mais ne JAMAIS envoyer les données brutes au serveur

Seulement les résultats analysés (champs de formulaire) seraient envoyés, pas les documents originaux.

**Idées générées** :
- **Solution 1** : Navigateur comme "scanner intelligent" - extraction directe champs structurés
- **Solution 2** : "Tampon volatil" - mémoire temporaire avec destruction immédiate  
- **Solution 3** : "Traitement local distribué" - règles spécifiques par type de document

**Contrainte additionnelle découverte** : **FIABILITÉ EXTRACTION** - La fiabilité du scan est critique, sans fiabilité le système est inutile. Doit garantir un remplissage cohérent.

**Analyse détaillée des documents et fiabilité** :

**Documents faciles** (structure standardisée) :
- **Avis d'impôt** : Structure toujours identique → extraction très fiable

**Documents complexes** (nécessitent reconnaissance avancée) :

**Thématique Banque/Épargne** :
- **Relevés bancaires** : Montant actuel, variation 01/01-31/12, type livret (A/B/LDD)
- **PER** : Montant, variation, type (PERin/PEROB/PERCO), compagnie, allocation UC/fonds €, performance
- **Assurance vie** : Montant, variation, type, compagnie, allocation, performance
- **CTO/PEA** : Idem PER
- **Épargne salariale** : Idem + détection PERCO/PEE

**Thématique Famille/Identité** :
- **Livret de famille** : Composition familiale (parfois manuscrit), contrat de mariage
- **Pièces d'identité** : Date de naissance (passeport/CNI)

**Thématique Entreprise** :
- **Bilan SARL/SAS** : Type, capital social, trésorerie, charges dirigeant (compte 6), rémunération, charges sociales, contrat Madelin, % associés (via CNI)
- **Bilan SC/SCI** : Actifs, crédits restants, trésorerie, % associés

**Thématique Prévoyance/Crédits** :
- **Prévoyance** : Sommes assurées (décès/arrêt travail/invalidité)
- **Crédits** : Mensualité, CRD (via tableau amortissement + date effet), ville bien

**Thématique Succession/Donation** :
- **Contrat mariage** : Type contrat, DDV (parfois manuscrit)
- **Donation** : Qui→qui, montant, forme (pleine propriété/démembrement)

**Thématique Train de vie** :
- **Relevés bancaires** : Dépenses courantes (EDF, eau...), budget mensuel

**Principes d'organisation** :
- Regrouper par thématiques lors du chargement pour lisibilité
- Plus on intègre, plus le CGP sera satisfait
- Expertise disponible pour guider sur fiabilité de chaque champ (100% fiable vs à croiser)

---

### 3. What If Scenarios (Scénarios Hypothétiques)
**Durée** : 10 minutes  
**Objectif** : Stimuler l'innovation sur les contraintes techniques

**Scénarios explorés** :
- **Scénario 1** : "Mini-IA par banque" - extracteurs spécialisés BNP, CA, LCL...
- **Scénario 2** : "Apprentissage continu" - le système apprend des corrections du CGP
- **Scénario 3** : "Vision expert" - identification des zones importantes comme un CGP

**Sélection du participant** :
- **Scénario 2 choisi** comme objectif final (capable d'entraîner avec exemples)
- **Scénario 3 choisi** comme point de départ pour le lancement (vision expert immédiate)

**Stratégie hybride identifiée** : Commencer avec vision expert (scénario 3) → évoluer vers apprentissage continu (scénario 2)

---

## Catégorisation des Idées

**Opportunités Immédiates** (prêtes à développer) :
- MVP Avis d'Impôt avec "vision expert" (structure standardisée)
- Architecture "privacy-first" 100% navigateur (tampon volatil)
- Organisation par thématiques lors de l'upload
- Extraction champs fiables : nombre parts, revenus, situation familiale

**Innovations Futures** (nécessitent R&D) :
- Système d'apprentissage continu basé sur corrections CGP
- Reconnaissance documents manuscrits (livret famille, contrat mariage)
- Validation croisée entre documents
- Confidence scoring par champ extrait

**Concepts Ambitieux** (long terme) :
- IA spécialisée par banque/assureur
- Intelligence collective partagée entre CGP
- Prédiction automatique des besoins documentaires

**Apprentissages Clés** :
- Fiabilité extraction = critique pour adoption
- Confiance utilisateur = liée à transparence RGPD
- Expertise métier = différenciant majeur
- Stratégie hybride = vision expert → apprentissage continu

---

## Plan d'Action

**Top 3 des idées prioritaires** :
1. **MVP Avis d'Impôt** - Le plus facile, démontre la valeur rapidement, structure standardisée
2. **Architecture RGPD** - Fondation technique critique, traitement 100% navigateur, tampon volatil
3. **Framework thématique** - Structure évolutive pour tous les documents, organisation par catégories

**Prochaines étapes** :
- Recherche bibliothèques JavaScript pour extraction PDF/OCR côté client
- Prototypage interface upload avec thématiques
- Définition patterns d'extraction pour avis d'impôt
- Tests fiabilité sur échantillons documents

**Ressources nécessaires** :
- Expertise JavaScript/React pour extraction navigateur
- Bibliothèques OCR client-side (Tesseract.js ou similaire)
- Échantillons documents pour tests (avis d'impôt variés)
- Expertise métier pour validation patterns

**Considérations temporelles** :
- Phase 1 (MVP) : 2-3 mois - Avis d'impôt fonctionnel
- Phase 2 (Extension) : 6-12 mois - Documents bancaires/épargne
- Phase 3 (Avancé) : 12-18+ mois - Apprentissage continu, documents complexes

---

## Réflexions & Suivi

**Session réussie** : Exploration complète du problème, identification solution hybride innovante
**Points forts** : Expertise métier claire, contraintes RGPD bien définies, stratégie progressive réfléchie
**Recommandations** : Commencer petit avec MVP, itérer rapidement, maintenir focus fiabilité
**Prochaine session** : Prototypage technique et validation patterns d'extraction
