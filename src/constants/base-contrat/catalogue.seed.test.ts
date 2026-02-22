/**
 * catalogue.seed.test.ts — Validation du catalogue patrimonial (P1-05 PR1b).
 *
 * Garanties :
 *  - Zéro produit structuré
 *  - Zéro exception PM (Point 6)
 *  - IDs uniques
 *  - Champs obligatoires présents
 *  - Assimilation OPC + groupements fonciers (Point 2)
 *  - Split immobilier correct
 *  - Entrées clés présentes
 *  - PP/PM cohérent + split PP/PM (Point 5)
 *  - Pas de doublons sémantiques (Point 4)
 */

import { describe, it, expect } from 'vitest';
import rawCatalogue from './catalogue.seed.v1.json';
import { SEED_PRODUCTS, mergeSeedIntoProducts } from '../baseContratSeed';

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
    expect(['oui', 'non']).toContain(p.pmEligibility);
    expect(['oui', 'non', 'na']).toContain(p.open2026);
  });

  it('no product has pmEligibility "exception" (Point 6)', () => {
    const exceptions = products.filter((p) => p.pmEligibility === 'exception');
    expect(exceptions).toHaveLength(0);
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

  it('metaux_precieux is in family "Autres" (assimilation)', () => {
    const p = products.find((pr) => pr.id === 'metaux_precieux')!;
    expect(p.family).toBe('Autres');
  });
});

describe('Catalogue seed — crypto-actifs (assimilation: zéro sous-catégories)', () => {
  it('detailed crypto products do NOT exist (collapsed into crypto_actifs)', () => {
    expect(ids).not.toContain('bitcoin_btc');
    expect(ids).not.toContain('ether_eth');
    expect(ids).not.toContain('nft');
    expect(ids).not.toContain('stablecoins');
    expect(ids).not.toContain('tokens_autres');
  });

  it('crypto_actifs exists and is in family "Autres"', () => {
    expect(ids).toContain('crypto_actifs');
    const p = products.find((pr) => pr.id === 'crypto_actifs')!;
    expect(p.family).toBe('Autres');
  });
});

describe('Catalogue seed — gouvernance familles (pas de buckets dédiés crypto/métaux)', () => {
  it('no product uses legacy families "Crypto-actifs" or "Métaux précieux"', () => {
    const invalid = products.filter((p) => p.family === 'Crypto-actifs' || p.family === 'Métaux précieux');
    expect(invalid).toHaveLength(0);
  });
});

describe('Catalogue seed — OPC / underlying assets removed (not directly subscribable)', () => {
  it('OPC/SICAV/FCP/ETF do NOT exist (underlying of CTO/PEA)', () => {
    expect(ids).not.toContain('etf');
    expect(ids).not.toContain('fcp');
    expect(ids).not.toContain('opcvm');
    expect(ids).not.toContain('sicav');
    expect(ids).not.toContain('opc_opcvm');
  });

  it('FCPE does NOT exist (underlying of PEE/PERCOL)', () => {
    expect(ids).not.toContain('fcpe');
  });

  it('directly subscribable funds remain (FCPR, FCPI, FIP, OPCI)', () => {
    expect(ids).toContain('fcpr');
    expect(ids).toContain('fcpi');
    expect(ids).toContain('fip');
    expect(ids).toContain('opci_grand_public');
  });
});

describe('Catalogue seed — groupements fonciers (split by succession regime)', () => {
  it('legacy detailed IDs do NOT exist', () => {
    expect(ids).not.toContain('gfa');
    expect(ids).not.toContain('gfv');
    expect(ids).not.toContain('groupement_forestier');
    expect(ids).not.toContain('groupement_foncier');
  });

  it('GFA/GFV split exists (art. 793 bis)', () => {
    expect(ids).toContain('groupement_foncier_agri_viti');
    const p = products.find((pr) => pr.id === 'groupement_foncier_agri_viti')!;
    expect(p.family).toBe('Immobilier indirect (pierre-papier & foncier)');
  });

  it('GFF split exists (art. 793 1° 3°)', () => {
    expect(ids).toContain('groupement_foncier_forestier');
    const p = products.find((pr) => pr.id === 'groupement_foncier_forestier')!;
    expect(p.family).toBe('Immobilier indirect (pierre-papier & foncier)');
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

/** Legacy ID remap — now handled by V4→V5 migration in baseContratSettingsCache.ts */
export const SPLIT_ID_MIGRATION_MAP = {
  'immobilier_appartement_maison': 'residence_principale',
  'per_perin': 'perin_assurance',
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

  it('residence_principale is PP-only (Point 6: no exception)', () => {
    const rp = products.find((p) => p.id === 'residence_principale')!;
    expect(rp.pmEligibility).toBe('non');
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
    'tontine',
    'assurance_homme_cle',
  ])('%s exists', (id) => {
    expect(ids).toContain(id);
  });

  it('tontine is PP+PM in Autres', () => {
    const p = products.find((pr) => pr.id === 'tontine')!;
    expect(p.family).toBe('Autres');
    expect(p.kind).toBe('contrat_compte_enveloppe');
    expect(p.ppDirectHoldable).toBe(true);
    expect(p.pmEligibility).toBe('oui');
  });

  it('assurance_homme_cle is PM-only protection', () => {
    const p = products.find((pr) => pr.id === 'assurance_homme_cle')!;
    expect(p.family).toBe('Assurance');
    expect(p.ppDirectHoldable).toBe(false);
    expect(p.pmEligibility).toBe('oui');
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

  it('PEL is PP-only (personnes physiques)', () => {
    const p = products.find((pr) => pr.id === 'pel')!;
    expect(p.pmEligibility).toBe('non');
    expect(p.ppDirectHoldable).toBe(true);
  });

  it('PERIN products are in Retraite & épargne salariale (not Assurance)', () => {
    const perIds = ['perin_assurance', 'perin_bancaire'];
    for (const id of perIds) {
      const p = products.find((pr) => pr.id === id)!;
      expect(p.family, `${id} should be in Retraite`).toBe('Retraite & épargne salariale');
    }
  });
});

describe('Catalogue seed — PP/PM cohérence', () => {
  /** PM-only products (PP cannot subscribe directly) */
  const PM_ONLY_IDS = ['assurance_homme_cle'];

  it('all products except PM-only are PP-holdable', () => {
    const nonPP = products.filter((p) => !p.ppDirectHoldable);
    expect(nonPP.map((p) => p.id).sort()).toEqual([...PM_ONLY_IDS].sort());
  });

  it('PM-only products have pmEligibility oui', () => {
    for (const id of PM_ONLY_IDS) {
      const p = products.find((pr) => pr.id === id)!;
      expect(p.pmEligibility, `${id} should be PM-eligible`).toBe('oui');
    }
  });

  it('regulated savings (LEP, LDDS, Livret Jeune, PEL, CEL) are PP-only', () => {
    const ppOnly = ['lep', 'ldds', 'livret_jeune', 'pel', 'cel'];
    for (const id of ppOnly) {
      const p = products.find((pr) => pr.id === id)!;
      expect(p.pmEligibility, `${id} should be PP-only`).toBe('non');
    }
  });
});

// ---------------------------------------------------------------------------
// Point 5 — PP/PM split (via SEED_PRODUCTS transform)
// ---------------------------------------------------------------------------

describe('SEED_PRODUCTS — PP/PM split (Point 5)', () => {
  const seedIds = SEED_PRODUCTS.map((p) => p.id);

  it('PP+PM raw products are split into _pp and _pm variants', () => {
    // CTO is PP+PM in raw seed → must become cto_pp + cto_pm
    expect(seedIds).toContain('cto_pp');
    expect(seedIds).toContain('cto_pm');
    expect(seedIds).not.toContain('cto');
  });

  it('PP-only products are NOT split', () => {
    // PEA is PP-only → stays as pea
    expect(seedIds).toContain('pea');
    expect(seedIds).not.toContain('pea_pp');
  });

  it('PM-only products are NOT split', () => {
    // assurance_homme_cle is PM-only → stays as-is
    expect(seedIds).toContain('assurance_homme_cle');
    expect(seedIds).not.toContain('assurance_homme_cle_pp');
  });

  it('all SEED_PRODUCTS have unique IDs', () => {
    expect(new Set(seedIds).size).toBe(seedIds.length);
  });

  it('every product is either PP-only or PM-only (no mixed)', () => {
    const mixed = SEED_PRODUCTS.filter((p) => p.directHoldable && p.corporateHoldable);
    expect(mixed).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Point 7 — mergeSeedIntoProducts
// ---------------------------------------------------------------------------

describe('mergeSeedIntoProducts (Point 7)', () => {
  it('adds missing products without overwriting existing ones', () => {
    const existing = [SEED_PRODUCTS[0]]; // Keep first product
    const merged = mergeSeedIntoProducts(existing);
    expect(merged.length).toBe(SEED_PRODUCTS.length);
    expect(merged[0].id).toBe(existing[0].id);
  });

  it('returns same count when all products exist', () => {
    const merged = mergeSeedIntoProducts([...SEED_PRODUCTS]);
    expect(merged.length).toBe(SEED_PRODUCTS.length);
  });
});

// ---------------------------------------------------------------------------
// Point 4 — No semantic duplicates
// ---------------------------------------------------------------------------

describe('Catalogue seed — no duplicates (Point 4)', () => {
  it('no product ID appears in more than one family', () => {
    const idFamilyMap = new Map<string, string>();
    for (const p of products) {
      if (idFamilyMap.has(p.id)) {
        expect.fail(`Duplicate product ${p.id} found in families: ${idFamilyMap.get(p.id)} and ${p.family}`);
      }
      idFamilyMap.set(p.id, p.family);
    }
  });
});
