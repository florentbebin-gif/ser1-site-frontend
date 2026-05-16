import { describe, expect, it } from 'vitest';
import { capOutgoingTransferFeeRate, defaultOutgoingTransferFeeRate } from '../utils/transferFeeCap';

describe('capOutgoingTransferFeeRate', () => {
  const today = new Date('2026-05-16T12:00:00.000Z');

  it('plafonne à 1 % les PERP, Madelin et Article 83 transférés vers un PER', () => {
    expect(capOutgoingTransferFeeRate('PERP', 0.05, '', today)).toBe(0.01);
    expect(capOutgoingTransferFeeRate('MADELIN', 0.04, '', today)).toBe(0.01);
    expect(capOutgoingTransferFeeRate('ARTICLE83', 0.03, '', today)).toBe(0.01);
  });

  it('annule les frais après dix ans depuis la souscription saisie', () => {
    expect(capOutgoingTransferFeeRate('MADELIN', 0.01, '2014-05-15', today)).toBe(0);
  });

  it('conserve un taux contractuel inférieur au plafond', () => {
    expect(capOutgoingTransferFeeRate('ARTICLE83', 0.005, '', today)).toBe(0.005);
  });

  it('ne modifie pas les familles non visées par L224-40 I bis', () => {
    expect(capOutgoingTransferFeeRate('PERIN', 0.03, '', today)).toBe(0.03);
  });

  it('retient 0 % par défaut pour un PERCO ancien en transfert individuel', () => {
    expect(defaultOutgoingTransferFeeRate('PERCO', 0.01)).toBe(0);
  });
});
