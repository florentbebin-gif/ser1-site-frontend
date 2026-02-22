/**
 * catalogue.seed.test.ts — Validation du catalogue patrimonial (P1-05).
 *
 * Garanties :
 *  - Zéro produit structuré
 *  - IDs uniques
 *  - Champs obligatoires présents
 *  - Split immobilier correct
 *  - Entrées clés présentes (PERIN bancaire, Article 39, CTO, PEA, PEA-PME)
 *  - PP/PM cohérent
 */

import { describe, it, expect } from 'vitest';
import rawCatalogue from './catalogue.seed.v1.json';

interface RawProduct {
  id: string;
  label: string;
  family: string;
  kind: string;
  ppDirectHoldable: boolean;
  pmEligibility: string;
  pmEligibilityNote?: string | null;
  open2026: string;
  qualificationComment?: string | null;
  references?: string[];
  templateKey?: string | null;
}

const catalogue = rawCatalogue as { schemaVersion: number; generatedAt: string; products: RawProduct[] };
const products = catalogue.products;
const ids = products.map((p) => p.id);

describe('Catalogue seed — structure', () => {
  it('has schemaVersion 1', () => {
    expect(catalogue.schemaVersion).toBe(1);
  });

  it('has unique IDs', () => {
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe('Catalogue seed — champs obligatoires', () => {
  it.each(products.map((p) => [p.id, p]))('%s has required fields', (_id, product) => {
    const p = product as RawProduct;
    expect(p.id).toBeTruthy();
    expect(p.label).toBeTruthy();
    expect(p.family).toBeTruthy();
    expect(['actif_instrument', 'contrat_compte_enveloppe', 'dispositif_fiscal_immobilier']).toContain(p.kind);
    expect(typeof p.ppDirectHoldable).toBe('boolean');
    expect(['oui', 'non', 'exception']).toContain(p.pmEligibility);
    expect(['oui', 'non', 'na']).toContain(p.open2026);
  });

  it('pmEligibilityNote is present when pmEligibility is exception', () => {
    const exceptions = products.filter((p) => p.pmEligibility === 'exception');
    for (const p of exceptions) {
      expect(p.pmEligibilityNote, `${p.id} missing pmEligibilityNote`).toBeTruthy();
    }
  });
});

describe('Catalogue seed — zéro produit structuré', () => {
  it('no product has family containing "structuré"', () => {
    const structuredProducts = products.filter((p) =>
      p.family.toLowerCase().includes('structur'),
    );
    expect(structuredProducts).toHaveLength(0);
  });

  it('no product ID contains "structur"', () => {
    const structuredIds = ids.filter((id) => id.toLowerCase().includes('structur'));
    expect(structuredIds).toHaveLength(0);
  });

  it('no product contains structured synonyms (autocall, EMTN, certificat, turbo, warrant)', () => {
    const synonyms = ['autocall', 'emtn', 'certificat', 'turbo', 'warrant', 'note structur'];
    const invalidProducts = products.filter((p) => {
      const searchStr = `${p.id} ${p.label} ${p.qualificationComment || ''}`.toLowerCase();
      return synonyms.some((syn) => searchStr.includes(syn));
    });
    expect(invalidProducts).toHaveLength(0);
  });
});

describe('Catalogue seed — métaux précieux (simplifié)', () => {
  it('detailed precious metals do NOT exist (collapsed into metaux_precieux)', () => {
    expect(ids).not.toContain('argent_physique');
    expect(ids).not.toContain('or_physique');
    expect(ids).not.toContain('platine_palladium');
  });

  it('metaux_precieux exists', () => {
    expect(ids).toContain('metaux_precieux');
  });
});

describe('Catalogue seed — prévoyance (split obligatoire)', () => {
  it('prevoyance_individuelle does NOT exist (replaced by split)', () => {
    expect(ids).not.toContain('prevoyance_individuelle');
  });

  it('split prevoyance products exist', () => {
    expect(ids).toContain('prevoyance_individuelle_deces');
    expect(ids).toContain('prevoyance_individuelle_itt_invalidite');
  });
});

/**
 * TODO PR1b (Migration DB)
 * Mappings pour les IDs splittés (à intégrer dans la migration Supabase) :
 * - 'immobilier_appartement_maison' -> ['residence_principale', 'residence_secondaire', 'locatif_nu', 'locatif_meuble'] (Nécessite intervention UI ou default='residence_principale')
 * - 'per_perin' -> ['perin_assurance', 'perin_bancaire'] (Nécessite intervention UI ou default='perin_assurance')
 */
export const SPLIT_ID_MIGRATION_MAP = {
  'immobilier_appartement_maison': 'residence_principale', // Default fallback
  'per_perin': 'perin_assurance', // Default fallback
};

describe('Catalogue seed — split immobilier', () => {
  it('immobilier_appartement_maison does NOT exist (replaced by split)', () => {
    expect(ids).not.toContain('immobilier_appartement_maison');
  });

  it.each([
    'residence_principale',
    'residence_secondaire',
    'locatif_nu',
    'locatif_meuble',
  ])('%s exists', (id) => {
    expect(ids).toContain(id);
  });

  it('all split immo entries are Immobilier direct + actif_instrument', () => {
    const splitIds = ['residence_principale', 'residence_secondaire', 'locatif_nu', 'locatif_meuble'];
    for (const id of splitIds) {
      const p = products.find((pr) => pr.id === id)!;
      expect(p.family).toBe('Immobilier direct');
      expect(p.kind).toBe('actif_instrument');
    }
  });

  it('residence_principale has PM exception (SCI perd exonération PV)', () => {
    const rp = products.find((p) => p.id === 'residence_principale')!;
    expect(rp.pmEligibility).toBe('exception');
    expect(rp.pmEligibilityNote).toBeTruthy();
  });
});

describe('Catalogue seed — entrées clés', () => {
  it('per_perin does NOT exist (replaced by split)', () => {
    expect(ids).not.toContain('per_perin');
  });

  it.each([
    'perin_assurance',
    'perin_bancaire',
    'article_39',
    'cto',
    'pea',
    'pea_pme',
  ])('%s exists', (id) => {
    expect(ids).toContain(id);
  });

  it('PERIN assurance is PP-only wrapper', () => {
    const p = products.find((pr) => pr.id === 'perin_assurance')!;
    expect(p.kind).toBe('contrat_compte_enveloppe');
    expect(p.pmEligibility).toBe('non');
    expect(p.ppDirectHoldable).toBe(true);
  });

  it('PERIN bancaire is PP-only wrapper', () => {
    const p = products.find((pr) => pr.id === 'perin_bancaire')!;
    expect(p.kind).toBe('contrat_compte_enveloppe');
    expect(p.pmEligibility).toBe('non');
    expect(p.ppDirectHoldable).toBe(true);
  });

  it('Article 39 is closed and PM-eligible', () => {
    const p = products.find((pr) => pr.id === 'article_39')!;
    expect(p.open2026).toBe('non');
    expect(p.pmEligibility).toBe('oui');
  });

  it('CTO is PP+PM wrapper', () => {
    const p = products.find((pr) => pr.id === 'cto')!;
    expect(p.kind).toBe('contrat_compte_enveloppe');
    expect(p.pmEligibility).toBe('oui');
    expect(p.ppDirectHoldable).toBe(true);
  });

  it('PEA is PP-only wrapper', () => {
    const p = products.find((pr) => pr.id === 'pea')!;
    expect(p.kind).toBe('contrat_compte_enveloppe');
    expect(p.pmEligibility).toBe('non');
  });

  it('PEA-PME is PP-only wrapper', () => {
    const p = products.find((pr) => pr.id === 'pea_pme')!;
    expect(p.kind).toBe('contrat_compte_enveloppe');
    expect(p.pmEligibility).toBe('non');
  });
});

describe('Catalogue seed — PP/PM cohérence', () => {
  it('all products are PP-holdable (directHoldable = true)', () => {
    const nonPP = products.filter((p) => !p.ppDirectHoldable);
    expect(nonPP.map((p) => p.id)).toEqual([]);
  });

  it('regulated savings (LEP, LDDS, Livret Jeune) are PP-only', () => {
    const ppOnly = ['lep', 'ldds', 'livret_jeune'];
    for (const id of ppOnly) {
      const p = products.find((pr) => pr.id === id)!;
      expect(p.pmEligibility, `${id} should be PP-only`).toBe('non');
    }
  });
});
