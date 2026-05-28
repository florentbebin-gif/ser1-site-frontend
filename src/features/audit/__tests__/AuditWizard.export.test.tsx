// @vitest-environment jsdom
/* eslint-disable ser1-colors/no-hardcoded-colors -- Fixtures de thème déterministes pour vérifier le payload PPTX. */
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_COLORS, type ThemeColors } from '@/settings/theme';
import AuditWizard from '../AuditWizard';
import { exportAuditPptx } from '../export/exportAudit';

const TEST_COLORS: ThemeColors = {
  ...DEFAULT_COLORS,
  c1: '#111111',
  c6: '#666666',
};

vi.mock('../export/exportAudit', () => ({
  exportAuditPptx: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/settings/ThemeProvider', () => ({
  useTheme: () => ({
    colors: TEST_COLORS,
  }),
}));

describe('AuditWizard export PPTX', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('rend le wizard et appelle la chaîne export PPTX mockée', async () => {
    render(<AuditWizard />);

    expect(screen.getByRole('heading', { name: 'Audit patrimonial' })).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('export-menu-button'));
    await userEvent.click(screen.getByRole('menuitem', { name: 'PowerPoint (.pptx)' }));

    await waitFor(() => expect(exportAuditPptx).toHaveBeenCalledTimes(1));
    expect(exportAuditPptx).toHaveBeenCalledWith(
      expect.objectContaining({
        colors: TEST_COLORS,
        dossier: expect.objectContaining({ version: '1.0.0' }),
      }),
    );
  });
});
