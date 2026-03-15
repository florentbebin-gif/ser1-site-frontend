export interface VersementOption {
  active?: boolean;
  cout?: number;
}

export interface VersementEntry {
  montant: number;
  fraisEntree: number;
  pctCapitalisation: number;
  pctDistribution: number;
}

export interface VersementInitialInput extends Partial<VersementEntry> {
  tauxRendementCapi?: number | null;
  tauxRendementDistrib?: number | null;
  tauxDistribution?: number | null;
  strategie?: string | null;
  reinvestirVers?: string | null;
}

export interface VersementAnnuel extends VersementEntry {
  garantieBonneFin: VersementOption;
  exonerationCotisations: VersementOption;
}

export interface VersementAnnuelInput extends Partial<VersementAnnuel> {
  tauxRendementCapi?: number | null;
}

export interface VersementPonctuel {
  annee: number;
  montant: number;
  fraisEntree: number;
  pctCapitalisation: number;
  pctDistribution: number;
}

export type VersementPonctuelInput = Partial<VersementPonctuel>;

export interface CapitalisationConfig {
  rendementAnnuel: number;
}

export interface DistributionConfig {
  rendementAnnuel: number;
  tauxDistribution: number;
  dureeProduit: number | null;
  delaiJouissance: number;
  strategie: string;
  reinvestirVersAuTerme: string;
}

export interface VersementConfig {
  initial: VersementEntry;
  annuel: VersementAnnuel;
  ponctuels: VersementPonctuel[];
  capitalisation: CapitalisationConfig;
  distribution: DistributionConfig;
}

export interface VersementConfigInput {
  initial?: VersementInitialInput | null;
  annuel?: VersementAnnuelInput | null;
  ponctuels?: Array<VersementPonctuelInput | null | undefined> | null;
  capitalisation?: Partial<CapitalisationConfig> | null;
  distribution?: Partial<DistributionConfig> | null;
}

export const DEFAULT_INITIAL: VersementEntry = {
  montant: 0,
  fraisEntree: 0.02,
  pctCapitalisation: 100,
  pctDistribution: 0,
};

export const DEFAULT_ANNUEL: VersementAnnuel = {
  montant: 0,
  fraisEntree: 0.02,
  pctCapitalisation: 100,
  pctDistribution: 0,
  garantieBonneFin: { active: false, cout: 0.005 },
  exonerationCotisations: { active: false, cout: 0.01 },
};

export const DEFAULT_CAPITALISATION: CapitalisationConfig = {
  rendementAnnuel: 0.03,
};

export const DEFAULT_DISTRIBUTION: DistributionConfig = {
  rendementAnnuel: 0.02,
  tauxDistribution: 0.04,
  dureeProduit: null,
  delaiJouissance: 0,
  strategie: 'stocker',
  reinvestirVersAuTerme: 'capitalisation',
};

export const DEFAULT_VERSEMENT_CONFIG: VersementConfig = {
  initial: { ...DEFAULT_INITIAL },
  annuel: { ...DEFAULT_ANNUEL },
  ponctuels: [],
  capitalisation: { ...DEFAULT_CAPITALISATION },
  distribution: { ...DEFAULT_DISTRIBUTION },
};

function normalizePonctuel(
  ponctuel: VersementPonctuelInput | null | undefined,
  fallback: VersementEntry,
): VersementPonctuel {
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

export function normalizeVersementConfig(config: VersementConfigInput = {}): VersementConfig {
  const initial: VersementEntry = { ...DEFAULT_INITIAL, ...(config.initial ?? {}) };
  const annuel: VersementAnnuel = { ...DEFAULT_ANNUEL, ...(config.annuel ?? {}) };

  const capitalisation: CapitalisationConfig = {
    ...DEFAULT_CAPITALISATION,
    ...(config.capitalisation ?? {}),
  };

  if (typeof config.initial?.tauxRendementCapi === 'number') {
    capitalisation.rendementAnnuel = config.initial.tauxRendementCapi;
  }
  if (typeof config.annuel?.tauxRendementCapi === 'number') {
    capitalisation.rendementAnnuel = config.annuel.tauxRendementCapi;
  }

  const distribution: DistributionConfig = {
    ...DEFAULT_DISTRIBUTION,
    ...(config.distribution ?? {}),
  };

  if (typeof config.initial?.tauxRendementDistrib === 'number') {
    distribution.rendementAnnuel = config.initial.tauxRendementDistrib;
  }
  if (typeof config.initial?.tauxDistribution === 'number') {
    distribution.tauxDistribution = config.initial.tauxDistribution;
  }

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
    ? config.ponctuels.map((ponctuel) => normalizePonctuel(ponctuel, initial))
    : [];

  return {
    initial,
    annuel,
    ponctuels,
    capitalisation,
    distribution,
  };
}
