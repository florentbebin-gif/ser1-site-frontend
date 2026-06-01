import { describe, expect, it } from 'vitest';

import type {
  SimulatorContextAdapter,
  SimulatorContextAdapterResult,
} from '../contextAdapterTypes';

describe('contrat context adapters simulateurs', () => {
  it('décrit un adapter typé sans porter de logique métier centrale', () => {
    type DossierTest = { revenus: number };
    type InputsTest = { revenuImposable: number };

    const adapter: SimulatorContextAdapter<DossierTest, InputsTest> = {
      simulatorId: 'ir',
      adapt: ({ dossier }): SimulatorContextAdapterResult<InputsTest> => ({
        inputs: { revenuImposable: dossier.revenus },
        usedFields: [{ fieldPath: 'revenus', provenance: 'dossier' }],
        missingRequiredFields: [],
        warnings: [],
      }),
    };

    const result = adapter.adapt({ dossier: { revenus: 45000 }, requestedFields: ['revenus'] });

    expect(result.inputs.revenuImposable).toBe(45000);
    expect(result.usedFields[0]?.provenance).toBe('dossier');
  });
});
