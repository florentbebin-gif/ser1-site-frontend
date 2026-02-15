export function computeProgressiveTax(scale = [], taxablePerPart) {
  if (!Array.isArray(scale) || !scale.length || taxablePerPart <= 0) {
    return {
      taxPerPart: 0,
      tmiRate: 0,
      tmiBasePerPart: 0,
      tmiBracketTo: null,
      bracketsDetails: [],
    };
  }

  let tax = 0;
  let tmiRate = 0;
  let tmiBasePerPart = 0;
  let tmiBracketTo = null;
  const details = [];

  for (const br of scale) {
    const from = Number(br.from) || 0;
    const to = br.to == null ? null : Number(br.to);
    const rate = Number(br.rate) || 0;

    if (taxablePerPart <= from) {
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

    const upper = to == null ? taxablePerPart : Math.min(taxablePerPart, to);
    const base = Math.max(0, upper - from);
    const trancheTax = base * (rate / 100);

    tax += trancheTax;

    details.push({
      label: `De ${from.toLocaleString('fr-FR')}€ à ${
        to ? to.toLocaleString('fr-FR') + '€' : 'plus'
      }`,
      base,
      rate,
      tax: trancheTax,
    });

    if (base > 0) {
      tmiRate = rate;
      tmiBasePerPart = base;
      tmiBracketTo = to;
    }

    if (to == null || taxablePerPart <= to) break;
  }

  if (tax < 0) tax = 0;

  return {
    taxPerPart: tax,
    tmiRate,
    tmiBasePerPart,
    tmiBracketTo,
    bracketsDetails: details,
  };
}
