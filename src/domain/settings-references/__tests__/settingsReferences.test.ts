import { describe, expect, it } from 'vitest';

import { SETTINGS_REFERENCE_CHAIN, listSettingsReferenceBindings } from '../index';

describe('settings-references', () => {
  it('expose le registre canonique et le filtre par page', () => {
    expect(SETTINGS_REFERENCE_CHAIN.length).toBeGreaterThan(0);

    const mementoBindings = listSettingsReferenceBindings('/settings/memento');

    expect(mementoBindings.length).toBeGreaterThan(0);
    expect(mementoBindings.every((binding) => binding.pagePath === '/settings/memento')).toBe(true);
    expect(mementoBindings.map((binding) => binding.claimKey)).toEqual(
      expect.arrayContaining([
        'income-tax-scale-current',
        'corporate-tax-current',
        'dmtg-fiscal-values-current',
      ]),
    );
  });

  it('chaîne les claims charges sociales dirigeant de la page mémento', () => {
    const mementoBindings = listSettingsReferenceBindings('/settings/memento');

    expect(mementoBindings.map((binding) => binding.claimKey)).toEqual(
      expect.arrayContaining(['social-dirigeant-dividendes-tns']),
    );
    expect(
      mementoBindings.find((binding) => binding.claimKey === 'social-dirigeant-dividendes-tns')
        ?.target,
    ).toEqual({
      kind: 'settings-default',
      table: 'ps_settings',
      path: 'socialDirigeant.current.dividends.tnsSocialBasePct',
    });
  });
});
