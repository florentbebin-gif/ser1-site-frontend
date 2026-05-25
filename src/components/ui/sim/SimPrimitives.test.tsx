import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { SimFieldShell } from './SimFieldShell';
import { SimMobileStickyActions } from './SimMobileStickyActions';
import { SimModalShell } from './SimModalShell';

describe('SimFieldShell', () => {
  it('renders the label, row wrapper and error message', () => {
    const html = renderToStaticMarkup(
      <SimFieldShell
        label="Montant"
        error="Champ requis"
        className="custom-field"
        rowClassName="custom-row"
        controlId="amount"
        testId="field-shell"
      >
        <input id="amount" className="sim-field__control" />
        <span className="sim-field__unit">€</span>
      </SimFieldShell>,
    );

    expect(html).toContain('data-testid="field-shell"');
    expect(html).toContain('class="sim-field custom-field"');
    expect(html).toContain('for="amount"');
    expect(html).toContain('class="sim-field__row custom-row"');
    expect(html).toContain('Champ requis');
  });

  it('renders the hint only when there is no error', () => {
    const html = renderToStaticMarkup(
      <SimFieldShell label="Durée" hint="En mois">
        <input className="sim-field__control" />
      </SimFieldShell>,
    );

    expect(html).toContain('En mois');
    expect(html).not.toContain('sim-field__error');
  });
});

describe('SimModalShell', () => {
  it('renders title, subtitle, close action and footer slots', () => {
    const onClose = vi.fn();
    const html = renderToStaticMarkup(
      <SimModalShell
        title="Configurer"
        subtitle="Paramètres avancés"
        icon={<span>i</span>}
        onClose={onClose}
        footer={<button type="button">Valider</button>}
      >
        <p>Contenu</p>
      </SimModalShell>,
    );

    expect(html).toContain('sim-modal-overlay');
    expect(html).toContain('sim-modal-overlay--bottom-sheet');
    expect(html).toContain('sim-modal--bottom-sheet');
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-labelledby=');
    expect(html).toContain('sim-modal__header');
    expect(html).toContain('Configurer');
    expect(html).toContain('Paramètres avancés');
    expect(html).toContain('aria-label="Fermer la modale"');
    expect(html).toContain('sim-modal__footer');
    expect(html).toContain('Valider');
    expect(html).toContain('Contenu');
  });

  it('permet le variant mobile fullscreen', () => {
    const html = renderToStaticMarkup(
      <SimModalShell title="Plein écran" mobileVariant="fullscreen">
        <p>Contenu</p>
      </SimModalShell>,
    );

    expect(html).toContain('sim-modal-overlay--fullscreen');
    expect(html).toContain('sim-modal--fullscreen');
  });
});

describe('SimMobileStickyActions', () => {
  it('rend un groupe d actions sticky mobile', () => {
    const html = renderToStaticMarkup(
      <SimMobileStickyActions ariaLabel="Actions de validation">
        <button type="button">Annuler</button>
        <button type="button">Valider</button>
      </SimMobileStickyActions>,
    );

    expect(html).toContain('sim-mobile-sticky-actions');
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-label="Actions de validation"');
    expect(html).toContain('Valider');
  });
});
