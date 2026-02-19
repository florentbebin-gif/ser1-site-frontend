/**
 * Tests unitaires — humanizeFieldKey() + formatRefLabel()
 * src/constants/base-contrat/fieldLabels.fr.ts
 */

import { describe, it, expect } from 'vitest';
import {
  humanizeFieldKey,
  formatRefLabel,
  FIELD_LABELS_FR,
} from '../../constants/base-contrat/fieldLabels.fr';

// ---------------------------------------------------------------------------
// humanizeFieldKey
// ---------------------------------------------------------------------------

describe('humanizeFieldKey', () => {
  it('retourne le label FR mappé pour une clé connue', () => {
    expect(humanizeFieldKey('irRatePercent')).toBe('Taux IR (PFU)');
    expect(humanizeFieldKey('abattementAnnuelSingle')).toBe('Abattement annuel (célibataire)');
    expect(humanizeFieldKey('psRatePercent')).toBe('Taux PS (prélèvements sociaux)');
    expect(humanizeFieldKey('allowBaremeIR')).toBe('Option barème IR autorisée');
    expect(humanizeFieldKey('abattementParBeneficiaire')).toBe('Abattement par bénéficiaire');
    expect(humanizeFieldKey('brackets')).toBe('Barème par tranches');
  });

  it('préserve les acronymes en majuscules dans le fallback', () => {
    const result = humanizeFieldKey('unknownIRField');
    expect(result).toContain('IR');
    expect(result).not.toMatch(/\bir\b/); // "ir" en minuscules ne doit pas apparaître
  });

  it('produit un fallback lisible pour une clé inconnue (camelCase → mots)', () => {
    const result = humanizeFieldKey('someUnknownField');
    // Premier mot capitalisé, reste en minuscules
    expect(result).toMatch(/^Some/);
    expect(result).toContain('unknown');
    expect(result).toContain('field');
  });

  it('couvre toutes les clés de FIELD_LABELS_FR (pas de valeur vide)', () => {
    for (const [key, label] of Object.entries(FIELD_LABELS_FR)) {
      expect(label.trim().length, `Label vide pour la clé "${key}"`).toBeGreaterThan(0);
      expect(humanizeFieldKey(key)).toBe(label);
    }
  });
});

// ---------------------------------------------------------------------------
// formatRefLabel
// ---------------------------------------------------------------------------

describe('formatRefLabel', () => {
  it('retourne le label mappé pour $ref:tax_settings.pfu.current.rateIR', () => {
    const meta = formatRefLabel('$ref:tax_settings.pfu.current.rateIR');
    expect(meta.label).toBe('Taux IR — PFU (flat tax)');
    expect(meta.source).toBe('Paramètres Impôts');
    expect(meta.settingsRoute).toBe('/settings/impots');
  });

  it('retourne le label mappé pour $ref:tax_settings.pfu.current.rateSocial', () => {
    const meta = formatRefLabel('$ref:tax_settings.pfu.current.rateSocial');
    expect(meta.label).toBe('Taux PS — PFU');
    expect(meta.source).toBe('Paramètres Impôts');
  });

  it('retourne le label mappé pour $ref:ps_settings.patrimony.current.totalRate', () => {
    const meta = formatRefLabel('$ref:ps_settings.patrimony.current.totalRate');
    expect(meta.label).toBe('Taux PS — Patrimoine (taux global)');
    expect(meta.source).toBe('Paramètres Prélèvements sociaux');
    expect(meta.settingsRoute).toBe('/settings/prelevements');
  });

  it('produit un fallback lisible pour une $ref inconnue (tax_settings)', () => {
    const meta = formatRefLabel('$ref:tax_settings.foo.bar.someRate');
    expect(meta.source).toBe('Paramètres Impôts');
    expect(meta.settingsRoute).toBe('/settings/impots');
    expect(meta.label.length).toBeGreaterThan(0);
    expect(meta.label).not.toContain('$ref:');
  });

  it('produit un fallback lisible pour une $ref inconnue (ps_settings)', () => {
    const meta = formatRefLabel('$ref:ps_settings.foo.bar.totalRate');
    expect(meta.source).toBe('Paramètres Prélèvements sociaux');
    expect(meta.settingsRoute).toBe('/settings/prelevements');
  });

  it('ne retourne jamais la chaîne $ref: brute dans le label', () => {
    const refs = [
      '$ref:tax_settings.pfu.current.rateIR',
      '$ref:ps_settings.patrimony.current.totalRate',
      '$ref:tax_settings.unknown.field',
    ];
    for (const ref of refs) {
      const meta = formatRefLabel(ref);
      expect(meta.label).not.toContain('$ref:');
      expect(meta.source).not.toContain('$ref:');
    }
  });
});
