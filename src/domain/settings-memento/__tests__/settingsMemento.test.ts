import { describe, expect, it } from 'vitest';

import type { LegalReferenceId } from '@/domain/legal-references';
import type { SettingRegistryKey } from '@/domain/settings-registry';
import type { SimulatorId } from '@/domain/simulators/registry';

import {
  MEMENTO_BUSINESS_PRIORITY_VALUES,
  MEMENTO_CHAPTERS,
  MEMENTO_COVERAGE_SOURCE_VALUES,
  MEMENTO_ENTRIES,
  MEMENTO_STATUS_VALUES,
  MEMENTO_USER_INTENTS,
  MEMENTO_USER_INTENT_VALUES,
  getCoverageForSimulator,
  validateMementoIntents,
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
  priority: 'critique',
  ownerPagePath: '/settings/memento',
  registryKeys: ['impots.ir.bareme'],
  claimKeys: ['income-tax-scale-current'],
  refIds: [],
  coverageSources: ['cadrage-externe'],
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

  it('déclare les priorités, intentions et sources de cadrage canoniques', () => {
    expect(MEMENTO_BUSINESS_PRIORITY_VALUES).toEqual([
      'critique',
      'structurant',
      'utile',
      'complementaire',
    ]);
    expect(MEMENTO_USER_INTENT_VALUES).toEqual([
      'verifier-fiscalite',
      'preparer-transmission',
      'proteger-famille',
      'piloter-dirigeant',
      'preparer-retraite',
      'structurer-societe',
      'investir-immobilier',
      'optimiser-placements',
      'comprendre-couverture',
    ]);
    expect(MEMENTO_COVERAGE_SOURCE_VALUES).toEqual(['cadrage-externe']);
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

  it('valide la taxonomie réelle du mémento', () => {
    const result = validateMementoTaxonomy(MEMENTO_CHAPTERS, MEMENTO_ENTRIES);

    expect(MEMENTO_ENTRIES.length).toBeGreaterThan(0);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('valide les intentions métier réelles et leur couverture des chapitres', () => {
    const result = validateMementoIntents(MEMENTO_CHAPTERS, MEMENTO_USER_INTENTS);

    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('garde les nouveaux champs hors valeurs fiscales, sociales ou comptables', () => {
    const governanceText = [
      ...MEMENTO_BUSINESS_PRIORITY_VALUES,
      ...MEMENTO_USER_INTENT_VALUES,
      ...MEMENTO_USER_INTENTS.map((intent) => intent.label),
      ...MEMENTO_COVERAGE_SOURCE_VALUES,
    ].join(' ');

    expect(governanceText).not.toMatch(
      /\b\d+(?:[,.]\d+)?\s*(?:%|€|EUR|euros?)?|\b(?:plafond|seuil|assiette|abattement|taux|bar[eè]me)\b/iu,
    );
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
        coverageSources: ['cadrage-externe'],
      }),
    ]);

    expect(result.errors).toContain(
      'fiscalite-foyer.ir: le statut couvert exige au moins un refId ou un claim settings ; les coverageSources ne suffisent pas.',
    );
  });

  it('refuse une priorité inconnue', () => {
    const result = validateMementoTaxonomy(MEMENTO_CHAPTERS, [
      validEntry({
        priority: 'urgente' as MementoEntry['priority'],
      }),
    ]);

    expect(result.errors).toContain('fiscalite-foyer.ir: priorité métier inconnue (urgente).');
    expect(result.ok).toBe(false);
  });

  it('refuse une intention inconnue ou un chapitre d’intention inconnu', () => {
    const result = validateMementoIntents(MEMENTO_CHAPTERS, [
      {
        id: 'intention-inconnue',
        label: 'Intention inconnue',
        chapterIds: ['chapitre-inconnu'],
      },
    ]);

    expect(result.errors).toEqual(
      expect.arrayContaining([
        'intention-inconnue: intention métier inconnue.',
        'intention-inconnue: chapitre mémento inconnu (chapitre-inconnu).',
      ]),
    );
    expect(result.ok).toBe(false);
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
        coverageSources: ['source-inconnue' as MementoEntry['coverageSources'][number]],
        relatedSimulatorIds: ['simulateur-inconnu'],
      }),
    ]);

    expect(result.errors).toEqual(
      expect.arrayContaining([
        'fiscalite-foyer.ir: registryKey inconnue (impots.ir.inconnue).',
        'fiscalite-foyer.ir: claimKey settings-references inconnue (claim-inconnu).',
        'fiscalite-foyer.ir: refId juridique inconnu (ref-inconnue).',
        'fiscalite-foyer.ir: coverageSource inconnue (source-inconnue).',
        'fiscalite-foyer.ir: relatedSimulatorId inconnu (simulateur-inconnu).',
      ]),
    );
  });
});

describe('settings-memento — socle foyer', () => {
  const entryByKey = new Map(MEMENTO_ENTRIES.map((entry) => [entry.key, entry]));
  const FOYER_KEYS = [
    'foyer.filiation',
    'foyer.budget',
    'civil.regime-matrimonial',
    'transmission.donations-anterieures',
    'patrimoine.actif-passif',
  ] as const;

  it('déclare les cinq entrées socle foyer avec leurs statuts attendus', () => {
    expect(entryByKey.get('foyer.filiation')?.status).toBe('planned');
    expect(entryByKey.get('foyer.budget')?.status).toBe('planned');
    expect(entryByKey.get('civil.regime-matrimonial')?.status).toBe('partiel');
    expect(entryByKey.get('transmission.donations-anterieures')?.status).toBe('planned');
    expect(entryByKey.get('patrimoine.actif-passif')?.status).toBe('a_verifier');
  });

  it('donne à chaque entrée socle foyer une page propriétaire ou un statut attentiste', () => {
    for (const key of FOYER_KEYS) {
      const entry = entryByKey.get(key);

      expect(entry).toBeDefined();
      expect(
        entry!.ownerPagePath !== null || ['planned', 'a_verifier'].includes(entry!.status),
      ).toBe(true);
    }
  });

  it('aligne chaque entrée socle foyer sur le chapitre couvert par son simulateur', () => {
    for (const key of FOYER_KEYS) {
      const entry = entryByKey.get(key);

      expect(entry!.relatedSimulatorIds.length).toBeGreaterThan(0);
      for (const simulatorId of entry!.relatedSimulatorIds) {
        const coverage = getCoverageForSimulator(simulatorId as SimulatorId);
        expect(coverage.chapterId).toBe(entry!.chapterId);
      }
    }
  });
});
