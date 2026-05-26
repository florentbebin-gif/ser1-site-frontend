import {
  DEFAULT_ASSURANCE_VIE_RULES,
  DEFAULT_PEA_RULES,
  DEFAULT_PS_SETTINGS,
  DEFAULT_TAX_SETTINGS,
} from '../../constants/settingsDefaults';
import type { FiscalParams } from './types';

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

export function toDecimalPercent(value: number): number {
  return Math.round((value / 100) * 1_000_000) / 1_000_000;
}

export function roundDecimal(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

const avRetraitsDepuis2017 = DEFAULT_ASSURANCE_VIE_RULES.retraitsCapital.depuis2017;
const avPlus8Ans = avRetraitsDepuis2017.plus8Ans;
const avDeces = DEFAULT_ASSURANCE_VIE_RULES.deces;
const av990IBrackets = avDeces.primesApres1998.brackets;
const av990IAbattement = avDeces.primesApres1998.allowancePerBeneficiary;
const pfuIR = toDecimalPercent(DEFAULT_TAX_SETTINGS.pfu.current.rateIR);
const pfuPS = toDecimalPercent(DEFAULT_PS_SETTINGS.patrimony.current.generalRate);

export const DEFAULT_FISCAL_PARAMS: Required<
  Omit<FiscalParams, 'dmtgTauxChoisi' | 'dmtgAbattementLigneDirecte' | 'dmtgScale'>
> = {
  pfuIR,
  pfuPS,
  pfuTotal: roundDecimal(pfuIR + pfuPS),
  psGeneral: pfuPS,
  psException: toDecimalPercent(DEFAULT_PS_SETTINGS.patrimony.current.exceptionRate),
  avAbattement8ansSingle: avPlus8Ans.abattementAnnuel.single,
  avAbattement8ansCouple: avPlus8Ans.abattementAnnuel.couple,
  avSeuilPrimes150k: avPlus8Ans.primesNettesSeuil,
  avTauxSousSeuil8ans: toDecimalPercent(avPlus8Ans.irRateUnderThresholdPercent),
  avTauxSurSeuil8ans: toDecimalPercent(avPlus8Ans.irRateOverThresholdPercent),
  av990IAbattement,
  av990ITranche1Taux: toDecimalPercent(av990IBrackets[0]?.ratePercent ?? 0),
  av990ITranche1Plafond: av990IBrackets[0]?.upTo ?? 0,
  av990ITranche2Taux: toDecimalPercent(av990IBrackets[1]?.ratePercent ?? 0),
  av757BAbattement: avDeces.apres70ans.globalAllowance,
  peaAncienneteMin: DEFAULT_PEA_RULES.ancienneteMinYears,
  dividendesAbattementPercent: toDecimalPercent(
    DEFAULT_TAX_SETTINGS.corporateTax.current.dividendsAbatementPct,
  ),
};

export const REQUIRED_NUMERIC_FISCAL_KEYS = [
  'pfuIR',
  'pfuPS',
  'pfuTotal',
  'psGeneral',
  'psException',
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

export const clamp = (n: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, n));
export const round2 = (n: number): number => Math.round(n * 100) / 100;
