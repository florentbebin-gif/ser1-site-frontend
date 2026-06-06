import { describe, expect, it } from 'vitest';

import { SETTINGS_REFERENCE_CHAIN, listSettingsReferenceBindings } from '../index';

describe('settings-references', () => {
  it('expose le registre canonique et le filtre par page', () => {
    expect(SETTINGS_REFERENCE_CHAIN.length).toBeGreaterThan(0);

    const impotsBindings = listSettingsReferenceBindings('/settings/impots');
    const comptablesSocietesBindings = listSettingsReferenceBindings(
      '/settings/comptables-societes',
    );

    expect(impotsBindings.length).toBeGreaterThan(0);
    expect(impotsBindings.every((binding) => binding.pagePath === '/settings/impots')).toBe(true);
    expect(comptablesSocietesBindings.map((binding) => binding.claimKey)).toEqual([
      'corporate-tax-current',
    ]);
  });
});
