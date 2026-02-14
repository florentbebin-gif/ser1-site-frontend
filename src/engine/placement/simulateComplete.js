import { ENVELOPES, ENVELOPE_LABELS } from './shared.js';
import { simulateEpargne } from './epargne.js';
import { simulateLiquidation } from './liquidation.js';
import { calculTransmission } from './transmission.js';

export function simulateComplete(product, client, liquidationParams, transmissionParams, fiscalParams) {
  const epargne = simulateEpargne(product, client, fiscalParams);

  const ageAuDeces = transmissionParams.ageAuDeces || 85;
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

      if (product.envelope === ENVELOPES.PER && product.versementConfig?.annuel?.garantieBonneFin?.active) {
        capitalAuDeces += capitalDecesTheoriqueAuDeces + capitalDecesDegressifAuDeces;
      }
    } else {
      capitalAuDeces = 0;
    }
  }

  let liquidation;
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
    perBancaire: product.perBancaire || false,
  }, fiscalParams);

  return {
    envelope: product.envelope,
    envelopeLabel: ENVELOPE_LABELS[product.envelope] || product.envelope,

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
      revenusNetsEpargne: (epargne.cumulRevenusDistribues || 0) - (epargne.cumulFiscaliteRevenus || 0),
      effortReel: epargne.cumulEffort - ((epargne.cumulRevenusDistribues || 0) - (epargne.cumulFiscaliteRevenus || 0)),
      economieIRTotal: epargne.cumulEconomieIR,
      revenusNetsLiquidation: liquidation.cumulRetraitsNetsAuDeces,
      revenusNetsTotal: liquidation.cumulRetraitsNets,
      fiscaliteTotale: liquidation.cumulFiscalite + transmission.taxe,
      capitalTransmisNet: transmission.capitalTransmisNet,
    },
  };
}
