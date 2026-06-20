// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { Suspense } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SettingsShell from '@/pages/SettingsShell';

const useUserRoleMock = vi.hoisted(() => vi.fn());

vi.mock('@/auth/useUserRole', () => ({
  useUserRole: () => useUserRoleMock(),
}));

vi.mock('../SettingsGeneral', () => ({
  default: () => <main data-testid="settings-general" />,
}));

vi.mock('../SettingsMemento', () => ({
  default: () => <main data-testid="settings-memento" />,
}));

vi.mock('../BaseCgRetraite', () => ({
  default: () => <main data-testid="settings-base-cg-retraite" />,
}));

vi.mock('../SettingsComptes', () => ({
  default: () => <main data-testid="settings-comptes" />,
}));

vi.mock('../SettingsDesignSystem', () => ({
  default: () => <main data-testid="settings-design-system" />,
}));

function renderSettingsShellAt(pathname: string) {
  window.history.pushState({}, '', pathname);

  return render(
    <Suspense fallback={<div data-testid="settings-loading" />}>
      <SettingsShell />
    </Suspense>,
  );
}

describe('SettingsShell garde adminOnly', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirige une URL adminOnly vers le mémento pour un non-admin', async () => {
    useUserRoleMock.mockReturnValue({ isAdmin: false, isLoading: false });

    renderSettingsShellAt('/settings/design-system');

    expect(await screen.findByTestId('settings-memento')).toBeInTheDocument();
    expect(screen.queryByTestId('settings-design-system')).not.toBeInTheDocument();
    expect(window.location.pathname).toBe('/settings/memento');
    expect(screen.queryByRole('button', { name: 'Design system' })).not.toBeInTheDocument();
  });

  it('conserve l’accès direct admin à la page Design system', async () => {
    useUserRoleMock.mockReturnValue({ isAdmin: true, isLoading: false });

    renderSettingsShellAt('/settings/design-system');

    expect(await screen.findByTestId('settings-design-system')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/settings/design-system');
    expect(screen.getByRole('button', { name: 'Design system' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
