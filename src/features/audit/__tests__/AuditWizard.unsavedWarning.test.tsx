// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AuditWizard from '../AuditWizard';

vi.mock('@/settings/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {},
  }),
}));

describe('AuditWizard warning modifications non exportées', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('active le statut non exporté et protège la fermeture après modification', async () => {
    render(<AuditWizard />);

    const cleanEvent = new Event('beforeunload', { cancelable: true });
    const cleanPreventDefault = vi.spyOn(cleanEvent, 'preventDefault');
    window.dispatchEvent(cleanEvent);

    expect(cleanPreventDefault).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Prénom'), 'Alice');

    expect(screen.getByRole('status')).toHaveTextContent('Modifications non exportées');

    const dirtyEvent = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
    const dirtyPreventDefault = vi.spyOn(dirtyEvent, 'preventDefault');
    window.dispatchEvent(dirtyEvent);

    await waitFor(() => expect(dirtyPreventDefault).toHaveBeenCalledTimes(1));
    expect(dirtyEvent.defaultPrevented).toBe(true);
  });
});
