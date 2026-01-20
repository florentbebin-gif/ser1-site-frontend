import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase, DEBUG_AUTH } from '../../supabaseClient';
import { useUserRole } from '../../auth/useUserRole';
import { UserInfoBanner } from '../../components/UserInfoBanner';
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
      if (!session?.access_token) throw new Error('Non authentifié');

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
      if (!session?.access_token) throw new Error('Non authentifié');
      
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
      if (!session?.access_token) throw new Error('Non authentifié');
      
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
      if (!session?.access_token) throw new Error('Non authentifié');
      
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

  const handleViewReports = async (userId, userEmail) => {
    try {
      setReportLoading(true);
      setSelectedReportUser({ id: userId, email: userEmail });
      setSelectedReport(null);
      setUserReports([]);
      setShowReportModal(true);

      const session = await getSessionWithRetry();
      if (!session?.access_token) throw new Error('Non authentifié');
      
      const { data, error: invokeError } = await supabase.functions.invoke('admin', {
        body: { action: 'list_issue_reports', user_id: userId },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

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
      const session = await getSessionWithRetry();
      if (!session?.access_token) throw new Error('Non authentifié');
      
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
      const session = await getSessionWithRetry();
      if (!session?.access_token) throw new Error('Non authentifié');
      
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
      const session = await getSessionWithRetry();
      if (!session?.access_token) throw new Error('Non authentifié');
      
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

  return (
    <div style={{ marginTop: 16 }}>
      {/* Bandeau utilisateur */}
      <UserInfoBanner />

      {error && <div className="alert error">{error}</div>}
      
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div className="admin-content">
            {/* Créer un utilisateur */}
            <div className="invite-section">
              <h3>Créer un utilisateur</h3>
              <form onSubmit={handleCreateUser} className="invite-form">
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="Email de l'utilisateur"
                  required
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    border: '1px solid var(--color-c8)',
                    borderRadius: 6,
                    fontSize: 14,
                    backgroundColor: '#FFFFFF',
                    color: 'var(--color-c10)'
                  }}
                />
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="chip"
                  style={{
                    padding: '10px 20px',
                    fontWeight: 600,
                    opacity: actionLoading ? 0.6 : 1
                  }}
                >
                  {actionLoading ? 'Envoi...' : 'Inviter'}
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
                          {user.total_reports > 0 ? (
                            <div 
                              className="report-badge-container"
                              onClick={() => handleViewReports(user.id, user.email)}
                            >
                              <span className={`report-badge ${user.unread_reports > 0 ? 'has-unread' : 'all-read'}`}>
                                {user.total_reports}
                              </span>
                              {user.unread_reports > 0 && (
                                <span className="unread-indicator">
                                  {user.unread_reports} non lu{user.unread_reports > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="no-reports">—</span>
                          )}
                        </td>
                        <td>
                          <div className="actions">
                            <button onClick={() => handleResetPassword(user.id, user.email)}>
                              Email Reinit
                            </button>
                            {user.role !== 'admin' && (
                              <button 
                                onClick={() => handleDeleteUser(user.id, user.email)}
                                className="danger"
                              >
                                Supprimer
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
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
