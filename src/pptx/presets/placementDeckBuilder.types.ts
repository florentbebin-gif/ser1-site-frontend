/**
 * placementDeckBuilder.types.ts
 * Interfaces de données et constantes pour le deck PPTX Placement.
 */

export interface PlacementProductConfig {
  tmi: number;
  tmiRetraite: number;
  rendementCapi: number;
  rendementDistrib: number;
  tauxRevalorisation: number;
  repartitionCapi: number;
  strategieDistribution: string;
  versementInitial: number;
  versementAnnuel: number;
  ponctuels: Array<{ annee: number; montant: number }>;
  fraisEntree: number;
  optionBaremeIR: boolean;
}

export interface EpargneRowForPptx {
  annee: number;
  versementNet: number;
  capitalDebut: number;
  gainsAnnee: number;
  capitalFin: number;
  effortReel: number;
  economieIR: number;
}

export interface LiquidationRowForPptx {
  annee: number;
  capitalDebut: number;
  gainsAnnee: number;
  retraitBrut: number;
  fiscaliteTotal: number;
  retraitNet: number;
  capitalFin: number;
}

export interface PlacementProductData {
  envelopeLabel: string;
  epargne: {
    capitalAcquis: number;
    cumulVersements: number;
    cumulEffort: number;
    cumulEconomieIR: number;
  };
  liquidation: {
    cumulRetraitsNets: number;
    revenuAnnuelMoyenNet: number;
    cumulFiscalite: number;
  };
  transmission: {
    capitalTransmisNet: number;
    taxe: number;
    regime: string;
  };
  totaux: {
    effortReel: number;
    revenusNetsLiquidation: number;
    fiscaliteTotale: number;
    capitalTransmisNet: number;
    revenusNetsTotal: number;
  };
  config: PlacementProductConfig;
  epargneRows: EpargneRowForPptx[];
  liquidationRows: LiquidationRowForPptx[];
}

export interface PlacementData {
  clientName?: string;
  produit1: PlacementProductData;
  produit2: PlacementProductData;
  ageActuel: number;
  dureeEpargne: number;
  ageAuDeces: number;
  liquidationMode: string;
  liquidationDuree: number;
  liquidationMensualiteCible: number;
  liquidationMontantUnique: number;
  beneficiaryType: string;
  nbBeneficiaires: number;
  dmtgTaux: number | null;
}

export interface UiSettingsForPptx {
  c1: string;
  c2: string;
  c3: string;
  c4: string;
  c5: string;
  c6: string;
  c7: string;
  c8: string;
  c9: string;
  c10: string;
}

export const LEGAL_TEXT = `Document établi à titre strictement indicatif et dépourvu de valeur contractuelle. Il a été élaboré sur la base des dispositions légales et réglementaires en vigueur à la date de sa remise, lesquelles sont susceptibles d'évoluer.

Les informations qu'il contient sont strictement confidentielles et destinées exclusivement aux personnes expressément autorisées.

Toute reproduction, représentation, diffusion ou rediffusion, totale ou partielle, sur quelque support ou par quelque procédé que ce soit, ainsi que toute vente, revente, retransmission ou mise à disposition de tiers, est strictement encadrée. Le non-respect de ces dispositions est susceptible de constituer une contrefaçon engageant la responsabilité civile et pénale de son auteur, conformément aux articles L335-1 à L335-10 du Code de la propriété intellectuelle.`;
