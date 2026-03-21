import type {
  FamilyBranch,
  FamilyMemberType,
  SituationMatrimoniale,
  SuccessionAssetCategory,
  SuccessionAssuranceVieContractType,
  SuccessionPatrimonialContext,
  SuccessionDispositionTestamentaire,
  SuccessionDonationEntreEpouxOption,
  SuccessionDonationEntryType,
  SuccessionPrimarySide,
} from './successionDraft.types';
import { TESTAMENT_TYPE_DESCRIPTIONS } from './successionTestament';

export const SITUATION_OPTIONS: { value: SituationMatrimoniale; label: string }[] = [
  { value: 'celibataire', label: 'Célibataire' },
  { value: 'marie', label: 'Marié(e)' },
  { value: 'pacse', label: 'Pacsé(e)' },
  { value: 'concubinage', label: 'Union libre' },
  { value: 'divorce', label: 'Divorcé(e)' },
  { value: 'veuf', label: 'Veuf / veuve' },
];

export const PACS_CONVENTION_OPTIONS = [
  { value: 'separation', label: 'Séparation de biens (défaut)' },
  { value: 'indivision', label: 'Indivision conventionnelle' },
];

export const OUI_NON_OPTIONS = [
  { value: 'non', label: 'Non' },
  { value: 'oui', label: 'Oui' },
];

export const DISPOSITION_TESTAMENTAIRE_OPTIONS: {
  value: SuccessionDispositionTestamentaire;
  label: string;
  description: string;
}[] = [
  { value: 'legs_universel', label: 'Legs universel', description: TESTAMENT_TYPE_DESCRIPTIONS.legs_universel },
  { value: 'legs_titre_universel', label: 'Legs a titre universel', description: TESTAMENT_TYPE_DESCRIPTIONS.legs_titre_universel },
  { value: 'legs_particulier', label: 'Legs particulier', description: TESTAMENT_TYPE_DESCRIPTIONS.legs_particulier },
];

export const DONATION_ENTRE_EPOUX_OPTIONS: {
  value: SuccessionDonationEntreEpouxOption;
  label: string;
}[] = [
  { value: 'usufruit_total', label: 'Totalité en usufruit' },
  { value: 'pleine_propriete_quotite', label: 'Quotité disponible en pleine propriété' },
  { value: 'mixte', label: 'Option mixte 1/4 PP + 3/4 usufruit' },
  { value: 'pleine_propriete_totale', label: 'Totalité en pleine propriété' },
];

export const CHOIX_LEGAL_CONJOINT_OPTIONS = [
  { value: '__moteur__', label: 'Hypothèse moteur (1/4 en pleine propriété)' },
  { value: 'usufruit', label: 'Usufruit de la totalité (art. 757 CC)' },
  { value: 'quart_pp', label: '1/4 en pleine propriété (art. 757 CC)' },
];

export const DONATION_TYPE_OPTIONS: { value: SuccessionDonationEntryType; label: string }[] = [
  { value: 'rapportable', label: 'Avance de part successorale' },
  { value: 'hors_part', label: 'Hors part successorale' },
];

export const ASSET_CATEGORY_OPTIONS: { value: SuccessionAssetCategory; label: string }[] = [
  { value: 'immobilier', label: 'Biens immobiliers' },
  { value: 'financier', label: 'Biens financiers et autres biens' },
  { value: 'professionnel', label: 'Biens professionnels' },
  { value: 'divers', label: 'Biens divers' },
  { value: 'passif', label: 'Passifs' },
];

export const ASSET_SUBCATEGORY_OPTIONS: Record<SuccessionAssetCategory, string[]> = {
  immobilier: [
    'Résidence principale',
    'Résidence secondaire',
    'Immobilier locatif',
    'Autre immobilier',
    'Droits en usufruit',
    // Sous-catégories spéciales — ajoutées en fin de liste pour ne pas devenir le défaut
    'GFA/GFV',
    'GFF/GF',
  ],
  financier: [
    'Comptes bancaires (ex : compte courant)',
    'Valeurs mobilières (ex : FCPI, actions)',
    'Épargne réglementée (ex : Livret A, PEL)',
    'Autres biens financiers (ex : crypto, or)',
    // Sous-catégories spéciales
    'Assurance vie',
    'PER assurance',
  ],
  professionnel: [
    'Parts sociales',
    'Fonds de commerce',
    'Autres biens professionnels',
  ],
  divers: [
    'Véhicules',
    'Mobilier',
    'Autres biens divers',
    // Sous-catégorie spéciale
    'Prévoyance décès',
  ],
  passif: [
    'Emprunts immobiliers',
    'Dettes diverses',
    'Passifs professionnels',
  ],
};

// Valeurs sentinelles identifiant les sous-catégories spéciales (transformation de ligne)
export const SPECIAL_ASSET_SUBCATEGORIES = [
  'GFA/GFV',
  'GFF/GF',
  'Assurance vie',
  'PER assurance',
  'Prévoyance décès',
] as const;

export type SpecialAssetSubcategory = (typeof SPECIAL_ASSET_SUBCATEGORIES)[number];

export const ASSURANCE_VIE_TYPE_OPTIONS: {
  value: SuccessionAssuranceVieContractType;
  label: string;
}[] = [
  { value: 'standard', label: 'Clause standard' },
  { value: 'demembree', label: 'Clause démembrée' },
  { value: 'personnalisee', label: 'Clause personnalisée' },
];

export const MEMBER_TYPE_OPTIONS: { value: FamilyMemberType; label: string }[] = [
  { value: 'petit_enfant', label: 'Petit-enfant' },
  { value: 'parent', label: 'Parent' },
  { value: 'frere_soeur', label: 'Frère / Sœur' },
  { value: 'oncle_tante', label: 'Oncle / Tante' },
  { value: 'tierce_personne', label: 'Tierce personne' },
];

export const BRANCH_OPTIONS: { value: FamilyBranch; label: string }[] = [
  { value: 'epoux1', label: 'Côté Époux 1' },
  { value: 'epoux2', label: 'Côté Époux 2' },
];

export const MEMBER_TYPE_NEEDS_BRANCH: FamilyMemberType[] = ['parent', 'frere_soeur', 'oncle_tante'];

export const TESTAMENT_SIDES: SuccessionPrimarySide[] = ['epoux1', 'epoux2'];

export const CLAUSE_BENEFICIAIRE_PRESETS: { value: string; label: string }[] = [
  { value: 'conjoint_enfants', label: 'Conjoint survivant, à défaut enfants, à défaut héritiers' },
  { value: 'enfants_parts_egales', label: 'Les enfants par parts égales' },
  { value: 'personnalisee', label: 'Personnalisée' },
];

export const CLAUSE_CONJOINT_LABEL = 'Conjoint survivant, à défaut enfants, à défaut héritiers';
export const CLAUSE_ENFANTS_LABEL = 'Les enfants par parts égales';
export const RESIDENCE_PRINCIPALE_SUBCATEGORY = ASSET_SUBCATEGORY_OPTIONS.immobilier[0];
export const RESIDENCE_SECONDAIRE_SUBCATEGORY = ASSET_SUBCATEGORY_OPTIONS.immobilier[1];

export const DECES_DANS_X_ANS_OPTIONS: {
  value: SuccessionPatrimonialContext['decesDansXAns'];
  label: string;
}[] = [
  { value: 0, label: 'Aujourd\'hui' },
  { value: 5, label: 'Dans 5 ans' },
  { value: 10, label: 'Dans 10 ans' },
  { value: 15, label: 'Dans 15 ans' },
  { value: 20, label: 'Dans 20 ans' },
  { value: 25, label: 'Dans 25 ans' },
  { value: 30, label: 'Dans 30 ans' },
  { value: 35, label: 'Dans 35 ans' },
  { value: 40, label: 'Dans 40 ans' },
  { value: 45, label: 'Dans 45 ans' },
  { value: 50, label: 'Dans 50 ans' },
];
