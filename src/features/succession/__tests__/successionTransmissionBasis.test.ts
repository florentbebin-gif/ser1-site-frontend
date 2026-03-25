import { describe, expect, it } from 'vitest';
import {
  buildSuccessionEstateTaxableBasis,
  createEmptyPocketScales,
} from '../successionTransmissionBasis';

describe('buildSuccessionEstateTaxableBasis', () => {
  it('prioritizes pocket totals and pocket scales over the legacy shared owner aggregate', () => {
    const pocketScales = createEmptyPocketScales();
    pocketScales.communaute = 0.2;
    pocketScales.indivision_pacse = 0.5;

    const basis = buildSuccessionEstateTaxableBasis({
      ordinaryTaxableAssetsParOwner: {
        epoux1: 0,
        epoux2: 0,
        commun: 999999,
      },
      passifsParOwner: {
        epoux1: 0,
        epoux2: 0,
        commun: 0,
      },
      ordinaryTaxableAssetsParPocket: {
        epoux1: 0,
        epoux2: 0,
        communaute: 100,
        societe_acquets: 0,
        indivision_pacse: 400,
        indivision_concubinage: 0,
      },
      passifsParPocket: {
        epoux1: 0,
        epoux2: 0,
        communaute: 0,
        societe_acquets: 0,
        indivision_pacse: 0,
        indivision_concubinage: 0,
      },
      groupementFoncierEntries: [{
        id: 'gf-1',
        owner: 'commun',
        pocket: 'indivision_pacse',
        type: 'GFA',
        valeurTotale: 200,
      }],
      hasBeneficiaryLevelGfAdjustment: true,
      residencePrincipaleEntry: {
        owner: 'commun',
        pocket: 'indivision_pacse',
        valeurTotale: 300,
      },
    }, pocketScales);

    expect(basis.ordinaryNetBeforeForfait).toBe(220);
    expect(basis.groupementEntries).toEqual([{ type: 'GFA', valeurTotale: 100 }]);
    expect(basis.residencePrincipaleValeur).toBe(150);
  });
});
