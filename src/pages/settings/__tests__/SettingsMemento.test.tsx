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
  it('rend la vue métier par défaut sans exposer l’audit coverage en premier', () => {
    render(<SettingsMemento />);

    expect(
      screen.getByRole('heading', { name: 'Mémento patrimonial & social' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Vue métier' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getAllByText('Priorité critique').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Références officielles à qualifier').length).toBeGreaterThan(0);
    expect(screen.queryByTestId('memento-coverage-ir')).not.toBeInTheDocument();
  });

  it('rend la vue audit coverage sur demande', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await user.click(screen.getByRole('radio', { name: 'Audit coverage' }));

    expect(screen.getByTestId('memento-coverage-ir')).toBeInTheDocument();
    expect(screen.getByTestId('memento-coverage-filiation')).toBeInTheDocument();
    expect(screen.getByTestId('memento-coverage-actif-passif')).toBeInTheDocument();
    expect(screen.getByTestId('memento-coverage-epargne-salariale')).toBeInTheDocument();
  });

  it('n’affiche aucune source externe protégée ni PDF externe', async () => {
    const user = userEvent.setup();
    const { container } = render(<SettingsMemento />);

    await user.click(screen.getByRole('radio', { name: 'Audit coverage' }));

    expect(container).not.toHaveTextContent(/\.pdf|support professionnel externe|source protégée/i);
  });

  it('affiche les entrées métier planifiées du socle foyer sans lien actif', () => {
    render(<SettingsMemento />);

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

    await user.click(screen.getByRole('radio', { name: 'Audit coverage' }));

    for (const testId of [
      'memento-coverage-filiation',
      'memento-coverage-actif-passif',
      'memento-coverage-epargne-salariale',
    ]) {
      const row = screen.getByTestId(testId);
      expect(within(row).queryAllByRole('link')).toHaveLength(0);
      expect(within(row).queryAllByRole('button')).toHaveLength(0);
    }
  });

  it('filtre la vue métier par intention et priorité', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await user.selectOptions(screen.getByLabelText('Intention métier'), 'verifier-fiscalite');

    expect(screen.getByText('Impôt sur le revenu du foyer')).toBeInTheDocument();
    expect(
      screen.queryByText('Régime matrimonial et protection du conjoint'),
    ).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Priorité métier'), 'utile');

    expect(screen.getByText('Niches fiscales et réductions d’impôt')).toBeInTheDocument();
    expect(screen.queryByText('Impôt sur le revenu du foyer')).not.toBeInTheDocument();
  });

  it('filtre la vue audit coverage par recherche, statut et chapitre', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await user.click(screen.getByRole('radio', { name: 'Audit coverage' }));
    await user.type(screen.getByLabelText('Recherche mémento'), 'cession');

    expect(screen.getByTestId('memento-coverage-cession-titres')).toBeInTheDocument();
    expect(screen.queryByTestId('memento-coverage-ir')).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText('Recherche mémento'));
    await user.selectOptions(screen.getByLabelText('Statut'), 'couvert');

    expect(screen.getByTestId('memento-coverage-ir')).toBeInTheDocument();
    expect(screen.queryByTestId('memento-coverage-filiation')).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Statut'), 'all');
    await user.selectOptions(screen.getByLabelText('Chapitre'), 'societe');

    expect(screen.getByTestId('memento-coverage-organigramme-societe')).toBeInTheDocument();
    expect(screen.queryByTestId('memento-coverage-ir')).not.toBeInTheDocument();
  });
});
