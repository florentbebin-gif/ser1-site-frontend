// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AuditAvatarAppearancePicker } from '../AuditAvatarAppearancePicker';

describe('AuditAvatarAppearancePicker', () => {
  it('affiche quatre choix adultes et conserve skinTone au changement', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <AuditAvatarAppearancePicker
        label="Avatar Client"
        kind="homme"
        subject="adulte"
        appearance={{ skinTone: 'fonce', age: 'adulte' }}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Modifier avatar client' }));

    const dialog = screen.getByRole('dialog', { name: 'Avatar Client' });
    expect(within(dialog).getAllByRole('button')).toHaveLength(4);

    await user.click(within(dialog).getByRole('button', { name: 'Profil Grand-père' }));

    expect(onChange).toHaveBeenCalledWith({
      kind: 'homme',
      appearance: { skinTone: 'fonce', age: 'senior' },
    });
  });

  it('affiche deux choix enfant et ne mute pas skinTone silencieusement', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <AuditAvatarAppearancePicker
        label="Avatar Enfant"
        kind="garcon"
        subject="enfant"
        appearance={{ skinTone: 'fonce', age: 'senior' }}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Modifier avatar enfant' }));

    const dialog = screen.getByRole('dialog', { name: 'Avatar Enfant' });
    expect(within(dialog).getAllByRole('button')).toHaveLength(2);

    await user.click(within(dialog).getByRole('button', { name: 'Profil Fille' }));

    expect(onChange).toHaveBeenCalledWith({
      kind: 'fille',
      appearance: { skinTone: 'fonce', age: 'adulte' },
    });
  });
});
