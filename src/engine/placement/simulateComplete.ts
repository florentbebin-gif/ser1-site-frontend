import { ENVELOPES, ENVELOPE_LABELS } from './shared';
import { simulateEpargne } from './epargne';
import { simulateLiquidation } from './liquidation';
import { calculTransmission } from './transmission';
import type { FiscalParams, SimulateCompleteResult } from './types';

interface SimulateCompleteProduct {
  envelope: string;
  perBancaire?: boolean;
  versementConfig?: unknown;
  [key: string]: unknown;
}

interface SimulateCompleteClient {
  ageActuel?: number;
  tmiEpargne?: number;
  tmiRetraite?: number;
  situation?: string;
}

interface SimulateCompleteLiquidationParams {
  mode?: string;
  duree?: number;
  mensualiteCible?: number;
  montantUnique?: number;
  rendement?: number;
  optionBaremeIR?: boolean;
}

interface SimulateCompleteTransmissionParams {
  ageAuDeces?: number;
  agePremierVersement?: number;
  nbBeneficiaires?: number;
  beneficiaryType?: string;
}

export function simulateComplete(
  product: SimulateCompleteProduct,
  client: SimulateCompleteClient,
  liquidationParams: SimulateCompleteLiquidationParams,
  transmissionParams: SimulateCompleteTransmissionParams,
  fiscalParams: FiscalParams,
): SimulateCompleteResult {
  const epargne = simulateEpargne(product as Parameters<typeof simulateEpargne>[0], client, fiscalParams);

  const ageAuDeces = transmissionParams.ageAuDeces || 90;
  const ageActuel = client.ageActuel || 45;
  const ageFinEpargne = ageActuel + epargne.dureeEpargne;
  const decesEnPhaseEpargne = ageAuDeces < ageFinEpargne;

  let capitalAuDeces = epargne.capitalAcquis;
  let capitalDecesTheoriqueAuDeces = 0;
  let capitalDecesDegressifAuDeces = 0;

  if (decesEnPhaseEpargne) {
    const ligneAuDeces = epargne.rows.find((r) => r.age === ageAuDeces);
    if (ligneAuDeces) {
      capitalAuDeces = ligneAuDeces.capitalFin;
      capitalDecesTheoriqueAuDeces = ligneAuDeces.capitalDecesTheorique || 0;
      capitalDecesDegressifAuDeces = ligneAuDeces.capitalDecesDegressif || 0;

      if (product.envelope === ENVELOPES.PER && (product.versementConfig as Record<string, unknown>)?.annuel) {
        const annuelCfg = (product.versementConfig as Record<string, unknown>).annuel as Record<string, unknown>;
        if ((annuelCfg?.garantieBonneFin as Record<string, unknown>)?.active) {
          capitalAuDeces += capitalDecesTheoriqueAuDeces + capitalDecesDegressifAuDeces;
        }
      }
    } else {
      capitalAuDeces = 0;
    }
  }

  let liquidation: ReturnType<typeof simulateLiquidation> | {
    duree: number;
    ageFinEpargne: number;
    ageAuDeces: number;
    rows: never[];
    capitalRestant: number;
    capitalRestantAuDeces: number;
    cumulRetraitsBruts: number;
    cumulRetraitsNets: number;
    cumulRetraitsNetsAuDeces: number;
    cumulFiscalite: number;
    cumulFiscaliteAuDeces: number;
    revenuAnnuelMoyenNet: number;
    envelope?: string;
    mode?: string;
  };

  if (decesEnPhaseEpargne) {
    liquidation = {
      duree: 0,
      ageFinEpargne,
      ageAuDeces,
      rows: [],
      capitalRestant: capitalAuDeces,
      capitalRestantAuDeces: capitalAuDeces,
      cumulRetraitsBruts: 0,
      cumulRetraitsNets: 0,
      cumulRetraitsNetsAuDeces: 0,
      cumulFiscalite: 0,
      cumulFiscaliteAuDeces: 0,
      revenuAnnuelMoyenNet: 0,
    };
  } else {
    liquidation = simulateLiquidation(epargne, liquidationParams, client, fiscalParams, transmissionParams);
  }

  const capitalTransmis = decesEnPhaseEpargne ? capitalAuDeces : liquidation.capitalRestantAuDeces;

  const transmission = calculTransmission({
    envelope: product.envelope,
    capitalTransmis,
    cumulVersements: epargne.cumulVersements,
    ageAuDeces: transmissionParams.ageAuDeces,
    agePremierVersement: transmissionParams.agePremierVersement || (client.ageActuel || 45),
    nbBeneficiaires: transmissionParams.nbBeneficiaires || 1,
    beneficiaryType: transmissionParams.beneficiaryType,
    perBancaire: product.perBancaire || false,
  }, fiscalParams);

  return {
    envelope: product.envelope,
    envelopeLabel: (ENVELOPE_LABELS as Record<string, string>)[product.envelope] || product.envelope,

    epargne: {
      duree: epargne.dureeEpargne,
      capitalAcquis: epargne.capitalAcquis,
      cumulVersements: epargne.cumulVersements,
      cumulEffort: epargne.cumulEffort,
      cumulEconomieIR: epargne.cumulEconomieIR,
      plusValueLatente: epargne.plusValueLatente,
      cumulPSFondsEuro: epargne.cumulPSFondsEuro,
      cumulRevenusDistribues: epargne.cumulRevenusDistribues,
      cumulFiscaliteRevenus: epargne.cumulFiscaliteRevenus,
      cumulRevenusNetsPercus: epargne.cumulRevenusNetsPercus,
      rows: epargne.rows,
    },

    liquidation: {
      duree: liquidation.duree,
      ageAuDeces: liquidation.ageAuDeces,
      cumulRetraitsBruts: liquidation.cumulRetraitsBruts,
      cumulRetraitsNets: liquidation.cumulRetraitsNets,
      cumulRetraitsNetsAuDeces: liquidation.cumulRetraitsNetsAuDeces,
      cumulFiscalite: liquidation.cumulFiscalite,
      cumulFiscaliteAuDeces: liquidation.cumulFiscaliteAuDeces,
      revenuAnnuelMoyenNet: liquidation.revenuAnnuelMoyenNet,
      capitalRestant: liquidation.capitalRestant,
      capitalRestantAuDeces: liquidation.capitalRestantAuDeces,
      rows: liquidation.rows,
    },

    transmission: {
      regime: transmission.regime,
      capitalTransmis: transmission.capitalTransmis,
      abattement: transmission.abattement,
      assiette: transmission.assiette,
      taxeForfaitaire: transmission.taxeForfaitaire,
      taxeDmtg: transmission.taxeDmtg,
      taxe: transmission.taxe,
      capitalTransmisNet: transmission.capitalTransmisNet,
      psDeces: transmission.psDeces,
    },

    totaux: {
      effortTotal: epargne.cumulEffort,
      revenusNetsEpargne: epargne.cumulRevenusNetsPercus,
      effortReel: epargne.cumulEffort - epargne.cumulRevenusNetsPercus,
      economieIRTotal: epargne.cumulEconomieIR,
      revenusNetsLiquidation: liquidation.cumulRetraitsNetsAuDeces,
      revenusNetsTotal: liquidation.cumulRetraitsNets,
      fiscaliteTotale: liquidation.cumulFiscalite + transmission.taxe,
      capitalTransmisNet: transmission.capitalTransmisNet,
    },
  };
}
