import { describe, expect, it } from 'vitest';

import { BUSINESS_JOURNEYS, getDirectChainage, getJourneyPosition } from '../chainage';
import { SIMULATOR_DEFINITIONS } from '../registry';

const SIMULATOR_IDS = new Set(SIMULATOR_DEFINITIONS.map((definition) => definition.id));

describe('chainage simulateurs', () => {
  it('référence uniquement des SimulatorDefinition.id dans upstream et next', () => {
    const invalidReferences = SIMULATOR_DEFINITIONS.flatMap((definition) =>
      [...definition.upstream, ...definition.next]
        .filter((id) => !SIMULATOR_IDS.has(id))
        .map((id) => `${definition.id} -> ${id}`),
    );

    expect(
      invalidReferences,
      `Références directes invalides : ${invalidReferences.join(', ')}`,
    ).toEqual([]);
  });

  it('référence uniquement des SimulatorDefinition.id dans les parcours métier', () => {
    const invalidSteps = BUSINESS_JOURNEYS.flatMap((journey) => {
      const steps = [
        ...journey.steps,
        ...(journey.branches ?? []).flatMap((branch) => branch.steps),
      ];
      return steps
        .filter((step) => step.type === 'simulator' && !SIMULATOR_IDS.has(step.simulatorId))
        .map((step) => (step.type === 'simulator' ? `${journey.id} -> ${step.simulatorId}` : ''));
    });

    expect(invalidSteps, `Étapes parcours invalides : ${invalidSteps.join(', ')}`).toEqual([]);
  });

  it('expose les parcours obligatoires', () => {
    const journeyIds = BUSINESS_JOURNEYS.map((journey) => journey.id);

    expect(journeyIds).toEqual(
      expect.arrayContaining([
        'audit-global',
        'transmission-privee',
        'protection-famille',
        'retraite',
        'investissement-patrimonial',
        'immobilier',
        'societe-dirigeant',
        'transmission-entreprise',
        'cession-reemploi',
      ]),
    );
  });

  it('retourne le chainage direct d’un simulateur actif', () => {
    const chainage = getDirectChainage('succession');

    expect(chainage.upstream.map((definition) => definition.id)).toEqual(
      expect.arrayContaining(['filiation', 'regime-matrimonial']),
    );
    expect(chainage.next.map((definition) => definition.id)).toEqual(
      expect.arrayContaining(['donation-demembrement', 'prevoyance']),
    );
  });

  it('positionne Succession dans le parcours Transmission privée', () => {
    const position = getJourneyPosition('succession', 'transmission-privee');

    expect(position?.journey.label).toBe('Transmission privée');
    expect(
      position?.previous.map((step) => (step.type === 'simulator' ? step.simulatorId : step.label)),
    ).toEqual(expect.arrayContaining(['filiation', 'regime-matrimonial', 'donations-anterieures']));
    expect(
      position?.next.map((step) => (step.type === 'simulator' ? step.simulatorId : step.label)),
    ).toEqual(expect.arrayContaining(['donation-demembrement', 'prevoyance']));
  });
});
