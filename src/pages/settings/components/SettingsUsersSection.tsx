import React from 'react';
import SettingsSectionCard from '@/components/settings/SettingsSectionCard';
import { SettingsUsersSearchToolbar } from './SettingsUsersSearchToolbar';
import {
  ALL_CABINETS_FILTER,
  filterAdminUsersByDirectory,
  type CabinetFilterId,
} from '../utils/adminUsersDirectory';
import type { CabinetSummary, UserSummary } from './SettingsComptesSections.types';
import { RefreshIcon, UsersIcon } from './SettingsComptesIcons';
import { formatUserDate } from './SettingsComptesSections.utils';

interface SettingsUsersSectionProps {
  users: UserSummary[];
  cabinets: CabinetSummary[];
  cabinetFilter?: CabinetFilterId;
  actionLoading: boolean;
  onCreateUser: () => void;
  onRefresh: () => void;
  onAssignUserCabinet: (userId: string, cabinetId: string) => void;
  onViewReports: (userId: string, email: string) => void;
  onResetPassword: (userId: string, email: string) => void;
  onDeleteUser: (userId: string, email: string) => void;
}

export function SettingsUsersSection({
  users,
  cabinets,
  cabinetFilter = ALL_CABINETS_FILTER,
  actionLoading,
  onCreateUser,
  onRefresh,
  onAssignUserCabinet,
  onViewReports,
  onResetPassword,
  onDeleteUser,
}: SettingsUsersSectionProps): React.ReactElement {
  const [searchEmail, setSearchEmail] = React.useState('');
  const filteredUsers = React.useMemo(() => {
    return filterAdminUsersByDirectory(users, { searchEmail, cabinetFilter });
  }, [cabinetFilter, searchEmail, users]);

  return (
    <div className="settings-section-card--mt">
      <SettingsSectionCard
        title={`Utilisateurs (${users.length})`}
        subtitle="Comptes, rôles et affectation aux cabinets."
        icon={<UsersIcon />}
        collapsible
        defaultOpen
        actions={
          <>
            <button
              className="chip admin-section-chip"
              onClick={onCreateUser}
              disabled={actionLoading}
              type="button"
            >
              + Nouvel utilisateur
            </button>
            <button
              className="icon-btn admin-refresh-btn"
              onClick={onRefresh}
              disabled={actionLoading}
              title="Rafraîchir la liste"
              aria-label="Rafraîchir"
              type="button"
            >
              <RefreshIcon />
            </button>
          </>
        }
      >
        <SettingsUsersSearchToolbar
          searchEmail={searchEmail}
          visibleCount={filteredUsers.length}
          totalCount={users.length}
          onSearchEmailChange={setSearchEmail}
        />
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th className="col-email">Email</th>
                <th>Rôle</th>
                <th>Cabinet</th>
                <th className="col-date">Créé le</th>
                <th className="col-last-login">
                  Dernière
                  <br />
                  connexion
                </th>
                <th className="col-signalements">
                  Signale-
                  <br />
                  ments
                </th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="users-table-empty">
                    Aucun utilisateur ne correspond à la recherche.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="col-email">{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>{user.role}</span>
                    </td>
                    <td>
                      <select
                        value={user.cabinet_id || ''}
                        onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                          onAssignUserCabinet(user.id, event.target.value);
                        }}
                        disabled={actionLoading}
                        aria-label="Assigner un cabinet"
                      >
                        <option value="">- Aucun -</option>
                        {cabinets.map((cabinet) => (
                          <option key={cabinet.id} value={cabinet.id}>
                            {cabinet.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="col-date">{formatUserDate(user.created_at)}</td>
                    <td className="col-last-login">
                      {user.last_sign_in_at ? formatUserDate(user.last_sign_in_at) : 'Jamais'}
                    </td>
                    <td>
                      {user.total_reports > 0 ? (
                        <button
                          type="button"
                          className="report-badge-container"
                          onClick={() => onViewReports(user.id, user.email)}
                          title={`${user.total_reports} signalement${user.total_reports > 1 ? 's' : ''}${user.unread_reports > 0 ? ` dont ${user.unread_reports} non lu${user.unread_reports > 1 ? 's' : ''}` : ''}`}
                        >
                          <span
                            className={`report-badge ${user.unread_reports > 0 ? 'has-unread' : 'all-read'}`}
                          >
                            {user.total_reports}
                            {user.unread_reports > 0 && <span className="unread-dot" />}
                          </span>
                        </button>
                      ) : (
                        <span className="no-reports">-</span>
                      )}
                    </td>
                    <td className="actionsCell">
                      <div className="actionsContainer">
                        <button
                          onClick={() => onResetPassword(user.id, user.email)}
                          title="Envoyer un e-mail de réinitialisation"
                          aria-label="Envoyer un e-mail de réinitialisation"
                          type="button"
                        >
                          Réinit.
                        </button>
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => onDeleteUser(user.id, user.email)}
                            className="danger"
                            title="Supprimer l'utilisateur"
                            aria-label="Supprimer l'utilisateur"
                            type="button"
                          >
                            Suppr.
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SettingsSectionCard>
    </div>
  );
}
