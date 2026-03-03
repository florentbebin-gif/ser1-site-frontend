import type { RegimeMatrimonial } from '../../engine/civil';
import type { LienParente } from '../../engine/succession';
import type { PersistedSuccessionForm } from './useSuccessionCalc';

export type SituationMatrimoniale =
  | 'celibataire'
  | 'marie'
  | 'pacse'
  | 'concubinage'
  | 'divorce'
  | 'veuf';

export type PacsConvention = 'separation' | 'indivision';

export interface SuccessionCivilContext {
  situationMatrimoniale: SituationMatrimoniale;
  regimeMatrimonial: RegimeMatrimonial | null;
  pacsConvention: PacsConvention;
}

export interface SuccessionLiquidationContext {
  actifEpoux1: number;
  actifEpoux2: number;
  actifCommun: number;
  nbEnfants: number;
}

interface SuccessionDraftPayloadV2 {
  version: 2;
  form: PersistedSuccessionForm;
  civil: SuccessionCivilContext;
  liquidation: SuccessionLiquidationContext;
}

export const DEFAULT_SUCCESSION_CIVIL_CONTEXT: SuccessionCivilContext = {
  situationMatrimoniale: 'celibataire',
  regimeMatrimonial: null,
  pacsConvention: 'separation',
};

export const DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT: SuccessionLiquidationContext = {
  actifEpoux1: 0,
  actifEpoux2: 0,
  actifCommun: 0,
  nbEnfants: 1,
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function isLienParente(v: unknown): v is LienParente {
  return v === 'conjoint'
    || v === 'enfant'
    || v === 'petit_enfant'
    || v === 'frere_soeur'
    || v === 'neveu_niece'
    || v === 'autre';
}

function isSituation(v: unknown): v is SituationMatrimoniale {
  return v === 'celibataire'
    || v === 'marie'
    || v === 'pacse'
    || v === 'concubinage'
    || v === 'divorce'
    || v === 'veuf';
}

function isPacsConvention(v: unknown): v is PacsConvention {
  return v === 'separation' || v === 'indivision';
}

function isRegimeMatrimonial(v: unknown): v is RegimeMatrimonial {
  return v === 'communaute_legale'
    || v === 'communaute_universelle'
    || v === 'separation_biens'
    || v === 'participation_acquets'
    || v === 'communaute_meubles_acquets';
}

export function buildSuccessionDraftPayload(
  form: PersistedSuccessionForm,
  civil: SuccessionCivilContext,
  liquidation: SuccessionLiquidationContext,
): SuccessionDraftPayloadV2 {
  return {
    version: 2,
    form,
    civil,
    liquidation,
  };
}

function asAmount(v: unknown, fallback: number): number {
  const amount = Number(v);
  if (!Number.isFinite(amount)) return fallback;
  return Math.max(0, amount);
}

function asChildrenCount(v: unknown, fallback: number): number {
  const count = Number(v);
  if (!Number.isFinite(count)) return fallback;
  return Math.max(0, Math.floor(count));
}

export function parseSuccessionDraftPayload(raw: string): {
  form: PersistedSuccessionForm;
  civil: SuccessionCivilContext;
  liquidation: SuccessionLiquidationContext;
} | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isObject(parsed) || (parsed.version !== 1 && parsed.version !== 2)) return null;
    const payload = parsed as Record<string, unknown>;

    const formRaw = payload.form;
    if (!isObject(formRaw)) return null;
    const actifNetSuccession = Number(formRaw.actifNetSuccession);
    if (!Number.isFinite(actifNetSuccession) || actifNetSuccession < 0) return null;

    const heritiersRaw = Array.isArray(formRaw.heritiers) ? formRaw.heritiers : [];
    const heritiers = heritiersRaw
      .filter((h): h is Record<string, unknown> => isObject(h))
      .map((h) => ({
        lien: isLienParente(h.lien) ? h.lien : 'enfant',
        partSuccession: Number.isFinite(Number(h.partSuccession))
          ? Math.max(0, Number(h.partSuccession))
          : 0,
      }));

    const safeHeirs = heritiers.length > 0 ? heritiers : [{ lien: 'enfant' as const, partSuccession: 0 }];

    const civilRaw = isObject(payload.civil) ? payload.civil : {};
    const civil: SuccessionCivilContext = {
      situationMatrimoniale: isSituation(civilRaw.situationMatrimoniale)
        ? civilRaw.situationMatrimoniale
        : DEFAULT_SUCCESSION_CIVIL_CONTEXT.situationMatrimoniale,
      regimeMatrimonial: isRegimeMatrimonial(civilRaw.regimeMatrimonial)
        ? civilRaw.regimeMatrimonial
        : null,
      pacsConvention: isPacsConvention(civilRaw.pacsConvention)
        ? civilRaw.pacsConvention
        : DEFAULT_SUCCESSION_CIVIL_CONTEXT.pacsConvention,
    };

    const liquidationRaw = payload.version === 2 && isObject(payload.liquidation) ? payload.liquidation : {};
    const liquidation: SuccessionLiquidationContext = {
      actifEpoux1: asAmount(liquidationRaw.actifEpoux1, DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT.actifEpoux1),
      actifEpoux2: asAmount(liquidationRaw.actifEpoux2, DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT.actifEpoux2),
      actifCommun: asAmount(liquidationRaw.actifCommun, DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT.actifCommun),
      nbEnfants: asChildrenCount(liquidationRaw.nbEnfants, DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT.nbEnfants),
    };

    return {
      form: {
        actifNetSuccession,
        heritiers: safeHeirs,
      },
      civil,
      liquidation,
    };
  } catch {
    return null;
  }
}
