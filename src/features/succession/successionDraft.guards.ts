import type { RegimeMatrimonial } from '../../engine/civil';
import type { LienParente } from '../../engine/succession';
import type { SuccessionPersonParty } from './successionPatrimonialModel';
import type {
  FamilyBranch,
  FamilyMemberType,
  PacsConvention,
  SituationMatrimoniale,
  SuccessionAssetCategory,
  SuccessionAssetOwner,
  SuccessionAssuranceVieContractType,
  SuccessionBeneficiaryRef,
  SuccessionChoixLegalConjointSansDDV,
  SuccessionDispositionTestamentaire,
  SuccessionDonationEntreEpouxOption,
  SuccessionDonationEntryType,
  SuccessionEnfantRattachement,
  SuccessionPrimarySide,
} from './successionDraft.types';

export function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export function isLienParente(v: unknown): v is LienParente {
  return v === 'conjoint'
    || v === 'enfant'
    || v === 'petit_enfant'
    || v === 'parent'
    || v === 'frere_soeur'
    || v === 'neveu_niece'
    || v === 'autre';
}

export function isSituation(v: unknown): v is SituationMatrimoniale {
  return v === 'celibataire'
    || v === 'marie'
    || v === 'pacse'
    || v === 'concubinage'
    || v === 'divorce'
    || v === 'veuf';
}

export function isPacsConvention(v: unknown): v is PacsConvention {
  return v === 'separation' || v === 'indivision';
}

export function isDispositionTestamentaire(v: unknown): v is SuccessionDispositionTestamentaire {
  return v === 'legs_universel'
    || v === 'legs_titre_universel'
    || v === 'legs_particulier';
}

export function isPrimarySide(v: unknown): v is SuccessionPrimarySide {
  return v === 'epoux1' || v === 'epoux2';
}

export function isPersonParty(v: unknown): v is SuccessionPersonParty {
  return isPrimarySide(v);
}

export function isSuccessionBeneficiaryRef(v: unknown): v is SuccessionBeneficiaryRef {
  return typeof v === 'string'
    && (
      v === 'principal:epoux1'
      || v === 'principal:epoux2'
      || v.startsWith('enfant:')
      || v.startsWith('family:')
    );
}

export function isDonationEntreEpouxOption(v: unknown): v is SuccessionDonationEntreEpouxOption {
  return v === 'usufruit_total'
    || v === 'pleine_propriete_quotite'
    || v === 'mixte'
    || v === 'pleine_propriete_totale';
}

export function isChoixLegalConjointSansDDV(v: unknown): v is Exclude<SuccessionChoixLegalConjointSansDDV, null> {
  return v === 'usufruit' || v === 'quart_pp';
}

export function isRegimeMatrimonial(v: unknown): v is RegimeMatrimonial {
  return v === 'communaute_legale'
    || v === 'communaute_universelle'
    || v === 'separation_biens'
    || v === 'participation_acquets'
    || v === 'communaute_meubles_acquets'
    || v === 'separation_biens_societe_acquets';
}

export function isFamilyMemberType(v: unknown): v is FamilyMemberType {
  return v === 'petit_enfant'
    || v === 'parent'
    || v === 'frere_soeur'
    || v === 'oncle_tante'
    || v === 'tierce_personne';
}

export function isFamilyBranch(v: unknown): v is FamilyBranch {
  return isPrimarySide(v);
}

export function isEnfantRattachement(v: unknown): v is SuccessionEnfantRattachement {
  return v === 'commun' || v === 'epoux1' || v === 'epoux2';
}

export function isDonationEntryType(v: unknown): v is SuccessionDonationEntryType {
  return v === 'rapportable' || v === 'hors_part' || v === 'legs_particulier';
}

export function isAssetOwner(v: unknown): v is SuccessionAssetOwner {
  return v === 'epoux1' || v === 'epoux2' || v === 'commun';
}

export function isAssetCategory(v: unknown): v is SuccessionAssetCategory {
  return v === 'immobilier'
    || v === 'financier'
    || v === 'professionnel'
    || v === 'divers'
    || v === 'passif';
}

export function isAssuranceVieContractType(v: unknown): v is SuccessionAssuranceVieContractType {
  return v === 'standard' || v === 'demembree' || v === 'personnalisee';
}

export function asAmount(v: unknown, fallback: number): number {
  const amount = Number(v);
  if (!Number.isFinite(amount)) return fallback;
  return Math.max(0, amount);
}

export function asChildrenCount(v: unknown, fallback: number): number {
  const count = Number(v);
  if (!Number.isFinite(count)) return fallback;
  return Math.max(0, Math.floor(count));
}

export function asPercent(v: unknown, fallback: number): number {
  const pct = Number(v);
  if (!Number.isFinite(pct)) return fallback;
  return Math.min(100, Math.max(0, pct));
}

export function asBoolean(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

export function normalizePrenom(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function normalizeOptionalString(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function normalizeOptionalDate(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const trimmed = v.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : undefined;
}
