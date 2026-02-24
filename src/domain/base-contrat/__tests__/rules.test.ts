/**
 * Tests du référentiel des règles fiscales (PR5).
 *
 * 1. Tous les produits du catalogue retournent des règles non-nulles.
 * 2. Pas de jargon dev dans les strings UI (title/bullets).
 * 3. Coverage : 100% de produits avec règles réelles.
 * 4. Confidence policy : chaque bloc a confidence, politique d'écriture respectée.
 */

import { describe, it, expect } from 'vitest';
import { CATALOG } from '../catalog';
import { getRules, hasSocleRules } from '../rules/index';
import type { RuleBlock } from '../rules/types';

const AUDIENCES = ['pp', 'pm'] as const;

// ─────────────────────────────────────────────────────────────
// 1. Tous les produits retournent des règles rendables
// ─────────────────────────────────────────────────────────────

describe('getRules — couverture universelle', () => {
  for (const product of CATALOG) {
    const audience = product.ppEligible ? 'pp' : 'pm';
    it(`${product.id} (${audience}) — règles non-nulles avec les 3 phases`, () => {
      const rules = getRules(product.id, audience);
      expect(rules).toBeDefined();
      expect(Array.isArray(rules.constitution)).toBe(true);
      expect(Array.isArray(rules.sortie)).toBe(true);
      expect(Array.isArray(rules.deces)).toBe(true);
      expect(rules.constitution.length).toBeGreaterThanOrEqual(1);
      expect(rules.sortie.length).toBeGreaterThanOrEqual(1);
      expect(rules.deces.length).toBeGreaterThanOrEqual(1);
    });
  }
});

describe('getRules — chaque bloc a title + bullets non vides', () => {
  for (const product of CATALOG) {
    const audience = product.ppEligible ? 'pp' : 'pm';
    it(`${product.id} — blocs valides`, () => {
      const rules = getRules(product.id, audience);
      const allBlocks = [...rules.constitution, ...rules.sortie, ...rules.deces];
      for (const block of allBlocks) {
        expect(block.title, `title vide dans ${product.id}`).toBeTruthy();
        expect(Array.isArray(block.bullets), `bullets non-array dans ${product.id}`).toBe(true);
        expect(block.bullets.length, `bullets vide dans ${product.id}`).toBeGreaterThanOrEqual(1);
        for (const bullet of block.bullets) {
          expect(bullet.trim().length, `bullet vide dans ${product.id}`).toBeGreaterThan(0);
        }
      }
    });
  }
});

// ─────────────────────────────────────────────────────────────
// 2. Pas de jargon dev dans les strings UI
// ─────────────────────────────────────────────────────────────

const DEV_PATTERNS = [
  /_pp\b/,
  /_pm\b/,
  /\[.*\]/,
  /\{.*\}/,
  /\bpayload\b/i,
  /\bschema\b/i,
  /\bslug\b/i,
  /\bcontrat_capitalisation\b/,
  /\bassurance_vie\b/,
  /\bproductId\b/,
  /\bundefined\b/,
  /\bnull\b/,
];

describe('getRules — pas de jargon technique dans title/bullets', () => {
  for (const product of CATALOG) {
    const audience = product.ppEligible ? 'pp' : 'pm';
    it(`${product.id} — UI clean (no dev jargon)`, () => {
      const rules = getRules(product.id, audience);
      const allBlocks = [...rules.constitution, ...rules.sortie, ...rules.deces];
      for (const block of allBlocks) {
        for (const pattern of DEV_PATTERNS) {
          expect(
            pattern.test(block.title),
            `Jargon "${pattern}" trouvé dans title de ${product.id}: "${block.title}"`,
          ).toBe(false);
          for (const bullet of block.bullets) {
            expect(
              pattern.test(bullet),
              `Jargon "${pattern}" trouvé dans bullet de ${product.id}: "${bullet}"`,
            ).toBe(false);
          }
        }
      }
    });
  }
});

// ─────────────────────────────────────────────────────────────
// 3. Coverage — produits avec règles réelles
// ─────────────────────────────────────────────────────────────

describe('hasSocleRules — coverage report', () => {
  it('100 % des produits ont des règles réelles', () => {
    const withRules = CATALOG.filter((p) => hasSocleRules(p.id));
    expect(withRules.length).toBe(CATALOG.length);
  });
});

// ─────────────────────────────────────────────────────────────
// 4. Produits clés — règles réelles attendues
// ─────────────────────────────────────────────────────────────

describe('socle PR5 — produits clés avec règles réelles', () => {
  const SOCLE_IDS = [
    'assurance_vie',
    'contrat_capitalisation',
    'cto',
    'pea',
    'pea_pme',
    'perin_assurance',
    'perin_bancaire',
    'residence_principale',
    'locatif_nu',
    'locatif_meuble_lmnp',
    'parts_scpi',
    'tontine',
    'prevoyance_individuelle_deces',
    'prevoyance_individuelle_itt_invalidite',
    'livret_a',
    'ldds',
    'lep',
    'crypto_actifs',
    'metaux_precieux',
  ];

  for (const id of SOCLE_IDS) {
    it(`${id} — règles réelles (non vide)`, () => {
      expect(hasSocleRules(id), `${id} n'a pas de règles`).toBe(true);
    });
  }
});

// ─────────────────────────────────────────────────────────────
// 5. Audience PM — produits non éligibles retournent quand même des règles
// ─────────────────────────────────────────────────────────────

describe('getRules — audience PM sur produits PP-only', () => {
  it('assurance_vie (PP only) — getRules(pm) retourne quand même des règles (fallback)', () => {
    const rules = getRules('assurance_vie', 'pm');
    expect(rules).toBeDefined();
    // Peut être les règles spécifiques PM ou les règles PP (fallback) — toujours rendable
    expect(rules.constitution.length).toBeGreaterThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────
// 6. Stabilité pour id inconnu
// ─────────────────────────────────────────────────────────────

describe('getRules — id inconnu', () => {
  for (const audience of AUDIENCES) {
    it(`getRules("produit_inexistant", "${audience}") → objet vide sans crash`, () => {
      const rules = getRules('produit_inexistant', audience);
      expect(rules).toBeDefined();
      expect(rules.constitution.length).toBe(0);
      expect(rules.sortie.length).toBe(0);
      expect(rules.deces.length).toBe(0);
    });
  }
});

// ─────────────────────────────────────────────────────────────
// 7. Confidence policy — tous les blocs ont un niveau de confiance valide
// ─────────────────────────────────────────────────────────────

const VALID_CONFIDENCE = ['elevee', 'moyenne', 'faible'];

function allBlocks(productId: string): RuleBlock[] {
  const pp = getRules(productId, 'pp');
  const pm = getRules(productId, 'pm');
  return [
    ...pp.constitution, ...pp.sortie, ...pp.deces,
    ...pm.constitution, ...pm.sortie, ...pm.deces,
  ];
}

describe('confidence policy — chaque bloc a une confiance valide', () => {
  for (const product of CATALOG) {
    it(`${product.id} — confidence présente et valide`, () => {
      const blocks = allBlocks(product.id);
      for (const block of blocks) {
        expect(
          VALID_CONFIDENCE.includes(block.confidence),
          `Confidence invalide "${block.confidence}" dans ${product.id} / "${block.title}"`,
        ).toBe(true);
      }
    });
  }
});

// ─────────────────────────────────────────────────────────────
// 8. Confidence policy — blocs moyenne/faible doivent avoir "À confirmer"
// ─────────────────────────────────────────────────────────────

describe('confidence policy — moyenne/faible → "À confirmer" dans au moins 1 bullet', () => {
  for (const product of CATALOG) {
    it(`${product.id} — prudence rédactionnelle`, () => {
      const blocks = allBlocks(product.id);
      for (const block of blocks) {
        if (block.confidence === 'moyenne' || block.confidence === 'faible') {
          const hasConfirmer = block.bullets.some((b) => b.includes('À confirmer'));
          expect(
            hasConfirmer,
            `Bloc "${block.title}" (${product.id}) confidence=${block.confidence} sans "À confirmer" dans les bullets`,
          ).toBe(true);
        }
      }
    });
  }
});

// ─────────────────────────────────────────────────────────────
// 9. Confidence policy — moyenne/faible doivent avoir dependencies
// ─────────────────────────────────────────────────────────────

describe('confidence policy — moyenne/faible → dependencies non vides', () => {
  for (const product of CATALOG) {
    it(`${product.id} — dependencies présentes`, () => {
      const blocks = allBlocks(product.id);
      for (const block of blocks) {
        if (block.confidence === 'moyenne' || block.confidence === 'faible') {
          expect(
            Array.isArray(block.dependencies) && block.dependencies.length > 0,
            `Bloc "${block.title}" (${product.id}) confidence=${block.confidence} sans dependencies`,
          ).toBe(true);
        }
      }
    });
  }
});

// ─────────────────────────────────────────────────────────────
// 10. Sources — URLs valides https://
// ─────────────────────────────────────────────────────────────

describe('confidence policy — sources ont des URLs https valides', () => {
  for (const product of CATALOG) {
    it(`${product.id} — sources URLs`, () => {
      const blocks = allBlocks(product.id);
      for (const block of blocks) {
        if (block.sources) {
          for (const src of block.sources) {
            expect(src.label.length, `Source sans label dans ${product.id}`).toBeGreaterThan(0);
            expect(
              src.url.startsWith('https://'),
              `URL invalide "${src.url}" dans ${product.id} / "${block.title}"`,
            ).toBe(true);
          }
        }
      }
    });
  }
});

// ─────────────────────────────────────────────────────────────
// 11. Strings interdites — PR6 qualité rédactionnelle
// ─────────────────────────────────────────────────────────────

describe('strings interdites — PR6 fiabilisation', () => {
  it('prevoyance_deces (PP) — pas de "2,5 % du PASS" dans constitution', () => {
    const rules = getRules('prevoyance_individuelle_deces', 'pp');
    const allBullets = rules.constitution.flatMap((b) => b.bullets);
    for (const bullet of allBullets) {
      expect(
        bullet,
        'Bullet interdit : "2,5 % du PASS" détecté dans prevoyance_deces constitution',
      ).not.toContain('2,5 % du PASS');
    }
  });

  it('article_83 — pas de mention "Article 39" dans les bullets', () => {
    const pp = getRules('article_83', 'pp');
    const pm = getRules('article_83', 'pm');
    const allBullets = [
      ...pp.constitution, ...pp.sortie, ...pp.deces,
      ...pm.constitution, ...pm.sortie, ...pm.deces,
    ].flatMap((b) => b.bullets);
    for (const bullet of allBullets) {
      expect(
        bullet,
        'Bullet interdit : "Article 39" détecté dans article_83',
      ).not.toMatch(/[Aa]rticle 39/);
    }
  });

  it('contrat_capitalisation (PP) — pas de "238 septies E" dans les bullets', () => {
    const rules = getRules('contrat_capitalisation', 'pp');
    const allBullets = [
      ...rules.constitution, ...rules.sortie, ...rules.deces,
    ].flatMap((b) => b.bullets);
    for (const bullet of allBullets) {
      expect(
        bullet,
        'Bullet interdit : "238 septies E" visible côté PP dans contrat_capitalisation',
      ).not.toContain('238 septies E');
    }
  });
});
