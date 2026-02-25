/**
 * domain/base-contrat/rules/__tests__/fiscalProfile.test.ts
 *
 * PR8 — Tests unitaires pour fiscalProfile.ts.
 * Couvre : getEnvelopeCatalogId / buildFiscalProfile / emptyFiscalProfile.
 */

import { describe, it, expect } from 'vitest';
import {
  getEnvelopeCatalogId,
  buildFiscalProfile,
  emptyFiscalProfile,
} from '../fiscalProfile';
import type { ProductRules } from '../types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const EMPTY_RULES: ProductRules = {
  constitution: [],
  sortie: [],
  deces: [],
};

const RULES_WITH_DATA: ProductRules = {
  constitution: [
    { title: 'Plafond déductible', bullets: ['8 000 €/an'], confidence: 'elevee' },
  ],
  sortie: [],
  deces: [],
};

// ── getEnvelopeCatalogId ──────────────────────────────────────────────────────

describe('getEnvelopeCatalogId', () => {
  it('AV + pp → assurance_vie', () => {
    expect(getEnvelopeCatalogId('AV', 'pp')).toBe('assurance_vie');
  });

  it('AV + pm → contrat_capitalisation_pm', () => {
    expect(getEnvelopeCatalogId('AV', 'pm')).toBe('contrat_capitalisation_pm');
  });

  it('PER + pp + assurance → perin_assurance', () => {
    expect(getEnvelopeCatalogId('PER', 'pp', false)).toBe('perin_assurance');
  });

  it('PER + pp + bancaire → perin_bancaire', () => {
    expect(getEnvelopeCatalogId('PER', 'pp', true)).toBe('perin_bancaire');
  });

  it('PER + pm → perin_assurance (pas de split PP/PM)', () => {
    expect(getEnvelopeCatalogId('PER', 'pm')).toBe('perin_assurance');
  });

  it('PEA + pp → pea', () => {
    expect(getEnvelopeCatalogId('PEA', 'pp')).toBe('pea');
  });

  it('PEA + pm → null (PEA réservé PP)', () => {
    expect(getEnvelopeCatalogId('PEA', 'pm')).toBeNull();
  });

  it('CTO + pp → cto_pp', () => {
    expect(getEnvelopeCatalogId('CTO', 'pp')).toBe('cto_pp');
  });

  it('CTO + pm → cto_pm', () => {
    expect(getEnvelopeCatalogId('CTO', 'pm')).toBe('cto_pm');
  });

  it('SCPI + pp → parts_scpi_pp', () => {
    expect(getEnvelopeCatalogId('SCPI', 'pp')).toBe('parts_scpi_pp');
  });

  it('SCPI + pm → parts_scpi_pm', () => {
    expect(getEnvelopeCatalogId('SCPI', 'pm')).toBe('parts_scpi_pm');
  });

  it('enveloppe inconnue → null', () => {
    expect(getEnvelopeCatalogId('UNKNOWN', 'pp')).toBeNull();
  });
});

// ── buildFiscalProfile ────────────────────────────────────────────────────────

describe('buildFiscalProfile', () => {
  it('hasRules = false si toutes les phases sont vides', () => {
    const profile = buildFiscalProfile('assurance_vie', 'pp', EMPTY_RULES);
    expect(profile.hasRules).toBe(false);
    expect(profile.catalogId).toBe('assurance_vie');
    expect(profile.audience).toBe('pp');
  });

  it('hasRules = true si au moins une phase a des règles', () => {
    const profile = buildFiscalProfile('perin_assurance', 'pp', RULES_WITH_DATA);
    expect(profile.hasRules).toBe(true);
    expect(profile.rules.constitution).toHaveLength(1);
  });

  it('retourne exactement les règles passées', () => {
    const profile = buildFiscalProfile('cto_pp', 'pp', RULES_WITH_DATA);
    expect(profile.rules).toBe(RULES_WITH_DATA);
  });
});

// ── emptyFiscalProfile ────────────────────────────────────────────────────────

describe('emptyFiscalProfile', () => {
  it('hasRules = false', () => {
    const profile = emptyFiscalProfile('pea', 'pp');
    expect(profile.hasRules).toBe(false);
  });

  it('toutes les phases sont vides', () => {
    const profile = emptyFiscalProfile('pea', 'pp');
    expect(profile.rules.constitution).toHaveLength(0);
    expect(profile.rules.sortie).toHaveLength(0);
    expect(profile.rules.deces).toHaveLength(0);
  });

  it('conserve catalogId et audience', () => {
    const profile = emptyFiscalProfile('cto_pm', 'pm');
    expect(profile.catalogId).toBe('cto_pm');
    expect(profile.audience).toBe('pm');
  });
});
