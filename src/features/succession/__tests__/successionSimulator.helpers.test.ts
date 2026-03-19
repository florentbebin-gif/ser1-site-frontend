import { describe, expect, it } from 'vitest';
import {
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
});
