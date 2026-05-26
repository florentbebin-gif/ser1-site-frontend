export interface CgpGlossaryEntry {
  id: string;
  label: string;
  description: string;
}

export const CGP_GLOSSARY = {
  pfu: {
    id: 'pfu',
    label: 'PFU',
    description:
      'Prélèvement forfaitaire unique appliqué à certains revenus du capital, comparé au barème quand le simulateur le permet.',
  },
  tmi: {
    id: 'tmi',
    label: 'TMI',
    description:
      'Taux marginal d’imposition du foyer, utile pour mesurer l’impact d’un revenu ou d’une déduction supplémentaire.',
  },
  dmtg: {
    id: 'dmtg',
    label: 'DMTG',
    description:
      'Droits de mutation à titre gratuit, calculés lors d’une donation ou d’une succession selon le lien familial et les paramètres fiscaux.',
  },
  ifi: {
    id: 'ifi',
    label: 'IFI',
    description:
      'Impôt sur la fortune immobilière, à surveiller quand la stratégie augmente ou arbitre un patrimoine immobilier taxable.',
  },
  abattementResiduel: {
    id: 'abattement-residuel',
    label: 'Abattement résiduel',
    description:
      'Part d’abattement encore disponible après les transmissions déjà prises en compte dans le dossier.',
  },
  quotiteDisponible: {
    id: 'quotite-disponible',
    label: 'Quotité disponible',
    description:
      'Fraction du patrimoine dont le client peut disposer librement sans porter atteinte à la réserve héréditaire.',
  },
  per: {
    id: 'per',
    label: 'PER',
    description:
      'Plan d’épargne retraite, utilisé pour préparer une sortie en rente, en capital ou une combinaison des deux.',
  },
  prelevementsSociaux: {
    id: 'prelevements-sociaux',
    label: 'Prélèvements sociaux',
    description:
      'Prélèvements appliqués à certains revenus du patrimoine ou produits de placement selon leur nature.',
  },
  assiette: {
    id: 'assiette',
    label: 'Assiette',
    description:
      'Base de calcul retenue avant application d’un taux, d’un barème, d’un abattement ou d’une règle de plafonnement.',
  },
  plusValue: {
    id: 'plus-value',
    label: 'Plus-value',
    description:
      'Gain constaté entre une valeur de référence et une valeur de sortie, avant fiscalité éventuelle.',
  },
  roi: {
    id: 'roi',
    label: 'ROI',
    description:
      'Rapport entre les flux récupérés et l’effort total engagé, utile pour comparer deux stratégies patrimoniales.',
  },
  usufruit: {
    id: 'usufruit',
    label: 'Usufruit',
    description:
      'Droit d’utiliser un bien ou d’en percevoir les revenus sans en détenir la pleine propriété.',
  },
  nuePropriete: {
    id: 'nue-propriete',
    label: 'Nue-propriété',
    description:
      'Droit de propriété privé de l’usage courant du bien, souvent combiné avec un usufruit temporaire ou viager.',
  },
  renteViagere: {
    id: 'rente-viagere',
    label: 'Rente viagère',
    description:
      'Revenu périodique versé tant que le bénéficiaire est en vie, selon les conditions du contrat ou du régime.',
  },
  baseTaxable: {
    id: 'base-taxable',
    label: 'Base taxable',
    description:
      'Montant retenu après retraitements et abattements pour calculer un impôt, un droit ou un prélèvement.',
  },
} as const satisfies Record<string, CgpGlossaryEntry>;

export const CGP_GLOSSARY_ENTRIES = Object.values(CGP_GLOSSARY);
