# ROADMAP V2 - Audit et stratégie SER1

Date de cadrage : 2026-06-01.

Ce document est la roadmap V2 canonique pour construire le parcours complet Audit et stratégie autour de moteurs de calcul fiables, chaînés, traçables et maintenables. Il remplace l'ancienne roadmap afin d'éviter deux sources concurrentes dans la durée.

## Résumé exécutif

- SER1 ne doit plus présenter une grille de calculateurs isolés : la Home devient un guide de dossier, avec objectifs, espaces Foyer/Société, parcours et panneau de détail.
- Les simulateurs visibles dépendent d'une registry métier unique, enrichie avec statut, mode simplifié/expert, chainage, sous-types, moteur, route, outputs moteur, données et références juridiques.
- Les moteurs actifs ou structurants passent avant l'ouverture massive de nouveaux simulateurs visibles.
- Le scan documentaire alimente le dossier patrimonial source, jamais des pages isolées.
- Chaque PR suit un cycle complet : branche depuis `main`, commits cohérents, checks locaux, push, PR, CI verte, merge, resync `main`, revue post-merge et bilan des dettes.

## Constat prouvé du repo

| Preuve                                                                                                                                                                                      | Ce que l'on observe                                                                                                                                                              | Impact V2                                                                                                                   | Recommandation minimale                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `src/pages/Home.tsx:49`, `src/pages/Home.tsx:61`, `src/pages/Home.tsx:74`, `src/pages/Home.tsx:77`                                                                                          | La Home affiche un bloc Audit & stratégie puis une grille statique de simulateurs.                                                                                               | La Home ne porte pas encore le chainage métier ni la distinction Foyer/Société.                                             | Remplacer la grille par une Home guidée pilotée par la registry.                                                               |
| `src/routes/simRouteContracts.ts:3`, `src/routes/simRouteContracts.ts:16`, `src/routes/simRouteContracts.ts:62`, `src/routes/simRouteContracts.ts:70`, `src/routes/simRouteContracts.ts:94` | Le registre de routes existe mais décrit seulement le contrat de chargement des routes `/sim/*`.                                                                                 | Ce registre est nécessaire mais insuffisant pour piloter la Home, les panneaux, les modes et les moteurs.                   | Créer `SimulatorDefinition` au-dessus du registre de routes, sans dupliquer les chemins.                                       |
| `docs/METIER.md:21`, `docs/METIER.md:29`, `docs/METIER.md:31`, `docs/METIER.md:489`                                                                                                         | Les simulateurs actuels incluent PER, Trésorerie société, etc. La Trésorerie société est explicitement `expertOnly` temporaire.                                                  | La V2 doit fermer cette décision produit, pas la transformer en exception durable.                                          | Définir la cible simplifiée/expert dans la registry, puis refondre le simulateur concerné avant ouverture simplifiée complète. |
| `docs/ARCHITECTURE.md:321`, `docs/ARCHITECTURE.md:322`, `docs/GOUVERNANCE.md:662`                                                                                                           | Le mode simplifié masque/replie l'UI mais ne doit pas modifier seul les hypothèses ; les champs masqués doivent être exclus du moteur quand ils ne sont pas supposés participer. | La distinction simplifié/expert est structurante, pas décorative.                                                           | Ajouter des règles de visibilité et des tests de non-régression moteur par mode.                                               |
| `docs/ARCHITECTURE.md:697`, `docs/ARCHITECTURE.md:724`                                                                                                                                      | Toute nouvelle route simulateur passe par `simRouteContracts` et doit rendre un vrai `SimPageShell`.                                                                             | Les nouveaux simulateurs ne peuvent pas être de simples liens ou pages vides.                                               | Ajouter les simulateurs route par route via le scaffold, avec e2e minimal métier.                                              |
| `docs/GOUVERNANCE.md:886`                                                                                                                                                                   | Le menu vertical gauche persistant est interdit par défaut sur `/sim/*`.                                                                                                         | Le rail de gauche demandé doit devenir une exception documentée et commune, pas une sidebar ajoutée au hasard.              | Mettre à jour la gouvernance et livrer un `DossierRail` unique, desktop et mobile.                                             |
| `src/reporting/snapshot/snapshotIO.ts:30`, `src/reporting/snapshot/snapshotIO.ts:50`, `src/reporting/snapshot/snapshotIO.ts:104`, `src/reporting/snapshot/snapshotIO.ts:300`                | Les sauvegardes actuelles reposent sur des clés `sessionStorage` et le format `.ser1`.                                                                                           | Cela ne suffit pas pour l'historique dossier, les versions, l'activation de stratégie et la reprise d'analyse patrimoniale. | Introduire un modèle de version de dossier avant d'étendre les parcours.                                                       |
| `docs/PLAN_IA_DOCUMENTAIRE_SER1.md:126`, `docs/PLAN_IA_DOCUMENTAIRE_SER1.md:163`, `docs/PLAN_IA_DOCUMENTAIRE_SER1.md:228`                                                                   | Le plan documentaire prévoit OCR, pages, extraction et `sourceRefs`.                                                                                                             | Le scan doit alimenter un dossier patrimonial commun, pas injecter des champs page par page.                                | Définir `SourceRef` et le modèle `DossierPatrimonial` avant l'intégration OCR.                                                 |
| `docs/RUNBOOK.md:79`, `docs/RUNBOOK.md:83`, `docs/RUNBOOK.md:94`, `docs/ARCHITECTURE.md:675`                                                                                                | Les hardcodes fiscaux sont gardés par script, avec `settingsDefaults.ts` comme source autorisée.                                                                                 | Les nouveaux moteurs doivent consommer la chaîne fiscale existante.                                                         | Ajouter des références juridiques aux règles et maintenir le passage par `useFiscalContext`.                                   |
| `docs/ARCHITECTURE.md:63`, `docs/ARCHITECTURE.md:64`, `docs/ARCHITECTURE.md:76`                                                                                                             | Les fichiers longs et fichiers multi-responsabilités doivent être découpés.                                                                                                      | Succession et Trésorerie société ne doivent pas devenir des points de dette avant d'ajouter des moteurs voisins.            | Prévoir des PR de découpage comportement neutre avant extension fonctionnelle.                                                 |

## Principes V2 non négociables

1. Une seule registry métier pour les simulateurs, consommée par la Home, le rail, les routes, les panneaux latéraux, les modes, les références juridiques, les champs dossier et les tests de couverture.
2. Aucun simulateur visible sans statut clair : `active`, `hub`, `placeholder`, `planned`, `expertOnly` ou `internalOnly`.
3. Le mode simplifié masque les leviers avancés sans appauvrir le fond métier. Quand un champ masqué ne doit pas influencer le calcul, le moteur reçoit une entrée neutre et testée.
4. Le mode expert expose les leviers avancés, les sous-types et les panneaux techniques, sans créer un second produit.
5. Les sous-types ne deviennent pas des simulateurs autonomes en mode simplifié : PEA/CTO, assurance-vie et placement de trésorerie restent rattachés à leur simulateur parent.
6. `Actif/passif` est un socle interne en mode simplifié. Il peut devenir une vue expert de synthèse patrimoniale, mais pas une carte simplifiée.
7. `Cession de titres` n'est pas visible côté Foyer dans le parcours simplifié. Elle reste côté Société/dirigeant.
8. Le scan documentaire alimente le dossier patrimonial. Les simulateurs lisent le dossier, ils ne possèdent pas chacun leur extraction documentaire.
9. Les références juridiques doivent être explicites, listables et vérifiables. Un futur agent doit pouvoir lister les références du repo puis vérifier l'actualité officielle.
10. Aucun nouveau moteur fiscal ne contourne `Supabase -> fiscalSettingsCache.ts -> useFiscalContext.ts -> settingsDefaults.ts`.
11. Les exports PPTX/Excel ne recalculent jamais : ils consomment des sorties moteur ou reporting déjà validées.
12. Aucun nouveau chantier PPTX ou Excel n'est planifié dans cette séquence. Chaque moteur doit seulement produire des outputs structurés, réutilisables plus tard par les exports.
13. Les exports existants restent non régressifs si un refactor les impacte.
14. Aucun legacy durable n'est autorisé : pas d'ancienne Home concurrente, pas d'ancienne roadmap concurrente après validation de la V2, pas de double registry, pas de fallback métier non testé.
15. Toute dette découverte est traitée dans la PR ou inscrite dans le bilan avec `fichier:ligne`, preuve, raison du report et PR cible. Une dette découverte ne peut pas rester muette.

## Objectif des surfaces

| Surface                    | Objectif                                                                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Home                       | Guider vers `Nouvelle stratégie`, `Scan documentaire` ou un simulateur pertinent, sans afficher un catalogue massif.                          |
| Audit / Nouvelle stratégie | Construire le dossier patrimonial complet, sélectionner les objectifs, lancer les simulateurs utiles et préparer une stratégie exploitable.   |
| Scan documentaire          | Pré-remplir le dossier patrimonial à partir de documents, avec validation CGP obligatoire avant usage moteur.                                 |
| Simulateurs `/sim/*`       | Calculer précisément un sujet patrimonial délimité, à partir du dossier et/ou d'inputs propres, puis retourner des outputs structurés.        |
| Strategy                   | Comparer les scénarios, activer une stratégie et créer une nouvelle version active du dossier.                                                |
| `DossierRail`              | Afficher la version active, le statut, le chaînage amont/aval, les actions de sauvegarde/version/comparaison et la position dans le parcours. |

## Architecture cible

### Modules à créer ou stabiliser

| Module                                      | Rôle                                                                        | Contraintes                                                                                           |
| ------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `src/domain/simulators/types.ts`            | Types `SimulatorDefinition`, statut, modes, familles, chainage, références. | TypeScript strict, pas de React, pas de Supabase.                                                     |
| `src/domain/simulators/registry.ts`         | Registry métier canonique des simulateurs et sous-types.                    | Référence les routes existantes via `simRouteContracts`, sans dupliquer la source des chemins actifs. |
| `src/domain/simulators/homeMatrix.ts`       | Projection Home : espaces, onglets, familles, ordre d'affichage.            | Aucune logique de rendu.                                                                              |
| `src/domain/simulators/chainage.ts`         | Liens amont/aval, dépendances de dossier, recommandations.                  | Sert au panneau latéral et au rail, pas à un hover coloré.                                            |
| `src/domain/simulators/contextAdapters.ts`  | Contrats des adapters contexte dossier vers inputs simulateur.              | Le moteur ne lit jamais le dossier brut.                                                              |
| `src/domain/legal-references/`              | Référentiel de sources juridiques et règles liées.                          | Sources officielles, date de dernière vérification, périmètre moteur.                                 |
| `src/domain/dossier/`                       | Modèle dossier, versions, activation stratégie, sourceRefs.                 | Indépendant de l'OCR et des pages UI.                                                                 |
| `src/features/home/`                        | Composants Home guidée.                                                     | Consomme la registry, pas de listes statiques en dur.                                                 |
| `src/components/ui/dossier/DossierRail.tsx` | Rail commun global et `/sim/*`.                                             | Desktop complet, mobile réduit à une pastille/version en haut.                                        |
| `src/features/audit/documents/`             | Future zone Scan documentaire.                                              | Alimente `DossierPatrimonial`, pas les simulateurs directement.                                       |

### Contrat `SimulatorDefinition`

Le contrat exact pourra être ajusté à l'implémentation, mais la PR de registry doit couvrir ces informations :

```ts
export type SimulatorLifecycle =
  | 'active'
  | 'hub'
  | 'placeholder'
  | 'planned'
  | 'expertOnly'
  | 'internalOnly';

export type SimulatorSpace = 'foyer' | 'societe';
export type SimulatorTab = 'comprendre' | 'piloter' | 'proteger';
export type SimulatorModeVisibility = 'simplifie' | 'expert' | 'internal';

export type FieldProvenance =
  | 'manual'
  | 'dossier'
  | 'scan'
  | 'simulatorOutput'
  | 'strategy'
  | 'defaultFiscalSettings';

export interface SimulatorContextPolicy {
  canRunStandalone: boolean;
  canUseDossierContext: boolean;
  requiredForStandalone: string[];
  requiredFromDossier: string[];
  optionalFromDossier: string[];
  missingFieldsBehavior: 'block' | 'warn' | 'ask';
  writeBackPolicy: 'never' | 'ask' | 'autoOutputOnly';
}

export interface SimulatorDefinition {
  id: string;
  routeId?: string;
  path?: string;
  space: SimulatorSpace;
  tab: SimulatorTab;
  family?: string;
  shortLabel: string;
  fullLabel: string;
  objective: string;
  inputs: string[];
  calculates: string[];
  outputs: string[];
  upstream: string[];
  next: string[];
  dossierFields: string[];
  legalRefs: string[];
  testScenarios: string[];
  contextPolicy: SimulatorContextPolicy;
  subtypes?: string[];
  lifecycle: SimulatorLifecycle;
  visibility: SimulatorModeVisibility;
  engine?: string;
}
```

Règles d'usage :

- `path` est dérivé d'une route existante quand `routeId` existe.
- `planned` n'autorise pas un lien actif vers une page inexistante.
- `placeholder` exige une route scaffoldée qui ne crashe pas.
- `internalOnly` ne s'affiche pas comme carte Home simplifiée.
- `expertOnly` peut être masqué en simplifié et visible en expert si la décision produit le prévoit.
- `subtypes` décrit des sous-parcours ou enveloppes, pas des simulateurs autonomes simplifiés.
- `calculates` décrit ce que le moteur calcule réellement, pas seulement ce que la page affiche.
- `outputs` décrit les sorties propres et réutilisables par Strategy, le rail, le reporting ou de futurs exports.
- `legalRefs`, `dossierFields` et `testScenarios` sont obligatoires avant de coder ou refondre un simulateur.
- `contextPolicy` décrit comment le simulateur fonctionne en autonomie et comment il utilise un dossier patrimonial chargé.
- Aucun composant React ne crée de liste parallèle de simulateurs, de routes, de statuts, de chainage ou de visibilité.

### Registry et chainage

La registry est la source unique pour :

- Home.
- Routes simulateurs.
- Panneau latéral.
- Rail gauche.
- Mode simplifié / expert.
- Statuts `active`, `hub`, `placeholder`, `planned`, `expertOnly`, `internalOnly`.
- Chainage `upstream` / `next`.
- Références juridiques.
- Champs dossier consommés.
- Tests de couverture.

Les composants React consomment cette donnée. Ils ne redéclarent pas de matrices locales.

Exemple minimal attendu avant codage :

```ts
{
  id: 'investissement-locatif',
  space: 'foyer',
  tab: 'piloter',
  family: 'Immobilier',
  shortLabel: 'Invest. locatif',
  fullLabel: 'Investissement locatif',
  lifecycle: 'planned',
  visibility: 'simplifie',
  objective: 'Évaluer la viabilité patrimoniale et fiscale d'un projet locatif.',
  inputs: ['prix', 'frais', 'loyers', 'charges', 'crédit', 'régime fiscal', 'horizon'],
  calculates: [
    'rendement brut/net',
    'cash-flow',
    "effort d'épargne",
    'fiscalité',
    'TRI simplifié',
    'impact crédit',
  ],
  outputs: ['cash-flow annuel', 'rentabilité nette', 'effort mensuel', 'fiscalité projetée'],
  upstream: ['Budget & épargne', 'Crédit & garanties', 'Fiscalité IR'],
  next: ['Revenus fonciers', 'LMNP/LMP', 'IFI', 'Plus-values immobilières', 'Vendre / réemployer'],
  dossierFields: ['budget', 'fiscaliteIR', 'credits', 'immobilier'],
  legalRefs: ['à renseigner avant codage'],
  testScenarios: ['projet avec crédit amortissable', 'projet sans crédit', 'cash-flow négatif'],
  contextPolicy: {
    canRunStandalone: true,
    canUseDossierContext: true,
    requiredForStandalone: ['budget.capaciteEpargne', 'immobilier.prix', 'immobilier.loyers'],
    requiredFromDossier: ['budget', 'fiscaliteIR'],
    optionalFromDossier: ['credits', 'immobilier', 'ifi'],
    missingFieldsBehavior: 'ask',
    writeBackPolicy: 'ask',
  },
}
```

Règle avant codage :

- Avant de créer ou refondre un simulateur, sa `SimulatorDefinition` doit être complète.
- Un simulateur sans `objective`, `inputs`, `calculates`, `outputs`, `upstream`, `next`, `dossierFields`, `legalRefs`, `testScenarios` et `contextPolicy` ne part pas en implémentation.
- Les nouveaux champs de définition sont ajoutés dans la même PR que la registry ou dans la PR du moteur concerné, jamais en note séparée non testée.

## Parcours métier obligatoires

Ces parcours ne remplacent pas `upstream` / `next`. Ils décrivent les séquences métier ordonnées utilisées par :

- Nouvelle stratégie ;
- le rail gauche ;
- le panneau latéral ;
- les recommandations d'étapes suivantes ;
- la future stratégie activable.

Le rail ne doit pas afficher seulement des liens liés. Il doit afficher la position du CGP dans un parcours :

- étapes précédentes ;
- étape actuelle ;
- étapes suivantes recommandées ;
- branches possibles selon les données du dossier.

### 1. Parcours Audit global

Filiation familiale → Régime matrimonial → Donations antérieures → Budget & épargne → Fiscalité IR → IFI si patrimoine immobilier → Actif/passif interne → Prévoyance → Retraite globale → Placement & allocation → Succession & liquidité → Objectifs client → Stratégie

### 2. Parcours Transmission privée

Filiation familiale → Régime matrimonial → Donations antérieures → Succession & liquidité → Donation & démembrement → Succession & liquidité après stratégie → Prévoyance si besoin de liquidité ou de protection familiale

Branches :

- si assurance-vie / capitalisation : Placement & allocation → Succession & liquidité ;
- si immobilier familial : SCI → Donation & démembrement ;
- si IFI important : IFI → Donation & démembrement → Vendre / réemployer.

### 3. Parcours Protection famille

Filiation familiale → Régime matrimonial → Budget & épargne → Crédit & garanties → Prévoyance → Succession & liquidité → Placement & allocation si besoin de liquidité

Objectif :

Identifier les personnes à protéger, les revenus nécessaires, les dettes, les garanties existantes, le besoin de capital décès ou de rente, puis l'impact sur la succession.

### 4. Parcours Retraite

Budget & épargne → Fiscalité IR → Retraite globale → PER → Placement & allocation → Succession & liquidité si PER assurance ou enjeu transmission

Branches :

- si dirigeant : Projection comptable → Rémunération → Retraite globale ;
- si société cessible : Valorisation titres → Cession de titres → Placement & allocation ;
- si immobilier : Revenus fonciers → Vendre / réemployer → Placement & allocation.

### 5. Parcours Investissement patrimonial

Budget & épargne → Fiscalité IR → Retraite globale → Placement & allocation

Branches :

- PER ;
- assurance-vie / capitalisation en sous-type de Placement ;
- PEA / CTO en sous-type de Placement ;
- SCPI ;
- Crédit & garanties ;
- Investissement locatif.

### 6. Parcours Immobilier

Budget & épargne → Crédit & garanties → Investissement locatif → SCI si question de détention → Revenus fonciers ou LMNP/LMP → Fiscalité IR → IFI → Plus-values immobilières → Vendre / réemployer

Pour immobilier existant :

Actif/passif interne → IFI → Revenus fonciers → SCI → Plus-values immobilières → Vendre / réemployer → Placement & allocation

### 7. Parcours Société dirigeant

Organigramme → Valorisation titres → Projection comptable → Trésorerie société → Rémunération ou Sortie de capitaux → Fiscalité IR → Budget & épargne → Retraite globale ou Placement & allocation

Branches :

- Trésorerie société → Placement trésorerie intégré ;
- Trésorerie société → Holding ;
- Trésorerie société → Sortie de capitaux ;
- Rémunération → Épargne salariale ;
- Cession de titres → Holding ou Placement & allocation.

### 8. Parcours Transmission entreprise

Filiation familiale → Régime matrimonial → Organigramme → Valorisation titres → Pacte Dutreil → Donation & démembrement → Succession & liquidité → Prévoyance dirigeant si besoin

Branches :

- si enfant repreneur : Dutreil + donation ;
- si pas de repreneur familial : Cession de titres + réemploi ;
- si besoin de liquidité dirigeant : OBO ou cession partielle ;
- si holding : Holding / apport-cession ;
- si transmission en nue-propriété : Donation & démembrement.

### 9. Parcours Cession / réemploi

Pour immobilier :

Plus-values immobilières → Vendre / réemployer → Placement & allocation → Retraite ou Succession selon objectif

Pour société :

Valorisation titres → Cession de titres → Holding ou Placement & allocation → Retraite ou Transmission selon objectif

Pour placements financiers :

Placement & allocation → arbitrage interne du produit → Fiscalité IR si nécessaire → Succession & liquidité si enjeu transmission

### Règle d'implémentation du rail

Le rail doit afficher une position dans un parcours, pas seulement une liste de simulateurs liés.

Exemple sur `Succession & liquidité` :

Parcours : Transmission privée.

Étapes précédentes :

- Filiation familiale ;
- Régime matrimonial ;
- Donations antérieures.

Étape actuelle :

- Succession & liquidité.

Étapes suivantes recommandées :

- Donation & démembrement ;
- Prévoyance si déficit de liquidité ;
- Placement & allocation si besoin de liquidité ou d'assurance-vie.

### Règle pour `chainage.ts`

`chainage.ts` doit exposer deux niveaux.

1. Liens directs :

- `upstream` ;
- `next`.

2. Parcours métier :

- `audit-global` ;
- `transmission-privee` ;
- `protection-famille` ;
- `retraite` ;
- `investissement-patrimonial` ;
- `immobilier` ;
- `societe-dirigeant` ;
- `transmission-entreprise` ;
- `cession-reemploi`.

Le panneau latéral peut afficher les liens directs. Le rail doit pouvoir afficher le parcours métier courant, l'étape actuelle et les étapes précédentes/suivantes.

## Alimentation contextuelle des simulateurs

Chaque simulateur `/sim/*` doit rester utilisable en autonomie, mais il doit être automatiquement alimenté par le dossier patrimonial lorsqu'un contexte existe.

Il ne faut pas lier les pages directement entre elles. Les simulateurs sont reliés par :

- `DossierPatrimonial` ;
- `DossierVersion` ;
- `SimulatorDefinition.dossierFields` ;
- `upstream` / `next` ;
- le rail gauche ;
- les outputs moteurs structurés.

Architecture cible :

```text
DossierPatrimonial
→ simulateurContextAdapter
→ inputs du simulateur
→ moteur de calcul
→ outputs structurés
→ version dossier / rail / stratégie
```

### Trois états par simulateur

1. Mode autonome :
   - aucun dossier chargé ;
   - le simulateur demande tous les champs nécessaires.
2. Mode prérempli :
   - dossier partiel ;
   - le simulateur préremplit les champs connus ;
   - le simulateur demande uniquement les champs manquants.
3. Mode dossier :
   - dossier chargé et validé ;
   - le simulateur lit les champs dossier utiles ;
   - le simulateur affiche leur origine ;
   - le simulateur calcule puis produit des outputs rattachables au dossier.

### Exemple `/sim/ir`

Sans contexte, `/sim/ir` demande :

- situation familiale ;
- nombre d'enfants ;
- garde alternée ;
- parent isolé ;
- résidence fiscale ;
- revenus ;
- charges ;
- crédits/réductions ;
- année fiscale / barème.

Avec contexte Filiation, `/sim/ir` préremplit :

- situation familiale ;
- conjoint ;
- enfants ;
- dates de naissance ;
- enfants potentiellement à charge ;
- garde alternée si déjà renseignée.

Il demande seulement les champs fiscaux manquants.

Avec contexte Audit complet, `/sim/ir` préremplit :

- foyer ;
- revenus ;
- charges ;
- enfants ;
- résidence ;
- plafonds retraite ;
- données connues.

Il demande uniquement les corrections ou compléments.

### Provenance des champs

Chaque champ prérempli doit avoir une provenance :

```ts
type FieldProvenance =
  | 'manual'
  | 'dossier'
  | 'scan'
  | 'simulatorOutput'
  | 'strategy'
  | 'defaultFiscalSettings';
```

Chaque input visible dans un simulateur distingue :

- valeur calculée depuis le dossier ;
- valeur proposée par scan documentaire ;
- valeur saisie manuellement ;
- valeur modifiée uniquement pour ce calcul ;
- valeur enregistrée dans le dossier.

Règle UX :

- Un champ prérempli affiche son origine.
- Le CGP peut modifier la valeur seulement pour ce calcul.
- Le CGP peut aussi mettre à jour le dossier source.

### Contrat `contextPolicy`

Chaque `SimulatorDefinition` doit inclure :

```ts
contextPolicy: {
  canRunStandalone: boolean;
  canUseDossierContext: boolean;
  requiredForStandalone: string[];
  requiredFromDossier: string[];
  optionalFromDossier: string[];
  missingFieldsBehavior: 'block' | 'warn' | 'ask';
  writeBackPolicy: 'never' | 'ask' | 'autoOutputOnly';
};
```

Exemple IR :

```ts
{
  id: 'ir',
  contextPolicy: {
    canRunStandalone: true,
    canUseDossierContext: true,
    requiredForStandalone: [
      'foyer.situationFamiliale',
      'foyer.enfantsACharge',
      'fiscaliteIR.revenus',
      'fiscaliteIR.annee',
    ],
    requiredFromDossier: ['foyer', 'fiscaliteIR'],
    optionalFromDossier: ['filiation', 'budget', 'retraite.plafonds', 'revenusFonciers'],
    missingFieldsBehavior: 'ask',
    writeBackPolicy: 'ask',
  },
}
```

### Règle moteur

Le moteur ne lit jamais directement le dossier brut. Il reçoit un objet d'inputs normalisé par un adapter.

Exemple :

```ts
const irInputs = buildIrInputsFromContext({
  dossier,
  localOverrides,
  fiscalSettings,
});
const result = computeIr(irInputs);
```

Les valeurs manquantes ne doivent pas être remplacées silencieusement par des défauts métier, sauf si le défaut vient explicitement de `fiscalSettings` ou d'une règle documentée.

### Lien avec le mode simplifié / expert

Le mode simplifié peut masquer des champs, mais il ne doit pas modifier silencieusement le calcul. Si un champ masqué influence le calcul, il doit être neutralisé, dérivé du dossier ou affiché comme hypothèse visible.

Cette règle est cohérente avec la roadmap V2, qui impose que les champs masqués en mode simplifié ne changent pas seuls le calcul et que le moteur reçoive une entrée neutre et testée quand nécessaire.

### Critères d'acceptation

- Chaque simulateur actif documente ses champs requis en autonomie.
- Chaque simulateur actif documente ses champs récupérables depuis le dossier.
- Chaque simulateur actif possède un adapter de contexte ou une décision explicite indiquant qu'il n'en a pas encore.
- Aucun simulateur ne lit directement des données dossier non validées.
- Les champs préremplis affichent leur provenance.
- Le CGP peut modifier pour le calcul ou mettre à jour le dossier.
- Les outputs du simulateur sont structurés et rattachables à une version dossier.

Conclusion :

SER1 doit lier les pages, mais pas par des imports ou des dépendances directes. La bonne formule est : simulateurs autonomes, dossier patrimonial central, adapters de contexte par simulateur, provenance des champs, outputs structurés et rail commun.

## Matrice cible des simulateurs

Cette matrice est la cible métier. Elle ne signifie pas que tous les éléments doivent devenir visibles dans la première PR Home. Les PR d'ouverture suivent l'ordre des moteurs plus bas.

### Foyer & patrimoine privé, mode simplifié

| Onglet                 | Famille                     | ID cible                      | Libellé court           | Route actuelle    | Statut cible | Décision V2                                               |
| ---------------------- | --------------------------- | ----------------------------- | ----------------------- | ----------------- | ------------ | --------------------------------------------------------- |
| Comprendre             | Socle dossier               | `foyer-filiation`             | Filiation familiale     | A créer plus tard | `planned`    | Alimente succession, donation, prévoyance.                |
| Comprendre             | Socle dossier               | `foyer-regime-matrimonial`    | Régime matrimonial      | A créer plus tard | `planned`    | Alimente succession, donation, actif/passif.              |
| Comprendre             | Socle dossier               | `foyer-donations-anterieures` | Donations antérieures   | A créer plus tard | `planned`    | Alimente succession et donation.                          |
| Comprendre             | Budget                      | `foyer-budget-epargne`        | Budget & épargne        | A créer plus tard | `planned`    | Alimente PER, placement, crédit et stratégie.             |
| Comprendre             | Fiscalité                   | `ir`                          | Fiscalité IR            | `/sim/ir`         | `active`     | Moteur existant prioritaire pour le parcours Audit.       |
| Comprendre             | Fiscalité                   | `ifi`                         | IFI                     | A créer plus tard | `planned`    | A construire après socle actif/passif.                    |
| Piloter                | Retraite & effort d'épargne | `retraite-globale`            | Retraite globale        | A créer plus tard | `planned`    | Doit agréger PER, placements, prévoyance et budget.       |
| Piloter                | Retraite & effort d'épargne | `per`                         | PER                     | `/sim/per`        | `hub`        | Hub visible avec potentiel et transfert.                  |
| Piloter                | Placements financiers       | `placement-allocation`        | Placement & allocation  | `/sim/placement`  | `active`     | PEA/CTO et assurance-vie sont des sous-types.             |
| Piloter                | Immobilier                  | `credit-garanties`            | Crédit & garanties      | `/sim/credit`     | `active`     | Déjà actif, à rattacher au dossier.                       |
| Piloter                | Immobilier                  | `investissement-locatif`      | Invest. locatif         | A créer plus tard | `planned`    | Moteur à prioriser après crédit/IR.                       |
| Piloter                | Immobilier                  | `revenus-fonciers`            | Revenus fonciers        | A créer plus tard | `planned`    | Dépend d'IR et investissement locatif.                    |
| Piloter                | Immobilier                  | `lmnp-lmp`                    | LMNP/LMP                | A créer plus tard | `planned`    | Moteur spécialisé à isoler.                               |
| Piloter                | Immobilier                  | `scpi`                        | SCPI                    | A créer plus tard | `planned`    | Peut être sous-type placement ou immobilier selon moteur. |
| Piloter                | Immobilier                  | `sci`                         | SCI                     | A créer plus tard | `planned`    | A relier à IFI, succession et société si besoin.          |
| Piloter                | Arbitrer                    | `plus-values-immobilieres`    | Plus-values immo.       | A créer plus tard | `planned`    | Côté Foyer uniquement pour immobilier.                    |
| Piloter                | Arbitrer                    | `vendre-reemployer`           | Vendre / réemployer     | A créer plus tard | `planned`    | Simule la stratégie de remploi après cession.             |
| Protéger & transmettre | Protection                  | `prevoyance`                  | Prévoyance              | `/sim/prevoyance` | `active`     | UI active, moteur à durcir et relier au dossier.          |
| Protéger & transmettre | Transmission                | `succession-liquidite`        | Succession & liquidité  | `/sim/succession` | `active`     | Simulateur à découper avant extension.                    |
| Protéger & transmettre | Transmission                | `donation-demembrement`       | Donation & démembrement | A créer plus tard | `planned`    | Partage des briques avec succession.                      |

### Foyer & patrimoine privé, expert ou interne

| ID cible               | Libellé                 | Visibilité                                           | Décision V2                                                                      |
| ---------------------- | ----------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| `actif-passif`         | Synthèse patrimoniale   | `internalOnly` en simplifié, possible `expertOnly`   | Supprimé de la Home simplifiée. Sert de socle dossier et de base IFI/succession. |
| `assurance-vie`        | Assurance-vie           | Sous-type de `placement-allocation`, possible expert | Pas de carte autonome simplifiée.                                                |
| `pea-cto`              | PEA / CTO               | Sous-type de `placement-allocation`                  | Pas de carte autonome simplifiée.                                                |
| `cession-titres-foyer` | Cession de titres Foyer | Non visible                                          | Retiré côté Foyer. La cession de titres vit côté Société.                        |

### Société & dirigeant, mode simplifié

| Onglet                 | Famille                | ID cible                        | Libellé court           | Route actuelle            | Statut cible                               | Décision V2                                         |
| ---------------------- | ---------------------- | ------------------------------- | ----------------------- | ------------------------- | ------------------------------------------ | --------------------------------------------------- |
| Comprendre             | Structure              | `societe-organigramme`          | Organigramme            | A créer plus tard         | `planned`                                  | Alimente holding, cession, Dutreil.                 |
| Comprendre             | Structure              | `valorisation-titres`           | Valorisation titres     | A créer plus tard         | `planned`                                  | Alimente cession, OBO, donation, Dutreil.           |
| Piloter                | Piloter l'exploitation | `projection-comptable`          | Projection comptable    | A créer plus tard         | `planned`                                  | Peut être extrait de Trésorerie société.            |
| Piloter                | Piloter l'exploitation | `tresorerie-societe`            | Trésorerie société      | `/sim/tresorerie-societe` | `active`, à ouvrir simplifié après refonte | Fusionne Trésorerie et Placement trésorerie.        |
| Piloter                | Optimiser le dirigeant | `remuneration-dirigeant`        | Rémunération            | A créer plus tard         | `planned`                                  | Dépend IR, société et stratégie.                    |
| Piloter                | Optimiser le dirigeant | `epargne-salariale`             | Épargne salariale       | `/sim/epargne-salariale`  | `placeholder`                              | A transformer en moteur quand priorisé.             |
| Piloter                | Optimiser le dirigeant | `sortie-capitaux`               | Sortie de capitaux      | A créer plus tard         | `planned`                                  | Dividendes, CCA, flux dirigeant.                    |
| Piloter                | Utiliser la trésorerie | `holding`                       | Holding                 | A créer plus tard         | `planned`                                  | Dépend organigramme, trésorerie, fiscalité.         |
| Piloter                | Sortir ou restructurer | `cession-titres-societe`        | Cession de titres       | A créer plus tard         | `planned`                                  | Visible côté Société uniquement.                    |
| Piloter                | Sortir ou restructurer | `obo`                           | OBO                     | A créer plus tard         | `planned`                                  | Moteur avancé après valorisation et financement.    |
| Protéger & transmettre | Protection             | `prevoyance-dirigeant`          | Prévoyance dirigeant    | A créer plus tard         | `planned`                                  | Peut réutiliser le socle prévoyance.                |
| Protéger & transmettre | Transmission           | `pacte-dutreil`                 | Pacte Dutreil           | A créer plus tard         | `planned`                                  | Dépend organigramme et valorisation titres.         |
| Protéger & transmettre | Transmission           | `donation-demembrement-societe` | Donation & démembrement | A créer plus tard         | `planned`                                  | Variante société du moteur donation.                |
| Protéger & transmettre | Transmission           | `succession-liquidite-societe`  | Succession & liquidité  | A créer plus tard         | `planned`                                  | Réutilise le moteur succession avec titres société. |

### Société & dirigeant, expert ou interne

| ID cible               | Libellé              | Visibilité                            | Décision V2                                                         |
| ---------------------- | -------------------- | ------------------------------------- | ------------------------------------------------------------------- |
| `placement-tresorerie` | Placement trésorerie | Sous-module de `tresorerie-societe`   | Fusionné avec Trésorerie société, pas de carte simplifiée autonome. |
| `fiscalite-societe`    | Fiscalité société    | `internalOnly` ou expert selon moteur | Sert aux moteurs Société, pas comme carte simplifiée initiale.      |

## Home guidée à implémenter maintenant

### Objectif

Remplacer la grille statique par une Home qui guide le CGP selon son objectif, tout en évitant d'ouvrir trop de simulateurs sans moteur.

### Structure d'écran

1. Bloc de démarrage `PAR OÙ COMMENCER`.
2. Deux cartes d'action :
   - `Nouvelle stratégie`, CTA `Démarrer`.
   - `Scan documentaire`, CTA `Importer`.
3. Section simulateurs avec le wording exact :
   - Titre : `Simulateurs`.
   - Sous-titre : `Sélectionnez votre objectif, SER1 vous guide pas à pas`.
4. Deux espaces :
   - `Foyer & patrimoine privé`.
   - `Société & dirigeant`.
5. Un seul espace ouvert à la fois.
6. Dans chaque espace, onglets :
   - `Comprendre`.
   - `Piloter`.
   - `Protéger & transmettre`.
7. Dans `Piloter`, familles en accordéons fermables.
8. Clic sur un simulateur : ouverture d'un panneau latéral de détail.
9. Aucun hover coloré amont/aval.
10. Les badges chiffrés sont masqués en simplifié ou affichés très atténués en expert seulement.

### Règles de visibilité de la Home

- La Home ne redevient jamais une grille statique.
- En première PR Home, afficher en priorité `active`, `hub` et `placeholder`.
- Les éléments `planned` restent dans la registry pour préparer le chainage, mais ne doivent pas créer de faux lien ni de promesse cliquable.
- Un `planned` peut apparaître uniquement si l'UI le marque clairement comme non disponible et si cette décision est validée dans la PR.
- `internalOnly` est absent des cartes Home simplifiées.
- `expertOnly` est absent du mode simplifié ; il peut être affiché en mode expert si le panneau explique son rôle.
- Le panneau latéral peut mentionner les dépendances amont/aval même si elles ne sont pas encore visibles comme cartes.
- Les cartes simplifiées n'affichent pas `Actif/passif`, `PEA/CTO`, `Assurance-vie`, `Placement trésorerie` ni `Cession de titres` côté Foyer.

### Design attendu

- Sobriété fiscale française, sans emoji.
- Police Inter.
- Tokens C1-C10 existants.
- Fond off-white, surfaces blanches, bordures fines, ombres légères.
- Pas de couleurs saturées.
- Pas de hover chain coloré repris de `home-chain`.
- Titres courts dans les cartes ; explication longue dans le panneau.
- Les cartes ne doivent pas devenir une landing page marketing.

### Composants attendus

| Composant               | Rôle                                                       |
| ----------------------- | ---------------------------------------------------------- |
| `HomeStartActions`      | Affiche Nouvelle stratégie et Scan documentaire.           |
| `HomeSimulatorSpaces`   | Gère les deux espaces et leur état ouvert.                 |
| `HomeSimulatorTabs`     | Gère Comprendre / Piloter / Protéger.                      |
| `HomeSimulatorFamilies` | Gère les accordéons de familles.                           |
| `HomeSimulatorCard`     | Affiche une entrée courte.                                 |
| `HomeSimulatorPanel`    | Affiche le détail, les entrées, calculs, amont, aval, CTA. |

### Critères de sortie PR Home

- La Home ne contient plus de liste statique de routes simulateurs en dur.
- La Home consomme `SimulatorDefinition`.
- Les deux cartes `Nouvelle stratégie` et `Scan documentaire` sont visibles.
- Le wording exact est présent.
- Le hover chain coloré est absent.
- Les tests prouvent que les cartes simplifiées n'affichent pas `Actif/passif`, `PEA/CTO`, `Assurance-vie`, `Placement trésorerie` ni `Cession de titres` côté Foyer.
- Les tests prouvent que les routes actives restent accessibles.
- Le smoke authentifié reste vert.

## Contenu du panneau latéral

Le panneau latéral est l'endroit où SER1 explique le chainage. Il remplace le hover amont/aval.

### PER

| Champ         | Contenu                                                                                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Titre court   | `PER`                                                                                                                                                                                       |
| Titre complet | `Potentiel d'épargne retraite et transfert PER`                                                                                                                                             |
| Objectif      | Vérifier le potentiel d'épargne retraite, simuler l'impact fiscal d'un versement et comparer un contrat actuel avec un nouveau PER.                                                         |
| Calcule       | Plafond disponible, effort d'épargne, économie IR, disponible net, impact versement, comparaison ancien/nouveau contrat, frais, options de sortie rente/capital.                            |
| Entrées       | Foyer fiscal, revenus professionnels, TMI/IR via contexte fiscal, plafonds non utilisés, versements, contrat actuel, frais, hypothèses nouveau PER, sortie rente/capital, Base CG retraite. |
| En amont      | Fiscalité IR, budget & épargne, retraite globale, situation familiale.                                                                                                                      |
| Après         | Placement & allocation, stratégie retraite, succession si PER assurance, recommandations structurées.                                                                                       |
| CTA           | Ouvrir le hub PER ou choisir `Potentiel épargne retraite` / `Transfert PER`.                                                                                                                |

### Placement & allocation patrimoniale

| Champ         | Contenu                                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Titre court   | `Placement & allocation`                                                                                                         |
| Titre complet | `Allocation patrimoniale et enveloppes de placement`                                                                             |
| Objectif      | Construire une allocation par objectif, horizon, risque, fiscalité et enveloppes.                                                |
| Calcule       | Projection brut/net, frais, fiscalité par enveloppe, liquidité, risque, allocation cible, arbitrages.                            |
| Entrées       | Dossier foyer, budget, horizon, capacité d'épargne, enveloppes existantes, profil de risque, fiscalité IR/PS, actifs financiers. |
| Sous-types    | Assurance-vie, contrat de capitalisation, PER, PEA, CTO, SCPI selon périmètre moteur.                                            |
| En amont      | Budget & épargne, Fiscalité IR, Actif/passif interne, PER si objectif retraite.                                                  |
| Après         | Crédit & garanties, immobilier, succession, stratégie globale.                                                                   |
| CTA           | Ouvrir Placement.                                                                                                                |

### Trésorerie société

| Champ         | Contenu                                                                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Titre court   | `Trésorerie société`                                                                                                                      |
| Titre complet | `Projection et allocation de la trésorerie société`                                                                                       |
| Objectif      | Projeter l'exploitation, les flux associés et l'utilisation de la trésorerie disponible.                                                  |
| Calcule       | Projection comptable, trésorerie disponible, CCA, emprunts, filiales, revenus associés, allocation de trésorerie, flux société/dirigeant. |
| Entrées       | Société, bilans, résultat, trésorerie, dettes, CCA, associés, filiales, hypothèses d'allocation, revenus, fiscalité société.              |
| Sous-types    | Placement trésorerie intégré, projection comptable, sortie de capitaux selon étape.                                                       |
| En amont      | Organigramme, valorisation titres, fiscalité société, dossier dirigeant.                                                                  |
| Après         | Rémunération, épargne salariale, holding, cession de titres, OBO, Dutreil.                                                                |
| CTA           | Ouvrir Trésorerie société en expert, puis simplifié après refonte.                                                                        |

### Succession & liquidité

| Champ         | Contenu                                                                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Titre court   | `Succession & liquidité`                                                                                                                                         |
| Titre complet | `Liquidation successorale et besoin de liquidité`                                                                                                                |
| Objectif      | Estimer la transmission, les droits et le besoin de liquidité pour éviter une stratégie patrimoniale non finançable.                                             |
| Calcule       | Masse successorale, droits, abattements, représentation, conjoint, enfants, assurances, PER assurance, prévoyance décès, liquidité disponible, effort à couvrir. |
| Entrées       | Identité, famille, régime matrimonial, donations antérieures, actifs/passifs, assurances, PER, prévoyance, société, immobilier, hypothèses de décès.             |
| En amont      | Filiation familiale, régime matrimonial, donations antérieures, actif/passif interne, donation & démembrement.                                                   |
| Après         | Prévoyance, donation & démembrement, stratégie de transmission, synthèse client future.                                                                          |
| CTA           | Ouvrir Succession.                                                                                                                                               |

### Donation & démembrement

| Champ         | Contenu                                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Titre court   | `Donation & démembrement`                                                                                                                    |
| Titre complet | `Donation, nue-propriété, usufruit et impact successoral`                                                                                    |
| Objectif      | Simuler une donation ou un démembrement et mesurer son effet fiscal, patrimonial et successoral.                                             |
| Calcule       | Valeur usufruit/nue-propriété, abattements disponibles, droits, rappel fiscal, réserve, liquidité, impact sur succession future.             |
| Entrées       | Donateur, donataires, lien de parenté, âge, actif donné, valeur, donations antérieures, régime matrimonial, clauses, société le cas échéant. |
| En amont      | Filiation, régime matrimonial, actif/passif interne, succession & liquidité.                                                                 |
| Après         | Succession & liquidité, Pacte Dutreil, stratégie de transmission.                                                                            |
| CTA           | À créer après découpage succession et socle dossier.                                                                                         |

## Mode simplifié et mode expert

### Mode simplifié

- Affiche les objectifs essentiels.
- Masque les leviers avancés : sous-types techniques, hypothèses rares, optimisations expertes, structures complexes.
- Ne change pas seul les hypothèses calculatoires.
- Exclut du moteur les champs masqués quand leur participation serait incohérente.
- Affiche les titres courts, les objectifs, les entrées nécessaires et un CTA clair.
- N'affiche pas `Actif/passif`, `PEA/CTO`, `Assurance-vie`, `Placement trésorerie` ni `Cession de titres` côté Foyer comme cartes autonomes.

### Mode expert

- Peut afficher des entrées `expertOnly`.
- Peut détailler les sous-types dans le panneau latéral.
- Peut montrer des badges chiffrés atténués.
- Peut exposer les sources juridiques, statuts moteurs, dépendances de dossier et avertissements.
- Ne doit pas contourner les mêmes moteurs que le mode simplifié.

### Tests obligatoires par mode

- Test Home simplifié : absence des cartes internalisées.
- Test Home expert : présence des entrées expert validées.
- Test moteur : les champs masqués en simplifié n'influencent pas le calcul si le parcours simplifié ne les expose pas.
- Test de route : chaque route active de `simRouteContracts` reste chargée par smoke authentifié.

## Rail commun dossier, chainage et versions

### Décision produit

Le rail de gauche doit exister dans les parcours globaux et dans `/sim/*`, avec une seule version commune. Sur mobile, le rail complet disparaît et devient une information compacte en haut, par exemple `Version 2025-10-01 active`.

En desktop, le composant commun est affiché à gauche dans `/audit`, dans `/strategy` ou le parcours global `Nouvelle stratégie`, et dans `/sim/*`. Dans `/sim/*`, il peut être plus compact que dans le parcours global, mais il utilise les mêmes données et reste la même implémentation.

### Contrat UX

| Surface     | Desktop                                                                         | Mobile                                     |
| ----------- | ------------------------------------------------------------------------------- | ------------------------------------------ |
| Home        | Pas de rail complet obligatoire ; accès à la version dossier si dossier chargé. | Pastille compacte si dossier chargé.       |
| `/audit`    | Rail complet : étapes dossier, documents, versions, activation stratégie.       | Pastille + menu compact.                   |
| `/strategy` | Rail complet : scénario, versions, activation, retour audit.                    | Pastille + menu compact.                   |
| `/sim/*`    | Rail gauche compact commun : version, statut, amont/aval, sauvegarde.           | Texte très court en haut : `Version xxxx`. |

### Contenu minimal du rail

- Dossier courant.
- Version active.
- Date de création des inputs.
- Date de dernière modification.
- Statut : brouillon, modifié, stratégie activée, archivé.
- Étape courante : Audit, Simulateur, Stratégie, Export.
- Chainage : amont utile, aval recommandé.
- Actions : sauvegarder, créer une version, comparer, revenir au dossier.

### Modèle de version

```ts
export interface DossierVersion {
  id: string;
  dossierId: string;
  label: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'modified' | 'strategyActivated' | 'archived';
  source: 'manual' | 'scan' | 'importSer1' | 'strategy';
  parentVersionId?: string;
  activatedStrategyId?: string;
  sourceRefs: SourceRef[];
  simulatorSnapshots: Record<string, unknown>;
}

export interface StrategyActivation {
  id: string;
  dossierId: string;
  sourceVersionId: string;
  activatedVersionId: string;
  activatedAt: string;
  replacesInitialSituation: true;
}
```

### Règle d'activation stratégie

Quand une stratégie est activée par le client, SER1 crée une nouvelle version active du dossier. Cette version remplace la situation patrimoniale initiale pour les futures éditions d'analyse patrimoniale, tout en conservant l'historique des versions précédentes.

Exemple :

- `2025-02-01` : création des inputs dossier.
- `2025-05-13` : modification du dossier.
- `2025-10-01` : stratégie activée par le client.
- Après `2025-10-01`, une nouvelle édition d'analyse patrimoniale part de la version activée, pas de la situation initiale.

### Critères de sortie rail

- Une seule implémentation commune.
- Gouvernance mise à jour pour documenter l'exception au menu vertical `/sim/*`.
- Aucun doublon d'export ni de mode simplifié/expert dans le rail.
- Mobile sans rail lourd.
- Sauvegarde/versioning testés au moins sur un flux audit -> simulateur -> stratégie.

## Scan documentaire

### Principe

Le scan documentaire n'est pas un assistant conversationnel et ne remplit pas directement des pages isolées. Il transforme des documents clients en propositions de champs sourcés dans un dossier patrimonial, validées par le CGP avant usage calculatoire.

L'OCR et l'extraction automatique ne sont pas implémentés maintenant. Les PR V2-01 à V2-13 doivent seulement garder des modèles compatibles avec `SourceRef`, `DossierPatrimonial`, les statuts de validation et les conflits de valeurs.

### Modèle `SourceRef`

```ts
export interface SourceRef {
  id: string;
  documentId: string;
  documentHash: string;
  documentLabel: string;
  page?: number;
  fieldPath: string;
  extractedValue: unknown;
  excerpt?: string;
  confidence: number;
  extractionRunId: string;
  provider: 'mistral' | 'manual';
  reviewStatus: 'proposed' | 'validated' | 'rejected' | 'superseded';
  conflictGroupId?: string;
  conflictsWith?: string[];
  validatedBy?: string;
  validatedAt?: string;
}
```

### Champs documentaires à couvrir

| Domaine            | Champs attendus                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| Identité           | Nom, prénom, date de naissance, adresse, résidence fiscale, identifiants utiles non exposés inutilement. |
| Famille            | Conjoint, enfants, personnes à charge, liens de parenté, situations particulières.                       |
| Régime matrimonial | Régime, contrat, clauses, date, pièces justificatives.                                                   |
| Donations          | Donations antérieures, bénéficiaires, dates, valeurs, abattements utilisés, démembrement.                |
| Retraite           | Statuts, droits, contrats retraite, PER, relevés, plafonds et versements.                                |
| IR                 | Avis d'impôt, revenus, charges, parts, TMI si calculée, crédits/réductions.                              |
| Sociétés           | Sociétés détenues, dirigeants, associés, organigramme, titres, comptes courants.                         |
| Bilans             | Bilan, compte de résultat, trésorerie, dettes, immobilisations, capitaux propres.                        |
| Actifs/passifs     | Immobilier, financier, liquidités, dettes, garanties, valeurs, propriétaires.                            |
| IFI                | Actifs taxables, dettes déductibles, exonérations, justificatifs.                                        |
| Budget             | Revenus, dépenses, capacité d'épargne, charges récurrentes.                                              |
| Prévoyance         | Contrats, capitaux, garanties, bénéficiaires, exclusions utiles.                                         |
| Placements         | Assurance-vie, PER, PEA, CTO, SCPI, contrats de capitalisation, relevés.                                 |
| Immobilier         | Titres, valeurs, loyers, charges, régime fiscal, crédits associés.                                       |
| Crédits            | Capital restant dû, taux, durée, garanties, assurance emprunteur.                                        |

### Règles de sécurité fonctionnelle

- Un champ extrait sans validation reste une proposition.
- Une valeur contradictoire crée un warning, pas un écrasement silencieux.
- Le moteur ne lit que les champs validés ou explicitement acceptés par le CGP.
- Les exports peuvent mentionner l'existence de sources, mais ne doivent pas exposer inutilement des extraits documentaires sensibles.
- Le modèle OCR exact doit être vérifié dans le runbook et la documentation officielle au moment de la PR d'intégration.

### Compatibilité attendue

Le modèle documentaire doit rester compatible avec :

- `SourceRef`.
- `DossierPatrimonial`.
- Champ proposé.
- Champ validé.
- Champ rejeté.
- Conflit de valeurs.
- Source documentaire.
- Score de confiance.
- Validation CGP obligatoire avant usage moteur.

## Références juridiques et vérification future

### Objectif

Chaque règle métier ou fiscale importante doit être rattachée à une référence listable. Le jour où un LLM vérifie les mises à jour officielles, il doit pouvoir :

1. Lister toutes les références du repo.
2. Identifier leur périmètre moteur.
3. Ouvrir les sources officielles.
4. Détecter les actualités ou modifications pertinentes.
5. Proposer une PR ciblée.

### Contrat `LegalReference`

```ts
export interface LegalReference {
  id: string;
  label: string;
  sourceType:
    | 'CGI'
    | 'Code civil'
    | 'Code des assurances'
    | 'Code de la sécurité sociale'
    | 'BOFiP'
    | 'BOSS'
    | 'Service-Public'
    | 'Doctrine professionnelle'
    | 'Autre source officielle';
  officialUrl: string;
  articleOrSection?: string;
  scope: string;
  volatility: 'annual' | 'lawChange' | 'stable';
  relatedEngines: string[];
  lastCheckedAt?: string;
  notes?: string;
}
```

### Garde-fous à ajouter

- Script `npm run check:legal-references` :
  - liste toutes les références ;
  - bloque les `officialUrl` vides ;
  - bloque les doublons d'ID ;
  - signale les références sans moteur rattaché ;
  - ne navigue pas sur le web.
- Futur script assisté `npm run audit:legal-news` :
  - non bloquant ;
  - autorisé à vérifier le web officiel ;
  - produit un rapport humain, pas une modification automatique.

## Exports et outputs moteurs

La V2 ne doit pas se disperser sur les exports.

Règles :

- Les exports existants restent non régressifs si une PR de refactor les impacte.
- Les exports ne recalculent jamais.
- Aucun nouveau chantier PPTX n'est créé dans cette séquence.
- Aucun nouveau chantier Excel n'est créé dans cette séquence.
- Aucun moteur n'est bloqué parce que son export futur n'existe pas encore.
- Chaque moteur produit des outputs propres, structurés et testables.
- Ces outputs pourront être consommés plus tard par Strategy, reporting, PPTX ou Excel.

Critère de PR moteur :

- `calculates` décrit le calcul réel du moteur.
- `outputs` décrit les résultats produits et leur forme métier.
- Un export existant touché par la PR reste vert.
- Un export non existant n'est pas créé pour satisfaire la PR.

## Ordre ferme de construction des moteurs

### Règle générale

Avant de créer trop de simulateurs visibles, SER1 stabilise les moteurs actifs et ceux qui débloquent le parcours Audit & stratégie. Les nouveaux simulateurs visibles arrivent seulement quand le moteur, la route, le scénario métier minimal, les tests et les références juridiques existent.

### Priorité 0 - Registry, Home, rail et références

Objectif : poser les fondations communes sans ajouter de calcul.

1. Registry minimale prouvée.
2. Home guidée.
3. Rail commun dossier/version.
4. Référentiel juridique listable.

### Priorité 1 - Stabiliser les moteurs déjà actifs

Objectif : éviter d'empiler de nouvelles surfaces sur des simulateurs trop larges.

1. IR : s'assurer qu'il est consommable par les autres moteurs via le dossier et le contexte fiscal.
2. Placement : clarifier sous-types PEA/CTO, assurance-vie, PER, SCPI sans cartes autonomes simplifiées.
3. Crédit : rattacher au dossier, garanties et immobilier.
4. PER : solidifier le hub, potentiel, transfert, Base CG retraite et outputs moteur.
5. Succession : découper le simulateur avant ajout donation/démembrement.
6. Trésorerie société : découper projection, foyer associé, allocation et outputs moteur avant ouverture simplifiée.
7. Prévoyance : durcir le moteur et la relation succession.

### Priorité 2 - Socle Audit

Objectif : produire un dossier patrimonial exploitable par tous les moteurs.

1. Identité et foyer.
2. Filiation familiale.
3. Régime matrimonial.
4. Donations antérieures.
5. Budget & épargne.
6. Actif/passif interne.
7. SourceRefs manuels, avant OCR.
8. Versioning dossier.

### Priorité 3 - Foyer fiscal, retraite et allocation

Objectif : transformer l'audit en recommandations patrimoniales.

1. IFI.
2. Retraite globale.
3. PER rattaché au dossier.
4. Placement & allocation rattaché au dossier.
5. Prévoyance rattachée succession.

### Priorité 4 - Immobilier

Objectif : couvrir les arbitrages patrimoniaux fréquents.

1. Crédit & garanties enrichi.
2. Investissement locatif.
3. Revenus fonciers.
4. LMNP/LMP.
5. SCPI.
6. SCI.
7. Plus-values immobilières.
8. Vendre / réemployer.

### Priorité 5 - Société & dirigeant

Objectif : ouvrir le parcours Société sans mélanger toutes les responsabilités dans Trésorerie.

1. Organigramme.
2. Valorisation titres.
3. Projection comptable.
4. Trésorerie société simplifiée.
5. Rémunération dirigeant.
6. Épargne salariale.
7. Sortie de capitaux.
8. Holding.
9. Cession de titres.
10. OBO.

### Priorité 6 - Transmission avancée

Objectif : finaliser les stratégies de transmission.

1. Donation & démembrement.
2. Succession & liquidité foyer/société unifiée.
3. Pacte Dutreil.
4. Prévoyance dirigeant.
5. Stratégies de transmission activables.

### Priorité 7 - Scan documentaire

Objectif : accélérer la création du dossier sans réduire le contrôle humain.

1. Upload documentaire dans Audit.
2. Stockage pages OCR et métadonnées.
3. Extraction structurée vers `DossierPatrimonial`.
4. Validation CGP champ par champ.
5. Alimentation des simulateurs depuis les champs validés.
6. Journalisation sourceRefs et coûts.

## Séquence de PR recommandée

Chaque PR doit être thématique, suffisamment complète pour fermer son sujet, mais pas si large qu'elle mélange fondations, moteurs et UI.

### PR V2-00 - Roadmap V2

But : remplacer l'ancienne roadmap par la V2 canonique.

Changements :

- Remplacer le contenu de `docs/ROADMAP.md` par la V2 validée.
- Ne pas conserver de `docs/ROADMAP_V2.md` concurrent.

Checks :

- `git diff --check`.
- Vérification Markdown si le repo dispose d'une commande adaptée.

Critères de sortie :

- La roadmap V2 est validée.
- La bascule documentaire ne conserve pas une ancienne roadmap concurrente.

### PR V2-01 - Registry minimale prouvée

But : créer la source de vérité métier sans modifier les moteurs.

Changements :

- Ajouter `src/domain/simulators/types.ts`.
- Ajouter `src/domain/simulators/registry.ts`.
- Ajouter `src/domain/simulators/homeMatrix.ts`.
- Ajouter `src/domain/simulators/chainage.ts`.
- Ajouter le contrat `contextPolicy` et la convention `simulateurContextAdapter`.
- Exposer dans `chainage.ts` les liens directs `upstream` / `next` et les parcours métier obligatoires.
- Mapper les routes existantes depuis `simRouteContracts`.
- Marquer chaque entrée : `active`, `hub`, `placeholder`, `planned`, `expertOnly`, `internalOnly`.
- Renseigner pour chaque entrée : `objective`, `inputs`, `calculates`, `outputs`, `upstream`, `next`, `dossierFields`, `legalRefs`, `testScenarios`, `contextPolicy`.
- Intégrer les décisions métier récentes :
  - `Actif/passif` internalOnly en simplifié.
  - PEA/CTO sous-type de Placement.
  - Assurance-vie sous-type ou expert.
  - Placement trésorerie sous-module de Trésorerie société.
  - Cession de titres visible côté Société uniquement.

Tests :

- Test unitaire registry : IDs uniques, routes valides, pas de chemin actif introuvable.
- Test unitaire chainage : chaque parcours métier référence des IDs connus ou des étapes explicitement `planned`.
- Test mode simplifié : exclusions visibles.
- Test de complétude : aucun simulateur codé ou refondu sans `outputs`, `legalRefs`, `dossierFields`, `testScenarios` et `contextPolicy`.
- `npm run check`.

Critères de sortie :

- Aucune route parallèle créée.
- Aucun moteur manquant créé.
- Aucune double registry créée.
- Les parcours métier obligatoires sont testés.
- Les simulateurs actifs documentent leur autonomie, leurs champs dossier et leur comportement en cas de champ manquant.
- Les décisions métier sont testées.

### PR V2-02 - Home guidée

But : remplacer la grille Home par l'expérience guidée.

Changements :

- Refondre `src/pages/Home.tsx`.
- Adapter `src/pages/Home.css` ou déplacer les styles vers une feature Home si le repo le justifie.
- Ajouter les composants Home nécessaires.
- Ajouter `Nouvelle stratégie` et `Scan documentaire`.
- Ajouter les deux espaces, onglets, accordéons et panneau latéral.
- Supprimer le hover chain coloré.
- Masquer ou atténuer les badges chiffrés.

Tests :

- Tests React/Home sur wording exact.
- Tests visibilité simplifié/expert.
- Tests absence des cartes internalisées.
- Tests des CTAs actifs.
- `npm run check`.
- `npm run test:e2e:auth-pages` si la Home ou les routes privées sont touchées par le flux.

Critères de sortie :

- La Home est pilotée par la registry.
- Les simulateurs non prêts ne créent pas de faux liens.
- Aucune ancienne Home concurrente ne reste dans le repo.
- L'expérience reste premium, sobre et cohérente avec les tokens.

### PR V2-03 - Rail commun et versions dossier

But : mettre en place le rail commun sans brancher encore tout le stockage durable.

Changements :

- Créer le modèle `DossierVersion`.
- Créer `DossierRail` commun.
- Brancher le rail sur `/audit`, `/strategy` et `/sim/*` sans dupliquer les contrôles existants.
- Garantir que `/sim/*` utilise la même implémentation et les mêmes données, même si l'affichage desktop est plus compact.
- Afficher une position dans un parcours métier : étapes précédentes, étape actuelle, étapes suivantes recommandées et branches possibles.
- Ajouter le comportement mobile en pastille compacte.
- Mettre à jour `docs/GOUVERNANCE.md` pour documenter l'exception au menu vertical.

Tests :

- Tests responsive du rail.
- Test mobile : rail complet absent, pastille présente.
- Test desktop : version et statut visibles.
- Test parcours : sur `Succession & liquidité`, le rail affiche le parcours `Transmission privée` avec les étapes précédentes et suivantes attendues.
- Smoke authentifié des routes impactées.
- `npm run check`.

Critères de sortie :

- Une seule version du rail.
- Aucun doublon d'export ou de mode.
- Le rail affiche un parcours, pas seulement une liste de liens directs.
- Les versions dossier sont modélisées même si le stockage Supabase vient plus tard.

### PR V2-04 - Références juridiques listables

But : rendre les règles vérifiables dans le temps.

Changements :

- Créer `src/domain/legal-references/`.
- Ajouter un premier jeu de références pour IR, PER, succession, placement, trésorerie.
- Ajouter `npm run check:legal-references`.
- Documenter le format dans `docs/ARCHITECTURE.md` ou `docs/METIER.md`.

Tests :

- Script de vérification des références.
- `npm run check`.

Critères de sortie :

- Les références sont listables par script.
- Aucune vérification web automatique bloquante n'est ajoutée.
- Les moteurs existants commencent à référencer les sources sans dupliquer les taux.

### PR V2-05 - Découpage Succession, comportement neutre

But : préparer Donation/Démembrement et Succession/Liquidité sans changer les résultats.

Changements :

- Identifier les responsabilités du simulateur succession.
- Extraire les composants ou hooks trop larges.
- Séparer au minimum :
  - saisie / données dossier ;
  - liquidation civile ;
  - liquidation fiscale ;
  - assurance-vie / PER assurance / prévoyance ;
  - liquidité successorale ;
  - affichage UI ;
  - outputs moteur.
- Ne pas ajouter de nouveau calcul métier.

Tests :

- Tests existants succession.
- Tests golden scenarios.
- Tests outputs succession.
- Tests exports existants uniquement si le refactor les impacte.
- `npm run check`.

Critères de sortie :

- Diff comportemental nul ou explicitement justifié.
- Les futures briques donation/démembrement ont un point d'extension propre.

### PR V2-06 - Découpage Trésorerie société, comportement neutre

But : séparer projection, foyer associé, allocation trésorerie et sorties.

Changements :

- Découper le simulateur par responsabilités.
- Isoler l'adaptateur moteur.
- Préparer le sous-module placement trésorerie sans carte autonome.
- Séparer au minimum :
  - projection comptable ;
  - trésorerie disponible ;
  - trésorerie de sécurité ;
  - CCA ;
  - flux société / dirigeant ;
  - allocation ou placement de trésorerie ;
  - sorties de capitaux ;
  - outputs moteur.
- Ne pas ouvrir le mode simplifié complet avant validation.

Tests :

- Tests moteur trésorerie.
- Tests outputs trésorerie.
- Tests exports existants uniquement si le refactor les impacte.
- Smoke `/sim/tresorerie-societe`.
- `npm run check`.

Critères de sortie :

- Le simulateur reste fonctionnel.
- La future ouverture simplifiée a une matrice claire.

### PR V2-07 - Socle dossier Audit

But : rendre les champs de dossier consommables par les simulateurs.

Changements :

- Créer le modèle `DossierPatrimonial`.
- Ajouter identité, foyer, famille, régime matrimonial, donations, budget, actif/passif interne.
- Ajouter sourceRefs manuels.
- Ajouter les premiers adapters de contexte ou les décisions explicites d'absence d'adapter pour les simulateurs actifs.
- Ajouter la provenance visible des champs préremplis.
- Brancher Audit sans OCR.

Tests :

- Tests modèle dossier.
- Tests sauvegarde/version.
- Tests consommation par au moins un simulateur actif.
- Tests adapter : dossier partiel, dossier complet, overrides locaux et absence de fallback métier silencieux.
- `npm run check`.

Critères de sortie :

- Le dossier devient la source amont.
- Les simulateurs ne possèdent pas chacun leur copie documentaire.
- Aucun moteur ne lit le dossier brut sans adapter.
- Le CGP peut modifier une valeur pour le calcul ou demander la mise à jour du dossier source.

### PR V2-08 - PER et retraite globale

But : faire du PER un parcours retraite intégré.

Changements :

- Rattacher PER au dossier.
- Ajouter ou préparer Retraite globale.
- Consolider potentiel et transfert dans le panneau/rail.
- Vérifier Base CG retraite et outputs moteur.

Tests :

- Tests PER existants.
- Tests Base-Contrat si touchée.
- Tests outputs PER.
- Tests exports existants uniquement si la PR les impacte.
- `npm run check`.

Critères de sortie :

- PER lit le dossier et le contexte fiscal.
- Le hub reste clair en simplifié.

### PR V2-09 - Placement & allocation unifiée

But : confirmer Placement comme parent de PEA/CTO, assurance-vie et allocation.

Changements :

- Rattacher Placement au dossier.
- Structurer les sous-types.
- Supprimer toute tentation de carte simplifiée autonome pour PEA/CTO ou assurance-vie.
- Préparer les outputs pour Strategy, le rail et de futurs exports.

Tests :

- Tests moteur placement.
- Tests visibilité Home.
- Tests outputs placement.
- Tests exports existants uniquement si la PR les impacte.
- `npm run check`.

Critères de sortie :

- Placement devient la porte d'entrée unique des enveloppes financières.

### PR V2-10 - Prévoyance et Succession/Liquidité

But : relier protection et transmission.

Changements :

- Rattacher Prévoyance au dossier.
- Relier les capitaux au moteur succession quand applicable.
- Stabiliser Succession & liquidité en panneau cible.

Tests :

- Tests prévoyance.
- Tests succession avec prévoyance.
- Tests outputs prévoyance et succession/liquidité.
- Tests exports existants uniquement si la PR les impacte.
- `npm run check`.

Critères de sortie :

- Le besoin de liquidité successoral devient exploitable pour la stratégie.

### PR V2-11 - Immobilier

But : ouvrir les moteurs immobiliers dans un ordre calculatoire cohérent.

Ordre interne :

1. Crédit & garanties enrichi.
2. Investissement locatif.
3. Revenus fonciers.
4. LMNP/LMP.
5. SCPI.
6. SCI.
7. Plus-values immobilières.
8. Vendre / réemployer.

Chaque moteur doit avoir :

- Inputs dossier.
- Moteur pur.
- Références juridiques.
- Route scaffoldée.
- Scénario e2e minimal.
- Outputs moteur structurés, avec export futur possible.

### PR V2-12 - Société & dirigeant

But : ouvrir le parcours Société après découpage Trésorerie.

Ordre interne :

1. Organigramme.
2. Valorisation titres.
3. Projection comptable.
4. Trésorerie société simplifiée.
5. Rémunération dirigeant.
6. Épargne salariale.
7. Sortie de capitaux.
8. Holding.
9. Cession de titres.
10. OBO.

Critères :

- `Cession de titres` visible côté Société uniquement.
- `Placement trésorerie` reste intégré à Trésorerie société.
- Aucun raccourci fiscal en dur.

### PR V2-13 - Donation, démembrement, Dutreil

But : compléter la transmission avancée.

Ordre interne :

1. Donation & démembrement foyer.
2. Donation & démembrement société.
3. Pacte Dutreil.
4. Succession/liquidité société.

Critères :

- Réutiliser le socle succession.
- Réutiliser filiation, régime matrimonial, donations antérieures.
- Références juridiques explicites.
- Outputs structurés pour export futur possible.
- Exports existants non régressifs uniquement si la PR les impacte.

### PR V2-14 - Scan documentaire

But : brancher l'OCR et l'extraction structurée au dossier.

Changements :

- Zone Scan documentaire dans Audit.
- Upload et file de traitement.
- Stockage pages OCR.
- Extraction vers champs de dossier.
- Validation CGP.
- SourceRefs et journalisation.

Tests :

- Tests d'upload.
- Tests extraction mockée.
- Tests validation/rejet.
- Tests alimentation dossier.
- Tests sécurité/logs si backend touché.
- `npm run check`.

Critères de sortie :

- Aucun champ extrait non validé ne devient hypothèse moteur silencieuse.
- Le scan accélère le dossier, il ne remplace pas la validation métier.

## Workflow obligatoire par PR

Chaque PR suit exactement cette séquence :

1. Resync local de `main`.
2. Branche dédiée depuis `main`.
3. Implémentation en commits cohérents.
4. Vérifications ciblées pendant le développement.
5. `npm run check` avant commit final ou impossibilité explicitée.
6. Push.
7. PR avec template.
8. CI observée jusqu'au vert.
9. Merge.
10. Resync `main`.
11. Review post-merge du diff réel.
12. Bilan de PR.
13. Passage à la PR suivante.

Points d'arrêt autorisés uniquement :

- CI bloquée.
- Droits GitHub insuffisants.
- Régression sévère.
- Décision produit nécessaire.

Si une PR découvre un ancien flux concurrent, un fallback métier non testé ou une dette structurante, il est traité immédiatement ou affecté à la PR suivante / une PR dédiée proche dans le bilan de PR.

## Bilan obligatoire après chaque PR

À la fin de chaque PR, produire :

- PR mergée : numéro et lien.
- SHA final.
- Stratégie de merge : merge commit, squash ou rebase.
- CI observée : checks vus et résultat.
- Dettes fermées.
- Dettes restantes : `fichier:ligne`, preuve, raison du report, PR cible, ou `Aucune dette restante identifiée`.
- Dettes nouvelles découvertes : même format, ou `Aucune dette nouvelle identifiée`.
- Action minimale recommandée.

À la fin de la séquence complète, produire le même bilan consolidé.

## Critère final de validation

La roadmap est validée si elle permet à un LLM autonome de comprendre :

- quoi créer ;
- dans quel ordre ;
- quel moteur calcule quoi ;
- quels outputs chaque moteur produit ;
- quelles données sont en amont ;
- quelles pages sont en aval ;
- quel statut a chaque simulateur ;
- ce qui est visible en simplifié ;
- ce qui est réservé expert ;
- comment le rail affiche la version et le chaînage ;
- comment éviter les anciens flux concurrents ;
- comment déclarer les dettes ;
- comment ne pas s'éparpiller sur les exports.

## Commandes de vérification de référence

Commandes usuelles à adapter selon la PR :

```powershell
npm run check
npm run test:e2e:auth-pages
npm run check:e2e-auth-pages-coverage
npm run check:fiscal-hardcode
npm run check:raw-fiscal-usage
npm run check:asset-budget
npm run check:large-files-baseline
git diff --check
```

Règle : ne pas promettre dans une PR un comportement non couvert par code, test, script ou documentation structurante.
