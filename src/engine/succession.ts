/**
 * Module Succession - Calculs droits de succession et prédécès
 * 
 * IMPORTANT: Les règles de succession sont complexes et dépendent de nombreux facteurs.
 * Ce module fournit des estimations paramétrables avec warnings appropriés.
 */

import { mkResult, mkRuleVersion, addValidationWarning } from './helpers';
import type { CalcResult, Warning } from './types';
import { DEFAULT_DMTG } from './civil';
import type { DmtgSettings, DmtgScaleItem } from './civil';

// Abattement conjoint survivant (exonération totale)
export const EXONERATION_CONJOINT = true;

// @deprecated Utiliser dmtgSettings.frereSoeur.abattement
export const ABATTEMENT_FRERE_SOEUR = DEFAULT_DMTG.frereSoeur.abattement;

// @deprecated Utiliser dmtgSettings.neveuNiece.abattement
export const ABATTEMENT_NEVEU_NIECE = DEFAULT_DMTG.neveuNiece.abattement;

// @deprecated Utiliser dmtgSettings.autre.abattement
export const ABATTEMENT_DEFAUT = DEFAULT_DMTG.autre.abattement;

export type LienParente = 
  | 'conjoint'
  | 'enfant'
  | 'petit_enfant'
  | 'frere_soeur'
  | 'neveu_niece'
  | 'autre';

export interface HeritiersInput {
  lien: LienParente;
  partSuccession: number; // Montant en €
}

export interface SuccessionInput {
  actifNetSuccession: number;
  heritiers: HeritiersInput[];
  assuranceVieHorsSuccession?: number;
  dmtgSettings?: DmtgSettings;
}

export interface HeritierResult {
  lien: LienParente;
  partBrute: number;
  abattement: number;
  baseImposable: number;
  droits: number;
  tauxMoyen: number;
}

export interface SuccessionResult {
  actifNetSuccession: number;
  totalDroits: number;
  detailHeritiers: HeritierResult[];
  tauxMoyenGlobal: number;
}

/**
 * Retourne l'abattement applicable selon le lien de parenté
 */
export function getAbattement(lien: LienParente, dmtg: DmtgSettings = DEFAULT_DMTG): number {
  switch (lien) {
    case 'conjoint':
      return Infinity; // Exonération totale
    case 'enfant':
    case 'petit_enfant':
      return dmtg.ligneDirecte.abattement;
    case 'frere_soeur':
      return dmtg.frereSoeur.abattement;
    case 'neveu_niece':
      return dmtg.neveuNiece.abattement;
    default:
      return dmtg.autre.abattement;
  }
}

/**
 * Retourne le barème applicable selon le lien de parenté
 */
function getScaleForLien(lien: LienParente, dmtg: DmtgSettings): DmtgScaleItem[] {
  switch (lien) {
    case 'enfant':
    case 'petit_enfant':
      return dmtg.ligneDirecte.scale;
    case 'frere_soeur':
      return dmtg.frereSoeur.scale;
    case 'neveu_niece':
      return dmtg.neveuNiece.scale;
    default:
      return dmtg.autre.scale;
  }
}

/**
 * Calcule les droits de succession pour une part donnée selon le lien de parenté
 */
function calculateDMTG(baseImposable: number, lien: LienParente, dmtg: DmtgSettings = DEFAULT_DMTG): number {
  if (lien === 'conjoint') return 0; // Exonéré
  if (baseImposable <= 0) return 0;

  const scale = getScaleForLien(lien, dmtg);
  let droits = 0;

  for (const tranche of scale) {
    if (baseImposable > tranche.from) {
      const base = Math.min(baseImposable, tranche.to ?? Infinity) - tranche.from;
      droits += base * (tranche.rate / 100);
    }
  }

  return Math.round(droits);
}

/**
 * Calcule les droits de succession pour l'ensemble des héritiers
 */
export function calculateSuccession(input: SuccessionInput): CalcResult<SuccessionResult> {
  let warnings: Warning[] = [];
  const dmtg = input.dmtgSettings ?? DEFAULT_DMTG;
  
  const detailHeritiers: HeritierResult[] = [];
  let totalDroits = 0;

  for (const heritier of input.heritiers) {
    const abattement = getAbattement(heritier.lien, dmtg);
    const baseImposable = Math.max(0, heritier.partSuccession - abattement);
    const droits = calculateDMTG(baseImposable, heritier.lien, dmtg);
    const tauxMoyen = heritier.partSuccession > 0 
      ? (droits / heritier.partSuccession) * 100 
      : 0;

    detailHeritiers.push({
      lien: heritier.lien,
      partBrute: heritier.partSuccession,
      abattement: abattement === Infinity ? heritier.partSuccession : abattement,
      baseImposable,
      droits,
      tauxMoyen: Math.round(tauxMoyen * 100) / 100,
    });

    totalDroits += droits;
  }

  const tauxMoyenGlobal = input.actifNetSuccession > 0
    ? (totalDroits / input.actifNetSuccession) * 100
    : 0;


  return mkResult({
    id: 'succession-calculation',
    name: 'Calcul droits de succession',
    inputs: [
      { id: 'actifNetSuccession', label: 'Actif net successoral', value: input.actifNetSuccession, unit: '€' },
      { id: 'nbHeritiers', label: 'Nombre d\'héritiers', value: input.heritiers.length },
    ],
    assumptions: [
      {
        id: 'abattement_enfant',
        label: 'Abattement par enfant',
        value: dmtg.ligneDirecte.abattement,
        source: 'CGI Art. 779',
        editable: true,
      },
      {
        id: 'exoneration_conjoint',
        label: 'Exonération conjoint',
        value: true,
        source: 'CGI Art. 796-0 bis',
        editable: false,
      },
    ],
    formulaText: 'Droits = Σ(DMTG(partHeritier - abattement))',
    outputs: [
      { id: 'totalDroits', label: 'Total droits de succession', value: totalDroits, unit: '€' },
      { id: 'tauxMoyenGlobal', label: 'Taux moyen global', value: Math.round(tauxMoyenGlobal * 100) / 100, unit: '%' },
    ],
    result: {
      actifNetSuccession: input.actifNetSuccession,
      totalDroits,
      detailHeritiers,
      tauxMoyenGlobal: Math.round(tauxMoyenGlobal * 100) / 100,
    },
    ruleVersion: mkRuleVersion('2024.1', 'CGI Art. 777, 779, 796-0 bis', true),
    sourceNote: 'Barème DMTG 2024 - Barèmes par lien de parenté',
    warnings,
  });
}

export interface PredecesScenariosInput {
  actifMr: number;
  actifMme: number;
  actifCommun: number;
  nbEnfants: number;
  regime: 'communaute_legale' | 'separation_biens' | 'communaute_universelle';
}

export interface PredecesScenariosResult {
  scenarioMrDecede: {
    actifTransmis: number;
    droitsSuccession: number;
  };
  scenarioMmeDecede: {
    actifTransmis: number;
    droitsSuccession: number;
  };
}

/**
 * Calcule les scénarios de prédécès (Mr décède en premier vs Mme)
 */
export function calculatePredecesSenarios(
  input: PredecesScenariosInput
): CalcResult<PredecesScenariosResult> {
  let warnings: Warning[] = [];

  // Calcul simplifié selon le régime
  let actifTransmisMrDecede: number;
  let actifTransmisMmeDecede: number;

  switch (input.regime) {
    case 'communaute_universelle':
      // Tout va au conjoint survivant (exonéré), puis aux enfants
      actifTransmisMrDecede = input.actifMr + input.actifMme + input.actifCommun;
      actifTransmisMmeDecede = input.actifMr + input.actifMme + input.actifCommun;
      warnings = addValidationWarning(
        warnings,
        'REGIME_CU',
        'Communauté universelle : vérifier clause d\'attribution intégrale'
      );
      break;
    
    case 'separation_biens':
      actifTransmisMrDecede = input.actifMr;
      actifTransmisMmeDecede = input.actifMme;
      break;
    
    case 'communaute_legale':
    default:
      // Biens propres + moitié communauté
      actifTransmisMrDecede = input.actifMr + (input.actifCommun / 2);
      actifTransmisMmeDecede = input.actifMme + (input.actifCommun / 2);
      break;
  }

  // Calcul droits si transmission aux enfants (après décès du second)
  const heritiersMrDecede: HeritiersInput[] = [];
  const heritiersMmeDecede: HeritiersInput[] = [];
  
  if (input.nbEnfants > 0) {
    const partParEnfantMr = actifTransmisMrDecede / input.nbEnfants;
    const partParEnfantMme = actifTransmisMmeDecede / input.nbEnfants;
    
    for (let i = 0; i < input.nbEnfants; i++) {
      heritiersMrDecede.push({ lien: 'enfant', partSuccession: partParEnfantMr });
      heritiersMmeDecede.push({ lien: 'enfant', partSuccession: partParEnfantMme });
    }
  }

  const successionMr = calculateSuccession({
    actifNetSuccession: actifTransmisMrDecede,
    heritiers: heritiersMrDecede,
  });

  const successionMme = calculateSuccession({
    actifNetSuccession: actifTransmisMmeDecede,
    heritiers: heritiersMmeDecede,
  });

  return mkResult({
    id: 'predeces-scenarios',
    name: 'Scénarios prédécès',
    inputs: [
      { id: 'actifMr', label: 'Actif Mr', value: input.actifMr, unit: '€' },
      { id: 'actifMme', label: 'Actif Mme', value: input.actifMme, unit: '€' },
      { id: 'actifCommun', label: 'Actif commun', value: input.actifCommun, unit: '€' },
      { id: 'nbEnfants', label: 'Nombre d\'enfants', value: input.nbEnfants },
      { id: 'regime', label: 'Régime matrimonial', value: input.regime },
    ],
    assumptions: [
      {
        id: 'conjoint_exonere',
        label: 'Conjoint survivant exonéré',
        value: true,
        source: 'CGI Art. 796-0 bis',
        editable: false,
      },
    ],
    formulaText: 'Droits = DMTG(actifTransmis / nbEnfants - abattement) × nbEnfants',
    outputs: [
      { id: 'droitsMrDecede', label: 'Droits si Mr décède', value: successionMr.result.totalDroits, unit: '€' },
      { id: 'droitsMmeDecede', label: 'Droits si Mme décède', value: successionMme.result.totalDroits, unit: '€' },
    ],
    result: {
      scenarioMrDecede: {
        actifTransmis: actifTransmisMrDecede,
        droitsSuccession: successionMr.result.totalDroits,
      },
      scenarioMmeDecede: {
        actifTransmis: actifTransmisMmeDecede,
        droitsSuccession: successionMme.result.totalDroits,
      },
    },
    ruleVersion: mkRuleVersion('2024.1', 'CGI Art. 777, 779, 796-0 bis', true),
    sourceNote: 'Estimation simplifiée des droits de succession',
    warnings,
  });
}
