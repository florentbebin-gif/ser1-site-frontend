import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { DossierRailViewModel } from '@/domain/dossier';
import { buildDossierRailViewModel } from '@/domain/dossier';

import { DossierRail } from './DossierRail';

function renderRail(viewModel: DossierRailViewModel): string {
  return renderToStaticMarkup(
    <DossierRail
      viewModel={viewModel}
      onNavigate={() => undefined}
      resolveRoutePath={(routeId) => (routeId === 'succession' ? '/sim/succession' : null)}
    />,
  );
}

describe('DossierRail', () => {
  it('rend le rail complet avec la version de travail', () => {
    const viewModel = buildDossierRailViewModel({ kind: 'audit', pathname: '/audit' });

    expect(viewModel).not.toBeNull();
    const html = renderRail(viewModel!);

    expect(html).toContain('data-testid="dossier-rail-panel"');
    expect(html).toContain('Version travail');
    expect(html).toContain('Audit global');
    expect(html).toContain('Objectifs client');
  });

  it('rend le rail compact sans actions globales du chrome', () => {
    const viewModel = buildDossierRailViewModel({
      kind: 'simulator',
      pathname: '/sim/succession',
      simulatorId: 'succession',
      routeId: 'succession',
      preferredJourneyId: 'transmission-privee',
    });

    expect(viewModel).not.toBeNull();
    const html = renderRail(viewModel!);

    expect(html).toContain('data-density="compact"');
    expect(html).toContain('Transmission privée');
    expect(html).not.toContain('Sauvegarder');
    expect(html).not.toContain('Charger');
    expect(html).not.toContain('Réinitialiser');
    expect(html).not.toContain('Exporter');
    expect(html).not.toContain('Mode');
  });
});
