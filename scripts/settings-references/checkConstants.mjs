export const SETTINGS_PAGES = new Set([
  '/settings/impots',
  '/settings/comptables-societes',
  '/settings/prelevements',
  '/settings/base-contrat',
  '/settings/dmtg-succession',
  '/settings/prevoyance-regimes',
]);

export const COVERAGE_EXPECTED_CLAIMS_BY_PAGE = {
  '/settings/impots': 10,
  '/settings/comptables-societes': 1,
  '/settings/prelevements': 5,
  '/settings/base-contrat': null,
  '/settings/dmtg-succession': 7,
  '/settings/prevoyance-regimes': 69,
};

export const CATEGORIES = new Set([
  'constitution',
  'sortie-rachat',
  'deces-transmission',
  'arret',
  'invalidite',
  'cotisations',
  'maintien-employeur',
  'valeur-fiscale',
  'regle-civile',
  'transverse',
]);

export const VOLATILITIES = new Set(['annual', 'lawChange', 'stable']);
export const SETTINGS_DEFAULT_TABLES = new Set([
  'tax_settings',
  'ps_settings',
  'fiscality_settings',
]);
export const BASE_CONTRAT_AUDIENCES = new Set(['pp', 'pm']);
export const BASE_CONTRAT_PHASES = new Set(['constitution', 'sortie', 'deces']);
export const PREVOYANCE_TABLES = new Set([
  'prevoyance_regime_settings',
  'prevoyance_maintien_employeur_settings',
]);

export const DEFAULT_EXPORT_BY_TABLE = {
  tax_settings: 'DEFAULT_TAX_SETTINGS',
  ps_settings: 'DEFAULT_PS_SETTINGS',
  fiscality_settings: 'DEFAULT_FISCALITY_SETTINGS',
};

export const GENERIC_TEXT_PATTERNS = [
  /source officielle ou contractuelle applicable/i,
  /à compléter/i,
  /a completer/i,
  /todo/i,
  /non renseign/i,
  /^aucune$/i,
  /^n\/a$/i,
];

export const BASE_CONTRAT_INCOMPLETE_SOURCE_PATTERNS = [
  /ne résolvent pas encore vers une référence officielle/i,
  /ne resolvent pas encore vers une reference officielle/i,
  /sources actuelles.*pas encore/i,
  /sourcing.*à faire/i,
  /sourcing.*a faire/i,
];
