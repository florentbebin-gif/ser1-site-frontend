export const TRANSFER_FEE_REGULATION_LINES = [
  {
    title: 'PER individuel et collectif',
    body: "Frais de transfert plafonnés à 1 % de l'épargne accumulée tant que le plan a moins de 5 ans ; frais nuls au-delà de 5 ans de détention (art. L224-6 III du Code monétaire et financier).",
  },
  {
    title: 'PERP, Madelin, Article 83 vers un PER',
    body: 'Depuis le 24 octobre 2024, les transferts visés à l’article L224-40 I bis sont plafonnés à 1 % des droits acquis, puis à 0 % après 10 ans depuis le premier versement (art. D224-18 du Code monétaire et financier). La date de souscription saisie sert d’approximation prudente du premier versement.',
  },
  {
    title: 'PERCO ancien — transfert individuel',
    body: 'Les frais sortants sont souvent nuls sur un transfert individuel de PERCO. Le simulateur retient donc 0 % par défaut ; si la notice prévoit des frais, ils restent plafonnés par L224-40 / D224-18 (1 % maximum, puis 0 % après 10 ans). Vérifier aussi les frais de tenue de compte-conservation.',
  },
];

export type TransferAllowedRule =
  | 'free'
  | 'after_leaving_company'
  | 'every_3_years_if_active'
  | 'unknown';

export interface TransferRuleInfo {
  rule: TransferAllowedRule;
  label: string;
  legalRef: string;
  details: string;
}

export const TRANSFER_RULES_BY_TYPE = {
  PERIN: {
    rule: 'free',
    label: 'Transférable vers un autre PER individuel',
    legalRef: 'Art. L224-6 et L224-40 C. mon. fin.',
    details:
      'Le transfert est possible selon les conditions du plan, avec contrôle des frais sortants et de la date du premier versement.',
  },
  PERP: {
    rule: 'free',
    label: 'Transférable vers un PER individuel',
    legalRef: 'Art. L224-40 C. mon. fin.',
    details:
      'Les droits des anciens PERP peuvent être transférés vers un PER, sous réserve des informations communiquées par l’assureur sortant.',
  },
  MADELIN: {
    rule: 'free',
    label: 'Transférable vers un PER individuel',
    legalRef: 'Art. L224-40 C. mon. fin.',
    details:
      'Les droits Madelin retraite peuvent être transférés vers un PER et sont suivis dans le compartiment volontaire.',
  },
  PER_POINTS: {
    rule: 'free',
    label: 'Transférable selon la valeur communiquée',
    legalRef: 'Art. L224-40 C. mon. fin. et notice du régime',
    details:
      'Pour les contrats en points, la valeur de transfert nette doit être vérifiée sur le relevé ou auprès de l’assureur.',
  },
  ARTICLE83: {
    rule: 'after_leaving_company',
    label: 'Transférable après départ de l’entreprise',
    legalRef: 'Art. L224-40 C. mon. fin.',
    details:
      'Le transfert n’est pas possible tant que le bénéficiaire reste tenu d’adhérer au contrat de l’entreprise.',
  },
  PEROB: {
    rule: 'after_leaving_company',
    label: 'Transférable après départ de l’entreprise',
    legalRef: 'Art. L224-40 C. mon. fin.',
    details:
      'Le régime est aligné sur les droits obligatoires : transfert possible lorsque l’adhésion n’est plus obligatoire.',
  },
  PERCO: {
    rule: 'every_3_years_if_active',
    label: 'Un transfert tous les trois ans avant départ',
    legalRef: 'Art. L224-40 III C. mon. fin. ; art. L3334-1 C. trav. ; art. L224-1 C. mon. fin.',
    details:
      'Le transfert de droits individuels d’un plan d’épargne pour la retraite collectif mentionné à l’article L3334-1 du code du travail vers un plan d’épargne retraite mentionné à l’article L224-1 avant le départ de l’entreprise du salarié n’est possible que dans la limite d’un transfert tous les trois ans. Après départ, le transfert devient libre.',
  },
  PERECO: {
    rule: 'every_3_years_if_active',
    label: 'Même règle pour le PER d’entreprise collectif',
    legalRef: 'Art. L224-18 et L224-40 III C. mon. fin.',
    details:
      'Pour un PER d’entreprise collectif, la logique est identique : avant le départ de l’entreprise, transfert vers un PER individuel dans la limite d’un transfert tous les trois ans ; après départ, transfert libre.',
  },
  AUTRE: {
    rule: 'unknown',
    label: 'À vérifier au cas par cas',
    legalRef: 'Conditions générales du contrat',
    details:
      'Le contrat doit être qualifié avant recommandation : compartiment, disponibilité du transfert et frais sortants.',
  },
} satisfies Record<string, TransferRuleInfo>;

export const SMALL_ANNUITY_RULES_INFO =
  'Si la rente mensuelle issue de la conversion est inférieure au seuil légal en vigueur dans les paramètres fiscaux, la sortie en capital unique peut être autorisée. Le forfait historique ne doit pas être appliqué aux prestations issues d’un PER transféré via L224-40.';

export const QUOTIENT_RULES_INFO =
  'Le système du quotient peut lisser l’imposition d’une sortie en capital assimilée à un revenu exceptionnel. L’éligibilité dépend du contexte fiscal complet du foyer.';

export const INTERESTS_QUOTE_PART_INFO =
  'La quote-part des intérêts détermine la ventilation principal / produits. À défaut de précision par l’assureur sortant, vérifier le relevé détaillé ou interroger la compagnie.';
