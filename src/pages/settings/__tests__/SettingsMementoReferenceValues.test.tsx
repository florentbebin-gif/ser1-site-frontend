// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserRoleState } from '@/auth/useUserRole';
import { DEFAULT_MEMENTO_REFERENCE_VALUES } from '@/domain/settings-memento/referenceValues';
import { invalidateMementoReferenceValuesCache } from '@/utils/cache/mementoReferenceValuesCache';

import SettingsMemento from '../SettingsMemento';

let isAdmin = false;
const fromMock = vi.hoisted(() => vi.fn());
const upsertMock = vi.hoisted(() => vi.fn());

function makeReferenceValuesBuilder() {
  const listResult = { data: DEFAULT_MEMENTO_REFERENCE_VALUES, error: null };
  const writeResult = { data: null, error: null };

  const builder = {} as {
    select: () => typeof builder;
    order: () => Promise<typeof listResult>;
    upsert: typeof upsertMock;
  };

  builder.select = () => builder;
  builder.order = () => Promise.resolve(listResult);
  builder.upsert = upsertMock.mockResolvedValue(writeResult);

  return builder;
}

vi.mock('@/auth/useUserRole', () => ({
  useUserRole: (): UserRoleState => ({
    role: isAdmin ? 'admin' : 'user',
    user: null,
    isAdmin,
    isLoading: false,
  }),
}));

vi.mock('@/supabaseClient', () => ({
  supabase: {
    from: fromMock,
  },
}));

async function openReadPart(user: ReturnType<typeof userEvent.setup>, label: string) {
  const button = await waitFor(() => {
    const candidate = screen
      .getAllByRole('button')
      .find(
        (item): item is HTMLButtonElement =>
          item instanceof HTMLButtonElement &&
          item.classList.contains('settings-memento-part__header') &&
          item.textContent?.includes(label) === true,
      );

    if (!candidate) throw new Error(`Partie introuvable : ${label}`);
    return candidate;
  });

  await user.click(button);
}

describe('SettingsMemento — valeurs de référence', () => {
  beforeEach(() => {
    isAdmin = false;
    fromMock.mockReset();
    upsertMock.mockReset();
    fromMock.mockImplementation(() => makeReferenceValuesBuilder());
    invalidateMementoReferenceValuesCache();
  });

  it('affiche les produits réglementés en lecture pour un non-admin', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openReadPart(user, 'Chiffres clés et produits réglementés');

    expect(
      await screen.findByRole('heading', { name: 'Valeurs de référence' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Livret A — plafond')).toBeInTheDocument();
    expect(await screen.findByText('PEA-PME — plafond de versement')).toBeInTheDocument();
    expect(screen.queryByText('AGIRC-ARRCO — tranche T1')).not.toBeInTheDocument();

    const livretAInput = await screen.findByLabelText('Livret A — plafond — valeur');
    expect(livretAInput).toBeDisabled();
    expect(livretAInput).toHaveValue(22950);
    expect(
      screen.queryByRole('button', { name: 'Enregistrer les valeurs mémento' }),
    ).not.toBeInTheDocument();
  });

  it('laisse un admin éditer et enregistrer ces valeurs', async () => {
    isAdmin = true;
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openReadPart(user, 'Chiffres clés et produits réglementés');

    const livretAInput = await screen.findByLabelText('Livret A — plafond — valeur');
    expect(livretAInput).toBeEnabled();

    await user.clear(livretAInput);
    await user.type(livretAInput, '23000');
    await user.click(screen.getByRole('button', { name: 'Enregistrer les valeurs mémento' }));

    await waitFor(() => {
      expect(upsertMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            key: 'livret-a-plafond',
            value_numeric: 23000,
          }),
        ]),
        { onConflict: 'key' },
      );
    });
  });

  it('affiche les repères sociaux en lecture pour un non-admin', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openReadPart(user, 'Social et protection sociale');

    expect(
      await screen.findByRole('heading', { name: 'Valeurs sociales de référence' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('CSM — taux maximal')).toBeInTheDocument();
    expect(await screen.findByText('AGIRC-ARRCO — tranche T1')).toBeInTheDocument();
    expect(await screen.findByText('PEE — plafond d’abondement')).toBeInTheDocument();
    expect(screen.queryByText('Livret A — plafond')).not.toBeInTheDocument();

    const agircInput = await screen.findByLabelText('AGIRC-ARRCO — tranche T1 — valeur');
    expect(agircInput).toBeDisabled();
    expect(agircInput).toHaveValue('Employeur 4,72 % · salarié 3,15 % · total 7,87 %');
  });

  it('laisse un admin éditer et enregistrer une valeur sociale textuelle', async () => {
    isAdmin = true;
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openReadPart(user, 'Social et protection sociale');

    const agircInput = await screen.findByLabelText('AGIRC-ARRCO — tranche T1 — valeur');
    expect(agircInput).toBeEnabled();

    fireEvent.change(agircInput, {
      target: { value: 'Employeur 4,72 % / salarié 3,15 % / total 7,87 %' },
    });
    await user.click(screen.getByRole('button', { name: 'Enregistrer les valeurs mémento' }));

    await waitFor(() => {
      expect(upsertMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            key: 'agirc-arrco-t1',
            value_text: 'Employeur 4,72 % / salarié 3,15 % / total 7,87 %',
          }),
        ]),
        { onConflict: 'key' },
      );
    });
  });
});
