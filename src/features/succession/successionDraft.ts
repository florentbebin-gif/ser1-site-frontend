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

interface SuccessionDraftPayloadV1 {
  version: 1;
  form: PersistedSuccessionForm;
  civil: SuccessionCivilContext;
}

export const DEFAULT_SUCCESSION_CIVIL_CONTEXT: SuccessionCivilContext = {
  situationMatrimoniale: 'celibataire',
  regimeMatrimonial: null,
  pacsConvention: 'separation',
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
): SuccessionDraftPayloadV1 {
  return {
    version: 1,
    form,
    civil,
  };
}

export function parseSuccessionDraftPayload(raw: string): {
  form: PersistedSuccessionForm;
  civil: SuccessionCivilContext;
} | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isObject(parsed) || parsed.version !== 1) return null;

    const formRaw = parsed.form;
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

    const civilRaw = isObject(parsed.civil) ? parsed.civil : {};
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

    return {
      form: {
        actifNetSuccession,
        heritiers: safeHeirs,
      },
      civil,
    };
  } catch {
    return null;
  }
}
