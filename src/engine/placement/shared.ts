export const ENVELOPES = {
  AV: 'AV',
  PER: 'PER',
  PEA: 'PEA',
  CTO: 'CTO',
  SCPI: 'SCPI',
};

export const ENVELOPE_LABELS = {
  AV: 'Assurance-vie',
  PER: 'PER individuel déductible',
  PEA: 'PEA',
  CTO: 'Compte-titres',
  SCPI: 'SCPI',
};

export const DEFAULT_FISCAL_PARAMS = {
  pfuIR: 0.128,
  pfuPS: 0.172,
  pfuTotal: 0.30,
  psPatrimoine: 0.172,
  avAbattement8ansSingle: 4600,
  avAbattement8ansCouple: 9200,
  avSeuilPrimes150k: 150000,
  avTauxSousSeuil8ans: 0.075,
  avTauxSurSeuil8ans: 0.128,
  av990IAbattement: 152500,
  av990ITranche1Taux: 0.20,
  av990ITranche1Plafond: 700000,
  av990ITranche2Taux: 0.3125,
  av757BAbattement: 30500,
  peaAncienneteMin: 5,
  dividendesAbattementPercent: 0.40,
};

export const REQUIRED_NUMERIC_FISCAL_KEYS = [
  'pfuIR',
  'pfuPS',
  'pfuTotal',
  'psPatrimoine',
  'avAbattement8ansSingle',
  'avAbattement8ansCouple',
  'avSeuilPrimes150k',
  'avTauxSousSeuil8ans',
  'avTauxSurSeuil8ans',
  'av990IAbattement',
  'av990ITranche1Taux',
  'av990ITranche1Plafond',
  'av990ITranche2Taux',
  'av757BAbattement',
  'peaAncienneteMin',
  'dividendesAbattementPercent',
];

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
export const round2 = (n) => Math.round(n * 100) / 100;
