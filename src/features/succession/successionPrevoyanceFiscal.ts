import {
  buildSuccessionAvFiscalAnalysis,
  type SuccessionAvFiscalAnalysis,
  type SuccessionAvFiscalLine,
} from './successionAvFiscal';
import type {
  FamilyMember,
  SuccessionAssuranceVieEntry,
  SuccessionCivilContext,
  SuccessionEnfant,
  SuccessionPrevoyanceDecesEntry,
} from './successionDraft.types';
import type { SuccessionFiscalSnapshot } from './successionFiscalContext';

export interface SuccessionPrevoyanceFiscalLine {
  id: string;
  label: string;
  lien: SuccessionAvFiscalLine['lien'];
  capitalTransmis: number;
  capitauxAvant70: number;
  capitauxApres70: number;
  taxable990I: number;
  droits990I: number;
  taxable757B: number;
  droits757B: number;
  totalDroits: number;
  netTransmis: number;
}

export interface SuccessionPrevoyanceFiscalPerAssure {
  capitalDeces: number;
  totalDroits: number;
  lines: SuccessionPrevoyanceFiscalLine[];
}

export interface SuccessionPrevoyanceFiscalAnalysis {
  totalCapitalDeces: number;
  totalDroits: number;
  totalNetTransmis: number;
  lines: SuccessionPrevoyanceFiscalLine[];
  byAssure: Record<'epoux1' | 'epoux2', SuccessionPrevoyanceFiscalPerAssure>;
  warnings: string[];
}

function toSyntheticAssuranceVieEntries(
  entries: SuccessionPrevoyanceDecesEntry[],
): SuccessionAssuranceVieEntry[] {
  return entries.map((entry) => ({
    id: `prev-${entry.id}`,
    typeContrat: 'standard',
    souscripteur: entry.souscripteur,
    assure: entry.assure,
    clauseBeneficiaire: entry.clauseBeneficiaire,
    capitauxDeces: entry.capitalDeces,
    versementsApres70: 0,
  }));
}

function mapLine(line: SuccessionAvFiscalLine): SuccessionPrevoyanceFiscalLine {
  return {
    id: line.id,
    label: line.label,
    lien: line.lien,
    capitalTransmis: line.capitauxAvant70 + line.capitauxApres70,
    capitauxAvant70: line.capitauxAvant70,
    capitauxApres70: line.capitauxApres70,
    taxable990I: line.taxable990I,
    droits990I: line.droits990I,
    taxable757B: line.taxable757B,
    droits757B: line.droits757B,
    totalDroits: line.totalDroits,
    netTransmis: line.netTransmis,
  };
}

function mapAnalysis(
  analysis: SuccessionAvFiscalAnalysis,
  entryCount: number,
): SuccessionPrevoyanceFiscalAnalysis {
  return {
    totalCapitalDeces: analysis.totalCapitauxDeces,
    totalDroits: analysis.totalDroits,
    totalNetTransmis: analysis.totalNetTransmis,
    lines: analysis.lines.map(mapLine),
    byAssure: {
      epoux1: {
        capitalDeces: analysis.byAssure.epoux1.capitauxDeces,
        totalDroits: analysis.byAssure.epoux1.totalDroits,
        lines: analysis.byAssure.epoux1.lines.map(mapLine),
      },
      epoux2: {
        capitalDeces: analysis.byAssure.epoux2.capitauxDeces,
        totalDroits: analysis.byAssure.epoux2.totalDroits,
        lines: analysis.byAssure.epoux2.lines.map(mapLine),
      },
    },
    warnings: Array.from(new Set([
      ...analysis.warnings.map((warning) => warning.replace(/Assurance-vie/g, 'Prevoyance deces')),
      ...(entryCount > 0
        ? [
          'Prevoyance deces: conversion en assurance-vie synthetique, avec capital integralement traite sous le regime 990 I dans ce module.',
        ]
        : []),
    ])),
  };
}

export function buildSuccessionPrevoyanceFiscalAnalysis(
  entries: SuccessionPrevoyanceDecesEntry[],
  civil: SuccessionCivilContext,
  enfants: SuccessionEnfant[],
  familyMembers: FamilyMember[],
  snapshot: SuccessionFiscalSnapshot,
): SuccessionPrevoyanceFiscalAnalysis {
  return mapAnalysis(
    buildSuccessionAvFiscalAnalysis(
      toSyntheticAssuranceVieEntries(entries),
      civil,
      enfants,
      familyMembers,
      snapshot,
    ),
    entries.length,
  );
}
