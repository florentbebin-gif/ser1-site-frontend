// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TresoTimelineSection } from '../components/timeline/TresoTimelineSection';
import { computeTimelineRange } from '../components/timeline/timelineLayout';
import { cloneInputs, phase } from './timeline.testUtils';

describe('TresoTimelineSection - rendu', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('affiche un état de démarrage si la société ou le profil associé est incomplet', () => {
    const onChange = vi.fn();
    const openSociety = vi.fn();
    window.addEventListener('ts:open-society-panel', openSociety);

    render(
      <TresoTimelineSection
        inputs={cloneInputs((inputs) => {
          inputs.company.label = '';
          inputs.company.associates[0].profile!.currentAge = 0;
        })}
        onChange={onChange}
      />,
    );

    expect(screen.getByText('Parcours de revenus de l’associé')).toBeInTheDocument();
    expect(screen.getByText(/Compléter la société et l’associé/i)).toBeInTheDocument();

    const completeSocietyButton = screen.getByRole('button', { name: /Compléter la société/i });
    expect(completeSocietyButton).toHaveClass('sim-action-btn--edit');
    fireEvent.click(completeSocietyButton);
    expect(openSociety).toHaveBeenCalledTimes(1);
    window.removeEventListener('ts:open-society-panel', openSociety);
  });

  it('reprend l’en-tête standard des sections du simulateur', () => {
    render(<TresoTimelineSection inputs={cloneInputs()} onChange={vi.fn()} />);

    expect(screen.getByRole('heading', { name: /Parcours de revenus de l’associé/i })).toHaveClass(
      'ts-section__title',
    );
    expect(screen.getByText(/Phases de rémunération/i)).toHaveClass('ts-section__subtitle');
    expect(document.querySelector('.sim-card__icon')).toBeInTheDocument();
    expect(document.querySelector('.ts-section__divider')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Paramétrer l’associé' })).toHaveClass(
      'sim-action-btn--edit',
    );
    expect(screen.getByRole('button', { name: 'Ajouter un palier' })).toHaveClass(
      'sim-action-btn--add',
    );
  });

  it('permet d’allonger l’horizon de projection', () => {
    render(<TresoTimelineSection inputs={cloneInputs()} onChange={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Horizon de projection'), { target: { value: '25' } });

    expect(screen.getByText('2050')).toBeInTheDocument();
  });

  it('partage l’horizon de projection avec le calcul comptable', () => {
    const onChange = vi.fn();
    render(<TresoTimelineSection inputs={cloneInputs()} onChange={onChange} />);

    const horizonInput = screen.getByLabelText('Horizon de projection');
    fireEvent.change(horizonInput, { target: { value: '60' } });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.blur(horizonInput);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        company: expect.objectContaining({ projectionHorizonYears: 60 }),
      }),
    );
  });

  it('place le début et l’horizon de projection dans la même grille de réglages', () => {
    render(<TresoTimelineSection inputs={cloneInputs()} onChange={vi.fn()} />);

    const grid = document.querySelector('.ts-timeline-settings-grid');

    expect(grid).toBeInTheDocument();
    expect(grid).toContainElement(screen.getByLabelText('Début de projection'));
    expect(grid).toContainElement(screen.getByLabelText('Horizon de projection'));
  });

  it('élargit le SVG quand l’horizon devient long', () => {
    const inputs = cloneInputs();
    const layout = computeTimelineRange(inputs.company, inputs.company.associates[0], 30);

    expect(layout.svgWidth).toBeGreaterThan(1000);
  });

  it('supprime les jalons et badges numérotés du schéma', () => {
    const inputs = cloneInputs();
    const layout = computeTimelineRange(inputs.company, inputs.company.associates[0], 15);

    render(<TresoTimelineSection inputs={inputs} onChange={vi.fn()} />);

    expect(layout.paliers).toHaveLength(2);
    expect(document.querySelectorAll('.ts-timeline-track__phase-badge')).toHaveLength(0);
    expect(document.querySelectorAll('.ts-timeline-track__milestone-label')).toHaveLength(0);
  });

  it('affiche le net estimé dans la timeline de rémunération', () => {
    const inputs = cloneInputs();
    const layout = computeTimelineRange(inputs.company, inputs.company.associates[0], 15);

    expect(layout.paliers[0].subPhases[0].shortLabel).toContain('56 k€ net');
    expect(layout.paliers[0].subPhases[0].shortLabel).not.toContain('80 k€ brut');
  });

  it('masque les libellés internes des bandes trop courtes pour éviter les chevauchements', () => {
    render(
      <TresoTimelineSection
        inputs={cloneInputs((inputs) => {
          inputs.company.subsidiaries = [];
          inputs.company.associates[0].revenuePhases = [
            phase({
              id: 'phase-2026',
              label: 'A',
              startYear: 2026,
              endYear: 2026,
              remuneration: {
                enabled: true,
                source: 'holding',
                loadedAnnualCost: 0,
                socialChargeRate: 0,
              },
            }),
            phase({
              id: 'phase-2027',
              label: 'B',
              startYear: 2027,
              endYear: 2027,
            }),
          ];
        })}
        onChange={vi.fn()}
      />,
    );

    expect(document.querySelectorAll('.ts-timeline-track__phase-badge')).toHaveLength(0);
    expect(screen.queryByText(/2026-2026 · besoin/i)).not.toBeInTheDocument();
    expect(document.querySelector('.ts-timeline-track')).toBeInTheDocument();
  });

  it('affiche un message informatif pour un associé personne morale', () => {
    render(
      <TresoTimelineSection
        inputs={cloneInputs((inputs) => {
          inputs.company.associates[0].kind = 'pm';
        })}
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/Une personne morale ne porte pas de parcours de revenu personnel/i),
    ).toBeInTheDocument();
  });
});
