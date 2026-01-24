import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase, DEBUG_AUTH } from '../../supabaseClient';
import { useUserRole } from '../../auth/useUserRole';
import { UserInfoBanner } from '../../components/UserInfoBanner';
import { invokeAdmin } from '../../services/apiAdmin';
import { uploadLogoWithDedup, getLogoPublicUrl } from '../../utils/logoUpload';
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

  // V2: Cabinets & Themes state
  const [cabinets, setCabinets] = useState([]);
  const [themes, setThemes] = useState([]);
  const [cabinetsLoading, setCabinetsLoading] = useState(false);
  const [themesLoading, setThemesLoading] = useState(false);
  
  // Cabinet Modal state
  const [showCabinetModal, setShowCabinetModal] = useState(false);
  const [editingCabinet, setEditingCabinet] = useState(null);
  const [cabinetForm, setCabinetForm] = useState({ name: '', default_theme_id: '', logo_id: '' });
  const [cabinetSaving, setCabinetSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  
  // Theme Modal state
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [editingTheme, setEditingTheme] = useState(null);
  const [themeForm, setThemeForm] = useState({ name: '', palette: {} });
  const [themeSaving, setThemeSaving] = useState(false);

  const DEFAULT_PALETTE = {
    c1: '#2B3E37', c2: '#709B8B', c3: '#9FBDB2', c4: '#CFDED8', c5: '#788781',
    c6: '#CEC1B6', c7: '#F5F3F0', c8: '#D9D9D9', c9: '#7F7F7F', c10: '#000000'
  };

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
    fetchCabinets();
    fetchThemes();
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

      const { data, error: invokeError } = await invokeAdmin('list_users');

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

  // V2: Cabinet Modal handlers
  const openCabinetModal = (cabinet = null) => {
    setEditingCabinet(cabinet);
    if (cabinet) {
      setCabinetForm({
        name: cabinet.name || '',
        default_theme_id: cabinet.default_theme_id || '',
        logo_id: cabinet.logo_id || ''
      });
      if (cabinet.logos?.storage_path) {
        setLogoPreview(getLogoPublicUrl(cabinet.logos.storage_path));
      } else {
        setLogoPreview(null);
      }
    } else {
      setCabinetForm({ name: '', default_theme_id: '', logo_id: '' });
      setLogoPreview(null);
    }
    setLogoFile(null);
    setShowCabinetModal(true);
  };

  const closeCabinetModal = () => {
    setShowCabinetModal(false);
    setEditingCabinet(null);
    setCabinetForm({ name: '', default_theme_id: '', logo_id: '' });
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image (jpg ou png).');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSaveCabinet = async () => {
    if (!cabinetForm.name.trim()) {
      setError('Le nom du cabinet est requis.');
      return;
    }

    try {
      setCabinetSaving(true);
      setError('');

      let logoId = cabinetForm.logo_id;

      // Upload logo if new file selected
      if (logoFile && editingCabinet?.id) {
        setLogoUploading(true);
        const result = await uploadLogoWithDedup(logoFile, editingCabinet.id);
        setLogoUploading(false);
        
        if (result.error) {
          setError(`Logo upload failed: ${result.error}`);
          setCabinetSaving(false);
          return;
        }
        logoId = result.logo_id;
      }

      if (editingCabinet) {
        // Update existing cabinet
        const { error: invokeError } = await invokeAdmin('update_cabinet', {
          id: editingCabinet.id,
          name: cabinetForm.name.trim(),
          default_theme_id: cabinetForm.default_theme_id || null,
          logo_id: logoId || null
        });
        if (invokeError) throw new Error(invokeError.message);
      } else {
        // Create new cabinet
        const { data, error: invokeError } = await invokeAdmin('create_cabinet', {
          name: cabinetForm.name.trim(),
          default_theme_id: cabinetForm.default_theme_id || null
        });
        if (invokeError) throw new Error(invokeError.message);
        
        // If logo was selected, upload it now (need cabinet ID)
        if (logoFile && data?.cabinet?.id) {
          setLogoUploading(true);
          const result = await uploadLogoWithDedup(logoFile, data.cabinet.id);
          setLogoUploading(false);
          
          if (!result.error && result.logo_id) {
            await invokeAdmin('assign_cabinet_logo', {
              cabinet_id: data.cabinet.id,
              logo_id: result.logo_id
            });
          }
        }
      }

      closeCabinetModal();
      fetchCabinets();
    } catch (err) {
      setError(err.message);
    } finally {
      setCabinetSaving(false);
      setLogoUploading(false);
    }
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

  // V2: Theme Modal handlers
  const openThemeModal = (theme = null) => {
    setEditingTheme(theme);
    if (theme) {
      setThemeForm({
        name: theme.name || '',
        palette: theme.palette || { ...DEFAULT_PALETTE }
      });
    } else {
      setThemeForm({ name: '', palette: { ...DEFAULT_PALETTE } });
    }
    setShowThemeModal(true);
  };

  const closeThemeModal = () => {
    setShowThemeModal(false);
    setEditingTheme(null);
    setThemeForm({ name: '', palette: {} });
  };

  const handleThemePaletteChange = (colorKey, value) => {
    setThemeForm(prev => ({
      ...prev,
      palette: { ...prev.palette, [colorKey]: value }
    }));
  };

  const handleSaveTheme = async () => {
    if (!themeForm.name.trim()) {
      setError('Le nom du thème est requis.');
      return;
    }

    try {
      setThemeSaving(true);
      setError('');

      if (editingTheme) {
        if (editingTheme.is_system) {
          setError('Les thèmes système ne peuvent pas être modifiés.');
          setThemeSaving(false);
          return;
        }
        const { error: invokeError } = await invokeAdmin('update_theme', {
          id: editingTheme.id,
          name: themeForm.name.trim(),
          palette: themeForm.palette
        });
        if (invokeError) throw new Error(invokeError.message);
      } else {
        const { error: invokeError } = await invokeAdmin('create_theme', {
          name: themeForm.name.trim(),
          palette: themeForm.palette
        });
        if (invokeError) throw new Error(invokeError.message);
      }

      closeThemeModal();
      fetchThemes();
    } catch (err) {
      setError(err.message);
    } finally {
      setThemeSaving(false);
    }
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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserEmail.trim()) return;

    try {
      setActionLoading(true);
      const { error: invokeError } = await invokeAdmin('create_user_invite', { 
        email: newUserEmail.trim() 
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
                      <th>Cabinet</th>
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
                              backgroundColor: 'var(--color-c7)',
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
                                title="Supprimer"
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
            </div>

            {/* V2: Section Cabinets */}
            <div className="admin-section" style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3>Cabinets ({cabinets.length})</h3>
                <button 
                  className="chip"
                  onClick={() => openCabinetModal()}
                  disabled={cabinetsLoading}
                  style={{ padding: '8px 16px', fontWeight: 600 }}
                >
                  + Nouveau cabinet
                </button>
              </div>
              {cabinetsLoading ? (
                <p>Chargement des cabinets...</p>
              ) : cabinets.length === 0 ? (
                <p style={{ color: 'var(--color-c9)', fontSize: 14 }}>Aucun cabinet créé.</p>
              ) : (
                <div className="cabinets-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {cabinets.map(cabinet => (
                    <div key={cabinet.id} className="cabinet-card" style={{
                      padding: 16,
                      border: '1px solid var(--color-c8)',
                      borderRadius: 8,
                      backgroundColor: 'var(--color-c7)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: 16, color: 'var(--color-c10)' }}>{cabinet.name}</h4>
                          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-c9)' }}>
                            Thème: {cabinet.themes?.name || '—'}
                          </p>
                          {cabinet.logos?.storage_path && (
                            <img 
                              src={getLogoPublicUrl(cabinet.logos.storage_path)} 
                              alt="Logo" 
                              style={{ marginTop: 8, maxWidth: 80, maxHeight: 40, objectFit: 'contain', borderRadius: 4 }}
                            />
                          )}
                        </div>
                        <div className="actions" style={{ flexShrink: 0 }}>
                          <button onClick={() => openCabinetModal(cabinet)} style={{ fontSize: 12, padding: '6px 10px' }}>
                            Modifier
                          </button>
                          <button 
                            onClick={() => handleDeleteCabinet(cabinet)} 
                            className="danger"
                            style={{ fontSize: 12, padding: '6px 10px' }}
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* V2: Section Thèmes */}
            <div className="admin-section" style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3>Thèmes globaux ({themes.length})</h3>
                <button 
                  className="chip"
                  onClick={() => openThemeModal()}
                  disabled={themesLoading}
                  style={{ padding: '8px 16px', fontWeight: 600 }}
                >
                  + Nouveau thème
                </button>
              </div>
              {themesLoading ? (
                <p>Chargement des thèmes...</p>
              ) : themes.length === 0 ? (
                <p style={{ color: 'var(--color-c9)', fontSize: 14 }}>Aucun thème créé.</p>
              ) : (
                <div className="themes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                  {themes.map(theme => (
                    <div key={theme.id} className="theme-card" style={{
                      padding: 16,
                      border: '1px solid var(--color-c8)',
                      borderRadius: 8,
                      backgroundColor: 'var(--color-c7)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <h4 style={{ margin: 0, fontSize: 15, color: 'var(--color-c10)' }}>{theme.name}</h4>
                            {theme.is_system && (
                              <span style={{ 
                                fontSize: 10, 
                                padding: '2px 6px', 
                                background: 'var(--color-c2)', 
                                color: 'white', 
                                borderRadius: 4,
                                fontWeight: 600
                              }}>SYSTÈME</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            {theme.palette && Object.entries(theme.palette).slice(0, 10).map(([key, color]) => (
                              <div 
                                key={key}
                                style={{
                                  width: 20,
                                  height: 20,
                                  backgroundColor: color,
                                  borderRadius: 3,
                                  border: '1px solid var(--color-c8)'
                                }}
                                title={`${key}: ${color}`}
                              />
                            ))}
                          </div>
                        </div>
                        {!theme.is_system && (
                          <div className="actions" style={{ flexShrink: 0 }}>
                            <button onClick={() => openThemeModal(theme)} style={{ fontSize: 12, padding: '6px 10px' }}>
                              Modifier
                            </button>
                            <button 
                              onClick={() => handleDeleteTheme(theme)} 
                              className="danger"
                              style={{ fontSize: 12, padding: '6px 10px' }}
                            >
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* V2: Modal Cabinet */}
        {showCabinetModal && (
          <div className="report-modal-overlay" onClick={closeCabinetModal}>
            <div className="report-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
              <div className="report-modal-header">
                <h3>{editingCabinet ? 'Modifier le cabinet' : 'Nouveau cabinet'}</h3>
                <button className="report-modal-close" onClick={closeCabinetModal}>✕</button>
              </div>
              <div className="report-modal-content">
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Nom du cabinet *</label>
                  <input
                    type="text"
                    value={cabinetForm.name}
                    onChange={(e) => setCabinetForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Cabinet Dupont"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--color-c8)',
                      borderRadius: 6,
                      fontSize: 14
                    }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Thème par défaut</label>
                  <select
                    value={cabinetForm.default_theme_id}
                    onChange={(e) => setCabinetForm(prev => ({ ...prev, default_theme_id: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--color-c8)',
                      borderRadius: 6,
                      fontSize: 14,
                      backgroundColor: 'var(--color-c7)'
                    }}
                  >
                    <option value="">— Aucun thème —</option>
                    {themes.map(theme => (
                      <option key={theme.id} value={theme.id}>{theme.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Logo du cabinet</label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleLogoFileChange}
                    style={{ marginBottom: 8 }}
                  />
                  {logoPreview && (
                    <div style={{ marginTop: 8 }}>
                      <img 
                        src={logoPreview} 
                        alt="Aperçu logo" 
                        style={{ maxWidth: 150, maxHeight: 80, objectFit: 'contain', borderRadius: 4, border: '1px solid var(--color-c8)' }}
                      />
                    </div>
                  )}
                  {logoUploading && <p style={{ fontSize: 13, color: 'var(--color-c9)' }}>Upload en cours...</p>}
                </div>
              </div>
              <div className="report-modal-actions">
                <button onClick={closeCabinetModal}>Annuler</button>
                <button 
                  className="chip"
                  onClick={handleSaveCabinet}
                  disabled={cabinetSaving || logoUploading}
                  style={{ opacity: cabinetSaving ? 0.6 : 1 }}
                >
                  {cabinetSaving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* V2: Modal Thème */}
        {showThemeModal && (
          <div className="report-modal-overlay" onClick={closeThemeModal}>
            <div className="report-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
              <div className="report-modal-header">
                <h3>{editingTheme ? 'Modifier le thème' : 'Nouveau thème'}</h3>
                <button className="report-modal-close" onClick={closeThemeModal}>✕</button>
              </div>
              <div className="report-modal-content">
                {editingTheme?.is_system && (
                  <div style={{ 
                    padding: 12, 
                    marginBottom: 16, 
                    background: 'var(--color-c4)', 
                    borderRadius: 6, 
                    fontSize: 13 
                  }}>
                    Les thèmes système ne peuvent pas être modifiés.
                  </div>
                )}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Nom du thème *</label>
                  <input
                    type="text"
                    value={themeForm.name}
                    onChange={(e) => setThemeForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Bleu patrimonial"
                    disabled={editingTheme?.is_system}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--color-c8)',
                      borderRadius: 6,
                      fontSize: 14
                    }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Palette (10 couleurs)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                    {['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10'].map(colorKey => (
                      <div key={colorKey} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--color-c9)', marginBottom: 4 }}>{colorKey.toUpperCase()}</span>
                        <input
                          type="color"
                          value={themeForm.palette?.[colorKey] || DEFAULT_PALETTE[colorKey]}
                          onChange={(e) => handleThemePaletteChange(colorKey, e.target.value)}
                          disabled={editingTheme?.is_system}
                          style={{ width: 40, height: 32, border: 'none', cursor: 'pointer' }}
                        />
                        <input
                          type="text"
                          value={themeForm.palette?.[colorKey] || DEFAULT_PALETTE[colorKey]}
                          onChange={(e) => handleThemePaletteChange(colorKey, e.target.value)}
                          disabled={editingTheme?.is_system}
                          style={{
                            width: '100%',
                            padding: '4px',
                            border: '1px solid var(--color-c8)',
                            borderRadius: 4,
                            fontSize: 10,
                            fontFamily: 'monospace',
                            textAlign: 'center',
                            marginTop: 4
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="report-modal-actions">
                <button onClick={closeThemeModal}>Annuler</button>
                {!editingTheme?.is_system && (
                  <button 
                    className="chip"
                    onClick={handleSaveTheme}
                    disabled={themeSaving}
                    style={{ opacity: themeSaving ? 0.6 : 1 }}
                  >
                    {themeSaving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                )}
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
