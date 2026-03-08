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
export type SuccessionDispositionTestamentaire =
  | 'legs_universel'
  | 'legs_titre_universel'
  | 'legs_particulier';
export type SuccessionDonationEntreEpouxOption =
  | 'usufruit_total'
  | 'pleine_propriete_quotite'
  | 'mixte'
  | 'pleine_propriete_totale';

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

export interface SuccessionDevolutionContext {
  nbEnfantsNonCommuns: number;
  testamentActif: boolean;
  typeDispositionTestamentaire: SuccessionDispositionTestamentaire | null;
  quotePartLegsTitreUniverselPct: number;
  ascendantsSurvivants: boolean;
}

export interface SuccessionPatrimonialContext {
  donationsRapportables: number;
  donationsHorsPart: number;
  legsParticuliers: number;
  donationEntreEpouxActive: boolean;
  donationEntreEpouxOption: SuccessionDonationEntreEpouxOption;
  preciputMontant: number;
  attributionIntegrale: boolean;
  attributionBiensCommunsPct: number;
}

export type SuccessionEnfantRattachement = 'commun' | 'epoux1' | 'epoux2';

export interface SuccessionEnfant {
  id: string;
  prenom?: string;
  rattachement: SuccessionEnfantRattachement;
}

interface SuccessionDraftPayloadV8 {
  version: 8;
  form: PersistedSuccessionForm;
  civil: SuccessionCivilContext;
  liquidation: SuccessionLiquidationContext;
  devolution: SuccessionDevolutionContext;
  patrimonial: SuccessionPatrimonialContext;
  enfants: SuccessionEnfant[];
  familyMembers: FamilyMember[];
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
  nbEnfants: 0,
};

export const DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT: SuccessionDevolutionContext = {
  nbEnfantsNonCommuns: 0,
  testamentActif: false,
  typeDispositionTestamentaire: null,
  quotePartLegsTitreUniverselPct: 50,
  ascendantsSurvivants: false,
};

export const DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT: SuccessionPatrimonialContext = {
  donationsRapportables: 0,
  donationsHorsPart: 0,
  legsParticuliers: 0,
  donationEntreEpouxActive: false,
  donationEntreEpouxOption: 'usufruit_total',
  preciputMontant: 0,
  attributionIntegrale: false,
  attributionBiensCommunsPct: 50,
};

export const DEFAULT_SUCCESSION_ENFANTS_CONTEXT: SuccessionEnfant[] = [];

export type FamilyMemberType =
  | 'petit_enfant'
  | 'parent'
  | 'frere_soeur'
  | 'oncle_tante'
  | 'tierce_personne';

export type FamilyBranch = 'epoux1' | 'epoux2';

export interface FamilyMember {
  id: string;
  type: FamilyMemberType;
  branch?: FamilyBranch;      // requis pour parent, frere_soeur, oncle_tante
  parentEnfantId?: string;    // requis pour petit_enfant
}

export const DEFAULT_SUCCESSION_FAMILY_MEMBERS: FamilyMember[] = [];

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

function isDispositionTestamentaire(v: unknown): v is SuccessionDispositionTestamentaire {
  return v === 'legs_universel'
    || v === 'legs_titre_universel'
    || v === 'legs_particulier';
}

function isDonationEntreEpouxOption(v: unknown): v is SuccessionDonationEntreEpouxOption {
  return v === 'usufruit_total'
    || v === 'pleine_propriete_quotite'
    || v === 'mixte'
    || v === 'pleine_propriete_totale';
}

function isRegimeMatrimonial(v: unknown): v is RegimeMatrimonial {
  return v === 'communaute_legale'
    || v === 'communaute_universelle'
    || v === 'separation_biens'
    || v === 'participation_acquets'
    || v === 'communaute_meubles_acquets'
    || v === 'separation_biens_societe_acquets';
}

function isFamilyMemberType(v: unknown): v is FamilyMemberType {
  return v === 'petit_enfant'
    || v === 'parent'
    || v === 'frere_soeur'
    || v === 'oncle_tante'
    || v === 'tierce_personne';
}

function isFamilyBranch(v: unknown): v is FamilyBranch {
  return v === 'epoux1' || v === 'epoux2';
}

function isEnfantRattachement(v: unknown): v is SuccessionEnfantRattachement {
  return v === 'commun' || v === 'epoux1' || v === 'epoux2';
}

export function buildSuccessionDraftPayload(
  form: PersistedSuccessionForm,
  civil: SuccessionCivilContext,
  liquidation: SuccessionLiquidationContext,
  devolution: SuccessionDevolutionContext,
  patrimonial: SuccessionPatrimonialContext,
  enfants: SuccessionEnfant[],
  familyMembers: FamilyMember[],
): SuccessionDraftPayloadV8 {
  return {
    version: 8,
    form,
    civil,
    liquidation,
    devolution,
    patrimonial,
    enfants,
    familyMembers,
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

function asPercent(v: unknown, fallback: number): number {
  const pct = Number(v);
  if (!Number.isFinite(pct)) return fallback;
  return Math.min(100, Math.max(0, pct));
}

function asBoolean(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

function normalizePrenom(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function deriveLegacyEnfants(
  liquidation: SuccessionLiquidationContext,
  devolution: SuccessionDevolutionContext,
): SuccessionEnfant[] {
  const total = Math.max(0, Math.floor(liquidation.nbEnfants));
  const nonCommuns = Math.min(Math.max(0, Math.floor(devolution.nbEnfantsNonCommuns)), total);
  const communs = Math.max(0, total - nonCommuns);

  const enfants: SuccessionEnfant[] = [];
  for (let i = 0; i < communs; i += 1) {
    enfants.push({
      id: `E${enfants.length + 1}`,
      rattachement: 'commun',
    });
  }
  for (let i = 0; i < nonCommuns; i += 1) {
    enfants.push({
      id: `E${enfants.length + 1}`,
      rattachement: i % 2 === 0 ? 'epoux1' : 'epoux2',
    });
  }

  return enfants;
}

export function parseSuccessionDraftPayload(raw: string): {
  form: PersistedSuccessionForm;
  civil: SuccessionCivilContext;
  liquidation: SuccessionLiquidationContext;
  devolution: SuccessionDevolutionContext;
  patrimonial: SuccessionPatrimonialContext;
  enfants: SuccessionEnfant[];
  familyMembers: FamilyMember[];
} | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      !isObject(parsed)
      || (parsed.version !== 1
        && parsed.version !== 2
        && parsed.version !== 3
        && parsed.version !== 4
        && parsed.version !== 5
        && parsed.version !== 6
        && parsed.version !== 7
        && parsed.version !== 8)
    ) return null;
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

    const liquidationRaw = payload.version !== 1 && isObject(payload.liquidation) ? payload.liquidation : {};
    const liquidation: SuccessionLiquidationContext = {
      actifEpoux1: asAmount(liquidationRaw.actifEpoux1, DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT.actifEpoux1),
      actifEpoux2: asAmount(liquidationRaw.actifEpoux2, DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT.actifEpoux2),
      actifCommun: asAmount(liquidationRaw.actifCommun, DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT.actifCommun),
      nbEnfants: asChildrenCount(liquidationRaw.nbEnfants, DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT.nbEnfants),
    };

    const devolutionRaw = (payload.version === 3 || payload.version === 4 || payload.version === 5 || payload.version === 6 || payload.version === 7 || payload.version === 8) && isObject(payload.devolution)
      ? payload.devolution
      : {};
    const testamentActif = asBoolean(
      devolutionRaw.testamentActif,
      DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.testamentActif,
    );
    const parsedDisposition = isDispositionTestamentaire(devolutionRaw.typeDispositionTestamentaire)
      ? devolutionRaw.typeDispositionTestamentaire
      : DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.typeDispositionTestamentaire;
    const devolution: SuccessionDevolutionContext = {
      nbEnfantsNonCommuns: asChildrenCount(
        devolutionRaw.nbEnfantsNonCommuns,
        DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.nbEnfantsNonCommuns,
      ),
      testamentActif,
      typeDispositionTestamentaire: testamentActif ? (parsedDisposition ?? 'legs_universel') : null,
      quotePartLegsTitreUniverselPct: asPercent(
        devolutionRaw.quotePartLegsTitreUniverselPct,
        DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.quotePartLegsTitreUniverselPct,
      ),
      ascendantsSurvivants: asBoolean(
        devolutionRaw.ascendantsSurvivants,
        DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.ascendantsSurvivants,
      ),
    };

    const patrimonialRaw = (payload.version === 4 || payload.version === 5 || payload.version === 6 || payload.version === 7 || payload.version === 8) && isObject(payload.patrimonial)
      ? payload.patrimonial
      : {};
    const patrimonial: SuccessionPatrimonialContext = {
      donationsRapportables: asAmount(
        patrimonialRaw.donationsRapportables,
        DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.donationsRapportables,
      ),
      donationsHorsPart: asAmount(
        patrimonialRaw.donationsHorsPart,
        DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.donationsHorsPart,
      ),
      legsParticuliers: asAmount(
        patrimonialRaw.legsParticuliers,
        DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.legsParticuliers,
      ),
      donationEntreEpouxActive: asBoolean(
        patrimonialRaw.donationEntreEpouxActive,
        DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.donationEntreEpouxActive,
      ),
      donationEntreEpouxOption: isDonationEntreEpouxOption(patrimonialRaw.donationEntreEpouxOption)
        ? patrimonialRaw.donationEntreEpouxOption
        : DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.donationEntreEpouxOption,
      preciputMontant: asAmount(
        patrimonialRaw.preciputMontant,
        DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.preciputMontant,
      ),
      attributionIntegrale: asBoolean(
        patrimonialRaw.attributionIntegrale,
        DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.attributionIntegrale,
      ),
      attributionBiensCommunsPct: asPercent(
        patrimonialRaw.attributionBiensCommunsPct,
        // Migration v7→v8: si attributionIntegrale était true, forcer 100%
        asBoolean(patrimonialRaw.attributionIntegrale, false) ? 100 : DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.attributionBiensCommunsPct,
      ),
    };

    const enfantsRaw = (payload.version === 5 || payload.version === 6 || payload.version === 7 || payload.version === 8) && Array.isArray(payload.enfants)
      ? payload.enfants
      : null;
    const enfants = enfantsRaw
      ? enfantsRaw
        .filter((item): item is Record<string, unknown> => isObject(item))
        .map((item, idx) => ({
          id: typeof item.id === 'string' && item.id.trim().length > 0 ? item.id.trim() : `E${idx + 1}`,
          prenom: normalizePrenom(item.prenom),
          rattachement: isEnfantRattachement(item.rattachement) ? item.rattachement : 'commun',
        }))
      : deriveLegacyEnfants(liquidation, devolution);

    const familyMembersRaw = (payload.version === 7 || payload.version === 8) && Array.isArray(payload.familyMembers)
      ? payload.familyMembers
      : [];
    const familyMembers: FamilyMember[] = familyMembersRaw
      .filter((item): item is Record<string, unknown> => isObject(item))
      .filter((item) => isFamilyMemberType(item.type))
      .map((item, idx) => ({
        id: typeof item.id === 'string' && item.id.trim().length > 0 ? item.id.trim() : `mbr-${idx}`,
        type: item.type as FamilyMemberType,
        branch: isFamilyBranch(item.branch) ? item.branch : undefined,
        parentEnfantId: typeof item.parentEnfantId === 'string' ? item.parentEnfantId : undefined,
      }));

    return {
      form: {
        actifNetSuccession,
        heritiers: safeHeirs,
      },
      civil,
      liquidation,
      devolution,
      patrimonial,
      enfants,
      familyMembers,
    };
  } catch {
    return null;
  }
}
