import { describe, expect, it } from 'vitest';
import {
  ASSET_SUBCATEGORY_OPTIONS,
  SPECIAL_ASSET_SUBCATEGORIES,
} from '../successionSimulator.constants';
import {
  GF_UI_OPTIONS,
  normalizeGfTypeForUi,
} from '../successionGroupementFoncier';

describe('SPECIAL_ASSET_SUBCATEGORIES', () => {
  it('contains exactly the five expected sentinel values', () => {
    expect([...SPECIAL_ASSET_SUBCATEGORIES]).toEqual([
      'GFA/GFV',
      'GFF/GF',
      'Assurance vie',
      'PER assurance',
      'Prévoyance décès',
    ]);
  });

  it('GFA/GFV and GFF/GF appear in the immobilier list', () => {
    expect(ASSET_SUBCATEGORY_OPTIONS.immobilier).toContain('GFA/GFV');
    expect(ASSET_SUBCATEGORY_OPTIONS.immobilier).toContain('GFF/GF');
  });

  it('Assurance vie and PER assurance appear in the financier list', () => {
    expect(ASSET_SUBCATEGORY_OPTIONS.financier).toContain('Assurance vie');
    expect(ASSET_SUBCATEGORY_OPTIONS.financier).toContain('PER assurance');
  });

  it('Prévoyance décès appears in the divers list', () => {
    expect(ASSET_SUBCATEGORY_OPTIONS.divers).toContain('Prévoyance décès');
  });
});

describe('special subcategories positioned at end of list (never default)', () => {
  it('GFA/GFV is the last-or-second-to-last entry in immobilier', () => {
    const list = ASSET_SUBCATEGORY_OPTIONS.immobilier;
    const idx = list.indexOf('GFA/GFV');
    expect(idx).toBeGreaterThanOrEqual(list.length - 2); // among last 2
  });

  it('GFF/GF is the last entry in immobilier', () => {
    const list = ASSET_SUBCATEGORY_OPTIONS.immobilier;
    expect(list[list.length - 1]).toBe('GFF/GF');
  });

  it('PER assurance is the last entry in financier', () => {
    const list = ASSET_SUBCATEGORY_OPTIONS.financier;
    expect(list[list.length - 1]).toBe('PER assurance');
  });

  it('Assurance vie is second-to-last in financier', () => {
    const list = ASSET_SUBCATEGORY_OPTIONS.financier;
    expect(list[list.length - 2]).toBe('Assurance vie');
  });

  it('Prévoyance décès is the last entry in divers', () => {
    const list = ASSET_SUBCATEGORY_OPTIONS.divers;
    expect(list[list.length - 1]).toBe('Prévoyance décès');
  });

  it('default (first) subcategory for each category is never a special subcategory', () => {
    const specials = new Set<string>(SPECIAL_ASSET_SUBCATEGORIES);
    for (const [category, list] of Object.entries(ASSET_SUBCATEGORY_OPTIONS)) {
      expect(specials.has(list[0]), `${category} default is a special subcategory`).toBe(false);
    }
  });
});

describe('normalizeGfTypeForUi — legacy compat mapping', () => {
  it('GFA maps to GFA', () => expect(normalizeGfTypeForUi('GFA')).toBe('GFA'));
  it('GFV maps to GFA (legacy alias)', () => expect(normalizeGfTypeForUi('GFV')).toBe('GFA'));
  it('GFF maps to GFF', () => expect(normalizeGfTypeForUi('GFF')).toBe('GFF'));
  it('GF maps to GFF (legacy alias)', () => expect(normalizeGfTypeForUi('GF')).toBe('GFF'));
});

describe('GF_UI_OPTIONS', () => {
  it('has exactly two options', () => expect(GF_UI_OPTIONS).toHaveLength(2));

  it('first option is GFA labeled GFA/GFV', () => {
    expect(GF_UI_OPTIONS[0]).toEqual({ value: 'GFA', label: 'GFA/GFV' });
  });

  it('second option is GFF labeled GFF/GF', () => {
    expect(GF_UI_OPTIONS[1]).toEqual({ value: 'GFF', label: 'GFF/GF' });
  });
});
