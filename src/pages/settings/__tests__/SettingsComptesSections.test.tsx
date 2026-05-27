// @vitest-environment jsdom
/* eslint-disable ser1-colors/no-hardcoded-colors */

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  SettingsCabinetsSection,
  SettingsThemesSection,
  SettingsUsersSection,
} from '../components/SettingsComptesSections';
import { NO_CABINET_FILTER, type CabinetFilterId } from '../utils/adminUsersDirectory';

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

function renderUsersSection({
  cabinetFilter,
  onAssignUserCabinet = vi.fn(),
  onViewReports = vi.fn(),
  onResetPassword = vi.fn(),
  onDeleteUser = vi.fn(),
}: {
  cabinetFilter?: CabinetFilterId;
  onAssignUserCabinet?: (userId: string, cabinetId: string) => void;
  onViewReports?: (userId: string, email: string) => void;
  onResetPassword?: (userId: string, email: string) => void;
  onDeleteUser?: (userId: string, email: string) => void;
} = {}) {
  return render(
    <SettingsUsersSection
      users={USERS}
      cabinets={CABINETS}
      cabinetFilter={cabinetFilter}
      actionLoading={false}
      onCreateUser={vi.fn()}
      onRefresh={vi.fn()}
      onAssignUserCabinet={onAssignUserCabinet}
      onViewReports={onViewReports}
      onResetPassword={onResetPassword}
      onDeleteUser={onDeleteUser}
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

    await user.type(input, 'client@example.com');

    expect(screen.getByText('1 / 3 utilisateurs')).toBeInTheDocument();
    expect(screen.getByText('client@example.com')).toBeInTheDocument();
    expect(screen.queryByText('florent.bebin@orange.fr')).not.toBeInTheDocument();
  });

  it('combine recherche email et filtre cabinet', async () => {
    const user = userEvent.setup();
    renderUsersSection({ cabinetFilter: 'cabinet-mako' });

    expect(screen.getByText('1 / 3 utilisateurs')).toBeInTheDocument();
    expect(screen.getByText('florent.bebin@orange.fr')).toBeInTheDocument();
    expect(screen.queryByText('client@example.com')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Rechercher par email'), 'client');

    expect(screen.getByText('0 / 3 utilisateurs')).toBeInTheDocument();
    expect(screen.getByText('Aucun utilisateur ne correspond à la recherche.')).toBeInTheDocument();
  });

  it('filtre les utilisateurs sans cabinet', () => {
    renderUsersSection({ cabinetFilter: NO_CABINET_FILTER });

    expect(screen.getByText('1 / 3 utilisateurs')).toBeInTheDocument();
    expect(screen.getByText('sans-cabinet@example.com')).toBeInTheDocument();
    expect(screen.queryByText('client@example.com')).not.toBeInTheDocument();
  });

  it('conserve les handlers reset suppression assignation et signalements', async () => {
    const user = userEvent.setup();
    const onAssignUserCabinet = vi.fn();
    const onViewReports = vi.fn();
    const onResetPassword = vi.fn();
    const onDeleteUser = vi.fn();

    renderUsersSection({
      onAssignUserCabinet,
      onViewReports,
      onResetPassword,
      onDeleteUser,
    });

    await user.selectOptions(screen.getAllByLabelText('Assigner un cabinet')[0], 'cabinet-mako');
    await user.click(
      screen.getAllByRole('button', { name: 'Envoyer un e-mail de réinitialisation' })[0],
    );
    await user.click(screen.getAllByRole('button', { name: "Supprimer l'utilisateur" })[0]);
    await user.click(screen.getByTitle('1 signalement'));

    expect(onAssignUserCabinet).toHaveBeenCalledWith('user-1', 'cabinet-mako');
    expect(onResetPassword).toHaveBeenCalledWith('user-1', 'client@example.com');
    expect(onDeleteUser).toHaveBeenCalledWith('user-1', 'client@example.com');
    expect(onViewReports).toHaveBeenCalledWith('user-2', 'florent.bebin@orange.fr');
  });

  it('ouvre les utilisateurs par défaut et replie cabinets et thèmes', async () => {
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

  it('affiche le thème système Cuivre tranché dans les thèmes globaux', async () => {
    const user = userEvent.setup();

    render(
      <SettingsThemesSection
        themes={[
          {
            id: 'theme-system',
            name: 'Cuivre tranché',
            palette: {
              c1: '#0E1426',
              c2: '#1F3056',
              c3: '#5B73A0',
              c4: '#C6CFE2',
              c5: '#475061',
              c6: '#C2733A',
              c7: '#F2EEE8',
              c8: '#C9CCDA',
              c9: '#424659',
              c10: '#060A18',
            },
            is_system: true,
          },
        ]}
        themesLoading={false}
        onCreateTheme={vi.fn()}
        onEditTheme={vi.fn()}
        onDeleteTheme={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Afficher la section Thèmes globaux (1)' }),
    );

    expect(screen.getByText('Cuivre tranché')).toBeInTheDocument();
    expect(screen.getByText('SYS')).toBeInTheDocument();
    expect(screen.getByTitle('c1: #0E1426')).toBeInTheDocument();
  });
});
