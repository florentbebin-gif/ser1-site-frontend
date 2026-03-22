import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { DEBUG_AUTH } from '@/supabaseClient';
import { isDebugEnabled } from '@/utils/debugFlags';
import { useUserRole } from '@/auth/useUserRole';
import { UserInfoBanner } from '@/components/UserInfoBanner';
import CabinetEditModal from '@/pages/settings/components/CabinetEditModal';
import {
  SettingsCabinetsSection,
  SettingsThemesSection,
  SettingsUsersSection,
} from '@/pages/settings/components/SettingsComptesSections';
import SettingsReportsModal from '@/pages/settings/components/SettingsReportsModal';
import ThemeEditModal from '@/pages/settings/components/ThemeEditModal';
import UserInviteModal from '@/pages/settings/components/UserInviteModal';
import { useAdminCabinets } from './hooks/useAdminCabinets';
import { useAdminReports } from './hooks/useAdminReports';
import { useAdminThemes } from './hooks/useAdminThemes';
import { useAdminUsers } from './hooks/useAdminUsers';
import './SettingsComptes.css';

export default function SettingsComptes() {
  const { isAdmin, isLoading: authLoading } = useUserRole();
  const location = useLocation();
  const [error, setError] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const DEBUG_COMPTES_REFRESH = isDebugEnabled('comptes');

  const usersHook = useAdminUsers(setError);
  const cabinetsHook = useAdminCabinets(setError);
  const themesHook = useAdminThemes(setError);
  const reportsHook = useAdminReports(setError, usersHook.fetchUsers);

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

    void usersHook.fetchUsers('effect');
    void cabinetsHook.fetchCabinets();
    void themesHook.fetchThemes();
  // fetchUsers/fetchCabinets/fetchThemes are stable (useCallback with empty or stable deps)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, authLoading, location.key, DEBUG_COMPTES_REFRESH]);

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

  const cabinetOptions = cabinetsHook.cabinets.map((cabinet) => ({
    value: cabinet.id,
    label: cabinet.name,
  }));

  return (
    <div className="settings-comptes" style={{ marginTop: 16 }}>
      <UserInfoBanner />

      {error && <div className="alert error">{error}</div>}

      {usersHook.loading ? (
        <p>Chargement...</p>
      ) : (
        <div className="admin-content">
          <SettingsCabinetsSection
            cabinets={cabinetsHook.cabinets}
            cabinetsLoading={cabinetsHook.cabinetsLoading}
            onCreateCabinet={() => cabinetsHook.openCabinetModal()}
            onEditCabinet={cabinetsHook.openCabinetModal}
            onDeleteCabinet={cabinetsHook.handleDeleteCabinet}
          />

          <SettingsThemesSection
            themes={themesHook.themes}
            themesLoading={themesHook.themesLoading}
            onCreateTheme={() => themesHook.openThemeModal()}
            onEditTheme={themesHook.openThemeModal}
            onDeleteTheme={themesHook.handleDeleteTheme}
          />

          <SettingsUsersSection
            users={usersHook.users}
            cabinets={cabinetsHook.cabinets}
            actionLoading={usersHook.actionLoading}
            onCreateUser={() => setShowUserModal(true)}
            onRefresh={() => void usersHook.fetchUsers('manual')}
            onAssignUserCabinet={usersHook.handleAssignUserCabinet}
            onViewReports={reportsHook.handleViewReports}
            onResetPassword={usersHook.handleResetPassword}
            onDeleteUser={usersHook.handleDeleteUser}
          />
        </div>
      )}

      {cabinetsHook.showCabinetModal && (
        <CabinetEditModal
          cabinet={cabinetsHook.editingCabinet}
          themes={themesHook.themes}
          onClose={cabinetsHook.closeCabinetModal}
          onSuccess={cabinetsHook.fetchCabinets}
        />
      )}

      {themesHook.showThemeModal && (
        <ThemeEditModal
          theme={themesHook.editingTheme}
          onClose={themesHook.closeThemeModal}
          onSuccess={themesHook.fetchThemes}
        />
      )}

      {showUserModal && (
        <UserInviteModal
          cabinetOptions={cabinetOptions}
          cabinetsLoading={cabinetsHook.cabinetsLoading}
          onClose={() => setShowUserModal(false)}
          onSuccess={() => void usersHook.fetchUsers('create_user_invite')}
        />
      )}

      <SettingsReportsModal
        show={reportsHook.showReportModal}
        selectedReport={reportsHook.selectedReport}
        selectedReportUser={reportsHook.selectedReportUser}
        reportLoading={reportsHook.reportLoading}
        userReports={reportsHook.userReports}
        onClose={reportsHook.handleCloseModal}
        onBackToList={reportsHook.handleBackToList}
        onSelectReport={reportsHook.handleSelectReport}
        onDeleteAllReports={reportsHook.handleDeleteAllReports}
        onMarkAsRead={reportsHook.handleMarkAsRead}
        onDeleteReport={reportsHook.handleDeleteReport}
      />
    </div>
  );
}
