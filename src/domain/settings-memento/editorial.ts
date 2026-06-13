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
      'Le foyer décrit les personnes concernées, leurs liens familiaux et leur capacité à porter les projets patrimoniaux.',
    keyPoints: [
      'Qualifier la situation familiale, les personnes à charge et les liens de dépendance.',
      'Distinguer composition du foyer, rattachement fiscal et organisation patrimoniale.',
      'Situer les objectifs dans le temps pour lire correctement les autres dispositifs.',
    ],
  },
  {
    chapterId: 'civil',
    summary:
      'Le civil explique qui possède quoi, qui décide et comment le patrimoine circule en cas de séparation ou de décès.',
    keyPoints: [
      'Lire le régime matrimonial avant toute analyse successorale.',
      'Distinguer propriété, usufruit, nue-propriété et pouvoirs de gestion.',
      'Repérer les clauses civiles utiles sans les assimiler à un acte notarié.',
    ],
  },
  {
    chapterId: 'patrimoine',
    summary:
      'Le patrimoine se lit comme une photo structurée : actifs, dettes, liquidités et masses à transmettre ou arbitrer.',
    keyPoints: [
      'Rattacher chaque actif au bon détenteur et au bon objectif.',
      'Séparer valeur de marché, valeur fiscale et valeur de conseil.',
      'Distinguer les liquidités disponibles des actifs difficiles à céder.',
    ],
  },
  {
    chapterId: 'fiscalite-foyer',
    summary:
      'La fiscalité du foyer présente les mécanismes d’imposition des revenus, du patrimoine et des contributions associées.',
    keyPoints: [
      'Distinguer revenu imposable, quotient familial et revenus du capital.',
      'Lire les barèmes dans les tableaux de valeurs dédiés.',
      'Distinguer impôt courant, revenus du capital et fiscalité immobilière.',
    ],
  },
  {
    chapterId: 'transmission',
    summary:
      'La transmission prépare le passage du patrimoine : héritiers, libéralités, assurance-vie et liquidité disponible.',
    keyPoints: [
      'Commencer par la règle civile avant l’évaluation fiscale.',
      'Séparer donation, succession et clause bénéficiaire.',
      'Repérer la liquidité nécessaire au règlement de la transmission.',
    ],
  },
  {
    chapterId: 'placements',
    summary:
      'Les placements comparent les enveloppes, leur usage patrimonial et les règles de sortie ou de transmission.',
    keyPoints: [
      'Situer chaque enveloppe selon sa durée, sa disponibilité et sa fiscalité.',
      'Distinguer assurance-vie, capitalisation, titres et liquidités.',
      'Lire les règles détaillées dans le référentiel contrats.',
    ],
  },
  {
    chapterId: 'immobilier',
    summary:
      'L’immobilier combine usage, financement, fiscalité, détention et capacité de revente.',
    keyPoints: [
      'Qualifier le mode de détention avant de comparer les régimes.',
      'Séparer rendement, fiscalité, crédit et risque de liquidité.',
      'Distinguer immobilier d’usage, locatif et détention indirecte.',
    ],
  },
  {
    chapterId: 'arbitrage',
    summary: 'L’arbitrage aide à choisir entre conserver, vendre, réemployer ou attendre.',
    keyPoints: [
      'Comparer les scénarios avec les mêmes hypothèses de départ.',
      'Ne pas confondre gain fiscal, risque pris et besoin de trésorerie.',
      'Lire ensemble les effets sur le foyer, la société et la transmission.',
    ],
  },
  {
    chapterId: 'retraite',
    summary:
      'La retraite obligatoire expose les droits de base, les régimes complémentaires et les conditions de liquidation.',
    keyPoints: [
      'Identifier le régime avant de parler de liquidation.',
      'Séparer âge, durée, points, réversion et départ anticipé.',
      'Distinguer régimes salariés, indépendants, libéraux et fonction publique.',
    ],
  },
  {
    chapterId: 'epargne-retraite',
    summary:
      'L’épargne retraite relie effort d’épargne, fiscalité d’entrée, disponibilité et sortie en rente ou capital.',
    keyPoints: [
      'Distinguer PER, anciens contrats et épargne salariale.',
      'Lire les plafonds dans les tableaux de valeurs dédiés.',
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
      'Distinguer arrêt de travail, invalidité, décès et maintien de revenu.',
    ],
  },
  {
    chapterId: 'societe',
    summary: 'La société rassemble résultat, distribution, trésorerie et opérations sur titres.',
    keyPoints: [
      'Séparer fiscalité société, droit des associés et stratégie patrimoniale.',
      'Distinguer dividendes, réserves, compte courant et trésorerie disponible.',
      'Repérer les opérations sur titres et leurs effets pour les associés.',
    ],
  },
  {
    chapterId: 'dirigeant',
    summary:
      'Le dirigeant se lit à la jonction de la rémunération, du social, de la retraite et de la protection familiale.',
    keyPoints: [
      'Identifier le statut social avant toute comparaison de rémunération.',
      'Distinguer revenu personnel, flux société et protection sociale.',
      'Repérer les effets croisés entre rémunération, dividendes et prévoyance.',
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
