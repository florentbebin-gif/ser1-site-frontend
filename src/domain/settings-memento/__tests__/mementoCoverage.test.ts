import { describe, expect, it } from 'vitest';

import { SETTINGS_ROUTES } from '@/routes/settingsRoutes';

import {
  MEMENTO_CHAPTERS,
  MEMENTO_ENTRIES,
  SIMULATOR_MEMENTO_COVERAGE,
  getCoverageForSimulator,
  buildMementoCoverageReport,
  validateMementoCoverage,
  type MementoEntry,
  type SimulatorCoverageEntry,
} from '../index';

const knownSettingsUrlPaths = SETTINGS_ROUTES.map((route) => route.urlPath);

const validEntry = (overrides: Partial<MementoEntry> = {}): MementoEntry => ({
  chapterId: 'fiscalite-foyer',
  key: 'fiscalite-foyer.ir',
  label: 'Impôt sur le revenu',
  description: 'Doctrine et rattachement des règles IR aux settings propriétaires.',
  status: 'couvert',
  statusReason: 'Sources officielles connues via le chaînage settings existant.',
  ownerPagePath: '/settings/impots',
  registryKeys: ['impots.ir.bareme'],
  claimKeys: ['income-tax-scale-current'],
  refIds: [],
  coverageSources: ['laplace'],
  relatedSimulatorIds: ['ir'],
  ...overrides,
});

const validateWithEntries = (entries: readonly MementoEntry[]) =>
  validateMementoCoverage({
    chapters: MEMENTO_CHAPTERS,
    entries,
    coverage: SIMULATOR_MEMENTO_COVERAGE,
    knownSettingsUrlPaths,
  });

describe('settings-memento coverage audit', () => {
  it('valide l’audit transverse actuel du mémento', () => {
    const result = validateMementoCoverage({ knownSettingsUrlPaths });

    expect(MEMENTO_ENTRIES.length).toBeGreaterThan(0);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('produit un rapport lisible pour le check mémento', () => {
    const report = buildMementoCoverageReport({ knownSettingsUrlPaths });

    expect(report.ok).toBe(true);
    expect(report.counts).toMatchObject({
      chapters: MEMENTO_CHAPTERS.length,
      entries: MEMENTO_ENTRIES.length,
      simulatorCoverage: SIMULATOR_MEMENTO_COVERAGE.length,
      knownSettingsUrlPaths: SETTINGS_ROUTES.length,
    });
    expect(report.settingsRoutes).toMatchObject({
      hasCanonicalSocietyPath: true,
      hasSingularSocietyPath: false,
      unknownOwnerPagePaths: [],
    });
    expect(report.unreferencedChapterIds).toEqual([]);
  });

  it('refuse une entrée propriétaire pointant hors SETTINGS_ROUTES', () => {
    const result = validateWithEntries([
      validEntry({
        ownerPagePath: '/settings/inconnue' as MementoEntry['ownerPagePath'],
      }),
    ]);

    expect(result.errors).toContain(
      'fiscalite-foyer.ir: ownerPagePath inconnu dans SETTINGS_ROUTES (/settings/inconnue).',
    );
    expect(result.ok).toBe(false);
  });

  it('refuse une entrée couverte sans source officielle ni claim settings', () => {
    const result = validateWithEntries([
      validEntry({
        claimKeys: [],
        refIds: [],
      }),
    ]);

    expect(result.errors).toContain(
      'fiscalite-foyer.ir: le statut couvert exige au moins un refId ou un claim settings ; les coverageSources ne suffisent pas.',
    );
    expect(result.ok).toBe(false);
  });

  it('refuse les statuts non attentistes quand un réglage ou simulateur actif n’a aucune source qualifiée', () => {
    const registryResult = validateWithEntries([
      validEntry({
        status: 'partiel',
        claimKeys: [],
        refIds: [],
        relatedSimulatorIds: [],
      }),
    ]);
    const simulatorResult = validateWithEntries([
      validEntry({
        status: 'partiel',
        claimKeys: [],
        refIds: [],
        registryKeys: [],
        relatedSimulatorIds: ['ir'],
      }),
    ]);
    const plannedResult = validateWithEntries([
      validEntry({
        status: 'planned',
        claimKeys: [],
        refIds: [],
      }),
    ]);

    expect(registryResult.errors).toContain(
      'fiscalite-foyer.ir: une entrée liée à des réglages ou simulateurs actifs sans source officielle doit rester planned, a_verifier ou blocked_missing_official_source.',
    );
    expect(simulatorResult.errors).toContain(
      'fiscalite-foyer.ir: une entrée liée à des réglages ou simulateurs actifs sans source officielle doit rester planned, a_verifier ou blocked_missing_official_source.',
    );
    expect(plannedResult.errors).toEqual([]);
    expect(plannedResult.ok).toBe(true);
  });

  it('refuse un statut couvert sur un simulateur dont le lifecycle n’est pas prêt', () => {
    const entryResult = validateWithEntries([
      validEntry({
        key: 'foyer.filiation',
        chapterId: 'foyer',
        label: 'Filiation',
        status: 'couvert',
        statusReason: 'Source officielle présente mais simulateur encore planifié.',
        ownerPagePath: null,
        registryKeys: [],
        claimKeys: [],
        refIds: ['code-civil-757'],
        relatedSimulatorIds: ['filiation'],
      }),
    ]);
    const coverageResult = validateMementoCoverage({
      chapters: MEMENTO_CHAPTERS,
      entries: [],
      coverage: SIMULATOR_MEMENTO_COVERAGE.map((entry): SimulatorCoverageEntry => {
        if (entry.target.kind !== 'registry' || entry.target.simulatorId !== 'filiation') {
          return entry;
        }

        return {
          ...getCoverageForSimulator('filiation'),
          expectedStatus: 'couvert',
        };
      }),
      knownSettingsUrlPaths,
    });

    expect(entryResult.errors).toContain(
      'foyer.filiation: le simulateur filiation a un lifecycle planned et ne peut pas porter un statut mémento couvert.',
    );
    expect(coverageResult.errors).toContain(
      'filiation: lifecycle planned ne peut pas avoir expectedStatus couvert.',
    );
  });

  it('verrouille la route société plurielle comme seule route canonique', () => {
    const missingCanonical = validateMementoCoverage({
      knownSettingsUrlPaths: knownSettingsUrlPaths
        .filter((path) => path !== '/settings/comptables-societes')
        .concat('/settings/comptables-societe'),
    });
    const singularOwner = validateWithEntries([
      validEntry({
        key: 'societe.is',
        chapterId: 'societe',
        ownerPagePath: '/settings/comptables-societe' as MementoEntry['ownerPagePath'],
      }),
    ]);

    expect(missingCanonical.errors).toEqual(
      expect.arrayContaining([
        'SETTINGS_ROUTES: /settings/comptables-societes doit rester déclarée.',
        'SETTINGS_ROUTES: route société non canonique détectée (/settings/comptables-societe).',
      ]),
    );
    expect(singularOwner.errors).toEqual(
      expect.arrayContaining([
        'societe.is: ownerPagePath inconnu dans SETTINGS_ROUTES (/settings/comptables-societe).',
        'societe.is: ownerPagePath société doit utiliser /settings/comptables-societes.',
      ]),
    );
  });
});
