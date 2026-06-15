// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PREVOYANCE_MAINTIEN_LEGAL_CODE } from '@/domain/prevoyance/constants';
import type {
  PrevoyanceMaintienEmployeurSettings,
  PrevoyanceRegimeSettings,
} from '@/domain/prevoyance/types';

import SettingsMemento from '../SettingsMemento';

let isAdmin = false;

const regime: PrevoyanceRegimeSettings = {
  code: 'salarie-cpam',
  label: 'Salarié secteur privé — CPAM',
  caisse: 'CPAM',
  population: 'salarie',
  defaultContractKind: 'collectif',
  year: 2026,
  data: {
    arret: {
      carences: { maladie: 3, accident: 0, hospitalisation: 0 },
      maxDurationDays: 1095,
      paliers: [
        {
          fromDay: 4,
          toDay: 1095,
          label: 'IJSS régime général',
          amount: { mode: 'formula', value: null, label: 'Formule régime' },
        },
      ],
    },
    invalidite: {
      paliers: [],
    },
    deces: {
      capital: { mode: 'formula', value: null, label: 'Capital décès forfaitaire' },
      doublementAccident: false,
      doubleEffet: false,
      renteConjoint: null,
      renteEducation: null,
    },
    cotisations: {
      mode: 'none',
      value: null,
      repartition: null,
    },
  },
  sources: {
    references: [],
    noRefReason:
      'Sources absentes dans cette fixture unitaire ; les références réelles sont portées par les seeds.',
  },
};

const maintien: PrevoyanceMaintienEmployeurSettings = {
  code: PREVOYANCE_MAINTIEN_LEGAL_CODE,
  label: 'Code du travail',
  year: 2026,
  data: {
    maintienEmployeur: {
      carenceDays: 7,
      minAncienneteYears: 1,
      paliers: [],
    },
  },
  sources: {
    references: [],
    noRefReason:
      'Sources absentes dans cette fixture unitaire ; les références réelles sont portées par les seeds.',
  },
};

const cacheMocks = vi.hoisted(() => ({
  getPrevoyanceRegimeSettings: vi.fn(),
  getPrevoyanceMaintienEmployeurSettings: vi.fn(),
  upsertPrevoyanceRegimeSettings: vi.fn(),
  upsertPrevoyanceMaintienEmployeurSettings: vi.fn(),
  invalidatePrevoyanceSettingsCache: vi.fn(),
}));

vi.mock('@/auth/useUserRole', () => ({
  useUserRole: () => ({
    role: isAdmin ? 'admin' : 'user',
    user: null,
    isAdmin,
    isLoading: false,
  }),
}));

vi.mock('@/utils/cache/prevoyanceSettingsCache', () => ({
  getPrevoyanceRegimeSettings: cacheMocks.getPrevoyanceRegimeSettings,
  getPrevoyanceMaintienEmployeurSettings: cacheMocks.getPrevoyanceMaintienEmployeurSettings,
  upsertPrevoyanceRegimeSettings: cacheMocks.upsertPrevoyanceRegimeSettings,
  upsertPrevoyanceMaintienEmployeurSettings: cacheMocks.upsertPrevoyanceMaintienEmployeurSettings,
  invalidatePrevoyanceSettingsCache: cacheMocks.invalidatePrevoyanceSettingsCache,
}));

function findButtonByClass(className: string, label: string): HTMLButtonElement {
  const button = screen
    .getAllByRole('button')
    .find(
      (item): item is HTMLButtonElement =>
        item instanceof HTMLButtonElement &&
        item.classList.contains(className) &&
        item.textContent?.includes(label) === true,
    );

  if (!button) throw new Error(`Bouton introuvable : ${label}`);
  return button;
}

async function openReadPart(user: ReturnType<typeof userEvent.setup>, label: string) {
  const button = await waitFor(() => findButtonByClass('settings-memento-part__header', label));
  if (button.getAttribute('aria-expanded') !== 'true') {
    await user.click(button);
  }
}

async function toggleReadChapter(user: ReturnType<typeof userEvent.setup>, label: string) {
  const button = await waitFor(() => {
    return findButtonByClass('settings-memento-read-chapter__header', label);
  });

  await user.click(button);
}

async function openReadChapter(user: ReturnType<typeof userEvent.setup>, label: string) {
  const button = await waitFor(() =>
    findButtonByClass('settings-memento-read-chapter__header', label),
  );
  if (button.getAttribute('aria-expanded') !== 'true') {
    await user.click(button);
  }
}

describe('SettingsMemento — prévoyance', () => {
  beforeEach(() => {
    isAdmin = false;
    cacheMocks.getPrevoyanceRegimeSettings.mockReset();
    cacheMocks.getPrevoyanceMaintienEmployeurSettings.mockReset();
    cacheMocks.upsertPrevoyanceRegimeSettings.mockReset();
    cacheMocks.upsertPrevoyanceMaintienEmployeurSettings.mockReset();
    cacheMocks.invalidatePrevoyanceSettingsCache.mockReset();
    cacheMocks.getPrevoyanceRegimeSettings.mockResolvedValue([regime]);
    cacheMocks.getPrevoyanceMaintienEmployeurSettings.mockResolvedValue([maintien]);
    cacheMocks.upsertPrevoyanceRegimeSettings.mockResolvedValue(undefined);
    cacheMocks.upsertPrevoyanceMaintienEmployeurSettings.mockResolvedValue(undefined);
  });

  it('rend les régimes prévoyance sous les entrées de lecture sans panneau monolithique', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    expect(
      screen.queryByPlaceholderText('Rechercher un régime, une caisse ou un code'),
    ).not.toBeInTheDocument();

    await openReadPart(user, 'Social et protection sociale');
    await openReadChapter(user, 'Prévoyance');

    expect(
      await screen.findByText('Salarié secteur privé — CPAM', {}, { timeout: 5_000 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Salarié secteur privé — CPAM/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Maintien employeur légal')).toBeInTheDocument();
    expect(screen.getByText('Contrats assurantiels')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /Prévoyance — régimes/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText('Rechercher un régime, une caisse ou un code'),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Modifier' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Enregistrer/i })).not.toBeInTheDocument();
    expect(document.querySelectorAll('.prevoyance-settings-page input')).toHaveLength(0);
  });

  it('sauvegarde un régime via le bouton global après fermeture du chapitre', async () => {
    isAdmin = true;
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openReadPart(user, 'Social et protection sociale');
    await openReadChapter(user, 'Prévoyance');

    const regimeButton = await screen.findByRole('button', {
      name: /Salarié secteur privé — CPAM/i,
    });
    await user.click(regimeButton);

    const regimeFrame = regimeButton.closest('.prevoyance-settings-regime');
    if (!(regimeFrame instanceof HTMLElement)) throw new Error('Régime prévoyance introuvable.');

    await user.click(within(regimeFrame).getByRole('button', { name: 'Modifier' }));
    const dialog = await screen.findByRole('dialog', { name: 'Modifier le régime' });

    expect(
      within(dialog).getByRole('button', { name: 'Valider les modifications' }),
    ).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Enregistrer' })).not.toBeInTheDocument();

    const codeInput = within(dialog).getAllByLabelText('Code')[0];
    await user.clear(codeInput);
    await user.type(codeInput, 'salarie-cpam-modifie');

    const labelInput = within(dialog).getAllByLabelText('Libellé')[0];
    await user.clear(labelInput);
    await user.type(labelInput, 'Salarié modifié — CPAM');
    await user.click(within(dialog).getByRole('button', { name: 'Valider les modifications' }));

    const globalSaveButton = await screen.findByRole('button', {
      name: 'Enregistrer les modifications',
    });
    await waitFor(() => {
      expect(globalSaveButton).toBeEnabled();
    });

    await toggleReadChapter(user, 'Prévoyance');
    await user.click(globalSaveButton);

    await waitFor(() => {
      expect(cacheMocks.upsertPrevoyanceRegimeSettings).toHaveBeenCalledTimes(1);
    });
    expect(cacheMocks.upsertPrevoyanceRegimeSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'salarie-cpam-modifie',
        label: 'Salarié modifié — CPAM',
      }),
    );
    expect(cacheMocks.upsertPrevoyanceMaintienEmployeurSettings).not.toHaveBeenCalled();
    expect(screen.getByText('Prévoyance et régimes enregistré.')).toBeInTheDocument();
  });
});
