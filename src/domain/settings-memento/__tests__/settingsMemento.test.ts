import { describe, expect, it } from 'vitest';

import type { LegalReferenceId } from '@/domain/legal-references';
import type { SettingRegistryKey } from '@/domain/settings-registry';

import {
  MEMENTO_CHAPTERS,
  MEMENTO_ENTRIES,
  MEMENTO_STATUS_VALUES,
  validateMementoTaxonomy,
} from '../index';
import type { MementoEntry } from '../types';

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

describe('settings-memento', () => {
  it('déclare les statuts canoniques du mémento', () => {
    expect(MEMENTO_STATUS_VALUES).toEqual([
      'couvert',
      'partiel',
      'planned',
      'absent',
      'a_verifier',
      'blocked_missing_official_source',
    ]);
  });

  it('verrouille les 14 chapitres canoniques', () => {
    expect(MEMENTO_CHAPTERS.map((chapter) => chapter.id)).toEqual([
      'foyer',
      'civil',
      'patrimoine',
      'fiscalite-foyer',
      'transmission',
      'placements',
      'immobilier',
      'arbitrage',
      'retraite',
      'epargne-retraite',
      'prevoyance',
      'societe',
      'dirigeant',
      'transmission-entreprise',
    ]);
  });

  it('valide la taxonomie vide de PR1', () => {
    const result = validateMementoTaxonomy(MEMENTO_CHAPTERS, MEMENTO_ENTRIES);

    expect(MEMENTO_ENTRIES).toEqual([]);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('valide une entrée couverte quand elle pointe une source officielle ou un claim settings', () => {
    const result = validateMementoTaxonomy(MEMENTO_CHAPTERS, [validEntry()]);

    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('refuse les valeurs fiscales ou sociales dans les textes mémento', () => {
    const invalidEntries = [
      validEntry({
        key: 'fiscalite-foyer.taux-ps',
        description: 'Le mémento ne doit jamais porter 17,2 % dans sa doctrine.',
      }),
      validEntry({
        key: 'transmission.abattement-chiffre',
        chapterId: 'transmission',
        description: 'Le mémento ne doit jamais porter 100 000 € dans sa doctrine.',
      }),
      validEntry({
        key: 'transmission.plafond-chiffre',
        chapterId: 'transmission',
        description: 'Le plafond 100000 doit rester dans les settings, pas ici.',
      }),
      validEntry({
        key: 'societe.assiette-chiffree',
        chapterId: 'societe',
        description: 'Une assiette 100000 ne doit pas vivre dans la taxonomie mémento.',
      }),
      validEntry({
        key: 'societe.formule-calcul',
        chapterId: 'societe',
        description: 'Formule : net = brut - charges.',
      }),
    ];

    const result = validateMementoTaxonomy(MEMENTO_CHAPTERS, invalidEntries);

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('fiscalite-foyer.taux-ps: description contient un pourcentage'),
        expect.stringContaining('transmission.abattement-chiffre: description contient un montant'),
        expect.stringContaining(
          'transmission.plafond-chiffre: description contient une valeur associée à plafond',
        ),
        expect.stringContaining(
          'societe.assiette-chiffree: description contient une valeur associée à assiette',
        ),
        expect.stringContaining('societe.formule-calcul: description contient une formule'),
      ]),
    );
    expect(result.ok).toBe(false);
  });

  it('refuse aussi les valeurs fiscales ou sociales dans les textes de chapitre', () => {
    const result = validateMementoTaxonomy(
      [
        {
          ...MEMENTO_CHAPTERS[0],
          description: 'Chapitre bloqué si un seuil 100000 apparaît dans sa description.',
        },
        ...MEMENTO_CHAPTERS.slice(1),
      ],
      [],
    );

    expect(result.errors).toContain(
      'foyer: description contient une valeur associée à seuil, interdit dans la taxonomie mémento.',
    );
    expect(result.ok).toBe(false);
  });

  it('autorise les numéros d’articles et millésimes non chiffrés comme valeurs fiscales', () => {
    const result = validateMementoTaxonomy(MEMENTO_CHAPTERS, [
      validEntry({
        key: 'transmission.references-non-valeurs',
        chapterId: 'transmission',
        description: 'Repères doctrinaux : article 757 B, 990 I, article 83 et millésime 2026.',
        refIds: ['cgi-757-b'],
        claimKeys: [],
      }),
    ]);

    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('refuse une entrée couverte sans source officielle ni claim settings', () => {
    const result = validateMementoTaxonomy(MEMENTO_CHAPTERS, [
      validEntry({
        refIds: [],
        claimKeys: [],
        coverageSources: ['excel-charges-sociales'],
      }),
    ]);

    expect(result.errors).toContain(
      'fiscalite-foyer.ir: le statut couvert exige au moins un refId ou un claim settings ; les coverageSources ne suffisent pas.',
    );
  });

  it('verrouille blocked_missing_official_source comme statut sans source et motivé', () => {
    const withSource = validateMementoTaxonomy(MEMENTO_CHAPTERS, [
      validEntry({
        status: 'blocked_missing_official_source',
        statusReason: 'Source officielle manquante côté BOSS.',
        claimKeys: ['income-tax-scale-current'],
      }),
    ]);
    const withoutReason = validateMementoTaxonomy(MEMENTO_CHAPTERS, [
      validEntry({
        status: 'blocked_missing_official_source',
        statusReason: 'Blocage à traiter.',
        refIds: [],
        claimKeys: [],
      }),
    ]);

    expect(withSource.errors).toContain(
      'fiscalite-foyer.ir: blocked_missing_official_source doit garder refIds et claimKeys vides.',
    );
    expect(withoutReason.errors).toContain(
      'fiscalite-foyer.ir: blocked_missing_official_source doit nommer la source officielle manquante dans statusReason.',
    );
  });

  it('refuse les clés, sources et simulateurs inconnus', () => {
    const result = validateMementoTaxonomy(MEMENTO_CHAPTERS, [
      validEntry({
        registryKeys: ['impots.ir.inconnue' as unknown as SettingRegistryKey],
        claimKeys: ['claim-inconnu'],
        refIds: ['ref-inconnue' as LegalReferenceId],
        relatedSimulatorIds: ['simulateur-inconnu'],
      }),
    ]);

    expect(result.errors).toEqual(
      expect.arrayContaining([
        'fiscalite-foyer.ir: registryKey inconnue (impots.ir.inconnue).',
        'fiscalite-foyer.ir: claimKey settings-references inconnue (claim-inconnu).',
        'fiscalite-foyer.ir: refId juridique inconnu (ref-inconnue).',
        'fiscalite-foyer.ir: relatedSimulatorId inconnu (simulateur-inconnu).',
      ]),
    );
  });
});
