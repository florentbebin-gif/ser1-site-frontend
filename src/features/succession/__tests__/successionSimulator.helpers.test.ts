import { describe, expect, it } from 'vitest';
import {
  applySuccessionDonationFieldUpdate,
  buildAssuranceVieFromAsset,
  buildGroupementFoncierFromAsset,
  buildPerFromAsset,
  buildPrevoyanceFromAsset,
  hasComputableSuccessionFiliation,
  hasRequiredBirthDatesForSituation,
} from '../successionSimulator.helpers';

describe('successionSimulator.helpers', () => {
  it('requires only the primary birth date for solo situations', () => {
    expect(hasRequiredBirthDatesForSituation('celibataire', '1970-01-01')).toBe(true);
    expect(hasRequiredBirthDatesForSituation('veuf', '')).toBe(false);
  });

  it('requires both primary birth dates for couple situations', () => {
    expect(hasRequiredBirthDatesForSituation('marie', '1970-01-01', '1972-01-01')).toBe(true);
    expect(hasRequiredBirthDatesForSituation('pacse', '1970-01-01', '')).toBe(false);
  });

  it('detects whether the family context is sufficient to open succession computations', () => {
    expect(hasComputableSuccessionFiliation('celibataire', [], [])).toBe(false);
    expect(hasComputableSuccessionFiliation('celibataire', [{ id: 'E1', rattachement: 'epoux1' }], [])).toBe(true);
    expect(hasComputableSuccessionFiliation('concubinage', [], [])).toBe(true);
  });

  it('builds specialized entries from a generic asset entry', () => {
    const sourceEntry = { pocket: 'communaute' as const, amount: 125000 };

    const assuranceVie = buildAssuranceVieFromAsset(sourceEntry, 'epoux2');
    expect(assuranceVie.id.startsWith('av-')).toBe(true);
    expect(assuranceVie.assure).toBe('epoux2');
    expect(assuranceVie.capitauxDeces).toBe(125000);

    const per = buildPerFromAsset(sourceEntry, 'epoux1');
    expect(per.id.startsWith('per-')).toBe(true);
    expect(per.assure).toBe('epoux1');
    expect(per.capitauxDeces).toBe(125000);

    const prevoyance = buildPrevoyanceFromAsset(sourceEntry, 'epoux1');
    expect(prevoyance.id.startsWith('pv-')).toBe(true);
    expect(prevoyance.assure).toBe('epoux1');
    expect(prevoyance.capitalDeces).toBe(125000);

    const gf = buildGroupementFoncierFromAsset(sourceEntry, 'GFA/GFV');
    expect(gf.id.startsWith('gf-')).toBe(true);
    expect(gf.type).toBe('GFA');
    expect(gf.pocket).toBe('communaute');
    expect(gf.valeurTotale).toBe(125000);
  });

  it('updates donation fields with the expected coercions', () => {
    const initialEntry = {
      id: 'don-1',
      type: 'rapportable' as const,
      montant: 1000,
    };

    expect(applySuccessionDonationFieldUpdate(initialEntry, 'type', 'hors_part').type).toBe('hors_part');
    expect(applySuccessionDonationFieldUpdate(initialEntry, 'montant', -10)).toMatchObject({
      montant: 0,
      valeurDonation: 0,
    });
    expect(applySuccessionDonationFieldUpdate(initialEntry, 'valeurDonation', 2500)).toMatchObject({
      montant: 2500,
      valeurDonation: 2500,
    });
    expect(applySuccessionDonationFieldUpdate(initialEntry, 'donSommeArgentExonere', 1).donSommeArgentExonere).toBe(true);
    expect(applySuccessionDonationFieldUpdate(initialEntry, 'donataire', 42).donataire).toBe('42');
  });

  it('activer donSommeArgentExonere désactive avecReserveUsufruit (exclusivité 790 G / NP)', () => {
    const entryAvecNP = {
      id: 'don-np',
      type: 'rapportable' as const,
      montant: 50000,
      avecReserveUsufruit: true,
    };

    const result = applySuccessionDonationFieldUpdate(entryAvecNP, 'donSommeArgentExonere', true);
    expect(result.donSommeArgentExonere).toBe(true);
    expect(result.avecReserveUsufruit).toBe(false);
  });

  it('activer avecReserveUsufruit désactive donSommeArgentExonere (exclusivité NP / 790 G)', () => {
    const entryAvec790G = {
      id: 'don-790g',
      type: 'rapportable' as const,
      montant: 25000,
      donSommeArgentExonere: true,
    };

    const result = applySuccessionDonationFieldUpdate(entryAvec790G, 'avecReserveUsufruit', true);
    expect(result.avecReserveUsufruit).toBe(true);
    expect(result.donSommeArgentExonere).toBe(false);
  });

  it('désactiver donSommeArgentExonere ne modifie pas avecReserveUsufruit', () => {
    const entryAvecNP = {
      id: 'don-np',
      type: 'rapportable' as const,
      montant: 50000,
      avecReserveUsufruit: true,
    };

    const result = applySuccessionDonationFieldUpdate(entryAvecNP, 'donSommeArgentExonere', false);
    expect(result.donSommeArgentExonere).toBe(false);
    expect(result.avecReserveUsufruit).toBe(true);
  });
});
