import { describe, expect, it } from 'vitest';
import { COLOR_USAGE_GUIDELINES } from './colorUsageGuidelines';

describe('COLOR_USAGE_GUIDELINES', () => {
  it('documente les rôles SER1 actuels des tokens C1-C10', () => {
    const byToken = Object.fromEntries(
      COLOR_USAGE_GUIDELINES.map((field) => [field.token, field.usage]),
    );

    expect(byToken.C1).toContain('Ancrage');
    expect(byToken.C2).toContain('Action primaire');
    expect(byToken.C3).toContain('Marqueur actif');
    expect(byToken.C4).toContain('Fill doux');
    expect(byToken.C5).toContain('Données secondaires');
    expect(byToken.C6).toContain('Signature');
    expect(byToken.C7).toContain('Surface page');
    expect(byToken.C8).toContain('Bordures');
    expect(byToken.C9).toContain('Texte secondaire');
    expect(byToken.C10).toContain('Texte primaire');
  });
});
