/**
 * Placement formatters.
 */

type NumericLike = number | string | null | undefined;

export interface PsDisplayData {
  applicable?: boolean | null;
  assiette?: number | null;
  taux?: number | null;
  montant?: number | null;
  note?: string | null;
}

export const fmt = (n: NumericLike): string => Math.round(Number(n)).toLocaleString('fr-FR');

export const euro = (n: NumericLike): string => `${fmt(n)} €`;

export const shortEuro = (v: NumericLike): string => {
  const n = Number(v) || 0;
  if (Math.abs(n) >= 1_000_000) {
    return `${(n / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M€`;
  }
  if (Math.abs(n) >= 1_000) {
    return `${(n / 1_000).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} k€`;
  }
  return `${n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`;
};

export function formatPercent(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '';
  const percent = value * 100;
  const decimals = Number.isInteger(percent) ? 0 : 2;
  return `${percent.toFixed(decimals)} %`;
}

export function formatDmtgRange(
  from: number | null | undefined,
  to: number | null | undefined,
): string {
  const formatEuro = (val: number | null | undefined, fallback = 0): string => {
    const numeric = typeof val === 'number' ? val : fallback;
    return `${numeric.toLocaleString('fr-FR')} €`;
  };
  const fromText = formatEuro(from, 0);
  const toText = typeof to === 'number' ? formatEuro(to, 0) : '∞';
  return `${fromText} → ${toText}`;
}

export const formatPsApplicability = (ps?: PsDisplayData | null): string =>
  ps?.applicable ? 'Oui' : 'Non';

export const formatPsMontant = (
  ps: PsDisplayData | null | undefined,
  formatter: (_value: number) => string,
): string => (ps?.applicable ? formatter(ps.montant || 0) : '—');

export const formatPsNote = (ps?: PsDisplayData | null): string => ps?.note || '—';

export const getPsAssietteNumeric = (ps?: PsDisplayData | null): number =>
  ps?.applicable ? ps.assiette || 0 : 0;

export const getPsTauxNumeric = (ps?: PsDisplayData | null): number =>
  ps?.applicable && typeof ps.taux === 'number' ? ps.taux : 0;

export const getPsMontantNumeric = (ps?: PsDisplayData | null): number =>
  ps?.applicable ? ps.montant || 0 : 0;
