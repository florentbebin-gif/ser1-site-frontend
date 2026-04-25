/**
 * PER Potentiel Engine — Types
 *
 * Interfaces for the "Contrôle du potentiel épargne retraite" engine.
 * Zero React dependency — pure data types.
 */

// ── Entrées ──────────────────────────────────────────────────────────────────

export interface DeclarantRevenus {
  statutTns: boolean;
  salaires: number;
  fraisReels: boolean;
  fraisReelsMontant: number;
  art62: number;
  bic: number;
  retraites: number;
  fonciersNets: number;
  autresRevenus: number;
  cotisationsPer163Q: number;
  cotisationsPerp: number;
  cotisationsArt83: number;
  cotisationsMadelin154bis: number;
  cotisationsMadelinRetraite: number;
  abondementPerco: number;
  cotisationsPrevo: number;
}

export interface AvisIrPlafonds {
  nonUtiliseAnnee1: number;
  nonUtiliseAnnee2: number;
  nonUtiliseAnnee3: number;
  plafondCalcule: number;
  anneeRef: number;
}

export interface SituationFiscaleInput {
  situationFamiliale: 'celibataire' | 'marie';
  nombreParts: number;
  isole: boolean;
  declarant1: DeclarantRevenus;
  declarant2?: DeclarantRevenus;
}

export type PerHistoricalBasis = 'previous-avis-plus-n1' | 'current-avis';
export type PerYearKey = 'current' | 'previous';

export interface PerPotentielInput {
  mode: 'versement-n' | 'declaration-n1';
  historicalBasis: PerHistoricalBasis;
  anneeRef: number;
  yearKey?: PerYearKey;
  situationFiscale: SituationFiscaleInput;
  projectionFiscale?: SituationFiscaleInput;
  avisIr?: AvisIrPlafonds;
  avisIr2?: AvisIrPlafonds;
  versementEnvisage?: number;
  mutualisationConjoints: boolean;
  passHistory: Record<number, number>;
  taxSettings: unknown;
  psSettings: unknown;
}

// ── Sorties ──────────────────────────────────────────────────────────────────

export interface PlafondDetail {
  plafondCalculeN: number;
  nonUtiliseN1: number;
  nonUtiliseN2: number;
  nonUtiliseN3: number;
  totalDisponible: number;
  cotisationsDejaVersees: number;
  disponibleRestant: number;
  depassement: boolean;
}

export interface PlafondMadelinDetail {
  assietteVersement: number;
  assietteReport: number;
  enveloppe15Versement: number;
  enveloppe15Report: number;
  enveloppe10: number;
  cotisationsVersees: number;
  utilisation15Versement: {
    madelinRetraite: number;
    per154bis: number;
    total: number;
  };
  depassement15Versement: {
    madelinRetraite: number;
    per154bis: number;
    total: number;
  };
  utilisation15Report: {
    madelinRetraite: number;
    per154bis: number;
    total: number;
  };
  depassement15Report: {
    madelinRetraite: number;
    per154bis: number;
    total: number;
  };
  consommation10: {
    art83: number;
    perco: number;
    madelinRetraite: number;
    per154bis: number;
    total: number;
  };
  reste15Versement: number;
  reste15Report: number;
  reste10: number;
  disponibleRestant: number;
  surplusAReintegrer: number;
  depassement: boolean;
}

export interface SituationFiscaleResult {
  revenuImposableD1: number;
  revenuImposableD2: number;
  revenuFiscalRef: number;
  tmi: number;
  irEstime: number;
  decote: number;
  cehr: number;
  montantDansLaTMI: number;
}

export interface SimulationVersement {
  versementEnvisage: number;
  versementDeductible: number;
  economieIRAnnuelle: number;
  coutNetApresFiscalite: number;
  plafondRestantApres: number;
}

export interface Declaration2042Boxes {
  case6NS: number;
  case6NT?: number;
  case6RS: number;
  case6RT?: number;
  case6QS: number;
  case6QT?: number;
  case6OS: number;
  case6OT?: number;
  case6QR: boolean;
}

export interface PerDeductionDetail {
  plafondDisponible: number;
  plafondApresMutualisation: number;
  cotisationsVersees: number;
  cotisationsRetenuesIr: number;
  cotisationsNonDeductibles: number;
  mutualisationRecue: number;
  mutualisationCedee: number;
  disponibleRestant: number;
}

export interface PerDeductionFlow {
  declarant1: PerDeductionDetail;
  declarant2?: PerDeductionDetail;
  totalDeductionsIr: number;
}

export interface PerProjectionAvisDetail {
  nonUtiliseN2: number;
  nonUtiliseN1: number;
  nonUtiliseN: number;
  plafondCalculeN: number;
  plafondTotal: number;
}

export interface PerPotentielResult {
  situationFiscale: SituationFiscaleResult;
  plafond163Q: { declarant1: PlafondDetail; declarant2?: PlafondDetail };
  deductionFlow163Q: PerDeductionFlow;
  plafondMadelin?: { declarant1: PlafondMadelinDetail; declarant2?: PlafondMadelinDetail };
  estTNS: boolean;
  declaration2042: Declaration2042Boxes;
  projectionAvisSuivant: {
    declarant1: PerProjectionAvisDetail;
    declarant2?: PerProjectionAvisDetail;
  };
  simulation?: SimulationVersement;
  warnings: PerWarning[];
}

export interface PerWarning {
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
}
