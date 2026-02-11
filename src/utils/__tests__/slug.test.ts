import { describe, it, expect } from 'vitest';
import {
  slugifyLabelToCamelCase,
  validateProductSlug,
  suggestAlternativeSlug,
  normalizeLabel,
} from '../slug';

// ---------------------------------------------------------------------------
// slugifyLabelToCamelCase
// ---------------------------------------------------------------------------

describe('slugifyLabelToCamelCase', () => {
  it('converts simple label', () => {
    expect(slugifyLabelToCamelCase('Assurance-vie')).toBe('assuranceVie');
  });

  it('converts multi-word label with spaces', () => {
    expect(slugifyLabelToCamelCase('PER individuel')).toBe('perIndividuel');
  });

  it('converts label with dashes', () => {
    expect(slugifyLabelToCamelCase('Compte-titres ordinaire')).toBe('compteTitresOrdinaire');
  });

  it('handles apostrophes', () => {
    expect(slugifyLabelToCamelCase("Plan d'épargne")).toBe('planDEpargne');
  });

  it('removes accents', () => {
    expect(slugifyLabelToCamelCase('Défiscalisation immobilière')).toBe('defiscalisationImmobiliere');
  });

  it('handles leading/trailing spaces', () => {
    expect(slugifyLabelToCamelCase('  Assurance vie  ')).toBe('assuranceVie');
  });

  it('collapses multiple spaces', () => {
    expect(slugifyLabelToCamelCase('Plan   épargne   actions')).toBe('planEpargneActions');
  });

  it('returns empty for empty input', () => {
    expect(slugifyLabelToCamelCase('')).toBe('');
    expect(slugifyLabelToCamelCase('   ')).toBe('');
  });

  it('handles single word', () => {
    expect(slugifyLabelToCamelCase('SCPI')).toBe('scpi');
  });

  it('handles numbers in label', () => {
    expect(slugifyLabelToCamelCase('Article 990 I')).toBe('article990I');
  });
});

// ---------------------------------------------------------------------------
// validateProductSlug
// ---------------------------------------------------------------------------

describe('validateProductSlug', () => {
  describe('valid slugs', () => {
    const validSlugs = [
      'assuranceVie',
      'pea',
      'cto',
      'perIndividuel',
      'scpiDefiscalisation',
      'art990I',
      'abc',
    ];
    for (const slug of validSlugs) {
      it(`accepts "${slug}"`, () => {
        const result = validateProductSlug(slug);
        expect(result.ok).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    }
  });

  describe('invalid slugs', () => {
    it('rejects empty string', () => {
      const r = validateProductSlug('');
      expect(r.ok).toBe(false);
      expect(r.errors[0]).toContain('requis');
    });

    it('rejects too short (< 3)', () => {
      const r = validateProductSlug('ab');
      expect(r.ok).toBe(false);
      expect(r.errors.some((e) => e.includes('Minimum'))).toBe(true);
    });

    it('rejects too long (> 40)', () => {
      const r = validateProductSlug('a'.repeat(41));
      expect(r.ok).toBe(false);
      expect(r.errors.some((e) => e.includes('Maximum'))).toBe(true);
    });

    it('rejects starting with uppercase', () => {
      const r = validateProductSlug('AssuranceVie');
      expect(r.ok).toBe(false);
      expect(r.errors.some((e) => e.includes('minuscule'))).toBe(true);
    });

    it('rejects starting with digit', () => {
      const r = validateProductSlug('990I');
      expect(r.ok).toBe(false);
      expect(r.errors.some((e) => e.includes('chiffre'))).toBe(true);
    });

    it('rejects dashes', () => {
      const r = validateProductSlug('assurance-vie');
      expect(r.ok).toBe(false);
      expect(r.errors.some((e) => e.includes('tiret'))).toBe(true);
    });

    it('rejects underscores', () => {
      const r = validateProductSlug('assurance_vie');
      expect(r.ok).toBe(false);
      expect(r.errors.some((e) => e.includes('underscore'))).toBe(true);
    });

    it('rejects spaces', () => {
      const r = validateProductSlug('assurance vie');
      expect(r.ok).toBe(false);
    });

    it('rejects accented characters', () => {
      const r = validateProductSlug('défiscalisation');
      expect(r.ok).toBe(false);
      expect(r.errors.some((e) => e.includes('accentué'))).toBe(true);
    });
  });

  describe('reserved slugs', () => {
    const reserved = ['admin', 'settings', 'baseContrat', 'taxSettings', 'psSettings', 'fiscalites'];
    for (const slug of reserved) {
      it(`rejects reserved "${slug}"`, () => {
        const r = validateProductSlug(slug);
        expect(r.ok).toBe(false);
        expect(r.errors.some((e) => e.includes('réservé'))).toBe(true);
      });
    }
  });

  describe('uniqueness', () => {
    it('rejects duplicate (exact case)', () => {
      const r = validateProductSlug('assuranceVie', ['assuranceVie', 'cto']);
      expect(r.ok).toBe(false);
      expect(r.errors.some((e) => e.includes('existe déjà'))).toBe(true);
    });

    it('rejects duplicate (case-insensitive)', () => {
      const r = validateProductSlug('assurancevie', ['assuranceVie', 'cto']);
      expect(r.ok).toBe(false);
      expect(r.errors.some((e) => e.includes('existe déjà'))).toBe(true);
    });

    it('accepts unique slug', () => {
      const r = validateProductSlug('perIndividuel', ['assuranceVie', 'cto']);
      expect(r.ok).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// suggestAlternativeSlug
// ---------------------------------------------------------------------------

describe('suggestAlternativeSlug', () => {
  it('appends 2 when base is taken', () => {
    expect(suggestAlternativeSlug('assuranceVie', ['assuranceVie'])).toBe('assuranceVie2');
  });

  it('increments suffix when 2 is also taken', () => {
    expect(suggestAlternativeSlug('pea', ['pea', 'pea2'])).toBe('pea3');
  });

  it('returns base+2 when no conflicts', () => {
    expect(suggestAlternativeSlug('cto', [])).toBe('cto2');
  });
});

// ---------------------------------------------------------------------------
// normalizeLabel
// ---------------------------------------------------------------------------

describe('normalizeLabel', () => {
  it('trims whitespace', () => {
    expect(normalizeLabel('  hello  ')).toBe('hello');
  });

  it('collapses double spaces', () => {
    expect(normalizeLabel('Plan   épargne   actions')).toBe('Plan épargne actions');
  });

  it('handles already clean label', () => {
    expect(normalizeLabel('Assurance-vie')).toBe('Assurance-vie');
  });
});
