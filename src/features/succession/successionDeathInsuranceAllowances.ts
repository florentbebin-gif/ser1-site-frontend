import { calculateSuccession, getAbattement, type LienParente } from '../../engine/succession';
import type {
  SuccessionAvFiscalAnalysis,
  SuccessionAvFiscalLine,
} from './successionAvFiscal';
import type { SuccessionFiscalSnapshot } from './successionFiscalContext';
import type { SuccessionPerFiscalAnalysis } from './successionPerFiscal';
import type {
  SuccessionPrevoyanceFiscalAnalysis,
  SuccessionPrevoyanceFiscalLine,
} from './successionPrevoyanceFiscal';

type AssureSide = 'epoux1' | 'epoux2';

export interface EstateAllowanceUsageEntry {
  lien: LienParente;
  partSuccessorale: number;
  abattementResiduel: number;
}

export type EstateAllowanceUsage = Record<string, EstateAllowanceUsageEntry>;

interface InsuranceCoordinationInput {
  avFiscalAnalysis: SuccessionAvFiscalAnalysis;
  perFiscalAnalysis: SuccessionPerFiscalAnalysis;
  prevoyanceFiscalAnalysis: SuccessionPrevoyanceFiscalAnalysis;
  fiscalSnapshot: SuccessionFiscalSnapshot;
  estateAllowanceUsageBySide?: Partial<Record<AssureSide, EstateAllowanceUsage>>;
}

interface LineContribution {
  id: string;
  lien: LienParente;
  isExempt: boolean;
  before70Base: number;
  after70Base: number;
  allowance990IRatio: number;
  applyBefore70: (taxable: number, droits: number) => void;
  applyAfter70: (taxable: number, droits: number) => void;
}

export function extractEstateAllowanceUsage(
  beneficiaries: Array<{ id: string; lien: LienParente; brut: number }>,
  dmtgSettings: SuccessionFiscalSnapshot['dmtgSettings'],
): EstateAllowanceUsage {
  const usage: EstateAllowanceUsage = {};
  for (const b of beneficiaries) {
    const abattement = getAbattement(b.lien, dmtgSettings);
    const effectiveAbattement = abattement === Infinity ? b.brut : abattement;
    const residual = Math.max(0, effectiveAbattement - b.brut);
    const existing = usage[b.id];
    if (existing) {
      existing.partSuccessorale += b.brut;
      existing.abattementResiduel = Math.max(0, existing.abattementResiduel - b.brut);
    } else {
      usage[b.id] = {
        lien: b.lien,
        partSuccessorale: b.brut,
        abattementResiduel: residual,
      };
    }
  }
  return usage;
}

const ASSURE_SIDES: AssureSide[] = ['epoux1', 'epoux2'];

function compute990ITax(taxableBase: number, snapshot: SuccessionFiscalSnapshot): number {
  if (taxableBase <= 0) return 0;

  let previousCeiling = 0;
  let tax = 0;

  snapshot.avDeces.primesApres1998.brackets.forEach((bracket) => {
    const upperBound = bracket.upTo ?? Infinity;
    if (taxableBase <= previousCeiling) return;
    const tranche = Math.min(taxableBase, upperBound) - previousCeiling;
    if (tranche > 0) {
      tax += tranche * (bracket.ratePercent / 100);
      previousCeiling = upperBound;
    }
  });

  return Math.round(tax);
}

function compute757BTax(
  taxableBase: number,
  lien: LienParente,
  snapshot: SuccessionFiscalSnapshot,
  abattementResiduel?: number,
): number {
  if (taxableBase <= 0) return 0;

  return calculateSuccession({
    actifNetSuccession: taxableBase,
    heritiers: [{
      lien,
      partSuccession: taxableBase,
      ...(abattementResiduel != null ? { abattementOverride: abattementResiduel } : {}),
    }],
    dmtgSettings: snapshot.dmtgSettings,
  }).result.totalDroits;
}

function allocateExact(total: number, weights: number[]): number[] {
  if (total <= 0 || weights.every((weight) => weight <= 0)) {
    return weights.map(() => 0);
  }

  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  let allocated = 0;

  return weights.map((weight, index) => {
    if (index === weights.length - 1) {
      return Math.max(0, total - allocated);
    }

    const share = weightSum > 0 ? (total * weight) / weightSum : 0;
    allocated += share;
    return share;
  });
}

function allocateRounded(total: number, weights: number[]): number[] {
  if (total <= 0 || weights.every((weight) => weight <= 0)) {
    return weights.map(() => 0);
  }

  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const exactShares = weights.map((weight) => (weightSum > 0 ? (total * weight) / weightSum : 0));
  const floored = exactShares.map((value) => Math.floor(value));
  let remaining = total - floored.reduce((sum, value) => sum + value, 0);

  const byRemainder = exactShares
    .map((value, index) => ({ index, remainder: value - floored[index] }))
    .sort((a, b) => b.remainder - a.remainder);

  byRemainder.forEach(({ index }) => {
    if (remaining <= 0) return;
    floored[index] += 1;
    remaining -= 1;
  });

  return floored;
}

function mergeAvLines(
  firstLines: SuccessionAvFiscalLine[],
  secondLines: SuccessionAvFiscalLine[],
): SuccessionAvFiscalLine[] {
  const merged = new Map<string, SuccessionAvFiscalLine>();

  [...firstLines, ...secondLines].forEach((line) => {
    const current = merged.get(line.id);
    if (!current) {
      merged.set(line.id, { ...line });
      return;
    }
    current.capitauxAvant70 += line.capitauxAvant70;
    current.capitauxApres70 += line.capitauxApres70;
    current.baseFiscale990I = (current.baseFiscale990I ?? 0) + (line.baseFiscale990I ?? 0);
    current.baseFiscale757B = (current.baseFiscale757B ?? 0) + (line.baseFiscale757B ?? 0);
    current.taxable990I += line.taxable990I;
    current.droits990I += line.droits990I;
    current.taxable757B += line.taxable757B;
    current.droits757B += line.droits757B;
    current.totalDroits += line.totalDroits;
    current.netTransmis += line.netTransmis;
  });

  return Array.from(merged.values()).sort((a, b) => b.netTransmis - a.netTransmis);
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

function cloneAvAnalysis<TAnalysis extends SuccessionAvFiscalAnalysis>(analysis: TAnalysis): TAnalysis {
  return {
    ...analysis,
    lines: analysis.lines.map((line) => ({ ...line })),
    byAssure: {
      epoux1: {
        ...analysis.byAssure.epoux1,
        lines: analysis.byAssure.epoux1.lines.map((line) => ({ ...line })),
      },
      epoux2: {
        ...analysis.byAssure.epoux2,
        lines: analysis.byAssure.epoux2.lines.map((line) => ({ ...line })),
      },
    },
  };
}

function clonePrevoyanceAnalysis(
  analysis: SuccessionPrevoyanceFiscalAnalysis,
): SuccessionPrevoyanceFiscalAnalysis {
  return {
    ...analysis,
    lines: analysis.lines.map((line) => ({ ...line })),
    byAssure: {
      epoux1: {
        ...analysis.byAssure.epoux1,
        lines: analysis.byAssure.epoux1.lines.map((line) => ({ ...line })),
      },
      epoux2: {
        ...analysis.byAssure.epoux2,
        lines: analysis.byAssure.epoux2.lines.map((line) => ({ ...line })),
      },
    },
  };
}

function buildContributions(
  avAnalysis: SuccessionAvFiscalAnalysis,
  perAnalysis: SuccessionPerFiscalAnalysis,
  prevoyanceAnalysis: SuccessionPrevoyanceFiscalAnalysis,
  side: AssureSide,
): LineContribution[] {
  const avLines = avAnalysis.byAssure[side].lines.map((line) => ({
    id: line.id,
    lien: line.lien,
    isExempt: line.lien === 'conjoint',
    before70Base: line.capitauxAvant70,
    after70Base: line.capitauxApres70,
    allowance990IRatio: line.allowance990IRatio ?? 1,
    applyBefore70: (taxable: number, droits: number) => {
      line.taxable990I = taxable;
      line.droits990I = droits;
    },
    applyAfter70: (taxable: number, droits: number) => {
      line.taxable757B = taxable;
      line.droits757B = droits;
    },
  }));
  const perLines = perAnalysis.byAssure[side].lines.map((line) => ({
    id: line.id,
    lien: line.lien,
    isExempt: line.lien === 'conjoint',
    before70Base: line.capitauxAvant70,
    after70Base: line.capitauxApres70,
    allowance990IRatio: line.allowance990IRatio ?? 1,
    applyBefore70: (taxable: number, droits: number) => {
      line.taxable990I = taxable;
      line.droits990I = droits;
    },
    applyAfter70: (taxable: number, droits: number) => {
      line.taxable757B = taxable;
      line.droits757B = droits;
    },
  }));
  const prevoyanceLines = prevoyanceAnalysis.byAssure[side].lines.map((line) => ({
    id: line.id,
    lien: line.lien,
    isExempt: line.lien === 'conjoint',
    before70Base: line.capitauxAvant70,
    after70Base: line.capitauxApres70,
    allowance990IRatio: 1,
    applyBefore70: (taxable: number, droits: number) => {
      line.taxable990I = taxable;
      line.droits990I = droits;
    },
    applyAfter70: (taxable: number, droits: number) => {
      line.taxable757B = taxable;
      line.droits757B = droits;
    },
  }));

  return [...avLines, ...perLines, ...prevoyanceLines];
}

function applyCombined990I(
  contributions: LineContribution[],
  snapshot: SuccessionFiscalSnapshot,
): void {
  const byBeneficiary = new Map<string, LineContribution[]>();

  contributions
    .filter((contribution) => contribution.before70Base > 0)
    .forEach((contribution) => {
      const existing = byBeneficiary.get(contribution.id);
      if (existing) existing.push(contribution);
      else byBeneficiary.set(contribution.id, [contribution]);
    });

  byBeneficiary.forEach((entries) => {
    const totalBase = entries.reduce((sum, entry) => sum + entry.before70Base, 0);
    const isExempt = entries.some((entry) => entry.isExempt);
    if (isExempt || totalBase <= 0) {
      entries.forEach((entry) => entry.applyBefore70(0, 0));
      return;
    }

    const weightedRatio = totalBase > 0
      ? entries.reduce((sum, entry) => sum + entry.before70Base * entry.allowance990IRatio, 0) / totalBase
      : 1;
    const effectiveAllowance = snapshot.avDeces.primesApres1998.allowancePerBeneficiary
      * Math.max(0, Math.min(1, weightedRatio));
    const totalTaxable = Math.max(0, totalBase - effectiveAllowance);
    const taxableAllocations = allocateExact(totalTaxable, entries.map((entry) => entry.before70Base));
    const droitsAllocations = allocateRounded(
      compute990ITax(totalTaxable, snapshot),
      taxableAllocations,
    );

    entries.forEach((entry, index) => {
      entry.applyBefore70(taxableAllocations[index], droitsAllocations[index]);
    });
  });
}

function applyCombined757B(
  contributions: LineContribution[],
  snapshot: SuccessionFiscalSnapshot,
  estateAllowanceUsage?: EstateAllowanceUsage,
): void {
  const byBeneficiary = new Map<string, LineContribution[]>();

  contributions
    .filter((contribution) => contribution.after70Base > 0)
    .forEach((contribution) => {
      const existing = byBeneficiary.get(contribution.id);
      if (existing) existing.push(contribution);
      else byBeneficiary.set(contribution.id, [contribution]);
    });

  const taxableGrossByBeneficiary = Array.from(byBeneficiary.entries()).map(([id, entries]) => ({
    id,
    entries,
    totalBase: entries.reduce((sum, entry) => sum + entry.after70Base, 0),
    isExempt: entries.some((entry) => entry.isExempt),
    lien: entries[0]?.lien ?? 'autre',
  }));
  const totalTaxableGross = taxableGrossByBeneficiary.reduce(
    (sum, row) => sum + (row.isExempt ? 0 : row.totalBase),
    0,
  );

  taxableGrossByBeneficiary.forEach((row) => {
    if (row.isExempt || row.totalBase <= 0) {
      row.entries.forEach((entry) => entry.applyAfter70(0, 0));
      return;
    }

    const allowanceShare = totalTaxableGross > 0
      ? snapshot.avDeces.apres70ans.globalAllowance * (row.totalBase / totalTaxableGross)
      : 0;
    const totalTaxable = Math.max(0, row.totalBase - allowanceShare);
    const estateUsage = estateAllowanceUsage?.[row.id];
    const abattementResiduel = estateUsage != null ? estateUsage.abattementResiduel : undefined;
    const taxableAllocations = allocateExact(totalTaxable, row.entries.map((entry) => entry.after70Base));
    const droitsAllocations = allocateRounded(
      compute757BTax(totalTaxable, row.lien, snapshot, abattementResiduel),
      taxableAllocations,
    );

    row.entries.forEach((entry, index) => {
      entry.applyAfter70(taxableAllocations[index], droitsAllocations[index]);
    });
  });
}

function refreshAvLine(line: SuccessionAvFiscalLine): SuccessionAvFiscalLine {
  const gross = line.capitauxAvant70 + line.capitauxApres70;
  const totalDroits = line.droits990I + line.droits757B;
  return {
    ...line,
    totalDroits,
    netTransmis: Math.max(0, gross - totalDroits),
  };
}

function refreshPrevoyanceLine(line: SuccessionPrevoyanceFiscalLine): SuccessionPrevoyanceFiscalLine {
  const totalDroits = line.droits990I + line.droits757B;
  return {
    ...line,
    totalDroits,
    netTransmis: Math.max(0, line.capitalTransmis - totalDroits),
  };
}

function recomputeAvAnalysis<TAnalysis extends SuccessionAvFiscalAnalysis>(analysis: TAnalysis): TAnalysis {
  const epoux1Lines = analysis.byAssure.epoux1.lines.map(refreshAvLine);
  const epoux2Lines = analysis.byAssure.epoux2.lines.map(refreshAvLine);
  const epoux1Droits = epoux1Lines.reduce((sum, line) => sum + line.totalDroits, 0);
  const epoux2Droits = epoux2Lines.reduce((sum, line) => sum + line.totalDroits, 0);

  return {
    ...analysis,
    totalDroits: epoux1Droits + epoux2Droits,
    totalNetTransmis: Math.max(0, analysis.totalCapitauxDeces - epoux1Droits - epoux2Droits),
    lines: mergeAvLines(epoux1Lines, epoux2Lines),
    byAssure: {
      epoux1: {
        ...analysis.byAssure.epoux1,
        totalDroits: epoux1Droits,
        lines: epoux1Lines,
      },
      epoux2: {
        ...analysis.byAssure.epoux2,
        totalDroits: epoux2Droits,
        lines: epoux2Lines,
      },
    },
  };
}

function recomputePrevoyanceAnalysis(
  analysis: SuccessionPrevoyanceFiscalAnalysis,
): SuccessionPrevoyanceFiscalAnalysis {
  const epoux1Lines = analysis.byAssure.epoux1.lines.map(refreshPrevoyanceLine);
  const epoux2Lines = analysis.byAssure.epoux2.lines.map(refreshPrevoyanceLine);
  const epoux1Droits = epoux1Lines.reduce((sum, line) => sum + line.totalDroits, 0);
  const epoux2Droits = epoux2Lines.reduce((sum, line) => sum + line.totalDroits, 0);

  return {
    ...analysis,
    totalDroits: epoux1Droits + epoux2Droits,
    totalNetTransmis: Math.max(0, analysis.totalCapitalDeces - epoux1Droits - epoux2Droits),
    lines: mergePrevoyanceLines(epoux1Lines, epoux2Lines),
    byAssure: {
      epoux1: {
        ...analysis.byAssure.epoux1,
        totalDroits: epoux1Droits,
        lines: epoux1Lines,
      },
      epoux2: {
        ...analysis.byAssure.epoux2,
        totalDroits: epoux2Droits,
        lines: epoux2Lines,
      },
    },
  };
}

export function coordinateSuccessionInsuranceAllowances({
  avFiscalAnalysis,
  perFiscalAnalysis,
  prevoyanceFiscalAnalysis,
  fiscalSnapshot,
  estateAllowanceUsageBySide,
}: InsuranceCoordinationInput) {
  const adjustedAvAnalysis = cloneAvAnalysis(avFiscalAnalysis);
  const adjustedPerAnalysis = cloneAvAnalysis(perFiscalAnalysis);
  const adjustedPrevoyanceAnalysis = clonePrevoyanceAnalysis(prevoyanceFiscalAnalysis);

  ASSURE_SIDES.forEach((side) => {
    const contributions = buildContributions(
      adjustedAvAnalysis,
      adjustedPerAnalysis,
      adjustedPrevoyanceAnalysis,
      side,
    );
    applyCombined990I(contributions, fiscalSnapshot);
    applyCombined757B(contributions, fiscalSnapshot, estateAllowanceUsageBySide?.[side]);
  });

  return {
    avFiscalAnalysis: recomputeAvAnalysis(adjustedAvAnalysis),
    perFiscalAnalysis: recomputeAvAnalysis(adjustedPerAnalysis),
    prevoyanceFiscalAnalysis: recomputePrevoyanceAnalysis(adjustedPrevoyanceAnalysis),
  };
}
