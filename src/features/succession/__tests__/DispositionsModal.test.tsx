// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import DispositionsModal from '../components/DispositionsModal';
import { buildInitialDispositionsDraft } from '../successionSimulator.helpers';

function renderDispositionsModal() {
  const dispositionsDraft = buildInitialDispositionsDraft();

  return render(
    <DispositionsModal
      dispositionsDraft={dispositionsDraft}
      setDispositionsDraft={vi.fn()}
      testamentSides={['epoux1']}
      testamentBeneficiaryOptionsBySide={{ epoux1: [], epoux2: [] }}
      descendantBranchesBySide={{ epoux1: 0, epoux2: 0 }}
      enfantsContext={[]}
      familyMembers={[]}
      assetEntries={[]}
      groupementFoncierEntries={[]}
      assetPocketOptions={[{ value: 'epoux1', label: 'Défunt(e)' }]}
      civilSituation="marie"
      showSharedTransmissionPct
      isPacsIndivision={false}
      showDonationEntreEpoux
      nbDescendantBranches={1}
      nbEnfantsNonCommuns={0}
      isCommunityRegime
      isSocieteAcquetsRegime={false}
      isParticipationAcquetsRegime={false}
      isCommunauteUniverselleRegime={false}
      isCommunauteMeublesAcquetsRegime={false}
      updateDispositionsTestament={vi.fn()}
      getFirstTestamentBeneficiaryRef={() => null}
      onAddParticularLegacy={vi.fn()}
      onUpdateParticularLegacy={vi.fn()}
      onRemoveParticularLegacy={vi.fn()}
      onClose={vi.fn()}
      onValidate={vi.fn()}
    />,
  );
}

describe('DispositionsModal', () => {
  it('structure les dispositions lourdes avec une navigation latérale', async () => {
    const user = userEvent.setup();
    renderDispositionsModal();

    expect(screen.getByRole('button', { name: 'Transmission' }).getAttribute('aria-current')).toBe(
      'step',
    );
    expect(document.querySelector('.sim-modal-section-nav')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Récompenses / créances' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Préciput' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Testament' })).toBeTruthy();
    expect(screen.queryByText('Testament actif')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Testament' }));

    expect(screen.getByRole('button', { name: 'Testament' }).getAttribute('aria-current')).toBe(
      'step',
    );
    expect(screen.getByText('Testament actif')).toBeTruthy();
    expect(screen.queryByLabelText(/Attribution des biens communs/i)).toBeNull();
  });

  it('utilise les boutons de footer modaux partagés', () => {
    renderDispositionsModal();

    expect(screen.getByRole('button', { name: 'Annuler' }).className).toContain(
      'sim-modal-btn--ghost',
    );
    expect(screen.getByRole('button', { name: 'Valider' }).className).toContain(
      'sim-modal-btn--primary',
    );
  });
});
