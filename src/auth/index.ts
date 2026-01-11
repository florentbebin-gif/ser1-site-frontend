/**
 * Auth module - Gestion de l'authentification et des rôles
 */

export { useUserRole, checkIsAdmin } from './useUserRole';
export type { UserRole, UserRoleState } from './useUserRole';

export { PrivateRoute } from './PrivateRoute';
export { AdminGate, useAdminAction } from './AdminGate';
export { useAuth, AuthProvider } from './AuthProvider';
export type { AuthState, AuthRole } from './AuthProvider';
