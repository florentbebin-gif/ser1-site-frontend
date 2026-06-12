// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import type { MementoEntry, MementoStatus } from '@/domain/settings-memento';
import { SETTINGS_REFERENCE_CHAIN } from '@/domain/settings-references';
import {
  getActiveSettingsKey,
  getVisibleSettingsRoutes,
  SETTINGS_ROUTES,
} from '@/routes/settingsRoutes';

import SettingsMemento from '../SettingsMemento';
import MementoEntryRow from '../memento/MementoEntryRow';
import {
  bindingMatchesMementoSettingsSection,
  getMementoSettingsMigrationSection,
  MEMENTO_SETTINGS_MIGRATION_SECTIONS,
  MEMENTO_SETTINGS_TARGET_PATH,
} from '../memento/mementoSettingsSections';

const ENTRY_COUVERTE: MementoEntry = {
  chapterId: 'fiscalite-foyer',
  key: 'fiscalite-foyer.ir',
  label: 'Impôt sur le revenu',
  description: 'Couverture doctrinale des paramètres IR centralisés.',
  status: 'couvert',
  statusReason: 'Sources officielles déjà portées par le registre settings.',
  priority: 'critique',
  ownerPagePath: '/settings/impots',
  registryKeys: [],
  claimKeys: ['ir.bareme'],
  refIds: [],
  coverageSources: [],
  relatedSimulatorIds: ['ir'],
};

const entryWithStatus = (status: MementoStatus): MementoEntry => ({
  ...ENTRY_COUVERTE,
  key: 'fiscalite-foyer.ifi',
  label: 'IFI',
  status,
  statusReason: 'Contenu planifié, aucune page propriétaire active.',
});

function getChapterButton(label: string): HTMLElement {
  const button = screen
    .getAllByRole('button')
    .find(
      (candidate) =>
        candidate.classList.contains('settings-memento-chapter__header') &&
        candidate.textContent?.trim().startsWith(`${label} (`),
    );

  if (!button) {
    throw new Error(`Chapitre mémento introuvable : ${label}`);
  }
  return button;
}

async function openChapter(user: ReturnType<typeof userEvent.setup>, label: string) {
  const button = getChapterButton(label);
  if (button.getAttribute('aria-expanded') !== 'true') {
    await user.click(button);
  }
}

async function openSubAccordion(user: ReturnType<typeof userEvent.setup>, label: string) {
  const button = screen.getByRole('button', { name: new RegExp(label, 'i') });
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
    expect(getActiveSettingsKey('/settings/memento')).toBe('memento');
  });
});

describe('contrat de migration settings vers mémento', () => {
  const routePaths = SETTINGS_ROUTES.map((route) => route.urlPath);

  it('déclare les six pages settings à intégrer dans /settings/memento', () => {
    const targetSectionKeys = MEMENTO_SETTINGS_MIGRATION_SECTIONS.map(
      (section) => section.targetSectionKey,
    );

    expect(MEMENTO_SETTINGS_MIGRATION_SECTIONS.map((section) => section.id)).toEqual([
      'impots',
      'comptables-societes',
      'prelevements',
      'dmtg-succession',
      'base-contrat',
      'prevoyance-regimes',
    ]);
    expect(MEMENTO_SETTINGS_MIGRATION_SECTIONS.map((section) => section.legacyPagePath)).toEqual([
      '/settings/impots',
      '/settings/comptables-societes',
      '/settings/prelevements',
      '/settings/dmtg-succession',
      '/settings/base-contrat',
      '/settings/prevoyance-regimes',
    ]);
    expect(
      new Set(MEMENTO_SETTINGS_MIGRATION_SECTIONS.map((section) => section.targetPagePath)),
    ).toEqual(new Set([MEMENTO_SETTINGS_TARGET_PATH]));
    expect(
      MEMENTO_SETTINGS_MIGRATION_SECTIONS.map((section) => section.legacyPagePath),
    ).not.toContain('/settings/base-contrat-retraite');
    expect(new Set(targetSectionKeys).size).toBe(targetSectionKeys.length);
  });

  it('conserve les routes source et cible pendant M0', () => {
    expect(routePaths).toContain(MEMENTO_SETTINGS_TARGET_PATH);

    for (const section of MEMENTO_SETTINGS_MIGRATION_SECTIONS) {
      expect(routePaths, section.id).toContain(section.legacyPagePath);
    }
  });

  it('verrouille les sources de lecture et d’écriture par domaine migré', () => {
    expect(getMementoSettingsMigrationSection('impots')).toMatchObject({
      readSources: ['tax_settings', 'ps_settings'],
      writeSources: ['tax_settings'],
    });
    expect(getMementoSettingsMigrationSection('comptables-societes')).toMatchObject({
      readSources: ['tax_settings'],
      writeSources: ['tax_settings'],
    });
    expect(getMementoSettingsMigrationSection('prelevements')).toMatchObject({
      readSources: ['ps_settings', 'tax_settings', 'pass_history'],
      writeSources: ['ps_settings', 'pass_history'],
    });
    expect(getMementoSettingsMigrationSection('dmtg-succession')).toMatchObject({
      readSources: ['tax_settings', 'fiscality_settings'],
      writeSources: ['tax_settings', 'fiscality_settings'],
    });
    expect(getMementoSettingsMigrationSection('base-contrat')).toMatchObject({
      readSources: ['base_contrat_catalog', 'base_contrat_overrides'],
      writeSources: ['base_contrat_overrides'],
    });
    expect(getMementoSettingsMigrationSection('prevoyance-regimes')).toMatchObject({
      readSources: ['prevoyance_regime_settings', 'prevoyance_maintien_employeur_settings'],
      writeSources: ['prevoyance_regime_settings', 'prevoyance_maintien_employeur_settings'],
    });
  });

  it('compte les claims settings-references sans perte avant migration effective', () => {
    for (const section of MEMENTO_SETTINGS_MIGRATION_SECTIONS) {
      const count = SETTINGS_REFERENCE_CHAIN.filter((binding) =>
        bindingMatchesMementoSettingsSection(binding, section),
      ).length;

      expect(count, section.id).toBe(section.expectedSettingsReferenceClaims);
    }
  });
});

describe('MementoEntryRow', () => {
  it('rend un lien propriétaire seulement pour une entrée exploitable', () => {
    render(<MementoEntryRow entry={ENTRY_COUVERTE} />);

    expect(screen.getByRole('link', { name: /ouvrir la page propriétaire/i })).toHaveAttribute(
      'href',
      '/settings/impots',
    );
  });

  it.each(['planned', 'absent', 'blocked_missing_official_source'] as const)(
    'ne rend ni lien ni action pour une entrée %s',
    (status) => {
      const { container } = render(<MementoEntryRow entry={entryWithStatus(status)} />);

      expect(container.querySelectorAll('a, button')).toHaveLength(0);
      expect(screen.getAllByText('Impôts').length).toBeGreaterThan(0);
    },
  );
});

describe('SettingsMemento', () => {
  it('rend les chapitres fermés par défaut sans exposer les lignes techniques', () => {
    const { container } = render(<SettingsMemento />);

    expect(
      screen.getByRole('heading', { name: 'Mémento patrimonial & social' }),
    ).toBeInTheDocument();
    expect(getChapterButton('Foyer')).toHaveAttribute('aria-expanded', 'false');
    expect(getChapterButton('Fiscalité foyer')).toHaveAttribute('aria-expanded', 'false');
    expect(container.querySelectorAll('.settings-memento-chapter__header').length).toBeGreaterThan(
      0,
    );
    for (const button of container.querySelectorAll('.settings-memento-chapter__header')) {
      expect(button).toHaveAttribute('aria-expanded', 'false');
    }
    expect(screen.queryByRole('button', { name: /Lecture métier/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Impôt sur le revenu du foyer')).not.toBeInTheDocument();
    expect(screen.queryByTestId('memento-coverage-ir')).not.toBeInTheDocument();
  });

  it('ouvre un chapitre puis un sous-accordéon au clavier', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    const foyer = getChapterButton('Foyer');
    foyer.focus();
    await user.keyboard('{Enter}');

    expect(foyer).toHaveAttribute('aria-expanded', 'true');
    const lecture = screen.getByRole('button', { name: /Lecture métier/i });
    expect(lecture).toHaveAttribute('aria-expanded', 'false');

    lecture.focus();
    await user.keyboard('{Enter}');

    expect(lecture).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Filiation et branches familiales')).toBeInTheDocument();
  });

  it('rend la couverture simulateurs seulement sur demande', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openChapter(user, 'Fiscalité foyer');

    expect(screen.queryByTestId('memento-coverage-ir')).not.toBeInTheDocument();

    await openSubAccordion(user, 'Couverture simulateurs');

    expect(screen.getByTestId('memento-coverage-ir')).toBeInTheDocument();
  });

  it('n’affiche aucune source externe protégée ni PDF externe', async () => {
    const user = userEvent.setup();
    const { container } = render(<SettingsMemento />);

    await openChapter(user, 'Fiscalité foyer');
    await openSubAccordion(user, 'Couverture simulateurs');

    expect(container).not.toHaveTextContent(/\.pdf|support professionnel externe|source protégée/i);
  });

  it('affiche les entrées métier planifiées sans lien actif après ouverture', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openChapter(user, 'Transmission');
    await openSubAccordion(user, 'Lecture métier');

    const row = screen
      .getAllByText('Donations antérieures')
      .map((node) => node.closest('article'))
      .find((article): article is HTMLElement => article !== null) as HTMLElement;

    expect(row).not.toBeNull();
    expect(within(row).queryAllByRole('link')).toHaveLength(0);
    expect(within(row).queryAllByRole('button')).toHaveLength(0);
    expect(within(row).getAllByText('DMTG & Succession').length).toBeGreaterThan(0);
  });

  it('ne rend pas de liens sur les lignes planned, internalOnly ou placeholder', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openChapter(user, 'Foyer');
    await openSubAccordion(user, 'Couverture simulateurs');

    const filiation = screen.getByTestId('memento-coverage-filiation');
    expect(within(filiation).queryAllByRole('link')).toHaveLength(0);
    expect(within(filiation).queryAllByRole('button')).toHaveLength(0);

    await openChapter(user, 'Patrimoine');
    await openSubAccordion(user, 'Couverture simulateurs');

    const actifPassif = screen.getByTestId('memento-coverage-actif-passif');
    expect(within(actifPassif).queryAllByRole('link')).toHaveLength(0);
    expect(within(actifPassif).queryAllByRole('button')).toHaveLength(0);

    await openChapter(user, 'Société');
    await openSubAccordion(user, 'Couverture simulateurs');

    const epargneSalariale = screen.getByTestId('memento-coverage-epargne-salariale');
    expect(within(epargneSalariale).queryAllByRole('link')).toHaveLength(0);
    expect(within(epargneSalariale).queryAllByRole('button')).toHaveLength(0);
  });

  it('filtre la vue métier par intention et priorité', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await user.selectOptions(screen.getByLabelText('Intention métier'), 'verifier-fiscalite');
    await openChapter(user, 'Fiscalité foyer');
    await openSubAccordion(user, 'Lecture métier');

    expect(screen.getByText('Impôt sur le revenu du foyer')).toBeInTheDocument();
    expect(
      screen.queryByText('Régime matrimonial et protection du conjoint'),
    ).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Priorité métier'), 'utile');

    expect(screen.getByText('Niches fiscales et réductions d’impôt')).toBeInTheDocument();
    expect(screen.queryByText('Impôt sur le revenu du foyer')).not.toBeInTheDocument();
  });

  it('filtre la couverture simulateurs par recherche, statut et chapitre', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await user.type(screen.getByLabelText('Recherche mémento'), 'cession');
    await openChapter(user, 'Société');
    await openSubAccordion(user, 'Couverture simulateurs');

    expect(screen.getByTestId('memento-coverage-cession-titres')).toBeInTheDocument();
    expect(screen.queryByTestId('memento-coverage-ir')).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText('Recherche mémento'));
    await user.selectOptions(screen.getByLabelText('Statut'), 'couvert');
    await openChapter(user, 'Fiscalité foyer');
    await openSubAccordion(user, 'Couverture simulateurs');

    expect(screen.getByTestId('memento-coverage-ir')).toBeInTheDocument();
    expect(screen.queryByTestId('memento-coverage-filiation')).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Statut'), 'all');
    await user.selectOptions(screen.getByLabelText('Chapitre'), 'societe');
    await openChapter(user, 'Société');
    await openSubAccordion(user, 'Couverture simulateurs');

    expect(screen.getByTestId('memento-coverage-organigramme-societe')).toBeInTheDocument();
    expect(screen.queryByTestId('memento-coverage-ir')).not.toBeInTheDocument();
  });
});
