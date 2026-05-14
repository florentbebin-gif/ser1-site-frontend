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
Statut : `spec`

Travaux :
- Définir ce qui est visible en simplifié vs expert.
- Décider où vit le toggle principal.
- Distinguer mode global et override local de page.
- Préciser ce qui est seulement masqué de ce qui sort réellement du calcul.
- Donner des exemples sur `/sim/credit`, `/sim/ir` et `/sim/succession`.

## PR-P2-02 - Infrastructure modes
Statut : `spec`

Travaux :
- Ajouter le mode utilisateur par défaut.
- Ajouter les helpers d'affichage (`ExpertOnly`, `SimpleOnly`, niveau de détail).
- Garantir que l'infrastructure n'altère pas les calculs.

## PR-P2-03 - Déploiement modes sur IR + Succession
Statut : `spec`

Travaux :
- Appliquer le mode simplifié aux simulateurs les plus sensibles.
- Garder les champs calculatoires indispensables disponibles côté moteur.
- Vérifier que les exports restent cohérents.

## PR-P2-04 - Déploiement modes sur Placement + Crédit
Statut : `spec`

Travaux :
- Réduire la densité des formulaires sans casser les hypothèses avancées.
- Conserver les exports et snapshots compatibles.

## PR-P2-05 - Déploiement modes sur PER + Stratégie
Statut : `spec`

Travaux :
- Harmoniser le mode avec les workflows en étapes.
- Clarifier la place des explications produit.

---

# P3 - PER multi-enveloppes + recommandations fiscales
Objectif : mieux différencier les enveloppes PER et produire une guidance fiscale exploitable.

## PR-P3-01 - Spécification métier PER
- Définir les enveloppes, historiques, transferts et limites de calcul.

## PR-P3-02 - Modèle de données PER
- Structurer enveloppes, versements, transferts et validation.

## PR-P3-03 - Moteur PER : transferts multi-enveloppes
- Calculer impacts fiscaux et projections.

## PR-P3-04 - Recommandations PER
- Guider l'utilisation des enveloppes et le report IR.

## PR-P3-05 - Exports PER enrichis
- Mettre à jour PPTX / Excel avec les nouvelles enveloppes.

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
