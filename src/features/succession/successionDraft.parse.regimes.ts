import {
  DEFAULT_SUCCESSION_PARTICIPATION_ACQUETS_CONFIG,
  DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
  DEFAULT_SUCCESSION_SOCIETE_ACQUETS_CONFIG,
  DEFAULT_SUCCESSION_TESTAMENT_CONFIG,
} from './successionDraft.defaults';
import {
  asAmount,
  asBoolean,
  asPercent,
  isAssetPocket,
  isDispositionTestamentaire,
  isObject,
  isSocieteAcquetsLiquidationMode,
  isSuccessionBeneficiaryRef,
  isSuccessionInterMassClaimKind,
  isSuccessionPreciputSelectionSourceType,
  normalizeOptionalString,
} from './successionDraft.guards';
import type {
  ParsedSuccessionDraftPayload,
  SuccessionInterMassClaim,
  SuccessionParticipationAcquetsConfig,
  SuccessionParticularLegacyEntry,
  SuccessionPreciputSelection,
  SuccessionSocieteAcquetsConfig,
  SuccessionTestamentConfig,
} from './successionDraft.types';

const DECES_DANS_X_ANS_VALUES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50] as const;

function normalizeQuotePair(
  quoteEpoux1Pct: number,
  quoteEpoux2Pct: number,
  fallback: Pick<
    SuccessionSocieteAcquetsConfig,
    'quoteEpoux1Pct' | 'quoteEpoux2Pct'
  > = DEFAULT_SUCCESSION_SOCIETE_ACQUETS_CONFIG,
): Pick<SuccessionSocieteAcquetsConfig, 'quoteEpoux1Pct' | 'quoteEpoux2Pct'> {
  const total = quoteEpoux1Pct + quoteEpoux2Pct;
  if (total <= 0) {
    return {
      quoteEpoux1Pct: fallback.quoteEpoux1Pct,
      quoteEpoux2Pct: fallback.quoteEpoux2Pct,
    };
  }

  const normalizedEpoux1Pct = (quoteEpoux1Pct / total) * 100;
  const normalizedEpoux2Pct = Math.max(0, 100 - normalizedEpoux1Pct);
  return {
    quoteEpoux1Pct: normalizedEpoux1Pct,
    quoteEpoux2Pct: normalizedEpoux2Pct,
  };
}

export function parseParticipationAcquetsConfig(
  raw: unknown,
): SuccessionParticipationAcquetsConfig {
  const rawConfig = isObject(raw) ? raw : {};
  const normalizedQuotes = normalizeQuotePair(
    asPercent(
      rawConfig.quoteEpoux1Pct,
      DEFAULT_SUCCESSION_PARTICIPATION_ACQUETS_CONFIG.quoteEpoux1Pct,
    ),
    asPercent(
      rawConfig.quoteEpoux2Pct,
      DEFAULT_SUCCESSION_PARTICIPATION_ACQUETS_CONFIG.quoteEpoux2Pct,
    ),
    DEFAULT_SUCCESSION_PARTICIPATION_ACQUETS_CONFIG,
  );

  return {
    active: asBoolean(rawConfig.active, DEFAULT_SUCCESSION_PARTICIPATION_ACQUETS_CONFIG.active),
    useCurrentAssetsAsFinalPatrimony: asBoolean(
      rawConfig.useCurrentAssetsAsFinalPatrimony,
      DEFAULT_SUCCESSION_PARTICIPATION_ACQUETS_CONFIG.useCurrentAssetsAsFinalPatrimony,
    ),
    patrimoineOriginaireEpoux1: asAmount(
      rawConfig.patrimoineOriginaireEpoux1,
      DEFAULT_SUCCESSION_PARTICIPATION_ACQUETS_CONFIG.patrimoineOriginaireEpoux1,
    ),
    patrimoineOriginaireEpoux2: asAmount(
      rawConfig.patrimoineOriginaireEpoux2,
      DEFAULT_SUCCESSION_PARTICIPATION_ACQUETS_CONFIG.patrimoineOriginaireEpoux2,
    ),
    patrimoineFinalEpoux1: asAmount(
      rawConfig.patrimoineFinalEpoux1,
      DEFAULT_SUCCESSION_PARTICIPATION_ACQUETS_CONFIG.patrimoineFinalEpoux1,
    ),
    patrimoineFinalEpoux2: asAmount(
      rawConfig.patrimoineFinalEpoux2,
      DEFAULT_SUCCESSION_PARTICIPATION_ACQUETS_CONFIG.patrimoineFinalEpoux2,
    ),
    quoteEpoux1Pct: normalizedQuotes.quoteEpoux1Pct,
    quoteEpoux2Pct: normalizedQuotes.quoteEpoux2Pct,
  };
}

export function parseSocieteAcquetsConfig(
  raw: unknown,
  _version: number,
  _regimeMatrimonial: ParsedSuccessionDraftPayload['civil']['regimeMatrimonial'],
): SuccessionSocieteAcquetsConfig {
  const rawConfig = isObject(raw) ? raw : {};
  const rawQuoteEpoux1Pct = asPercent(
    rawConfig.quoteEpoux1Pct,
    DEFAULT_SUCCESSION_SOCIETE_ACQUETS_CONFIG.quoteEpoux1Pct,
  );
  const rawQuoteEpoux2Pct = asPercent(
    rawConfig.quoteEpoux2Pct,
    DEFAULT_SUCCESSION_SOCIETE_ACQUETS_CONFIG.quoteEpoux2Pct,
  );
  const normalizedQuotes = normalizeQuotePair(rawQuoteEpoux1Pct, rawQuoteEpoux2Pct);

  return {
    active: asBoolean(rawConfig.active, DEFAULT_SUCCESSION_SOCIETE_ACQUETS_CONFIG.active),
    liquidationMode: isSocieteAcquetsLiquidationMode(rawConfig.liquidationMode)
      ? rawConfig.liquidationMode
      : DEFAULT_SUCCESSION_SOCIETE_ACQUETS_CONFIG.liquidationMode,
    quoteEpoux1Pct: normalizedQuotes.quoteEpoux1Pct,
    quoteEpoux2Pct: normalizedQuotes.quoteEpoux2Pct,
    attributionSurvivantPct: asPercent(
      rawConfig.attributionSurvivantPct,
      DEFAULT_SUCCESSION_SOCIETE_ACQUETS_CONFIG.attributionSurvivantPct,
    ),
  };
}

export function parsePreciputSelections(raw: unknown): SuccessionPreciputSelection[] {
  return (Array.isArray(raw) ? raw : [])
    .filter((item): item is Record<string, unknown> => isObject(item))
    .map((item, idx) => {
      if (
        !isSuccessionPreciputSelectionSourceType(item.sourceType) ||
        typeof item.sourceId !== 'string' ||
        item.sourceId.trim().length === 0 ||
        !isAssetPocket(item.pocket)
      ) {
        return null;
      }

      return {
        id:
          typeof item.id === 'string' && item.id.trim().length > 0
            ? item.id.trim()
            : `prec-${idx + 1}`,
        sourceType: item.sourceType,
        sourceId: item.sourceId.trim(),
        labelSnapshot: normalizeOptionalString(item.labelSnapshot) ?? `Selection ${idx + 1}`,
        pocket: item.pocket,
        amount: asAmount(item.amount, 0),
        enabled: asBoolean(item.enabled, true),
      };
    })
    .filter((item): item is SuccessionPreciputSelection => item !== null);
}

export function parseInterMassClaims(raw: unknown): SuccessionInterMassClaim[] {
  return (Array.isArray(raw) ? raw : [])
    .filter((item): item is Record<string, unknown> => isObject(item))
    .map<SuccessionInterMassClaim | null>((item, idx) => {
      if (
        !isSuccessionInterMassClaimKind(item.kind) ||
        !isAssetPocket(item.fromPocket) ||
        !isAssetPocket(item.toPocket)
      ) {
        return null;
      }

      const claim: SuccessionInterMassClaim = {
        id:
          typeof item.id === 'string' && item.id.trim().length > 0
            ? item.id.trim()
            : `claim-${idx + 1}`,
        kind: item.kind,
        fromPocket: item.fromPocket,
        toPocket: item.toPocket,
        amount: asAmount(item.amount, 0),
        enabled: asBoolean(item.enabled, true),
      };

      const label = normalizeOptionalString(item.label);
      if (label) {
        claim.label = label;
      }

      return claim;
    })
    .filter((item): item is SuccessionInterMassClaim => item !== null);
}

export function parseTestamentConfig(raw: unknown): SuccessionTestamentConfig {
  if (!isObject(raw)) {
    return {
      ...DEFAULT_SUCCESSION_TESTAMENT_CONFIG,
      particularLegacies: [],
    };
  }

  const particularLegaciesRaw = Array.isArray(raw.particularLegacies) ? raw.particularLegacies : [];
  const particularLegacies: SuccessionParticularLegacyEntry[] = particularLegaciesRaw
    .filter((item): item is Record<string, unknown> => isObject(item))
    .map((item, idx) => ({
      id:
        typeof item.id === 'string' && item.id.trim().length > 0
          ? item.id.trim()
          : `leg-${idx + 1}`,
      beneficiaryRef: isSuccessionBeneficiaryRef(item.beneficiaryRef) ? item.beneficiaryRef : null,
      amount: asAmount(item.amount, 0),
      label: normalizeOptionalString(item.label),
    }));

  return {
    active: asBoolean(raw.active, DEFAULT_SUCCESSION_TESTAMENT_CONFIG.active),
    dispositionType: isDispositionTestamentaire(raw.dispositionType)
      ? raw.dispositionType
      : DEFAULT_SUCCESSION_TESTAMENT_CONFIG.dispositionType,
    beneficiaryRef: isSuccessionBeneficiaryRef(raw.beneficiaryRef)
      ? raw.beneficiaryRef
      : DEFAULT_SUCCESSION_TESTAMENT_CONFIG.beneficiaryRef,
    quotePartPct: asPercent(raw.quotePartPct, DEFAULT_SUCCESSION_TESTAMENT_CONFIG.quotePartPct),
    particularLegacies,
  };
}

export function parseDecesDansXAns(
  raw: unknown,
): typeof DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.decesDansXAns {
  return DECES_DANS_X_ANS_VALUES.includes(raw as (typeof DECES_DANS_X_ANS_VALUES)[number])
    ? (raw as typeof DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.decesDansXAns)
    : DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.decesDansXAns;
}
