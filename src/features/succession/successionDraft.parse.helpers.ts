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
  isAssetCategory,
  isSuccessionAssetLegalNature,
  isSuccessionAssetOrigin,
  isAssetPocket,
  isAssuranceVieContractType,
  isDispositionTestamentaire,
  isDonationEntryType,
  isFamilyBranch,
  isFamilyMemberType,
  isGroupementFoncierType,
  isLienParente,
  isObject,
  isPersonParty,
  isSuccessionInterMassClaimKind,
  isSuccessionMeubleImmeubleLegal,
  isSuccessionPreciputSelectionSourceType,
  isSocieteAcquetsLiquidationMode,
  isSuccessionBeneficiaryRef,
  normalizeOptionalString,
} from './successionDraft.guards';
import { normalizeResidencePrincipaleAssetEntries } from './successionAssetValuation';
import { resolveSuccessionAssetLocation } from './successionPatrimonialModel';
import type {
  FamilyMember,
  GroupementFoncierType,
  ParsedSuccessionDraftPayload,
  PersistedHeritierRow,
  SuccessionAssetDetailEntry,
  SuccessionAssuranceVieEntry,
  SuccessionDonationEntry,
  SuccessionGroupementFoncierEntry,
  SuccessionInterMassClaim,
  SuccessionParticipationAcquetsConfig,
  SuccessionParticularLegacyEntry,
  SuccessionPerEntry,
  SuccessionPreciputSelection,
  SuccessionPrevoyanceDecesEntry,
  SuccessionSocieteAcquetsConfig,
  SuccessionTestamentConfig,
} from './successionDraft.types';

const DECES_DANS_X_ANS_VALUES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50] as const;

function normalizeQuotePair(
  quoteEpoux1Pct: number,
  quoteEpoux2Pct: number,
  fallback: Pick<SuccessionSocieteAcquetsConfig, 'quoteEpoux1Pct' | 'quoteEpoux2Pct'> =
    DEFAULT_SUCCESSION_SOCIETE_ACQUETS_CONFIG,
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

export function parseParticipationAcquetsConfig(raw: unknown): SuccessionParticipationAcquetsConfig {
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
    active: asBoolean(
      rawConfig.active,
      DEFAULT_SUCCESSION_PARTICIPATION_ACQUETS_CONFIG.active,
    ),
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
        !isSuccessionPreciputSelectionSourceType(item.sourceType)
        || typeof item.sourceId !== 'string'
        || item.sourceId.trim().length === 0
        || !isAssetPocket(item.pocket)
      ) {
        return null;
      }

      return {
        id: typeof item.id === 'string' && item.id.trim().length > 0
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
        !isSuccessionInterMassClaimKind(item.kind)
        || !isAssetPocket(item.fromPocket)
        || !isAssetPocket(item.toPocket)
      ) {
        return null;
      }

      const claim: SuccessionInterMassClaim = {
        id: typeof item.id === 'string' && item.id.trim().length > 0
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
      id: typeof item.id === 'string' && item.id.trim().length > 0 ? item.id.trim() : `leg-${idx + 1}`,
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

export function parsePersistedHeirs(rawHeritiers: unknown): PersistedHeritierRow[] {
  const heritiersRaw = Array.isArray(rawHeritiers) ? rawHeritiers : [];
  const heritiers = heritiersRaw
    .filter((heritier): heritier is Record<string, unknown> => isObject(heritier))
    .map((heritier) => ({
      lien: isLienParente(heritier.lien) ? heritier.lien : 'enfant',
      partSuccession: Number.isFinite(Number(heritier.partSuccession))
        ? Math.max(0, Number(heritier.partSuccession))
        : 0,
    }));

  return heritiers.length > 0 ? heritiers : [{ lien: 'enfant', partSuccession: 0 }];
}

export function parseFamilyMembers(rawFamilyMembers: unknown): FamilyMember[] {
  return (Array.isArray(rawFamilyMembers) ? rawFamilyMembers : [])
    .filter((item): item is Record<string, unknown> => isObject(item))
    .filter((item) => isFamilyMemberType(item.type))
    .map((item, idx) => ({
      id: typeof item.id === 'string' && item.id.trim().length > 0 ? item.id.trim() : `mbr-${idx}`,
      type: item.type as FamilyMember['type'],
      branch: isFamilyBranch(item.branch) ? item.branch : undefined,
      parentEnfantId: typeof item.parentEnfantId === 'string' ? item.parentEnfantId : undefined,
    }));
}

export function parseDonations(rawDonations: unknown): SuccessionDonationEntry[] {
  return (Array.isArray(rawDonations) ? rawDonations : [])
    .filter((item): item is Record<string, unknown> => isObject(item))
    .map((item, idx) => {
      if (!isDonationEntryType(item.type)) return null;

      const donation: SuccessionDonationEntry = {
        id: typeof item.id === 'string' && item.id.trim().length > 0 ? item.id.trim() : `don-${idx + 1}`,
        type: item.type,
        montant: asAmount(item.montant, 0),
      };

      const date = normalizeOptionalString(item.date);
      const donateur = normalizeOptionalString(item.donateur);
      const donataire = normalizeOptionalString(item.donataire);
      if (date) donation.date = date;
      if (donateur) donation.donateur = donateur;
      if (donataire) donation.donataire = donataire;

      const valeurDonation = asAmount(item.valeurDonation, -1);
      const valeurActuelle = asAmount(item.valeurActuelle, -1);
      if (valeurDonation >= 0) donation.valeurDonation = valeurDonation;
      if (valeurActuelle >= 0) donation.valeurActuelle = valeurActuelle;
      if (asBoolean(item.donSommeArgentExonere, false)) donation.donSommeArgentExonere = true;
      if (asBoolean(item.avecReserveUsufruit, false)) donation.avecReserveUsufruit = true;

      return donation;
    })
    .filter((item): item is SuccessionDonationEntry => item !== null);
}

export function parseAssetEntries(
  rawAssetEntries: unknown,
  civil: ParsedSuccessionDraftPayload['civil'],
): SuccessionAssetDetailEntry[] {
  const parsedEntries = (Array.isArray(rawAssetEntries) ? rawAssetEntries : [])
    .filter((item): item is Record<string, unknown> => isObject(item))
    .map((item, idx) => {
      const location = resolveSuccessionAssetLocation({
        owner: item.owner,
        pocket: item.pocket,
        situationMatrimoniale: civil.situationMatrimoniale,
        regimeMatrimonial: civil.regimeMatrimonial,
        pacsConvention: civil.pacsConvention,
      });
      if (!location || !isAssetCategory(item.category)) return null;

      const asset: SuccessionAssetDetailEntry = {
        id: typeof item.id === 'string' && item.id.trim().length > 0 ? item.id.trim() : `asset-${idx + 1}`,
        pocket: location.pocket,
        category: item.category,
        subCategory: normalizeOptionalString(item.subCategory) ?? 'Saisie libre',
        amount: asAmount(item.amount, 0),
      };

      const label = normalizeOptionalString(item.label);
      if (label) asset.label = label;
      asset.legalNature = isSuccessionAssetLegalNature(item.legalNature)
        ? item.legalNature
        : 'non_qualifie';
      asset.origin = isSuccessionAssetOrigin(item.origin)
        ? item.origin
        : 'non_precise';
      asset.meubleImmeubleLegal = isSuccessionMeubleImmeubleLegal(item.meubleImmeubleLegal)
        ? item.meubleImmeubleLegal
        : 'non_qualifie';
      const quotePartEpoux1Pct = asAmount(item.quotePartEpoux1Pct, -1);
      if (quotePartEpoux1Pct >= 0) asset.quotePartEpoux1Pct = quotePartEpoux1Pct;

      return asset;
    })
    .filter((item): item is SuccessionAssetDetailEntry => item !== null);

  return normalizeResidencePrincipaleAssetEntries(parsedEntries);
}

export function parseGroupementFoncierEntries(
  rawGroupementFoncierEntries: unknown,
  civil: ParsedSuccessionDraftPayload['civil'],
): SuccessionGroupementFoncierEntry[] {
  return (Array.isArray(rawGroupementFoncierEntries) ? rawGroupementFoncierEntries : [])
    .filter((item): item is Record<string, unknown> => isObject(item))
    .map((item, idx) => {
      const location = resolveSuccessionAssetLocation({
        owner: item.owner,
        pocket: item.pocket,
        situationMatrimoniale: civil.situationMatrimoniale,
        regimeMatrimonial: civil.regimeMatrimonial,
        pacsConvention: civil.pacsConvention,
      });
      if (!location || !isGroupementFoncierType(item.type)) return null;

      const entry: SuccessionGroupementFoncierEntry = {
        id: typeof item.id === 'string' && item.id.trim().length > 0 ? item.id.trim() : `gf-${idx + 1}`,
        type: item.type as GroupementFoncierType,
        pocket: location.pocket,
        valeurTotale: asAmount(item.valeurTotale, 0),
      };

      const label = normalizeOptionalString(item.label);
      if (label) entry.label = label;
      const quotePartEpoux1Pct = asAmount(item.quotePartEpoux1Pct, -1);
      if (quotePartEpoux1Pct >= 0) entry.quotePartEpoux1Pct = quotePartEpoux1Pct;

      return entry;
    })
    .filter((item): item is SuccessionGroupementFoncierEntry => item !== null);
}

export function parseAssuranceVieEntries(
  rawAssuranceVieEntries: unknown,
): SuccessionAssuranceVieEntry[] {
  return (Array.isArray(rawAssuranceVieEntries) ? rawAssuranceVieEntries : [])
    .filter((item): item is Record<string, unknown> => isObject(item))
    .map((item, idx) => {
      const souscripteur = item.souscripteur;
      const assure = item.assure;

      if (
        !isAssuranceVieContractType(item.typeContrat)
        || !isPersonParty(souscripteur)
        || !isPersonParty(assure)
      ) {
        return null;
      }

      const entry: SuccessionAssuranceVieEntry = {
        id: typeof item.id === 'string' && item.id.trim().length > 0 ? item.id.trim() : `av-${idx + 1}`,
        typeContrat: item.typeContrat,
        souscripteur,
        assure,
        capitauxDeces: asAmount(item.capitauxDeces, 0),
        versementsApres70: asAmount(item.versementsApres70, 0),
        versementsAvant13101998: asAmount(item.versementsAvant13101998, 0),
      };

      const clauseBeneficiaire = normalizeOptionalString(item.clauseBeneficiaire);
      if (clauseBeneficiaire) entry.clauseBeneficiaire = clauseBeneficiaire;

      const ageUsufruitier = Number(item.ageUsufruitier);
      if (Number.isFinite(ageUsufruitier) && ageUsufruitier > 0) {
        entry.ageUsufruitier = ageUsufruitier;
      }

      return entry;
    })
    .filter((item): item is SuccessionAssuranceVieEntry => item !== null);
}

export function parsePerEntries(rawPerEntries: unknown): SuccessionPerEntry[] {
  return (Array.isArray(rawPerEntries) ? rawPerEntries : [])
    .filter((item): item is Record<string, unknown> => isObject(item))
    .map((item, idx) => {
      const assure = item.assure;
      if (!isAssuranceVieContractType(item.typeContrat) || !isPersonParty(assure)) {
        return null;
      }

      const entry: SuccessionPerEntry = {
        id: typeof item.id === 'string' && item.id.trim().length > 0 ? item.id.trim() : `per-${idx + 1}`,
        typeContrat: item.typeContrat,
        assure,
        capitauxDeces: asAmount(item.capitauxDeces, 0),
      };

      const clauseBeneficiaire = normalizeOptionalString(item.clauseBeneficiaire);
      if (clauseBeneficiaire) entry.clauseBeneficiaire = clauseBeneficiaire;

      const ageUsufruitier = Number(item.ageUsufruitier);
      if (Number.isFinite(ageUsufruitier) && ageUsufruitier > 0) {
        entry.ageUsufruitier = ageUsufruitier;
      }

      return entry;
    })
    .filter((item): item is SuccessionPerEntry => item !== null);
}

export function parsePrevoyanceDecesEntries(
  rawPrevoyanceDecesEntries: unknown,
): SuccessionPrevoyanceDecesEntry[] {
  return (Array.isArray(rawPrevoyanceDecesEntries) ? rawPrevoyanceDecesEntries : [])
    .filter((item): item is Record<string, unknown> => isObject(item))
    .map((item, idx) => {
      const souscripteur = item.souscripteur;
      const assure = item.assure;
      if (!isPersonParty(souscripteur) || !isPersonParty(assure)) {
        return null;
      }

      const entry: SuccessionPrevoyanceDecesEntry = {
        id: typeof item.id === 'string' && item.id.trim().length > 0 ? item.id.trim() : `pv-${idx + 1}`,
        souscripteur,
        assure,
        capitalDeces: asAmount(item.capitalDeces, 0),
        dernierePrime: asAmount(item.dernierePrime, 0),
      };

      const clauseBeneficiaire = normalizeOptionalString(item.clauseBeneficiaire);
      return clauseBeneficiaire ? { ...entry, clauseBeneficiaire } : entry;
    })
    .filter((item): item is SuccessionPrevoyanceDecesEntry => item !== null);
}

export function parseDecesDansXAns(
  raw: unknown,
): typeof DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.decesDansXAns {
  return DECES_DANS_X_ANS_VALUES.includes(raw as (typeof DECES_DANS_X_ANS_VALUES)[number])
    ? raw as typeof DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.decesDansXAns
    : DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.decesDansXAns;
}
