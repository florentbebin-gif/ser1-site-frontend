import { describe, it, expect } from 'vitest';
import type { BaseContratProduct, BaseContratSettings } from '../../types/baseContratSettings';
import { migrateBaseContratSettingsToLatest } from '../baseContratSettingsCache';

function makeProduct(partial: Partial<BaseContratProduct> & { id: string; label: string }): BaseContratProduct {
  const { id, label, ...rest } = partial;

  const base: BaseContratProduct = {
    id,
    label,

    // V3 (required)
    grandeFamille: 'Non coté/PE',
    catalogKind: 'wrapper',
    directHoldable: true,
    corporateHoldable: false,
    allowedWrappers: [],
    souscriptionOuverte: 'oui',
    eligiblePMPrecision: null,
    commentaireQualification: null,

    // Legacy
    family: 'Autres',
    holders: 'PP',
    open2026: true,

    envelopeType: id,
    sortOrder: 1,
    isActive: true,
    closedDate: null,
    templateKey: null,
    confidenceLevel: 'toVerify',
    todoToConfirm: [],
    references: [],
    rulesets: [],

    ...rest,
  };

  return base;
}

describe('migrateBaseContratSettingsToLatest (V3 → V5 full chain)', () => {
  it('applies V4 cleanup (structured, metals, crypto, prevoyance) + V5 rules (exceptions, assimilation, split)', () => {
    const v3: BaseContratSettings = {
      schemaVersion: 3,
      products: [
        // PP+PM product (will be split in V5)
        makeProduct({ id: 'cto', label: 'Compte-titres ordinaire (CTO)', sortOrder: 1, directHoldable: true, corporateHoldable: true, eligiblePM: 'oui', holders: 'PP+PM' }),

        // Structured residues (removed in V4)
        makeProduct({ id: 'autocall_foo', label: 'Autocall 2023', sortOrder: 2 }),

        // Precious metals (collapsed in V4)
        makeProduct({ id: 'or_physique', label: 'Or physique', grandeFamille: 'Métaux précieux' as never, catalogKind: 'asset', sortOrder: 5, directHoldable: true, corporateHoldable: true, eligiblePM: 'oui', holders: 'PP+PM' }),
        makeProduct({ id: 'argent_physique', label: 'Argent physique', grandeFamille: 'Métaux précieux' as never, catalogKind: 'asset', sortOrder: 6, directHoldable: true, corporateHoldable: true, eligiblePM: 'oui', holders: 'PP+PM' }),

        // Exception product (converted to non in V5)
        makeProduct({ id: 'livret_a', label: 'Livret A', eligiblePM: 'parException' as never, corporateHoldable: true, sortOrder: 9 }),

        // OPC products (assimilated in V5)
        makeProduct({ id: 'opcvm', label: 'OPCVM', sortOrder: 10, directHoldable: true, corporateHoldable: true, eligiblePM: 'oui', holders: 'PP+PM' }),
        makeProduct({ id: 'sicav', label: 'SICAV', sortOrder: 11, directHoldable: true, corporateHoldable: true, eligiblePM: 'oui', holders: 'PP+PM' }),

        // Groupement foncier (assimilated in V5)
        makeProduct({ id: 'gfa', label: 'GFA', sortOrder: 12, directHoldable: true, corporateHoldable: true, eligiblePM: 'oui', holders: 'PP+PM', grandeFamille: 'Immobilier indirect' }),
        makeProduct({ id: 'gfv', label: 'GFV', sortOrder: 13, directHoldable: true, corporateHoldable: true, eligiblePM: 'oui', holders: 'PP+PM', grandeFamille: 'Immobilier indirect' }),

        // Legacy ID (remapped in V5)
        makeProduct({ id: 'immobilier_appartement_maison', label: 'Appartement / maison', sortOrder: 14 }),

        // Prevoyance legacy (split in V4)
        makeProduct({
          id: 'prevoyance_individuelle',
          label: 'Prévoyance individuelle',
          grandeFamille: 'Assurance',
          catalogKind: 'protection',
          sortOrder: 8,
        }),
      ],
    };

    const migrated = migrateBaseContratSettingsToLatest(v3);

    expect(migrated.schemaVersion).toBe(5);

    const ids = migrated.products.map((p) => p.id);

    // V4: Structured cleanup
    expect(ids).not.toContain('autocall_foo');

    // V4: Precious metals collapse + V5: PP/PM split
    expect(ids).not.toContain('or_physique');
    expect(ids).not.toContain('argent_physique');
    // metaux_precieux was PP+PM → split to _pp/_pm
    expect(ids).toContain('metaux_precieux_pp');
    expect(ids).toContain('metaux_precieux_pm');

    // V5: Exception removal
    const livretA = migrated.products.find((p) => p.id === 'livret_a');
    expect(livretA).toBeDefined();
    expect(livretA!.eligiblePM).toBe('non');
    expect(livretA!.corporateHoldable).toBe(false);

    // V5: OPC assimilation + PP/PM split
    expect(ids).not.toContain('opcvm');
    expect(ids).not.toContain('sicav');
    expect(ids).toContain('opc_opcvm_pp');
    expect(ids).toContain('opc_opcvm_pm');

    // V5: Groupement foncier assimilation + PP/PM split
    expect(ids).not.toContain('gfa');
    expect(ids).not.toContain('gfv');
    expect(ids).toContain('groupement_foncier_pp');
    expect(ids).toContain('groupement_foncier_pm');

    // V5: Legacy ID remap
    expect(ids).not.toContain('immobilier_appartement_maison');
    expect(ids).toContain('residence_principale');

    // V4: Prevoyance split (PP-only → not split again)
    expect(ids).not.toContain('prevoyance_individuelle');
    expect(ids).toContain('prevoyance_individuelle_deces');
    expect(ids).toContain('prevoyance_individuelle_itt_invalidite');

    // V5: CTO PP+PM → split
    expect(ids).not.toContain('cto');
    expect(ids).toContain('cto_pp');
    expect(ids).toContain('cto_pm');
    const ctoPP = migrated.products.find((p) => p.id === 'cto_pp');
    const ctoPM = migrated.products.find((p) => p.id === 'cto_pm');
    expect(ctoPP!.directHoldable).toBe(true);
    expect(ctoPP!.corporateHoldable).toBe(false);
    expect(ctoPM!.directHoldable).toBe(false);
    expect(ctoPM!.corporateHoldable).toBe(true);

    // No duplicates
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('is idempotent', () => {
    const v3: BaseContratSettings = {
      schemaVersion: 3,
      products: [
        makeProduct({ id: 'autocall_foo', label: 'Autocall 2023', sortOrder: 1 }),
        makeProduct({ id: 'cto', label: 'CTO', sortOrder: 2, directHoldable: true, corporateHoldable: true, eligiblePM: 'oui', holders: 'PP+PM' }),
      ],
    };

    const migrated = migrateBaseContratSettingsToLatest(v3);
    const migratedAgain = migrateBaseContratSettingsToLatest(migrated);
    expect(migratedAgain).toEqual(migrated);
  });
});
