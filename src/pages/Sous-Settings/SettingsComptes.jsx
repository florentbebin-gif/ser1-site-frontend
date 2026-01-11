<<<<<<< Updated upstream
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase, DEBUG_AUTH } from '../../supabaseClient';
import SettingsNav from '../SettingsNav';
import { useUserRole } from '../../auth/useUserRole';
import './SettingsComptes.css';

export default function SettingsComptes() {
  const { isAdmin, isLoading: authLoading } = useUserRole();
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const fetchUsersRequestIdRef = useRef(0);
  const DEBUG_COMPTES_REFRESH = false;

  useEffect(() => {
    if (authLoading) {
      if (DEBUG_AUTH || DEBUG_COMPTES_REFRESH) console.log('[SettingsComptes] authLoading → wait');
      return;
    }
    if (!isAdmin) {
      if (DEBUG_AUTH || DEBUG_COMPTES_REFRESH) console.log('[SettingsComptes] not admin → skip fetch');
      return;
    }
    fetchUsers('effect');
  }, [isAdmin, authLoading, location.key, refreshKey]);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const getSessionWithRetry = async (maxAttempts = 3, delayMs = 200) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) return session;
      if (attempt < maxAttempts) await sleep(delayMs);
    }
    return null;
  };

  const triggerRefresh = (reason = '') => {
    if (DEBUG_COMPTES_REFRESH) {
      console.log('[SettingsComptes] triggerRefresh', reason);
    }
    setRefreshKey((k) => k + 1);
  };

  const fetchUsers = async (reason = '') => {
    const requestId = ++fetchUsersRequestIdRef.current;
    try {
      setLoading(true);
      setError('');

      if (DEBUG_COMPTES_REFRESH) {
        console.log('[SettingsComptes] fetchUsers:start', { reason, requestId });
      }

      const session = await getSessionWithRetry();
      if (!session) throw new Error('Non authentifié');

      const { data, error: invokeError } = await supabase.functions.invoke('admin', {
        body: { action: 'list_users' },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (requestId !== fetchUsersRequestIdRef.current) return;

      if (invokeError) throw new Error(invokeError.message);
      setUsers(data.users || []);

      if (DEBUG_COMPTES_REFRESH) {
        console.log('[SettingsComptes] fetchUsers:success', {
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
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserEmail.trim()) return;

    try {
      setActionLoading(true);
      const session = await getSessionWithRetry();
      if (!session) throw new Error('Non authentifié');
      
      const { error: invokeError } = await supabase.functions.invoke('admin', {
        body: { 
          action: 'create_user_invite',
          email: newUserEmail.trim()
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (invokeError) throw new Error(invokeError.message);
      
      setNewUserEmail('');
      triggerRefresh('create_user_invite');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!confirm(`Supprimer l'utilisateur ${email} ?`)) return;

    try {
      setActionLoading(true);
      const session = await getSessionWithRetry();
      if (!session) throw new Error('Non authentifié');
      
      const { error: invokeError } = await supabase.functions.invoke('admin', {
        body: { action: 'delete_user', userId },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

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
      const session = await getSessionWithRetry();
      if (!session) throw new Error('Non authentifié');
      
      const { error: invokeError } = await supabase.functions.invoke('admin', {
        body: { 
          action: 'reset_password',
          userId,
          email
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (invokeError) throw new Error(invokeError.message);
      alert('Email de réinitialisation envoyé');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewReports = async (userId) => {
    try {
      const session = await getSessionWithRetry();
      if (!session) throw new Error('Non authentifié');
      
      const { data, error: invokeError } = await supabase.functions.invoke('admin', {
        body: { action: 'get_latest_issue_for_user', userId },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (invokeError) throw new Error(invokeError.message);
      
      setSelectedReport(data.report);
      setShowReportModal(true);
    } catch (err) {
      setError(err.message);
    }
  };
=======
import React, { useEffect, useState, useCallback } from 'react';
import './SettingsComptes.css';
import { useAuth, useUserRole } from '../../auth';
import { callAdmin } from '../../services/supabaseApi';
import { UserInfoBanner } from '../../components/UserInfoBanner';

export default function SettingsComptes() {
  const { authReady, isAdmin, user } = useAuth();

  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportUser, setSelectedReportUser] = useState(null);
  const [userReports, setUserReports] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  const loadUsers = useCallback(async () => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    try {
      const data = await callAdmin('list_users');
      if (cancelled) return;
      const list = data?.users || data?.data?.users || [];
      setUsers(Array.isArray(list) ? list : []);
    } catch (e) {
      if (cancelled) return;
      setError(e?.message || 'Erreur lors du chargement des utilisateurs.');
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    loadUsers();
  }, [authReady, isAdmin, loadUsers]);

  const handleRefresh = useCallback(() => {
    if (!isAdmin) return;
    loadUsers();
  }, [isAdmin, loadUsers]);

  const handleInviteUser = useCallback(async () => {
    if (!email) return;
    setError(null);
    try {
      await callAdmin('invite_user', { email });
      setEmail('');
      loadUsers();
    } catch (e) {
      setError(e?.message || 'Erreur lors de la création.');
    }
  }, [email, loadUsers]);

  const handleUpdateRole = useCallback(async (userId, role) => {
    setError(null);
    try {
      await callAdmin('update_user_role', { user_id: userId, role });
      loadUsers();
    } catch (e) {
      setError(e?.message || 'Erreur lors de la mise à jour du rôle.');
    }
  }, [loadUsers]);

  const handleDeleteUser = useCallback(async (userId) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    setError(null);
    try {
      await callAdmin('delete_user', { user_id: userId });
      loadUsers();
    } catch (e) {
      setError(e?.message || 'Erreur lors de la suppression.');
    }
  }, [loadUsers]);

  const handleResetPassword = useCallback(async (userId) => {
    setError(null);
    try {
      await callAdmin('reset_password', { user_id: userId });
      alert('Email de reset envoyé.');
    } catch (e) {
      setError(e?.message || 'Erreur lors du reset mot de passe.');
    }
  }, []);

  const handleViewReports = useCallback(async (u) => {
    setSelectedReportUser(u);
    setShowReportModal(true);
    setReportLoading(true);
    setReportError(null);
    setUserReports([]);
    let cancelled = false;
    try {
      const data = await callAdmin('list_issue_reports', { user_id: u.id });
      if (cancelled) return;
      console.log('Reports data:', data); // Debug log
      const reports = Array.isArray(data?.reports) ? data.reports : [];
      setUserReports(reports);
    } catch (e) {
      if (cancelled) return;
      console.error('Error loading reports:', e); // Debug log
      setReportError(e?.message || 'Erreur lors du chargement des signalements.');
    } finally {
      if (!cancelled) {
        setReportLoading(false);
      }
    }
  }, []);

  const handleMarkAsRead = useCallback(async (reportId) => {
    setReportError(null);
    try {
      const result = await callAdmin('mark_issue_report_read', { report_id: reportId });
      console.log('Mark as read result:', result);
      if (selectedReportUser) {
        await handleViewReports(selectedReportUser);
        loadUsers();
      }
    } catch (e) {
      console.error('Error marking as read:', e);
      setReportError(e?.message || 'Erreur lors de la mise à jour.');
    }
  }, [handleViewReports, loadUsers, selectedReportUser]);

  const handleMarkAsUnread = useCallback(async (reportId) => {
    setReportError(null);
    try {
      // Appel à une nouvelle fonction admin pour marquer comme non lu
      const result = await callAdmin('mark_issue_report_unread', { report_id: reportId });
      console.log('Mark as unread result:', result);
      if (selectedReportUser) {
        await handleViewReports(selectedReportUser);
        loadUsers();
      }
    } catch (e) {
      console.error('Error marking as unread:', e);
      setReportError(e?.message || 'Erreur lors de la mise à jour.');
    }
  }, [handleViewReports, loadUsers, selectedReportUser]);

  const handleDeleteReport = useCallback(async (reportId) => {
    if (!confirm('Supprimer ce signalement ?')) return;
    setReportError(null);
    try {
      await callAdmin('delete_issue_report', { report_id: reportId });
      if (selectedReportUser) {
        await handleViewReports(selectedReportUser);
        loadUsers();
      }
    } catch (e) {
      setReportError(e?.message || 'Erreur lors de la suppression.');
    }
  }, [handleViewReports, loadUsers, selectedReportUser]);

  const handleDeleteAllReports = useCallback(async () => {
    if (!selectedReportUser) return;
    if (!confirm('Supprimer TOUS les signalements de cet utilisateur ?')) return;
    setReportError(null);
    try {
      await callAdmin('delete_all_issue_reports', { user_id: selectedReportUser.id });
      if (selectedReportUser) {
        await handleViewReports(selectedReportUser);
        loadUsers();
      }
    } catch (e) {
      setReportError(e?.message || 'Erreur lors de la suppression.');
    }
  }, [handleViewReports, loadUsers, selectedReportUser]);

  const handleViewReportDetails = useCallback((report) => {
    setSelectedReport(report);
  }, []);

  const handleCloseReportDetails = useCallback(() => {
    setSelectedReport(null);
  }, []);

  const isInitialLoading = loading && users.length === 0;
  const totalUnreadReports = users.reduce((sum, u) => sum + (u.unread_reports || 0), 0);
>>>>>>> Stashed changes

  const handleMarkAsRead = async (reportId) => {
    try {
      const session = await getSessionWithRetry();
      if (!session) throw new Error('Non authentifié');
      
      const { error: invokeError } = await supabase.functions.invoke('admin', {
        body: { 
          action: 'mark_issue_read',
          reportId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (invokeError) throw new Error(invokeError.message);
      
      triggerRefresh('mark_issue_read');
      setShowReportModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!confirm('Supprimer définitivement ce signalement ?')) return;

    try {
      const session = await getSessionWithRetry();
      if (!session) throw new Error('Non authentifié');
      
      const { error: invokeError } = await supabase.functions.invoke('admin', {
        body: { 
          action: 'delete_issue',
          reportId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (invokeError) throw new Error(invokeError.message);
      
      setShowReportModal(false);
      triggerRefresh('delete_issue');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteAllReports = async (userId) => {
    if (!confirm('Supprimer tout l\'historique des signalements pour cet utilisateur ?')) return;

    try {
      const session = await getSessionWithRetry();
      if (!session) throw new Error('Non authentifié');
      
      const { error: invokeError } = await supabase.functions.invoke('admin', {
        body: { 
          action: 'delete_all_issues_for_user',
          userId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (invokeError) throw new Error(invokeError.message);
      
      setShowReportModal(false);
      triggerRefresh('delete_all_issues_for_user');
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="settings-page">
        <div className="section-card">
          <div className="section-title">Accès refusé</div>
          <p>Vous n'avez pas les droits administrateurs pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="settings-page">
        <div className="section-card">
          <div className="section-title">Comptes</div>
          <SettingsNav />
          <p>Chargement de l'authentification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="section-card">
        <div className="section-title">Comptes</div>
        <SettingsNav />

<<<<<<< Updated upstream
        {error && <div className="alert error">{error}</div>}
        
        {loading ? (
          <p>Chargement...</p>
        ) : (
          <div className="admin-content">
            {/* Créer un utilisateur */}
            <div className="admin-section">
              <h3>Créer un utilisateur</h3>
              <form onSubmit={handleCreateUser} className="admin-form">
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="Email de l'utilisateur"
                  required
                />
                <button type="submit" disabled={actionLoading}>
                  {actionLoading ? 'Envoi...' : 'Inviter'}
=======
      {/* Bandeau utilisateur */}
      <UserInfoBanner />

      {error && (
        <div className="error" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>{error}</span>
          <button onClick={handleRefresh} disabled={loading}>
            Réessayer
          </button>
        </div>
      )}

      <div className="invite-section">
        <h3>Créer un utilisateur</h3>
        <div className="invite-form">
          <input
            type="email"
            placeholder="Email de l'utilisateur"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ backgroundColor: '#FFFFFF' }}
          />
          <button onClick={handleInviteUser} disabled={loading}>Inviter</button>
        </div>
        <div className="ir-disclaimer">
          <strong>Conformité RGPD</strong>
          <p>
            Pas de prospection, Article 6(1)(f) RGPD : Le traitement est nécessaire aux fins des intérêts légitimes poursuivis par le responsable du traitement.
          </p>
        </div>
      </div>

      {isInitialLoading ? (
        <div className="loading-admin">Chargement admin (SettingsComptes)…</div>
      ) : (
        <>
          {loading && users.length > 0 && (
            <div className="loading-admin" style={{ marginBottom: 8 }}>
              Mise à jour…
            </div>
          )}
          <div className="users-section">
            <div className="users-header">
              <h3>Utilisateurs ({users.length})</h3>
              <div className="users-actions">
                <span className="reports-badge" title="Signalements non lus">
                  Signalements non lus : {totalUnreadReports}
                </span>
                <button onClick={handleRefresh} disabled={loading}>
                  {loading ? 'Chargement…' : 'Rafraîchir'}
>>>>>>> Stashed changes
                </button>
              </form>
            </div>

            {/* Liste des utilisateurs */}
            <div className="admin-section">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3>Utilisateurs ({users.length})</h3>
                <div className="actions">
                  <button onClick={() => triggerRefresh('manual')} disabled={actionLoading}>
                    Rafraîchir
                  </button>
                </div>
              </div>
              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Rôle</th>
                      <th>Créé le</th>
                      <th>Dernière connexion</th>
                      <th>Signalements</th>
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
                        <td>{new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
                        <td>
                          {user.last_sign_in_at 
                            ? new Date(user.last_sign_in_at).toLocaleDateString('fr-FR')
                            : 'Jamais'
                          }
                        </td>
                        <td>
                          {user.total_reports > 0 && (
                            <span 
                              className={`report-badge ${user.unread_reports === 0 ? 'read' : ''}`}
                              onClick={() => handleViewReports(user.id)}
                            >
                              {user.total_reports}
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="actions">
                            <button onClick={() => handleResetPassword(user.id, user.email)}>
                              Reset
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              className="danger"
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
<<<<<<< Updated upstream
=======

            {!loading && users.length === 0 && <div>Aucun utilisateur</div>}

            {!loading && users.length > 0 && (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Créé le</th>
                    <th>Dernière connexion</th>
                    <th>Signalements</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.email}</td>
                      <td>
                        <select
                          value={u.role || 'user'}
                          onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td>{u.created_at ? new Date(u.created_at).toLocaleString() : '-'}</td>
                      <td>{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : '-'}</td>
                      <td>
                        <button className="link-button" onClick={() => handleViewReports(u)}>
                          {u.unread_reports ? (
                            <span className="unread">{u.unread_reports} non lus</span>
                          ) : (
                            <span>0</span>
                          )}
                        </button>
                      </td>
                      <td className="actions">
                        <button onClick={() => handleResetPassword(u.id)} disabled={loading}>Reset</button>
                        <button className="danger" onClick={() => handleDeleteUser(u.id)} disabled={loading}>Suppr.</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
>>>>>>> Stashed changes
          </div>
        )}
      </div>

<<<<<<< Updated upstream
      {/* Modale de signalement réutilisée */}
      {showReportModal && selectedReport && (
        <div className="report-modal-overlay">
          <div className="report-modal">
            <div className="report-modal-header">
              <h3>Signalement du {new Date(selectedReport.created_at).toLocaleString('fr-FR')}</h3>
              <button onClick={() => setShowReportModal(false)}>✕</button>
            </div>
            <div className="report-modal-content">
              <p><strong>Page :</strong> {selectedReport.page}</p>
              <p><strong>Titre :</strong> {selectedReport.title}</p>
              <p><strong>Description :</strong></p>
              <p>{selectedReport.description}</p>
              {selectedReport.meta && (
                <details>
                  <summary>Informations techniques</summary>
                  <pre>{JSON.stringify(selectedReport.meta, null, 2)}</pre>
                </details>
              )}
            </div>
            <div className="report-modal-actions">
              <button onClick={() => handleMarkAsRead(selectedReport.id)}>
                Marquer comme lu
              </button>
              <button onClick={() => handleDeleteReport(selectedReport.id)} className="danger">
                Supprimer le signalement
              </button>
              <button onClick={() => handleDeleteAllReports(selectedReport.user_id)} className="danger">
                Supprimer l'historique
              </button>
              <button onClick={() => setShowReportModal(false)}>Fermer</button>
            </div>
=======
      {showReportModal && (
        <div className="report-modal-overlay" onClick={() => {
          if (!selectedReport) setShowReportModal(false);
        }}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()}>
            {!selectedReport ? (
              <>
                <div className="report-modal-header">
                  <h3>Signalements — {selectedReportUser?.email}</h3>
                  <button onClick={() => setShowReportModal(false)}>✕</button>
                </div>

                {reportError && (
                  <div style={{ 
                    background: 'var(--color-error-bg)', 
                    border: '1px solid var(--color-error-border)', 
                    color: 'var(--color-error-text)', 
                    padding: '12px 16px', 
                    borderRadius: '6px', 
                    marginBottom: '16px',
                    fontSize: '14px'
                  }}>
                    {reportError}
                  </div>
                )}

                <div className="report-modal-actions">
                  <button className="danger" onClick={handleDeleteAllReports} disabled={reportLoading}>
                    Supprimer tous
                  </button>
                </div>

                {reportLoading && <div>Chargement…</div>}

                {!reportLoading && userReports.length === 0 && <div>Aucun signalement</div>}

                {!reportLoading && userReports.length > 0 && (
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Page</th>
                        <th>Titre</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userReports.map((r) => (
                        <tr key={r.id} className={r.admin_read_at ? 'read' : 'unread'}>
                          <td>{r.created_at ? new Date(r.created_at).toLocaleString() : '-'}</td>
                          <td>{r.page || '-'}</td>
                          <td>{r.title || '-'}</td>
                          <td>
                            <span className={r.admin_read_at ? 'status-badge read' : 'status-badge unread'} style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: r.admin_read_at ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                              color: r.admin_read_at ? 'var(--color-success-text)' : 'var(--color-warning-text)',
                              border: r.admin_read_at ? '1px solid var(--color-success-border)' : '1px solid var(--color-warning-border)'
                            }}>
                              {r.admin_read_at ? 'Lu' : 'Non lu'}
                            </span>
                          </td>
                          <td className="actions">
                            <button onClick={() => handleViewReportDetails(r)} className="view-details">
                              Voir détails
                            </button>
                            {r.admin_read_at ? (
                              <button onClick={() => handleMarkAsUnread(r.id)}>
                                Marquer non lu
                              </button>
                            ) : (
                              <button onClick={() => handleMarkAsRead(r.id)}>
                                Marquer lu
                              </button>
                            )}
                            <button className="danger" onClick={() => handleDeleteReport(r.id)}>
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            ) : (
              <div className="report-detail-view">
                <div className="report-modal-header">
                  <h3>Détails du signalement</h3>
                  <button onClick={handleCloseReportDetails}>↩ Retour</button>
                </div>
                
                <div className="report-detail-content">
                  <div className="report-detail-header">
                    <div className="report-detail-meta">
                      <div className="report-detail-field">
                        <span className="report-detail-label">Date :</span>
                        <span className="report-detail-value">{selectedReport.created_at ? new Date(selectedReport.created_at).toLocaleString() : '-'}</span>
                      </div>
                      <div className="report-detail-field">
                        <span className="report-detail-label">Page :</span>
                        <span className="report-detail-value">{selectedReport.page || '-'}</span>
                      </div>
                      <div className="report-detail-field">
                        <span className="report-detail-label">Status :</span>
                        <span className={selectedReport.admin_read_at ? 'status-badge read' : 'status-badge unread'} style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: selectedReport.admin_read_at ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                          color: selectedReport.admin_read_at ? 'var(--color-success-text)' : 'var(--color-warning-text)',
                          border: selectedReport.admin_read_at ? '1px solid var(--color-success-border)' : '1px solid var(--color-warning-border)'
                        }}>
                          {selectedReport.admin_read_at ? 'Lu' : 'Non lu'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="report-detail-title">
                    <h4>{selectedReport.title || 'Sans titre'}</h4>
                  </div>
                  
                  <div className="report-detail-description">
                    <h5>Description :</h5>
                    <div className="report-description-content">
                      {selectedReport.description || 'Aucune description fournie'}
                    </div>
                  </div>
                  
                  {selectedReport.meta && Object.keys(selectedReport.meta).length > 0 && (
                    <div className="report-detail-metadata">
                      <h5>Métadonnées :</h5>
                      <pre>{JSON.stringify(selectedReport.meta, null, 2)}</pre>
                    </div>
                  )}
                  
                  <div className="report-detail-actions">
                    {selectedReport.admin_read_at ? (
                      <button onClick={() => {
                        handleMarkAsUnread(selectedReport.id);
                        handleCloseReportDetails();
                      }}>
                        Marquer non lu
                      </button>
                    ) : (
                      <button onClick={() => {
                        handleMarkAsRead(selectedReport.id);
                        handleCloseReportDetails();
                      }}>
                        Marquer lu
                      </button>
                    )}
                    <button className="danger" onClick={() => {
                      if (confirm('Supprimer ce signalement ?')) {
                        handleDeleteReport(selectedReport.id);
                        handleCloseReportDetails();
                      }
                    }}>
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            )}
>>>>>>> Stashed changes
          </div>
        </div>
      )}
    </div>
  );
}
