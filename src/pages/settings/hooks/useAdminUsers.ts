import { useCallback, useRef, useState } from 'react';
import { adminClient } from '@/settings/admin/adminClient';
import type { UserRecord } from '@/settings/admin/adminClient';
import { isDebugEnabled } from '@/utils/debugFlags';

export function useAdminUsers(onError: (msg: string) => void) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const fetchUsersRequestIdRef = useRef(0);
  const DEBUG = isDebugEnabled('comptes');

  const fetchUsers = useCallback(async (reason = '') => {
    const requestId = ++fetchUsersRequestIdRef.current;
    try {
      setLoading(true);
      onError('');

      if (DEBUG) {
        // eslint-disable-next-line no-console
        console.debug('[SettingsComptes] fetchUsers:start', { reason, requestId });
      }

      const usersList = await adminClient.listUsers();
      if (requestId !== fetchUsersRequestIdRef.current) return;
      setUsers(usersList);

      if (DEBUG) {
        // eslint-disable-next-line no-console
        console.debug('[SettingsComptes] fetchUsers:success', {
          reason,
          requestId,
          usersCount: usersList.length,
        });
      }
    } catch (err) {
      if (requestId === fetchUsersRequestIdRef.current) {
        onError(err instanceof Error ? err.message : 'Erreur inconnue.');
      }
    } finally {
      if (requestId === fetchUsersRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [DEBUG, onError]);

  const handleAssignUserCabinet = async (userId: string, cabinetId: string) => {
    try {
      setActionLoading(true);
      onError('');
      await adminClient.assignUserCabinet({ userId, cabinetId: cabinetId || null });
      void fetchUsers('assign_user_cabinet');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Supprimer l'utilisateur ${email} ?`)) return;
    try {
      setActionLoading(true);
      onError('');
      await adminClient.deleteUser(userId);
      void fetchUsers('delete_user');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (userId: string, email: string) => {
    try {
      setActionLoading(true);
      onError('');
      await adminClient.resetPassword({ userId, email });
      alert('E-mail de réinitialisation envoyé');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setActionLoading(false);
    }
  };

  return {
    users,
    loading,
    actionLoading,
    fetchUsers,
    handleAssignUserCabinet,
    handleDeleteUser,
    handleResetPassword,
  };
}
