import React from 'react';
import SettingsSectionCard from '@/components/settings/SettingsSectionCard';

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

function CabinetsIcon(): React.ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function ThemesIcon(): React.ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function EditIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function DeleteIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function RefreshIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

const actionButtonStyle = { width: 28, height: 28 };
const chipStyle = { padding: '8px 16px', fontWeight: 600 };
const emptyTextStyle = { color: 'var(--color-c9)', fontSize: 14 };

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
      subtitle="Gestion des cabinets et de leur theme associe."
      icon={<CabinetsIcon />}
      actions={(
        <button className="chip" onClick={onCreateCabinet} disabled={cabinetsLoading} style={chipStyle} type="button">
          + Nouveau cabinet
        </button>
      )}
    >
      {cabinetsLoading ? (
        <p>Chargement des cabinets...</p>
      ) : cabinets.length === 0 ? (
        <p style={emptyTextStyle}>Aucun cabinet cree.</p>
      ) : (
        <div className="admin-cards-grid">
          {cabinets.map((cabinet) => (
            <div key={cabinet.id} className="admin-card-compact">
              <div className="admin-card-compact__info">
                <div className="admin-card-compact__name">{cabinet.name}</div>
                <div className="admin-card-compact__meta">
                  {cabinet.themes?.name || 'Aucun theme'}
                </div>
              </div>
              <div className="admin-card-compact__actions" style={{ alignItems: 'center' }}>
                <button
                  className="icon-btn"
                  onClick={() => onEditCabinet(cabinet)}
                  title="Modifier"
                  aria-label="Modifier le cabinet"
                  style={actionButtonStyle}
                  type="button"
                >
                  <EditIcon />
                </button>
                <button
                  className="icon-btn danger"
                  onClick={() => onDeleteCabinet(cabinet)}
                  title="Supprimer"
                  aria-label="Supprimer le cabinet"
                  style={actionButtonStyle}
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
    <SettingsSectionCard
      title={`Themes globaux (${themes.length})`}
      subtitle="Palettes de couleurs appliquees aux cabinets."
      icon={<ThemesIcon />}
      actions={(
        <button className="chip" onClick={onCreateTheme} disabled={themesLoading} style={chipStyle} type="button">
          + Nouveau theme
        </button>
      )}
      style={{ marginTop: 20 }}
    >
      {themesLoading ? (
        <p>Chargement des themes...</p>
      ) : themes.length === 0 ? (
        <p style={emptyTextStyle}>Aucun theme cree.</p>
      ) : (
        <div className="admin-cards-grid">
          {themes.map((theme) => (
            <div key={theme.id} className="admin-card-compact">
              <div className="admin-card-compact__info">
                <div className="admin-card-compact__name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {theme.name}
                </div>
                <div className="admin-card-compact__palette">
                  {theme.palette && Object.entries(theme.palette).slice(0, 6).map(([key, color]) => (
                    <div
                      key={key}
                      className="admin-card-compact__palette-color"
                      style={{ backgroundColor: color }}
                      title={`${key}: ${color}`}
                    />
                  ))}
                </div>
              </div>
              <div className="admin-card-compact__actions" style={{ alignItems: 'center' }}>
                {theme.is_system && (
                  <span className="theme-badge-sys" style={{ marginRight: 4 }}>SYS</span>
                )}
                <button
                  className="icon-btn"
                  onClick={() => onEditTheme(theme)}
                  title="Modifier"
                  aria-label="Modifier le theme"
                  style={actionButtonStyle}
                  type="button"
                >
                  <EditIcon />
                </button>
                {!theme.is_system && (
                  <button
                    className="icon-btn danger"
                    onClick={() => onDeleteTheme(theme)}
                    title="Supprimer"
                    aria-label="Supprimer le theme"
                    style={actionButtonStyle}
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
  );
}

interface SettingsUsersSectionProps {
  users: UserSummary[];
  cabinets: CabinetSummary[];
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
  actionLoading,
  onCreateUser,
  onRefresh,
  onAssignUserCabinet,
  onViewReports,
  onResetPassword,
  onDeleteUser,
}: SettingsUsersSectionProps): React.ReactElement {
  return (
    <SettingsSectionCard
      title={`Utilisateurs (${users.length})`}
      subtitle="Comptes, roles et affectation aux cabinets."
      icon={<UsersIcon />}
      actions={(
        <>
          <button className="chip" onClick={onCreateUser} disabled={actionLoading} style={chipStyle} type="button">
            + Nouvel utilisateur
          </button>
          <button
            className="icon-btn"
            onClick={onRefresh}
            disabled={actionLoading}
            title="Rafraichir la liste"
            aria-label="Rafraichir"
            style={{ width: 36, height: 36 }}
            type="button"
          >
            <RefreshIcon />
          </button>
        </>
      )}
      style={{ marginTop: 20 }}
    >
      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Cabinet</th>
              <th>Cree le</th>
              <th>Derniere connexion</th>
              <th className="col-signalements">Signale-<br />ments</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <select
                    value={user.cabinet_id || ''}
                    onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                      onAssignUserCabinet(user.id, event.target.value);
                    }}
                    disabled={actionLoading}
                    style={{
                      padding: '6px 10px',
                      border: '1px solid var(--color-c8)',
                      borderRadius: 4,
                      fontSize: 12,
                      cursor: 'pointer',
                      minWidth: 120,
                    }}
                  >
                    <option value="">- Aucun -</option>
                    {cabinets.map((cabinet) => (
                      <option key={cabinet.id} value={cabinet.id}>{cabinet.name}</option>
                    ))}
                  </select>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
                <td>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('fr-FR') : 'Jamais'}</td>
                <td>
                  {user.total_reports > 0 ? (
                    <div
                      className="report-badge-container"
                      onClick={() => onViewReports(user.id, user.email)}
                      title={`${user.total_reports} signalement${user.total_reports > 1 ? 's' : ''}${user.unread_reports > 0 ? ` dont ${user.unread_reports} non lu${user.unread_reports > 1 ? 's' : ''}` : ''}`}
                    >
                      <span className={`report-badge ${user.unread_reports > 0 ? 'has-unread' : 'all-read'}`}>
                        {user.total_reports}
                        {user.unread_reports > 0 && <span className="unread-dot" />}
                      </span>
                    </div>
                  ) : (
                    <span className="no-reports">-</span>
                  )}
                </td>
                <td className="actionsCell">
                  <div className="actionsContainer">
                    <button
                      onClick={() => onResetPassword(user.id, user.email)}
                      title="Envoyer un email de reinitialisation"
                      aria-label="Envoyer un email de reinitialisation"
                      type="button"
                    >
                      Reinit.
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
            ))}
          </tbody>
        </table>
      </div>
    </SettingsSectionCard>
  );
}
