// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TresoTimelineSection } from '../components/timeline/TresoTimelineSection';
import {
  clickModalSubPhase,
  cloneInputs,
  getPhaseModal,
  openPhaseModal,
} from './timeline.testUtils';

describe('TresoTimelineSection - modale palier', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('ouvre la modale du palier avec les valeurs existantes', () => {
    render(<TresoTimelineSection inputs={cloneInputs()} onChange={vi.fn()} />);

    openPhaseModal();

    expect(screen.getByText('Paramétrer le palier')).toBeInTheDocument();
    expect(screen.getByLabelText('Année de début')).toHaveDisplayValue('2026');
    expect(screen.getByLabelText('Année de fin')).toHaveDisplayValue('2030');
    expect(screen.getByRole('button', { name: /Supprimer ce palier/i })).toHaveClass(
      'sim-modal-btn--ghost',
    );
    expect(screen.getByRole('button', { name: 'Annuler' })).toHaveClass('sim-modal-btn--ghost');
    expect(screen.getByRole('button', { name: 'Valider' })).toHaveClass('sim-modal-btn--primary');
    expect(
      screen.getByDisplayValue((value) => value.replace(/\s/g, '') === '80000'),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Rémunération/i }).length).toBeGreaterThan(0);
  });

  it('retire les choix Aucun déjà induits par le rail des sous-phases', () => {
    render(<TresoTimelineSection inputs={cloneInputs()} onChange={vi.fn()} />);

    openPhaseModal();
    const modal = getPhaseModal();

    expect(within(modal).queryByLabelText('Aucune rémunération')).not.toBeInTheDocument();
    clickModalSubPhase(/Distribution/i);
    expect(within(modal).queryByLabelText('Aucun dividende')).not.toBeInTheDocument();
    clickModalSubPhase(/Remboursement CCA/i);
    expect(within(modal).queryByLabelText('Aucun remboursement')).not.toBeInTheDocument();
  });

  it('masque la rémunération depuis une filiale quand aucune filiale n’existe', () => {
    render(
      <TresoTimelineSection
        inputs={cloneInputs((inputs) => {
          inputs.company.subsidiaries = [];
        })}
        onChange={vi.fn()}
      />,
    );

    openPhaseModal();

    expect(screen.queryByLabelText('Oui, depuis une filiale')).not.toBeInTheDocument();
  });

  it('retire le besoin et le complément de la phase distribution', () => {
    render(<TresoTimelineSection inputs={cloneInputs()} onChange={vi.fn()} />);

    openPhaseModal(/Modifier Palier 2031-2040/i);
    clickModalSubPhase(/Distribution/i);
    fireEvent.click(screen.getByLabelText('Montant net cible'));

    expect(screen.queryByText('Besoin total annuel net')).not.toBeInTheDocument();
    expect(screen.queryByText('Complément à financer')).not.toBeInTheDocument();
    expect(screen.queryByText(/^Besoin total /)).not.toBeInTheDocument();
    expect(screen.getByText('Objectif net annuel de l’associé (net de PFU)')).toBeInTheDocument();
  });

  it('explicite le net de rémunération avant IR dans la modale du palier', () => {
    render(<TresoTimelineSection inputs={cloneInputs()} onChange={vi.fn()} />);

    openPhaseModal();
    clickModalSubPhase(/Rémunération/i);

    expect(screen.getAllByText(/Net annuel estimé avant IR/).length).toBeGreaterThan(0);
  });

  it('simplifie la constitution CCA autour des bornes du palier', () => {
    render(<TresoTimelineSection inputs={cloneInputs()} onChange={vi.fn()} />);

    openPhaseModal();
    clickModalSubPhase(/Constitution CCA/i);

    expect(screen.getByText('Apport annuel')).toBeInTheDocument();
    expect(screen.queryByText('Apport annuel de')).not.toBeInTheDocument();
    expect(screen.queryByText('Apport annuel à')).not.toBeInTheDocument();
  });

  it('calcule un remboursement CCA linéaire sur la durée du palier', () => {
    const onChange = vi.fn();
    render(<TresoTimelineSection inputs={cloneInputs()} onChange={onChange} />);

    openPhaseModal();
    clickModalSubPhase(/Remboursement CCA/i);
    const repaymentGroup = screen.getByRole('radiogroup', {
      name: /Remboursement annuel souhaité/i,
    });
    expect(
      within(repaymentGroup).getByRole('button', { name: /Linéaire sur la phase/i }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Linéaire sur la phase/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        company: expect.objectContaining({
          associates: expect.arrayContaining([
            expect.objectContaining({
              revenuePhases: expect.arrayContaining([
                expect.objectContaining({
                  id: 'phase-remu',
                  ccaRepayment: expect.objectContaining({
                    enabled: true,
                    strategy: 'montant_cible',
                    targetAmount: 20_000,
                  }),
                }),
              ]),
            }),
          ]),
        }),
      }),
    );
  });

  it('bloque l’enregistrement si deux paliers activent la même sous-phase sur les mêmes années', () => {
    render(
      <TresoTimelineSection
        inputs={cloneInputs((inputs) => {
          inputs.company.associates[0].revenuePhases[1].remuneration = {
            enabled: true,
            source: 'holding',
            loadedAnnualCost: 50000,
            socialChargeRate: 0.2,
          };
        })}
        onChange={vi.fn()}
      />,
    );

    openPhaseModal();
    fireEvent.change(screen.getByLabelText('Année de début'), { target: { value: '2031' } });
    fireEvent.change(screen.getByLabelText('Année de fin'), { target: { value: '2035' } });

    expect(screen.getByRole('alert')).toHaveTextContent(/sous-phase Rémunération/i);
    expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled();
  });

  it('persiste l’année de fin saisie dans le palier', () => {
    const onChange = vi.fn();
    render(<TresoTimelineSection inputs={cloneInputs()} onChange={onChange} />);

    openPhaseModal();
    fireEvent.change(screen.getByLabelText('Année de fin'), { target: { value: '2029' } });
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        company: expect.objectContaining({
          associates: expect.arrayContaining([
            expect.objectContaining({
              revenuePhases: expect.arrayContaining([
                expect.objectContaining({ id: 'phase-remu', endYear: 2029 }),
              ]),
            }),
          ]),
        }),
      }),
    );
  });

  it('normalise le besoin et les bornes CCA annuelles à l’enregistrement', () => {
    const onChange = vi.fn();
    render(
      <TresoTimelineSection
        inputs={cloneInputs((inputs) => {
          inputs.company.associates[0].revenuePhases[0].ccaContribution = {
            enabled: true,
            annual: { amount: 12_000, startYear: 2040, endYear: 2042 },
          };
        })}
        onChange={onChange}
      />,
    );

    openPhaseModal();
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        company: expect.objectContaining({
          associates: expect.arrayContaining([
            expect.objectContaining({
              revenuePhases: expect.arrayContaining([
                expect.objectContaining({
                  id: 'phase-remu',
                  distribution: expect.objectContaining({ annualNetIncomeNeed: 0 }),
                  ccaContribution: expect.objectContaining({
                    annual: expect.objectContaining({ startYear: 2026, endYear: 2030 }),
                  }),
                }),
              ]),
            }),
          ]),
        }),
      }),
    );
  });

  it('désactive la suppression quand il ne reste qu’un seul palier', () => {
    render(
      <TresoTimelineSection
        inputs={cloneInputs((inputs) => {
          inputs.company.associates[0].revenuePhases = [
            inputs.company.associates[0].revenuePhases[0],
          ];
        })}
        onChange={vi.fn()}
      />,
    );

    openPhaseModal();

    const footer = screen.getByTestId('ts-phase-modal-footer');
    expect(within(footer).getByRole('button', { name: /Supprimer ce palier/i })).toBeDisabled();
  });
});
