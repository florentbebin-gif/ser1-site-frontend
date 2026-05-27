export function euro(n: number): string {
  return `${Math.round(n).toLocaleString('fr-FR')} €`;
}

export function pct(n: number, decimals: number = 2): string {
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} %`;
}

export function formatDuree(mois: number): string {
  const ans = Math.floor(mois / 12);
  const moisRestants = mois % 12;
  if (moisRestants === 0) {
    return `${ans} an${ans > 1 ? 's' : ''}`;
  }
  return `${ans} an${ans > 1 ? 's' : ''} ${moisRestants} mois`;
}

export function ymToDisplay(ym: string | undefined): string {
  const d = ym ? new Date(ym + '-01') : new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${m}/${d.getFullYear()}`;
}

export function ymEnd(startYM: string | undefined, dureeMois: number): string {
  const d = startYM ? new Date(startYM + '-01') : new Date();
  d.setMonth(d.getMonth() + dureeMois);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${m}/${d.getFullYear()}`;
}

export function fmtEuroShort(n: number): string {
  if (n >= 1000) return `${Math.round(n / 1000)} K€`;
  return `${Math.round(n)} €`;
}
