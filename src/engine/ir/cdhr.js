export function computeCDHR(config, assiette, irRetenu, pfuIr, cehr, isCouple, personsAChargeCount) {
  if (!config || !Number.isFinite(assiette) || assiette <= 0) {
    return { cdhr: 0, cdhrDetails: null };
  }

  const rawRate = Number(config.minEffectiveRate);
  const minRate = !rawRate ? 0 : rawRate > 1 ? rawRate / 100 : rawRate;
  if (!minRate) return { cdhr: 0, cdhrDetails: null };

  const threshold = isCouple
    ? Number(config.thresholdCouple) || 500000
    : Number(config.thresholdSingle) || 250000;

  if (assiette <= threshold) return { cdhr: 0, cdhrDetails: null };

  const decoteMaxAssiette = isCouple
    ? Number(config.decoteMaxAssietteCouple) || 660000
    : Number(config.decoteMaxAssietteSingle) || 330000;

  const decoteSlope = Number(config.decoteSlopePercent);
  const slope = Number.isFinite(decoteSlope) && decoteSlope > 0 ? decoteSlope / 100 : 0.825;

  const termA_beforeDecote = minRate * assiette;

  let decoteApplied = 0;
  if (assiette <= decoteMaxAssiette) {
    const target = slope * Math.max(0, assiette - threshold);
    decoteApplied = Math.max(0, termA_beforeDecote - target);
  }

  const termA_afterDecote = Math.max(0, termA_beforeDecote - decoteApplied);

  const majCouple = isCouple ? Number(config.majorationCouple) || 12500 : 0;
  const majPerCharge = Number(config.majorationPerCharge) || 1500;
  const personsCount = Math.max(0, Number(personsAChargeCount) || 0);
  const majCharges = personsCount * majPerCharge;
  const majorations = majCouple + majCharges;

  const termB =
    (Number(irRetenu) || 0) +
    (Number(cehr) || 0) +
    (Number(pfuIr) || 0) +
    majorations;

  const cdhr = Math.max(0, termA_afterDecote - termB);

  return {
    cdhr,
    cdhrDetails: {
      assiette,
      threshold,
      minRatePercent: minRate * 100,
      decoteMaxAssiette,
      slopePercent: slope * 100,

      termA_beforeDecote,
      decoteApplied,
      termA_afterDecote,

      termB,
      irRetenu: Number(irRetenu) || 0,
      cehr: Number(cehr) || 0,
      pfuIr: Number(pfuIr) || 0,
      majorations,
      majCouple,
      majCharges,
      personsAChargeCount: personsCount,
    },
  };
}
