/**
 * Groupement foncier exoneration utility — Art. 793 bis CGI
 * GFA/GFV : 75% DMTG ≤ 600 000 € / bénéficiaire, 50% au-delà, plafond 20 M€ (LF 2025 art. 70).
 * GFF/GF  : 75% sans tranche ni plafond (art. 793 bis §3).
 */
import type { GroupementFoncierType } from './successionDraft.types';

export const SEUIL_EXONERATION_GF = 600_000;
/** Plafond de valeur exonérable pour GFA/GFV — LF 2025 art. 70, CGI art. 793 bis. */
export const PLAFOND_EXONERATION_GF = 20_000_000;

export function computeGroupementFoncierExoneration(
  type: GroupementFoncierType,
  valeur: number,
): { exonere: number; taxable: number } {
  if (valeur <= 0) return { exonere: 0, taxable: 0 };
  if (type === 'GFF' || type === 'GF') {
    const exonere = Math.round(valeur * 0.75);
    return { exonere, taxable: valeur - exonere };
  }
  // GFA / GFV : plafond 20 M€ sur la valeur exonérable (LF 2025)
  const valeurExonerable = Math.min(valeur, PLAFOND_EXONERATION_GF);
  if (valeurExonerable <= SEUIL_EXONERATION_GF) {
    const exonere = Math.round(valeurExonerable * 0.75);
    return { exonere, taxable: valeur - exonere };
  }
  const exonereTranche1 = Math.round(SEUIL_EXONERATION_GF * 0.75);
  const exonereTranche2 = Math.round((valeurExonerable - SEUIL_EXONERATION_GF) * 0.50);
  const exonere = exonereTranche1 + exonereTranche2;
  return { exonere, taxable: valeur - exonere };
}

export const GF_TYPE_OPTIONS: { value: GroupementFoncierType; label: string }[] = [
  { value: 'GFA', label: 'GFA' },
  { value: 'GFV', label: 'GFV' },
  { value: 'GFF', label: 'GFF' },
  { value: 'GF', label: 'GF' },
];

// Options UI regroupées (2 groupes correspondant aux 2 sous-catégories spéciales)
export const GF_UI_OPTIONS: { value: 'GFA' | 'GFF'; label: string }[] = [
  { value: 'GFA', label: 'GFA/GFV' },
  { value: 'GFF', label: 'GFF/GF' },
];

/**
 * Normalise un type GF legacy (4 valeurs) vers les 2 valeurs UI.
 * GFA ou GFV → 'GFA'  |  GFF ou GF → 'GFF'
 */
export function normalizeGfTypeForUi(type: GroupementFoncierType): 'GFA' | 'GFF' {
  return type === 'GFA' || type === 'GFV' ? 'GFA' : 'GFF';
}
