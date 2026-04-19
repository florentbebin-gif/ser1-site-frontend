import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SimPageShell } from './SimPageShell';

describe('SimPageShell', () => {
  it('renders the shared page structure with all slots and test ids', () => {
    const html = renderToStaticMarkup(
      <SimPageShell
        title="Simulateur"
        subtitle="Description"
        actions={<button type="button">Exporter</button>}
        nav={<button type="button">Navigation</button>}
        notice={<p>Notice</p>}
        controls={(
          <>
            <div className="sim-controls-row__main">Controles principaux</div>
            <div className="sim-controls-row__side">Controles lateraux</div>
          </>
        )}
        pageClassName="custom-page"
        pageTestId="page"
        headerTestId="header"
        titleTestId="title"
      >
        <SimPageShell.Main className="main-slot">
          <div>Contenu principal</div>
        </SimPageShell.Main>
        <SimPageShell.Side className="side-slot">
          <div>Contenu lateral</div>
        </SimPageShell.Side>
        <SimPageShell.Section className="section-slot">
          <div>Details</div>
        </SimPageShell.Section>
      </SimPageShell>,
    );

    expect(html).toContain('data-testid="page"');
    expect(html).toContain('class="sim-page custom-page"');
    expect(html).toContain('data-testid="header"');
    expect(html).toContain('data-testid="title"');
    expect(html).toContain('class="sim-header__nav"');
    expect(html).toContain('class="sim-notice"');
    expect(html).toContain('class="sim-controls-row"');
    expect(html).toContain('class="sim-grid__col sim-grid__col--main main-slot"');
    expect(html).toContain('class="sim-grid__col sim-grid__col--side sim-grid__col--sticky side-slot"');
    expect(html).toContain('class="sim-section section-slot"');
    expect(html).toContain('Contenu principal');
    expect(html).toContain('Contenu lateral');
    expect(html).toContain('Details');
  });

  it('renders a single-column grid when no side slot is provided', () => {
    const html = renderToStaticMarkup(
      <SimPageShell title="Mono">
        <SimPageShell.Main>
          <div>Corps</div>
        </SimPageShell.Main>
      </SimPageShell>,
    );

    expect(html).toContain('class="sim-grid sim-grid--single"');
    expect(html).not.toContain('sim-grid__col--side');
  });

  it('applies the mobile side-first modifier and allows a non-sticky side', () => {
    const html = renderToStaticMarkup(
      <SimPageShell title="Mobile" mobileSideFirst>
        <SimPageShell.Main>
          <div>Principal</div>
        </SimPageShell.Main>
        <SimPageShell.Side sticky={false}>
          <div>Lateral</div>
        </SimPageShell.Side>
      </SimPageShell>,
    );

    expect(html).toContain('class="sim-grid sim-grid--side-first-mobile"');
    expect(html).toContain('class="sim-grid__col sim-grid__col--side"');
    expect(html).not.toContain('sim-grid__col--sticky');
  });

  it('renders the default loading state and hides page content', () => {
    const html = renderToStaticMarkup(
      <SimPageShell title="Chargement" loading statusTestId="status">
        <SimPageShell.Main>
          <div>Contenu masque</div>
        </SimPageShell.Main>
      </SimPageShell>,
    );

    expect(html).toContain('data-testid="status"');
    expect(html).toContain('Chargement…');
    expect(html).not.toContain('Contenu masque');
  });

  it('renders the error state before loading and preserves custom content', () => {
    const html = renderToStaticMarkup(
      <SimPageShell
        title="Erreur"
        loading
        error="Erreur reseau"
        errorContent={<div className="custom-error">Erreur custom</div>}
        statusTestId="status"
      >
        <SimPageShell.Main>
          <div>Contenu masque</div>
        </SimPageShell.Main>
      </SimPageShell>,
    );

    expect(html).toContain('data-testid="status"');
    expect(html).toContain('class="custom-error"');
    expect(html).toContain('Erreur custom');
    expect(html).not.toContain('Chargement…');
    expect(html).not.toContain('Contenu masque');
  });
});
