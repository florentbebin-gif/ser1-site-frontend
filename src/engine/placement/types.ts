/**
 * Types partagés engine/placement — PR-P1-08-03
 */

export interface FiscalParams {
  pfuIR?: number;
  pfuPS?: number;
  pfuTotal?: number;
  psGeneral?: number;
  psException?: number;
  avAbattement8ansSingle?: number;
  avAbattement8ansCouple?: number;
  avSeuilPrimes150k?: number;
  avTauxSousSeuil8ans?: number;
  avTauxSurSeuil8ans?: number;
  av990IAbattement?: number;
  av990ITranche1Taux?: number;
  av990ITranche1Plafond?: number;
  av990ITranche2Taux?: number;
  av757BAbattement?: number;
  peaAncienneteMin?: number;
  dividendesAbattementPercent?: number;
  dmtgTauxChoisi?: number | null;
  dmtgAbattementLigneDirecte?: number;
  dmtgScale?: Array<{ from: number; to: number | null; rate: number }>;
}

export interface EpargneRow {
  annee: number;
  age: number;
  capitalDebut: number;
  versementBrut: number;
  versementNet: number;
  cumulVersementsNets: number;
  gains: number;
  gainsAnnee: number;
  cumulInterets: number;
  cumulGains: number;
  psFondsEuro: number;
  revenuDistribue: number;
  cumulRevenusDistribues: number;
  fiscaliteRevenu: number;
  revenuNetPercu: number;
  cumulRevenusNetsPercus: number;
  revalorisation: number;
  economieIR: number;
  effortReel: number;
  compteEspece: number;
  cumulCompteEspece: number;
  capitalInvesti: number;
  capitalFin: number;
  cessionProduit: boolean;
  fiscalitePV: number;
  reinvestissement: number;
  capitalDecesTheorique: number;
  capitalDecesDegressif: number;
  revenusNetsPercusAnnee: number;
  reinvestissementDistribNetAnnee: number;
  couponBrut: number;
  fiscaliteCoupon: number;
  couponNet: number;
  revaloDistrib: number;
  capitalCapi: number;
  capitalDistrib: number;
  compteEspece0pct: number;
}

export interface EpargneResult {
  envelope: string;
  dureeEpargne: number;
  perBancaire: boolean;
  rendement: number;
  fraisGestion: number;
  tauxRevalorisation: number;
  optionBaremeIR: boolean;
  rows: EpargneRow[];
  capitalAcquis: number;
  cumulVersements: number;
  cumulEffort: number;
  cumulEconomieIR: number;
  plusValueLatente: number;
  cumulPSFondsEuro: number;
  cumulRevenusDistribues: number;
  cumulFiscaliteRevenus: number;
  cumulRevenusNetsPercus: number;
}

export interface LiquidationRow {
  annee: number;
  age: number;
  isAgeAuDeces: boolean;
  capitalDebut: number;
  gainsAnnee: number;
  retraitBrut: number;
  partGains: number;
  partCapital: number;
  totalCapitalRestant: number;
  totalInteretsRestants: number;
  pvLatenteDebut: number;
  pvLatenteAvantRetrait: number;
  pvLatenteFin: number;
  irSurGains: number;
  irSurCapital: number;
  ps: number;
  fiscaliteTotal: number;
  retraitNet: number;
  capitalFin: number;
}

export interface LiquidationResult {
  envelope: string;
  mode: string;
  duree: number;
  ageFinEpargne: number;
  ageAuDeces: number;
  rows: LiquidationRow[];
  capitalRestant: number;
  capitalRestantAuDeces: number;
  cumulRetraitsBruts: number;
  cumulRetraitsNets: number;
  cumulRetraitsNetsAuDeces: number;
  cumulFiscalite: number;
  cumulFiscaliteAuDeces: number;
  revenuAnnuelMoyenNet: number;
}

export interface FiscaliteRetraitResult {
  irSurGains: number;
  irSurCapital: number;
  ps: number;
  fiscaliteTotal: number;
  abattementApplique: number;
  retraitNet: number;
}

export interface PsDeces {
  applicable: boolean;
  assiette: number;
  taux: number;
  montant: number;
  note: string;
}

export interface TransmissionResult {
  envelope: string;
  capitalTransmis: number;
  regime: string;
  abattement: number;
  assiette: number;
  taxeForfaitaire: number;
  taxeDmtg: number;
  taxe: number;
  capitalTransmisNet: number;
  psDeces: PsDeces;
}

export interface SimulateCompleteResult {
  envelope: string;
  envelopeLabel: string;
  epargne: {
    duree: number;
    capitalAcquis: number;
    cumulVersements: number;
    cumulEffort: number;
    cumulEconomieIR: number;
    plusValueLatente: number;
    cumulPSFondsEuro: number;
    cumulRevenusDistribues: number;
    cumulFiscaliteRevenus: number;
    cumulRevenusNetsPercus: number;
    rows: EpargneRow[];
  };
  liquidation: {
    duree: number;
    ageAuDeces: number;
    cumulRetraitsBruts: number;
    cumulRetraitsNets: number;
    cumulRetraitsNetsAuDeces: number;
    cumulFiscalite: number;
    cumulFiscaliteAuDeces: number;
    revenuAnnuelMoyenNet: number;
    capitalRestant: number;
    capitalRestantAuDeces: number;
    rows: LiquidationRow[];
  };
  transmission: {
    regime: string;
    capitalTransmis: number;
    abattement: number;
    assiette: number;
    taxeForfaitaire: number;
    taxeDmtg: number;
    taxe: number;
    capitalTransmisNet: number;
    psDeces: PsDeces;
  };
  totaux: {
    effortTotal: number;
    revenusNetsEpargne: number;
    effortReel: number;
    economieIRTotal: number;
    revenusNetsLiquidation: number;
    revenusNetsTotal: number;
    fiscaliteTotale: number;
    capitalTransmisNet: number;
  };
}

export interface CompareResult {
  produit1: SimulateCompleteResult;
  produit2: SimulateCompleteResult;
  deltas: {
    effortTotal: number;
    economieIR: number;
    capitalAcquis: number;
    revenusNetsLiquidation: number;
    fiscaliteTotale: number;
    capitalTransmisNet: number;
  };
  meilleurEffort: string;
  meilleurRevenus: string;
  meilleurTransmission: string;
}
