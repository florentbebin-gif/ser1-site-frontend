interface MergeableSuccessionAvFiscalLine {
  id: string;
  capitauxAvant70: number;
  capitauxApres70: number;
  baseFiscale990I?: number;
  baseFiscale757B?: number;
  taxable990I: number;
  droits990I: number;
  taxable757B: number;
  droits757B: number;
  totalDroits: number;
  netTransmis: number;
}

export function mergeSuccessionAvFiscalLines<T extends MergeableSuccessionAvFiscalLine>(
  epoux1Lines: T[],
  epoux2Lines: T[],
): T[] {
  const merged = new Map<string, T>();

  [...epoux1Lines, ...epoux2Lines].forEach((line) => {
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
