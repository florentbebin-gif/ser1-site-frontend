// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserRoleState } from '@/auth/useUserRole';
import type { MementoEntry, MementoStatus } from '@/domain/settings-memento';
import { SETTINGS_REFERENCE_CHAIN } from '@/domain/settings-references';
import { listSettingsForOwnerPage } from '@/domain/settings-registry';
import {
  getActiveSettingsKey,
  isDeclaredSettingsPath,
  getVisibleSettingsRoutes,
  SETTINGS_ROUTES,
} from '@/routes/settingsRoutes';

import SettingsMemento from '../SettingsMemento';
import MementoEntryRow from '../memento/MementoEntryRow';
import {
  bindingMatchesMementoSettingsSection,
  getMementoSettingsSection,
  MEMENTO_SETTINGS_SECTIONS,
  MEMENTO_SETTINGS_TARGET_PATH,
} from '../memento/mementoSettingsSections';

let isAdmin = true;
const fromMock = vi.hoisted(() => vi.fn());
const rpcMock = vi.hoisted(() => vi.fn());

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

async function openInternalTab(user: ReturnType<typeof userEvent.setup>, name: RegExp | string) {
  await user.click(screen.getByRole('tab', { name }));
}

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

async function openAuditChapter(user: ReturnType<typeof userEvent.setup>, label: string) {
  const button = findButtonByClass('settings-memento-chapter__header', label);
  if (button.getAttribute('aria-expanded') !== 'true') {
    await user.click(button);
  }
}

async function openCalculatorCard(user: ReturnType<typeof userEvent.setup>, label: string) {
  const button = findButtonByClass('settings-memento-calculator-card__header', label);
  if (button.getAttribute('aria-expanded') !== 'true') {
    await user.click(button);
  }
}

async function openSubAccordion(user: ReturnType<typeof userEvent.setup>, name: RegExp | string) {
  const button = screen.getByRole('button', { name });
  if (button.getAttribute('aria-expanded') !== 'true') {
    await user.click(button);
  }
}

describe('route settings mémento', () => {
  it('expose l’onglet mémento à tous les utilisateurs', () => {
    const route = SETTINGS_ROUTES.find((entry) => entry.key === 'memento');
    const generalIndex = SETTINGS_ROUTES.findIndex((entry) => entry.key === 'general');
    const mementoIndex = SETTINGS_ROUTES.findIndex((entry) => entry.key === 'memento');

    expect(route).toMatchObject({
      label: 'Mémento',
      path: 'memento',
      urlPath: '/settings/memento',
    });
    expect(route?.adminOnly).toBeUndefined();
    expect(mementoIndex).toBe(generalIndex + 1);
    expect(getVisibleSettingsRoutes(false).some((entry) => entry.key === 'memento')).toBe(true);
    expect(isDeclaredSettingsPath('/settings/memento-old')).toBe(false);
    expect(getActiveSettingsKey('/settings/section-inconnue')).toBe('memento');
    expect(isDeclaredSettingsPath('/settings/section-inconnue')).toBe(false);
  });
});

describe('contrat des sections settings du mémento', () => {
  const routePaths = SETTINGS_ROUTES.map((route) => route.urlPath);

  it('déclare les six sections settings intégrées dans /settings/memento', () => {
    const targetSectionKeys = MEMENTO_SETTINGS_SECTIONS.map((section) => section.targetSectionKey);

    expect(MEMENTO_SETTINGS_SECTIONS.map((section) => section.id)).toEqual([
      'impots',
      'comptables-societes',
      'prelevements',
      'dmtg-succession',
      'base-contrat',
      'prevoyance-regimes',
    ]);
    expect(new Set(MEMENTO_SETTINGS_SECTIONS.map((section) => section.targetPagePath))).toEqual(
      new Set([MEMENTO_SETTINGS_TARGET_PATH]),
    );
    expect(new Set(targetSectionKeys).size).toBe(targetSectionKeys.length);
  });

  it('conserve /settings/memento comme route settings fiscal/social unique', () => {
    expect(routePaths).toContain(MEMENTO_SETTINGS_TARGET_PATH);
    expect(routePaths).toContain('/settings/base-contrat-retraite');
  });

  it('verrouille les sources de lecture et d’écriture par domaine migré', () => {
    expect(getMementoSettingsSection('impots')).toMatchObject({
      readSources: ['tax_settings', 'ps_settings'],
      writeSources: ['tax_settings'],
    });
    expect(getMementoSettingsSection('comptables-societes')).toMatchObject({
      readSources: ['tax_settings'],
      writeSources: ['tax_settings'],
    });
    expect(getMementoSettingsSection('prelevements')).toMatchObject({
      readSources: ['ps_settings', 'tax_settings', 'pass_history'],
      writeSources: ['ps_settings', 'pass_history'],
    });
    expect(getMementoSettingsSection('dmtg-succession')).toMatchObject({
      readSources: ['tax_settings', 'fiscality_settings'],
      writeSources: ['tax_settings', 'fiscality_settings'],
    });
    expect(getMementoSettingsSection('base-contrat')).toMatchObject({
      readSources: ['base_contrat_catalog', 'base_contrat_overrides'],
      writeSources: ['base_contrat_overrides'],
    });
    expect(getMementoSettingsSection('prevoyance-regimes')).toMatchObject({
      readSources: ['prevoyance_regime_settings', 'prevoyance_maintien_employeur_settings'],
      writeSources: ['prevoyance_regime_settings', 'prevoyance_maintien_employeur_settings'],
    });
  });

  it('compte les claims settings-references sans perte', () => {
    for (const section of MEMENTO_SETTINGS_SECTIONS) {
      const count = SETTINGS_REFERENCE_CHAIN.filter((binding) =>
        bindingMatchesMementoSettingsSection(binding, section),
      ).length;

      expect(count, section.id).toBe(section.expectedSettingsReferenceClaims);
    }
  });

  it('couvre chaque entrée registry mémento dans une seule section audit', () => {
    const registryEntries = listSettingsForOwnerPage('/settings/memento');
    const sectionByKey = new Map<string, string[]>();

    for (const section of MEMENTO_SETTINGS_SECTIONS) {
      for (const key of section.registrySettingKeys) {
        sectionByKey.set(key, [...(sectionByKey.get(key) ?? []), section.id]);
      }
    }

    expect(registryEntries).toHaveLength(31);
    for (const entry of registryEntries) {
      expect(sectionByKey.get(entry.key), entry.key).toHaveLength(1);
    }
    expect(sectionByKey.get('impots.ps-patrimoine')).toEqual(['prelevements']);
  });
});

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

describe('SettingsMemento', () => {
  beforeEach(() => {
    isAdmin = true;
    fromMock.mockReset();
    fromMock.mockImplementation(() => makeSettingsBuilder());
    rpcMock.mockReset();
    rpcMock.mockResolvedValue({ data: null, error: null });
  });

  it('ouvre la vue Lire par défaut avec les trois onglets admin', () => {
    render(<SettingsMemento />);

    expect(
      screen.getByRole('heading', { name: 'Mémento patrimonial & social' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Lire le mémento/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: /Paramètres calculateurs/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Audit & sources/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Lire le mémento' })).toBeInTheDocument();
  });

  it('masque l’onglet audit aux non-admins', () => {
    isAdmin = false;

    render(<SettingsMemento />);

    expect(screen.getAllByRole('tab')).toHaveLength(2);
    expect(screen.queryByRole('tab', { name: /Audit & sources/i })).not.toBeInTheDocument();
  });

  it('pilote les onglets au clavier', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    const lire = screen.getByRole('tab', { name: /Lire le mémento/i });
    lire.focus();
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('tab', { name: /Paramètres calculateurs/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: /Audit & sources/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('garde les parties de lecture fermées par défaut sans métadonnées techniques', () => {
    render(<SettingsMemento />);

    for (const button of screen.getAllByRole('button', { expanded: false })) {
      expect(button.className).toContain('settings-memento-part__header');
    }
    expect(screen.queryByText('Page propriétaire')).not.toBeInTheDocument();
    expect(screen.queryByText('/settings/memento')).not.toBeInTheDocument();
    expect(screen.queryByText('coverageSources')).not.toBeInTheDocument();
    expect(screen.queryByText('Couverture simulateurs')).not.toBeInTheDocument();
    expect(screen.queryByText('Impôt sur le revenu du foyer')).not.toBeInTheDocument();
  });

  it('rend le mémento lisible avec sources officielles sans IDs bruts', async () => {
    const user = userEvent.setup();
    const { container } = render(<SettingsMemento />);

    await openReadPart(user, 'Fiscalité');
    await openReadChapter(user, 'Fiscalité foyer');

    expect(screen.getByText('Impôt sur le revenu du foyer')).toBeInTheDocument();
    expect(screen.getAllByText('Sources officielles').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link').some((link) => link.getAttribute('href'))).toBe(true);
    expect(container).not.toHaveTextContent(/claimKeys|ownerPagePath|coverageSources|cgi-/i);
    expect(container).not.toHaveTextContent(/\.pdf|support professionnel externe|source protégée/i);
  });

  it('rend le lexique dans la partie dédiée', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openReadPart(user, 'Lexique');

    expect(screen.getByText('PER')).toBeInTheDocument();
    expect(screen.getByText('PER individuel')).toBeInTheDocument();
  });

  it('ne monte les panels calculateurs qu’après ouverture d’une carte', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    expect(screen.queryByRole('button', { name: /Barème de l’impôt sur le revenu/i })).toBeNull();

    await openInternalTab(user, /Paramètres calculateurs/i);
    expect(screen.queryByRole('button', { name: /Barème de l’impôt sur le revenu/i })).toBeNull();

    await openCalculatorCard(user, 'Fiscalité du foyer');

    expect(
      await screen.findByRole('button', { name: /Barème de l’impôt sur le revenu/i }),
    ).toBeInTheDocument();
  });

  it('rend audit, entrées techniques et couverture seulement dans la vue audit', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    expect(screen.queryByTestId('memento-coverage-ir')).not.toBeInTheDocument();

    await openInternalTab(user, /Audit & sources/i);
    await openAuditChapter(user, 'Fiscalité foyer');
    await openSubAccordion(user, /Entrées techniques/);

    expect(screen.getAllByText('Priorité critique').length).toBeGreaterThan(0);
    expect(screen.getByText('Registre settings Fiscalité du foyer')).toBeInTheDocument();

    await openSubAccordion(user, /Couverture simulateurs/);
    expect(await screen.findByTestId('memento-coverage-ir')).toBeInTheDocument();
  });

  it('filtre l’audit par intention, priorité, recherche, statut et chapitre', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openInternalTab(user, /Audit & sources/i);
    await user.selectOptions(screen.getByLabelText('Intention métier'), 'verifier-fiscalite');
    await openAuditChapter(user, 'Fiscalité foyer');
    await openSubAccordion(user, /Entrées techniques/);

    expect(screen.getByText('Impôt sur le revenu du foyer')).toBeInTheDocument();
    expect(
      screen.queryByText('Régime matrimonial et protection du conjoint'),
    ).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Priorité métier'), 'utile');

    expect(screen.getByText('Niches fiscales et réductions d’impôt')).toBeInTheDocument();
    expect(screen.queryByText('Impôt sur le revenu du foyer')).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Priorité métier'), 'all');
    await user.selectOptions(screen.getByLabelText('Intention métier'), 'all');
    await user.type(screen.getByLabelText('Recherche mémento'), 'cession');
    await openAuditChapter(user, 'Société');
    await openSubAccordion(user, /Couverture simulateurs/);

    expect(await screen.findByTestId('memento-coverage-cession-titres')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Recherche mémento'));
    await user.selectOptions(screen.getByLabelText('Statut'), 'couvert');
    await openAuditChapter(user, 'Fiscalité foyer');
    await openSubAccordion(user, /Couverture simulateurs/);

    expect(await screen.findByTestId('memento-coverage-ir')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Statut'), 'all');
    await user.selectOptions(screen.getByLabelText('Chapitre'), 'societe');
    await openAuditChapter(user, 'Société');
    await openSubAccordion(user, /Couverture simulateurs/);

    expect(await screen.findByTestId('memento-coverage-organigramme-societe')).toBeInTheDocument();
  });

  it('ne rend pas de liens sur les lignes coverage planned, internalOnly ou placeholder', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openInternalTab(user, /Audit & sources/i);
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
