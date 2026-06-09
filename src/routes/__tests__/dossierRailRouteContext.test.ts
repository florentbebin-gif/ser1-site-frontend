import { describe, expect, it } from 'vitest';

import { getDossierRailRouteContext, getSimulatorRoutePath } from '../dossierRailRouteContext';

describe('getDossierRailRouteContext', () => {
  it('déclare stratégie comme surface rail complète', () => {
    expect(getDossierRailRouteContext('/strategy')).toMatchObject({ kind: 'strategy' });
  });

  it('ne monte plus le rail partagé sur /audit (cockpit pleine largeur, UX-01)', () => {
    expect(getDossierRailRouteContext('/audit')).toBeNull();
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
