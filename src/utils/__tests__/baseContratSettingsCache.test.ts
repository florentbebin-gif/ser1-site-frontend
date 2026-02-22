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

describe('migrateBaseContratSettingsToLatest (V3 → V4 cleanup)', () => {
  it('removes structured-like products, collapses metals + crypto (assimilation), and splits prevoyance', () => {
    const v3: BaseContratSettings = {
      schemaVersion: 3,
      products: [
        makeProduct({ id: 'cto', label: 'Compte-titres ordinaire (CTO)', sortOrder: 1 }),

        // Structured residues (must be removed)
        makeProduct({ id: 'autocall_foo', label: 'Autocall 2023', sortOrder: 2 }),
        makeProduct({ id: 'note_structuree_bar', label: 'Note structurée 2024', sortOrder: 3 }),
        makeProduct({ id: 'emtn_x', label: 'EMTN', sortOrder: 4 }),

        // Precious metals (must be collapsed)
        makeProduct({ id: 'or_physique', label: 'Or physique', grandeFamille: 'Métaux précieux' as never, catalogKind: 'asset', sortOrder: 5 }),
        makeProduct({ id: 'argent_physique', label: 'Argent physique', grandeFamille: 'Métaux précieux' as never, catalogKind: 'asset', sortOrder: 6 }),
        makeProduct({ id: 'platine_palladium', label: 'Platine / palladium physiques', grandeFamille: 'Métaux précieux' as never, catalogKind: 'asset', sortOrder: 7 }),

        // Crypto sub-categories (must be collapsed)
        makeProduct({ id: 'bitcoin_btc', label: 'Bitcoin (BTC)', grandeFamille: 'Crypto-actifs' as never, catalogKind: 'asset', sortOrder: 10 }),
        makeProduct({ id: 'ether_eth', label: 'Ether (ETH)', grandeFamille: 'Crypto-actifs' as never, catalogKind: 'asset', sortOrder: 11 }),
        makeProduct({ id: 'nft', label: 'NFT', grandeFamille: 'Crypto-actifs' as never, catalogKind: 'asset', sortOrder: 12 }),

        // Prevoyance legacy (must be split)
        makeProduct({
          id: 'prevoyance_individuelle',
          label: 'Prévoyance individuelle (arrêt de travail / invalidité / décès)',
          grandeFamille: 'Assurance',
          catalogKind: 'protection',
          sortOrder: 8,
        }),
      ],
    };

    const migrated = migrateBaseContratSettingsToLatest(v3);

    expect(migrated.schemaVersion).toBe(4);

    const ids = migrated.products.map((p) => p.id);

    // Structured cleanup
    expect(ids).not.toContain('autocall_foo');
    expect(ids).not.toContain('note_structuree_bar');
    expect(ids).not.toContain('emtn_x');

    // Precious metals collapse
    expect(ids).not.toContain('or_physique');
    expect(ids).not.toContain('argent_physique');
    expect(ids).not.toContain('platine_palladium');
    expect(ids).toContain('metaux_precieux');

    const metals = migrated.products.find((p) => p.id === 'metaux_precieux');
    expect(metals?.grandeFamille).toBe('Autres');

    // Crypto collapse
    expect(ids).not.toContain('bitcoin_btc');
    expect(ids).not.toContain('ether_eth');
    expect(ids).not.toContain('nft');
    expect(ids).toContain('crypto_actifs');

    const crypto = migrated.products.find((p) => p.id === 'crypto_actifs');
    expect(crypto?.grandeFamille).toBe('Autres');

    // Prevoyance split
    expect(ids).not.toContain('prevoyance_individuelle');
    expect(ids).toContain('prevoyance_individuelle_deces');
    expect(ids).toContain('prevoyance_individuelle_itt_invalidite');

    const prevDeces = migrated.products.find((p) => p.id === 'prevoyance_individuelle_deces');
    const prevItt = migrated.products.find((p) => p.id === 'prevoyance_individuelle_itt_invalidite');
    expect(prevDeces?.sortOrder).toBe(8);
    expect(prevItt?.sortOrder).toBe(9);

    // No duplicates
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('is idempotent', () => {
    const v3: BaseContratSettings = {
      schemaVersion: 3,
      products: [
        makeProduct({ id: 'autocall_foo', label: 'Autocall 2023', sortOrder: 1 }),
        makeProduct({ id: 'cto', label: 'Compte-titres ordinaire (CTO)', sortOrder: 2 }),
      ],
    };

    const migrated = migrateBaseContratSettingsToLatest(v3);
    const migratedAgain = migrateBaseContratSettingsToLatest(migrated);
    expect(migratedAgain).toEqual(migrated);
  });
});
