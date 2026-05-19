// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  SettingsCabinetsSection,
  SettingsThemesSection,
  SettingsUsersSection,
} from '../components/SettingsComptesSections';

const CABINETS = [
  { id: 'cabinet-laplace', name: 'Laplace', themes: { name: 'Thème Laplace' } },
  { id: 'cabinet-mako', name: 'MAKO', themes: null },
];

const USERS = [
  {
    id: 'user-1',
    email: 'client@example.com',
    role: 'user',
    cabinet_id: 'cabinet-laplace',
    created_at: '2026-01-01T00:00:00.000Z',
    last_sign_in_at: '2026-01-02T00:00:00.000Z',
    total_reports: 0,
    unread_reports: 0,
  },
  {
    id: 'user-2',
    email: 'florent.bebin@orange.fr',
    role: 'admin',
    cabinet_id: 'cabinet-mako',
    created_at: '2026-01-03T00:00:00.000Z',
    last_sign_in_at: '2026-01-04T00:00:00.000Z',
    total_reports: 1,
    unread_reports: 0,
  },
  {
    id: 'user-3',
    email: 'sans-cabinet@example.com',
    role: 'user',
    cabinet_id: null,
    created_at: '2026-01-05T00:00:00.000Z',
    last_sign_in_at: null,
    total_reports: 0,
    unread_reports: 0,
  },
];

function renderUsersSection() {
  return render(
    <SettingsUsersSection
      users={USERS}
      cabinets={CABINETS}
      actionLoading={false}
      onCreateUser={vi.fn()}
      onRefresh={vi.fn()}
      onAssignUserCabinet={vi.fn()}
      onViewReports={vi.fn()}
      onResetPassword={vi.fn()}
      onDeleteUser={vi.fn()}
    />,
  );
}

describe('SettingsComptesSections', () => {
  it('filtre les utilisateurs par email sans bouton de recherche', async () => {
    const user = userEvent.setup();
    renderUsersSection();

    const input = screen.getByLabelText('Rechercher par email');
    expect(screen.getByText('3 / 3 utilisateurs')).toBeInTheDocument();

    await user.type(input, 'orange');

    expect(screen.getByText('1 / 3 utilisateurs')).toBeInTheDocument();
    expect(screen.getByText('florent.bebin@orange.fr')).toBeInTheDocument();
    expect(screen.queryByText('client@example.com')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Effacer la recherche email' }));

    expect(screen.getByText('3 / 3 utilisateurs')).toBeInTheDocument();
    expect(screen.getByText('client@example.com')).toBeInTheDocument();
  });

  it('ouvre les utilisateurs par defaut et replie cabinets et themes', async () => {
    const user = userEvent.setup();

    render(
      <>
        <SettingsCabinetsSection
          cabinets={CABINETS}
          cabinetsLoading={false}
          onCreateCabinet={vi.fn()}
          onEditCabinet={vi.fn()}
          onDeleteCabinet={vi.fn()}
        />
        <SettingsThemesSection
          themes={[{ id: 'theme-1', name: 'Thème SER1', palette: null, is_system: false }]}
          themesLoading={false}
          onCreateTheme={vi.fn()}
          onEditTheme={vi.fn()}
          onDeleteTheme={vi.fn()}
        />
        <SettingsUsersSection
          users={USERS}
          cabinets={CABINETS}
          actionLoading={false}
          onCreateUser={vi.fn()}
          onRefresh={vi.fn()}
          onAssignUserCabinet={vi.fn()}
          onViewReports={vi.fn()}
          onResetPassword={vi.fn()}
          onDeleteUser={vi.fn()}
        />
      </>,
    );

    expect(screen.getByText('client@example.com')).toBeInTheDocument();
    expect(screen.queryByText('Thème Laplace')).not.toBeInTheDocument();
    expect(screen.queryByText('Thème SER1')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Afficher la section Cabinets (2)' }));
    await user.click(
      screen.getByRole('button', { name: 'Afficher la section Thèmes globaux (1)' }),
    );

    expect(screen.getByText('Thème Laplace')).toBeInTheDocument();
    expect(screen.getByText('Thème SER1')).toBeInTheDocument();
  });
});
