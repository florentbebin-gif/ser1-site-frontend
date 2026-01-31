import { describe, it, expect } from 'vitest';
import { computeAutoPartsWithChildren } from './irEngine.js';

// Tests oracle (10 cas) sur le calcul des parts (quotient familial)
describe('computeAutoPartsWithChildren - oracle 10 cas', () => {
  it('1) Célibataire + 1 enfant alternée => 1,25', () => {
    expect(
      computeAutoPartsWithChildren({
        status: 'single',
        isIsolated: false,
        children: [{ mode: 'shared' }],
      })
    ).toBe(1.25);
  });

  it('2) Parent isolé + 1 enfant à charge => 2,00', () => {
    expect(
      computeAutoPartsWithChildren({
        status: 'single',
        isIsolated: true,
        children: [{ mode: 'charge' }],
      })
    ).toBe(2);
  });

  it('3) Parent isolé + 1 enfant alternée => 1,50', () => {
    expect(
      computeAutoPartsWithChildren({
        status: 'single',
        isIsolated: true,
        children: [{ mode: 'shared' }],
      })
    ).toBe(1.5);
  });

  it('4) Parent isolé + 1 charge + 1 alternée => 2,25', () => {
    expect(
      computeAutoPartsWithChildren({
        status: 'single',
        isIsolated: true,
        children: [{ mode: 'charge' }, { mode: 'shared' }],
      })
    ).toBe(2.25);
  });

  it('5) Parent isolé + 2 alternée => 2,00', () => {
    expect(
      computeAutoPartsWithChildren({
        status: 'single',
        isIsolated: true,
        children: [{ mode: 'shared' }, { mode: 'shared' }],
      })
    ).toBe(2);
  });

  it('6) Parent isolé + 3 alternée => 2,50', () => {
    expect(
      computeAutoPartsWithChildren({
        status: 'single',
        isIsolated: true,
        children: [{ mode: 'shared' }, { mode: 'shared' }, { mode: 'shared' }],
      })
    ).toBe(2.5);
  });

  it('7) Parent isolé + 2 charge + 2 alternée => 3,50 (ordre inversé)', () => {
    expect(
      computeAutoPartsWithChildren({
        status: 'single',
        isIsolated: true,
        children: [
          { mode: 'shared' },
          { mode: 'shared' },
          { mode: 'charge' },
          { mode: 'charge' },
        ],
      })
    ).toBe(3.5);
  });

  it('8) Parent isolé + 3 charge + 1 alternée => 4,00 (ordre inversé)', () => {
    expect(
      computeAutoPartsWithChildren({
        status: 'single',
        isIsolated: true,
        children: [
          { mode: 'shared' },
          { mode: 'charge' },
          { mode: 'charge' },
          { mode: 'charge' },
        ],
      })
    ).toBe(4);
  });

  it('9) Célibataire + 3 alternée => 2,00', () => {
    expect(
      computeAutoPartsWithChildren({
        status: 'single',
        isIsolated: false,
        children: [{ mode: 'shared' }, { mode: 'shared' }, { mode: 'shared' }],
      })
    ).toBe(2);
  });

  it('10) Célibataire + 2 charge + 2 alternée => 3,00 (ordre inversé)', () => {
    expect(
      computeAutoPartsWithChildren({
        status: 'single',
        isIsolated: false,
        children: [
          { mode: 'shared' },
          { mode: 'shared' },
          { mode: 'charge' },
          { mode: 'charge' },
        ],
      })
    ).toBe(3);
  });
});
