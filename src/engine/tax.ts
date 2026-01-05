/**
 * Module Tax - Calculs fiscaux (IR, TMI, CEHR, IFI)
 * 
 * IMPORTANT: Les barèmes sont paramétrables. Si une règle est incertaine,
 * elle est marquée avec un warning "À valider".
 */

import { mkResult, mkRuleVersion, addValidationWarning } from './helpers';
import type { CalcResult, Warning } from './types';

// Barème IR 2024 (revenus 2023)
export const BAREME_IR_2024 = [
  { min: 0, max: 11_294, taux: 0 },
  { min: 11_294, max: 28_797, taux: 11 },
  { min: 28_797, max: 82_341, taux: 30 },
  { min: 82_341, max: 177_106, taux: 41 },
  { min: 177_106, max: Infinity, taux: 45 },
];

// Barème CEHR (Contribution Exceptionnelle sur les Hauts Revenus)
export const BAREME_CEHR = {
  celibataire: [
    { min: 0, max: 250_000, taux: 0 },
    { min: 250_000, max: 500_000, taux: 3 },
    { min: 500_000, max: Infinity, taux: 4 },
  ],
  couple: [
    { min: 0, max: 500_000, taux: 0 },
    { min: 500_000, max: 1_000_000, taux: 3 },
    { min: 1_000_000, max: Infinity, taux: 4 },
  ],
};

// Seuil IFI 2024
export const SEUIL_IFI = 1_300_000;
export const ABATTEMENT_RESIDENCE_PRINCIPALE = 0.30; // 30%

// Barème IFI 2024
export const BAREME_IFI = [
  { min: 0, max: 800_000, taux: 0 },
  { min: 800_000, max: 1_300_000, taux: 0.50 },
  { min: 1_300_000, max: 2_570_000, taux: 0.70 },
  { min: 2_570_000, max: 5_000_000, taux: 1.00 },
  { min: 5_000_000, max: 10_000_000, taux: 1.25 },
  { min: 10_000_000, max: Infinity, taux: 1.50 },
];

export interface IRInput {
  revenuNetImposable: number;
  nbParts: number;
  isCouple?: boolean;
}

export interface IRResult {
  impotBrut: number;
  tmi: number;
  tmiRate: number;
  revenuParPart: number;
  detailTranches: Array<{ tranche: string; montant: number; taux: number }>;
}

/**
 * Calcule l'impôt sur le revenu avec le mécanisme du quotient familial
 */
export function calculateIR(input: IRInput): CalcResult<IRResult> {
  const warnings: Warning[] = [];
  const { revenuNetImposable, nbParts } = input;
  
  const revenuParPart = revenuNetImposable / nbParts;
  
  let impotParPart = 0;
  let tmi = 0;
  let tmiRate = 0;
  const detailTranches: IRResult['detailTranches'] = [];

  for (const tranche of BAREME_IR_2024) {
    if (revenuParPart > tranche.min) {
      const base = Math.min(revenuParPart, tranche.max) - tranche.min;
      const impotTranche = base * (tranche.taux / 100);
      impotParPart += impotTranche;
      
      if (tranche.taux > 0) {
        detailTranches.push({
          tranche: `${tranche.min.toLocaleString('fr-FR')} € - ${tranche.max === Infinity ? '∞' : tranche.max.toLocaleString('fr-FR')} €`,
          montant: impotTranche * nbParts,
          taux: tranche.taux,
        });
      }
      
      if (revenuParPart <= tranche.max) {
        tmi = tranche.taux;
        tmiRate = tranche.taux;
        break;
      }
      tmi = tranche.taux;
      tmiRate = tranche.taux;
    }
  }

  const impotBrut = Math.round(impotParPart * nbParts);

  return mkResult({
    id: 'ir-calculation',
    name: 'Calcul Impôt sur le Revenu',
    inputs: [
      { id: 'revenuNetImposable', label: 'Revenu net imposable', value: revenuNetImposable, unit: '€' },
      { id: 'nbParts', label: 'Nombre de parts', value: nbParts },
    ],
    assumptions: [
      {
        id: 'bareme_2024',
        label: 'Barème IR 2024',
        value: 'Revenus 2023',
        source: 'CGI Art. 197',
        editable: false,
      },
    ],
    formulaText: 'IR = Σ(tranche × taux) × nbParts',
    outputs: [
      { id: 'impotBrut', label: 'Impôt brut', value: impotBrut, unit: '€' },
      { id: 'tmi', label: 'TMI', value: tmiRate, unit: '%' },
      { id: 'revenuParPart', label: 'Revenu par part', value: Math.round(revenuParPart), unit: '€' },
    ],
    result: {
      impotBrut,
      tmi,
      tmiRate,
      revenuParPart,
      detailTranches,
    },
    ruleVersion: mkRuleVersion('2024.1', 'CGI Art. 197', true),
    sourceNote: 'Barème IR 2024 pour revenus 2023',
    warnings,
  });
}

export interface CEHRInput {
  rfi: number; // Revenu fiscal de référence
  isCouple: boolean;
}

export interface CEHRResult {
  montantCEHR: number;
  isRedevable: boolean;
}

/**
 * Calcule la Contribution Exceptionnelle sur les Hauts Revenus
 */
export function calculateCEHR(input: CEHRInput): CalcResult<CEHRResult> {
  const bareme = input.isCouple ? BAREME_CEHR.couple : BAREME_CEHR.celibataire;
  let montantCEHR = 0;

  for (const tranche of bareme) {
    if (input.rfi > tranche.min) {
      const base = Math.min(input.rfi, tranche.max) - tranche.min;
      montantCEHR += base * (tranche.taux / 100);
    }
  }

  montantCEHR = Math.round(montantCEHR);

  return mkResult({
    id: 'cehr-calculation',
    name: 'Calcul CEHR',
    inputs: [
      { id: 'rfi', label: 'Revenu fiscal de référence', value: input.rfi, unit: '€' },
      { id: 'isCouple', label: 'Couple', value: input.isCouple },
    ],
    assumptions: [],
    formulaText: 'CEHR = Σ(tranche RFI × taux)',
    outputs: [
      { id: 'montantCEHR', label: 'Montant CEHR', value: montantCEHR, unit: '€' },
    ],
    result: {
      montantCEHR,
      isRedevable: montantCEHR > 0,
    },
    ruleVersion: mkRuleVersion('2024.1', 'CGI Art. 223 sexies', true),
    sourceNote: 'CEHR applicable depuis 2012',
    warnings: [],
  });
}

export interface IFIInput {
  patrimoineImmobilierBrut: number;
  dettesDeductibles: number;
  valeurResidencePrincipale: number;
}

export interface IFIResult {
  patrimoineNetTaxable: number;
  montantIFI: number;
  isRedevable: boolean;
}

/**
 * Calcule l'Impôt sur la Fortune Immobilière
 */
export function calculateIFI(input: IFIInput): CalcResult<IFIResult> {
  let warnings: Warning[] = [];
  
  // Abattement résidence principale
  const abattementRP = input.valeurResidencePrincipale * ABATTEMENT_RESIDENCE_PRINCIPALE;
  const patrimoineNetTaxable = input.patrimoineImmobilierBrut - input.dettesDeductibles - abattementRP;
  
  let montantIFI = 0;
  
  if (patrimoineNetTaxable >= SEUIL_IFI) {
    for (const tranche of BAREME_IFI) {
      if (patrimoineNetTaxable > tranche.min) {
        const base = Math.min(patrimoineNetTaxable, tranche.max) - tranche.min;
        montantIFI += base * (tranche.taux / 100);
      }
    }
  }

  montantIFI = Math.round(montantIFI);

  // Warning si proche du seuil
  if (patrimoineNetTaxable > SEUIL_IFI * 0.9 && patrimoineNetTaxable < SEUIL_IFI) {
    warnings = addValidationWarning(warnings, 'IFI_SEUIL', 'Patrimoine proche du seuil IFI');
  }

  return mkResult({
    id: 'ifi-calculation',
    name: 'Calcul IFI',
    inputs: [
      { id: 'patrimoineImmobilierBrut', label: 'Patrimoine immobilier brut', value: input.patrimoineImmobilierBrut, unit: '€' },
      { id: 'dettesDeductibles', label: 'Dettes déductibles', value: input.dettesDeductibles, unit: '€' },
      { id: 'valeurResidencePrincipale', label: 'Résidence principale', value: input.valeurResidencePrincipale, unit: '€' },
    ],
    assumptions: [
      {
        id: 'abattement_rp',
        label: 'Abattement résidence principale',
        value: ABATTEMENT_RESIDENCE_PRINCIPALE * 100,
        source: 'CGI Art. 973',
        editable: true,
      },
      {
        id: 'seuil_ifi',
        label: 'Seuil IFI',
        value: SEUIL_IFI,
        source: 'CGI Art. 964',
        editable: true,
      },
    ],
    formulaText: 'IFI = Σ(tranche patrimoine net × taux) si patrimoine ≥ 1,3M€',
    outputs: [
      { id: 'patrimoineNetTaxable', label: 'Patrimoine net taxable', value: patrimoineNetTaxable, unit: '€' },
      { id: 'montantIFI', label: 'Montant IFI', value: montantIFI, unit: '€' },
    ],
    result: {
      patrimoineNetTaxable,
      montantIFI,
      isRedevable: montantIFI > 0,
    },
    ruleVersion: mkRuleVersion('2024.1', 'CGI Art. 964-983', true),
    sourceNote: 'IFI applicable depuis 2018',
    warnings,
  });
}
