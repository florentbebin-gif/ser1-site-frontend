// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsComptes from '../SettingsComptes';
import { getVisibleSettingsRoutes } from '@/routes/settingsRoutes';

const useUserRoleMock = vi.fn();

vi.mock('@/auth/useUserRole', () => ({
  useUserRole: () => useUserRoleMock(),
}));

vi.mock('@/supabaseClient', () => ({
  DEBUG_AUTH: false,
}));

vi.mock('react-router', () => ({
  useLocation: () => ({ key: 'test-location' }),
}));

vi.mock('@/components/UserInfoBanner', () => ({
  UserInfoBanner: () => <div data-testid="user-info-banner" />,
}));

describe('SettingsComptes garde admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('masque la route Comptes pour les non-admins', () => {
    expect(getVisibleSettingsRoutes(false).some((route) => route.key === 'comptes')).toBe(false);
  });

  it('masque la route Prévoyance régimes pour les non-admins', () => {
    expect(getVisibleSettingsRoutes(false).some((route) => route.key === 'prevoyanceRegimes')).toBe(
      false,
    );
  });

  it("refuse l'acces direct a la page pour un non-admin", () => {
    useUserRoleMock.mockReturnValue({ isAdmin: false, isLoading: false });

    render(<SettingsComptes />);

    expect(
      screen.getByText("Vous n'avez pas les droits administrateurs pour accéder à cette page."),
    ).toBeInTheDocument();
  });
});
