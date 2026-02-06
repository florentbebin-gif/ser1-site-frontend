import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { DEBUG_AUTH } from '../../supabaseClient';
import { isDebugEnabled } from '../../utils/debugFlags';
import { useUserRole } from '../../auth/useUserRole';
import { UserInfoBanner } from '../../components/UserInfoBanner';
import { invokeAdmin } from '../../services/apiAdmin';
import { uploadLogoWithDedup, getLogoPublicUrl } from '../../utils/logoUpload';
import './SettingsComptes.css';
import { DEFAULT_COLORS } from '../../settings/theme';

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
  
  // Cabinet Modal state
  const [showCabinetModal, setShowCabinetModal] = useState(false);
  const [editingCabinet, setEditingCabinet] = useState(null);
  const [cabinetForm, setCabinetForm] = useState({ name: '', default_theme_id: '', logo_id: '', logo_placement: 'center-bottom' });
  const [cabinetSaving, setCabinetSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  
  // Theme Modal state
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [editingTheme, setEditingTheme] = useState(null);
  const [themeForm, setThemeForm] = useState({ name: '', palette: {} });
  const [themeSaving, setThemeSaving] = useState(false);
  
  // User Modal state
  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalEmail, setUserModalEmail] = useState('');
  const [userModalCabinetId, setUserModalCabinetId] = useState('');
  const [userModalError, setUserModalError] = useState('');
  const [userModalSuccess, setUserModalSuccess] = useState('');

  const DEFAULT_PALETTE = DEFAULT_COLORS;

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

  // V2: Cabinet Modal handlers
  const openCabinetModal = (cabinet = null) => {
    setEditingCabinet(cabinet);
    if (cabinet) {
      setCabinetForm({
        name: cabinet.name || '',
        default_theme_id: cabinet.default_theme_id || '',
        logo_id: cabinet.logo_id || '',
        logo_placement: cabinet.logo_placement || 'center-bottom'
      });
      if (cabinet.logos?.storage_path) {
        setLogoPreview(getLogoPublicUrl(cabinet.logos.storage_path));
      } else {
        setLogoPreview(null);
      }
    } else {
      setCabinetForm({ name: '', default_theme_id: '', logo_id: '', logo_placement: 'center-bottom' });
      setLogoPreview(null);
    }
    setLogoFile(null);
    setShowCabinetModal(true);
  };

  const closeCabinetModal = () => {
    setShowCabinetModal(false);
    setEditingCabinet(null);
    setCabinetForm({ name: '', default_theme_id: '', logo_id: '', logo_placement: 'center-bottom' });
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
          logo_id: logoId || null,
          logo_placement: cabinetForm.logo_placement || 'center-bottom'
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
        // Le thème système (is_system=true) est modifiable (palette uniquement)
        // Pas de blocage ici — le backend gère la protection
        const { error: invokeError } = await invokeAdmin('update_theme', {
          id: editingTheme.id,
          name: themeForm.name.trim(),
          palette: themeForm.palette
        });
        if (invokeError) throw new Error(invokeError.message);
        
        // Invalider le cache originalColors dans ThemeProvider si c'était le thème système
        if (editingTheme.is_system) {
          window.dispatchEvent(new CustomEvent('ser1-original-theme-updated'));
        }
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

  const closeUserModal = () => {
    setShowUserModal(false);
    setUserModalEmail('');
    setUserModalCabinetId('');
    setUserModalError('');
    setUserModalSuccess('');
  };

  const handleInviteUser = async () => {
    if (!userModalEmail.trim()) {
      setUserModalError('L\'email est requis.');
      return;
    }

    try {
      setActionLoading(true);
      setUserModalError('');
      setUserModalSuccess('');

      const payload = { email: userModalEmail.trim() };
      if (userModalCabinetId) {
        payload.cabinet_id = userModalCabinetId;
      }

      const { error: invokeError } = await invokeAdmin('create_user_invite', payload);

      if (invokeError) throw new Error(invokeError.message);
      
      setUserModalSuccess('Invitation envoyée avec succès !');
      closeUserModal();
      triggerRefresh('create_user_invite');
    } catch (err) {
      setUserModalError(err.message);
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
    <div className="settings-comptes" style={{ marginTop: 16 }}>
      {/* Bandeau utilisateur */}
      <UserInfoBanner />

      {error && <div className="alert error">{error}</div>}
      
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div className="admin-content">
            {/* V2: Section Cabinets */}
            <div className="admin-section">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 className="settings-premium-title">Cabinets ({cabinets.length})</h3>
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
            </div>

            {/* V2: Section Thèmes */}
            <div className="admin-section" style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 className="settings-premium-title">Thèmes globaux ({themes.length})</h3>
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
            </div>


            {/* Liste des utilisateurs */}
            <div className="admin-section" style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 className="settings-premium-title">Utilisateurs ({users.length})</h3>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
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
                      fontSize: 14
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => document.getElementById('logo-file-input').click()}
                      className="chip"
                      style={{ padding: '8px 16px', fontWeight: 500 }}
                    >
                      Choisir une image...
                    </button>
                    <span style={{ fontSize: 13, color: 'var(--color-c9)' }}>
                      {logoFile ? logoFile.name : (logoPreview ? 'Logo sélectionné' : 'Aucun fichier')}
                    </span>
                    <input
                      id="logo-file-input"
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={handleLogoFileChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                  {logoPreview && (
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img 
                        src={logoPreview} 
                        alt="Aperçu logo" 
                        style={{ maxWidth: 150, maxHeight: 80, objectFit: 'contain', borderRadius: 4, border: '1px solid var(--color-c8)' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setLogoPreview(null);
                          setLogoFile(null);
                          setCabinetForm(prev => ({ ...prev, logo_id: '' }));
                        }}
                        className="icon-btn danger"
                        title="Supprimer le logo"
                        aria-label="Supprimer le logo"
                        style={{ width: 32, height: 32 }}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  )}
                  {logoUploading && <p style={{ fontSize: 13, color: 'var(--color-c9)', marginTop: 8 }}>Upload en cours...</p>}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Position du logo</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {[
                      { key: 'top-left', label: 'Haut Gauche' },
                      { key: 'center-top', label: 'Centre Haut' },
                      { key: 'top-right', label: 'Haut Droite' },
                      { key: 'bottom-left', label: 'Bas Gauche' },
                      { key: 'center-bottom', label: 'Centre Bas' },
                      { key: 'bottom-right', label: 'Bas Droite' },
                    ].map((pos) => (
                      <button
                        key={pos.key}
                        type="button"
                        onClick={() => setCabinetForm(prev => ({ ...prev, logo_placement: pos.key }))}
                        style={{
                          padding: '8px 12px',
                          fontSize: 12,
                          border: `2px solid ${cabinetForm.logo_placement === pos.key ? 'var(--color-c4)' : 'var(--color-c8)'}`,
                          borderRadius: 6,
                          background: cabinetForm.logo_placement === pos.key ? 'var(--color-c4)' : 'transparent',
                          cursor: 'pointer',
                          textAlign: 'center',
                          color: cabinetForm.logo_placement === pos.key ? 'var(--color-c1)' : 'var(--color-c10)'
                        }}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--color-c9)', marginTop: 8 }}>
                    Le logo ne sera jamais positionné sur la zone titre de la slide.
                  </p>
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
                    background: 'var(--color-c3)', 
                    borderRadius: 6, 
                    fontSize: 13 
                  }}>
                    Thème système : modifiable mais ne peut pas être supprimé.
                  </div>
                )}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Nom du thème *</label>
                  <input
                    type="text"
                    value={themeForm.name}
                    onChange={(e) => setThemeForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Bleu patrimonial"
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
                          style={{ width: 40, height: 32, border: 'none', cursor: 'pointer' }}
                        />
                        <input
                          type="text"
                          value={themeForm.palette?.[colorKey] || DEFAULT_PALETTE[colorKey]}
                          onChange={(e) => handleThemePaletteChange(colorKey, e.target.value)}
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
                {!editingTheme?.is_system || editingTheme?.is_system ? (
                  <button 
                    className="chip"
                    onClick={handleSaveTheme}
                    disabled={themeSaving}
                    style={{ opacity: themeSaving ? 0.6 : 1 }}
                  >
                    {themeSaving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* Modal Nouvel Utilisateur */}
        {showUserModal && (
          <div className="report-modal-overlay" onClick={closeUserModal}>
            <div className="report-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
              <div className="report-modal-header">
                <h3>Nouvel utilisateur</h3>
                <button className="report-modal-close" onClick={closeUserModal}>✕</button>
              </div>
              <div className="report-modal-content">
                {userModalError && (
                  <div style={{ 
                    padding: '12px', 
                    background: 'var(--color-error-bg)', 
                    border: '1px solid var(--color-error-border)', 
                    color: 'var(--color-error-text)', 
                    borderRadius: 6, 
                    marginBottom: 16,
                    fontSize: 14
                  }}>
                    {userModalError}
                  </div>
                )}
                {userModalSuccess && (
                  <div style={{ 
                    padding: '12px', 
                    background: 'var(--color-success-bg)', 
                    border: '1px solid var(--color-success-border)', 
                    color: 'var(--color-success-text)', 
                    borderRadius: 6, 
                    marginBottom: 16,
                    fontSize: 14
                  }}>
                    {userModalSuccess}
                  </div>
                )}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Email *</label>
                  <input
                    type="email"
                    value={userModalEmail}
                    onChange={(e) => setUserModalEmail(e.target.value)}
                    placeholder="utilisateur@exemple.com"
                    disabled={actionLoading}
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
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Cabinet (optionnel)</label>
                  <select
                    value={userModalCabinetId}
                    onChange={(e) => setUserModalCabinetId(e.target.value)}
                    disabled={actionLoading || cabinetsLoading}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--color-c8)',
                      borderRadius: 6,
                      fontSize: 14,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">-- Aucun cabinet --</option>
                    {cabinets.map((cabinet) => (
                      <option key={cabinet.id} value={cabinet.id}>
                        {cabinet.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="report-modal-actions">
                <button onClick={closeUserModal} disabled={actionLoading}>Annuler</button>
                <button 
                  className="chip"
                  onClick={handleInviteUser}
                  disabled={actionLoading}
                  style={{ opacity: actionLoading ? 0.6 : 1 }}
                >
                  {actionLoading ? 'Envoi...' : 'Inviter'}
                </button>
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
