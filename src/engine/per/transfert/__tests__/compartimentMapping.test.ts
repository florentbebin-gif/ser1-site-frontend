import { describe, expect, it } from 'vitest';

import { resolvePerCompartiment } from '../compartimentMapping';

describe('resolvePerCompartiment', () => {
  it('oriente les anciens contrats retraite vers le bon compartiment PER', () => {
    expect(resolvePerCompartiment('ARTICLE83')).toBe('C3');
    expect(resolvePerCompartiment('PERCO')).toBe('C2');
    expect(resolvePerCompartiment('PERP')).toBe('C1');
    expect(resolvePerCompartiment('MADELIN')).toBe('C1');
    expect(resolvePerCompartiment('PER_POINTS')).toBe('C1');
  });
});
