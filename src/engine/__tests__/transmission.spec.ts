import { describe, it, expect } from 'vitest';
import { calculTransmission, ENVELOPES, simulateComplete } from '../placementEngine.js';
import { computeDmtgConsumptionRatio, shouldShowDmtgDisclaimer } from '../../utils/transmissionDisclaimer.js';

const baseFiscalParams = {
  dmtgTauxChoisi: 0.2,
  av990IAbattement: 152500,
  av990ITranche1Plafond: 700000,
  av990ITranche1Taux: 0.2,
  av990ITranche2Taux: 0.3125,
  av757BAbattement: 30500,
  psPatrimoine: 0.172,
  pfuIR: 0.12,
  pfuPS: 0.172,
};

describe('calculTransmission', () => {
  it('Assurance-vie < 70 ans applique PS décès puis 990 I', () => {
    const res = calculTransmission({
      envelope: ENVELOPES.AV,
      capitalTransmis: 400000,
      agePremierVersement: 55,
      nbBeneficiaires: 2,
      cumulVersements: 250000,
    }, baseFiscalParams) as any;

    expect(res.regime).toBe('990 I');
    expect(res.abattement).toBe(305000); // 152500 * 2
    expect(res.psDeces.montant).toBeCloseTo((400000 - 250000) * baseFiscalParams.psPatrimoine, 2);
    const expectedAssiette = (400000 - res.psDeces.montant) - res.abattement;
    expect(res.assiette).toBeCloseTo(expectedAssiette, 2);
    expect(res.taxeForfaitaire).toBeCloseTo(expectedAssiette * 0.2, 2);
    expect(res.taxeDmtg).toBe(0);
    expect(res.taxe).toBeCloseTo(res.taxeForfaitaire, 2);
    expect(res.capitalTransmisNet).toBeCloseTo(400000 - res.psDeces.montant - res.taxe, 2);
  });

  it('Assurance-vie > 70 ans applique abattement 30 500 € puis DMTG simplifié', () => {
    const res = calculTransmission({
      envelope: ENVELOPES.AV,
      capitalTransmis: 120000,
      agePremierVersement: 72,
      nbBeneficiaires: 1,
    }, baseFiscalParams) as any;

    expect(res.psDeces.montant).toBeCloseTo((120000 - 0) * baseFiscalParams.psPatrimoine, 2);
    const assiette = 120000 - res.psDeces.montant - baseFiscalParams.av757BAbattement;
    expect(res.regime).toBe('757 B');
    expect(res.taxeForfaitaire).toBe(0);
    expect(res.taxeDmtg).toBeCloseTo(Math.max(0, assiette) * baseFiscalParams.dmtgTauxChoisi, 2);
    expect(res.taxe).toBeCloseTo(res.taxeDmtg, 2);
  });

  it('PER assurance décès >= 70 ans applique 757 B simplifié', () => {
    const res = calculTransmission({
      envelope: ENVELOPES.PER,
      capitalTransmis: 80000,
      ageAuDeces: 75,
      perBancaire: false,
    }, baseFiscalParams) as any;

    expect(res.regime).toContain('757 B');
    expect(res.taxeForfaitaire).toBe(0);
    expect(res.taxeDmtg).toBeCloseTo((80000 - baseFiscalParams.av757BAbattement) * baseFiscalParams.dmtgTauxChoisi, 2);
    expect(res.taxe).toBeCloseTo(res.taxeDmtg, 2);
    expect(res.psDeces.applicable).toBe(false);
    expect(res.psDeces.note).toBe('PS déjà acquittés pendant la vie du contrat');
  });

  it('PER bancaire applique uniquement la taxe DMTG simplifiée', () => {
    const res = calculTransmission({
      envelope: ENVELOPES.PER,
      capitalTransmis: 50000,
      perBancaire: true,
    }, baseFiscalParams) as any;

    expect(res.regime).toBe('DMTG (PER bancaire)');
    expect(res.taxeForfaitaire).toBe(0);
    expect(res.taxeDmtg).toBeCloseTo(50000 * baseFiscalParams.dmtgTauxChoisi, 2);
    expect(res.taxe).toBeCloseTo(res.taxeDmtg, 2);
    expect(res.psDeces.applicable).toBe(false);
    expect(res.psDeces.note).toBe('PS déjà acquittés pendant la vie du contrat');
  });

  it('PEA applique PS décès sur gains puis DMTG', () => {
    const res = calculTransmission({
      envelope: ENVELOPES.PEA,
      capitalTransmis: 150000,
      cumulVersements: 90000,
    }, baseFiscalParams) as any;

    const gains = 60000;
    expect(res.psDeces.montant).toBeCloseTo(gains * baseFiscalParams.psPatrimoine, 2);
    expect(res.taxeDmtg).toBeCloseTo((150000 - res.psDeces.montant) * baseFiscalParams.dmtgTauxChoisi, 2);
  });

  it('SCPI indique PS non applicables car prélevés pendant la vie', () => {
    const res = calculTransmission({
      envelope: ENVELOPES.SCPI,
      capitalTransmis: 80000,
    }, baseFiscalParams) as any;

    expect(res.psDeces.applicable).toBe(false);
    expect(res.psDeces.note).toBe('PS prélevés sur les loyers annuels');
  });
});

describe('Garantie de bonne fin (simulateComplete)', () => {
  const client = { ageActuel: 50, tmiEpargne: 0.3, tmiRetraite: 0.11, situation: 'single' };
  const transmission = { ageAuDeces: 60, nbBeneficiaires: 1, dmtgTaux: 0.2 };
  const productPer = {
    envelope: 'PER',
    dureeEpargne: 20,
    versementConfig: {
      initial: { montant: 10000, pctCapitalisation: 100, pctDistribution: 0 },
      annuel: {
        montant: 1000,
        pctCapitalisation: 100,
        pctDistribution: 0,
        garantieBonneFin: { active: true, cout: 0 },
        exonerationCotisations: { active: false, cout: 0 },
      },
      ponctuels: [],
      capitalisation: { rendementAnnuel: 0.03 },
      distribution: { rendementAnnuel: 0, tauxDistribution: 0 },
    },
    optionBaremeIR: false,
    perBancaire: false,
    fraisGestion: 0,
  };

  it('ajoute la garantie si décès pendant épargne', () => {
    const result = simulateComplete(productPer, client, { mode: 'epuiser', duree: 25 }, transmission, baseFiscalParams) as any;
    expect(result.transmission.capitalTransmis).toBeGreaterThan(result.epargne.capitalAcquis);
  });

  it('n’ajoute pas la garantie si décès après épargne', () => {
    const result = simulateComplete(
      productPer,
      client,
      { mode: 'epuiser', duree: 25 },
      { ...transmission, ageAuDeces: 90 },
      baseFiscalParams,
    ) as any;
    expect(result.transmission.capitalTransmis).toBeCloseTo(result.liquidation.capitalRestantAuDeces, 2);
  });
});

describe('DMTG Disclaimer helpers', () => {
  it('computeDmtgConsumptionRatio renvoie 0 si données invalides', () => {
    expect(computeDmtgConsumptionRatio(-1, 1000)).toBe(0);
    expect(computeDmtgConsumptionRatio(1000, 0)).toBe(0);
  });

  it('shouldShowDmtgDisclaimer détecte le seuil de 50 %', () => {
    expect(shouldShowDmtgDisclaimer(200000, 1000000)).toBe(false);
    expect(shouldShowDmtgDisclaimer(600000, 1000000)).toBe(true);
    expect(shouldShowDmtgDisclaimer(500000, 1000000)).toBe(false);
  });
});
