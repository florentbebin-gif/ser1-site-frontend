import { computeAutoPartsWithChildren } from '../../utils/irEngine.js';

export function computeAbattement10(base, cfg) {
  if (!cfg || base <= 0) return 0;
  const plafond = Number(cfg.plafond) || 0;
  const plancher = Number(cfg.plancher) || 0;

  let val = base * 0.1;
  if (plafond > 0) val = Math.min(val, plafond);
  if (plancher > 0) val = Math.max(val, plancher);
  return val;
}

export function computeEffectiveParts({ status, isIsolated, children, manualParts }) {
  const baseParts = status === 'couple' ? 2 : 1;
  const computedParts = computeAutoPartsWithChildren({
    status,
    isIsolated,
    children: Array.isArray(children) ? children : [],
  });

  const effectiveParts = Math.max(
    baseParts,
    Math.round((computedParts + (Number(manualParts) || 0)) * 4) / 4,
  );

  return { baseParts, computedParts, effectiveParts };
}

export function computeExtraDeductions({
  status,
  realMode,
  realExpenses,
  abat10SalD1,
  abat10SalD2,
}) {
  return (
    (realMode?.d1 === 'reels'
      ? realExpenses?.d1 || 0
      : realMode?.d1 === 'abat10'
        ? abat10SalD1
        : 0) +
    (status === 'couple'
      ? realMode?.d2 === 'reels'
        ? realExpenses?.d2 || 0
        : realMode?.d2 === 'abat10'
          ? abat10SalD2
          : 0
      : 0)
  );
}

export function countPersonsACharge(children) {
  return Array.isArray(children)
    ? children.filter((c) => c && (c.mode === 'charge' || c.mode === 'shared')).length
    : 0;
}
