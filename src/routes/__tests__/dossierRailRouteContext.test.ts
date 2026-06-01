import { describe, expect, it } from 'vitest';

import { getDossierRailRouteContext, getSimulatorRoutePath } from '../dossierRailRouteContext';

describe('getDossierRailRouteContext', () => {
  it('déclare audit et stratégie comme surfaces rail complètes', () => {
    expect(getDossierRailRouteContext('/audit')).toMatchObject({ kind: 'audit' });
    expect(getDossierRailRouteContext('/strategy')).toMatchObject({ kind: 'strategy' });
  });

  it('résout une route /sim/* depuis les contrats de route existants', () => {
    expect(getDossierRailRouteContext('/sim/succession')).toMatchObject({
      kind: 'simulator',
      simulatorId: 'succession',
      routeId: 'succession',
      preferredJourneyId: 'transmission-privee',
    });
  });

  it('ne crée pas de contexte rail pour la Home ou les settings', () => {
    expect(getDossierRailRouteContext('/')).toBeNull();
    expect(getDossierRailRouteContext('/settings')).toBeNull();
  });

  it('résout les chemins simulateur sans recopier les paths dans le domaine dossier', () => {
    expect(getSimulatorRoutePath('succession')).toBe('/sim/succession');
    expect(getSimulatorRoutePath('donation-demembrement')).toBeNull();
  });
});
