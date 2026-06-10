import type { MementoEntry } from './types';

export const MEMENTO_TRANSMISSION_ENTRIES = [
  {
    chapterId: 'transmission',
    key: 'transmission.succession-dmtg',
    label: 'Succession et DMTG',
    description:
      'Droits de mutation à titre gratuit, exonération conjoint ou partenaire pacsé et repères civils de dévolution pour le simulateur succession.',
    status: 'couvert',
    statusReason:
      'Paramètres DMTG administrés et sourcés via les claims settings-references ; simulateur succession actif.',
    priority: 'critique',
    ownerPagePath: '/settings/dmtg-succession',
    registryKeys: ['transmission.dmtg-succession'],
    claimKeys: ['dmtg-fiscal-values-current', 'dmtg-conjoint-pacs-exoneration-cgi-796-0-bis'],
    refIds: ['cgi-777', 'cgi-779', 'code-civil-720', 'code-civil-912', 'code-civil-913'],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['succession'],
  },
  {
    chapterId: 'transmission',
    key: 'transmission.assurance-vie-deces',
    label: 'Assurance-vie au décès',
    description:
      'Régimes décès de l’assurance-vie rattachés à la page DMTG, séparés de l’angle enveloppe et rachat porté par Base-Contrat.',
    status: 'couvert',
    statusReason:
      'Paramètres décès administrés et sourcés via les claims settings-references ; lecture consommée par le simulateur succession actif.',
    priority: 'critique',
    ownerPagePath: '/settings/dmtg-succession',
    registryKeys: ['transmission.assurance-vie-deces'],
    claimKeys: ['assurance-vie-990i-757b'],
    refIds: ['cgi-990-i', 'cgi-757-b', 'boi-enr-dmtg-10-10-20-20'],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['succession'],
  },
  {
    chapterId: 'transmission',
    key: 'transmission.donation-demembrement',
    label: 'Donation et démembrement',
    description:
      'Donation simple, donation-partage, rapport civil et usufruit ou nue-propriété comme préparation d’une transmission future.',
    status: 'planned',
    statusReason:
      'Simulateur donation et démembrement planifié ; les claims DMTG existent mais le moteur dédié n’est pas livré.',
    priority: 'critique',
    ownerPagePath: '/settings/dmtg-succession',
    registryKeys: [],
    claimKeys: [
      'donation-rappel-fiscal-15-ans',
      'donation-rapport-reduction',
      'don-familial-sommes-790g',
      'usufruit-nue-propriete-cgi-669',
    ],
    refIds: [
      'cgi-784',
      'cgi-790-g',
      'cgi-669',
      'code-civil-894',
      'code-civil-1075',
      'code-civil-1078',
    ],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['donation-demembrement'],
  },
  {
    chapterId: 'transmission-entreprise',
    key: 'transmission-entreprise.pacte-dutreil',
    label: 'Pacte Dutreil',
    description:
      'Transmission d’entreprise sous engagement Dutreil, avec rattachement au paramètre settings planifié et aux sources fiscales existantes.',
    status: 'planned',
    statusReason:
      'Simulateur Pacte Dutreil planifié ; le registry settings identifie le besoin sans activer de moteur dédié.',
    priority: 'structurant',
    ownerPagePath: '/settings/dmtg-succession',
    registryKeys: ['transmission.dutreil'],
    claimKeys: [],
    refIds: ['base-source-art-787-b-cgi-pacte-dutreil'],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['pacte-dutreil'],
  },
  {
    chapterId: 'transmission-entreprise',
    key: 'transmission-entreprise.donation-titres',
    label: 'Donation de titres de société',
    description:
      'Donation de titres et démembrement société comme couverture métier future, sans simulateur registry autonome aujourd’hui.',
    status: 'planned',
    statusReason:
      'Variante société ROADMAP-only ; la valorisation et le modèle société relèvent du jalon société avant calcul.',
    priority: 'structurant',
    ownerPagePath: '/settings/dmtg-succession',
    registryKeys: [],
    claimKeys: [],
    refIds: [
      'cgi-669',
      'cgi-784',
      'code-civil-894',
      'code-civil-1075',
      'code-civil-1078',
      'base-source-art-787-b-cgi-pacte-dutreil',
    ],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: [],
  },
  {
    chapterId: 'transmission-entreprise',
    key: 'transmission-entreprise.liquidite-societe',
    label: 'Liquidité successorale société',
    description:
      'Anticipation de la liquidité liée à une société transmise, en attente du modèle société et valorisation.',
    status: 'planned',
    statusReason:
      'Variante société ROADMAP-only ; le calcul dépend du futur modèle société, des titres et des besoins de liquidité.',
    priority: 'structurant',
    ownerPagePath: '/settings/dmtg-succession',
    registryKeys: [],
    claimKeys: [],
    refIds: [
      'cgi-777',
      'cgi-779',
      'code-civil-720',
      'code-civil-912',
      'code-civil-913',
      'base-source-art-787-b-cgi-pacte-dutreil',
    ],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: [],
  },
] as const satisfies readonly MementoEntry[];
