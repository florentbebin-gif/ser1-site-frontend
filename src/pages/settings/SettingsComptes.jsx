import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { DEBUG_AUTH } from '@/supabaseClient';
import { isDebugEnabled } from '@/utils/debugFlags';
import { useUserRole } from '@/auth/useUserRole';
import { UserInfoBanner } from '@/components/UserInfoBanner';
import { invokeAdmin } from '@/services/apiAdmin';
import CabinetEditModal from '@/pages/settings/components/CabinetEditModal';
import {
  SettingsCabinetsSection,
  SettingsThemesSection,
  SettingsUsersSection,
} from '@/pages/settings/components/SettingsComptesSections';
import SettingsReportsModal from '@/pages/settings/components/SettingsReportsModal';
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
    setRefreshKey((key) => key + 1);
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
        console.debug('[SettingsComptes] authLoading -> wait');
      }
      return;
    }

    if (!isAdmin) {
      if (DEBUG_AUTH || DEBUG_COMPTES_REFRESH) {
        // eslint-disable-next-line no-console
        console.debug('[SettingsComptes] not admin -> skip fetch');
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
      setError('Les themes systeme ne peuvent pas etre supprimes.');
      return;
    }
    if (!confirm(`Supprimer le theme "${theme.name}" ?`)) return;

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

  const handleAssignUserCabinet = async (userId, cabinetId) => {
    try {
      setActionLoading(true);
      const { error: invokeError } = await invokeAdmin('assign_user_cabinet', {
        user_id: userId,
        cabinet_id: cabinetId || null,
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
        email,
      });
      if (invokeError) throw new Error(invokeError.message);
      alert('Email de reinitialisation envoye');
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
      if (selectedReportUser) {
        handleViewReports(selectedReportUser.id, selectedReportUser.email);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!confirm('Supprimer definitivement ce signalement ?')) return;

    try {
      const { error: invokeError } = await invokeAdmin('delete_issue', { reportId });
      if (invokeError) throw new Error(invokeError.message);

      setSelectedReport(null);
      triggerRefresh('delete_issue');
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
        <p>Vous n'avez pas les droits administrateurs pour acceder a cette page.</p>
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
      <UserInfoBanner />

      {error && <div className="alert error">{error}</div>}

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div className="admin-content">
          <SettingsCabinetsSection
            cabinets={cabinets}
            cabinetsLoading={cabinetsLoading}
            onCreateCabinet={() => openCabinetModal()}
            onEditCabinet={openCabinetModal}
            onDeleteCabinet={handleDeleteCabinet}
          />

          <SettingsThemesSection
            themes={themes}
            themesLoading={themesLoading}
            onCreateTheme={() => openThemeModal()}
            onEditTheme={openThemeModal}
            onDeleteTheme={handleDeleteTheme}
          />

          <SettingsUsersSection
            users={users}
            cabinets={cabinets}
            actionLoading={actionLoading}
            onCreateUser={() => setShowUserModal(true)}
            onRefresh={() => triggerRefresh('manual')}
            onAssignUserCabinet={handleAssignUserCabinet}
            onViewReports={handleViewReports}
            onResetPassword={handleResetPassword}
            onDeleteUser={handleDeleteUser}
          />
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

      <SettingsReportsModal
        show={showReportModal}
        selectedReport={selectedReport}
        selectedReportUser={selectedReportUser}
        reportLoading={reportLoading}
        userReports={userReports}
        onClose={handleCloseModal}
        onBackToList={handleBackToList}
        onSelectReport={handleSelectReport}
        onDeleteAllReports={handleDeleteAllReports}
        onMarkAsRead={handleMarkAsRead}
        onDeleteReport={handleDeleteReport}
      />
    </div>
  );
}
