import type { MementoChapterId } from './types';

export interface MementoChapterEditorial {
  chapterId: MementoChapterId;
  summary: string;
  keyPoints: readonly string[];
}

export const MEMENTO_EDITORIAL = [
  {
    chapterId: 'foyer',
    summary:
      'Le foyer donne le point de départ du conseil : personnes concernées, liens familiaux et capacité à porter les projets.',
    keyPoints: [
      'Identifier les personnes à protéger avant de choisir un outil.',
      'Séparer les données de famille des règles fiscales ou civiles.',
      'Relier budget, objectifs et horizon patrimonial au dossier central.',
    ],
  },
  {
    chapterId: 'civil',
    summary:
      'Le civil explique qui possède quoi, qui décide et comment le patrimoine circule en cas de séparation ou de décès.',
    keyPoints: [
      'Lire le régime matrimonial avant toute projection successorale.',
      'Distinguer propriété, usufruit, nue-propriété et pouvoirs de gestion.',
      'Repérer les clauses utiles sans les transformer en conseil notarial automatique.',
    ],
  },
  {
    chapterId: 'patrimoine',
    summary:
      'Le patrimoine se lit comme une photo structurée : actifs, dettes, liquidités et masses à transmettre ou arbitrer.',
    keyPoints: [
      'Rattacher chaque actif au bon détenteur et au bon objectif.',
      'Séparer valeur de marché, valeur fiscale et valeur de conseil.',
      'Garder la synthèse actif-passif dans le dossier central.',
    ],
  },
  {
    chapterId: 'fiscalite-foyer',
    summary:
      'La fiscalité du foyer sert à comprendre la pression fiscale et les paramètres utilisés par les simulateurs.',
    keyPoints: [
      'Lire les mécanismes sans recopier les barèmes dans le texte.',
      'Vérifier que chaque valeur vient des settings chargés.',
      'Distinguer impôt courant, revenus du capital et fiscalité immobilière.',
    ],
  },
  {
    chapterId: 'transmission',
    summary:
      'La transmission prépare le passage du patrimoine : héritiers, libéralités, assurance-vie et liquidité disponible.',
    keyPoints: [
      'Commencer par la règle civile avant le calcul des droits.',
      'Séparer donation, succession et clause bénéficiaire.',
      'Vérifier la liquidité avant de promettre une stratégie transmissive.',
    ],
  },
  {
    chapterId: 'placements',
    summary:
      'Les placements comparent les enveloppes, leur usage patrimonial et les règles de sortie ou de transmission.',
    keyPoints: [
      'Choisir une enveloppe selon le projet, pas seulement selon sa fiscalité.',
      'Relier assurance-vie, capitalisation, titres et liquidités au référentiel contrats.',
      'Laisser les règles détaillées au catalogue Base-Contrat et à ses overrides.',
    ],
  },
  {
    chapterId: 'immobilier',
    summary:
      'L’immobilier combine usage, financement, fiscalité, détention et capacité de revente.',
    keyPoints: [
      'Qualifier le mode de détention avant de comparer les régimes.',
      'Séparer rendement, fiscalité, crédit et risque de liquidité.',
      'Garder les sujets planifiés prudents tant que le moteur n’existe pas.',
    ],
  },
  {
    chapterId: 'arbitrage',
    summary: 'L’arbitrage aide à choisir entre conserver, vendre, réemployer ou attendre.',
    keyPoints: [
      'Comparer les scénarios avec les mêmes hypothèses de départ.',
      'Ne pas confondre gain fiscal, risque pris et besoin de trésorerie.',
      'Tracer les effets société, foyer et transmission quand ils se croisent.',
    ],
  },
  {
    chapterId: 'retraite',
    summary:
      'La retraite obligatoire décrit les droits futurs sans simuler une carrière complète tant que le moteur reste planifié.',
    keyPoints: [
      'Identifier le régime avant de parler de liquidation.',
      'Séparer âge, durée, points, réversion et départ anticipé.',
      'Suivre la fonction publique comme chantier prévu tant qu’aucun simulateur ne l’exploite.',
    ],
  },
  {
    chapterId: 'epargne-retraite',
    summary:
      'L’épargne retraite relie effort d’épargne, fiscalité d’entrée, disponibilité et sortie en rente ou capital.',
    keyPoints: [
      'Distinguer PER, anciens contrats et épargne salariale.',
      'Lire les plafonds depuis les settings ou le dossier, jamais depuis le texte.',
      'Séparer transfert de contrat, potentiel de versement et liquidation.',
    ],
  },
  {
    chapterId: 'prevoyance',
    summary:
      'La prévoyance mesure la protection du foyer et du dirigeant face à l’arrêt de travail, l’invalidité et le décès.',
    keyPoints: [
      'Comparer régime obligatoire, maintien employeur et contrat privé.',
      'Relier les garanties au besoin familial avant de parler cotisation.',
      'Auditer les sources de caisse sans recopier leurs valeurs dans le mémento.',
    ],
  },
  {
    chapterId: 'societe',
    summary: 'La société rassemble résultat, distribution, trésorerie et opérations sur titres.',
    keyPoints: [
      'Séparer fiscalité société, droit des associés et stratégie patrimoniale.',
      'Relier dividendes, réserves et trésorerie aux simulateurs concernés.',
      'Garder les sujets de valorisation prudents tant que les preuves manquent.',
    ],
  },
  {
    chapterId: 'dirigeant',
    summary:
      'Le dirigeant se lit à la jonction de la rémunération, du social, de la retraite et de la protection familiale.',
    keyPoints: [
      'Identifier le statut social avant toute comparaison de rémunération.',
      'Distinguer revenu personnel, flux société et protection sociale.',
      'Ne pas activer les variantes planifiées sans contrat simulateur.',
    ],
  },
  {
    chapterId: 'transmission-entreprise',
    summary:
      'La transmission d’entreprise articule valeur des titres, engagement, fiscalité et liquidité de la famille.',
    keyPoints: [
      'Qualifier la société avant de parler Dutreil ou donation de titres.',
      'Séparer valeur économique, droits de vote et flux futurs.',
      'Coordonner les effets entreprise avec la transmission privée.',
    ],
  },
] as const satisfies readonly MementoChapterEditorial[];

export const MEMENTO_EDITORIAL_BY_CHAPTER = new Map<MementoChapterId, MementoChapterEditorial>(
  MEMENTO_EDITORIAL.map((entry) => [entry.chapterId, entry]),
);
