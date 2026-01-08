import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './SettingsComptes.css';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../auth';
import { createRequestSequencer, withTimeout } from '../../utils/requestGuard';

export default function SettingsComptes() {
  const { authReady, authRevision, appAwakeRevision, isAdmin, ensureSession, session } = useAuth();

  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportUser, setSelectedReportUser] = useState(null);
  const [userReports, setUserReports] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);

  const loadSequencer = useMemo(() => createRequestSequencer(), []);
  const abortControllerRef = useRef<AbortController | null>(null);

  const callAdmin = useCallback(
    async (action, payload = {}, { reason, signal, timeoutMs = 12000 } = {}) => {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!SUPABASE_URL || !ANON_KEY) {
        throw new Error('Configuration Supabase manquante (URL ou clé ANON).');
      }

      await ensureSession?.(`admin:${reason || action}`);
      const token = session?.access_token;
      if (!token) {
        throw new Error('Session invalide : veuillez vous reconnecter.');
      }

      const response = await withTimeout(
        fetch(`${SUPABASE_URL}/functions/v1/admin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: ANON_KEY,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action, ...payload }),
          signal,
        }),
        timeoutMs,
        `admin:${action}`
      );

      const text = await response.text();
      if (!response.ok) {
        let msg = text;
        try {
          const parsed = JSON.parse(text);
          msg = parsed?.error || parsed?.message || msg;
        } catch {
          // ignore JSON parse errors
        }
        throw new Error(`[admin] ${response.status} ${response.statusText} - ${msg}`);
      }

      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    },
    [ensureSession, session?.access_token]
  );

  const fetchUsers = useCallback(
    async (reason) => {
      if (!authReady || !isAdmin) return;

      const requestId = loadSequencer.nextId();
      setLoading(true);
      setError(null);

      abortControllerRef.current?.abort('superseded');
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const data = await callAdmin(
          'list_users',
          {},
          { reason, signal: controller.signal, timeoutMs: 12000 }
        );

        if (!loadSequencer.isLatest(requestId)) return;
        const list = data?.users || data?.data?.users || [];
        setUsers(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!loadSequencer.isLatest(requestId)) return;
        if (err?.name === 'AbortError') return;
        console.error('[SettingsComptes] list_users:error', err);
        setError(err?.message || String(err));
        if (users.length === 0) {
          setUsers([]);
        }
      } finally {
        if (loadSequencer.isLatest(requestId)) {
          setLoading(false);
        }
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [authReady, isAdmin, callAdmin, loadSequencer, users.length]
  );

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort('unmount');
    };
  }, []);

  useEffect(() => {
    if (!authReady || !isAdmin) return;
    fetchUsers('appAwake');
  }, [authReady, isAdmin, authRevision, appAwakeRevision, fetchUsers]);


  const handleRefresh = useCallback(() => {
    fetchUsers('manual_refresh');
  }, [fetchUsers]);

  const handleInviteUser = useCallback(async () => {
    try {
      setError(null);
      if (!email) return;
      await callAdmin('invite_user', { email }, { reason: 'invite_user' });
      setEmail('');
      fetchUsers('after_invite');
    } catch (e) {
      setError(e?.message || String(e));
    }
  }, [email, fetchUsers, callAdmin]);

  const handleUpdateRole = useCallback(async (userId, role) => {
    try {
      setError(null);
      await callAdmin('update_user_role', { user_id: userId, role }, { reason: 'update_role' });
      fetchUsers('after_update_role');
    } catch (e) {
      setError(e?.message || String(e));
    }
  }, [fetchUsers, callAdmin]);

  const handleDeleteUser = useCallback(async (userId) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    try {
      setError(null);
      await callAdmin('delete_user', { user_id: userId }, { reason: 'delete_user' });
      fetchUsers('after_delete_user');
    } catch (e) {
      setError(e?.message || String(e));
    }
  }, [fetchUsers, callAdmin]);

  const handleResetPassword = useCallback(async (userId) => {
    try {
      setError(null);
      await callAdmin('reset_password', { user_id: userId }, { reason: 'reset_password' });
      alert('Email de reset envoyé.');
    } catch (e) {
      setError(e?.message || String(e));
    }
  }, [callAdmin]);

  const handleViewReports = useCallback(async (u) => {
    try {
      setSelectedReportUser(u);
      setShowReportModal(true);
      setReportLoading(true);
      setReportError(null);
      setUserReports([]);

      const data = await callAdmin('list_issue_reports', { user_id: u.id }, { reason: 'list_issue_reports' });
      const reports = Array.isArray(data?.reports) ? data.reports : [];
      setUserReports(reports);
    } catch (e) {
      setReportError(e?.message || String(e));
    } finally {
      setReportLoading(false);
    }
  }, [callAdmin]);

  const handleMarkAsRead = useCallback(async (reportId) => {
    try {
      setReportError(null);
      await callAdmin('mark_issue_report_read', { report_id: reportId }, { reason: 'mark_issue_report_read' });

      // refresh modal + users counters
      if (selectedReportUser) await handleViewReports(selectedReportUser);
      fetchUsers('after_mark_read');
    } catch (e) {
      setReportError(e?.message || String(e));
    }
  }, [fetchUsers, handleViewReports, callAdmin, selectedReportUser]);

  const handleDeleteReport = useCallback(async (reportId) => {
    if (!confirm('Supprimer ce signalement ?')) return;
    try {
      setReportError(null);
      await callAdmin('delete_issue_report', { report_id: reportId }, { reason: 'delete_issue_report' });

      if (selectedReportUser) await handleViewReports(selectedReportUser);
      fetchUsers('after_delete_report');
    } catch (e) {
      setReportError(e?.message || String(e));
    }
  }, [fetchUsers, handleViewReports, callAdmin, selectedReportUser]);

  const handleDeleteAllReports = useCallback(async () => {
    if (!selectedReportUser) return;
    if (!confirm('Supprimer TOUS les signalements de cet utilisateur ?')) return;
    try {
      setReportError(null);
      await callAdmin('delete_all_issue_reports', { user_id: selectedReportUser.id }, { reason: 'delete_all_issue_reports' });

      await handleViewReports(selectedReportUser);
      fetchUsers('after_delete_all_reports');
    } catch (e) {
      setReportError(e?.message || String(e));
    }
  }, [fetchUsers, handleViewReports, callAdmin, selectedReportUser]);

  const isInitialLoading = loading && users.length === 0;

  const totalUnreadReports = useMemo(() => {
    return users.reduce((sum, u) => sum + (u.unread_reports || 0), 0);
  }, [users]);

  if (!authReady) {
    return <div style={{ padding: 16 }}>Chargement session…</div>;
  }

  if (!isAdmin) {
    return <div style={{ padding: 16 }}>Accès réservé administrateur.</div>;
  }

  return (
    <div className="settings-comptes">
      <h2>Comptes</h2>

      {error && <div className="error">{error}</div>}

      <div className="invite-section">
        <h3>Créer un utilisateur</h3>
        <div className="invite-form">
          <input
            type="email"
            placeholder="Email de l'utilisateur"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button onClick={handleInviteUser}>Inviter</button>
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
          {/* le reste de ton UI inchangé */}
          <div className="users-section">
            <div className="users-header">
              <h3>Utilisateurs ({users.length})</h3>
              <div className="users-actions">
                <span className="reports-badge" title="Signalements non lus">
                  Signalements non lus : {totalUnreadReports}
                </span>
                <button onClick={handleRefresh} disabled={loading}>
                  {loading ? 'Chargement…' : 'Rafraîchir'}
                </button>
              </div>
            </div>

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
                        <button onClick={() => handleResetPassword(u.id)}>Reset</button>
                        <button className="danger" onClick={() => handleDeleteUser(u.id)}>Suppr.</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Signalements — {selectedReportUser?.email}</h3>
              <button onClick={() => setShowReportModal(false)}>✕</button>
            </div>

            {reportError && <div className="error">{reportError}</div>}

            <div className="modal-actions">
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
                    <tr key={r.id}>
                      <td>{r.created_at ? new Date(r.created_at).toLocaleString() : '-'}</td>
                      <td>{r.page || '-'}</td>
                      <td>{r.title || '-'}</td>
                      <td>{r.admin_read_at ? 'lu' : 'non lu'}</td>
                      <td className="actions">
                        {!r.admin_read_at && (
                          <button onClick={() => handleMarkAsRead(r.id)}>Marquer lu</button>
                        )}
                        <button className="danger" onClick={() => handleDeleteReport(r.id)}>
                          Suppr.
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
