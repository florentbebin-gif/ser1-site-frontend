/**
 * PER Engine — Plan d'Épargne Retraite (P1-03)
 *
 * MVP scope:
 * - Versements volontaires déductibles (PER individuel)
 * - Économie d'impôt selon TMI
 * - Capital à terme avec intérêts composés
 * - Estimation rente viagère (taux conversion simplifié)
 * - Fiscalité sortie capital (IR barème) vs rente (abattement 10%)
 *
 * Hors scope MVP : versements obligatoires/employeur, gestion pilotée,
 * PER entreprise, transferts PERP/Madelin, cas de déblocage anticipé.
 *
 * Sources :
 * - CGI Art. 163 quatervicies (plafond déduction)
 * - Barème IR 2024 pour économie d'impôt
 * - Taux de conversion rente : hypothèse simplifiée 4% à 65 ans
 */

import { mkResult, mkRuleVersion } from './helpers';
import type { CalcResult, Warning } from './types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PerInput = {
  versementAnnuel: number;       // Versement annuel en €
  dureeAnnees: number;           // Durée d'épargne en années
  tmi: number;                   // Taux marginal d'imposition (%) : 0, 11, 30, 41, 45
  rendementAnnuel: number;       // Rendement annuel brut (%) — ex: 3
  fraisGestion?: number;         // Frais de gestion annuels (%) — défaut 0.8
  ageSouscription?: number;      // Âge à la souscription — défaut 45
  plafondDeduction?: number;     // Plafond de déduction annuel — défaut 35194 (2024)
};

export type PerResult = {
  // Inputs échos
  versementAnnuel: number;
  dureeAnnees: number;
  tmi: number;
  rendementNet: number;          // Rendement après frais

  // Résultats principaux
  totalVersements: number;       // Cumul des versements
  capitalTerme: number;          // Capital à terme (intérêts composés)
  gainNet: number;               // Plus-values brutes
  economieImpotAnnuelle: number; // Économie IR annuelle
  economieImpotTotale: number;   // Économie IR cumulée

  // Sortie capital
  capitalNetSortie: number;      // Capital net après IR sortie (flat rate barème)
  irSortieCapital: number;       // IR estimé sur sortie en capital

  // Sortie rente
  renteAnnuelleEstimee: number;  // Rente annuelle estimée
  renteMensuelleEstimee: number; // Rente mensuelle estimée
  renteNetteApresIR: number;     // Rente nette après IR (abattement 10%)

  // Indicateurs
  tauxRendementInterne: number;  // TRI simplifié tenant compte de l'avantage fiscal
  ratioEconomieVersement: number; // economieImpotTotale / totalVersements

  // Détails année par année
  projectionAnnuelle: PerProjectionRow[];
};

export type PerProjectionRow = {
  annee: number;
  versementCumule: number;
  capitalDebut: number;
  interets: number;
  frais: number;
  capitalFin: number;
  economieImpotCumulee: number;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_FRAIS_GESTION = 0.8;    // 0.8% par an
const DEFAULT_AGE_SOUSCRIPTION = 45;
const DEFAULT_PLAFOND_DEDUCTION = 35194; // Plafond 2024 (10% du PASS N-1)
const TAUX_CONVERSION_RENTE_65 = 0.04;  // 4% du capital → rente annuelle à 65 ans
const ABATTEMENT_RENTE = 0.10;          // 10% abattement sur rente (CGI Art. 158-5)

// Barème IR 2024 simplifié pour estimer la sortie en capital
const TRANCHES_IR_2024 = [
  { seuil: 0,      taux: 0    },
  { seuil: 11294,  taux: 0.11 },
  { seuil: 28797,  taux: 0.30 },
  { seuil: 82341,  taux: 0.41 },
  { seuil: 177106, taux: 0.45 },
];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function estimerIRSortieCapital(capital: number): number {
  // Estimation simplifiée : IR sur le capital comme revenu exceptionnel
  // En réalité, le système du quotient s'applique (CGI Art. 163-0 A)
  // Ici on calcule l'IR brut sur le capital seul (1 part, simplification)
  let ir = 0;
  let restant = capital;
  for (let i = TRANCHES_IR_2024.length - 1; i >= 0; i--) {
    const tranche = TRANCHES_IR_2024[i];
    if (restant > tranche.seuil) {
      ir += (restant - tranche.seuil) * tranche.taux;
      restant = tranche.seuil;
    }
  }
  return Math.round(ir);
}

function buildProjection(
  versementAnnuel: number,
  dureeAnnees: number,
  rendementNet: number,
  fraisGestionPct: number,
  economieImpotAnnuelle: number,
): PerProjectionRow[] {
  const rows: PerProjectionRow[] = [];
  let capitalFin = 0;

  for (let a = 1; a <= dureeAnnees; a++) {
    const capitalDebut = capitalFin;
    const capitalApresVersement = capitalDebut + versementAnnuel;
    const interets = Math.round(capitalApresVersement * (rendementNet / 100));
    const frais = Math.round(capitalApresVersement * (fraisGestionPct / 100));
    capitalFin = capitalApresVersement + interets - frais;

    rows.push({
      annee: a,
      versementCumule: versementAnnuel * a,
      capitalDebut,
      interets,
      frais,
      capitalFin,
      economieImpotCumulee: Math.round(economieImpotAnnuelle * a),
    });
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function calculatePER(input: PerInput): CalcResult<PerResult> {
  const warnings: Warning[] = [];

  const {
    versementAnnuel,
    dureeAnnees,
    tmi,
    rendementAnnuel,
    fraisGestion = DEFAULT_FRAIS_GESTION,
    ageSouscription = DEFAULT_AGE_SOUSCRIPTION,
    plafondDeduction = DEFAULT_PLAFOND_DEDUCTION,
  } = input;

  // Validation
  if (versementAnnuel <= 0) {
    warnings.push({
      code: 'PER_VERSEMENT_NUL',
      message: 'Le versement annuel doit être supérieur à 0.',
      severity: 'error',
    });
  }

  if (dureeAnnees < 1 || dureeAnnees > 50) {
    warnings.push({
      code: 'PER_DUREE_INVALIDE',
      message: 'La durée doit être comprise entre 1 et 50 ans.',
      severity: 'error',
    });
  }

  // Plafond déduction
  const versementDeductible = Math.min(versementAnnuel, plafondDeduction);
  if (versementAnnuel > plafondDeduction) {
    warnings.push({
      code: 'PER_PLAFOND_DEPASSE',
      message: `Le versement dépasse le plafond de déduction (${plafondDeduction.toLocaleString('fr-FR')} €). Seul ${versementDeductible.toLocaleString('fr-FR')} € sera déductible.`,
      severity: 'warning',
    });
  }

  // Rendement net après frais
  const rendementNet = Math.max(0, rendementAnnuel - fraisGestion);

  // Économie d'impôt annuelle
  const economieImpotAnnuelle = Math.round(versementDeductible * (tmi / 100));
  const economieImpotTotale = economieImpotAnnuelle * dureeAnnees;

  // Total versements
  const totalVersements = versementAnnuel * dureeAnnees;

  // Projection année par année
  const projection = buildProjection(
    versementAnnuel,
    dureeAnnees,
    rendementNet,
    fraisGestion,
    economieImpotAnnuelle,
  );

  // Capital à terme
  const capitalTerme = projection.length > 0
    ? projection[projection.length - 1].capitalFin
    : 0;

  const gainNet = capitalTerme - totalVersements;

  // Sortie en capital : IR estimé
  const irSortieCapital = estimerIRSortieCapital(capitalTerme);
  const capitalNetSortie = capitalTerme - irSortieCapital;

  // Sortie en rente viagère (estimation simplifiée)
  const ageRetraite = ageSouscription + dureeAnnees;
  let tauxConversion = TAUX_CONVERSION_RENTE_65;
  // Ajustement grossier si âge ≠ 65
  if (ageRetraite < 65) {
    tauxConversion = TAUX_CONVERSION_RENTE_65 * (1 - (65 - ageRetraite) * 0.005);
  } else if (ageRetraite > 65) {
    tauxConversion = TAUX_CONVERSION_RENTE_65 * (1 + (ageRetraite - 65) * 0.005);
  }
  tauxConversion = Math.max(0.02, Math.min(0.06, tauxConversion));

  const renteAnnuelleEstimee = Math.round(capitalTerme * tauxConversion);
  const renteMensuelleEstimee = Math.round(renteAnnuelleEstimee / 12);

  // Rente nette après IR (abattement 10% puis IR au TMI)
  const renteImposable = renteAnnuelleEstimee * (1 - ABATTEMENT_RENTE);
  const irRente = Math.round(renteImposable * (tmi / 100));
  const renteNetteApresIR = renteAnnuelleEstimee - irRente;

  if (ageRetraite < 62) {
    warnings.push({
      code: 'PER_RETRAITE_ANTICIPEE',
      message: `L'âge de sortie estimé (${ageRetraite} ans) est inférieur à l'âge légal de départ à la retraite.`,
      severity: 'info',
    });
  }

  // TRI simplifié : avantage fiscal inclus
  const totalSorti = capitalNetSortie + economieImpotTotale;
  const tauxRendementInterne = totalVersements > 0
    ? Math.round(((totalSorti / totalVersements) - 1) * 10000) / 100
    : 0;

  const ratioEconomieVersement = totalVersements > 0
    ? Math.round((economieImpotTotale / totalVersements) * 10000) / 100
    : 0;

  const result: PerResult = {
    versementAnnuel,
    dureeAnnees,
    tmi,
    rendementNet,
    totalVersements,
    capitalTerme,
    gainNet,
    economieImpotAnnuelle,
    economieImpotTotale,
    capitalNetSortie,
    irSortieCapital,
    renteAnnuelleEstimee,
    renteMensuelleEstimee,
    renteNetteApresIR,
    tauxRendementInterne,
    ratioEconomieVersement,
    projectionAnnuelle: projection,
  };

  return mkResult({
    id: 'per-simulation',
    name: 'Simulation PER',
    inputs: [
      { id: 'versementAnnuel', label: 'Versement annuel', value: versementAnnuel, unit: '€' },
      { id: 'dureeAnnees', label: 'Durée', value: dureeAnnees, unit: 'ans' },
      { id: 'tmi', label: 'TMI', value: tmi, unit: '%' },
      { id: 'rendementAnnuel', label: 'Rendement annuel brut', value: rendementAnnuel, unit: '%' },
      { id: 'fraisGestion', label: 'Frais de gestion', value: fraisGestion, unit: '%' },
    ],
    assumptions: [
      { id: 'plafond', label: 'Plafond de déduction 2024', value: plafondDeduction, source: 'CGI Art. 163 quatervicies' },
      { id: 'tauxConversion', label: 'Taux conversion rente', value: `${(tauxConversion * 100).toFixed(1)}%`, source: 'Hypothèse simplifiée' },
      { id: 'abattementRente', label: 'Abattement rente', value: '10%', source: 'CGI Art. 158-5' },
    ],
    formulaText: 'Capital(N) = Capital(N-1) × (1 + rendement_net) + Versement ; Éco IR = Versement_déductible × TMI',
    outputs: [
      { id: 'capitalTerme', label: 'Capital à terme', value: capitalTerme, unit: '€' },
      { id: 'economieImpotTotale', label: 'Économie IR totale', value: economieImpotTotale, unit: '€' },
      { id: 'renteAnnuelle', label: 'Rente annuelle estimée', value: renteAnnuelleEstimee, unit: '€' },
    ],
    result,
    ruleVersion: mkRuleVersion('2024.1', 'CGI Art. 163 quatervicies + barème IR 2024', true),
    sourceNote: 'Simulation PER individuel — versements volontaires déductibles. Estimation non contractuelle.',
    warnings,
  });
}
