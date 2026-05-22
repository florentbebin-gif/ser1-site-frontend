# ROADMAP (source de vérité)

## But

Piloter la trajectoire SER1 vers un outil premium, simple et fiable pour le conseil patrimonial :

- simulateurs cohérents entre eux ;
- paramètres fiscaux actualisables sans patch code ;
- livrables PowerPoint / Excel exploitables en rendez-vous ;
- gouvernance cabinet : utilisateurs, droits, identité visuelle.

> Cette roadmap ne contient que ce qui reste à faire.
> Les chantiers livrés sont tracés par commits et PR, pas par blocs `done` détaillés.

## Trajectoire 2026

Positionnement : SER1 est une plateforme de chiffrage patrimonial fiable, explicable et exportable. La cible produit prioritaire est le **dirigeant patrimonial 360°** : IR, société, PER, succession et prévoyance dans une chaîne fiscale cohérente. Cette cible reste roadmappée : la prévoyance n'est pas encore construite et reste portée par `PR-P6-03`.

Aucun pilote payant ne démarre avant le socle commercialisation complet. Ce socle est strictement time-boxé, en MVP :

- rôles et utilisateurs simples ;
- branding cabinet limité à logo + couleurs dans les exports ;
- dossiers clients durables ;
- page conformité de base sécurité / RLS / hébergement ;
- onboarding minimal.

La facturation in-app ne fait pas partie du socle pré-pilote : les 5 à 15 premiers pilotes restent facturés manuellement.

Principe tarifaire durable : forfait fixe en 3 paliers fonctionnels, aucune facturation au token. Les seuils commerciaux, montants et plafonds chiffrés restent hors repo.

Ordre d'exécution, sans créer de nouvelle phase :

1. Socle commercialisation — gate du premier pilote payant.
2. P6 — analyse patrimoniale durcie (audit, livrables client-ready), hors `PR-P6-03`.
3. P4 — scan documentaire IA Mistral, qui préremplit l'analyse patrimoniale.
4. P7 — stratégie avancée durcie.
5. `PR-P6-03` prévoyance.
6. P8 catalogue.

L'analyse patrimoniale passe avant le scan IA : la saisie manuelle est la base, le LLM n'est qu'un booster qui préremplit l'AP. P4 ne peut pas avancer tant que l'AP manuelle n'est pas opérationnelle.

## Principes non négociables

1. Une seule source de vérité pour les chiffres fiscaux : `Supabase → fiscalSettingsCache.ts → useFiscalContext.ts → settingsDefaults.ts`.
2. Aucun chiffre révisable en dur dans les moteurs, features ou règles Base-Contrat.
3. Chargement fiable sur les simulateurs critiques : pas de calcul silencieux avec valeurs provisoires.
4. Validation côté administration : tranches, bornes, taux et valeurs incohérentes doivent être bloqués.
5. Traçabilité des dossiers : un dossier sauvegardé doit indiquer si les paramètres fiscaux ont changé.
6. Documentation alignée : ce qui est vrai dans le code doit être vrai dans les docs.

## Definition of Done

- `npm run check` passe.
- Les preuves sont dans la PR : chemins fichiers, commandes `rg`, tests exécutés.
- Aucun comportement existant n'est cassé sans migration explicite.
- Les docs structurantes (`ARCHITECTURE`, `METIER`, `RUNBOOK`, `GOUVERNANCE`) sont mises à jour si le flux change.
- Aucun audit, plan temporaire ou note de clôture générée n'est versionné.

---

# P2 - Expérience rendez-vous : mode simplifié / mode expert

Objectif : rendre l'outil utilisable en rendez-vous sans intimider, tout en gardant une profondeur expert.

## PR-P2-01 - Décision produit : cadre simplifié / expert

Statut : `partiellement livré`

Travaux :

Livré : cadre produit documenté dans `docs/mode-simplifie-expert.md` et conventions d'intégration dans `docs/GOUVERNANCE.md`.

Reste :

- Finaliser la matrice visible en simplifié vs expert par simulateur.
- Donner des exemples validés sur `/sim/credit`, `/sim/ir` et `/sim/succession`.
- Documenter les exceptions `expertOnly`, notamment `/sim/tresorerie-societe` tant que son parcours simplifié n'est pas défini.

## PR-P2-02 - Infrastructure modes

Statut : `livré, à durcir par simulateur`

Travaux :

Livré : `useUserMode`, `ModeToggle`, `ExpertOnly`/`SimpleOnly`, persistance `ui_settings.mode` et override local non persistant.

Reste :

- Auditer chaque simulateur pour vérifier que les champs masqués en simplifié sont bien neutralisés côté moteur quand la gouvernance le demande.
- Conserver la preuve par tests pour chaque déploiement de mode.

## PR-P2-03 - Déploiement modes sur IR + Succession

Statut : `partiellement livré`

Travaux :

Livré : `/sim/ir` et `/sim/succession` consomment `useUserMode` avec override local.

Reste :

- Finaliser la matrice des champs simplifiés/expert.
- Vérifier et documenter explicitement la cohérence des exports après neutralisation des champs experts.

## PR-P2-04 - Déploiement modes sur Placement + Crédit

Statut : `partiellement livré`

Travaux :

Livré : `/sim/placement` et `/sim/credit` consomment `useUserMode` avec override local, et Crédit neutralise déjà des hypothèses expertes côté calcul.

Reste :

- Terminer la réduction de densité des formulaires Placement.
- Conserver les exports et snapshots compatibles.

## PR-P2-05 - Déploiement modes sur PER + Stratégie

Statut : `partiellement livré`

Travaux :

Livré : `/sim/per`, `/sim/per/transfert` et le potentiel PER consomment `useUserMode` avec override local.

Reste :

- Harmoniser les workflows en étapes PER en mode simplifié.
- Déployer ou confirmer le périmètre du mode sur Stratégie.
- Clarifier la place des explications produit.

---

# P3 - PER multi-enveloppes + recommandations fiscales

Objectif : mieux différencier les enveloppes PER et produire une guidance fiscale exploitable.

## PR-P3-01 - Spécification métier PER

Statut : `partiellement livré`

Livré : transfert PER et Base CG retraite sont disponibles dans `/sim/per/transfert`.

Reste :

- Compléter la guidance fiscale transversale et les limites de calcul non couvertes par le transfert.

## PR-P3-02 - Modèle de données PER

Statut : `livré pour transfert`

Livré : `src/data/base-cg-retraite/**` et `src/engine/per/transfert/**` structurent les contrats, compartiments et hypothèses de transfert.

Reste :

- Étendre le modèle uniquement si les recommandations PER hors transfert l'exigent.

## PR-P3-03 - Moteur PER : transferts multi-enveloppes

Statut : `livré pour transfert`

Livré : moteur `computePerTransfert` et route `/sim/per/transfert`.

Reste :

- Ajouter des recommandations fiscales au-delà du scénario transfert si le besoin produit est confirmé.

## PR-P3-04 - Recommandations PER

Statut : `à faire`

- Guider l'utilisation des enveloppes et le report IR.

## PR-P3-05 - Exports PER enrichis

Statut : `partiellement livré`

Livré : exports du simulateur transfert PER.

Reste :

- Harmoniser PPTX / Excel avec les recommandations PER restantes.

---

# P4 - Scan documentaire

Objectif : préremplir l'analyse patrimoniale depuis des documents, avec relecture humaine.

Parcours fiable commercialement : OCR + guide documentaire + JSON strict + score de confiance + `sourceRef` + validation CGP. Le LLM reste un booster ; la base est la saisie manuelle de l'analyse patrimoniale, qui doit être opérationnelle avant P4.

Plan détaillé : [`docs/PLAN_IA_DOCUMENTAIRE_SER1.md`](./PLAN_IA_DOCUMENTAIRE_SER1.md) (cadrage fournisseur Mistral, dev SER1 en 10 phases, conformité RGPD A-G, calendrier, coûts).

Runbook opérationnel Mistral : [`docs/RUNBOOK_MISTRAL_SER1.md`](./RUNBOOK_MISTRAL_SER1.md) (admin.mistral.ai, console.mistral.ai, clés API, limites, OCR, Files, Batches, ZDR).

P4 V1 déverrouille uniquement l'IA Mistral du palier Basic. Les paliers Pro et Premium attendent la V2 multi-modèles documentée dans le plan IA, après validation qualité et conformité fournisseur.

## PR-P4-01 - Décision infra + confidentialité

- Décider stockage, durée de conservation, extraction et journalisation.
- Couvert par le Lot 1 du plan détaillé et par `docs/RUNBOOK_MISTRAL_SER1.md` : compte Mistral pay-as-you-go, DPA, ZDR, limites, clés API, registre RGPD initial.

## PR-P4-02 - Prototype extraction minimale

- Dépôt document, extraction structurée, validation manuelle.
- Créer le guide de lecture documentaire SER1 : champs attendus, mapping SER1, statuts de confiance et validations obligatoires par type de document.
- Couvert par les Lots 2, 3 et 4 du plan détaillé.

## PR-P4-03 - Intégration analyse patrimoniale

- Réinjecter les données validées dans le workflow audit.
- Couvert par les Lots 5 et 6 du plan détaillé (moteurs SER1, assistant, PPTX, pilote cabinet).

---

# P5 - Cabinet : rôles, utilisateurs, identité visuelle

Objectif : renforcer l'exploitation multi-cabinet.

P5 porte le bloc central du socle commercialisation pré-pilote. Le périmètre doit rester MVP : suffisamment fiable pour des cabinets pilotes, sans gold-plating.

## PR-P5-01 - Multi-rôles

- Dépasser le booléen `is_admin` et cadrer les droits.
- Livrer un modèle simple, exploitable pour pilote.

## PR-P5-02 - Gestion utilisateurs

- Stabiliser l'interface et le processus cabinet.

## PR-P5-03 - Branding complet

- Couleurs cabinet et logo dans les exports.
- Pour le socle pré-pilote, limiter à logo + couleurs dans les livrables.

## PR-P5-04 - Dossiers clients durables

- Sauvegarder les dossiers clients de manière durable, sans dépendre uniquement d'une session locale.
- Assurer la reprise du dossier pour audit, stratégie et exports.

## PR-P5-05 - Page conformité de base et onboarding

- Publier une page conformité de base : sécurité, RLS, hébergement et limites de responsabilité.
- Ajouter un onboarding minimal pour les cabinets pilotes.
- Le volet IA fournisseur / DPA / ZDR / pseudonymisation enrichit cette page à la livraison de P4.

---

# P6 - Analyse patrimoniale premium + livrables

Objectif : transformer les simulateurs stabilisés en livrables client-ready, sans rendre la valeur centrale dépendante d'un LLM.

## PR-P6-01 - Audit patrimonial PPTX stable

- Stabiliser structure, données minimales et narration.

## PR-P6-02 - Simulateur épargne / arbitrages

- Ajouter des comparateurs utiles au rendez-vous.

## PR-P6-03 - Simulateur prévoyance

- Spécifier si le périmètre produit est confirmé.

---

# P7 - Stratégie avancée + société fine

Objectif : durcir la chaîne audit → stratégie → export, avec des scénarios comparables et des résultats cohérents avec les moteurs SER1.

## PR-P7-01 - Moteur de scénarios

- Comparer baseline et recommandations.

## PR-P7-02 - Société fine

- Organigramme, flux et consolidation sans surcomplexité.

## PR-P7-03 - Export stratégie PPTX complet

- Produire une synthèse client cohérente avec les scénarios.

---

# P8 - Catalogue produits personnalisable

Objectif : éviter que `catalog.ts` devienne bloquant si un cabinet veut personnaliser.

## PR-P8-01 - Étude catalogue en base

- Identifier les besoins cabinet et décider si/quand migrer.

## PR-P8-02 - Catalogue en base + overrides

- Disponibilité produits par cabinet et migration progressive.

---

## Références

- Features : `src/features/{ir,placement,succession,per,credit,strategy,audit}`
- Engine : `src/engine/**`
- Settings : `src/pages/settings/*` + `src/routes/settingsRoutes.ts`
- Cache paramètres : `src/utils/cache/fiscalSettingsCache.ts`
- Dossier fiscal : `src/hooks/useFiscalContext.ts`
- Base-Contrat : `src/domain/base-contrat/**`
- Exports : `src/pptx/**` + `src/utils/export/xlsxBuilder.ts`
- Snapshots `.ser1` : `src/reporting/snapshot/**`
- Docs structurantes : `docs/{ARCHITECTURE,METIER,RUNBOOK,RUNBOOK_MISTRAL_SER1,GOUVERNANCE,GOUVERNANCE_EXPORTS}.md`
