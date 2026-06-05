import { describe, expect, it } from 'vitest';

import { SIMULATOR_DEFINITIONS } from '@/domain/simulators/registry';
import {
  LEGAL_REFERENCE_BY_ID,
  LEGAL_REFERENCES,
  getLegalReference,
  listLegalReferencesForSimulator,
} from '../index';

describe('références juridiques', () => {
  it('déclare des ids uniques', () => {
    const ids = LEGAL_REFERENCES.map((reference) => reference.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

    expect(duplicates, `Références juridiques dupliquées : ${duplicates.join(', ')}`).toEqual([]);
    expect(LEGAL_REFERENCE_BY_ID.size).toBe(LEGAL_REFERENCES.length);
  });

  it('expose un lookup par id', () => {
    expect(getLegalReference('cgi-200-a').label).toContain('200 A');
    expect(() => getLegalReference('reference-inconnue')).toThrow(
      'Référence juridique introuvable',
    );
  });

  it('liste les références par simulateur', () => {
    const successionRefs = listLegalReferencesForSimulator('succession').map(
      (reference) => reference.id,
    );

    expect(successionRefs).toEqual(
      expect.arrayContaining(['code-civil-720', 'cgi-669', 'cgi-777', 'cgi-779', 'cgi-990-i']),
    );
  });

  it('référence uniquement des SimulatorDefinition.id connus', () => {
    const simulatorIds = new Set(SIMULATOR_DEFINITIONS.map((definition) => definition.id));
    const invalidSimulatorLinks = LEGAL_REFERENCES.flatMap((reference) =>
      reference.relatedSimulatorIds
        .filter((simulatorId) => !simulatorIds.has(simulatorId))
        .map((simulatorId) => `${reference.id}:${simulatorId}`),
    );

    expect(
      invalidSimulatorLinks,
      `Liens simulateurs inconnus : ${invalidSimulatorLinks.join(', ')}`,
    ).toEqual([]);
  });
});
