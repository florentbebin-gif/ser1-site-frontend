// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { SimPageStepper } from '../SimPageStepper';

describe('SimPageStepper', () => {
  it('rend un fil de progression discret et accessible', () => {
    const html = renderToStaticMarkup(
      <SimPageStepper
        steps={[
          { id: 'profil', label: 'Profil', status: 'done' },
          { id: 'saisie', label: 'Saisie', status: 'current' },
          { id: 'synthese', label: 'Synthèse', disabled: true },
        ]}
      />,
    );

    expect(html).toContain('sim-page-stepper');
    expect(html).toContain('<nav');
    expect(html).toContain('aria-label="Étapes du simulateur"');
    expect(html).toContain('aria-current="step"');
    expect(html).toContain('Profil');
    expect(html).toContain('disabled=""');
  });

  it('fait défiler vers la section ciblée au clic', () => {
    const target = document.createElement('section');
    target.id = 'sim-synthese';
    target.scrollIntoView = vi.fn();
    document.body.appendChild(target);

    render(
      <SimPageStepper steps={[{ id: 'synthese', label: 'Synthèse', targetId: 'sim-synthese' }]} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Synthèse' }));

    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    target.remove();
  });
});
