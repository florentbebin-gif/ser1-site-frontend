import { describe, expect, it } from 'vitest';

import { buildDossierRailViewModel } from '../railViewModel';

describe('buildDossierRailViewModel', () => {
  it('expose le parcours complet pour audit et stratégie', () => {
    const audit = buildDossierRailViewModel({ kind: 'audit', pathname: '/audit' });
    const strategy = buildDossierRailViewModel({ kind: 'strategy', pathname: '/strategy' });

    expect(audit?.density).toBe('full');
    expect(audit?.journey.label).toBe('Audit global');
    expect(audit?.current.id).toBe('audit-objectives');
    expect(audit?.version.isPersisted).toBe(false);

    expect(strategy?.density).toBe('full');
    expect(strategy?.current.id).toBe('strategy');
    expect(strategy?.previous.some((step) => step.id === 'succession')).toBe(true);
  });

  it('positionne Succession sur le parcours Transmission privée', () => {
    const rail = buildDossierRailViewModel({
      kind: 'simulator',
      pathname: '/sim/succession',
      simulatorId: 'succession',
      routeId: 'succession',
      preferredJourneyId: 'transmission-privee',
    });

    expect(rail?.density).toBe('compact');
    expect(rail?.journey.label).toBe('Transmission privée');
    expect(rail?.current.id).toBe('succession');
    expect(rail?.current.availability).toBe('available');
    expect(rail?.next.map((step) => step.id)).toContain('donation-demembrement');
    expect(rail?.next.find((step) => step.id === 'succession')?.isCurrent).toBe(false);
  });

  it('marque les étapes planned comme futures, sans route obligatoire', () => {
    const rail = buildDossierRailViewModel({
      kind: 'simulator',
      pathname: '/sim/succession',
      simulatorId: 'succession',
      routeId: 'succession',
      preferredJourneyId: 'transmission-privee',
    });

    const donation = rail?.next.find((step) => step.id === 'donation-demembrement');

    expect(donation?.availability).toBe('future');
    expect(donation?.routeId).toBeUndefined();
  });
});
