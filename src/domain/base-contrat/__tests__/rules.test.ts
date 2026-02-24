/**
 * Tests du référentiel des règles fiscales (PR5).
 *
 * 1. Tous les produits du catalogue retournent des règles non-nulles.
 * 2. Pas de jargon dev dans les strings UI (title/bullets).
 * 3. Coverage : snapshot des produits encore en placeholder.
 */

import { describe, it, expect } from 'vitest';
import { CATALOG } from '../catalog';
import { getRules, hasSocleRules } from '../rules/index';

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
// 3. Coverage — produits avec règles réelles vs placeholders
// ─────────────────────────────────────────────────────────────

describe('hasSocleRules — coverage report', () => {
  it('au moins 60 % des produits ont des règles réelles', () => {
    const withRules = CATALOG.filter((p) => hasSocleRules(p.id));
    const ratio = withRules.length / CATALOG.length;
    expect(ratio).toBeGreaterThanOrEqual(0.60);
  });

  it('snapshot : liste des produits encore en placeholder (pour roadmap P1-05)', () => {
    const placeholders = CATALOG
      .filter((p) => !hasSocleRules(p.id))
      .map((p) => p.id);

    // Ce test documente les produits restants — pas un échec si la liste change,
    // mais un indicateur de progression pour P1-05.
    console.info(
      `[PR5 Coverage] Produits avec règles réelles : ${CATALOG.length - placeholders.length}/${CATALOG.length}`,
      '\nPlaceholders restants :',
      placeholders,
    );
    // Le test passe toujours : son rôle est documentaire.
    expect(Array.isArray(placeholders)).toBe(true);
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
    it(`${id} — règles réelles (non placeholder)`, () => {
      expect(hasSocleRules(id), `${id} est encore en placeholder`).toBe(true);
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
    // Peut être placeholder ou les règles PP (fallback) — toujours rendable
    expect(rules.constitution.length).toBeGreaterThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────
// 6. Stabilité pour id inconnu
// ─────────────────────────────────────────────────────────────

describe('getRules — id inconnu', () => {
  for (const audience of AUDIENCES) {
    it(`getRules("produit_inexistant", "${audience}") → placeholder sans crash`, () => {
      const rules = getRules('produit_inexistant', audience);
      expect(rules).toBeDefined();
      expect(rules.isPlaceholder).toBe(true);
    });
  }
});
