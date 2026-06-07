# Fiche contrat simulateur

## Identité

- Nom du simulateur :
- Route cible :
- Statut prévu :
- Responsable métier :

## Objectif métier

- Objectif métier :
- Question client traitée :
- Décision CGP attendue :

## Inputs

### Inputs manuels

- Champ :
- Format attendu :
- Validation :
- Override local autorisé : oui/non, justification :

### Inputs issus du dossier central

- Champ dossier central :
- Adapter prévu :
- Provenance affichée :
- Condition d'arrêt si le champ ou le modèle central n'existe pas :

### Inputs issus de documents/evidence

- Evidence attendue :
- SourceRef ou référence documentaire :
- Niveau de confiance attendu :
- Validation CGP requise : oui/non :

### Inputs issus des settings fiscaux

- Paramètre fiscal :
- Chemin de consommation :
- Référence fiscale :
- Interdiction de valeur en dur vérifiée par :

## Outputs

- KPI :
- Tableaux :
- Graphiques :
- Alertes :
- Recommandations :
- Outputs structurés réutilisables par dossier, stratégie ou exports :

## Règles métier et fiscales

- Règle :
- Source :
- Moteur ou domaine responsable :
- Cas limites :
- Simplifications assumées :

## Références nécessaires

- Référence légale ou métier :
- Evidence produit :
- Documentation SER1 à mettre à jour :

## Dépendances fondations

- Dossier patrimonial central :
- Adapter de contexte :
- Registry simulateurs :
- Settings fiscaux :
- Supabase/RLS/Storage :
- Base-Contrat :

## Impact exports

- Export PPTX :
- Export Excel :
- Snapshot `.ser1` :
- Test de parité requis :

## Tests

### Tests unitaires

- Cas nominal :
- Cas limite :
- Cas d'erreur :

### Tests d'intégration

- Chaîne dossier central vers adapter :
- Chaîne settings fiscaux :
- Chaîne export :

### E2E métier

- Parcours authentifié :
- Interaction métier minimale :
- Assertion de sortie :

### Fixtures golden

- Fixture :
- Source :
- Critère de stabilité :

## Risques LLM

- Donnée sensible ou personnelle :
- Hallucination possible :
- Evidence insuffisante :
- Validation humaine requise :
- Garde-fou prévu :

## Conditions d'arrêt

- Modèle de dossier central absent :
- Adapter impossible à définir :
- Référence fiscale ou métier manquante :
- Evidence obligatoire absente :
- Test ou export non vérifiable :
- Risque LLM non borné :
