// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { configure, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserRoleState } from '@/auth/useUserRole';
import type { MementoEntry, MementoStatus } from '@/domain/settings-memento';

import SettingsMemento from '../SettingsMemento';
import MementoEntryRow from '../memento/MementoEntryRow';
import { MementoReferenceLinks } from '../memento/MementoReadableEntry';

// Les vues calculateurs et audit sont chargées en lazy (double `lazy()` en série) :
// sous la charge de la suite complète en CI, le timeout async par défaut (1 s) expire avant
// le montage. On élargit le timeout async et le testTimeout pour ce fichier uniquement.
configure({ asyncUtilTimeout: 5_000 });
vi.setConfig({ testTimeout: 15_000 });

let isAdmin = true;
const fromMock = vi.hoisted(() => vi.fn());
const rpcMock = vi.hoisted(() => vi.fn());
type TestUser = ReturnType<typeof userEvent.setup>;
type RoleName = RegExp | string;

const ENTRY_COUVERTE: MementoEntry = {
  chapterId: 'fiscalite-foyer',
  key: 'fiscalite-foyer.ir',
  label: 'Impôt sur le revenu',
  description: 'Couverture doctrinale des paramètres IR centralisés.',
  status: 'couvert',
  statusReason: 'Sources officielles déjà portées par le registre settings.',
  priority: 'critique',
  ownerPagePath: '/settings/memento',
  registryKeys: [],
  claimKeys: ['ir.bareme'],
  refIds: [],
  coverageSources: [],
  relatedSimulatorIds: ['ir'],
};
const FISCALITE_FOYER_TABS = /Sections du chapitre Fiscalité foyer/i;

function makeSettingsBuilder() {
  const listResult = { data: [], error: null };
  const singleResult = { data: null, error: { code: 'PGRST116' } };
  const writeResult = { data: null, error: null };

  const builder = {} as {
    select: () => typeof builder;
    eq: () => typeof builder;
    order: () => Promise<typeof listResult>;
    maybeSingle: () => Promise<typeof singleResult>;
    upsert: () => Promise<typeof writeResult>;
    then: PromiseLike<typeof listResult>['then'];
  };

  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.order = vi.fn(() => Promise.resolve(listResult));
  builder.maybeSingle = vi.fn(() => Promise.resolve(singleResult));
  builder.upsert = vi.fn(() => Promise.resolve(writeResult));
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
    from: fromMock,
    rpc: rpcMock,
  },
}));

vi.mock('@/utils/cache/fiscalSettingsCache', () => ({
  invalidate: vi.fn(),
  broadcastInvalidation: vi.fn(),
}));

const entryWithStatus = (status: MementoStatus): MementoEntry => ({
  ...ENTRY_COUVERTE,
  key: 'fiscalite-foyer.ifi',
  label: 'IFI',
  status,
  statusReason: 'Contenu planifié, aucune page propriétaire active.',
});

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

async function openAdminSection(user: TestUser, label: string) {
  const button = findButtonByClass('settings-memento-admin-section__header', label);
  if (button.getAttribute('aria-expanded') !== 'true') {
    await user.click(button);
  }
}

async function openReadPart(user: TestUser, label: string) {
  const button = findButtonByClass('settings-memento-part__header', label);
  if (button.getAttribute('aria-expanded') !== 'true') {
    await user.click(button);
  }
}

async function openReadChapter(user: TestUser, label: string) {
  const button = findButtonByClass('settings-memento-read-chapter__header', label);
  if (button.getAttribute('aria-expanded') !== 'true') {
    await user.click(button);
  }
}

async function selectMementoTab(user: TestUser, tablistName: RoleName, tabName: RoleName) {
  const tablist = await screen.findByRole('tablist', { name: tablistName });
  const tab = within(tablist).getByRole('tab', { name: tabName });
  await user.click(tab);
}

async function openAuditChapter(user: TestUser, label: string) {
  const button = await waitFor(() => findButtonByClass('settings-memento-chapter__header', label));
  if (button.getAttribute('aria-expanded') !== 'true') {
    await user.click(button);
  }
}

async function openSubAccordion(user: TestUser, name: RoleName) {
  const button = await screen.findByRole('button', { name });
  if (button.getAttribute('aria-expanded') !== 'true') {
    await user.click(button);
  }
}

describe('MementoEntryRow', () => {
  it('rend un lien propriétaire seulement pour une entrée exploitable', () => {
    render(<MementoEntryRow entry={ENTRY_COUVERTE} />);

    expect(screen.getByRole('link', { name: /ouvrir la page propriétaire/i })).toHaveAttribute(
      'href',
      '/settings/memento',
    );
  });

  it.each(['planned', 'absent', 'blocked_missing_official_source'] as const)(
    'ne rend ni lien ni action pour une entrée %s',
    (status) => {
      const { container } = render(<MementoEntryRow entry={entryWithStatus(status)} />);

      expect(container.querySelectorAll('a, button')).toHaveLength(0);
      expect(screen.getAllByText('Mémento').length).toBeGreaterThan(0);
    },
  );
});

describe('MementoReferenceLinks', () => {
  it('rend une référence PDF institutionnelle qualifiée sans exposer son URL brute', () => {
    const { container } = render(
      <MementoReferenceLinks refIds={['carpv-statuts-retraite-prevoyance']} />,
    );

    const link = screen.getByRole('link', { name: 'Statuts de la section professionnelle' });

    expect(link).toHaveAttribute('href', expect.stringContaining('.pdf'));
    expect(container).not.toHaveTextContent(/\.pdf/i);
    expect(screen.queryByText('Références à qualifier.')).not.toBeInTheDocument();
  });
});

describe('SettingsMemento', () => {
  beforeEach(() => {
    isAdmin = true;
    fromMock.mockReset();
    fromMock.mockImplementation(() => makeSettingsBuilder());
    rpcMock.mockReset();
    rpcMock.mockResolvedValue({ data: null, error: null });
  });

  it('rend directement le mémento sans sélecteur de mode ni bloc intro redondant', () => {
    render(<SettingsMemento />);

    expect(
      screen.getByRole('heading', { name: 'Mémento patrimonial & social' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Lire le mémento' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Sommaire du mémento')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Paramètres calculateurs/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Audit & sources/i })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('masque les sections admin aux non-admins', () => {
    isAdmin = false;

    render(<SettingsMemento />);

    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Paramètres calculateurs/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Pilotage mises à jour/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Audit & sources/i })).not.toBeInTheDocument();
  });

  it('affiche le pilotage admin de mise à jour sans champ de valeur', async () => {
    const user = userEvent.setup();
    const { container } = render(<SettingsMemento />);

    await openAdminSection(user, 'Pilotage mises à jour');

    expect(await screen.findByText('Chaîne de mise à jour')).toBeInTheDocument();
    expect(screen.getByText('bindings settings-references')).toBeInTheDocument();
    expect(screen.getByText('Agent IA dans le repo')).toBeInTheDocument();
    expect(screen.getByText('Validation humaine')).toBeInTheDocument();
    expect(screen.getByText('npm run check:settings-references')).toBeInTheDocument();
    expect(screen.getByText('npm run check')).toBeInTheDocument();
    expect(screen.getByText('Doit rester à zéro')).toBeInTheDocument();
    expect(screen.getByText(/D - Paramètres prêts : \d+/)).toBeInTheDocument();
    expect(container.querySelectorAll('input:not([type="search"])')).toHaveLength(0);
  });

  it('garde les parties de lecture fermées par défaut sans métadonnées techniques', () => {
    render(<SettingsMemento />);

    const partButtons = screen
      .getAllByRole('button')
      .filter((button) => button.classList.contains('settings-memento-part__header'));
    expect(partButtons.length).toBeGreaterThan(0);
    for (const button of partButtons) {
      expect(button).toHaveAttribute('aria-expanded', 'false');
    }
    expect(screen.queryByText('Page propriétaire')).not.toBeInTheDocument();
    expect(screen.queryByText('/settings/memento')).not.toBeInTheDocument();
    expect(screen.queryByText('coverageSources')).not.toBeInTheDocument();
    expect(screen.queryByText('Couverture simulateurs')).not.toBeInTheDocument();
    expect(screen.queryByText('Impôt sur le revenu du foyer')).not.toBeInTheDocument();
  });

  it('structure un chapitre de lecture en onglets accessibles sans pastille dans Lire', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openReadPart(user, 'Fiscalité');
    await openReadChapter(user, 'Fiscalité foyer');

    const tablist = await screen.findByRole('tablist', { name: FISCALITE_FOYER_TABS });
    const lireTab = within(tablist).getByRole('tab', { name: 'Lire' });
    const parametersTab = within(tablist).getByRole('tab', {
      name: 'Paramètres de référence',
    });
    const sourcesTab = within(tablist).getByRole('tab', { name: 'Sources & couverture' });

    expect(lireTab).toHaveAttribute('aria-selected', 'true');
    const lirePanel = screen.getByRole('tabpanel', { name: 'Lire' });
    expect(within(lirePanel).queryByText(/A - Couverture :/)).not.toBeInTheDocument();

    lireTab.focus();
    await user.keyboard('{ArrowRight}');
    expect(parametersTab).toHaveAttribute('aria-selected', 'true');

    await user.click(sourcesTab);
    expect(sourcesTab).toHaveAttribute('aria-selected', 'true');
    const sourcesPanel = screen.getByRole('tabpanel', { name: 'Sources & couverture' });
    expect(within(sourcesPanel).getAllByText(/A - Couverture :/).length).toBeGreaterThan(0);
  });

  it('rend le mémento lisible avec références dans la zone sources sans IDs bruts', async () => {
    const user = userEvent.setup();
    const { container } = render(<SettingsMemento />);

    await openReadPart(user, 'Fiscalité');
    await openReadChapter(user, 'Fiscalité foyer');

    expect((await screen.findAllByText('Impôt sur le revenu du foyer')).length).toBeGreaterThan(0);
    await selectMementoTab(user, FISCALITE_FOYER_TABS, 'Sources & couverture');
    expect(screen.getAllByText('Références :').length).toBeGreaterThan(0);
    expect(screen.queryByText('Sources officielles')).not.toBeInTheDocument();
    expect(screen.queryByText('Utilisé par')).not.toBeInTheDocument();
    expect(screen.getAllByRole('link').some((link) => link.getAttribute('href'))).toBe(true);
    expect(container).not.toHaveTextContent(/claimKeys|ownerPagePath|coverageSources|cgi-/i);
    expect(container).not.toHaveTextContent(/\.pdf|support professionnel externe|source protégée/i);
  });

  it('réserve les pastilles de couverture à la zone sources pour les admins', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openReadPart(user, 'Fiscalité');
    await openReadChapter(user, 'Fiscalité foyer');

    expect((await screen.findAllByText('Impôt sur le revenu du foyer')).length).toBeGreaterThan(0);
    expect(screen.queryByText('Périmètre en cours')).not.toBeInTheDocument();
    await selectMementoTab(user, FISCALITE_FOYER_TABS, 'Sources & couverture');
    expect(screen.getAllByText('A - Couverture : partielle').length).toBeGreaterThan(0);
  });

  it('ne rend pas les pastilles de prudence pour un non-admin', async () => {
    isAdmin = false;
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openReadPart(user, 'Fiscalité');
    await openReadChapter(user, 'Fiscalité foyer');

    expect((await screen.findAllByText('Impôt sur le revenu du foyer')).length).toBeGreaterThan(0);
    await selectMementoTab(user, FISCALITE_FOYER_TABS, 'Sources & couverture');
    expect(screen.queryByText('Périmètre en cours')).not.toBeInTheDocument();
    expect(screen.queryByText('Chantier prévu')).not.toBeInTheDocument();
    expect(screen.queryByText('À manier avec prudence')).not.toBeInTheDocument();
  });

  it('rend le barème IR en lecture seule pour un non-admin', async () => {
    isAdmin = false;
    const user = userEvent.setup();
    const { container } = render(<SettingsMemento />);

    await openReadPart(user, 'Fiscalité');
    await openReadChapter(user, 'Fiscalité foyer');
    await selectMementoTab(user, FISCALITE_FOYER_TABS, 'Paramètres de référence');

    expect(await screen.findByText('Barème de l’impôt sur le revenu')).toBeInTheDocument();
    expect(screen.getByText('Abattement DOM sur l’IR')).toBeInTheDocument();
    expect(screen.getByText('Prélèvement forfaitaire unique')).toBeInTheDocument();
    expect(container).not.toHaveTextContent(/Lecture :|Écriture :/);
    expect(container.querySelectorAll('input:not([type="search"])')).toHaveLength(0);
    expect(
      screen.queryByRole('button', { name: /Enregistrer les paramètres impôts/i }),
    ).not.toBeInTheDocument();
  });

  it('rend le barème IR éditable pour un admin depuis la lecture', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openReadPart(user, 'Fiscalité');
    await openReadChapter(user, 'Fiscalité foyer');
    await selectMementoTab(user, FISCALITE_FOYER_TABS, 'Paramètres de référence');

    expect(await screen.findByText('Barème de l’impôt sur le revenu')).toBeInTheDocument();

    const inputs = screen.getAllByRole('spinbutton');

    expect(inputs.length).toBeGreaterThan(0);
    for (const input of inputs) {
      expect(input).not.toBeDisabled();
    }
    expect(
      screen.queryByRole('button', { name: /Enregistrer les paramètres impôts/i }),
    ).not.toBeInTheDocument();
  });

  it('rend audit, entrées techniques et couverture seulement dans la vue audit', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    expect(screen.queryByTestId('memento-coverage-ir')).not.toBeInTheDocument();

    await openAdminSection(user, 'Audit & sources');
    await openAuditChapter(user, 'Fiscalité foyer');
    await openSubAccordion(user, /Entrées techniques/);

    expect(screen.getAllByText('Priorité critique').length).toBeGreaterThan(0);
    expect(screen.getByText('Registre settings Fiscalité du foyer')).toBeInTheDocument();

    await openSubAccordion(user, /Couverture simulateurs/);
    expect(await screen.findByTestId('memento-coverage-ir')).toBeInTheDocument();
  });

  it('filtre l’audit par intention et priorité', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openAdminSection(user, 'Audit & sources');
    await user.selectOptions(
      await screen.findByLabelText('Intention métier'),
      'verifier-fiscalite',
    );
    await openAuditChapter(user, 'Fiscalité foyer');
    await openSubAccordion(user, /Entrées techniques/);

    expect(screen.getByText('Impôt sur le revenu du foyer')).toBeInTheDocument();
    expect(
      screen.queryByText('Régime matrimonial et protection du conjoint'),
    ).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Priorité métier'), 'utile');

    expect(screen.getByText('Niches fiscales et réductions d’impôt')).toBeInTheDocument();
    expect(screen.queryByText('Impôt sur le revenu du foyer')).not.toBeInTheDocument();
  });

  it('filtre l’audit par recherche', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openAdminSection(user, 'Audit & sources');
    await user.type(await screen.findByLabelText('Recherche mémento'), 'cession');
    await openAuditChapter(user, 'Société');
    await openSubAccordion(user, /Couverture simulateurs/);

    expect(await screen.findByTestId('memento-coverage-cession-titres')).toBeInTheDocument();
  });

  it('filtre l’audit par statut et chapitre', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openAdminSection(user, 'Audit & sources');
    await user.selectOptions(await screen.findByLabelText('Attendu simulateur'), 'couvert');
    await openAuditChapter(user, 'Fiscalité foyer');
    await openSubAccordion(user, /Couverture simulateurs/);

    expect(await screen.findByTestId('memento-coverage-ir')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Attendu simulateur'), 'all');
    await user.selectOptions(screen.getByLabelText('Chapitre'), 'societe');
    await openAuditChapter(user, 'Société');
    await openSubAccordion(user, /Couverture simulateurs/);

    expect(await screen.findByTestId('memento-coverage-organigramme-societe')).toBeInTheDocument();
  });

  it('ne rend pas de liens sur les lignes coverage planned, internalOnly ou placeholder', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openAdminSection(user, 'Audit & sources');
    await openAuditChapter(user, 'Foyer');
    await openSubAccordion(user, /Couverture simulateurs/);

    const filiation = await screen.findByTestId('memento-coverage-filiation');
    expect(within(filiation).queryAllByRole('link')).toHaveLength(0);
    expect(within(filiation).queryAllByRole('button')).toHaveLength(0);

    await openAuditChapter(user, 'Patrimoine');
    await openSubAccordion(user, /Couverture simulateurs/);

    const actifPassif = await screen.findByTestId('memento-coverage-actif-passif');
    expect(within(actifPassif).queryAllByRole('link')).toHaveLength(0);
    expect(within(actifPassif).queryAllByRole('button')).toHaveLength(0);
  });
});
