import type { FiscalContext } from '@/hooks/useFiscalContext';

export type SimKpiReferenceKind = 'ir' | 'pfu' | 'dmtg' | 'is' | 'per' | 'ps';

function formatPercent(value: number | null | undefined): string {
  return typeof value === 'number'
    ? `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`
    : 'taux fiscal';
}

function formatEuro(value: number | null | undefined): string {
  return typeof value === 'number'
    ? `${Math.round(value).toLocaleString('fr-FR').replace(/\s/g, ' ')} €`
    : 'montant fiscal';
}

export function buildSimKpiReferenceLabel(
  kind: SimKpiReferenceKind,
  fiscalContext: FiscalContext,
): string {
  const tax = fiscalContext._raw_tax;
  const ps = fiscalContext._raw_ps;
  const fiscality = fiscalContext._raw_fiscality;
  const abat10RatePercent =
    typeof fiscalContext.abat10Rate === 'number' ? fiscalContext.abat10Rate * 100 : undefined;

  switch (kind) {
    case 'ir':
      return `Barème ${tax?.incomeTax?.currentYearLabel ?? 'IR'}`;
    case 'pfu':
      return `PFU IR ${formatPercent(tax?.pfu?.current?.rateIR ?? fiscalContext.pfuRateIR)} · PS ${formatPercent(
        ps?.patrimony?.current?.generalRate ?? fiscalContext.psRateGeneral,
      )}`;
    case 'dmtg':
      return `DMTG ligne directe · abattement ${formatEuro(
        tax?.dmtg?.ligneDirecte?.abattement ?? fiscalContext.dmtgAbattementEnfant,
      )}`;
    case 'is':
      return `IS ${formatPercent(
        tax?.corporateTax?.current?.normalRate ?? fiscalContext.corporateTax?.current?.normalRate,
      )} · taux réduit ${formatPercent(
        tax?.corporateTax?.current?.reducedRate ?? fiscalContext.corporateTax?.current?.reducedRate,
      )}`;
    case 'per':
      return `PER retraite · abattement pension ${formatPercent(
        fiscality?.perIndividuel?.rente?.pensionAbatementRatePercent ?? abat10RatePercent,
      )}`;
    case 'ps':
      return `PS ${ps?.labels?.currentYearLabel ?? 'année courante'} · patrimoine ${formatPercent(
        ps?.patrimony?.current?.generalRate,
      )}`;
  }
}
