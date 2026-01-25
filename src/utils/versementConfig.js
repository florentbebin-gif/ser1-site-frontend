export const DEFAULT_INITIAL = {
  montant: 10000,
  fraisEntree: 0.02,
  pctCapitalisation: 100,
  pctDistribution: 0,
};

export const DEFAULT_ANNUEL = {
  montant: 5000,
  fraisEntree: 0.02,
  pctCapitalisation: 100,
  pctDistribution: 0,
  garantieBonneFin: { active: false, cout: 0.005 },
  exonerationCotisations: { active: false, cout: 0.01 },
};

export const DEFAULT_CAPITALISATION = {
  rendementAnnuel: 0.03,
};

export const DEFAULT_DISTRIBUTION = {
  rendementAnnuel: 0.02,
  tauxDistribution: 0.04,
  dureeProduit: null,
  delaiJouissance: 0,
  strategie: 'stocker', // 'stocker' | 'apprehender' | 'reinvestir_capi'
  reinvestirVersAuTerme: 'capitalisation',
};

export const DEFAULT_VERSEMENT_CONFIG = {
  initial: { ...DEFAULT_INITIAL },
  annuel: { ...DEFAULT_ANNUEL },
  ponctuels: [],
  capitalisation: { ...DEFAULT_CAPITALISATION },
  distribution: { ...DEFAULT_DISTRIBUTION },
};

function normalizePonctuel(ponctuel, fallback) {
  const pctCapi = typeof ponctuel?.pctCapitalisation === 'number'
    ? ponctuel.pctCapitalisation
    : fallback.pctCapitalisation;
  const pctDistrib = typeof ponctuel?.pctDistribution === 'number'
    ? ponctuel.pctDistribution
    : fallback.pctDistribution;

  return {
    annee: Math.max(1, ponctuel?.annee ?? 1),
    montant: ponctuel?.montant ?? 0,
    fraisEntree: ponctuel?.fraisEntree ?? fallback.fraisEntree,
    pctCapitalisation: Math.max(0, Math.min(100, pctCapi ?? 0)),
    pctDistribution: Math.max(0, Math.min(100, pctDistrib ?? (100 - (pctCapi ?? 0)))),
  };
}

export function normalizeVersementConfig(config = {}) {
  const initial = { ...DEFAULT_INITIAL, ...(config.initial || {}) };
  const annuel = { ...DEFAULT_ANNUEL, ...(config.annuel || {}) };

  const capitalisation = {
    ...DEFAULT_CAPITALISATION,
    ...(config.capitalisation || {}),
  };

  if (typeof config.initial?.tauxRendementCapi === 'number') {
    capitalisation.rendementAnnuel = config.initial.tauxRendementCapi;
  }
  if (typeof config.annuel?.tauxRendementCapi === 'number') {
    capitalisation.rendementAnnuel = config.annuel.tauxRendementCapi;
  }

  const distribution = {
    ...DEFAULT_DISTRIBUTION,
    ...(config.distribution || {}),
  };

  if (typeof config.initial?.tauxRendementDistrib === 'number') {
    distribution.rendementAnnuel = config.initial.tauxRendementDistrib;
  }
  if (typeof config.initial?.tauxDistribution === 'number') {
    distribution.tauxDistribution = config.initial.tauxDistribution;
  }

  // Mapper les anciennes stratégies
  const legacyStrategie = config.initial?.strategie;
  if (legacyStrategie === 'apprehender') {
    distribution.strategie = 'apprehender';
  } else if (legacyStrategie === 'reinvestir') {
    distribution.strategie = 'reinvestir_capi';
  }

  if (config.initial?.reinvestirVers === 'distribution') {
    distribution.reinvestirVersAuTerme = 'distribution';
  }

  const ponctuels = Array.isArray(config.ponctuels)
    ? config.ponctuels.map((p) => normalizePonctuel(p, initial))
    : [];

  return {
    initial,
    annuel,
    ponctuels,
    capitalisation,
    distribution,
  };
}
