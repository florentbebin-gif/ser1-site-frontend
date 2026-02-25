/**
 * Tests de cohérence du catalogue hardcodé.
 * PR1 — Vérifie l'intégrité structurelle de CATALOG sans impact runtime.
 */

import { describe, it, expect } from 'vitest';
import { CATALOG, CATALOG_BY_ID, getCatalogProduct } from '../catalog';
import { isProductClosed } from '../overrides';
import type { OverrideMap } from '../overrides';

describe('CATALOG — cohérence structurelle', () => {
  it('contient au moins 60 produits', () => {
    expect(CATALOG.length).toBeGreaterThanOrEqual(60);
  });

  it('tous les ids sont uniques', () => {
    const ids = CATALOG.map((p) => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('tous les produits ont id, label, grandeFamille, catalogKind non vides', () => {
    for (const p of CATALOG) {
      expect(p.id, `id vide sur produit ${JSON.stringify(p)}`).toBeTruthy();
      expect(p.label, `label vide sur ${p.id}`).toBeTruthy();
      expect(p.grandeFamille, `grandeFamille vide sur ${p.id}`).toBeTruthy();
      expect(p.catalogKind, `catalogKind vide sur ${p.id}`).toBeTruthy();
    }
  });

  it('catalogKind est une valeur valide', () => {
    const validKinds = new Set(['wrapper', 'asset', 'liability', 'tax_overlay', 'protection']);
    for (const p of CATALOG) {
      expect(validKinds.has(p.catalogKind), `catalogKind invalide sur ${p.id}: ${p.catalogKind}`).toBe(true);
    }
  });

  it('ppEligible et pmEligible sont des booléens', () => {
    for (const p of CATALOG) {
      expect(typeof p.ppEligible, `ppEligible non booléen sur ${p.id}`).toBe('boolean');
      expect(typeof p.pmEligible, `pmEligible non booléen sur ${p.id}`).toBe('boolean');
    }
  });

  it('aucun produit ne doit être dual-eligible (ppEligible && pmEligible)', () => {
    const dualEligible = CATALOG.filter((p) => p.ppEligible && p.pmEligible).map((p) => p.id);
    expect(dualEligible, `Produits dual-eligible détectés: ${dualEligible.join(', ')}`).toHaveLength(0);
  });

  it('templateKey est string ou null', () => {
    for (const p of CATALOG) {
      expect(
        p.templateKey === null || typeof p.templateKey === 'string',
        `templateKey invalide sur ${p.id}`,
      ).toBe(true);
    }
  });
});

describe('CATALOG_BY_ID', () => {
  it('contient autant d\'entrées que CATALOG', () => {
    expect(Object.keys(CATALOG_BY_ID).length).toBe(CATALOG.length);
  });

  it('getCatalogProduct retourne le bon produit', () => {
    const p = getCatalogProduct('assurance_vie');
    expect(p).toBeDefined();
    expect(p?.label).toBe('Assurance-vie');
    expect(p?.catalogKind).toBe('wrapper');
    expect(p?.ppEligible).toBe(true);
    expect(p?.pmEligible).toBe(false);
  });

  it('getCatalogProduct retourne undefined pour un id inconnu', () => {
    expect(getCatalogProduct('produit_inexistant')).toBeUndefined();
  });
});

describe('Produits clés — présence et valeurs', () => {
  const cases: Array<{ id: string; ppEligible: boolean; pmEligible: boolean; catalogKind: string }> = [
    { id: 'assurance_vie', ppEligible: true, pmEligible: false, catalogKind: 'wrapper' },
    { id: 'cto_pp', ppEligible: true, pmEligible: false, catalogKind: 'wrapper' },
    { id: 'cto_pm', ppEligible: false, pmEligible: true, catalogKind: 'wrapper' },
    { id: 'pea', ppEligible: true, pmEligible: false, catalogKind: 'wrapper' },
    { id: 'perin_assurance', ppEligible: true, pmEligible: false, catalogKind: 'wrapper' },
    { id: 'assurance_homme_cle', ppEligible: false, pmEligible: true, catalogKind: 'protection' },
    { id: 'pinel_pinel_plus', ppEligible: true, pmEligible: false, catalogKind: 'tax_overlay' },
    { id: 'parts_scpi_pp', ppEligible: true, pmEligible: false, catalogKind: 'asset' },
    { id: 'parts_scpi_pm', ppEligible: false, pmEligible: true, catalogKind: 'asset' },
    { id: 'crypto_actifs_pp', ppEligible: true, pmEligible: false, catalogKind: 'asset' },
    { id: 'crypto_actifs_pm', ppEligible: false, pmEligible: true, catalogKind: 'asset' },
    { id: 'compte_courant_associe_pp', ppEligible: true,  pmEligible: false, catalogKind: 'liability' },
    { id: 'compte_courant_associe_pm', ppEligible: false, pmEligible: true,  catalogKind: 'liability' },
  ];

  for (const { id, ppEligible, pmEligible, catalogKind } of cases) {
    it(`${id} — ppEligible=${ppEligible}, pmEligible=${pmEligible}, kind=${catalogKind}`, () => {
      const p = getCatalogProduct(id);
      expect(p, `${id} absent du catalogue`).toBeDefined();
      expect(p?.ppEligible).toBe(ppEligible);
      expect(p?.pmEligible).toBe(pmEligible);
      expect(p?.catalogKind).toBe(catalogKind);
    });
  }
});

describe('isProductClosed', () => {
  const overrides: OverrideMap = {
    pinel_pinel_plus: {
      product_id: 'pinel_pinel_plus',
      closed_date: '2025-01-01',
      note_admin: 'Fermé fin 2024',
      updated_at: '2025-01-01T00:00:00Z',
    },
    assurance_vie: {
      product_id: 'assurance_vie',
      closed_date: null,
      note_admin: null,
      updated_at: '2025-01-01T00:00:00Z',
    },
  };

  it('retourne true si closed_date <= asOf', () => {
    expect(isProductClosed('pinel_pinel_plus', overrides, '2026-01-01')).toBe(true);
  });

  it('retourne false si closed_date est null', () => {
    expect(isProductClosed('assurance_vie', overrides, '2026-01-01')).toBe(false);
  });

  it('retourne false si le produit n\'a pas d\'override', () => {
    expect(isProductClosed('cto_pp', overrides, '2026-01-01')).toBe(false);
  });

  it('retourne false si closed_date > asOf (fermeture future)', () => {
    expect(isProductClosed('pinel_pinel_plus', overrides, '2024-12-31')).toBe(false);
  });
});
