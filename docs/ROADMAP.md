# ROADMAP (source de vérité)

## But

Piloter la trajectoire SER1 vers un outil premium, simple et fiable pour le conseil patrimonial :

- simulateurs cohérents entre eux ;
- paramètres fiscaux actualisables sans patch code ;
- livrables PowerPoint / Excel exploitables en rendez-vous ;
- gouvernance cabinet : utilisateurs, droits, identité visuelle.

> Cette roadmap ne contient que ce qui reste à faire.
> Les chantiers livrés sont tracés par commits et PR, pas par blocs `done` détaillés.

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

## PR-P4-01 - Décision infra + confidentialité

- Décider stockage, durée de conservation, extraction et journalisation.

## PR-P4-02 - Prototype extraction minimale

- Dépôt document, extraction structurée, validation manuelle.

## PR-P4-03 - Intégration analyse patrimoniale

- Réinjecter les données validées dans le workflow audit.

---

# P5 - Cabinet : rôles, utilisateurs, identité visuelle

Objectif : renforcer l'exploitation multi-cabinet.

## PR-P5-01 - Multi-rôles

- Dépasser le booléen `is_admin` et cadrer les droits.

## PR-P5-02 - Gestion utilisateurs

- Stabiliser l'interface et le processus cabinet.

## PR-P5-03 - Branding complet

- Couleurs cabinet et logo dans les exports.

---

# P6 - Analyse patrimoniale premium + livrables

## PR-P6-01 - Audit patrimonial PPTX stable

- Stabiliser structure, données minimales et narration.

## PR-P6-02 - Simulateur épargne / arbitrages

- Ajouter des comparateurs utiles au rendez-vous.

## PR-P6-03 - Simulateur prévoyance

- Spécifier si le périmètre produit est confirmé.

---

# P7 - Stratégie avancée + société fine

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
- Docs structurantes : `docs/{ARCHITECTURE,METIER,RUNBOOK,GOUVERNANCE,GOUVERNANCE_EXPORTS}.md`
