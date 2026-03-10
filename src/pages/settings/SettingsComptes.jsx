import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { DEBUG_AUTH } from '@/supabaseClient';
import { isDebugEnabled } from '@/utils/debugFlags';
import { useUserRole } from '@/auth/useUserRole';
import { UserInfoBanner } from '@/components/UserInfoBanner';
import { invokeAdmin } from '@/services/apiAdmin';
import SettingsSectionCard from '@/components/settings/SettingsSectionCard';
import CabinetEditModal from '@/pages/settings/components/CabinetEditModal';
import ThemeEditModal from '@/pages/settings/components/ThemeEditModal';
import UserInviteModal from '@/pages/settings/components/UserInviteModal';
import './SettingsComptes.css';

export default function SettingsComptes() {
  const { isAdmin, isLoading: authLoading } = useUserRole();
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [userReports, setUserReports] = useState([]);
  const [selectedReportUser, setSelectedReportUser] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const fetchUsersRequestIdRef = useRef(0);
  const DEBUG_COMPTES_REFRESH = isDebugEnabled('comptes');

  // V2: Cabinets & Themes state
  const [cabinets, setCabinets] = useState([]);
  const [themes, setThemes] = useState([]);
  const [cabinetsLoading, setCabinetsLoading] = useState(false);
  const [themesLoading, setThemesLoading] = useState(false);

  const [showCabinetModal, setShowCabinetModal] = useState(false);
  const [editingCabinet, setEditingCabinet] = useState(null);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [editingTheme, setEditingTheme] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  const triggerRefresh = (reason = '') => {
    if (DEBUG_COMPTES_REFRESH) {
      // eslint-disable-next-line no-console
      console.debug('[SettingsComptes] triggerRefresh', reason);
    }
    setRefreshKey((k) => k + 1);
  };

  const fetchUsers = useCallback(async (reason = '') => {
    const requestId = ++fetchUsersRequestIdRef.current;
    try {
      setLoading(true);
      setError('');

      if (DEBUG_COMPTES_REFRESH) {
        // eslint-disable-next-line no-console
        console.debug('[SettingsComptes] fetchUsers:start', { reason, requestId });
      }

      const { data, error: invokeError } = await invokeAdmin('list_users');

      if (requestId !== fetchUsersRequestIdRef.current) return;

      if (invokeError) throw new Error(invokeError.message);
      setUsers(data.users || []);

      if (DEBUG_COMPTES_REFRESH) {
        // eslint-disable-next-line no-console
        console.debug('[SettingsComptes] fetchUsers:success', {
          reason,
          requestId,
          usersCount: (data.users || []).length,
        });
      }

    } catch (err) {
      if (requestId === fetchUsersRequestIdRef.current) {
        setError(err.message);
      }
    } finally {
      if (requestId === fetchUsersRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [DEBUG_COMPTES_REFRESH]);

  // V2: Fetch cabinets
  const fetchCabinets = async () => {
    try {
      setCabinetsLoading(true);
      const { data, error: invokeError } = await invokeAdmin('list_cabinets');
      if (invokeError) throw new Error(invokeError.message);
      setCabinets(data?.cabinets || []);
    } catch (err) {
      console.error('[SettingsComptes] fetchCabinets error:', err);
    } finally {
      setCabinetsLoading(false);
    }
  };

  // V2: Fetch themes
  const fetchThemes = async () => {
    try {
      setThemesLoading(true);
      const { data, error: invokeError } = await invokeAdmin('list_themes');
      if (invokeError) throw new Error(invokeError.message);
      setThemes(data?.themes || []);
    } catch (err) {
      console.error('[SettingsComptes] fetchThemes error:', err);
    } finally {
      setThemesLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) {
      if (DEBUG_AUTH || DEBUG_COMPTES_REFRESH) {
        // eslint-disable-next-line no-console
        console.debug('[SettingsComptes] authLoading → wait');
      }
      return;
    }
    if (!isAdmin) {
      if (DEBUG_AUTH || DEBUG_COMPTES_REFRESH) {
        // eslint-disable-next-line no-console
        console.debug('[SettingsComptes] not admin → skip fetch');
      }
      return;
    }
    fetchUsers('effect');
    fetchCabinets();
    fetchThemes();
  }, [isAdmin, authLoading, location.key, refreshKey, fetchUsers, DEBUG_COMPTES_REFRESH]);

  const openCabinetModal = (cabinet = null) => {
    setEditingCabinet(cabinet);
    setShowCabinetModal(true);
  };

  const closeCabinetModal = () => {
    setShowCabinetModal(false);
    setEditingCabinet(null);
  };

  const handleDeleteCabinet = async (cabinet) => {
    if (!confirm(`Supprimer le cabinet "${cabinet.name}" ?`)) return;
    try {
      setActionLoading(true);
      const { error: invokeError } = await invokeAdmin('delete_cabinet', { id: cabinet.id });
      if (invokeError) throw new Error(invokeError.message);
      fetchCabinets();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openThemeModal = (theme = null) => {
    setEditingTheme(theme);
    setShowThemeModal(true);
  };

  const closeThemeModal = () => {
    setShowThemeModal(false);
    setEditingTheme(null);
  };

  const handleDeleteTheme = async (theme) => {
    if (theme.is_system) {
      setError('Les thèmes système ne peuvent pas être supprimés.');
      return;
    }
    if (!confirm(`Supprimer le thème "${theme.name}" ?`)) return;
    try {
      setActionLoading(true);
      const { error: invokeError } = await invokeAdmin('delete_theme', { id: theme.id });
      if (invokeError) throw new Error(invokeError.message);
      fetchThemes();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // V2: Assign user to cabinet
  const handleAssignUserCabinet = async (userId, cabinetId) => {
    try {
      setActionLoading(true);
      const { error: invokeError } = await invokeAdmin('assign_user_cabinet', {
        user_id: userId,
        cabinet_id: cabinetId || null
      });
      if (invokeError) throw new Error(invokeError.message);
      triggerRefresh('assign_user_cabinet');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const closeUserModal = () => {
    setShowUserModal(false);
  };

  const handleDeleteUser = async (userId, email) => {
    if (!confirm(`Supprimer l'utilisateur ${email} ?`)) return;

    try {
      setActionLoading(true);
      const { error: invokeError } = await invokeAdmin('delete_user', { userId });

      if (invokeError) throw new Error(invokeError.message);
      triggerRefresh('delete_user');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (userId, email) => {
    try {
      setActionLoading(true);
      const { error: invokeError } = await invokeAdmin('reset_password', { 
        userId, 
        email 
      });

      if (invokeError) throw new Error(invokeError.message);
      alert('Email de réinitialisation envoyé');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewReports = async (userId, userEmail) => {
    try {
      setReportLoading(true);
      setSelectedReportUser({ id: userId, email: userEmail });
      setSelectedReport(null);
      setUserReports([]);
      setShowReportModal(true);

      const { data, error: invokeError } = await invokeAdmin('list_issue_reports', { user_id: userId });

      if (invokeError) throw new Error(invokeError.message);
      
      // Gérer les deux formats de réponse possibles
      const reports = data?.reports || data?.data?.reports || [];
      setUserReports(Array.isArray(reports) ? reports : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setReportLoading(false);
    }
  };

  const handleSelectReport = (report) => {
    setSelectedReport(report);
  };

  const handleBackToList = () => {
    setSelectedReport(null);
  };

  const handleCloseModal = () => {
    setShowReportModal(false);
    setSelectedReport(null);
    setUserReports([]);
    setSelectedReportUser(null);
  };

  const handleMarkAsRead = async (reportId) => {
    try {
      const { error: invokeError } = await invokeAdmin('mark_issue_read', { reportId });

      if (invokeError) throw new Error(invokeError.message);
      
      triggerRefresh('mark_issue_read');
      // Rafraîchir la liste des signalements
      if (selectedReportUser) {
        handleViewReports(selectedReportUser.id, selectedReportUser.email);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!confirm('Supprimer définitivement ce signalement ?')) return;

    try {
      const { error: invokeError } = await invokeAdmin('delete_issue', { reportId });

      if (invokeError) throw new Error(invokeError.message);
      
      setSelectedReport(null);
      triggerRefresh('delete_issue');
      // Rafraîchir la liste des signalements
      if (selectedReportUser) {
        handleViewReports(selectedReportUser.id, selectedReportUser.email);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteAllReports = async (userId) => {
    if (!confirm('Supprimer tout l\'historique des signalements pour cet utilisateur ?')) return;

    try {
      const { error: invokeError } = await invokeAdmin('delete_all_issues_for_user', { userId });

      if (invokeError) throw new Error(invokeError.message);
      
      handleCloseModal();
      triggerRefresh('delete_all_issues_for_user');
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ marginTop: 16 }}>
        <p>Vous n'avez pas les droits administrateurs pour accéder à cette page.</p>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div style={{ marginTop: 16 }}>
        <p>Chargement de l'authentification...</p>
      </div>
    );
  }

  const cabinetOptions = cabinets.map((cabinet) => ({
    value: cabinet.id,
    label: cabinet.name,
  }));

  return (
    <div className="settings-comptes" style={{ marginTop: 16 }}>
      {/* Bandeau utilisateur */}
      <UserInfoBanner />

      {error && <div className="alert error">{error}</div>}
      
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div className="admin-content">
            {/* V2: Section Cabinets */}
            <SettingsSectionCard
              title={`Cabinets (${cabinets.length})`}
              subtitle="Gestion des cabinets et de leur thème associé."
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
              actions={
                <button 
                  className="chip"
                  onClick={() => openCabinetModal()}
                  disabled={cabinetsLoading}
                  style={{ padding: '8px 16px', fontWeight: 600 }}
                >
                  + Nouveau cabinet
                </button>
              }
            >
              {cabinetsLoading ? (
                <p>Chargement des cabinets...</p>
              ) : cabinets.length === 0 ? (
                <p style={{ color: 'var(--color-c9)', fontSize: 14 }}>Aucun cabinet créé.</p>
              ) : (
                <div className="admin-cards-grid">
                  {cabinets.map(cabinet => (
                    <div key={cabinet.id} className="admin-card-compact">
                      <div className="admin-card-compact__info">
                        <div className="admin-card-compact__name">{cabinet.name}</div>
                        <div className="admin-card-compact__meta">
                          {cabinet.themes?.name || 'Aucun thème'}
                        </div>
                      </div>
                      <div className="admin-card-compact__actions" style={{ alignItems: 'center' }}>
                        <button 
                          className="icon-btn" 
                          onClick={() => openCabinetModal(cabinet)}
                          title="Modifier"
                          aria-label="Modifier le cabinet"
                          style={{ width: 28, height: 28 }}
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button 
                          className="icon-btn danger" 
                          onClick={() => handleDeleteCabinet(cabinet)}
                          title="Supprimer"
                          aria-label="Supprimer le cabinet"
                          style={{ width: 28, height: 28 }}
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SettingsSectionCard>

            {/* V2: Section Thèmes */}
            <SettingsSectionCard
              title={`Thèmes globaux (${themes.length})`}
              subtitle="Palettes de couleurs appliquées aux cabinets."
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12.5" r="2.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.6 1.6 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>}
              actions={
                <button 
                  className="chip"
                  onClick={() => openThemeModal()}
                  disabled={themesLoading}
                  style={{ padding: '8px 16px', fontWeight: 600 }}
                >
                  + Nouveau thème
                </button>
              }
              style={{ marginTop: 20 }}
            >
              {themesLoading ? (
                <p>Chargement des thèmes...</p>
              ) : themes.length === 0 ? (
                <p style={{ color: 'var(--color-c9)', fontSize: 14 }}>Aucun thème créé.</p>
              ) : (
                <div className="admin-cards-grid">
                  {themes.map(theme => (
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
                      {/* Thème système: Modifier autorisé, Supprimer interdit. Badge SYS dans les actions */}
                      {(!theme.is_system || theme.is_system) && (
                        <div className="admin-card-compact__actions" style={{ alignItems: 'center' }}>
                          {theme.is_system && (
                            <span className="theme-badge-sys" style={{ marginRight: 4 }}>SYS</span>
                          )}
                          <button 
                            className="icon-btn" 
                            onClick={() => openThemeModal(theme)}
                            title="Modifier"
                            aria-label="Modifier le thème"
                            style={{ width: 28, height: 28 }}
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          {/* Supprimer uniquement si NON système */}
                          {!theme.is_system && (
                            <button 
                              className="icon-btn danger" 
                              onClick={() => handleDeleteTheme(theme)}
                              title="Supprimer"
                              aria-label="Supprimer le thème"
                              style={{ width: 28, height: 28 }}
                            >
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SettingsSectionCard>

            {/* Liste des utilisateurs */}
            <SettingsSectionCard
              title={`Utilisateurs (${users.length})`}
              subtitle="Comptes, rôles et affectation aux cabinets."
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
              actions={
                <>
                  <button 
                    className="chip"
                    onClick={() => setShowUserModal(true)}
                    disabled={actionLoading}
                    style={{ padding: '8px 16px', fontWeight: 600 }}
                  >
                    + Nouvel utilisateur
                  </button>
                  <button 
                    className="icon-btn"
                    onClick={() => triggerRefresh('manual')} 
                    disabled={actionLoading}
                    title="Rafraîchir la liste"
                    aria-label="Rafraîchir"
                    style={{ width: 36, height: 36 }}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 4v6h-6" />
                      <path d="M1 20v-6h6" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                  </button>
                </>
              }
              style={{ marginTop: 20 }}
            >
              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Rôle</th>
                      <th>Cabinet</th>
                      <th>Créé le</th>
                      <th>Dernière connexion</th>
                      <th className="col-signalements">Signale-<br/>ments</th>
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
                            onChange={(e) => handleAssignUserCabinet(user.id, e.target.value)}
                            disabled={actionLoading}
                            style={{
                              padding: '6px 10px',
                              border: '1px solid var(--color-c8)',
                              borderRadius: 4,
                              fontSize: 12,
                              cursor: 'pointer',
                              minWidth: 120
                            }}
                          >
                            <option value="">— Aucun —</option>
                            {cabinets.map(cab => (
                              <option key={cab.id} value={cab.id}>{cab.name}</option>
                            ))}
                          </select>
                        </td>
                        <td>{new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
                        <td>
                          {user.last_sign_in_at 
                            ? new Date(user.last_sign_in_at).toLocaleDateString('fr-FR')
                            : 'Jamais'
                          }
                        </td>
                        <td>
                          {user.total_reports > 0 ? (
                            <div 
                              className="report-badge-container"
                              onClick={() => handleViewReports(user.id, user.email)}
                              title={`${user.total_reports} signalement${user.total_reports > 1 ? 's' : ''}${user.unread_reports > 0 ? ` dont ${user.unread_reports} non lu${user.unread_reports > 1 ? 's' : ''}` : ''}`}
                            >
                              <span className={`report-badge ${user.unread_reports > 0 ? 'has-unread' : 'all-read'}`}>
                                {user.total_reports}
                                {user.unread_reports > 0 && (
                                  <span className="unread-dot" />
                                )}
                              </span>
                            </div>
                          ) : (
                            <span className="no-reports">—</span>
                          )}
                        </td>
                        <td className="actionsCell">
                          <div className="actionsContainer">
                            <button 
                              onClick={() => handleResetPassword(user.id, user.email)}
                              title="Envoyer un email de réinitialisation"
                              aria-label="Envoyer un email de réinitialisation"
                            >
                              Réinit.
                            </button>
                            {user.role !== 'admin' && (
                              <button 
                                onClick={() => handleDeleteUser(user.id, user.email)}
                                className="danger"
                                title="Supprimer l'utilisateur"
                                aria-label="Supprimer l'utilisateur"
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
          </div>
        )}

        {showCabinetModal && (
          <CabinetEditModal
            cabinet={editingCabinet}
            themes={themes}
            onClose={closeCabinetModal}
            onSuccess={fetchCabinets}
          />
        )}

        {showThemeModal && (
          <ThemeEditModal
            theme={editingTheme}
            onClose={closeThemeModal}
            onSuccess={fetchThemes}
          />
        )}

        {showUserModal && (
          <UserInviteModal
            cabinetOptions={cabinetOptions}
            cabinetsLoading={cabinetsLoading}
            onClose={closeUserModal}
            onSuccess={() => triggerRefresh('create_user_invite')}
          />
        )}

        {/* Modale de signalements premium */}
        {showReportModal && (
          <div className="report-modal-overlay" onClick={handleCloseModal}>
            <div className="report-modal" onClick={(e) => e.stopPropagation()}>
              {/* Vue Liste */}
              {!selectedReport ? (
                <>
                  <div className="report-modal-header">
                    <div className="report-modal-title-section">
                      <h3>Signalements</h3>
                      {selectedReportUser && (
                        <span className="report-modal-subtitle">{selectedReportUser.email}</span>
                      )}
                    </div>
                    <button className="report-modal-close" onClick={handleCloseModal}>✕</button>
                  </div>

                  <div className="report-modal-content">
                    {reportLoading ? (
                      <div className="report-loading">Chargement des signalements...</div>
                    ) : userReports.length === 0 ? (
                      <div className="report-empty">Aucun signalement pour cet utilisateur.</div>
                    ) : (
                      <table className="reports-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Page</th>
                            <th>Titre</th>
                            <th>Statut</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userReports.map((report) => (
                            <tr key={report.id} className={report.admin_read_at ? 'read' : 'unread'}>
                              <td>{new Date(report.created_at).toLocaleDateString('fr-FR')}</td>
                              <td className="report-page-cell">{report.page || '-'}</td>
                              <td className="report-title-cell">{report.title || 'Sans titre'}</td>
                              <td>
                                <span className={`report-status ${report.admin_read_at ? 'read' : 'unread'}`}>
                                  {report.admin_read_at ? 'Lu' : 'Non lu'}
                                </span>
                              </td>
                              <td>
                                <button 
                                  className="report-view-btn"
                                  onClick={() => handleSelectReport(report)}
                                >
                                  Voir
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="report-modal-actions">
                    {userReports.length > 0 && (
                      <button 
                        className="danger"
                        onClick={() => handleDeleteAllReports(selectedReportUser?.id)}
                      >
                        Supprimer tout l'historique
                      </button>
                    )}
                    <button onClick={handleCloseModal}>Fermer</button>
                  </div>
                </>
              ) : (
                /* Vue Détail */
                <>
                  <div className="report-modal-header">
                    <div className="report-modal-title-section">
                      <button className="report-back-btn" onClick={handleBackToList}>
                        ← Retour
                      </button>
                      <h3>Détail du signalement</h3>
                    </div>
                    <button className="report-modal-close" onClick={handleCloseModal}>✕</button>
                  </div>

                  <div className="report-modal-content">
                    <div className="report-detail-meta">
                      <div className="report-detail-field">
                        <span className="report-detail-label">Date :</span>
                        <span className="report-detail-value">
                          {new Date(selectedReport.created_at).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <div className="report-detail-field">
                        <span className="report-detail-label">Page :</span>
                        <span className="report-detail-value">{selectedReport.page || '-'}</span>
                      </div>
                      <div className="report-detail-field">
                        <span className="report-detail-label">Statut :</span>
                        <span className={`report-status ${selectedReport.admin_read_at ? 'read' : 'unread'}`}>
                          {selectedReport.admin_read_at ? 'Lu' : 'Non lu'}
                        </span>
                      </div>
                    </div>

                    <div className="report-detail-section">
                      <h4>{selectedReport.title || 'Sans titre'}</h4>
                      <div className="report-description-box">
                        {selectedReport.description || 'Aucune description fournie.'}
                      </div>
                    </div>

                    {selectedReport.meta && Object.keys(selectedReport.meta).length > 0 && (
                      <details className="report-detail-metadata">
                        <summary>Informations techniques</summary>
                        <pre>{JSON.stringify(selectedReport.meta, null, 2)}</pre>
                      </details>
                    )}
                  </div>

                  <div className="report-modal-actions">
                    {!selectedReport.admin_read_at && (
                      <button onClick={() => handleMarkAsRead(selectedReport.id)}>
                        Marquer comme lu
                      </button>
                    )}
                    <button 
                      className="danger"
                      onClick={() => handleDeleteReport(selectedReport.id)}
                    >
                      Supprimer
                    </button>
                    <button onClick={handleBackToList}>Retour à la liste</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
