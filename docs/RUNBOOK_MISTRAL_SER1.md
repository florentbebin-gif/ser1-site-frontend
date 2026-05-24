# RUNBOOK MISTRAL SER1

> Date de cadrage : 2026-05-22
>
> But : permettre à un LLM ou à un développeur dans le repo SER1 de comprendre rapidement ce qu'est Mistral AI Studio / Admin, quoi vérifier le jour J, quoi demander à l'utilisateur, puis comment brancher l'OCR documentaire SER1 sans dériver vers un usage non conforme.

---

## Résumé opérationnel

SER1 doit utiliser **Mistral AI Studio API** pour les vrais dossiers clients, jamais Le Chat comme pipeline applicatif.

- `admin.mistral.ai` : gouvernance organisation, abonnement, facturation, limites, clés API, workspaces, confidentialité.
- `console.mistral.ai` : espace développeur pour tester Document AI, Playground, Batches, Agents, Files.
- SER1 V1 : backend SER1 -> API Mistral -> résultats stockés dans SER1 -> validation CGP -> moteurs SER1 -> étude automatique SER1 -> PPTX.
- Le Chat : prototypage interne uniquement, sans documents clients réels tant que le cadre conformité n'est pas validé.
- Workflows Mistral : à surveiller, mais pas dépendance V1 pour les dossiers clients.

Doctrine V1 : Mistral lit et extrait ; SER1 stocke, contrôle, valide, calcule et restitue. Aucun chat libre CGP ↔ LLM n'est prévu dans l'app V1.

Frontière : ce runbook couvre la V1 Mistral-only. La V2 multi-modèles relève d'un orchestrateur SER1 séparé, **plafonné à deux fournisseurs (Mistral + GPT-5.2)** pour contenir la complexité réglementaire (DPA, SCC, AIPD, registre par fournisseur). Mistral ne décide jamais du routage modèle ; SER1 orchestre lui-même selon des règles déterministes. Aucun troisième fournisseur LLM n'est ajouté en V2 — détail dans `docs/AI_ACT_CADRAGE.md` (sections « Transferts internationaux et escalade multi-fournisseurs » et « Inventaire des systèmes IA SER1 »).

---

## État connu au 2026-05-22

État relevé par audit manuel utilisateur, à revérifier le jour J :

| Zone                  | État connu                                                                                    |
| --------------------- | --------------------------------------------------------------------------------------------- |
| Organisation          | `SER1`, 1 membre actif                                                                        |
| Workspace             | `Default Workspace` uniquement                                                                |
| Plan AI Studio        | `Scale` pay-as-you-go                                                                         |
| Le Chat               | plan Gratuit                                                                                  |
| Clés API organisation | aucune clé active au moment de l'audit                                                        |
| Budget mensuel        | plafond présent mais pas encore activé                                                        |
| API training          | toggle d'utilisation des appels API pour entraîner les modèles désactivé par défaut sur Scale |
| Chat retention        | politique actuelle à configurer ; décision SER1 : 30 jours                                    |
| ZDR                   | pas de bouton self-service visible ; demande via support / Help Center                        |
| Workflows             | Public Preview ; workers gérés en développement actif                                         |

Le choix initial SER1 est de garder `Default Workspace` au démarrage, puis de séparer `ser1-dev`, `ser1-staging`, `ser1-prod` uniquement quand le pipeline passe du prototype au pilote.

---

## Règles non négociables

1. Ne jamais mettre une clé API Mistral dans le frontend Vite.
2. Ne jamais committer une clé Mistral dans Git.
3. Ne jamais tester de vrais dossiers clients dans Le Chat, Libraries, Connectors ou Workflows sans validation conformité.
4. Ne jamais promettre ZDR tant que Mistral ne l'a pas confirmé par écrit pour le périmètre concerné.
5. Ne jamais dire que la pseudonymisation est une anonymisation RGPD.
6. Ne jamais laisser un fichier Mistral Files sans `expiry` ou suppression programmée si le fichier contient des données client.
7. Ne jamais faire calculer la fiscalité par le LLM : les calculs passent par les moteurs SER1.
8. Ne jamais accepter une valeur extraite sans source document / page / confiance / statut de validation.

---

## Comment lire les deux consoles Mistral

### `admin.mistral.ai`

Console d'administration de l'organisation.

À utiliser pour :

- vérifier l'organisation ;
- gérer membres et rôles ;
- gérer abonnement AI Studio et Le Chat ;
- configurer facturation ;
- créer ou révoquer les clés API organisation/workspace ;
- fixer les plafonds de dépenses ;
- lire les limites par modèle ;
- vérifier la confidentialité API / Le Chat ;
- suivre la consommation mensuelle.

### `console.mistral.ai`

Console développeur.

À utiliser pour :

- tester les modèles dans le Playground ;
- tester Document AI / OCR ;
- lire le JSON OCR ;
- tester des paramètres `table_format`, `confidence_scores_granularity`, annotations ;
- gérer Files pour batch ou OCR ;
- lancer Batches ;
- créer des Agents de prototype ;
- explorer Fine-tune.

Pour SER1 V1, les zones utiles sont : API Keys, Document AI, Playground, Files, Batches. Agents, Workflows, Connectors et Fine-tune restent hors socle V1.

---

## Jour J — check-list avant tout développement

### Étape 1 — Vérifier le compte

Dans `admin.mistral.ai` :

1. Ouvrir l'organisation `SER1`.
2. Vérifier que le plan AI Studio est `Scale`.
3. Vérifier que le workspace actif est `Default Workspace`.
4. Noter les limites visibles dans `Admin > Limites`.
5. Vérifier que le toggle API training reste désactivé.
6. Prendre une capture de l'état plan + limites + confidentialité pour le dossier conformité hors repo.

Décision SER1 : tant que la V1 est en prototype, garder `Default Workspace`. Ne pas créer des workspaces par fonction OCR / Agents ; ce découpage ajoute de la gestion sans gain immédiat.

### Étape 2 — Configurer le budget

Dans `Admin > Limites` :

1. Activer la limite mensuelle de dépenses API et Vibe.
2. Configurer les seuils par environnement dans le dossier conformité hors repo.
3. Ajuster la production cabinet selon volume, marge et paliers commercialisés.
4. Documenter le seuil hors repo si la valeur est commerciale ou financière.

Effet attendu : quand la limite fournisseur est atteinte, l'API est suspendue jusqu'au mois suivant ou jusqu'à augmentation de la limite. SER1 doit gérer cette erreur comme une coupure des fonctions IA, pas comme une panne des simulateurs déterministes.

SER1 doit également tracer ses propres plafonds :

- état du plafond par dossier ;
- état du plafond mensuel utilisateur ;
- fournisseur et modèle appelés ;
- coût estimé ;
- dossier ou document concerné par hash ;
- raison d'appel ;
- statut DPA / ZDR pertinent.

Si le plafond IA est épuisé, le scan documentaire, la complétion IA et la validation guidée enrichie sont coupés jusqu'au reset. Les simulateurs déterministes, la saisie manuelle et les exports PPTX / XLSX restent disponibles.

### Étape 3 — Régler Le Chat

Dans `Admin > Le Chat > Confidentialité` :

1. Mettre la suppression automatique des chats à 30 jours.
2. Désactiver l'utilisation des chats pour entraîner les modèles si le toggle est disponible.
3. Interdire les feedbacks Le Chat contenant des données client.
4. Désactiver les usages avec vrais dossiers clients tant que le périmètre n'est pas validé.

Règle SER1 : Le Chat peut aider l'équipe à réfléchir, mais le pipeline client passe par l'API.

### Étape 4 — Créer la clé API

Dans `Admin > Clés API` ou `Studio > API Keys` :

1. Créer une clé nommée `ser1-default-dev`.
2. La rattacher à `Default Workspace`.
3. Mettre une expiration à 90 jours pour prototype.
4. Pour la portée connecteurs, choisir l'option la plus restrictive si les connecteurs ne sont pas utilisés.
5. Copier la clé une seule fois.
6. Stocker la clé dans le gestionnaire de secrets choisi.
7. Côté SER1, la clé doit être injectée uniquement dans le backend :
   - Supabase Edge Function : secret Supabase ;
   - backend Node éventuel : variable d'environnement serveur ;
   - jamais `VITE_*`.

Il n'y a pas de scope granulaire OCR/completion connu au jour de l'audit. La réduction de risque passe par workspace, expiration, rotation, budget et journalisation SER1.

### Étape 5 — Tester la clé

Depuis un environnement backend ou local sécurisé :

1. Appeler `/v1/models`.
2. Vérifier que la réponse liste les modèles.
3. Appeler OCR sur un document synthétique.
4. Vérifier que la consommation apparaît dans `Admin > Utilisation`.
5. Supprimer toute clé de test devenue inutile.

Ne jamais faire ce test depuis du code frontend.

### Étape 6 — Demander ZDR

ZDR n'est pas self-service dans l'UI connue. Pour SER1 :

1. Contacter Mistral via Help Center / support / commercial.
2. Donner le motif : documents patrimoniaux clients, RGPD, données bancaires, fiscales, civiles et actes juridiques.
3. Demander explicitement le périmètre :
   - chat completions API ;
   - OCR ;
   - Files ;
   - Batches ;
   - Workflows ;
   - Agents API ;
   - Libraries si jamais utilisées.
4. Archiver la réponse écrite hors repo.
5. Ne pas afficher "ZDR activée" dans SER1 tant que la confirmation écrite n'existe pas.

Formulation prudente avant confirmation : "ZDR demandée, non confirmée contractuellement".

---

## Limites connues à surveiller

Limites observées sur le plan Scale au 2026-05-22 :

| Modèle                                  |                   Tokens/min |   Tokens/mois |    RPS |
| --------------------------------------- | ---------------------------: | ------------: | -----: |
| `mistral-ocr-2505` / `mistral-ocr-2512` |                    2 000 000 |   Non affiché |   6.00 |
| `mistral-large-2512`                    |                    2 000 000 |   Non affiché |   6.00 |
| `mistral-medium-2505`                   |                      600 000 |   Non affiché |   1.67 |
| `mistral-small-2506`                    |                    5 000 000 |   Non affiché |  20.83 |
| `mistral-embed-2312`                    |                   20 000 000 | 200 milliards |   6.00 |
| `magistral-medium-2509`                 | limite basse visible console |   Non affiché | faible |
| `magistral-small-2509`                  | limite basse visible console |   Non affiché | faible |

Résumé Scale visible dans l'abonnement :

- 6 requêtes / seconde, extensible sur demande ;
- 2 M tokens d'entrée / minute, extensible sur demande ;
- 10 B tokens d'entrée / mois, extensible sur demande ;
- limites embedding séparées.

Ces limites sont à redater dans la doc de PR si elles sont utilisées pour dimensionner un batch.

---

## Document AI — paramètres SER1 recommandés

### Modèle OCR

Utiliser :

- `mistral-ocr-latest` si l'on veut suivre la dernière version ;
- `mistral-ocr-2512` si l'on veut figer une version avec tables / headers / footers, selon disponibilité.

En production, figer la version modèle pendant une campagne de test pour éviter les variations silencieuses.

### Paramètres par défaut

Pour un dossier CGP standard :

```json
{
  "model": "mistral-ocr-latest",
  "confidence_scores_granularity": "page",
  "table_format": "markdown",
  "extract_header": false,
  "extract_footer": false,
  "include_image_base64": false
}
```

Raisons :

- `page` suffit pour qualifier la qualité globale sans exploser la taille de réponse.
- `markdown` garde une sortie légère et lisible.
- images base64 désactivées par défaut pour éviter des payloads énormes.

### Paramètres pour documents financiers

Pour tableaux d'amortissement, bilans, relevés de situation, avis d'impôt complexes :

```json
{
  "confidence_scores_granularity": "page",
  "table_format": "html",
  "extract_header": true,
  "extract_footer": true
}
```

Raisons :

- `html` conserve mieux la structure des tableaux ;
- headers / footers peuvent porter année, référence client, numéro de page, version.

### Paramètres pour pages critiques

Pour pages floues, manuscrites ou juridiquement sensibles :

```json
{
  "confidence_scores_granularity": "word",
  "bbox_annotation_format": {
    "type": "json_schema"
  }
}
```

À utiliser seulement sur pages ciblées, pas sur tout le dossier, car le payload peut devenir lourd.

### Champs OCR utiles à stocker dans SER1

Stocker au minimum :

- `model` ;
- `usage_info` ;
- `pages[index]` ;
- `pages[markdown]` ;
- `pages[tables]` si présent ;
- `pages[confidence_scores]` ;
- `pages[dimensions]` ;
- `pages[header]` / `pages[footer]` si activés ;
- `document_annotation` si extraction structurée demandée ;
- hash SHA-256 du document source SER1.

Ne pas stocker d'image base64 en base si ce n'est pas strictement nécessaire.

---

## Modes d'envoi des documents

### Mode recommandé V1 interactif

Pour le parcours CGP :

1. Le document est uploadé dans Supabase Storage privé.
2. SER1 crée une URL signée courte ou encode le document en base64 côté backend.
3. SER1 appelle `/v1/ocr`.
4. SER1 stocke le résultat OCR dans ses tables.
5. L'URL signée expire.

Avantage : pas de fichier persistant dans Mistral Files.

### Mode Files

Utiliser `/v1/files` seulement si nécessaire :

- batch OCR ;
- documents très volumineux ;
- reprise asynchrone ;
- besoin de référencer un fichier dans plusieurs requêtes.

Règles :

1. Toujours définir `purpose`: `ocr` ou `batch`.
2. Toujours définir `expiry`.
3. Ne jamais laisser `expiry: null` sur un fichier client.
4. Après récupération du résultat, appeler `DELETE /v1/files/{file_id}`.
5. Journaliser `file_id`, `purpose`, `expires_at`, `deleted_at` dans SER1.

### Mode Batch

Le batch est utile pour :

- traiter beaucoup de documents hors interaction utilisateur ;
- retraiter une bibliothèque de documents ;
- relancer un lot après correction de prompt ;
- réduire les coûts si Mistral applique une tarification batch avantageuse.

Règles batch :

1. Préparer un `.jsonl` de requêtes.
2. Uploader le fichier avec `purpose: batch` et `expiry`.
3. Créer le batch sur l'endpoint `/v1/ocr`.
4. Récupérer les résultats via le fichier de sortie.
5. Supprimer input et output via Files API.
6. Ne pas utiliser batch pour un CGP qui attend une réponse immédiate.

---

## Ce qu'il ne faut pas utiliser en V1 client

### Le Chat

Ne pas y déposer de vrais documents clients.

Raisons :

- ZDR n'est pas disponible sur Le Chat selon la doc Mistral ;
- l'historique et les mémoires sont des fonctions utiles mais difficiles à borner pour un dossier client ;
- les feedbacks utilisateur peuvent autoriser un usage des données de feedback.

Usage autorisé :

- réflexion interne ;
- documents synthétiques ;
- prompts sans PII ;
- tests de style.

### Libraries

Ne pas utiliser Libraries pour les dossiers clients V1.

Raison : les documents restent stockés tant que la Library existe dans un compte actif. C'est utile pour une base documentaire interne, pas pour des dossiers clients sensibles.

Usage possible :

- documentation SER1 publique ;
- textes réglementaires publics ;
- documents synthétiques ;
- base de connaissances interne non client.

### Workflows

Ne pas mettre de dossiers clients dans Workflows en V1.

Raisons :

- Public Preview ;
- APIs et fonctionnalités susceptibles de changer ;
- orchestration exécutée côté Mistral ;
- région, secrets, logs et isolement à clarifier contractuellement.

SER1 doit orchestrer lui-même : Supabase Edge Function ou backend Node -> API Mistral -> stockage SER1.

### Connectors

Ne pas connecter Google Drive, Gmail, Outlook, Notion, Slack ou autres outils clients en V1.

Raison : surface RGPD et contrôle d'accès trop larges pour le premier périmètre.

### Fine-tune

Ne pas fine-tuner en V1.

Attendre :

- 50 à 100 dossiers traités ;
- fixtures synthétiques solides ;
- erreurs répétables ;
- dataset nettoyé juridiquement ;
- décision conformité.

---

## Journalisation SER1 obligatoire

Comme Mistral ne montre pas la dernière utilisation d'une clé dans la liste des clés API, SER1 doit tracer ses propres appels.

Table ou log applicatif recommandé :

| Champ                         | Description                                                 |
| ----------------------------- | ----------------------------------------------------------- |
| `request_id`                  | id interne SER1                                             |
| `case_id`                     | dossier patrimonial                                         |
| `document_id`                 | document SER1                                               |
| `provider`                    | `mistral`                                                   |
| `workspace`                   | `Default Workspace` puis workspace dédié si créé            |
| `model`                       | modèle OCR / LLM                                            |
| `endpoint`                    | `/v1/ocr`, `/v1/chat/completions`, `/v1/files`, `/v1/batch` |
| `started_at` / `completed_at` | durées                                                      |
| `status`                      | success / error / retry                                     |
| `usage_info`                  | coût, pages, tokens si disponibles                          |
| `case_budget_status`          | état du plafond de coût par dossier                         |
| `user_month_budget_status`    | état du plafond IA mensuel utilisateur                      |
| `call_reason`                 | motif métier de l'appel                                     |
| `dpa_zdr_status`              | statut conformité fournisseur pertinent                     |
| `mistral_file_ids`            | ids Files à supprimer si utilisés                           |
| `cleanup_status`              | pending / done / failed                                     |

Ne jamais logger :

- nom client ;
- adresse ;
- NIR ;
- numéro fiscal ;
- IBAN ;
- extrait complet de document ;
- prompt complet contenant des données client.

---

## Checklist pour le LLM dans le repo

Quand l'utilisateur dit "on branche Mistral" ou "jour J", le LLM doit :

1. Lire ce fichier.
2. Lire `docs/PLAN_IA_DOCUMENTAIRE_SER1.md`.
3. Vérifier si une edge function `document-ai` existe déjà.
4. Vérifier si un schéma Supabase documentaire existe déjà.
5. Demander seulement les statuts manquants :
   - budget Mistral activé ?
   - clé API créée ?
   - clé stockée dans quel secret backend ?
   - Le Chat retention passée à 30 jours ?
   - ZDR demandée ou confirmée ?
   - DPA archivé ?
6. Ne pas demander de documents clients pour tester.
7. Proposer un test OCR sur document synthétique.
8. Implémenter d'abord le stockage / cleanup / audit, puis l'OCR.
9. Exécuter `npm run check` avant commit si du code est modifié.
10. Exécuter `npm run test:deno` si une edge function Supabase est modifiée.

Le LLM doit refuser toute demande implicite de "mets un vrai dossier client dans Le Chat pour tester" et proposer un document synthétique ou anonymisé.

---

## Séquence d'implémentation recommandée

### PR 1 — Préparation Mistral admin

Pas de code applicatif.

- Activer plafond mensuel.
- Régler Le Chat à suppression 30 jours.
- Vérifier training toggle API.
- Créer clé `ser1-default-dev` avec expiration.
- Stocker clé côté backend.
- Archiver DPA et demande ZDR.

### PR 2 — Socle Supabase documentaire

- Bucket privé documents patrimoniaux.
- Tables dossiers/documents/OCR runs/extracted fields/validation items.
- RLS cabinet.
- Cleanup complet document + OCR + mapping PII.

### PR 3 — Edge Function `document-ai`

- Secret Mistral côté Supabase.
- Endpoint OCR sur document synthétique.
- Stockage `pages`, `confidence_scores`, `usage_info`.
- Aucun log PII.
- Tests Deno.

### PR 4 — UX upload + statut OCR

- Upload CGP.
- Liste documents.
- Statut OCR.
- Erreurs lisibles.
- Pas encore de stratégie IA.

### PR 5 — Extraction structurée + validation CGP

- JSON schema patrimonial.
- Champs source/page/confiance.
- Contradictions.
- Écran "X prêts / Y à confirmer".

### PR 6 — Moteurs SER1 + étude automatique + PPTX

- Mapping dossier validé -> moteurs SER1.
- Questions objectifs structurées.
- Étude automatique produite par les calculateurs et templates SER1.
- Génération PPTX avec hypothèses et limites.

---

## Questions à poser à l'utilisateur le jour J

Poser seulement si l'information n'est pas déjà connue :

1. Le plafond mensuel Mistral est-il activé ? Valeur documentée hors repo ?
2. La clé API Mistral existe-t-elle ? Nom ? Expiration ?
3. Où est stockée la clé côté backend ?
4. Le Chat est-il réglé sur suppression 30 jours ?
5. Le toggle API training est-il bien désactivé ?
6. ZDR : demandée, acceptée, refusée, en attente ?
7. DPA Mistral archivé ?
8. Veux-tu rester sur `Default Workspace` pour ce sprint ?
9. Quel document synthétique utiliser pour le smoke test OCR ?

Ne pas poser :

- "Peux-tu me donner la clé API ?" dans le chat.
- "Peux-tu m'envoyer un vrai dossier client ?"

---

## Sources

- Admin Console : https://help.mistral.ai/en/articles/347441-what-is-the-admin-console
- Admin settings : https://help.mistral.ai/en/articles/347444-what-settings-can-i-configure-in-the-admin-console
- Workspaces et API keys : https://docs.mistral.ai/getting-started/quickstarts/admin/manage-workspaces
- Organisations et workspaces : https://docs.mistral.ai/admin/security-access/organization
- Usage limits : https://docs.mistral.ai/admin/user-management-finops/usage-limits
- Rate limits et tiers : https://docs.mistral.ai/admin/user-management-finops/tier
- Privacy : https://docs.mistral.ai/admin/security-access/privacy
- ZDR : https://help.mistral.ai/en/articles/347612-can-i-activate-zero-data-retention-zdr
- Training data opt-out : https://help.mistral.ai/en/articles/455207-can-i-opt-out-of-my-input-or-output-data-being-used-for-training
- Document retention Libraries : https://help.mistral.ai/en/articles/347580-where-are-uploaded-documents-stored-and-for-how-long
- OCR Processor : https://docs.mistral.ai/capabilities/OCR/basic_ocr
- OCR API : https://docs.mistral.ai/api/endpoint/ocr
- Files API : https://docs.mistral.ai/api/endpoint/files
- Batch inference : https://docs.mistral.ai/capabilities/batch/
- Batch OCR cookbook : https://docs.mistral.ai/resources/cookbooks/mistral-ocr-batch_ocr
- Workflows overview : https://docs.mistral.ai/studio-api/workflows/getting-started/overview
