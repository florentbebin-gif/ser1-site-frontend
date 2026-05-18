export type InsuranceSourceKind = 'av' | 'per' | 'prevoyance';

export interface InsuranceBeneficiaryLine {
  id: string;
  label: string;
  capitalTransmis: number;
  baseFiscale: number;
  sourceKind: InsuranceSourceKind;
  totalDroits: number;
  netTransmis: number;
}

type FiscalLine = {
  id: string;
  label: string;
  capitauxAvant70: number;
  capitauxApres70: number;
  baseFiscale990I?: number;
  baseFiscale757B?: number;
  droits990I: number;
  droits757B: number;
  capitalTransmis?: number;
  sourceKind?: InsuranceSourceKind;
};

function aggregateByBeneficiary(
  lines: Array<{
    id: string;
    label: string;
    capitalTransmis: number;
    baseFiscale: number;
    sourceKind: InsuranceSourceKind;
    totalDroits: number;
  }>,
): InsuranceBeneficiaryLine[] {
  const map = new Map<string, InsuranceBeneficiaryLine>();
  for (const line of lines) {
    const current = map.get(line.id) ?? {
      id: line.id,
      label: line.label,
      capitalTransmis: 0,
      baseFiscale: 0,
      sourceKind: line.sourceKind,
      totalDroits: 0,
      netTransmis: 0,
    };
    current.capitalTransmis += line.capitalTransmis;
    current.baseFiscale += line.baseFiscale;
    current.totalDroits += line.totalDroits;
    current.netTransmis = Math.max(0, current.capitalTransmis - current.totalDroits);
    if (line.sourceKind === 'prevoyance') current.sourceKind = 'prevoyance';
    map.set(line.id, current);
  }
  return Array.from(map.values())
    .filter((l) => l.capitalTransmis > 0 || l.totalDroits > 0)
    .sort((a, b) => b.capitalTransmis - a.capitalTransmis || b.netTransmis - a.netTransmis);
}

export function mergeInsuranceBeneficiaryLines(
  avLines: FiscalLine[],
  perLines: FiscalLine[],
  prevoyanceLines: FiscalLine[],
): { lines990I: InsuranceBeneficiaryLine[]; lines757B: InsuranceBeneficiaryLine[] } {
  const taggedAv = avLines.map((l) => ({ ...l, sourceKind: 'av' as const }));
  const taggedPer = perLines.map((l) => ({ ...l, sourceKind: 'per' as const }));
  const taggedPrev = prevoyanceLines.map((l) => ({ ...l, sourceKind: 'prevoyance' as const }));
  const allLines = [...taggedAv, ...taggedPer, ...taggedPrev];

  const input990I = allLines.map((line) => ({
    id: line.id,
    label: line.label,
    // Prevoyance (capitalTransmis defini) : capital nominal si regime 990I (capitauxAvant70 > 0), sinon 0
    // AV/PER (capitalTransmis non defini) : juste la tranche avant 70
    capitalTransmis:
      line.capitalTransmis != null
        ? line.capitauxAvant70 > 0
          ? line.capitalTransmis
          : 0
        : line.capitauxAvant70,
    baseFiscale: line.baseFiscale990I ?? line.capitauxAvant70,
    sourceKind: line.sourceKind,
    totalDroits: line.droits990I,
  }));

  const input757B = allLines.map((line) => ({
    id: line.id,
    label: line.label,
    // Prevoyance (capitalTransmis defini) : capital nominal si regime 757B (capitauxApres70 > 0), sinon 0
    // AV/PER (capitalTransmis non defini) : juste la tranche apres 70 (0 pour un contrat purement avant 70)
    capitalTransmis:
      line.capitalTransmis != null
        ? line.capitauxApres70 > 0
          ? line.capitalTransmis
          : 0
        : line.capitauxApres70,
    baseFiscale: line.baseFiscale757B ?? line.capitauxApres70,
    sourceKind: line.sourceKind,
    totalDroits: line.droits757B,
  }));

  return {
    lines990I: aggregateByBeneficiary(input990I),
    lines757B: aggregateByBeneficiary(input757B),
  };
}
