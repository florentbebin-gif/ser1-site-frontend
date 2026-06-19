// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_FISCALITY_SETTINGS,
  DEFAULT_PASS_HISTORY,
  DEFAULT_PS_SETTINGS,
  DEFAULT_TAX_SETTINGS,
} from '@/constants/settingsDefaults';

import type { UserRoleState } from '@/auth/useUserRole';

import SettingsMemento from '../SettingsMemento';

let isAdmin = false;

type SettingsTable = 'tax_settings' | 'ps_settings' | 'fiscality_settings' | 'pass_history';

function makeSettingsBuilder(table: SettingsTable) {
  if (table === 'pass_history') {
    const passResult = {
      data: Object.entries(DEFAULT_PASS_HISTORY).map(([year, pass_amount]) => ({
        year: Number(year),
        pass_amount,
      })),
      error: null,
    };
    const passBuilder = {} as {
      select: () => typeof passBuilder;
      order: () => Promise<typeof passResult>;
    };

    passBuilder.select = vi.fn(() => passBuilder);
    passBuilder.order = vi.fn(() => Promise.resolve(passResult));
    return passBuilder;
  }

  const listResult = {
    data: [
      {
        data:
          table === 'tax_settings'
            ? DEFAULT_TAX_SETTINGS
            : table === 'ps_settings'
              ? DEFAULT_PS_SETTINGS
              : DEFAULT_FISCALITY_SETTINGS,
      },
    ],
    error: null,
  };

  const builder = {} as {
    select: () => typeof builder;
    eq: () => typeof builder;
    then: PromiseLike<typeof listResult>['then'];
  };

  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.then = (onFulfilled, onRejected) =>
    Promise.resolve(listResult).then(onFulfilled, onRejected);

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
    from: vi.fn((table: SettingsTable) => makeSettingsBuilder(table)),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

function findButtonByClass(className: string, label: string): HTMLButtonElement {
  const button = screen
    .getAllByRole('button')
    .find(
      (candidate): candidate is HTMLButtonElement =>
        candidate instanceof HTMLButtonElement &&
        candidate.classList.contains(className) &&
        candidate.textContent?.includes(label) === true,
    );

  if (!button) throw new Error(`Bouton introuvable : ${label}`);
  return button;
}

async function openReadPart(user: ReturnType<typeof userEvent.setup>, label: string) {
  const button = findButtonByClass('settings-memento-part__header', label);
  if (button.getAttribute('aria-expanded') !== 'true') {
    await user.click(button);
  }
}

async function openReadChapter(user: ReturnType<typeof userEvent.setup>, label: string) {
  const button = findButtonByClass('settings-memento-read-chapter__header', label);
  if (button.getAttribute('aria-expanded') !== 'true') {
    await user.click(button);
  }
}

const INTERNAL_WORDS =
  /\b(?:SER1|simulateur|simulateurs|settings|param[eè]tre|param[eè]tres|moteur|moteurs|registry)\b/i;

function expectReadZonesWithoutInternalWords(container: HTMLElement): void {
  const readZones = container.querySelectorAll('.settings-memento-read-zone--lecture');

  expect(readZones.length).toBeGreaterThan(0);
  for (const readZone of readZones) {
    expect(readZone).not.toHaveTextContent(INTERNAL_WORDS);
  }
}

describe('SettingsMemento — lecture éditoriale', () => {
  beforeEach(() => {
    isAdmin = false;
  });

  it('affiche la fiscalité comme aide-mémoire de dispositifs', async () => {
    const user = userEvent.setup();
    const { container } = render(<SettingsMemento />);

    await openReadPart(user, 'Fiscalité');
    await openReadChapter(user, 'Fiscalité foyer');

    expect(await screen.findByText('Impôt sur le revenu')).toBeInTheDocument();
    expect(screen.getByText('Revenus du capital')).toBeInTheDocument();
    expect(screen.getAllByText('IFI').length).toBeGreaterThan(0);
    expect(screen.getByText('Contributions spécifiques')).toBeInTheDocument();
    expect(screen.getByText('Niches fiscales')).toBeInTheDocument();
    expect(await screen.findByText('Barème de l’impôt sur le revenu')).toBeInTheDocument();
    expect(screen.getByText('Abattement DOM sur l’IR')).toBeInTheDocument();
    expect(screen.getByText('Prélèvement forfaitaire unique')).toBeInTheDocument();
    expect(screen.getByText('CEHR / CDHR')).toBeInTheDocument();
    expect(screen.getAllByText('Impôt sur la fortune immobilière').length).toBeGreaterThan(0);
    expect(screen.queryByText('Patrimoine immobilier taxable')).not.toBeInTheDocument();
    expect(screen.queryByText('Fiscalité du foyer')).not.toBeInTheDocument();
    expect(container.querySelectorAll('input:not([type="search"])')).toHaveLength(0);
    expectReadZonesWithoutInternalWords(container);
  });

  it('affiche le droit civil comme aide-mémoire de dispositifs', async () => {
    const user = userEvent.setup();
    const { container } = render(<SettingsMemento />);

    await openReadPart(user, 'Droit civil');
    await openReadChapter(user, 'Foyer');

    expect(screen.getByText('Composition familiale')).toBeInTheDocument();
    expect(screen.getByText('Capacité patrimoniale')).toBeInTheDocument();
    expect(screen.getByText('Personnes à protéger')).toBeInTheDocument();

    await openReadChapter(user, 'Civil');

    expect(screen.getByText('Régime matrimonial')).toBeInTheDocument();
    expect(screen.getByText('Conjoint survivant')).toBeInTheDocument();
    expect(screen.getByText('Réserve et libéralités')).toBeInTheDocument();
    expect(await screen.findByText('Régimes matrimoniaux & PACS')).toBeInTheDocument();
    expect(screen.getByText('Avantages matrimoniaux')).toBeInTheDocument();
    expect(screen.queryByText('PACS et union libre')).not.toBeInTheDocument();
    expect(screen.queryByText('Réserve et quotité disponible')).not.toBeInTheDocument();
    expectReadZonesWithoutInternalWords(container);
  });

  it('affiche sociétés et placements sans le référentiel contrats déplacé', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openReadPart(user, 'Impôt sur les sociétés et placements');
    await openReadChapter(user, 'Société');

    expect(await screen.findByText('Taux IS')).toBeInTheDocument();
    expect(screen.getByText('Quote-part mère-fille')).toBeInTheDocument();
    expect(screen.getByText('Déductibilité des intérêts CCA')).toBeInTheDocument();
    expect(screen.queryByText('Titres et opérations de capital')).not.toBeInTheDocument();
    expect(screen.queryByText('Comptables et sociétés')).not.toBeInTheDocument();

    await openReadChapter(user, 'Placements');

    expect(await screen.findByText('Enveloppes de placement')).toBeInTheDocument();
    expect(await screen.findByText('Revenus du capital')).toBeInTheDocument();
    expect(
      await screen.findByText('Prélèvements sociaux sur patrimoine et capital'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: 'Audience' })).not.toBeInTheDocument();
  });

  it('affiche successions et libéralités avec les valeurs DMTG en lecture', async () => {
    const user = userEvent.setup();
    const { container } = render(<SettingsMemento />);

    await openReadPart(user, 'Successions et libéralités');
    await openReadChapter(user, 'Transmission');

    expect(await screen.findByText('Ligne directe (enfants, petits-enfants)')).toBeInTheDocument();
    expect(await screen.findByText('Donation & rappel fiscal')).toBeInTheDocument();
    expect(await screen.findByText('Assurance-vie décès')).toBeInTheDocument();
    expect(screen.getAllByText('Assurance-vie au décès').length).toBeGreaterThan(0);
    expect(screen.queryByText('Transmission, DMTG et succession')).not.toBeInTheDocument();
    expect(container.querySelectorAll('input:not([type="search"])')).toHaveLength(0);
    expect(
      screen.queryByRole('button', { name: /Enregistrer les paramètres DMTG & succession/i }),
    ).not.toBeInTheDocument();

    await openReadChapter(user, 'Transmission entreprise');

    expect(screen.getAllByText('Pacte Dutreil').length).toBeGreaterThan(0);
    expect(screen.getByText('Donation de titres')).toBeInTheDocument();
    expect(screen.getByText('Paiement des droits')).toBeInTheDocument();
  });

  it('affiche les blocs civils sous les entrées de droit civil', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openReadPart(user, 'Droit civil');
    await openReadChapter(user, 'Civil');

    expect((await screen.findAllByText(/Réserve héréditaire/)).length).toBeGreaterThan(1);
    expect(screen.getAllByText(/Droits du conjoint survivant/).length).toBeGreaterThan(0);
    expect(screen.getByText('Régimes matrimoniaux & PACS')).toBeInTheDocument();
    expect(screen.getByText('Avantages matrimoniaux')).toBeInTheDocument();
  });

  it('rend le lexique dans la partie dédiée', async () => {
    const user = userEvent.setup();
    const { container } = render(<SettingsMemento />);

    await openReadPart(user, 'Lexique');

    expect(screen.getAllByText('Civil et transmission').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Fiscalité et placements').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Social et retraite').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Acquêts').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Quotité disponible').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Plus-value').length).toBeGreaterThan(0);
    expect(screen.getAllByText('PER').length).toBeGreaterThan(0);
    expect(screen.getAllByText('PER individuel').length).toBeGreaterThan(0);
    expectReadZonesWithoutInternalWords(container);
  });
});
