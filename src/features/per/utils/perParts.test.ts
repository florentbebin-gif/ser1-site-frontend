import { describe, expect, it } from 'vitest';
import { derivePerNombreParts } from './perParts';

describe('derivePerNombreParts', () => {
  it('calcule les parts pour un couple avec deux enfants à charge', () => {
    expect(
      derivePerNombreParts({
        situationFamiliale: 'marie',
        isole: false,
        children: [
          { id: 1, mode: 'charge' },
          { id: 2, mode: 'charge' },
        ],
      }),
    ).toBe(3);
  });

  it('ajoute la majoration parent isolé pour un célibataire avec un enfant à charge', () => {
    expect(
      derivePerNombreParts({
        situationFamiliale: 'celibataire',
        isole: true,
        children: [{ id: 1, mode: 'charge' }],
      }),
    ).toBe(2);
  });

  it('calcule les quarts de part en garde alternée', () => {
    expect(
      derivePerNombreParts({
        situationFamiliale: 'celibataire',
        isole: false,
        children: [{ id: 1, mode: 'shared' }],
      }),
    ).toBe(1.25);
  });
});
