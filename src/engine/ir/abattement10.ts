interface Abat10Cfg {
  plafond?: number | string | null;
  plancher?: number | string | null;
}

export function computeAbattement10(base: number, cfg: Abat10Cfg | null | undefined): number {
  if (!cfg || base <= 0) return 0;
  const plafond = Number(cfg.plafond) || 0;
  const plancher = Number(cfg.plancher) || 0;

  let val = base * 0.1;
  if (plafond > 0) val = Math.min(val, plafond);
  if (plancher > 0) val = Math.max(val, plancher);
  return val;
}
