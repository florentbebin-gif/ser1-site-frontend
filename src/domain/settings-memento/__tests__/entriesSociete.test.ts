import { describe, expect, it } from 'vitest';

import { SETTINGS_REFERENCE_CHAIN } from '@/domain/settings-references';
import type { SimulatorId } from '@/domain/simulators/registry';

import { MEMENTO_ENTRIES, getCoverageForSimulator } from '../index';

describe('settings-memento — société et comptabilité', () => {
  const entryByKey = new Map(MEMENTO_ENTRIES.map((entry) => [entry.key, entry]));
  const R4_EXPECTED_STATUSES = {
    'societe.is': 'couvert',
    'societe.groupe-mere-fille-qpfc': 'partiel',
    'societe.compte-courant-associe': 'partiel',
    'societe.resultat-distribuable-reserves': 'partiel',
    'societe.capitaux-propres': 'partiel',
    'societe.tresorerie': 'partiel',
    'societe.organigramme': 'planned',
    'societe.projection-comptable': 'planned',
    'societe.valorisation-titres': 'planned',
    'societe.cession-titres': 'partiel',
    'societe.holding-apport-cession': 'planned',
    'societe.obo': 'a_verifier',
    'societe.epargne-salariale': 'partiel',
  } as const;
  const R4_KEYS = Object.keys(R4_EXPECTED_STATUSES) as ReadonlyArray<
    keyof typeof R4_EXPECTED_STATUSES
  >;

  // Le seuil social des dividendes TNS est administré sur Prélèvements et les
  // dispositifs d'épargne salariale sont documentés par le catalogue
  // Base-Contrat : ces claims gardent leur page d'origine alors que la page
  // propriétaire métier reste Comptables & sociétés.
  const CROSS_PAGE_CLAIM_EXCEPTIONS = new Set([
    'societe.tresorerie::social-dirigeant-dividendes-tns',
    'societe.epargne-salariale::base-contrat-percol-pp-pp-constitution-versements',
    'societe.epargne-salariale::base-contrat-percol-pp-pp-sortie-avant-5-ans-blocage',
    'societe.epargne-salariale::base-contrat-percol-pp-pp-sortie-apres-5-ans',
  ]);

  it('déclare les treize entrées du lot société avec leurs statuts attendus', () => {
    for (const key of R4_KEYS) {
      const entry = entryByKey.get(key);

      expect(entry, `entrée manquante : ${key}`).toBeDefined();
      expect(entry!.status, key).toBe(R4_EXPECTED_STATUSES[key]);
    }
  });

  it('rattache toutes les entrées société à la page propriétaire Comptables & sociétés', () => {
    for (const key of R4_KEYS) {
      const entry = entryByKey.get(key);

      expect(entry!.ownerPagePath, key).toBe('/settings/comptables-societes');
    }
  });

  it('aligne chaque claim sur la page propriétaire de son entrée, hors exceptions documentées', () => {
    const bindingsByClaimKey = new Map(
      SETTINGS_REFERENCE_CHAIN.map((binding) => [binding.claimKey, binding]),
    );

    for (const key of R4_KEYS) {
      const entry = entryByKey.get(key);

      for (const claimKey of entry!.claimKeys) {
        if (CROSS_PAGE_CLAIM_EXCEPTIONS.has(`${key}::${claimKey}`)) continue;

        const binding = bindingsByClaimKey.get(claimKey);

        expect(binding, `${key}: claim inconnu ${claimKey}`).toBeDefined();
        expect(binding!.pagePath, `${key}: ${claimKey}`).toBe(entry!.ownerPagePath);
      }
    }
  });

  it('justifie le statut couvert IS par le claim settings et le simulateur trésorerie actif', () => {
    const entry = entryByKey.get('societe.is');

    expect(entry!.claimKeys).toContain('corporate-tax-current');
    expect(entry!.registryKeys).toContain('comptables-societes.is');
    expect(entry!.relatedSimulatorIds).toEqual(['tresorerie-societe']);
  });

  it('fonde le socle comptable sur les références Code de commerce qualifiées', () => {
    const distribuable = entryByKey.get('societe.resultat-distribuable-reserves');
    const capitauxPropres = entryByKey.get('societe.capitaux-propres');

    expect(distribuable!.refIds).toEqual([
      'code-commerce-l232-10',
      'code-commerce-l232-11',
      'code-commerce-l232-12',
    ]);
    expect(capitauxPropres!.refIds).toEqual(['code-commerce-l223-42', 'code-commerce-l225-248']);
  });

  it('garde des sources qualifiées sur les entrées liées au registry settings', () => {
    for (const key of [
      'societe.is',
      'societe.groupe-mere-fille-qpfc',
      'societe.compte-courant-associe',
      'societe.tresorerie',
      'societe.cession-titres',
      'societe.epargne-salariale',
    ] as const) {
      const entry = entryByKey.get(key);

      expect(entry!.registryKeys.length, key).toBeGreaterThan(0);
      expect(entry!.claimKeys.length + entry!.refIds.length, key).toBeGreaterThan(0);
    }
  });

  it('garde OBO en attente de qualification sans source affichée', () => {
    const entry = entryByKey.get('societe.obo');

    expect(entry!.status).toBe('a_verifier');
    expect(entry!.claimKeys).toEqual([]);
    expect(entry!.refIds).toEqual([]);
    expect(entry!.relatedSimulatorIds).toEqual([]);
  });

  it('aligne chaque entrée du lot sur le chapitre couvert par son simulateur', () => {
    for (const key of R4_KEYS) {
      const entry = entryByKey.get(key);

      for (const simulatorId of entry!.relatedSimulatorIds) {
        const coverage = getCoverageForSimulator(simulatorId as SimulatorId);
        expect(coverage.chapterId, key).toBe(entry!.chapterId);
      }
    }
  });
});
