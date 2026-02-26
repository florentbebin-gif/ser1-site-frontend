/**
 * Placement Formatters — Fonctions de formatage pour le simulateur de placement
 */

export const fmt = (n) => Math.round(n).toLocaleString('fr-FR');
export const euro = (n) => `${fmt(n)} €`;

export const shortEuro = (v) => {
  const n = Number(v) || 0;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M€`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} k€`;
  return `${n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`;
};

export function formatPercent(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '';
  const percent = value * 100;
  const decimals = Number.isInteger(percent) ? 0 : 2;
  return `${percent.toFixed(decimals)} %`;
}

export function formatDmtgRange(from, to) {
  const formatEuro = (val, fallback = 0) => {
    const numeric = typeof val === 'number' ? val : fallback;
    return `${numeric.toLocaleString('fr-FR')} €`;
  };
  const fromText = formatEuro(from, 0);
  const toText = typeof to === 'number' ? formatEuro(to, 0) : '∞';
  return `${fromText} → ${toText}`;
}

// ─── PS (prélèvements sociaux) formatters ────────────────────────────

export const formatPsApplicability = (ps) => (ps?.applicable ? 'Oui' : 'Non');
export const formatPsMontant = (ps, formatter) => (ps?.applicable ? formatter(ps.montant || 0) : '—');
export const formatPsNote = (ps) => ps?.note || '—';
export const getPsAssietteNumeric = (ps) => (ps?.applicable ? ps.assiette || 0 : 0);
export const getPsTauxNumeric = (ps) => (ps?.applicable && typeof ps?.taux === 'number' ? ps.taux : 0);
export const getPsMontantNumeric = (ps) => (ps?.applicable ? ps.montant || 0 : 0);
