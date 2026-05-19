import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import { DEBUG_AUTH } from '@/supabaseClient';
import { isDebugEnabled } from '@/utils/debugFlags';
import { useUserRole } from '@/auth/useUserRole';
import { UserInfoBanner } from '@/components/UserInfoBanner';
import CabinetEditModal from '@/pages/settings/components/CabinetEditModal';
import { CabinetFilterRail } from '@/pages/settings/components/CabinetFilterRail';
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
import {
  ALL_CABINETS_FILTER,
  NO_CABINET_FILTER,
  buildCabinetFilterItems,
  type CabinetFilterId,
} from './utils/adminUsersDirectory';
import './styles/comptes.css';

export default function SettingsComptes() {
  const { isAdmin, isLoading: authLoading } = useUserRole();
  const location = useLocation();
  const [error, setError] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedCabinetFilter, setSelectedCabinetFilter] =
    useState<CabinetFilterId>(ALL_CABINETS_FILTER);
  const DEBUG_COMPTES_REFRESH = isDebugEnabled('comptes');

  const usersHook = useAdminUsers(setError);
  const cabinetsHook = useAdminCabinets(setError);
  const themesHook = useAdminThemes(setError);
  const reportsHook = useAdminReports(setError, usersHook.fetchUsers);

  const refreshUsersAndCabinets = async (reason: string) => {
    await Promise.all([usersHook.fetchUsers(reason), cabinetsHook.fetchCabinets()]);
  };

  const cabinetFilterItems = useMemo(
    () =>
      buildCabinetFilterItems({
        users: usersHook.users,
        cabinets: cabinetsHook.cabinets,
      }),
    [cabinetsHook.cabinets, usersHook.users],
  );

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

  useEffect(() => {
    if (selectedCabinetFilter === ALL_CABINETS_FILTER) return;
    const filterStillExists =
      selectedCabinetFilter === NO_CABINET_FILTER ||
      cabinetsHook.cabinets.some((cabinet) => cabinet.id === selectedCabinetFilter);
    if (!filterStillExists || cabinetsHook.cabinets.length === 0) {
      setSelectedCabinetFilter(ALL_CABINETS_FILTER);
    }
  }, [cabinetsHook.cabinets, selectedCabinetFilter]);

  if (!isAdmin) {
    return (
      <div className="settings-comptes__state">
        <p>Vous n'avez pas les droits administrateurs pour acceder a cette page.</p>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="settings-comptes__state">
        <p>Chargement de l'authentification...</p>
      </div>
    );
  }

  const cabinetOptions = cabinetsHook.cabinets.map((cabinet) => ({
    value: cabinet.id,
    label: cabinet.name,
  }));

  return (
    <div className="settings-comptes">
      <UserInfoBanner />

      {error && (
        <div className="settings-feedback-message settings-feedback-message--error">{error}</div>
      )}

      {usersHook.loading ? (
        <p>Chargement...</p>
      ) : (
        <div className="settings-comptes__directory-layout">
          {cabinetsHook.cabinets.length > 0 && (
            <CabinetFilterRail
              items={cabinetFilterItems}
              selectedFilter={selectedCabinetFilter}
              onSelectFilter={setSelectedCabinetFilter}
            />
          )}

          <div className="admin-content settings-comptes__main">
            <SettingsUsersSection
              users={usersHook.users}
              cabinets={cabinetsHook.cabinets}
              cabinetFilter={selectedCabinetFilter}
              actionLoading={usersHook.actionLoading}
              onCreateUser={() => setShowUserModal(true)}
              onRefresh={() => void refreshUsersAndCabinets('manual')}
              onAssignUserCabinet={async (userId, cabinetId) => {
                await usersHook.handleAssignUserCabinet(userId, cabinetId);
                void cabinetsHook.fetchCabinets();
              }}
              onViewReports={reportsHook.handleViewReports}
              onResetPassword={usersHook.handleResetPassword}
              onDeleteUser={async (userId, email) => {
                await usersHook.handleDeleteUser(userId, email);
                void cabinetsHook.fetchCabinets();
              }}
            />

            <SettingsCabinetsSection
              cabinets={cabinetsHook.cabinets}
              cabinetsLoading={cabinetsHook.cabinetsLoading}
              onCreateCabinet={() => cabinetsHook.openCabinetModal()}
              onEditCabinet={cabinetsHook.openCabinetModal}
              onDeleteCabinet={async (cabinet) => {
                await cabinetsHook.handleDeleteCabinet(cabinet);
                void usersHook.fetchUsers('delete_cabinet');
              }}
            />

            <SettingsThemesSection
              themes={themesHook.themes}
              themesLoading={themesHook.themesLoading}
              onCreateTheme={() => themesHook.openThemeModal()}
              onEditTheme={themesHook.openThemeModal}
              onDeleteTheme={themesHook.handleDeleteTheme}
            />
          </div>
        </div>
      )}

      {cabinetsHook.showCabinetModal && (
        <CabinetEditModal
          cabinet={cabinetsHook.editingCabinet}
          themes={themesHook.themes}
          onClose={cabinetsHook.closeCabinetModal}
          onSuccess={() => void refreshUsersAndCabinets('save_cabinet')}
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
          onSuccess={() => void refreshUsersAndCabinets('create_user_invite')}
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
