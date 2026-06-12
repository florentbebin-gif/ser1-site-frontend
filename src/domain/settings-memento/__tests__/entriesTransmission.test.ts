import { describe, expect, it } from 'vitest';

import { SETTINGS_REFERENCE_CHAIN } from '@/domain/settings-references';
import type { SimulatorId } from '@/domain/simulators/registry';

import { MEMENTO_ENTRIES, getCoverageForSimulator } from '../index';

describe('settings-memento — transmission', () => {
  const entryByKey = new Map(MEMENTO_ENTRIES.map((entry) => [entry.key, entry]));
  const TRANSMISSION_KEYS = [
    'transmission.succession-dmtg',
    'transmission.assurance-vie-deces',
    'transmission.donation-demembrement',
    'transmission.liberalites',
    'transmission.transmission-internationale',
    'transmission-entreprise.pacte-dutreil',
    'transmission-entreprise.paiement-differe-fractionne',
    'transmission-entreprise.donation-titres',
    'transmission-entreprise.liquidite-societe',
  ] as const;

  it('déclare les neuf entrées transmission avec leurs statuts attendus', () => {
    expect(entryByKey.get('transmission.succession-dmtg')?.status).toBe('couvert');
    expect(entryByKey.get('transmission.assurance-vie-deces')?.status).toBe('couvert');
    expect(entryByKey.get('transmission.donation-demembrement')?.status).toBe('planned');
    expect(entryByKey.get('transmission.liberalites')?.status).toBe('partiel');
    expect(entryByKey.get('transmission.transmission-internationale')?.status).toBe('partiel');
    expect(entryByKey.get('transmission-entreprise.pacte-dutreil')?.status).toBe('planned');
    expect(entryByKey.get('transmission-entreprise.paiement-differe-fractionne')?.status).toBe(
      'partiel',
    );
    expect(entryByKey.get('transmission-entreprise.donation-titres')?.status).toBe('planned');
    expect(entryByKey.get('transmission-entreprise.liquidite-societe')?.status).toBe('planned');
  });

  it('fonde le paiement différé et fractionné sur les références qualifiées', () => {
    const entry = entryByKey.get('transmission-entreprise.paiement-differe-fractionne');

    expect(entry!.refIds).toEqual(['cgi-ann3-397-a', 'cgi-ann3-404-ga', 'boi-enr-dg-50-20-50']);
    expect(entry!.relatedSimulatorIds).toEqual(['pacte-dutreil']);
  });

  it('rattache la transmission internationale aux sources de territorialité qualifiées', () => {
    const entry = entryByKey.get('transmission.transmission-internationale');

    expect(entry!.claimKeys).toEqual([]);
    expect(entry!.refIds).toEqual(['cgi-750-ter', 'boi-enr-dmtg-10-10-30', 'cgi-990-i']);
    expect(entry!.statusReason).toContain('conventions fiscales');
  });

  it('trace l’absence du barème de donation entre époux sur l’entrée donation et démembrement', () => {
    const entry = entryByKey.get('transmission.donation-demembrement');

    expect(entry!.claimKeys).toContain('dmtg-conjoint-pacs-exoneration-cgi-796-0-bis');
    expect(entry!.refIds).toContain('cgi-796-0-bis');
    expect(entry!.refIds).toContain('cgi-790-e');
    expect(entry!.refIds).toContain('cgi-790-f');
    expect(entry!.statusReason).toContain('donation entre époux');
  });

  it('complète les sources succession et assurance-vie décès sans changer les claims settings', () => {
    expect(entryByKey.get('transmission.succession-dmtg')!.refIds).toEqual(
      expect.arrayContaining(['cgi-790-h', 'cgi-790-i']),
    );
    expect(entryByKey.get('transmission.assurance-vie-deces')!.refIds).toContain(
      'code-assurances-l132-13',
    );
  });

  it('rattache toutes les entrées transmission au mémento', () => {
    for (const key of TRANSMISSION_KEYS) {
      const entry = entryByKey.get(key);

      expect(entry).toBeDefined();
      expect(entry!.ownerPagePath).toBe('/settings/memento');
    }
  });

  it('justifie les entrées couvertes par des claims DMTG et le simulateur succession actif', () => {
    for (const key of [
      'transmission.succession-dmtg',
      'transmission.assurance-vie-deces',
    ] as const) {
      const entry = entryByKey.get(key);

      expect(entry).toBeDefined();
      expect(entry!.claimKeys.length).toBeGreaterThan(0);
      expect(entry!.registryKeys.length).toBeGreaterThan(0);
      expect(entry!.relatedSimulatorIds).toEqual(['succession']);
    }
  });

  it('garde les claims alignés sur la page propriétaire de chaque entrée transmission', () => {
    for (const key of TRANSMISSION_KEYS) {
      const entry = entryByKey.get(key);

      expect(entry).toBeDefined();
      for (const claimKey of entry!.claimKeys) {
        const binding = SETTINGS_REFERENCE_CHAIN.find(
          (candidate) => candidate.claimKey === claimKey,
        );

        expect(binding?.pagePath).toBe(entry!.ownerPagePath);
      }
    }
  });

  it('garde les variantes société ROADMAP-only sans relatedSimulatorIds', () => {
    for (const key of [
      'transmission-entreprise.donation-titres',
      'transmission-entreprise.liquidite-societe',
    ] as const) {
      const entry = entryByKey.get(key);

      expect(entry).toBeDefined();
      expect(entry!.relatedSimulatorIds).toEqual([]);
    }
  });

  it('aligne chaque entrée transmission sur le chapitre couvert par son simulateur', () => {
    for (const key of TRANSMISSION_KEYS) {
      const entry = entryByKey.get(key);

      for (const simulatorId of entry!.relatedSimulatorIds) {
        const coverage = getCoverageForSimulator(simulatorId as SimulatorId);
        expect(coverage.chapterId).toBe(entry!.chapterId);
      }
    }
  });
});
