import { describe, expect, it } from 'vitest';
import {
  getAgeAtReferenceDate,
  getBareOwnershipRateFromAge,
  getUsufruitRateFromAge,
  getUsufruitValuationFromBirthDate,
} from '../successionUsufruit';

describe('successionUsufruit', () => {
  it('applique le barème art. 669 CGI selon l’âge de l’usufruitier', () => {
    expect(getUsufruitRateFromAge(20)).toBe(0.9);
    expect(getUsufruitRateFromAge(21)).toBe(0.8);
    expect(getUsufruitRateFromAge(68)).toBe(0.4);
    expect(getUsufruitRateFromAge(75)).toBe(0.3);
    expect(getBareOwnershipRateFromAge(75)).toBe(0.7);
  });

  it('calcule l’âge à une date de décès simulée', () => {
    expect(getAgeAtReferenceDate('1975-03-10', new Date('2026-03-08'))).toBe(50);
    expect(getAgeAtReferenceDate('1975-03-08', new Date('2026-03-08'))).toBe(51);
  });

  it('valorise usufruit et nue-propriété à partir de la date de naissance', () => {
    const valuation = getUsufruitValuationFromBirthDate('1957-05-12', 500000, new Date('2026-03-08'));

    expect(valuation).not.toBeNull();
    expect(valuation?.age).toBe(68);
    expect(valuation?.valeurUsufruit).toBe(200000);
    expect(valuation?.valeurNuePropriete).toBe(300000);
  });
});
