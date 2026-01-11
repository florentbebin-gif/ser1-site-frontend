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
          </div>
        )}
      </div>

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
          </div>
        </div>
      )}
    </div>
  );
}
