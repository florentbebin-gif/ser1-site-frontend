import { describe, expect, it } from 'vitest';

import { resolvePerCompartiment } from '../compartimentMapping';

describe('resolvePerCompartiment', () => {
  it('oriente les anciens contrats retraite vers le bon compartiment PER', () => {
    expect(resolvePerCompartiment('ARTICLE83')).toBe('C3');
    expect(resolvePerCompartiment('PEROB')).toBe('C3');
    expect(resolvePerCompartiment('PERCO')).toBe('C2');
    expect(resolvePerCompartiment('PERECO')).toBe('C2');
    expect(resolvePerCompartiment('PERP')).toBe('C1');
    expect(resolvePerCompartiment('MADELIN')).toBe('C1');
    expect(resolvePerCompartiment('PER_POINTS')).toBe('C1');
  });

  it('ramène le compartiment Préfon C0 vers C1 lors du transfert', () => {
    expect(resolvePerCompartiment('PER_POINTS', 'C0')).toBe('C1');
  });
});
