export function computeDecote({ isCouple, decoteYearCfg, irBrutFoyer }) {
  let decote = 0;

  const cfg = decoteYearCfg || {};

  const trigger = isCouple ? Number(cfg.triggerCouple || 0) : Number(cfg.triggerSingle || 0);
  const amount = isCouple ? Number(cfg.amountCouple || 0) : Number(cfg.amountSingle || 0);
  const ratePercent = Number(cfg.ratePercent || 0);

  const ir = Number(irBrutFoyer) || 0;

  if (trigger > 0 && amount > 0 && ir <= trigger) {
    const raw = amount - (ratePercent / 100) * ir;
    if (raw > 0) decote = raw;
  }

  if (decote > ir) decote = ir;

  return decote;
}
