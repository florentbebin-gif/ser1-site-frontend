// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { SimViewSynthesisCTA } from '../SimViewSynthesisCTA';

describe('SimViewSynthesisCTA', () => {
  it('reste masqué tant que la synthèse n’est pas prête', () => {
    const html = renderToStaticMarkup(<SimViewSynthesisCTA ready={false} targetId="synthese" />);

    expect(html).toBe('');
  });

  it('rend un CTA contextuel vers la synthèse prête', () => {
    const html = renderToStaticMarkup(
      <SimViewSynthesisCTA ready targetId="synthese" hint="Indicateurs calculés" />,
    );

    expect(html).toContain('sim-view-synthesis-cta');
    expect(html).toContain('Voir la synthèse');
    expect(html).toContain('Indicateurs calculés');
  });

  it('supporte la variante flottante prévue pour les pages simulateurs', () => {
    const html = renderToStaticMarkup(
      <SimViewSynthesisCTA ready targetId="synthese" variant="floating" />,
    );

    expect(html).toContain('sim-view-synthesis-cta--floating');
  });

  it('fait défiler vers la synthèse au clic', () => {
    const target = document.createElement('section');
    target.id = 'synthese';
    target.scrollIntoView = vi.fn();
    document.body.appendChild(target);

    render(<SimViewSynthesisCTA ready targetId="synthese" />);

    fireEvent.click(screen.getByRole('button', { name: /Voir la synthèse/ }));

    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    target.remove();
  });
});
