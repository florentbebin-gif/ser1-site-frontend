import { DEFAULT_TAX_SETTINGS } from '@/constants/settingsDefaults';
import type { LegalReferenceId } from '@/domain/legal-references';

export const DEFAULT_DONATION = DEFAULT_TAX_SETTINGS.donation;

export interface LiberaliteReference {
  id: string;
  family: string;
  label: string;
  definition: string;
  impact: string;
  minimumFields: string[];
  legalRefIds: LegalReferenceId[];
}

export interface AvantageMatrimonialReference {
  id: string;
  label: string;
  definition: string;
  impact: string;
  minimumFields: string[];
  legalRefIds: LegalReferenceId[];
}

export const RESERVE_HEREDITAIRE = [
  { enfants: 1, reserve: '1/2', quotiteDisponible: '1/2' },
  { enfants: 2, reserve: '2/3', quotiteDisponible: '1/3' },
  { enfants: '3+', reserve: '3/4', quotiteDisponible: '1/4' },
];

export const DROITS_CONJOINT = [
  { situation: 'Sans enfant', droits: 'Pleine propriété ou 1/4 PP + 3/4 usufruit (selon option)' },
  { situation: 'Enfants communs', droits: '1/4 en PP ou usufruit sur totalité (option)' },
  { situation: 'Enfants non communs', droits: '1/4 en PP uniquement' },
];

export const SITUATIONS_FAMILIALES_SUCCESSION = [
  {
    id: 'celibataire',
    label: 'Célibataire',
    cadre: 'Aucun régime matrimonial',
    incidence: 'Pas de droits successoraux automatiques pour un partenaire non marié.',
  },
  {
    id: 'marie',
    label: 'Marié(e)',
    cadre: 'Régime matrimonial (légal ou conventionnel)',
    incidence: 'Liquidation du régime avant partage successoral.',
  },
  {
    id: 'pacse',
    label: 'Pacsé(e)',
    cadre: 'Séparation de biens par défaut ; indivision conventionnelle possible',
    incidence:
      'Pas de vocation successorale légale sans testament ; exonération fiscale spécifique si successible.',
  },
  {
    id: 'union_libre',
    label: 'Union libre',
    cadre: 'Aucun régime matrimonial',
    incidence: 'Pas de vocation successorale légale ; transmission seulement via libéralité.',
  },
  {
    id: 'divorce',
    label: 'Divorcé(e)',
    cadre: 'Régime matrimonial dissous',
    incidence: 'Ex-conjoint sans droits successoraux légaux.',
  },
  {
    id: 'veuf',
    label: 'Veuf / veuve',
    cadre: 'Succession antérieure ouverte',
    incidence: 'Nécessite vérifier les droits déjà recueillis et remploi des biens.',
  },
];

export const LIBERALITES_REFERENCE = [
  {
    id: 'donation_simple',
    family: 'Donations entre vifs',
    label: 'Donation simple (pleine propriété)',
    definition: "Transmission immédiate et irrévocable d'un bien au donataire.",
    impact:
      "Peut être rapportable à la succession et potentiellement réductible en cas d'atteinte à la réserve.",
    minimumFields: [
      "Date de l'acte",
      'Donateur / donataire',
      'Valeur retenue',
      'Bien transmis',
      'Hors part successorale (oui/non)',
    ],
    legalRefIds: ['code-civil-894', 'code-civil-843', 'code-civil-920'],
  },
  {
    id: 'donation_reserve_usufruit',
    family: 'Donations entre vifs',
    label: "Donation avec réserve d'usufruit",
    definition: "Le donateur conserve l'usufruit et transmet la nue-propriété.",
    impact:
      "Réduit l'assiette transmise immédiatement ; à réintégrer civilement selon règles de rapport/réduction.",
    minimumFields: [
      'Date',
      'Valorisation usufruit/nue-propriété',
      "Âge de l'usufruitier",
      'Bien donné',
    ],
    legalRefIds: ['code-civil-894', 'code-civil-578', 'code-civil-843', 'code-civil-922'],
  },
  {
    id: 'donation_partage',
    family: 'Donations entre vifs',
    label: 'Donation-partage',
    definition: 'Donation avec répartition organisée entre héritiers présomptifs.',
    impact:
      "Fige en principe les valeurs au jour de l'acte pour les biens allotis, utile pour limiter les conflits de rapport.",
    minimumFields: [
      'Date',
      'Bénéficiaires',
      'Lots attribués',
      'Valeur par lot',
      'Soulte éventuelle',
    ],
    legalRefIds: ['code-civil-1075', 'code-civil-1078'],
  },
  {
    id: 'donation_graduelle_residuelle',
    family: 'Donations entre vifs',
    label: 'Donation graduelle / résiduelle',
    definition:
      'Transmission en deux temps avec charge de conserver (graduelle) ou de transmettre le reliquat (résiduelle).',
    impact:
      'Organise la transmission intergénérationnelle ; nécessite un suivi précis des charges et du reliquat.',
    minimumFields: [
      'Date',
      'Premier gratifié',
      'Second gratifié',
      'Biens concernés',
      'Nature de la charge',
    ],
    legalRefIds: ['code-civil-1048', 'code-civil-1057'],
  },
  {
    id: 'legs_universel',
    family: 'Dispositions testamentaires',
    label: 'Legs universel',
    definition: "Le testateur lègue l'universalité de ses biens.",
    impact:
      "S'exécute dans la limite de la réserve héréditaire et peut être réduit si la quotité disponible est dépassée.",
    minimumFields: ['Type de testament', 'Date', 'Légataire', 'Clause de quotité / cantonnement'],
    legalRefIds: [
      'code-civil-1002',
      'code-civil-1003',
      'code-civil-912',
      'code-civil-913',
      'code-civil-920',
    ],
  },
  {
    id: 'legs_titre_universel',
    family: 'Dispositions testamentaires',
    label: 'Legs à titre universel',
    definition: 'Le testateur lègue une quote-part (ex. moitié) ou une catégorie de biens.',
    impact:
      "S'impute sur la quotité disponible ; contrôle de réduction nécessaire en présence d'héritiers réservataires.",
    minimumFields: ['Type de testament', 'Quote-part / catégorie léguée', 'Légataire', 'Date'],
    legalRefIds: ['code-civil-1002', 'code-civil-1010', 'code-civil-912', 'code-civil-920'],
  },
  {
    id: 'legs_particulier',
    family: 'Dispositions testamentaires',
    label: 'Legs particulier',
    definition: 'Le testateur lègue un ou plusieurs biens déterminés.',
    impact:
      "Priorité d'analyse sur valorisation du bien légué et respect de la réserve des héritiers.",
    minimumFields: ['Type de testament', 'Bien légué', 'Valeur estimée', 'Légataire', 'Date'],
    legalRefIds: ['code-civil-1002', 'code-civil-1010', 'code-civil-912', 'code-civil-920'],
  },
  {
    id: 'donation_entre_epoux',
    family: 'Donation entre époux',
    label: 'Donation au dernier vivant',
    definition: 'Libéralité entre époux visant à étendre les droits du conjoint survivant.',
    impact:
      'Augmente les options civiles du conjoint survivant, sous réserve des droits réservataires des descendants.',
    minimumFields: [
      "Date de l'acte",
      'Époux donateur',
      'Étendue des options (usufruit/pleine propriété)',
      "Présence d'enfants non communs",
    ],
    legalRefIds: ['code-civil-1094-1'],
  },
] satisfies LiberaliteReference[];

export const AVANTAGES_MATRIMONIAUX_REFERENCE = [
  {
    id: 'preciput',
    label: 'Clause de préciput',
    definition: 'Autorise le conjoint survivant à prélever certains biens communs avant partage.',
    impact:
      'Améliore la protection du conjoint sans passer par une libéralité successorale classique.',
    minimumFields: [
      'Date du contrat de mariage ou avenant',
      'Biens/somme concernés',
      'Valeur estimée',
      "Condition d'application au décès",
    ],
    legalRefIds: ['code-civil-1515', 'code-civil-1516', 'code-civil-1518', 'code-civil-1519'],
  },
  {
    id: 'parts_inegales',
    label: 'Stipulation de parts inégales',
    definition: 'Prévoit une répartition conventionnelle de la communauté différente du 50/50.',
    impact: "Modifie la masse revenant à chaque époux avant l'ouverture de la succession.",
    minimumFields: [
      'Quote-part convenue par époux',
      'Date du contrat',
      'Base de calcul (actif et dettes)',
      'Eventuelles limites prévues',
    ],
    legalRefIds: ['code-civil-1520', 'code-civil-1521', 'code-civil-1524', 'code-civil-1525'],
  },
  {
    id: 'attribution_integrale',
    label: 'Attribution intégrale de la communauté',
    definition: 'Attribue au survivant la totalité de la communauté en cas de décès.',
    impact:
      'Retarde en pratique la transmission aux enfants au second décès ; effet majeur sur la liquidité successorale du premier décès.',
    minimumFields: [
      'Existence de la clause (oui/non)',
      'Date du contrat',
      'Perimètre des biens communs',
      "Présence d'enfants non communs",
    ],
    legalRefIds: ['code-civil-1524', 'code-civil-1525'],
  },
  {
    id: 'usufruit_part_prededece',
    label: 'Usufruit conventionnel sur la part du prédécédé',
    definition: "Accorde au survivant, en plus de sa moitié, l'usufruit de la part du prédécédé.",
    impact:
      "Renforce les droits d'usage et de revenus du survivant avant partage définitif en nue-propriété.",
    minimumFields: [
      'Existence de la clause',
      'Biens concernés',
      'Valeur usufruit / nue-propriété',
      'Regles de contribution aux dettes',
    ],
    legalRefIds: ['code-civil-1524'],
  },
] satisfies AvantageMatrimonialReference[];
