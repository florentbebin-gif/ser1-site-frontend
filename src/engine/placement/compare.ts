import { round2 } from './shared.js';

export function compareProducts(result1, result2) {
  const delta = (a, b) => round2(a - b);

  return {
    produit1: result1,
    produit2: result2,

    deltas: {
      effortTotal: delta(result1.totaux.effortReel, result2.totaux.effortReel),
      economieIR: delta(result1.totaux.economieIRTotal, result2.totaux.economieIRTotal),
      capitalAcquis: delta(result1.epargne.capitalAcquis, result2.epargne.capitalAcquis),
      revenusNetsLiquidation: delta(result1.totaux.revenusNetsLiquidation, result2.totaux.revenusNetsLiquidation),
      fiscaliteTotale: delta(result1.totaux.fiscaliteTotale, result2.totaux.fiscaliteTotale),
      capitalTransmisNet: delta(result1.totaux.capitalTransmisNet, result2.totaux.capitalTransmisNet),
    },

    meilleurEffort: result1.totaux.effortReel <= result2.totaux.effortReel ? result1.envelope : result2.envelope,
    meilleurRevenus: result1.totaux.revenusNetsLiquidation >= result2.totaux.revenusNetsLiquidation ? result1.envelope : result2.envelope,
    meilleurTransmission: result1.totaux.capitalTransmisNet >= result2.totaux.capitalTransmisNet ? result1.envelope : result2.envelope,
  };
}
