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
import { getAgeAtReferenceDate } from './successionUsufruit';

export interface SuccessionPrevoyanceRegimeInfo {
  regimeKey: '990I' | '757B';
  regimeLabel: '990 I' | '757 B';
  taxBase: number;
  ageAtDeath: number | null;
  warning?: string;
}

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

function asAmount(value: unknown): number {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.max(0, amount);
}

function getBirthDateForSouscripteur(
  civil: SuccessionCivilContext,
  souscripteur: 'epoux1' | 'epoux2',
): string | undefined {
  return souscripteur === 'epoux1'
    ? civil.dateNaissanceEpoux1
    : civil.dateNaissanceEpoux2;
}

export function getSuccessionPrevoyanceRegimeInfo(
  entry: SuccessionPrevoyanceDecesEntry,
  civil: SuccessionCivilContext,
  referenceDate: Date,
  agePivotPrimes = 70,
): SuccessionPrevoyanceRegimeInfo {
  const capitalDeces = asAmount(entry.capitalDeces);
  const dernierePrime = asAmount(entry.dernierePrime);
  const birthDate = getBirthDateForSouscripteur(civil, entry.souscripteur);
  const ageAtDeath = getAgeAtReferenceDate(birthDate, referenceDate);

  if (dernierePrime <= 0) {
    return {
      regimeKey: '990I',
      regimeLabel: '990 I',
      taxBase: capitalDeces,
      ageAtDeath,
      warning: `Dernière prime non renseignée : calcul par défaut en art. 990 I CGI sur le capital décès (surestimation probable). L'assiette réelle est la dernière prime annuelle ou la prime unique (CGI annexe II, art. 306-0 F).`,
    };
  }

  if (ageAtDeath == null) {
    return {
      regimeKey: '990I',
      regimeLabel: '990 I',
      taxBase: dernierePrime,
      ageAtDeath: null,
      warning: `Date de naissance manquante pour ${entry.souscripteur} : hypothèse par défaut d'un régime art. 990 I CGI.`,
    };
  }

  // Art. 990 I CGI : décès avant 70 ans — assiette = dernière prime annuelle
  // ou prime unique (CGI annexe II, art. 306-0 F)
  if (ageAtDeath < agePivotPrimes) {
    return {
      regimeKey: '990I',
      regimeLabel: '990 I',
      taxBase: dernierePrime,
      ageAtDeath,
    };
  }

  // Art. 757 B CGI : décès après 70 ans — assiette = primes versées après 70 ans
  // Simplification moteur : on utilise la dernière prime annuelle saisie comme proxy
  // (BOFiP BOI-TCAS-AUT-60 §80, §170)
  return {
    regimeKey: '757B',
    regimeLabel: '757 B',
    taxBase: dernierePrime,
    ageAtDeath,
  };
}

function buildSyntheticEntries(
  entries: SuccessionPrevoyanceDecesEntry[],
  civil: SuccessionCivilContext,
  referenceDate: Date,
  snapshot: SuccessionFiscalSnapshot,
): {
  capitalEntries: SuccessionAssuranceVieEntry[];
  fiscalEntries: SuccessionAssuranceVieEntry[];
  regimeByEntry: Record<string, SuccessionPrevoyanceRegimeInfo>;
  warnings: string[];
} {
  const warnings: string[] = [];
  const regimeByEntry: Record<string, SuccessionPrevoyanceRegimeInfo> = {};

  const capitalEntries = entries.map((entry) => ({
    id: `prev-cap-${entry.id}`,
    typeContrat: 'standard',
    souscripteur: entry.souscripteur,
    assure: entry.assure,
    clauseBeneficiaire: entry.clauseBeneficiaire,
    capitauxDeces: asAmount(entry.capitalDeces),
    versementsApres70: 0,
  } satisfies SuccessionAssuranceVieEntry));

  const fiscalEntries = entries.map((entry) => {
    const regimeInfo = getSuccessionPrevoyanceRegimeInfo(
      entry,
      civil,
      referenceDate,
      snapshot.avDeces.agePivotPrimes,
    );

    regimeByEntry[entry.id] = regimeInfo;
    if (regimeInfo.warning) {
      warnings.push(`Prévoyance décès (${entry.id}) : ${regimeInfo.warning}`);
    }

    return {
      id: `prev-tax-${entry.id}`,
      typeContrat: 'standard',
      souscripteur: entry.souscripteur,
      assure: entry.assure,
      clauseBeneficiaire: entry.clauseBeneficiaire,
      capitauxDeces: regimeInfo.taxBase,
      versementsApres70: regimeInfo.regimeKey === '757B' ? regimeInfo.taxBase : 0,
    } satisfies SuccessionAssuranceVieEntry;
  });

  return {
    capitalEntries,
    fiscalEntries,
    regimeByEntry,
    warnings,
  };
}

function filterPrevoyanceWarnings(warnings: string[]): string[] {
  return warnings
    .filter((warning) => !warning.includes('ventilation fiscale simplifiée à partir de la clause bénéficiaire'))
    .map((warning) => warning.replace(/Assurance-vie/g, 'Prévoyance décès'));
}

function mergeSideLines(
  capitalLines: SuccessionAvFiscalLine[],
  fiscalLines: SuccessionAvFiscalLine[],
): SuccessionPrevoyanceFiscalLine[] {
  const capitalById = new Map(capitalLines.map((line) => [line.id, line] as const));
  const fiscalById = new Map(fiscalLines.map((line) => [line.id, line] as const));
  const ids = new Set<string>([
    ...capitalById.keys(),
    ...fiscalById.keys(),
  ]);

  return Array.from(ids).map((id) => {
    const capitalLine = capitalById.get(id);
    const fiscalLine = fiscalById.get(id);
    const label = capitalLine?.label ?? fiscalLine?.label ?? 'Bénéficiaire';
    const lien = capitalLine?.lien ?? fiscalLine?.lien ?? 'autre';
    const capitalTransmis = (capitalLine?.capitauxAvant70 ?? 0) + (capitalLine?.capitauxApres70 ?? 0);
    const totalDroits = fiscalLine?.totalDroits ?? 0;

    return {
      id,
      label,
      lien,
      capitalTransmis,
      capitauxAvant70: fiscalLine?.capitauxAvant70 ?? 0,
      capitauxApres70: fiscalLine?.capitauxApres70 ?? 0,
      taxable990I: fiscalLine?.taxable990I ?? 0,
      droits990I: fiscalLine?.droits990I ?? 0,
      taxable757B: fiscalLine?.taxable757B ?? 0,
      droits757B: fiscalLine?.droits757B ?? 0,
      totalDroits,
      netTransmis: Math.max(0, capitalTransmis - totalDroits),
    };
  }).sort((a, b) => b.capitalTransmis - a.capitalTransmis);
}

function mergePrevoyanceLines(
  firstLines: SuccessionPrevoyanceFiscalLine[],
  secondLines: SuccessionPrevoyanceFiscalLine[],
): SuccessionPrevoyanceFiscalLine[] {
  const merged = new Map<string, SuccessionPrevoyanceFiscalLine>();

  [...firstLines, ...secondLines].forEach((line) => {
    const current = merged.get(line.id);
    if (!current) {
      merged.set(line.id, { ...line });
      return;
    }
    current.capitalTransmis += line.capitalTransmis;
    current.capitauxAvant70 += line.capitauxAvant70;
    current.capitauxApres70 += line.capitauxApres70;
    current.taxable990I += line.taxable990I;
    current.droits990I += line.droits990I;
    current.taxable757B += line.taxable757B;
    current.droits757B += line.droits757B;
    current.totalDroits += line.totalDroits;
    current.netTransmis += line.netTransmis;
  });

  return Array.from(merged.values()).sort((a, b) => b.capitalTransmis - a.capitalTransmis);
}

function buildPerAssureLines(
  capitalAnalysis: SuccessionAvFiscalAnalysis,
  fiscalAnalysis: SuccessionAvFiscalAnalysis,
): Record<'epoux1' | 'epoux2', SuccessionPrevoyanceFiscalPerAssure> {
  const epoux1Lines = mergeSideLines(
    capitalAnalysis.byAssure.epoux1.lines,
    fiscalAnalysis.byAssure.epoux1.lines,
  );
  const epoux2Lines = mergeSideLines(
    capitalAnalysis.byAssure.epoux2.lines,
    fiscalAnalysis.byAssure.epoux2.lines,
  );

  return {
    epoux1: {
      capitalDeces: capitalAnalysis.byAssure.epoux1.capitauxDeces,
      totalDroits: epoux1Lines.reduce((sum, line) => sum + line.totalDroits, 0),
      lines: epoux1Lines,
    },
    epoux2: {
      capitalDeces: capitalAnalysis.byAssure.epoux2.capitauxDeces,
      totalDroits: epoux2Lines.reduce((sum, line) => sum + line.totalDroits, 0),
      lines: epoux2Lines,
    },
  };
}

export function buildSuccessionPrevoyanceFiscalAnalysis(
  entries: SuccessionPrevoyanceDecesEntry[],
  civil: SuccessionCivilContext,
  enfants: SuccessionEnfant[],
  familyMembers: FamilyMember[],
  snapshot: SuccessionFiscalSnapshot,
  referenceDate: Date,
): SuccessionPrevoyanceFiscalAnalysis {
  const {
    capitalEntries,
    fiscalEntries,
    warnings: regimeWarnings,
  } = buildSyntheticEntries(entries, civil, referenceDate, snapshot);

  const capitalAnalysis = buildSuccessionAvFiscalAnalysis(
    capitalEntries,
    civil,
    enfants,
    familyMembers,
    snapshot,
  );
  const fiscalAnalysis = buildSuccessionAvFiscalAnalysis(
    fiscalEntries,
    civil,
    enfants,
    familyMembers,
    snapshot,
  );

  const byAssure = buildPerAssureLines(capitalAnalysis, fiscalAnalysis);
  const lines = mergePrevoyanceLines(byAssure.epoux1.lines, byAssure.epoux2.lines);
  const totalCapitalDeces = entries.reduce((sum, entry) => sum + asAmount(entry.capitalDeces), 0);
  const totalDroits = byAssure.epoux1.totalDroits + byAssure.epoux2.totalDroits;

  return {
    totalCapitalDeces,
    totalDroits,
    totalNetTransmis: Math.max(0, totalCapitalDeces - totalDroits),
    lines,
    byAssure,
    warnings: Array.from(new Set([
      ...regimeWarnings,
      ...filterPrevoyanceWarnings(capitalAnalysis.warnings),
      ...filterPrevoyanceWarnings(fiscalAnalysis.warnings),
      ...(entries.length > 0
        ? [
          `Prévoyance décès pure non rachetable (art. L132-23 C. assurances) : le capital décès est ventilé selon la clause bénéficiaire ; l’assiette fiscale est la dernière prime annuelle ou prime unique (art. 990 I CGI, CGI annexe II art. 306-0 F), et non le capital décès.`,
          `Prévoyance décès : si le décès survient avant 70 ans, l’art. 990 I s’applique (abattement 152 500 € par bénéficiaire, taxe forfaitaire 20 %/31,25 %). Après 70 ans, l’art. 757 B s’applique : l’assiette est la fraction des primes versées après 70 ans, soumise au barème DMTG après abattement global de 30 500 € (BOFiP TCAS-AUT-60).`,
        ]
        : []),
    ])),
  };
}
