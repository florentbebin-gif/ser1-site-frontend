import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { DEBUG_AUTH } from '@/supabaseClient';
import { isDebugEnabled } from '@/utils/debugFlags';
import { useUserRole } from '@/auth/useUserRole';
import { UserInfoBanner } from '@/components/UserInfoBanner';
import { adminClient } from '@/settings/admin/adminClient';
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

interface CabinetRecord {
  id: string;
  name: string;
  default_theme_id?: string | null;
  logo_id?: string | null;
  logo_placement?: string | null;
  themes?: {
    name?: string | null;
  } | null;
  logos?: {
    storage_path?: string | null;
  } | null;
}

interface ThemeRecord {
  id: string;
  name: string;
  palette?: Record<string, string> | null;
  is_system?: boolean;
}

interface UserRecord {
  id: string;
  email: string;
  role: string;
  cabinet_id?: string | null;
  created_at: string;
  last_sign_in_at?: string | null;
  total_reports: number;
  unread_reports: number;
}

interface ReportRecord {
  id: string;
  created_at: string;
  page?: string | null;
  title?: string | null;
  description?: string | null;
  admin_read_at?: string | null;
  meta?: Record<string, unknown> | null;
}

interface ReportUser {
  id: string;
  email: string;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Erreur inconnue.';
}

export default function SettingsComptes() {
  const { isAdmin, isLoading: authLoading } = useUserRole();
  const location = useLocation();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(null);
  const [userReports, setUserReports] = useState<ReportRecord[]>([]);
  const [selectedReportUser, setSelectedReportUser] = useState<ReportUser | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const fetchUsersRequestIdRef = useRef(0);
  const DEBUG_COMPTES_REFRESH = isDebugEnabled('comptes');

  const [cabinets, setCabinets] = useState<CabinetRecord[]>([]);
  const [themes, setThemes] = useState<ThemeRecord[]>([]);
  const [cabinetsLoading, setCabinetsLoading] = useState(false);
  const [themesLoading, setThemesLoading] = useState(false);

  const [showCabinetModal, setShowCabinetModal] = useState(false);
  const [editingCabinet, setEditingCabinet] = useState<CabinetRecord | null>(null);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [editingTheme, setEditingTheme] = useState<ThemeRecord | null>(null);
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

      const usersList = await adminClient.listUsers();
      if (requestId !== fetchUsersRequestIdRef.current) return;
      setUsers(usersList);

      if (DEBUG_COMPTES_REFRESH) {
        // eslint-disable-next-line no-console
        console.debug('[SettingsComptes] fetchUsers:success', {
          reason,
          requestId,
          usersCount: usersList.length,
        });
      }
    } catch (err) {
      if (requestId === fetchUsersRequestIdRef.current) {
        setError(getErrorMessage(err));
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
      setCabinets(await adminClient.listCabinets());
    } catch (err) {
      console.error('[SettingsComptes] fetchCabinets error:', err);
    } finally {
      setCabinetsLoading(false);
    }
  };

  const fetchThemes = async () => {
    try {
      setThemesLoading(true);
      setThemes(await adminClient.listThemes());
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

  const openCabinetModal = (cabinet: CabinetRecord | null = null) => {
    setEditingCabinet(cabinet);
    setShowCabinetModal(true);
  };

  const closeCabinetModal = () => {
    setShowCabinetModal(false);
    setEditingCabinet(null);
  };

  const handleDeleteCabinet = async (cabinet: CabinetRecord) => {
    if (!confirm(`Supprimer le cabinet "${cabinet.name}" ?`)) return;

    try {
      setActionLoading(true);
      await adminClient.deleteCabinet(cabinet.id);
      fetchCabinets();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const openThemeModal = (theme: ThemeRecord | null = null) => {
    setEditingTheme(theme);
    setShowThemeModal(true);
  };

  const closeThemeModal = () => {
    setShowThemeModal(false);
    setEditingTheme(null);
  };

  const handleDeleteTheme = async (theme: ThemeRecord) => {
    if (theme.is_system) {
      setError('Les themes systeme ne peuvent pas etre supprimes.');
      return;
    }
    if (!confirm(`Supprimer le theme "${theme.name}" ?`)) return;

    try {
      setActionLoading(true);
      await adminClient.deleteTheme(theme.id);
      fetchThemes();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignUserCabinet = async (userId: string, cabinetId: string) => {
    try {
      setActionLoading(true);
      await adminClient.assignUserCabinet({ userId, cabinetId: cabinetId || null });
      triggerRefresh('assign_user_cabinet');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const closeUserModal = () => {
    setShowUserModal(false);
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Supprimer l'utilisateur ${email} ?`)) return;

    try {
      setActionLoading(true);
      await adminClient.deleteUser(userId);
      triggerRefresh('delete_user');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (userId: string, email: string) => {
    try {
      setActionLoading(true);
      await adminClient.resetPassword({ userId, email });
      alert('Email de reinitialisation envoye');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewReports = async (userId: string, userEmail: string) => {
    try {
      setReportLoading(true);
      setSelectedReportUser({ id: userId, email: userEmail });
      setSelectedReport(null);
      setUserReports([]);
      setShowReportModal(true);

      const reports = await adminClient.listIssueReports({ userId });
      setUserReports(reports);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setReportLoading(false);
    }
  };

  const handleSelectReport = (report: ReportRecord) => {
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

  const handleMarkAsRead = async (reportId: string) => {
    try {
      await adminClient.markIssueRead(reportId);

      triggerRefresh('mark_issue_read');
      if (selectedReportUser) {
        handleViewReports(selectedReportUser.id, selectedReportUser.email);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Supprimer definitivement ce signalement ?')) return;

    try {
      await adminClient.deleteIssue(reportId);

      setSelectedReport(null);
      triggerRefresh('delete_issue');
      if (selectedReportUser) {
        handleViewReports(selectedReportUser.id, selectedReportUser.email);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDeleteAllReports = async (userId?: string) => {
    if (!userId) return;
    if (!confirm('Supprimer tout l\'historique des signalements pour cet utilisateur ?')) return;

    try {
      await adminClient.deleteAllIssuesForUser(userId);
      handleCloseModal();
      triggerRefresh('delete_all_issues_for_user');
    } catch (err) {
      setError(getErrorMessage(err));
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

