// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_COLORS } from '@/settings/theme';
import { adminClient } from '@/settings/admin/adminClient';
import ThemeEditModal from './ThemeEditModal';

vi.mock('@/settings/admin/adminClient', () => ({
  adminClient: {
    createTheme: vi.fn(),
    updateTheme: vi.fn(),
  },
}));

describe('ThemeEditModal', () => {
  it('préremplit un nouveau thème avec Cuivre tranché', () => {
    render(<ThemeEditModal onClose={vi.fn()} onSuccess={vi.fn()} />);

    expect(screen.getByPlaceholderText('Ex: Thème cabinet')).toBeInTheDocument();
    expect(screen.getByDisplayValue(DEFAULT_COLORS.c1)).toBeInTheDocument();
    expect(screen.getByDisplayValue(DEFAULT_COLORS.c6)).toBeInTheDocument();
  });

  it('crée un thème avec la palette Cuivre tranché par défaut', async () => {
    const user = userEvent.setup();
    const cuivrePalette = { ...DEFAULT_COLORS };
    vi.mocked(adminClient.createTheme).mockResolvedValue({
      id: 'theme-cuivre',
      name: 'Cabinet cuivre',
      palette: cuivrePalette,
      is_system: false,
    });

    render(<ThemeEditModal onClose={vi.fn()} onSuccess={vi.fn()} />);

    await user.type(screen.getByLabelText('Nom du thème *'), 'Cabinet cuivre');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(adminClient.createTheme).toHaveBeenCalledWith({
      name: 'Cabinet cuivre',
      palette: cuivrePalette,
    });
  });
});
