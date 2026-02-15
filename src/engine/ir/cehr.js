export function computeCEHR(brackets = [], rfr) {
  if (!Array.isArray(brackets) || !brackets.length || rfr <= 0) {
    return { cehr: 0, cehrDetails: [] };
  }

  let cehr = 0;
  const details = [];

  for (const br of brackets) {
    const from = Number(br.from) || 0;
    const to = br.to == null ? null : Number(br.to);
    const rate = Number(br.rate) || 0;

    if (rfr <= from) {
      details.push({
        label: `De ${from.toLocaleString('fr-FR')}€ à ${
          to ? to.toLocaleString('fr-FR') + '€' : 'plus'
        }`,
        base: 0,
        rate,
        tax: 0,
      });
      continue;
    }

    const upper = to == null ? rfr : Math.min(rfr, to);
    const base = Math.max(0, upper - from);
    const t = base * (rate / 100);

    cehr += t;
    details.push({
      label: `De ${from.toLocaleString('fr-FR')}€ à ${
        to ? to.toLocaleString('fr-FR') + '€' : 'plus'
      }`,
      base,
      rate,
      tax: t,
    });

    if (to == null || rfr <= to) break;
  }

  return { cehr, cehrDetails: details };
}
