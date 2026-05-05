import { describe, expect, it } from 'vitest';
import { APP_ROUTES } from '../../../routes/appRoutes';

describe('Route /sim/tresorerie-societe', () => {
  const route = APP_ROUTES.find(r => r.kind === 'route' && r.path === '/sim/tresorerie-societe');

  it('est définie dans APP_ROUTES', () => {
    expect(route).toBeDefined();
  });

  it('est lazy et porte le bon label contexte', () => {
    if (!route || route.kind !== 'route') return;
    expect(route.lazy).toBe(true);
    expect(route.contextLabel).toBe('Trésorerie société');
  });

  it('n\'a plus de props placeholder (UpcomingSimulatorPage supprimé)', () => {
    if (!route || route.kind !== 'route') return;
    // UpcomingSimulatorPage injectait { title, subtitle } — ces props doivent être absentes
    expect(route.props).toBeUndefined();
  });
});
