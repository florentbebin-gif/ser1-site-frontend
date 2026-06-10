// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import type { MementoEntry } from '@/domain/settings-memento';
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
  ownerPagePath: '/settings/impots',
  registryKeys: [],
  claimKeys: ['ir.bareme'],
  refIds: [],
  coverageSources: [],
  relatedSimulatorIds: ['ir'],
};

const ENTRY_PLANIFIEE: MementoEntry = {
  ...ENTRY_COUVERTE,
  key: 'fiscalite-foyer.ifi',
  label: 'IFI',
  status: 'planned',
  statusReason: 'Contenu planifié, aucune page propriétaire active.',
};

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

  it('ne rend ni lien ni action pour une entrée planifiée', () => {
    const { container } = render(<MementoEntryRow entry={ENTRY_PLANIFIEE} />);

    expect(container.querySelectorAll('a, button')).toHaveLength(0);
    expect(screen.getByText('/settings/impots')).toBeInTheDocument();
  });
});

describe('SettingsMemento', () => {
  it('rend le hub lecture seule avec les lignes de couverture simulateurs', () => {
    render(<SettingsMemento />);

    expect(
      screen.getByRole('heading', { name: 'Mémento patrimonial & social' }),
    ).toBeInTheDocument();

    expect(screen.getByTestId('memento-coverage-ir')).toBeInTheDocument();
    expect(screen.getByTestId('memento-coverage-filiation')).toBeInTheDocument();
    expect(screen.getByTestId('memento-coverage-actif-passif')).toBeInTheDocument();
    expect(screen.getByTestId('memento-coverage-epargne-salariale')).toBeInTheDocument();
  });

  it('ne rend pas de liens sur les lignes planned, internalOnly ou placeholder', () => {
    render(<SettingsMemento />);

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

  it('filtre les chapitres par recherche, statut et chapitre', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

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
