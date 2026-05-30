// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import SettingsModalShell from './SettingsModalShell';

function ControlledModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Ouvrir
      </button>
      {open ? (
        <SettingsModalShell
          title="Paramètres"
          subtitle="Sous-titre"
          onClose={() => setOpen(false)}
          footer={
            <>
              <button type="button" disabled>
                Action indisponible
              </button>
              <button type="button">Enregistrer</button>
            </>
          }
        >
          <label htmlFor="settings-modal-shell-name">Nom</label>
          <input id="settings-modal-shell-name" />
        </SettingsModalShell>
      ) : null}
    </>
  );
}

describe('SettingsModalShell', () => {
  it('expose une modale labellisée avec titre, corps et pied', () => {
    render(
      <SettingsModalShell
        title="Signalements"
        subtitle="client@example.com"
        onClose={vi.fn()}
        footer={<button type="button">Valider</button>}
      >
        <p>Aucun signalement.</p>
      </SettingsModalShell>,
    );

    expect(screen.getByRole('dialog', { name: 'Signalements' })).toHaveAttribute(
      'aria-modal',
      'true',
    );
    expect(screen.getByText('client@example.com')).toBeInTheDocument();
    expect(screen.getByText('Aucun signalement.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Valider' })).toBeInTheDocument();
  });

  it('ferme avec Escape et restitue le focus au déclencheur', async () => {
    const user = userEvent.setup();
    render(<ControlledModal />);

    const trigger = screen.getByRole('button', { name: 'Ouvrir' });
    await user.click(trigger);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Fermer' })).toHaveFocus());

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('garde le focus dans la modale et ignore les actions désactivées', async () => {
    const user = userEvent.setup();
    render(<ControlledModal />);

    await user.click(screen.getByRole('button', { name: 'Ouvrir' }));
    const closeButton = await screen.findByRole('button', { name: 'Fermer' });
    const saveButton = screen.getByRole('button', { name: 'Enregistrer' });

    await waitFor(() => expect(closeButton).toHaveFocus());

    await user.tab({ shift: true });
    expect(saveButton).toHaveFocus();

    await user.tab();
    expect(closeButton).toHaveFocus();
  });
});
