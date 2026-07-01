// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { createEmptyDossier, type DossierAudit } from '@/domain/audit/types';
import { buildDossierPatrimonialFromAudit } from '@/domain/dossier';

import { buildAuditLandingViewModel } from '../../auditLandingViewModel';
import { ObjectifsPage } from '../ObjectifsPage';

const NOW = new Date('2026-06-30T10:00:00.000Z');

function renderPage(mutate?: (audit: DossierAudit) => void) {
  const audit = createEmptyDossier();
  mutate?.(audit);
  const viewModel = buildAuditLandingViewModel(
    buildDossierPatrimonialFromAudit(audit, { now: NOW.toISOString() }),
    { now: NOW },
  );
  const onSelectSection = vi.fn();

  const result = render(
    <ObjectifsPage
      dossier={audit}
      viewModel={viewModel}
      updateDossier={vi.fn()}
      onSelectSection={onSelectSection}
    />,
  );

  return { ...result, onSelectSection };
}

describe('ObjectifsPage', () => {
  it('affiche la variante décisionnelle sans libellés répétitifs et remonte le CTA en header', async () => {
    const { onSelectSection } = renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Objectifs' })).toBeVisible();
    expect(screen.queryByText('Données connues')).toBeNull();
    expect(screen.queryByText('Manques')).toBeNull();
    expect(screen.getAllByText('À renseigner').length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('button', { name: 'Revenir à la synthèse' }));

    expect(onSelectSection).toHaveBeenCalledWith('dossier');
  });

  it('ouvre les trois drawers Objectifs avec les tailles canoniques attendues', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: /^Objectifs prioritaires/ }));
    expect(screen.getByRole('dialog', { name: 'Objectifs prioritaires' })).toHaveClass(
      'sim-drawer--md',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    await userEvent.click(screen.getByRole('button', { name: /^Contraintes/ }));
    expect(screen.getByRole('dialog', { name: 'Contraintes' })).toHaveClass('sim-drawer--lg');

    await userEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    await userEvent.click(screen.getByRole('button', { name: /^Opérations prévues/ }));
    expect(screen.getByRole('dialog', { name: 'Opérations prévues' })).toHaveClass(
      'sim-drawer--lg',
    );
  });

  it('rend les contraintes et opérations comme répétables compacts', async () => {
    const { unmount } = renderPage((audit) => {
      audit.contraintes = [
        {
          id: 'contrainte-1',
          label: 'Liquidité disponible',
          priority: 'haute',
          sourceRefIds: [],
        },
      ];
      audit.operationsPrevues = [
        {
          id: 'operation-1',
          label: 'Donation aux enfants',
          status: 'planned',
          sourceRefIds: [],
        },
      ];
    });

    await userEvent.click(screen.getByRole('button', { name: /^Contraintes/ }));
    expect(document.body.querySelectorAll('.audit-repeatable-card')).toHaveLength(1);
    expect(screen.getByText('Contrainte 1')).toBeVisible();

    unmount();
    renderPage((audit) => {
      audit.operationsPrevues = [
        {
          id: 'operation-1',
          label: 'Donation aux enfants',
          status: 'planned',
          sourceRefIds: [],
        },
      ];
    });

    await userEvent.click(screen.getByRole('button', { name: /^Opérations prévues/ }));
    expect(document.body.querySelectorAll('.audit-repeatable-card')).toHaveLength(1);
    expect(screen.getByText('Opération 1')).toBeVisible();
  });
});
