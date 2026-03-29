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

  it('BUG-4: boundary age 70→71 — veille, jour, lendemain des 71 ans', () => {
    // Born 1955-06-15, reference date around 71st birthday
    const birth = '1955-06-15';

    // Veille des 71 ans (2026-06-14): age = 70 → taux = 40%
    const veille = getUsufruitValuationFromBirthDate(birth, 1_000_000, new Date('2026-06-14T00:00:00Z'));
    expect(veille?.age).toBe(70);
    expect(veille?.tauxUsufruit).toBe(0.4);

    // Jour des 71 ans (2026-06-15): age = 71 → taux = 30%
    const jour = getUsufruitValuationFromBirthDate(birth, 1_000_000, new Date('2026-06-15T00:00:00Z'));
    expect(jour?.age).toBe(71);
    expect(jour?.tauxUsufruit).toBe(0.3);

    // Lendemain (2026-06-16): age = 71 → taux = 30%
    const lendemain = getUsufruitValuationFromBirthDate(birth, 1_000_000, new Date('2026-06-16T00:00:00Z'));
    expect(lendemain?.age).toBe(71);
    expect(lendemain?.tauxUsufruit).toBe(0.3);
  });

  it('BUG-4: UTC consistency — age computation independent of timezone', () => {
    // Without UTC fix, passing a date-only string could produce wrong age
    // depending on timezone offset. With UTC, it's always consistent.
    const age = getAgeAtReferenceDate('1955-06-15', new Date('2026-06-15T00:00:00Z'));
    expect(age).toBe(71);

    // One day before birthday → still 70
    const ageBefore = getAgeAtReferenceDate('1955-06-15', new Date('2026-06-14T23:59:59Z'));
    expect(ageBefore).toBe(70);
  });
});
