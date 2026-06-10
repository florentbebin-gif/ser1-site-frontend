// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import type { MementoEntry, MementoStatus } from '@/domain/settings-memento';
import {
  getActiveSettingsKey,
  getVisibleSettingsRoutes,
  SETTINGS_ROUTES,
} from '@/routes/settingsRoutes';

import SettingsMemento from '../SettingsMemento';
import MementoEntryRow from '../memento/MementoEntryRow';

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

  it('affiche les entrées métier du socle foyer sans lien actif', () => {
    render(<SettingsMemento />);

    const row = screen
      .getByText('Régime matrimonial et protection du conjoint')
      .closest('article') as HTMLElement;

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
