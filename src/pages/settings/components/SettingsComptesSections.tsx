import React from 'react';
import SettingsSectionCard from '@/components/settings/SettingsSectionCard';
import { SettingsUsersSearchToolbar } from './SettingsUsersSearchToolbar';
import {
  ALL_CABINETS_FILTER,
  filterAdminUsersByDirectory,
  type CabinetFilterId,
} from '../utils/adminUsersDirectory';

interface CabinetSummary {
  id: string;
  name: string;
  themes?: {
    name?: string | null;
  } | null;
}

interface ThemeSummary {
  id: string;
  name: string;
  palette?: Record<string, string> | null;
  is_system?: boolean;
}

interface UserSummary {
  id: string;
  email: string;
  role: string;
  cabinet_id?: string | null;
  created_at: string;
  last_sign_in_at?: string | null;
  total_reports: number;
  unread_reports: number;
}

const USER_DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
});

function formatUserDate(value: string): string {
  return USER_DATE_FORMATTER.format(new Date(value));
}

function CabinetsIcon(): React.ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function ThemesIcon(): React.ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="13.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="10.5" r="2.5" />
      <circle cx="8.5" cy="7.5" r="2.5" />
      <circle cx="6.5" cy="12.5" r="2.5" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.6 1.6 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

function UsersIcon(): React.ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function EditIcon(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function DeleteIcon(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function RefreshIcon(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

interface SettingsCabinetsSectionProps {
  cabinets: CabinetSummary[];
  cabinetsLoading: boolean;
  onCreateCabinet: () => void;
  onEditCabinet: (cabinet: CabinetSummary) => void;
  onDeleteCabinet: (cabinet: CabinetSummary) => void;
}

export function SettingsCabinetsSection({
  cabinets,
  cabinetsLoading,
  onCreateCabinet,
  onEditCabinet,
  onDeleteCabinet,
}: SettingsCabinetsSectionProps): React.ReactElement {
  return (
    <SettingsSectionCard
      title={`Cabinets (${cabinets.length})`}
      subtitle="Gestion des cabinets et de leur thème associé."
      icon={<CabinetsIcon />}
      collapsible
      defaultOpen={false}
      actions={
        <button
          className="chip admin-section-chip"
          onClick={onCreateCabinet}
          disabled={cabinetsLoading}
          type="button"
        >
          + Nouveau cabinet
        </button>
      }
    >
      {cabinetsLoading ? (
        <p>Chargement des cabinets...</p>
      ) : cabinets.length === 0 ? (
        <p className="admin-section-empty">Aucun cabinet créé.</p>
      ) : (
        <div className="admin-cards-grid">
          {cabinets.map((cabinet) => (
            <div key={cabinet.id} className="admin-card-compact">
              <div className="admin-card-compact__info">
                <div className="admin-card-compact__name">{cabinet.name}</div>
                <div className="admin-card-compact__meta">
                  {cabinet.themes?.name || 'Aucun thème'}
                </div>
              </div>
              <div className="admin-card-compact__actions">
                <button
                  className="icon-btn admin-card-compact__action-btn--sm"
                  onClick={() => onEditCabinet(cabinet)}
                  title="Modifier"
                  aria-label="Modifier le cabinet"
                  type="button"
                >
                  <EditIcon />
                </button>
                <button
                  className="icon-btn danger admin-card-compact__action-btn--sm"
                  onClick={() => onDeleteCabinet(cabinet)}
                  title="Supprimer"
                  aria-label="Supprimer le cabinet"
                  type="button"
                >
                  <DeleteIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </SettingsSectionCard>
  );
}

interface SettingsThemesSectionProps {
  themes: ThemeSummary[];
  themesLoading: boolean;
  onCreateTheme: () => void;
  onEditTheme: (theme: ThemeSummary) => void;
  onDeleteTheme: (theme: ThemeSummary) => void;
}

export function SettingsThemesSection({
  themes,
  themesLoading,
  onCreateTheme,
  onEditTheme,
  onDeleteTheme,
}: SettingsThemesSectionProps): React.ReactElement {
  return (
    <div className="settings-section-card--mt">
      <SettingsSectionCard
        title={`Thèmes globaux (${themes.length})`}
        subtitle="Palettes de couleurs appliquées aux cabinets."
        icon={<ThemesIcon />}
        collapsible
        defaultOpen={false}
        actions={
          <button
            className="chip admin-section-chip"
            onClick={onCreateTheme}
            disabled={themesLoading}
            type="button"
          >
            + Nouveau thème
          </button>
        }
      >
        {themesLoading ? (
          <p>Chargement des thèmes...</p>
        ) : themes.length === 0 ? (
          <p className="admin-section-empty">Aucun thème créé.</p>
        ) : (
          <div className="admin-cards-grid">
            {themes.map((theme) => (
              <div key={theme.id} className="admin-card-compact">
                <div className="admin-card-compact__info">
                  <div className="admin-card-compact__name admin-card-compact__name--flex">
                    {theme.name}
                  </div>
                  <div className="admin-card-compact__palette">
                    {theme.palette &&
                      Object.entries(theme.palette)
                        .slice(0, 6)
                        .map(([key, color]) => (
                          <div
                            key={key}
                            className="admin-card-compact__palette-color"
                            style={{ backgroundColor: color }}
                            title={`${key}: ${color}`}
                          />
                        ))}
                  </div>
                </div>
                <div className="admin-card-compact__actions">
                  {theme.is_system && (
                    <span className="theme-badge-sys theme-badge-sys--mr">SYS</span>
                  )}
                  <button
                    className="icon-btn admin-card-compact__action-btn--sm"
                    onClick={() => onEditTheme(theme)}
                    title="Modifier"
                    aria-label="Modifier le thème"
                    type="button"
                  >
                    <EditIcon />
                  </button>
                  {!theme.is_system && (
                    <button
                      className="icon-btn danger admin-card-compact__action-btn--sm"
                      onClick={() => onDeleteTheme(theme)}
                      title="Supprimer"
                      aria-label="Supprimer le thème"
                      type="button"
                    >
                      <DeleteIcon />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SettingsSectionCard>
    </div>
  );
}

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
